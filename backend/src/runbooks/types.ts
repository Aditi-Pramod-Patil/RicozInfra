/**
 * Autonomous Runbook Engine & Self-Healing Workflow Types
 */

export type RunbookStatus = 'running' | 'success' | 'failed' | 'aborted';

export type IncidentSeverity = 'P1' | 'P2' | 'P3' | 'P4';

export interface TriggerConditions {
  role?: string;
  metric?: string;
  condition?: '>' | '>=' | '<' | '<=' | '==';
  threshold?: number;
  duration_seconds?: number;
  severity?: IncidentSeverity;
  cluster?: string;
}

export interface ActionStepDefinition {
  id: string;
  name: string;
  type: 'k8s_cordon_drain' | 'lb_reroute' | 'ssh_service_restart' | 'memory_dump_recycle';
  timeout_seconds?: number;
  parameters: Record<string, any>;
}

export interface RunbookRule {
  id: string;
  name: string;
  trigger_conditions: TriggerConditions;
  action_chain: ActionStepDefinition[];
  is_active: boolean;
  cooldown_seconds: number;
  max_blast_radius_nodes: number;
  created_at?: string;
}

export interface IncidentEvent {
  id: string; // e.g. "INC-9402"
  incident_id?: string;
  title: string;
  severity: IncidentSeverity;
  role: string;
  root_cause_role?: string;
  target_host: string;
  root_cause_node?: string;
  cluster: string;
  affected_cluster?: string;
  metric: string;
  value: number;
  threshold: number;
  correlated_nodes_count: number;
  total_cluster_nodes: number;
  timestamp: string;
}

export interface RunbookExecution {
  id: string;
  incident_id: string;
  rule_id: string;
  rule_name: string;
  target_host: string;
  status: RunbookStatus;
  duration_ms: number;
  execution_logs: string;
  raw_logs: string[];
  abort_reason?: string;
  started_at: string;
  completed_at?: string;
}

export interface StepLogEvent {
  execution_id: string;
  incident_id: string;
  step_index: number;
  total_steps: number;
  step_name: string;
  line: string;
  level: 'info' | 'warn' | 'error' | 'success';
  exit_code?: number;
  timestamp: string;
}

export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
  violationType?: 'COOLDOWN' | 'BLAST_RADIUS' | 'DISABLED_RULE' | 'TIMEOUT';
}
