-- ==============================================================================
-- RicozInfra Enterprise Telemetry Storage DDL
-- Databases: ClickHouse (Time-Series Metrics) + PostgreSQL (Metadata & Rules)
-- ==============================================================================

--------------------------------------------------------------------------------
-- 1. CLICKHOUSE TIME-SERIES DDL (Run on ClickHouse Cluster)
--------------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS ricozinfra_telemetry;

USE ricozinfra_telemetry;

-- System Metrics Table: Stores sub-second telemetry from host collector daemons.
-- Columnar storage with ZSTD compression and delta encoding for high ingest throughput.
CREATE TABLE IF NOT EXISTS system_metrics (
    timestamp DateTime64(3, 'UTC') CODEC(DoubleDelta, ZSTD(1)),
    host_id UUID CODEC(ZSTD(1)),
    hostname LowCardinality(String) CODEC(ZSTD(1)),
    cluster LowCardinality(String) CODEC(ZSTD(1)),
    role LowCardinality(String) CODEC(ZSTD(1)),
    cpu_utilization Float32 CODEC(Gorilla, ZSTD(1)),
    memory_pressure_pct Float32 CODEC(Gorilla, ZSTD(1)),
    disk_read_mb Float32 CODEC(Gorilla, ZSTD(1)),
    packet_loss_pct Float32 CODEC(Gorilla, ZSTD(1)),
    rtt_ms Float32 CODEC(Gorilla, ZSTD(1)),
    active_sockets UInt32 CODEC(T64, ZSTD(1))
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
PRIMARY KEY (cluster, role, host_id)
ORDER BY (cluster, role, host_id, timestamp)
TTL timestamp + INTERVAL 90 DAY DELETE
SETTINGS index_granularity = 8192;

-- Network Telemetry Table: Tracks physical and overlay interface metrics.
CREATE TABLE IF NOT EXISTS network_telemetry (
    timestamp DateTime64(3, 'UTC') CODEC(DoubleDelta, ZSTD(1)),
    host_id UUID CODEC(ZSTD(1)),
    interface_id LowCardinality(String) CODEC(ZSTD(1)),
    rx_bytes UInt64 CODEC(T64, ZSTD(1)),
    tx_bytes UInt64 CODEC(T64, ZSTD(1)),
    rx_dropped UInt32 CODEC(T64, ZSTD(1)),
    tx_dropped UInt32 CODEC(T64, ZSTD(1)),
    latency_p99 Float32 CODEC(Gorilla, ZSTD(1))
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
PRIMARY KEY (interface_id, host_id)
ORDER BY (interface_id, host_id, timestamp)
TTL timestamp + INTERVAL 30 DAY DELETE
SETTINGS index_granularity = 8192;

-- Materialized View for Rollup Metrics (1-minute aggregations for dashboard queries)
CREATE TABLE IF NOT EXISTS system_metrics_1m (
    minute DateTime CODEC(DoubleDelta, ZSTD(1)),
    cluster LowCardinality(String),
    role LowCardinality(String),
    avg_cpu Float32,
    max_cpu Float32,
    avg_memory Float32,
    avg_packet_loss Float32,
    avg_rtt Float32,
    total_samples UInt32
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(minute)
PRIMARY KEY (cluster, role, minute)
ORDER BY (cluster, role, minute);

CREATE MATERIALIZED VIEW IF NOT EXISTS system_metrics_1m_mv TO system_metrics_1m AS
SELECT
    toStartOfMinute(timestamp) AS minute,
    cluster,
    role,
    avg(cpu_utilization) AS avg_cpu,
    max(cpu_utilization) AS max_cpu,
    avg(memory_pressure_pct) AS avg_memory,
    avg(packet_loss_pct) AS avg_packet_loss,
    avg(rtt_ms) AS avg_rtt,
    count() AS total_samples
FROM system_metrics
GROUP BY minute, cluster, role;


--------------------------------------------------------------------------------
-- 2. POSTGRESQL DDL (Host Inventory, Alert Rules & Incident Management)
--------------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Host Inventory Table
CREATE TABLE IF NOT EXISTS hosts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostname VARCHAR(255) NOT NULL UNIQUE,
    cluster VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    ip_address INET NOT NULL,
    status VARCHAR(20) DEFAULT 'nominal' CHECK (status IN ('nominal', 'degraded', 'critical', 'offline')),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hosts_cluster_role ON hosts(cluster, role);
CREATE INDEX IF NOT EXISTS idx_hosts_status ON hosts(status);

-- Alert Rules Definition Table
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    condition VARCHAR(10) NOT NULL CHECK (condition IN ('>', '>=', '<', '<=', '==')),
    threshold NUMERIC(10, 2) NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 60,
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('P1', 'P2', 'P3', 'P4')),
    target_role VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_active_role ON alert_rules(target_role, is_active);

-- Active Incidents & Correlation Table
CREATE TABLE IF NOT EXISTS active_incidents (
    id VARCHAR(50) PRIMARY KEY,
    rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
    host_id UUID REFERENCES hosts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'mitigating', 'resolved')),
    severity VARCHAR(10) NOT NULL DEFAULT 'P1',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    root_cause TEXT,
    blast_radius_nodes INT DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON active_incidents(status);

-- Seed Initial Host & Rule Records
INSERT INTO hosts (id, hostname, cluster, role, ip_address, status)
VALUES 
    ('c73e34b2-2980-4c31-90c7-123456789abc', 'prod-edge-gw-01', 'us-east-cluster-01', 'Edge-Gateway', '10.240.12.84', 'degraded'),
    ('b52f12c1-1970-4d22-81b6-987654321def', 'prod-edge-gw-02', 'us-east-cluster-01', 'Edge-Gateway', '10.240.12.85', 'nominal'),
    ('a11d99e0-0860-4e11-70a5-456789123aaa', 'k8s-node-compute-04a', 'us-east-cluster-01', 'Kubernetes-Worker', '10.240.14.12', 'nominal')
ON CONFLICT (hostname) DO NOTHING;

INSERT INTO alert_rules (id, name, metric_name, condition, threshold, duration_seconds, severity, target_role, is_active)
VALUES
    ('d84f5a6b-3120-4e42-9f1a-000000000001', 'Ingress Edge CPU Exhaustion', 'cpu_utilization', '>', 90.00, 300, 'P1', 'Edge-Gateway', true),
    ('d84f5a6b-3120-4e42-9f1a-000000000002', 'Interface Packet Loss Anomaly', 'packet_loss_pct', '>', 3.00, 60, 'P1', 'Edge-Gateway', true),
    ('d84f5a6b-3120-4e42-9f1a-000000000003', 'Worker Memory Pressure Saturation', 'memory_pressure_pct', '>', 92.00, 300, 'P2', 'Kubernetes-Worker', true)
ON CONFLICT DO NOTHING;
