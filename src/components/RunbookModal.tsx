import React, { useState } from 'react';
import { X, Play, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { PRIMARY_INCIDENT } from '../data/mockData';

interface RunbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RunbookModal: React.FC<RunbookModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>([
    '[PRE-CHECK] Validating runbook signature: RB-AUTOSCALE-EDGE-09 (SHA256 verified)',
    '[TOPOLOGY] Target node identified: prod-edge-gw-01 (10.240.12.84)',
    '[STANDBY] Warm standby node ping check: prod-edge-gw-03 (10.240.12.86) - 0.2ms latency (READY)',
  ]);
  const [completed, setCompleted] = useState(false);

  if (!isOpen) return null;

  const steps = [
    { title: 'Pre-flight Validation', desc: 'Verify health of standby target prod-edge-gw-03' },
    { title: 'Drain Active Sockets', desc: 'Signal Envoy graceful socket drain (30s window)' },
    { title: 'BGP Route Convergence', desc: 'Inflate MED metric on primary; announce standby' },
    { title: 'Telemetry Confirmation', desc: 'Verify 0 dropped packets on downstream billing-pipeline' },
    { title: 'Close Out Incident', desc: 'Update ML correlation engine and mark INC-9402 Mitigated' },
  ];

  const handleStartExecution = () => {
    setIsRunning(true);
    setCompleted(false);

    // Simulate step 1
    setTimeout(() => {
      setStepIndex(1);
      setLogs((prev) => [
        ...prev,
        '[STEP 1/5] Initiating Envoy graceful connection drain: SIGUSR1 sent to PID 1402',
        '[DRAIN] Active sockets dropping: 14,892 -> 8,420 -> 1,120',
      ]);
    }, 1200);

    // Step 2
    setTimeout(() => {
      setStepIndex(2);
      setLogs((prev) => [
        ...prev,
        '[STEP 2/5] Announcing BGP Anycast route 10.240.12.86 via AS65001 to spine switches',
        '[BGP] Convergence achieved in 1.4s across all leaf routers',
      ]);
    }, 2600);

    // Step 3
    setTimeout(() => {
      setStepIndex(3);
      setLogs((prev) => [
        ...prev,
        '[STEP 3/5] Sampling downstream billing-pipeline pods: 0 HTTP 504 errors in last 5,000 requests',
        '[METRICS] Ingress P99 latency dropped from 2,410ms -> 38ms',
      ]);
    }, 4000);

    // Step 4
    setTimeout(() => {
      setStepIndex(4);
      setIsRunning(false);
      setCompleted(true);
      setLogs((prev) => [
        ...prev,
        '[STEP 4/5] Autonomous runbook execution completed successfully (MTTR: 18.2s)',
        '[SUCCESS] #INC-9402 status updated to Mitigated. Standby active.',
      ]);
      if (onSuccess) onSuccess();
    }, 5400);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-card"
        style={{
          width: '720px',
          maxWidth: '92vw',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#10B981" />
            <strong style={{ fontSize: '14px', color: '#0F172A' }}>
              Autonomous Remediation Runbook: RB-AUTOSCALE-EDGE-09
            </strong>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '22px' }}>
          <div style={{
            background: '#FFF1F2',
            border: '1px solid #FECDD3',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '18px',
            fontSize: '12px',
            color: '#475569',
          }}>
            <strong style={{ color: '#E11D48' }}>Incident Linked:</strong> #{PRIMARY_INCIDENT.id} — {PRIMARY_INCIDENT.title}
            <div style={{ marginTop: '2px', color: '#64748B' }}>
              Target: <strong style={{ color: '#0F172A' }}>{PRIMARY_INCIDENT.targetNode}</strong> • Action: Drain sockets &amp; route traffic to warm standby.
            </div>
          </div>

          {/* 5 Progress Steps */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '10px', textTransform: 'uppercase' }}>
              Execution Stages
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {steps.map((st, idx) => {
                const isCurrent = isRunning && stepIndex === idx;
                const isDone = completed || (isRunning && stepIndex > idx);

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: isCurrent ? '#F8FAFC' : isDone ? '#ECFDF5' : '#FFFFFF',
                      border: isCurrent ? '1px solid #0F172A' : isDone ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isDone ? (
                        <CheckCircle2 size={16} color="#10B981" />
                      ) : isCurrent ? (
                        <Loader2 size={16} className="animate-spin" color="#0F172A" />
                      ) : (
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: '1.5px solid #CBD5E1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#94A3B8',
                          fontWeight: 600,
                        }}>
                          {idx + 1}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0F172A' }}>
                          {st.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          {st.desc}
                        </div>
                      </div>
                    </div>

                    <span style={{ fontSize: '11px', fontWeight: 500, color: isDone ? '#059669' : isCurrent ? '#0F172A' : '#94A3B8' }}>
                      {isDone ? 'Completed' : isCurrent ? 'Running...' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Execution Log Stream */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase' }}>
              Remediation Log Stream
            </div>
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '12px',
              height: '150px',
              overflowY: 'auto',
              fontSize: '11.5px',
              lineHeight: 1.6,
              color: '#334155',
            }}>
              {logs.map((lg, i) => (
                <div key={i} style={{ color: lg.includes('[SUCCESS]') ? '#059669' : lg.includes('[STEP') ? '#0F172A' : '#64748B' }}>
                  {lg}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
            Requires automated approval token • MTTR goal: &lt; 20s
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-slate-secondary" onClick={onClose}>
              Close
            </button>
            <button
              className="btn-crimson-primary"
              disabled={isRunning || completed}
              onClick={handleStartExecution}
              style={{ opacity: isRunning || completed ? 0.6 : 1 }}
            >
              {isRunning ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Executing...</span>
                </>
              ) : completed ? (
                <>
                  <CheckCircle2 size={13} />
                  <span>Remediated</span>
                </>
              ) : (
                <>
                  <Play size={13} />
                  <span>Execute Auto-Runbook Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
