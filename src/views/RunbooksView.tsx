import React, { useState } from 'react';
import { 
  Play, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  X, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface RunbooksViewProps {
  onOpenRunbookModal: () => void;
}

interface AutomationRule {
  id: string;
  title: string;
  triggerLogic: string;
  executionSequence: string;
  enabled: boolean;
  lastTriggered: string;
  incidentRef?: string;
  outcome: 'Success' | 'Failed';
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  incidentId: string;
  ruleName: string;
  target: string;
  duration: string;
  status: 'Success' | 'Failed';
  rawLogs: string[];
}

export const RunbooksView: React.FC<RunbooksViewProps> = ({ onOpenRunbookModal }) => {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: 'rule-1',
      title: 'Automatic Ingress Drain & Cordon on Packet Loss',
      triggerLogic: 'WHEN Interface Packet Loss > 3% FOR 60s ON Role: Edge-Gateway',
      executionSequence: '1. Cordon Node → 2. Drain active traffic to Warm Standby → 3. Post telemetry snapshot to #infra-alerts',
      enabled: true,
      lastTriggered: '14 mins ago (Incident #INC-9402)',
      incidentRef: '#INC-9402',
      outcome: 'Success',
    },
    {
      id: 'rule-2',
      title: 'Memory Leak Flush & Graceful Pod Worker Rotation',
      triggerLogic: 'WHEN Memory Pressure > 92% FOR 5m ON K8s Cluster Alpha',
      executionSequence: '1. Trigger Heap Dump → 2. Spin up replica → 3. Graceful SIGTERM old worker',
      enabled: true,
      lastTriggered: '3 days ago',
      outcome: 'Success',
    },
    {
      id: 'rule-3',
      title: 'BGP Route Flap Dampening & Anycast Withdrawal',
      triggerLogic: 'WHEN BGP Flap Count > 4 in 120s ON Cloudflare Transit AS13335',
      executionSequence: '1. Deprecate MED Metric → 2. Withdraw Secondary Anycast Prefix → 3. Failover to Transit Direct',
      enabled: true,
      lastTriggered: '18 days ago',
      outcome: 'Success',
    },
    {
      id: 'rule-4',
      title: 'ClickHouse Queue Buffer Overflow Auto-Scale',
      triggerLogic: 'WHEN Ingest Queue Depth > 85% FOR 3m ON Telemetry Mesh',
      executionSequence: '1. Spin up 2x Ingestion Workers → 2. Increase Kafka batch commit flush size to 10MB',
      enabled: false,
      lastTriggered: '1 month ago',
      outcome: 'Success',
    },
  ]);

  const [auditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'log-1',
      timestamp: 'Today, 14:18:30 UTC',
      incidentId: 'INC-9402',
      ruleName: 'Automatic Ingress Drain & Cordon on Packet Loss',
      target: 'prod-edge-gw-01 (10.240.12.84)',
      duration: '18.2s',
      status: 'Success',
      rawLogs: [
        '[14:18:30.102] Trigger fired: Packet loss exceeded 3% threshold on eth0',
        '[14:18:30.450] Pre-flight gate: Verified warm standby prod-edge-gw-03 is nominal (0.2ms latency)',
        '[14:18:31.200] Cordon node: Marked prod-edge-gw-01 unschedulable in service mesh topology',
        '[14:18:32.840] Socket drain: SIGUSR1 issued to Envoy reverse proxy PID 1402',
        '[14:18:44.110] Active sockets dropped: 14,892 -> 0',
        '[14:18:46.520] BGP Route convergence: Anycast route announced via standby node',
        '[14:18:48.300] Health verification: Downstream 504 errors dropped to 0 across billing-pipeline',
        '[14:18:48.320] EXECUTION RESULT: SUCCESS (MTTR: 18.2s, 0 user dropped sessions)',
      ],
    },
    {
      id: 'log-2',
      timestamp: 'Sep 29, 04:12:15 UTC',
      incidentId: 'INC-9388',
      ruleName: 'Memory Leak Flush & Graceful Pod Worker Rotation',
      target: 'pod-billing-worker-08b (k8s-node-compute-04a)',
      duration: '14.6s',
      status: 'Success',
      rawLogs: [
        '[04:12:15.010] Trigger fired: Memory pressure reached 93.4% on worker thread',
        '[04:12:16.200] Heap profile dump written to /var/log/profiles/billing-9388.dump',
        '[04:12:18.450] Replica pod-billing-worker-08c successfully scheduled and passed healthz probe',
        '[04:12:28.120] Old worker terminated with SIGTERM (exit code 0)',
        '[04:12:29.610] EXECUTION RESULT: SUCCESS (MTTR: 14.6s)',
      ],
    },
    {
      id: 'log-3',
      timestamp: 'Sep 22, 19:40:02 UTC',
      incidentId: 'INC-9340',
      ruleName: 'BGP Route Flap Dampening & Anycast Withdrawal',
      target: 'bgp-edge-transit-01 (AS13335)',
      duration: '22.1s',
      status: 'Success',
      rawLogs: [
        '[19:40:02.040] Trigger fired: 5 route flap events detected within 90 seconds',
        '[19:40:03.110] Increased BGP MED metric from 100 to 500 on primary leaf',
        '[19:40:12.800] Transit provider confirmed withdrawal of unstable route announcement',
        '[19:40:24.140] EXECUTION RESULT: SUCCESS (MTTR: 22.1s, route stabilized)',
      ],
    },
    {
      id: 'log-4',
      timestamp: 'Sep 15, 08:05:44 UTC',
      incidentId: 'INC-9291',
      ruleName: 'ClickHouse Queue Buffer Overflow Auto-Scale',
      target: 'clickhouse-ingest-cluster',
      duration: '45.0s',
      status: 'Success',
      rawLogs: [
        '[08:05:44.020] Trigger fired: Ingest buffer depth 88% on Telemetry Mesh',
        '[08:05:52.400] Auto-scaled ingestion statefulset replicas from 4 to 6',
        '[08:06:29.020] Buffer depth cleared to 24%',
        '[08:06:29.020] EXECUTION RESULT: SUCCESS (MTTR: 45.0s)',
      ],
    },
  ]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogEntry | null>(null);

  // Form states for new rule
  const [newTitle, setNewTitle] = useState('');
  const [newTrigger, setNewTrigger] = useState('WHEN CPU Load > 90% FOR 2m ON Any Node');
  const [newSequence, setNewSequence] = useState('1. Cordon Node → 2. Drain active connections → 3. Alert #ops');

  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newRuleItem: AutomationRule = {
      id: `rule-${rules.length + 1}`,
      title: newTitle,
      triggerLogic: newTrigger,
      executionSequence: newSequence,
      enabled: true,
      lastTriggered: 'Never (Newly Created)',
      outcome: 'Success',
    };

    setRules([newRuleItem, ...rules]);
    setIsCreateModalOpen(false);
    setNewTitle('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 1. Header with Crimson Button "+ Create New Runbook Rule" */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0F172A' }}>
            Self-Healing Automation &amp; Remediation Engine
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
            Event-driven automated mitigation runbooks executing within 200ms of threshold violations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-slate-secondary" onClick={onOpenRunbookModal} style={{ fontSize: '12.5px' }}>
            <Play size={13} color="#10B981" />
            <span>Simulate Runbook</span>
          </button>

          <button
            className="btn-crimson-primary"
            onClick={() => setIsCreateModalOpen(true)}
            style={{ fontSize: '12.5px', padding: '8px 16px' }}
          >
            <Plus size={14} />
            <span>+ Create New Runbook Rule</span>
          </button>
        </div>
      </div>

      {/* 2. Runbook Efficiency Summary Bar (3 KPI Tiles) */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
      }}>
        {/* KPI 1: MTTR Reduction */}
        <div className="card-white" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              MTTR Reduction
            </span>
            <span className="metric-pill-emerald">
              <span className="pulse-dot-emerald" />
              <span>-88% Faster</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.03em' }}>
              18
            </span>
            <span style={{ fontSize: '16px', fontWeight: 500, color: '#64748B' }}>Seconds</span>
          </div>

          <div style={{ marginTop: '10px', fontSize: '12.5px', color: '#64748B' }}>
            Average Time to Recovery across automated clusters
          </div>
        </div>

        {/* KPI 2: Autonomous Success Rate */}
        <div className="card-white" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Autonomous Success Rate
            </span>
            <span className="metric-pill-emerald">
              <span>Zero Regressions</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 600, color: '#10B981', letterSpacing: '-0.03em' }}>
              98.4%
            </span>
          </div>

          <div style={{ marginTop: '10px', fontSize: '12.5px', color: '#64748B' }}>
            36 out of 37 incidents resolved without human on-call paging
          </div>
        </div>

        {/* KPI 3: Human Intervention Prevented */}
        <div className="card-white" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Human Intervention Prevented
            </span>
            <span className="metric-pill-slate">
              <span>On-Call Fatigue Zero</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.03em' }}>
              96.3%
            </span>
          </div>

          <div style={{ marginTop: '10px', fontSize: '12.5px', color: '#64748B' }}>
            96.3% of low-severity cascade alerts deflected automatically
          </div>
        </div>
      </section>

      {/* 3. Active Automation Rules List (Clean white cards with hairline borders) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
            Active Automation Rules ({rules.length})
          </h2>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            Idempotent closed-loop policies with health check gates
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="card-white"
              style={{
                padding: '24px 28px',
                borderLeft: rule.enabled ? '4px solid #10B981' : '4px solid #CBD5E1',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: rule.enabled ? '#ECFDF5' : '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: rule.enabled ? '#10B981' : '#94A3B8',
                  }}>
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                      {rule.title}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      Last Triggered: <strong>{rule.lastTriggered}</strong>
                    </div>
                  </div>
                </div>

                {/* Right Toggle & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span className={rule.enabled ? 'metric-pill-emerald' : 'metric-pill-slate'}>
                    {rule.enabled ? 'Active Policy' : 'Disabled'}
                  </span>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#475569' }}>
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id)}
                      style={{ accentColor: '#10B981', cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <span>{rule.enabled ? 'Enabled' : 'Disabled'}</span>
                  </label>

                  <button
                    onClick={onOpenRunbookModal}
                    className="btn-slate-secondary"
                    style={{ fontSize: '11.5px', padding: '5px 10px' }}
                  >
                    <span>Trigger Manual Run</span>
                  </button>
                </div>
              </div>

              {/* Trigger Logic & Execution Sequence Blocks */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
                    TRIGGER EVALUATION LOGIC
                  </span>
                  <div style={{
                    marginTop: '4px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#0F172A',
                    background: '#FFFFFF',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    display: 'inline-block',
                  }}>
                    {rule.triggerLogic}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
                    AUTOMATED EXECUTION PIPELINE
                  </span>
                  <div style={{
                    marginTop: '4px',
                    fontSize: '12.5px',
                    color: '#334155',
                    background: '#FFFFFF',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                  }}>
                    {rule.executionSequence}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Execution Audit Log Table */}
      <section className="card-white" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
              Execution Audit Log Table
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
              Complete chronological ledger of automated mitigation executions with full step traces.
            </p>
          </div>

          <span className="metric-pill-slate">Immutable Audit Log</span>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Triggering Incident ID</th>
                <th>Rule Name</th>
                <th>Target Host / Cluster</th>
                <th>Duration</th>
                <th>Execution Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => {
                const isSuccess = log.status === 'Success';

                return (
                  <tr key={log.id}>
                    <td>
                      <span style={{ fontSize: '12.5px', color: '#0F172A', fontWeight: 500 }}>
                        {log.timestamp}
                      </span>
                    </td>

                    <td>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: log.incidentId === 'INC-9402' ? '#E11D48' : '#0F172A',
                      }}>
                        #{log.incidentId}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: '12.5px', color: '#0F172A', fontWeight: 500 }}>
                        {log.ruleName}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        {log.target}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0F172A' }}>
                        {log.duration}
                      </span>
                    </td>

                    <td>
                      {isSuccess ? (
                        <span className="metric-pill-emerald">
                          <CheckCircle2 size={12} color="#10B981" />
                          <span>Success</span>
                        </span>
                      ) : (
                        <span className="metric-pill-crimson">
                          <AlertTriangle size={12} color="#E11D48" />
                          <span>Failed</span>
                        </span>
                      )}
                    </td>

                    <td>
                      <button
                        onClick={() => setSelectedAuditLog(log)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#E11D48',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>View Raw Execution Log</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal 1: Create New Runbook Rule Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div
            className="modal-content-card"
            style={{
              width: '580px',
              maxWidth: '92vw',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} color="#E11D48" />
                <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A' }}>
                  Create New Autonomous Runbook Rule
                </h3>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                  Rule Name / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Automatic Redis Eviction on Memory Pressure"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                  Trigger Condition (Evaluation Logic)
                </label>
                <input
                  type="text"
                  required
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                  Automated Execution Pipeline Sequence
                </label>
                <textarea
                  rows={3}
                  required
                  value={newSequence}
                  onChange={(e) => setNewSequence(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                color: '#64748B',
              }}>
                All newly created runbook rules are validated for idempotency and undergo safe canary test checks prior to activation.
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn-slate-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-crimson-primary"
                  style={{ flex: 1 }}
                >
                  <span>Activate Rule</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Raw Execution Log Modal */}
      {selectedAuditLog && (
        <div className="modal-overlay" onClick={() => setSelectedAuditLog(null)}>
          <div
            className="modal-content-card"
            style={{
              width: '680px',
              maxWidth: '92vw',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                  Raw Execution Log: #{selectedAuditLog.incidentId}
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  {selectedAuditLog.ruleName} • Duration: {selectedAuditLog.duration}
                </p>
              </div>

              <button
                onClick={() => setSelectedAuditLog(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Terminal-like Light Surface with Strict Inter Font */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '16px',
              fontSize: '12px',
              lineHeight: 1.65,
              color: '#334155',
              maxHeight: '340px',
              overflowY: 'auto',
            }}>
              {selectedAuditLog.rawLogs.map((line, i) => (
                <div key={i} style={{ color: line.includes('SUCCESS') ? '#059669' : line.includes('Trigger fired') ? '#E11D48' : '#334155' }}>
                  {line}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-slate-secondary"
                onClick={() => setSelectedAuditLog(null)}
              >
                Close Audit Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
