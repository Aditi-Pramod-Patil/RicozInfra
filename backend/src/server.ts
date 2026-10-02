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

    // Start HTTP & WS Gateway
    await app.listen({ port: config.port, host: config.host });
    console.log(
      `\n🚀 [RicozInfra Ingestion Gateway] Live on http://${config.host}:${config.port}`
    );
    console.log(`📡 Ingestion Endpoint: POST http://${config.host}:${config.port}/api/v1/telemetry/ingest`);
    console.log(`⚡ WebSocket Stream:   ws://${config.host}:${config.port}/ws/telemetry/live`);
    console.log(`🩺 Health Status:      http://${config.host}:${config.port}/api/v1/telemetry/health\n`);

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      worker.stop();
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
