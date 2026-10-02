import pg from 'pg';
import { config } from '../config.js';
import type { AlertRule, HostRecord, SystemMetrics } from '../types/telemetry.js';

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;

/**
 * Singleton PostgreSQL connection pool
 */
export function getPostgresPool(): pg.Pool {
  if (!poolInstance) {
    poolInstance = new Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      database: config.postgres.database,
      user: config.postgres.user,
      password: config.postgres.password,
      max: config.postgres.poolMax,
      idleTimeoutMillis: config.postgres.idleTimeoutMillis,
      connectionTimeoutMillis: 5000,
    });

    poolInstance.on('error', (err) => {
      console.error('[Postgres] Unexpected client error in pool:', err.message);
    });
  }
  return poolInstance;
}

// In-memory cache of active rules to avoid querying Postgres on every single telemetry packet
let cachedRules: AlertRule[] = [];
let lastRulesFetch = 0;
const RULES_CACHE_TTL_MS = 30000; // 30s cache

/**
 * Fetch all active alert rules, using an in-memory cache
 */
export async function getActiveAlertRules(): Promise<AlertRule[]> {
  const now = Date.now();
  if (cachedRules.length > 0 && now - lastRulesFetch < RULES_CACHE_TTL_MS) {
    return cachedRules;
  }

  const pool = getPostgresPool();
  try {
    const res = await pool.query<AlertRule>(`
      SELECT 
        id, 
        name, 
        metric_name, 
        condition, 
        threshold, 
        duration_seconds, 
        severity, 
        target_role, 
        is_active
      FROM alert_rules
      WHERE is_active = true
    `);
    cachedRules = res.rows;
    lastRulesFetch = now;
    return cachedRules;
  } catch (error) {
    console.warn('[Postgres] Could not query alert rules, using defaults:', (error as Error).message);
    // Fallback baseline rules if Postgres is warming up
    return [
      {
        id: 'd84f5a6b-3120-4e42-9f1a-000000000001',
        name: 'Ingress Edge CPU Exhaustion',
        metric_name: 'cpu_utilization',
        condition: '>',
        threshold: 90.0,
        duration_seconds: 300,
        severity: 'P1',
        target_role: 'Edge-Gateway',
        is_active: true,
      },
      {
        id: 'd84f5a6b-3120-4e42-9f1a-000000000002',
        name: 'Interface Packet Loss Anomaly',
        metric_name: 'packet_loss_pct',
        condition: '>',
        threshold: 3.0,
        duration_seconds: 60,
        severity: 'P1',
        target_role: 'Edge-Gateway',
        is_active: true,
      },
    ];
  }
}

/**
 * Update host heartbeat and last_seen timestamp in PostgreSQL
 */
export async function updateHostHeartbeat(
  hostId: string,
  hostname: string,
  cluster: string,
  role: string,
  status: 'nominal' | 'degraded' | 'critical'
): Promise<void> {
  const pool = getPostgresPool();
  try {
    await pool.query(
      `
      INSERT INTO hosts (id, hostname, cluster, role, ip_address, status, last_seen_at)
      VALUES ($1, $2, $3, $4, '10.240.12.84', $5, NOW())
      ON CONFLICT (hostname) DO UPDATE SET
        status = EXCLUDED.status,
        last_seen_at = NOW()
    `,
      [hostId, hostname, cluster, role, status]
    );
  } catch {
    // Non-blocking catch to ensure high ingestion throughput isn't blocked by metadata updates
  }
}

/**
 * Evaluate if a metric value breaches a threshold rule
 */
export function evaluateRuleCondition(
  actualValue: number,
  condition: string,
  threshold: number
): boolean {
  switch (condition) {
    case '>':
      return actualValue > threshold;
    case '>=':
      return actualValue >= threshold;
    case '<':
      return actualValue < threshold;
    case '<=':
      return actualValue <= threshold;
    case '==':
      return actualValue === threshold;
    default:
      return false;
  }
}

/**
 * Create or update active incident when a rule breach crosses its duration threshold
 */
export async function recordIncidentTrigger(
  rule: AlertRule,
  hostId: string,
  hostname: string,
  actualValue: number
): Promise<string> {
  const pool = getPostgresPool();
  const incidentId = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
  const title = `${rule.name}: Host ${hostname} exceeded ${rule.metric_name} threshold (${actualValue} ${rule.condition} ${rule.threshold})`;

  try {
    await pool.query(
      `
      INSERT INTO active_incidents (id, rule_id, host_id, title, status, severity, started_at)
      VALUES ($1, $2, $3, $4, 'investigating', $5, NOW())
      ON CONFLICT (id) DO NOTHING
    `,
      [incidentId, rule.id, hostId, title, rule.severity]
    );
    console.log(`[AlertEngine] Incident ${incidentId} recorded for ${hostname}`);
  } catch (err) {
    console.error('[AlertEngine] Error recording incident:', (err as Error).message);
  }

  return incidentId;
}

/**
 * Health check ping for PostgreSQL
 */
export async function pingPostgres(): Promise<boolean> {
  try {
    const pool = getPostgresPool();
    const res = await pool.query('SELECT 1 as alive');
    return res.rows.length > 0;
  } catch {
    return false;
  }
}
