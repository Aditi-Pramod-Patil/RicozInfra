import { getPostgresPool } from './postgres.js';
import type { RunbookRule, RunbookExecution, RunbookStatus } from '../runbooks/types.js';

// In-memory fallback cache when PostgreSQL is warming up
const inMemoryRules: RunbookRule[] = [
  {
    id: 'e11a0001-0000-4000-8000-000000000001',
    name: 'Automatic Ingress Drain & Cordon on Packet Loss',
    trigger_conditions: {
      role: 'Edge-Gateway',
      metric: 'packet_loss_pct',
      condition: '>',
      threshold: 3.0,
      duration_seconds: 60,
      severity: 'P1',
    },
    action_chain: [
      {
        id: 'step-1',
        name: 'Verify Standby Gateway Readiness',
        type: 'lb_reroute',
        timeout_seconds: 30,
        parameters: { action: 'pre_check', standby_host: 'prod-edge-gw-02' },
      },
      {
        id: 'step-2',
        name: 'Cordon Degrading Edge Node',
        type: 'k8s_cordon_drain',
        timeout_seconds: 45,
        parameters: { action: 'cordon', grace_period_seconds: 30 },
      },
      {
        id: 'step-3',
        name: 'Shift Ingress Traffic Weight (100% -> Standby)',
        type: 'lb_reroute',
        timeout_seconds: 45,
        parameters: { action: 'swing_traffic', primary_host: 'prod-edge-gw-01', standby_host: 'prod-edge-gw-02', traffic_shift_pct: 100 },
      },
      {
        id: 'step-4',
        name: 'Gracefully Drain Active TCP Sockets',
        type: 'ssh_service_restart',
        timeout_seconds: 60,
        parameters: { service: 'envoy', command: 'kill -SIGUSR1 $(pgrep envoy)' },
      },
    ],
    is_active: true,
    cooldown_seconds: 900, // 15-minute anti-flapping guard
    max_blast_radius_nodes: 2,
  },
  {
    id: 'e11a0002-0000-4000-8000-000000000002',
    name: 'Memory Pressure Heap Dump & Graceful Pod Rotation',
    trigger_conditions: {
      role: 'Kubernetes-Worker',
      metric: 'memory_pressure_pct',
      condition: '>',
      threshold: 92.0,
      duration_seconds: 300,
      severity: 'P2',
    },
    action_chain: [
      {
        id: 'step-1',
        name: 'Capture Diagnostic Core Heap Profile',
        type: 'memory_dump_recycle',
        timeout_seconds: 60,
        parameters: { dump_directory: '/var/log/profiles', capture_heap: true },
      },
      {
        id: 'step-2',
        name: 'Spin Up Clean Replica & Readiness Check',
        type: 'k8s_cordon_drain',
        timeout_seconds: 90,
        parameters: { action: 'scale_replica', delta: 1 },
      },
      {
        id: 'step-3',
        name: 'Graceful SIGTERM to Saturated Worker',
        type: 'ssh_service_restart',
        timeout_seconds: 45,
        parameters: { service: 'billing-worker', command: 'systemctl restart billing-worker' },
      },
    ],
    is_active: true,
    cooldown_seconds: 900,
    max_blast_radius_nodes: 3,
  },
  {
    id: 'e11a0003-0000-4000-8000-000000000003',
    name: 'CPU Exhaustion Cordon & Graceful Container Eviction',
    trigger_conditions: {
      role: 'Kubernetes-Worker',
      metric: 'cpu_utilization',
      condition: '>',
      threshold: 90.0,
      duration_seconds: 120,
      severity: 'P1',
    },
    action_chain: [
      {
        id: 'step-1',
        name: 'Safely Cordon Kubernetes Node',
        type: 'k8s_cordon_drain',
        timeout_seconds: 30,
        parameters: { action: 'cordon' },
      },
      {
        id: 'step-2',
        name: 'Evict Pods with 30s Grace Period',
        type: 'k8s_cordon_drain',
        timeout_seconds: 90,
        parameters: { action: 'drain', grace_period_seconds: 30 },
      },
    ],
    is_active: true,
    cooldown_seconds: 900,
    max_blast_radius_nodes: 2,
  },
];

// In-memory execution ledger fallback
const inMemoryExecutions: RunbookExecution[] = [
  {
    id: 'exec-seed-001',
    incident_id: 'INC-9402',
    rule_id: 'e11a0001-0000-4000-8000-000000000001',
    rule_name: 'Automatic Ingress Drain & Cordon on Packet Loss',
    target_host: 'prod-edge-gw-01',
    status: 'success',
    duration_ms: 18200,
    execution_logs: `[14:18:30.102] Trigger fired: Packet loss exceeded 3% threshold on eth0
[14:18:30.450] Pre-flight gate: Verified warm standby prod-edge-gw-02 is nominal (0.2ms latency)
[14:18:31.200] Cordon node: Marked prod-edge-gw-01 unschedulable in service mesh topology
[14:18:32.840] Socket drain: SIGUSR1 issued to Envoy reverse proxy PID 1402
[14:18:44.110] Active sockets dropped: 14,892 -> 0
[14:18:46.520] BGP Route convergence: Anycast route announced via standby node
[14:18:48.300] Health verification: Downstream 504 errors dropped to 0 across billing-pipeline
[14:18:48.320] EXECUTION RESULT: SUCCESS (MTTR: 18.2s, 0 user dropped sessions)`,
    raw_logs: [
      '[14:18:30.102] Trigger fired: Packet loss exceeded 3% threshold on eth0',
      '[14:18:30.450] Pre-flight gate: Verified warm standby prod-edge-gw-02 is nominal (0.2ms latency)',
      '[14:18:31.200] Cordon node: Marked prod-edge-gw-01 unschedulable in service mesh topology',
      '[14:18:32.840] Socket drain: SIGUSR1 issued to Envoy reverse proxy PID 1402',
      '[14:18:44.110] Active sockets dropped: 14,892 -> 0',
      '[14:18:46.520] BGP Route convergence: Anycast route announced via standby node',
      '[14:18:48.300] Health verification: Downstream 504 errors dropped to 0 across billing-pipeline',
      '[14:18:48.320] EXECUTION RESULT: SUCCESS (MTTR: 18.2s, 0 user dropped sessions)',
    ],
    started_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 14 * 60 * 1000 + 18200).toISOString(),
  },
];

export class RunbooksRepository {
  /**
   * Fetch all active runbook rules
   */
  public static async getActiveRules(): Promise<RunbookRule[]> {
    try {
      const pool = getPostgresPool();
      const res = await pool.query(`
        SELECT id, name, trigger_conditions, action_chain, is_active, cooldown_seconds, max_blast_radius_nodes, created_at
        FROM runbook_rules
        WHERE is_active = true
      `);
      if (res.rows.length > 0) {
        return res.rows.map((r) => ({
          ...r,
          trigger_conditions: typeof r.trigger_conditions === 'string' ? JSON.parse(r.trigger_conditions) : r.trigger_conditions,
          action_chain: typeof r.action_chain === 'string' ? JSON.parse(r.action_chain) : r.action_chain,
        }));
      }
    } catch {
      // Fallback
    }
    return inMemoryRules.filter((r) => r.is_active);
  }

  /**
   * Fetch all rules (active and inactive)
   */
  public static async getAllRules(): Promise<RunbookRule[]> {
    try {
      const pool = getPostgresPool();
      const res = await pool.query(`
        SELECT id, name, trigger_conditions, action_chain, is_active, cooldown_seconds, max_blast_radius_nodes, created_at
        FROM runbook_rules
        ORDER BY created_at DESC
      `);
      if (res.rows.length > 0) {
        return res.rows.map((r) => ({
          ...r,
          trigger_conditions: typeof r.trigger_conditions === 'string' ? JSON.parse(r.trigger_conditions) : r.trigger_conditions,
          action_chain: typeof r.action_chain === 'string' ? JSON.parse(r.action_chain) : r.action_chain,
        }));
      }
    } catch {
      // Fallback
    }
    return inMemoryRules;
  }

  /**
   * Toggle rule active state
   */
  public static async setRuleActive(id: string, active: boolean): Promise<boolean> {
    try {
      const pool = getPostgresPool();
      await pool.query('UPDATE runbook_rules SET is_active = $1, updated_at = NOW() WHERE id = $2', [active, id]);
    } catch {
      const rule = inMemoryRules.find((r) => r.id === id);
      if (rule) rule.is_active = active;
    }
    return true;
  }

  /**
   * Record the start of a runbook execution
   */
  public static async recordExecutionStart(exec: RunbookExecution): Promise<void> {
    inMemoryExecutions.unshift(exec);
    if (inMemoryExecutions.length > 200) inMemoryExecutions.pop();

    try {
      const pool = getPostgresPool();
      await pool.query(
        `
        INSERT INTO runbook_executions (id, incident_id, rule_id, target_host, status, duration_ms, execution_logs, started_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
        [exec.id, exec.incident_id, exec.rule_id, exec.target_host, exec.status, exec.duration_ms, exec.execution_logs, exec.started_at]
      );
    } catch {
      // Postgres warming up; recorded in memory
    }
  }

  /**
   * Update runbook execution upon completion or abort
   */
  public static async recordExecutionComplete(
    id: string,
    status: RunbookStatus,
    durationMs: number,
    executionLogs: string,
    rawLogs: string[],
    abortReason?: string
  ): Promise<void> {
    const existing = inMemoryExecutions.find((e) => e.id === id);
    if (existing) {
      existing.status = status;
      existing.duration_ms = durationMs;
      existing.execution_logs = executionLogs;
      existing.raw_logs = rawLogs;
      existing.abort_reason = abortReason;
      existing.completed_at = new Date().toISOString();
    }

    try {
      const pool = getPostgresPool();
      await pool.query(
        `
        UPDATE runbook_executions
        SET status = $1, duration_ms = $2, execution_logs = $3, completed_at = NOW()
        WHERE id = $4
      `,
        [status, durationMs, executionLogs, id]
      );
    } catch {
      // Memory state updated
    }
  }

  /**
   * Get latest execution for target host (used by Cooldown Safety Rail)
   */
  public static async getLastExecutionForHost(targetHost: string): Promise<RunbookExecution | null> {
    try {
      const pool = getPostgresPool();
      const res = await pool.query<RunbookExecution>(
        `
        SELECT id, incident_id, rule_id, target_host, status, duration_ms, execution_logs, started_at, completed_at
        FROM runbook_executions
        WHERE target_host = $1 AND status IN ('running', 'success')
        ORDER BY started_at DESC
        LIMIT 1
      `,
        [targetHost]
      );
      if (res.rows.length > 0) return res.rows[0];
    } catch {
      // Fallback
    }

    const memoryMatch = inMemoryExecutions.find(
      (e) => e.target_host === targetHost && (e.status === 'running' || e.status === 'success')
    );
    return memoryMatch || null;
  }

  /**
   * Retrieve list of recent executions
   */
  public static async getRecentExecutions(limit = 20): Promise<RunbookExecution[]> {
    try {
      const pool = getPostgresPool();
      const res = await pool.query(
        `
        SELECT 
          e.id, 
          e.incident_id, 
          e.rule_id, 
          COALESCE(r.name, 'Autonomous Self-Healing Rule') as rule_name,
          e.target_host, 
          e.status, 
          e.duration_ms, 
          e.execution_logs, 
          e.started_at, 
          e.completed_at
        FROM runbook_executions e
        LEFT JOIN runbook_rules r ON e.rule_id = r.id
        ORDER BY e.started_at DESC
        LIMIT $1
      `,
        [limit]
      );
      if (res.rows.length > 0) {
        return res.rows.map((r) => ({
          ...r,
          raw_logs: r.execution_logs ? r.execution_logs.split('\n') : [],
        }));
      }
    } catch {
      // Fallback
    }

    return inMemoryExecutions.slice(0, limit);
  }

  /**
   * Get specific execution by ID
   */
  public static async getExecutionById(id: string): Promise<RunbookExecution | null> {
    const mem = inMemoryExecutions.find((e) => e.id === id);
    if (mem) return mem;

    try {
      const pool = getPostgresPool();
      const res = await pool.query(
        `
        SELECT 
          e.id, 
          e.incident_id, 
          e.rule_id, 
          COALESCE(r.name, 'Autonomous Self-Healing Rule') as rule_name,
          e.target_host, 
          e.status, 
          e.duration_ms, 
          e.execution_logs, 
          e.started_at, 
          e.completed_at
        FROM runbook_executions e
        LEFT JOIN runbook_rules r ON e.rule_id = r.id
        WHERE e.id = $1
      `,
        [id]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          ...row,
          raw_logs: row.execution_logs ? row.execution_logs.split('\n') : [],
        };
      }
    } catch {
      // Fallback
    }

    return null;
  }
}
