import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  X, 
  ChevronRight,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  Activity
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
  status: 'Success' | 'Failed' | 'Running' | 'Aborted';
  rawLogs: string[];
}

const BACKEND_BASE = 'http://localhost:8080';

export const RunbooksView: React.FC<RunbooksViewProps> = () => {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: 'e11a0001-0000-4000-8000-000000000001',
      title: 'Automatic Ingress Drain & Cordon on Packet Loss',
      triggerLogic: 'WHEN Interface Packet Loss > 3% FOR 60s ON Role: Edge-Gateway',
      executionSequence: '1. Cordon Node → 2. Drain active traffic to Warm Standby → 3. Post telemetry snapshot to #infra-alerts',
      enabled: true,
      lastTriggered: '14 mins ago (Incident #INC-9402)',
      incidentRef: '#INC-9402',
      outcome: 'Success',
    },
    {
      id: 'e11a0002-0000-4000-8000-000000000002',
      title: 'Memory Pressure Heap Dump & Graceful Pod Rotation',
      triggerLogic: 'WHEN Memory Pressure > 92% FOR 5m ON K8s Cluster Alpha',
      executionSequence: '1. Trigger Heap Dump → 2. Spin up replica → 3. Graceful SIGTERM old worker',
      enabled: true,
      lastTriggered: '3 days ago',
      outcome: 'Success',
    },
    {
      id: 'e11a0003-0000-4000-8000-000000000003',
      title: 'CPU Exhaustion Cordon & Graceful Container Eviction',
      triggerLogic: 'WHEN CPU Utilization > 90% FOR 2m ON Kubernetes-Worker',
      executionSequence: '1. Safely Cordon Node → 2. Evict Pods with 30s Grace Period → 3. Notify Cluster SRE',
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

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'log-1',
      timestamp: 'Today, 14:18:30 UTC',
      incidentId: 'INC-9402',
      ruleName: 'Automatic Ingress Drain & Cordon on Packet Loss',
      target: 'prod-edge-gw-01',
      duration: '18.2s',
      status: 'Success',
      rawLogs: [
        '[14:18:30.102] Trigger fired: Packet loss exceeded 3% threshold on eth0',
        '[14:18:30.450] Pre-flight gate: Verified warm standby prod-edge-gw-02 is nominal (0.2ms latency)',
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
      ruleName: 'Memory Pressure Heap Dump & Graceful Pod Rotation',
      target: 'k8s-node-compute-04a',
      duration: '14.6s',
      status: 'Success',
      rawLogs: [
        '[04:12:15.010] Trigger fired: Memory pressure reached 93.4% on worker thread',
        '[04:12:16.200] Heap profile dump written to /var/log/profiles/inc-9388-memory.dump',
        '[04:12:18.450] Replica pod-billing-worker-08c successfully scheduled and passed healthz probe',
        '[04:12:28.120] Old worker terminated with SIGTERM (exit code 0)',
        '[04:12:29.610] EXECUTION RESULT: SUCCESS (MTTR: 14.6s)',
      ],
    },
  ]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogEntry | null>(null);
  const [isExecutingSimulation, setIsExecutingSimulation] = useState(false);

  // Simulation scenario selection
  const [simulateScenario, setSimulateScenario] = useState<'packet_loss' | 'memory_pressure' | 'blast_radius_overflow'>('packet_loss');
  const [simulateHost, setSimulateHost] = useState('prod-edge-gw-01');

  // Form states for new rule
  const [newTitle, setNewTitle] = useState('');
  const [newTrigger, setNewTrigger] = useState('WHEN CPU Load > 90% FOR 2m ON Any Node');
  const [newSequence, setNewSequence] = useState('1. Cordon Node → 2. Drain active connections → 3. Alert #ops');

  const logTerminalRef = useRef<HTMLDivElement>(null);

  // 1. Fetch live rules and executions from backend on mount
  useEffect(() => {
    fetch(`${BACKEND_BASE}/api/v1/runbooks/rules`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.rules) && data.rules.length > 0) {
          const mapped: AutomationRule[] = data.rules.map((r: any) => ({
            id: r.id,
            title: r.name,
            triggerLogic: `WHEN ${r.trigger_conditions?.metric || 'Metric'} ${r.trigger_conditions?.condition || '>'} ${r.trigger_conditions?.threshold || ''} ON Role: ${r.trigger_conditions?.role || 'Any'}`,
            executionSequence: Array.isArray(r.action_chain)
              ? r.action_chain.map((s: any, idx: number) => `${idx + 1}. ${s.name}`).join(' → ')
              : '1. Automated Action Chain',
            enabled: r.is_active,
            lastTriggered: 'Active policy',
            outcome: 'Success',
          }));
          setRules(mapped);
        }
      })
      .catch(() => {});

    fetch(`${BACKEND_BASE}/api/v1/runbooks/executions`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.executions) && data.executions.length > 0) {
          const mappedLogs: AuditLogEntry[] = data.executions.map((e: any) => ({
            id: e.id,
            timestamp: new Date(e.started_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            incidentId: e.incident_id,
            ruleName: e.rule_name || 'Self-Healing Remediation',
            target: e.target_host,
            duration: `${(e.duration_ms / 1000).toFixed(1)}s`,
            status: e.status === 'success' ? 'Success' : e.status === 'aborted' ? 'Aborted' : e.status === 'running' ? 'Running' : 'Failed',
            rawLogs: Array.isArray(e.raw_logs) && e.raw_logs.length > 0 ? e.raw_logs : (e.execution_logs ? e.execution_logs.split('\n') : []),
          }));
          setAuditLogs(mappedLogs);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Real-Time WebSocket Event Listeners
  useEffect(() => {
    const handleRunbookLog = (e: Event) => {
      const customEvent = e as CustomEvent;
      const logEvent = customEvent.detail;
      if (!logEvent) return;

      setSelectedAuditLog((prev) => {
        if (!prev) return prev;
        if (prev.incidentId === logEvent.incident_id || prev.id === logEvent.execution_id) {
          const updatedLogs = [...prev.rawLogs, logEvent.line];
          return {
            ...prev,
            rawLogs: updatedLogs,
          };
        }
        return prev;
      });

      setAuditLogs((prev) =>
        prev.map((entry) => {
          if (entry.incidentId === logEvent.incident_id || entry.id === logEvent.execution_id) {
            return {
              ...entry,
              rawLogs: [...entry.rawLogs, logEvent.line],
            };
          }
          return entry;
        })
      );

      // Auto-scroll log terminal
      setTimeout(() => {
        if (logTerminalRef.current) {
          logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
        }
      }, 50);
    };

    const handleRunbookUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const update = customEvent.detail;
      if (!update) return;

      const formattedEntry: AuditLogEntry = {
        id: update.id,
        timestamp: new Date(update.started_at || Date.now()).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        incidentId: update.incident_id,
        ruleName: update.rule_name || 'Self-Healing Remediation',
        target: update.target_host,
        duration: update.duration_ms ? `${(update.duration_ms / 1000).toFixed(1)}s` : 'running...',
        status: update.status === 'success' ? 'Success' : update.status === 'aborted' ? 'Aborted' : update.status === 'running' ? 'Running' : 'Failed',
        rawLogs: update.raw_logs || (update.execution_logs ? update.execution_logs.split('\n') : []),
      };

      setAuditLogs((prev) => {
        const idx = prev.findIndex((x) => x.id === update.id || x.incidentId === update.incident_id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            ...formattedEntry,
            rawLogs: formattedEntry.rawLogs.length >= next[idx].rawLogs.length ? formattedEntry.rawLogs : next[idx].rawLogs,
          };
          return next;
        }
        return [formattedEntry, ...prev];
      });

      setSelectedAuditLog((prev) => {
        if (prev && (prev.id === update.id || prev.incidentId === update.incident_id)) {
          return {
            ...prev,
            status: formattedEntry.status,
            duration: formattedEntry.duration,
            rawLogs: formattedEntry.rawLogs.length >= prev.rawLogs.length ? formattedEntry.rawLogs : prev.rawLogs,
          };
        }
        return prev;
      });
    };

    window.addEventListener('ricoz:runbook_log', handleRunbookLog);
    window.addEventListener('ricoz:runbook_update', handleRunbookUpdate);

    return () => {
      window.removeEventListener('ricoz:runbook_log', handleRunbookLog);
      window.removeEventListener('ricoz:runbook_update', handleRunbookUpdate);
    };
  }, []);

  const handleToggleRule = async (id: string) => {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;

    const nextState = !rule.enabled;
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: nextState } : r))
    );

    try {
      await fetch(`${BACKEND_BASE}/api/v1/runbooks/rules/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextState }),
      });
    } catch {}
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

  /**
   * Launch Automated Self-Healing Simulation
   */
  const handleLaunchSimulation = async () => {
    setIsExecutingSimulation(true);

    try {
      const res = await fetch(`${BACKEND_BASE}/api/v1/runbooks/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_type: simulateScenario,
          host: simulateHost,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const placeholderEntry: AuditLogEntry = {
          id: `sim-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          incidentId: data.incident_id,
          ruleName: simulateScenario === 'memory_pressure'
            ? 'Memory Pressure Heap Dump & Graceful Pod Rotation'
            : 'Automatic Ingress Drain & Cordon on Packet Loss',
          target: data.target_host,
          duration: 'executing...',
          status: 'Running',
          rawLogs: [
            `[${new Date().toISOString().substring(11, 23)}] Trigger synthesized: #${data.incident_id} (${data.title})`,
            `[${new Date().toISOString().substring(11, 23)}] Dispatching event to Redis stream 'stream:incidents:created'...`,
            `[${new Date().toISOString().substring(11, 23)}] Connecting to Autonomous Remediation Engine...`,
          ],
        };

        setAuditLogs((prev) => [placeholderEntry, ...prev]);
        setSelectedAuditLog(placeholderEntry);
        setIsSimulateModalOpen(false);
      }
    } catch {
      setIsSimulateModalOpen(false);
    } finally {
      setIsExecutingSimulation(false);
    }
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
          <button
            className="btn-slate-secondary"
            onClick={() => setIsSimulateModalOpen(true)}
            style={{ fontSize: '12.5px', gap: '6px' }}
          >
            <Play size={13} color="#10B981" />
            <span>Simulate Incident Remediation</span>
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
                      Status: <strong>{rule.enabled ? 'Active Policy' : 'Disabled'}</strong> • Cooldown: 15 mins
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
                    onClick={() => {
                      setSimulateScenario(rule.id.includes('0002') ? 'memory_pressure' : 'packet_loss');
                      setSimulateHost(rule.id.includes('0002') ? 'k8s-node-compute-04a' : 'prod-edge-gw-01');
                      setIsSimulateModalOpen(true);
                    }}
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
              Execution Audit Log Table ({auditLogs.length})
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
              Complete chronological ledger of automated mitigation executions streamed live from the execution engine.
            </p>
          </div>

          <span className="metric-pill-slate">PostgreSQL Immutable Audit Log</span>
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
                const isRunning = log.status === 'Running';
                const isAborted = log.status === 'Aborted';

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
                      ) : isRunning ? (
                        <span className="metric-pill-slate" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                          <span className="pulse-dot-emerald" style={{ background: '#3B82F6' }} />
                          <span>Running</span>
                        </span>
                      ) : isAborted ? (
                        <span className="metric-pill-slate" style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                          <ShieldAlert size={12} color="#B45309" />
                          <span>Aborted</span>
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
                All newly created runbook rules are validated for idempotency, cooldown protection (15m window), and blast radius limits before execution.
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

      {/* Modal 2: Simulate Incident Remediation Modal */}
      {isSimulateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSimulateModalOpen(false)}>
          <div
            className="modal-content-card"
            style={{
              width: '560px',
              maxWidth: '92vw',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#E11D48" />
                <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A' }}>
                  Simulate Incident &amp; Test Autonomous Remediation
                </h3>
              </div>

              <button
                onClick={() => setIsSimulateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '18px' }}>
              Select a real-world incident scenario to trigger the execution engine. Steps will be dispatched over Redis Streams and streamed live via WebSockets.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {/* Option 1: Ingress Packet Loss */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '10px',
                  border: simulateScenario === 'packet_loss' ? '2px solid #E11D48' : '1px solid #E2E8F0',
                  background: simulateScenario === 'packet_loss' ? '#FFF1F2' : '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="scenario"
                  checked={simulateScenario === 'packet_loss'}
                  onChange={() => {
                    setSimulateScenario('packet_loss');
                    setSimulateHost('prod-edge-gw-01');
                  }}
                  style={{ marginTop: '2px', accentColor: '#E11D48' }}
                />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
                    Ingress Packet Loss Drop (Edge-Gateway)
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
                    Remediation: Cordon host → Swing traffic weight 100% to standby → Issue SIGUSR1 graceful TCP drain.
                  </div>
                </div>
              </label>

              {/* Option 2: Memory Saturation */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '10px',
                  border: simulateScenario === 'memory_pressure' ? '2px solid #E11D48' : '1px solid #E2E8F0',
                  background: simulateScenario === 'memory_pressure' ? '#FFF1F2' : '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="scenario"
                  checked={simulateScenario === 'memory_pressure'}
                  onChange={() => {
                    setSimulateScenario('memory_pressure');
                    setSimulateHost('k8s-node-compute-04a');
                  }}
                  style={{ marginTop: '2px', accentColor: '#E11D48' }}
                />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
                    Worker Thread Memory Pressure Saturation (&gt;92%)
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
                    Remediation: Capture heap dump profile to S3 → Scale replica deployment → Graceful restart via SSH.
                  </div>
                </div>
              </label>

              {/* Option 3: Blast Radius Guard Test */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '10px',
                  border: simulateScenario === 'blast_radius_overflow' ? '2px solid #E11D48' : '1px solid #E2E8F0',
                  background: simulateScenario === 'blast_radius_overflow' ? '#FFF1F2' : '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="scenario"
                  checked={simulateScenario === 'blast_radius_overflow'}
                  onChange={() => {
                    setSimulateScenario('blast_radius_overflow');
                    setSimulateHost('prod-edge-gw-01');
                  }}
                  style={{ marginTop: '2px', accentColor: '#E11D48' }}
                />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
                    Blast Radius Guard Test (&gt;25% Cluster Failure)
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
                    Safety Rail: Simulates 3/4 node correlated failure. Safety gate automatically aborts execution and pages on-call SRE.
                  </div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-slate-secondary"
                onClick={() => setIsSimulateModalOpen(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-crimson-primary"
                onClick={handleLaunchSimulation}
                disabled={isExecutingSimulation}
                style={{ flex: 1, gap: '6px' }}
              >
                <Play size={14} />
                <span>{isExecutingSimulation ? 'Dispatching...' : 'Launch Autonomous Remediation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Raw Execution Log Modal (Live Streamed Terminal) */}
      {selectedAuditLog && (
        <div className="modal-overlay" onClick={() => setSelectedAuditLog(null)}>
          <div
            className="modal-content-card"
            style={{
              width: '740px',
              maxWidth: '94vw',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: selectedAuditLog.status === 'Success' ? '#ECFDF5' : selectedAuditLog.status === 'Running' ? '#EFF6FF' : '#FFF1F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {selectedAuditLog.status === 'Success' ? (
                    <CheckCircle2 size={16} color="#10B981" />
                  ) : selectedAuditLog.status === 'Running' ? (
                    <RotateCcw size={16} color="#2563EB" className="animate-spin" />
                  ) : (
                    <AlertTriangle size={16} color="#E11D48" />
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                      Remediation Audit Trace: #{selectedAuditLog.incidentId}
                    </h3>
                    <span className={
                      selectedAuditLog.status === 'Success'
                        ? 'metric-pill-emerald'
                        : selectedAuditLog.status === 'Running'
                        ? 'metric-pill-slate'
                        : 'metric-pill-crimson'
                    }>
                      {selectedAuditLog.status === 'Running' && <span className="pulse-dot-emerald" style={{ background: '#3B82F6' }} />}
                      <span>{selectedAuditLog.status}</span>
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    {selectedAuditLog.ruleName} • Target: {selectedAuditLog.target} • Duration: {selectedAuditLog.duration}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAuditLog(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Terminal-like Light Surface with Strict Inter Font */}
            <div
              ref={logTerminalRef}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '16px',
                fontSize: '12px',
                lineHeight: 1.65,
                color: '#334155',
                maxHeight: '380px',
                overflowY: 'auto',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              }}
            >
              {selectedAuditLog.rawLogs && selectedAuditLog.rawLogs.length > 0 ? (
                selectedAuditLog.rawLogs.map((line, i) => {
                  let color = '#334155';
                  let fontWeight = 400;

                  if (line.includes('SUCCESS')) {
                    color = '#059669';
                    fontWeight = 600;
                  } else if (line.includes('FAILED') || line.includes('ABORT') || line.includes('Trigger fired') || line.includes('SAFETY GATE ABORT')) {
                    color = '#E11D48';
                    fontWeight = 600;
                  } else if (line.includes('[K8s API]') || line.includes('[LB Ingress]')) {
                    color = '#0284C7';
                  } else if (line.includes('[SSH Transport]') || line.includes('[SSH Exec]')) {
                    color = '#4F46E5';
                  } else if (line.includes('warn') || line.includes('Pre-flight gate')) {
                    color = '#D97706';
                  }

                  return (
                    <div key={i} style={{ color, fontWeight, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {line}
                    </div>
                  );
                })
              ) : (
                <div style={{ color: '#94A3B8' }}>No logs recorded yet. Listening for streaming output...</div>
              )}

              {selectedAuditLog.status === 'Running' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563EB', marginTop: '6px', fontSize: '11px' }}>
                  <span className="pulse-dot-emerald" style={{ background: '#3B82F6' }} />
                  <span>Remediation worker active — streaming stdout/stderr frames live...</span>
                </div>
              )}
            </div>

            <div style={{ marginTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                Automated audit records are immutably signed and stored in PostgreSQL.
              </span>

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
