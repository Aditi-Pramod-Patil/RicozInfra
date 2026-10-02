import { getRedisClient } from '../queue/redisStream.js';
import { RunbooksRepository } from '../db/runbooksRepository.js';
import { RunbookEngine } from './runbookEngine.js';
import type { IncidentEvent } from './types.js';

export const INCIDENTS_STREAM_KEY = 'stream:incidents:created';
export const RUNBOOK_CONSUMER_GROUP = 'group:runbook-remediation';
export const CONSUMER_NAME = `runbook-worker-${Math.random().toString(36).substring(2, 7)}`;

export class RunbookWorker {
  private isRunning = false;
  private pollTimer: NodeJS.Timeout | null = null;

  /**
   * Start the incident consumer loop
   */
  public async start(): Promise<void> {
    this.isRunning = true;
    console.log(`[RunbookWorker] Initializing incident listener on stream '${INCIDENTS_STREAM_KEY}'...`);

    // Ensure consumer group exists
    await this.initIncidentConsumerGroup().catch((e) => {
      console.warn(`[RunbookWorker] Consumer group init notice: ${(e as Error).message}`);
    });

    this.runLoop().catch((err) => {
      console.error('[RunbookWorker] Fatal error in consumer loop:', err);
    });
  }

  /**
   * Stop worker gracefully
   */
  public stop(): void {
    this.isRunning = false;
    if (this.pollTimer) clearTimeout(this.pollTimer);
    console.log('[RunbookWorker] Remediation worker stopped.');
  }

  /**
   * Idempotently create consumer group for incidents stream
   */
  private async initIncidentConsumerGroup(): Promise<void> {
    const redis = getRedisClient();
    try {
      if (redis.status !== 'ready') {
        await redis.connect().catch(() => {});
      }
      await redis.xgroup(
        'CREATE',
        INCIDENTS_STREAM_KEY,
        RUNBOOK_CONSUMER_GROUP,
        '$',
        'MKSTREAM'
      );
      console.log(`[RunbookWorker] Created consumer group '${RUNBOOK_CONSUMER_GROUP}' on '${INCIDENTS_STREAM_KEY}'`);
    } catch (err) {
      const msg = (err as Error).message;
      if (!msg.includes('BUSYGROUP')) {
        // Only log if not already created
        console.warn(`[RunbookWorker] Notice during group init: ${msg}`);
      }
    }
  }

  /**
   * Main non-blocking polling loop
   */
  private async runLoop(): Promise<void> {
    const redis = getRedisClient();

    while (this.isRunning) {
      try {
        if (redis.status !== 'ready') {
          await redis.connect().catch(() => {});
          await this.sleep(2000);
          continue;
        }

        // XREADGROUP GROUP group:runbook-remediation runbook-worker-1 BLOCK 2000 COUNT 5 STREAMS stream:incidents:created >
        const results = await redis.xreadgroup(
          'GROUP',
          RUNBOOK_CONSUMER_GROUP,
          CONSUMER_NAME,
          'COUNT',
          5,
          'BLOCK',
          2000,
          'STREAMS',
          INCIDENTS_STREAM_KEY,
          '>'
        );

        if (!results || results.length === 0) {
          continue;
        }

        for (const [, messages] of results) {
          for (const [messageId, fields] of messages) {
            try {
              let incident: IncidentEvent | null = null;
              for (let i = 0; i < fields.length; i += 2) {
                if (fields[i] === 'payload') {
                  incident = JSON.parse(fields[i + 1]);
                  break;
                }
              }

              if (incident) {
                await this.processIncident(incident);
              }

              // Acknowledge processed message
              await redis.xack(INCIDENTS_STREAM_KEY, RUNBOOK_CONSUMER_GROUP, messageId);
            } catch (err) {
              console.error(`[RunbookWorker] Error processing incident message ${messageId}:`, err);
            }
          }
        }
      } catch (err) {
        // Backoff if Redis connection dropped or offline
        await this.sleep(3000);
      }
    }
  }

  /**
   * Process a single synthesized incident: match rules and trigger remediation
   */
  public async processIncident(incident: IncidentEvent): Promise<void> {
    console.log(`\n⚡ [RunbookWorker] New Incident Detected: #${incident.id} [${incident.severity}] on ${incident.target_host}`);
    console.log(`   Title: ${incident.title}`);

    const activeRules = await RunbooksRepository.getActiveRules();
    const matchedRule = RunbookEngine.findMatchingRule(incident, activeRules);

    if (!matchedRule) {
      console.log(`   ℹ️ No active automation rule matched incident criteria. Skipping automated remediation.`);
      return;
    }

    console.log(`   🎯 Matched Rule: "${matchedRule.name}" (Action steps: ${matchedRule.action_chain.length})`);
    // Run asynchronous execution without blocking message loop
    RunbookEngine.executeRemediation(incident, matchedRule).catch((err) => {
      console.error(`[RunbookWorker] Execution error for incident #${incident.id}:`, err);
    });
  }

  /**
   * Manually emit an incident into the stream for triggering
   */
  public static async emitIncidentEvent(incident: IncidentEvent): Promise<void> {
    const redis = getRedisClient();
    try {
      if (redis.status !== 'ready') {
        await redis.connect().catch(() => {});
      }
      await redis.xadd(
        INCIDENTS_STREAM_KEY,
        'MAXLEN',
        '~',
        10000,
        '*',
        'payload',
        JSON.stringify(incident)
      );
    } catch {
      // If Redis is not running locally, execute directly via RunbookEngine for resilience
      const activeRules = await RunbooksRepository.getActiveRules();
      const matchedRule = RunbookEngine.findMatchingRule(incident, activeRules);
      if (matchedRule) {
        RunbookEngine.executeRemediation(incident, matchedRule).catch(console.error);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
