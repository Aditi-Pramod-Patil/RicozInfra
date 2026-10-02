-- ==============================================================================
-- RicozInfra Autonomous Runbook Engine & Self-Healing Workflow Schema
-- PostgreSQL DDL & Migration
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Automation & Remediation Rules Definition
CREATE TABLE IF NOT EXISTS runbook_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    trigger_conditions JSONB NOT NULL,
    action_chain JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    cooldown_seconds INT NOT NULL DEFAULT 900, -- 15-minute anti-flapping guard
    max_blast_radius_nodes INT NOT NULL DEFAULT 2, -- max allowed failing nodes before abort
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_runbook_rules_active ON runbook_rules(is_active);

-- 2. Runbook Execution & Audit Trail Log Table
CREATE TABLE IF NOT EXISTS runbook_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id VARCHAR(50) NOT NULL,
    rule_id UUID REFERENCES runbook_rules(id) ON DELETE SET NULL,
    target_host VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'failed', 'aborted')),
    duration_ms INT DEFAULT 0,
    execution_logs TEXT DEFAULT '',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_runbook_executions_incident ON runbook_executions(incident_id);
CREATE INDEX IF NOT EXISTS idx_runbook_executions_target ON runbook_executions(target_host, started_at);
CREATE INDEX IF NOT EXISTS idx_runbook_executions_status ON runbook_executions(status);

-- ------------------------------------------------------------------------------
-- SEED DATA: Production SRE Autonomous Remediation Rules
-- ------------------------------------------------------------------------------

INSERT INTO runbook_rules (id, name, trigger_conditions, action_chain, is_active, cooldown_seconds, max_blast_radius_nodes)
VALUES
(
    'e11a0001-0000-4000-8000-000000000001',
    'Automatic Ingress Drain & Cordon on Packet Loss',
    '{
        "role": "Edge-Gateway",
        "metric": "packet_loss_pct",
        "condition": ">",
        "threshold": 3.0,
        "duration_seconds": 60,
        "severity": "P1"
    }',
    '[
        {
            "id": "step-1",
            "name": "Verify Standby Gateway Readiness",
            "type": "lb_reroute",
            "timeout_seconds": 30,
            "parameters": {
                "action": "pre_check",
                "standby_host": "prod-edge-gw-02",
                "health_endpoint": "http://10.240.12.85:8080/health"
            }
        },
        {
            "id": "step-2",
            "name": "Cordon Degrading Edge Node",
            "type": "k8s_cordon_drain",
            "timeout_seconds": 45,
            "parameters": {
                "action": "cordon",
                "grace_period_seconds": 30
            }
        },
        {
            "id": "step-3",
            "name": "Shift Ingress Traffic Weight (100% -> Standby)",
            "type": "lb_reroute",
            "timeout_seconds": 45,
            "parameters": {
                "action": "swing_traffic",
                "primary_host": "prod-edge-gw-01",
                "standby_host": "prod-edge-gw-02",
                "traffic_shift_pct": 100
            }
        },
        {
            "id": "step-4",
            "name": "Gracefully Drain Active TCP Sockets",
            "type": "ssh_service_restart",
            "timeout_seconds": 60,
            "parameters": {
                "service": "envoy",
                "command": "kill -SIGUSR1 $(pgrep envoy)",
                "verify_port": 443
            }
        }
    ]',
    true,
    900,
    2
),
(
    'e11a0002-0000-4000-8000-000000000002',
    'Memory Pressure Heap Dump & Graceful Pod Rotation',
    '{
        "role": "Kubernetes-Worker",
        "metric": "memory_pressure_pct",
        "condition": ">",
        "threshold": 92.0,
        "duration_seconds": 300,
        "severity": "P2"
    }',
    '[
        {
            "id": "step-1",
            "name": "Capture Diagnostic Core Heap Profile",
            "type": "memory_dump_recycle",
            "timeout_seconds": 60,
            "parameters": {
                "dump_directory": "/var/log/profiles",
                "capture_heap": true
            }
        },
        {
            "id": "step-2",
            "name": "Spin Up Clean Replica & Readiness Check",
            "type": "k8s_cordon_drain",
            "timeout_seconds": 90,
            "parameters": {
                "action": "scale_replica",
                "delta": 1
            }
        },
        {
            "id": "step-3",
            "name": "Graceful SIGTERM to Saturated Worker",
            "type": "ssh_service_restart",
            "timeout_seconds": 45,
            "parameters": {
                "service": "billing-worker",
                "command": "systemctl restart billing-worker",
                "verify_exit_code": true
            }
        }
    ]',
    true,
    900,
    3
),
(
    'e11a0003-0000-4000-8000-000000000003',
    'CPU Exhaustion Cordon & Graceful Container Eviction',
    '{
        "role": "Kubernetes-Worker",
        "metric": "cpu_utilization",
        "condition": ">",
        "threshold": 90.0,
        "duration_seconds": 120,
        "severity": "P1"
    }',
    '[
        {
            "id": "step-1",
            "name": "Safely Cordon Kubernetes Node",
            "type": "k8s_cordon_drain",
            "timeout_seconds": 30,
            "parameters": {
                "action": "cordon"
            }
        },
        {
            "id": "step-2",
            "name": "Evict Pods with 30s Grace Period",
            "type": "k8s_cordon_drain",
            "timeout_seconds": 90,
            "parameters": {
                "action": "drain",
                "grace_period_seconds": 30
            }
        }
    ]',
    true,
    900,
    2
)
ON CONFLICT (id) DO NOTHING;
