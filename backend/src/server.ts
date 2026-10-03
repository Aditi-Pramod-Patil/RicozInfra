import zlib from 'zlib';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyWebsocket from '@fastify/websocket';
import { config } from './config.js';
import { TelemetryBatchSchema, type TelemetryPacket } from './types/telemetry.js';
import { pushTelemetryToStream, pingRedis, initConsumerGroup } from './queue/redisStream.js';
import { pingClickHouse } from './db/clickhouse.js';
import { pingPostgres } from './db/postgres.js';
import { WebSocketDispatcher } from './ws/dispatcher.js';
import { TelemetryWorker } from './workers/telemetryWorker.js';
import { NodeRegistry } from './registry/nodeRegistry.js';
import { RunbooksRepository } from './db/runbooksRepository.js';
import { RunbookWorker } from './runbooks/runbookWorker.js';
import { RunbookEngine } from './runbooks/runbookEngine.js';
import type { IncidentEvent } from './runbooks/types.js';

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
    // High-concurrency throughput optimizations:
    bodyLimit: 15 * 1024 * 1024, // 15MB buffer for large compressed batches
    keepAliveTimeout: 65000,
    connectionTimeout: 10000,
  });

  // Transparent gzip decompression for incoming compressed agent telemetry
  app.addHook('preParsing', async (request, _reply, payload) => {
    if (request.headers['content-encoding'] === 'gzip') {
      return payload.pipe(zlib.createGunzip());
    }
    return payload;
  });

  // 1. CORS plugin
  await app.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  // 2. High-throughput rate limiter (50,000 req/min for agent bursts)
  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
    allowList: ['127.0.0.1', 'localhost'],
  });

  // 3. WebSocket plugin
  await app.register(fastifyWebsocket, {
    options: {
      maxPayload: 1048576, // 1MB frame limit
    },
  });

  // Instantiate WebSocket Dispatcher
  const wsDispatcher = new WebSocketDispatcher();

  // ---------------------------------------------------------------------------
  // ROUTES
  // ---------------------------------------------------------------------------

  /**
   * High-Throughput Telemetry Ingestion Endpoint
   * POST /api/v1/telemetry/ingest
   * Validates incoming agent payload via Zod and updates the in-memory active node registry.
   */
  app.post('/api/v1/telemetry/ingest', async (request, reply) => {
    const parseResult = TelemetryBatchSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid Telemetry Schema',
        details: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const data = parseResult.data;
    const packets: TelemetryPacket[] = Array.isArray(data) ? data : [data];

    // 1. Update in-memory active node registry (TTL: 15s)
    const registry = NodeRegistry.getInstance();
    for (const packet of packets) {
      registry.recordTelemetry(packet);
    }

    // 2. Buffer to Redis Stream asynchronously (if available)
    pushTelemetryToStream(packets).catch((err) => {
      request.log.debug(`[Redis] Stream buffer skipped: ${(err as Error).message}`);
    });

    return reply.status(202).send({
      status: 'accepted',
      ingested_count: packets.length,
      active_nodes: registry.getActiveNodes().length,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Live Real-Time WebSocket Streaming Endpoint
   * GET /ws/telemetry/live
   */
  app.get('/ws/telemetry/live', { websocket: true }, (connection) => {
    wsDispatcher.registerClient(connection);
  });

  /**
   * Health & Readiness Check Endpoint
   * GET /api/v1/telemetry/health
   */
  app.get('/api/v1/telemetry/health', async (_request, reply) => {
    const [redisHealthy, clickhouseHealthy, postgresHealthy] = await Promise.all([
      pingRedis(),
      pingClickHouse(),
      pingPostgres(),
    ]);

    const isSystemNominal = redisHealthy;

    const healthStatus = {
      status: isSystemNominal ? 'nominal' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      components: {
        ingestion_api: 'healthy',
        redis_stream_buffer: redisHealthy ? 'healthy' : 'disconnected',
        clickhouse_store: clickhouseHealthy ? 'healthy' : 'warming_up',
        postgres_metadata: postgresHealthy ? 'healthy' : 'warming_up',
      },
      ws_connected_clients: wsDispatcher.getConnectedClientCount(),
    };

    return reply.status(isSystemNominal ? 200 : 503).send(healthStatus);
  });

  // ---------------------------------------------------------------------------
  // RUNBOOK & SELF-HEALING ENGINE ROUTES
  // ---------------------------------------------------------------------------

  /**
   * List all runbook automation rules
   * GET /api/v1/runbooks/rules
   */
  app.get('/api/v1/runbooks/rules', async () => {
    const rules = await RunbooksRepository.getAllRules();
    return { rules };
  });

  /**
   * Toggle rule active state
   * POST /api/v1/runbooks/rules/:id/toggle
   */
  app.post('/api/v1/runbooks/rules/:id/toggle', async (request) => {
    const { id } = request.params as { id: string };
    const { active } = request.body as { active: boolean };
    await RunbooksRepository.setRuleActive(id, active);
    return { success: true, id, active };
  });

  /**
   * List recent runbook executions
   * GET /api/v1/runbooks/executions
   */
  app.get('/api/v1/runbooks/executions', async () => {
    const executions = await RunbooksRepository.getRecentExecutions(50);
    return { executions };
  });

  /**
   * Get single execution details with full logs
   * GET /api/v1/runbooks/executions/:id
   */
  app.get('/api/v1/runbooks/executions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const execution = await RunbooksRepository.getExecutionById(id);
    if (!execution) {
      return reply.status(404).send({ error: 'Execution record not found' });
    }
    return { execution };
  });

  /**
   * Trigger Simulated Incident & Remediation Workflow
   * POST /api/v1/runbooks/simulate
   */
  app.post('/api/v1/runbooks/simulate', async (request) => {
    const body = (request.body as any) || {};
    const incidentType = body.incident_type || 'packet_loss';

    let incident: IncidentEvent;

    if (incidentType === 'memory_pressure') {
      incident = {
        id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
        title: 'Worker Thread Memory Pressure Saturation (>92%)',
        severity: 'P2',
        role: 'Kubernetes-Worker',
        target_host: body.host || 'k8s-node-compute-04a',
        cluster: 'us-east-cluster-01',
        metric: 'memory_pressure_pct',
        value: 93.4,
        threshold: 92.0,
        correlated_nodes_count: 1,
        total_cluster_nodes: 4,
        timestamp: new Date().toISOString(),
      };
    } else if (incidentType === 'blast_radius_overflow') {
      incident = {
        id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
        title: 'Cascade Gateway Degradation (Cluster-Wide)',
        severity: 'P1',
        role: 'Edge-Gateway',
        target_host: body.host || 'prod-edge-gw-01',
        cluster: 'us-east-cluster-01',
        metric: 'packet_loss_pct',
        value: 4.8,
        threshold: 3.0,
        correlated_nodes_count: 3,
        total_cluster_nodes: 4,
        timestamp: new Date().toISOString(),
      };
    } else {
      incident = {
        id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
        title: 'Upstream Ingress Gateway Packet Loss Anomaly',
        severity: 'P1',
        role: 'Edge-Gateway',
        target_host: body.host || 'prod-edge-gw-01',
        cluster: 'us-east-cluster-01',
        metric: 'packet_loss_pct',
        value: 3.8,
        threshold: 3.0,
        correlated_nodes_count: 1,
        total_cluster_nodes: 4,
        timestamp: new Date().toISOString(),
      };
    }

    RunbookWorker.emitIncidentEvent(incident).catch(console.error);

    return {
      status: 'triggered',
      incident_id: incident.id,
      title: incident.title,
      target_host: incident.target_host,
      message: 'Autonomous remediation workflow initiated',
    };
  });

  // Short liveness alias
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return { app, wsDispatcher };
}

/**
 * Entrypoint: Starts the Ingestion Gateway and embedded worker
 */
async function start() {
  try {
    const { app } = await buildServer();

    // Initialize Redis consumer group on startup (non-fatal if standalone)
    await initConsumerGroup().catch((e) => {
      console.warn(`[Redis] Consumer group init skipped: ${(e as Error).message}`);
    });

    // Start background processor worker (non-fatal if standalone)
    const worker = new TelemetryWorker();
    worker.start().catch((e) => {
      console.warn(`[Worker] TelemetryWorker start skipped: ${(e as Error).message}`);
    });

    // Initialize PostgreSQL runbooks schema & seed rules (non-fatal if standalone)
    await RunbooksRepository.initSchema().catch((e) => {
      console.warn(`[Postgres] Runbooks schema init skipped: ${(e as Error).message}`);
    });

    // Start autonomous runbook remediation worker
    const runbookWorker = new RunbookWorker();
    runbookWorker.start().catch((e) => {
      console.warn(`[RunbookWorker] RunbookWorker start skipped: ${(e as Error).message}`);
    });

    // Start HTTP & WS Gateway
    await app.listen({ port: config.port, host: config.host });
    console.log(
      `\n🚀 [RicozInfra Ingestion Gateway] Live on http://${config.host}:${config.port}`
    );
    console.log(`📡 Ingestion Endpoint: POST http://${config.host}:${config.port}/api/v1/telemetry/ingest`);
    console.log(`⚡ WebSocket Stream:   ws://${config.host}:${config.port}/ws/telemetry/live`);
    console.log(`🩺 Health Status:      http://${config.host}:${config.port}/api/v1/telemetry/health`);
    console.log(`🤖 Runbook API:        http://${config.host}:${config.port}/api/v1/runbooks/executions\n`);

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      worker.stop();
      runbookWorker.stop();
      await app.close();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('Fatal error during server startup:', err);
    process.exit(1);
  }
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  start();
}
