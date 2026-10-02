import { Redis } from 'ioredis';
import { config } from '../config.js';
import type { TelemetryPacket } from '../types/telemetry.js';

let redisInstance: Redis | null = null;

/**
 * Singleton Redis client instance
 */
export function getRedisClient(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableAutoPipelining: true, // Automatically bundles rapid commands into pipelines
      retryStrategy(times) {
        return Math.min(times * 100, 2000);
      },
    });

    redisInstance.on('error', (err) => {
      console.warn('[Redis] Connection warning:', err.message);
    });
  }
  return redisInstance;
}

/**
 * Initialize Consumer Group for decoupled background processors.
 * Idempotent: ignores BUSYGROUP if the group is already registered.
 */
export async function initConsumerGroup(): Promise<void> {
  const redis = getRedisClient();
  try {
    if (redis.status !== 'ready') {
      await redis.connect().catch(() => {});
    }
    await redis.xgroup(
      'CREATE',
      config.redis.streamKey,
      config.redis.consumerGroup,
      '$',
      'MKSTREAM'
    );
    console.log(`[Redis] Consumer group '${config.redis.consumerGroup}' created on stream '${config.redis.streamKey}'`);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('BUSYGROUP')) {
      // Group already exists, safe to proceed
    } else {
      console.warn(`[Redis] Group creation check: ${msg}`);
    }
  }
}

/**
 * Push telemetry packets into the Redis Stream queue.
 * Optimized for up to 10,000+ metrics/sec using batched pipelining.
 * Capped with MAXLEN ~ to maintain bounded in-memory buffer.
 */
export async function pushTelemetryToStream(
  packets: TelemetryPacket[]
): Promise<number> {
  if (packets.length === 0) return 0;

  const redis = getRedisClient();
  if (redis.status !== 'ready') {
    await redis.connect().catch(() => {});
  }

  const pipeline = redis.pipeline();

  for (const packet of packets) {
    // XADD stream:telemetry:raw MAXLEN ~ 500000 * payload <json>
    pipeline.xadd(
      config.redis.streamKey,
      'MAXLEN',
      '~',
      config.redis.maxLen,
      '*',
      'payload',
      JSON.stringify(packet)
    );
  }

  await pipeline.exec();
  return packets.length;
}

/**
 * Ping Redis instance for liveness check
 */
export async function pingRedis(): Promise<boolean> {
  try {
    const redis = getRedisClient();
    if (redis.status !== 'ready') {
      await redis.connect().catch(() => {});
    }
    const res = await redis.ping();
    return res === 'PONG';
  } catch {
    return false;
  }
}
