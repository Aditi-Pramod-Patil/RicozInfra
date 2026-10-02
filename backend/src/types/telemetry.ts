import { z } from 'zod';

/**
 * Metric payload validation schema (Zod)
 * Validates individual system vitals sampled by host collectors.
 */
export const SystemMetricsSchema = z.object({
  cpu_utilization: z.number().min(0).max(100),
  memory_used_bytes: z.number().optional(),
  memory_total_bytes: z.number().optional(),
  memory_pressure_pct: z.number().min(0).max(100).optional(),
  disk_read_bytes: z.number().optional(),
  disk_read_mb: z.number().optional(),
  packet_loss_pct: z.number().min(0).max(100),
  rtt_ms: z.number().min(0),
  active_sockets: z.number().int().min(0),
});

/**
 * Single host telemetry packet
 */
export const TelemetryPacketSchema = z.object({
  host_id: z.string().min(1).max(255),
  hostname: z.string().min(1).max(255),
  cluster: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  timestamp: z.string(),
  metrics: SystemMetricsSchema,
});

/**
 * Batch payload support for high-throughput edge nodes aggregating multiple samples
 */
export const TelemetryBatchSchema = z.union([
  TelemetryPacketSchema,
  z.array(TelemetryPacketSchema).min(1).max(5000),
]);

export type SystemMetrics = z.infer<typeof SystemMetricsSchema>;
export type TelemetryPacket = z.infer<typeof TelemetryPacketSchema>;
export type TelemetryBatch = z.infer<typeof TelemetryBatchSchema>;

/**
 * Flattened row representation for ClickHouse BULK INSERT
 */
export interface ClickHouseSystemMetricRow {
  timestamp: string;
  host_id: string;
  hostname: string;
  cluster: string;
  role: string;
  cpu_utilization: number;
  memory_pressure_pct: number;
  disk_read_mb: number;
  packet_loss_pct: number;
  rtt_ms: number;
  active_sockets: number;
}

/**
 * Aggregated live metrics broadcasted over WebSocket to frontends
 */
export interface FleetLiveTelemetryBroadcast {
  type: 'FLEET_TELEMETRY_DELTA';
  timestamp: string;
  summary: {
    fleet_nodes_active: number;
    fleet_nodes_total: number;
    global_avg_cpu_pct: number;
    aggregate_throughput_gbps: number;
    mean_rtt_ms: number;
    aggregate_packet_loss_pct: number;
    active_tcp_connections: number;
    active_p1_incidents: number;
  };
  highlight_host?: {
    hostname: string;
    cluster: string;
    status: 'nominal' | 'degraded' | 'critical';
    cpu: number;
    packet_loss: number;
  };
}

/**
 * PostgreSQL Alert Rule Model
 */
export interface AlertRule {
  id: string;
  name: string;
  metric_name: keyof SystemMetrics;
  condition: '>' | '>=' | '<' | '<=';
  threshold: number;
  duration_seconds: number;
  severity: 'P1' | 'P2' | 'P3';
  target_role: string;
  is_active: boolean;
}

/**
 * PostgreSQL Host Model
 */
export interface HostRecord {
  id: string;
  hostname: string;
  cluster: string;
  role: string;
  ip_address: string;
  status: 'nominal' | 'degraded' | 'critical';
  last_seen_at: Date;
  created_at: Date;
}
