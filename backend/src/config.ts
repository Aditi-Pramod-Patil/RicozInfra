import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
  env: string;
  port: number;
  host: string;
  logLevel: string;
  rateLimit: {
    max: number;
    timeWindow: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    streamKey: string;
    consumerGroup: string;
    maxLen: number;
  };
  clickhouse: {
    url: string;
    database: string;
    username: string;
    password?: string;
    batchSize: number;
    flushIntervalMs: number;
  };
  postgres: {
    host: string;
    port: number;
    database: string;
    user: string;
    password?: string;
    poolMax: number;
    idleTimeoutMillis: number;
  };
  ws: {
    heartbeatIntervalMs: number;
    broadcastIntervalMs: number;
  };
}

export const config: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8080', 10),
  host: process.env.HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'info',
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '50000', 10),
    timeWindow: process.env.RATE_LIMIT_TIME_WINDOW || '1 minute',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    streamKey: process.env.REDIS_STREAM_KEY || 'stream:telemetry:raw',
    consumerGroup: process.env.REDIS_CONSUMER_GROUP || 'group:telemetry:processors',
    maxLen: parseInt(process.env.REDIS_STREAM_MAXLEN || '500000', 10),
  },
  clickhouse: {
    url: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
    database: process.env.CLICKHOUSE_DATABASE || 'ricozinfra_telemetry',
    username: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || undefined,
    batchSize: parseInt(process.env.CLICKHOUSE_BATCH_SIZE || '2000', 10),
    flushIntervalMs: parseInt(process.env.CLICKHOUSE_FLUSH_INTERVAL_MS || '500', 10),
  },
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'ricozinfra_metadata',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    poolMax: parseInt(process.env.POSTGRES_POOL_MAX || '20', 10),
    idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT_MILLIS || '30000', 10),
  },
  ws: {
    heartbeatIntervalMs: parseInt(process.env.WS_HEARTBEAT_INTERVAL_MS || '15000', 10),
    broadcastIntervalMs: parseInt(process.env.WS_BROADCAST_INTERVAL_MS || '1000', 10),
  },
};
