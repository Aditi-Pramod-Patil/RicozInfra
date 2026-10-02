import { getRedisClient, initConsumerGroup } from '../queue/redisStream.js';
import { bulkInsertSystemMetrics } from '../db/clickhouse.js';
import {
  getActiveAlertRules,
  evaluateRuleCondition,
  recordIncidentTrigger,
  updateHostHeartbeat,
} from '../db/postgres.js';
import { config } from '../config.js';
import type { ClickHouseSystemMetricRow, TelemetryPacket } from '../types/telemetry.js';

// Stateful tracker for alert rule breaches across time windows (host_id + rule_id -> consecutive breach seconds)
const breachTracker = new Map<string, { count: number; firstBreachTime: number; alerted: boolean }>();

export class TelemetryWorker {
  private isRunning = false;
  private consumerId: string;
  private pollTimer: NodeJS.Timeout | null = null;

  constructor(consumerId = `consumer-${process.pid}-${Math.floor(Math.random() * 1000)}`) {
    this.consumerId = consumerId;
  }

  /**
   * Start background ingestion worker loop
   */
  public async start(): Promise<void> {
    this.isRunning = true;
    console.log(`[TelemetryWorker] Initializing worker ${this.consumerId}...`);

    await initConsumerGroup();

    console.log(
      `[TelemetryWorker] Worker ${this.consumerId} active. Batch size: ${config.clickhouse.batchSize}, Interval: ${config.clickhouse.flushIntervalMs}ms`
    );

    this.runLoop();
  }

  /**
   * Continuous read-evaluate-insert loop
   */
  private async runLoop(): Promise<void> {
    const redis = getRedisClient();

    while (this.isRunning) {
      try {
        if ((redis.status as string) !== 'ready') {
          await redis.connect().catch(() => {});
          if ((redis.status as string) !== 'ready') {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            continue;
          }
        }

        // Read batch from Redis Stream using consumer group
        // XREADGROUP GROUP group:telemetry:processors consumer-xyz COUNT 2000 BLOCK 500 STREAMS stream:telemetry:raw >
        const results = await redis.xreadgroup(
          'GROUP',
          config.redis.consumerGroup,
          this.consumerId,
          'COUNT',
          config.clickhouse.batchSize,
          'BLOCK',
          config.clickhouse.flushIntervalMs,
          'STREAMS',
          config.redis.streamKey,
          '>'
        );

        if (!results || results.length === 0) {
          continue;
        }

        const [, messages] = results[0] as [string, Array<[string, string[]]>];
        if (!messages || messages.length === 0) {
          continue;
        }

        const messageIds: string[] = [];
        const clickHouseRows: ClickHouseSystemMetricRow[] = [];
        const parsedPackets: TelemetryPacket[] = [];

        // Parse stream entries
        for (const [id, fields] of messages) {
          messageIds.push(id);

          // Find payload field
          const payloadIndex = fields.indexOf('payload');
          if (payloadIndex !== -1 && fields[payloadIndex + 1]) {
            try {
              const packet: TelemetryPacket = JSON.parse(fields[payloadIndex + 1]);
              parsedPackets.push(packet);

              // Map to ClickHouse columnar row
              clickHouseRows.push({
                timestamp: packet.timestamp,
                host_id: packet.host_id,
                hostname: packet.hostname,
                cluster: packet.cluster,
                role: packet.role,
                cpu_utilization: packet.metrics.cpu_utilization,
                memory_pressure_pct: packet.metrics.memory_pressure_pct ?? (packet.metrics.memory_used_bytes && packet.metrics.memory_total_bytes ? Number(((packet.metrics.memory_used_bytes / packet.metrics.memory_total_bytes) * 100).toFixed(1)) : 52.4),
                disk_read_mb: packet.metrics.disk_read_mb ?? (packet.metrics.disk_read_bytes ? Number((packet.metrics.disk_read_bytes / 1048576).toFixed(1)) : 16.5),
                packet_loss_pct: packet.metrics.packet_loss_pct,
                rtt_ms: packet.metrics.rtt_ms,
                active_sockets: packet.metrics.active_sockets,
              });
            } catch (parseErr) {
              console.warn(`[TelemetryWorker] Skipped malformed packet ${id}:`, (parseErr as Error).message);
            }
          }
        }

        // 1. Bulk insert into ClickHouse
        if (clickHouseRows.length > 0) {
          const { insertedCount, durationMs } = await bulkInsertSystemMetrics(clickHouseRows);
          if (insertedCount > 0) {
            console.log(
              `[TelemetryWorker] Bulk inserted ${insertedCount} metrics into ClickHouse in ${durationMs}ms`
            );
          }
        }

        // 2. Evaluate Alert Rules in PostgreSQL
        if (parsedPackets.length > 0) {
          await this.evaluateAlertRules(parsedPackets);
        }

        // 3. Acknowledge messages in Redis Stream to advance consumer offset
        if (messageIds.length > 0) {
          await redis.xack(config.redis.streamKey, config.redis.consumerGroup, ...messageIds);
        }
      } catch (err) {
        console.warn('[TelemetryWorker] Processing paused (waiting for Redis Stream):', (err as Error).message);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Evaluate telemetry packets against active alert rules stored in PostgreSQL
   */
  private async evaluateAlertRules(packets: TelemetryPacket[]): Promise<void> {
    const rules = await getActiveAlertRules();
    const now = Date.now();

    for (const packet of packets) {
      let isHostDegraded = false;

      for (const rule of rules) {
        // Filter rules targeting this host's role
        if (rule.target_role !== packet.role && rule.target_role !== 'ALL') {
          continue;
        }

        const metricValue = packet.metrics[rule.metric_name];
        if (typeof metricValue !== 'number') continue;

        const isBreached = evaluateRuleCondition(metricValue, rule.condition, rule.threshold);
        const trackerKey = `${packet.host_id}:${rule.id}`;
        const tracker = breachTracker.get(trackerKey);

        if (isBreached) {
          isHostDegraded = true;

          if (!tracker) {
            // First breach detected
            breachTracker.set(trackerKey, { count: 1, firstBreachTime: now, alerted: false });
          } else {
            tracker.count += 1;
            const breachDurationSec = (now - tracker.firstBreachTime) / 1000;

            // Trigger alert if condition has persisted longer than duration_seconds
            if (breachDurationSec >= rule.duration_seconds && !tracker.alerted) {
              tracker.alerted = true;
              console.warn(
                `[AlertTriggered] Rule '${rule.name}' triggered on ${packet.hostname}: ${rule.metric_name}=${metricValue} for ${Math.round(breachDurationSec)}s (Threshold: ${rule.condition} ${rule.threshold})`
              );
              await recordIncidentTrigger(rule, packet.host_id, packet.hostname, metricValue);
            }
          }
        } else {
          // Normalized: reset breach window if previously tracked
          if (tracker) {
            breachTracker.delete(trackerKey);
          }
        }
      }

      // Update host heartbeat in PostgreSQL metadata table
      const hostStatus = isHostDegraded ? 'degraded' : 'nominal';
      await updateHostHeartbeat(
        packet.host_id,
        packet.hostname,
        packet.cluster,
        packet.role,
        hostStatus
      );
    }
  }

  /**
   * Graceful stop
   */
  public stop(): void {
    this.isRunning = false;
    if (this.pollTimer) clearTimeout(this.pollTimer);
    console.log(`[TelemetryWorker] Worker ${this.consumerId} stopped.`);
  }
}

// Standalone execution entrypoint if run directly
if (process.argv[1]?.endsWith('telemetryWorker.ts')) {
  const worker = new TelemetryWorker();
  worker.start().catch((err) => {
    console.error('[TelemetryWorker] Fatal error:', err);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    worker.stop();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    worker.stop();
    process.exit(0);
  });
}
