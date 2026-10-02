import React from 'react';
import { useFleet } from '../context/FleetContext';
import { 
  Play, 
  ChevronRight,
  CheckCircle2,
  Zap
} from 'lucide-react';

interface IncidentsViewProps {
  onOpenRunbookModal: () => void;
  onNavigateToHosts: () => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  onOpenRunbookModal,
  onNavigateToHosts,
}) => {
  const { activeIncidents, hosts } = useFleet();

  const selectedIncident = activeIncidents[0];

  // 1. POSITIVE EMPTY STATE: When zero active incidents exist
  if (!selectedIncident) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Positive Empty State Card */}
        <section
          className="card-white"
          style={{
            padding: '48px 36px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
            }}
          >
            <CheckCircle2 size={28} />
          </div>

          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="pulse-dot-emerald" />
              <span className="metric-pill-emerald">Nominal Fleet State</span>
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.02em' }}>
              All Systems Operational — 0 Active Incidents
            </h1>

            <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '580px', marginTop: '6px', lineHeight: 1.6 }}>
              The ML correlation engine is listening for telemetry anomalies across your ingress gateways and compute pods.
            </p>
          </div>

          {/* Vitals Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              width: '100%',
              maxWidth: '680px',
              marginTop: '12px',
            }}
          >
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
                Active P1 Outages
              </span>
              <div style={{ fontSize: '22px', fontWeight: 600, color: '#10B981', marginTop: '4px' }}>
                0
              </div>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>Nominal threshold</span>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
                Monitored Hosts
              </span>
              <div style={{ fontSize: '22px', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>
                {hosts.length}
              </div>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>Reporting heartbeats</span>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
                ML Correlation Rules
              </span>
              <div style={{ fontSize: '22px', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>
                12 Active
              </div>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>Sub-200ms evaluation</span>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // 2. Active Incident Layout (Shown when an incident is detected)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 1. Incident Header Card */}
      <section
        className="card-white"
        style={{
          borderLeft: '4px solid #E11D48',
          padding: '24px 28px',
          background: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="metric-pill-crimson">
                <span className="pulse-dot-crimson" />
                <span>P1 CRITICAL ACTIVE</span>
              </span>
              <span className="metric-pill-slate">
                <span>{selectedIncident.confidenceScore}% Correlation Confidence</span>
              </span>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                Duration: {selectedIncident.duration} (Started {selectedIncident.startTime})
              </span>
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Incident #{selectedIncident.id}: {selectedIncident.title}
            </h1>

            <p style={{ fontSize: '13px', color: '#475569', marginTop: '6px', maxWidth: '850px', lineHeight: 1.5 }}>
              <strong>ML Correlation Engine:</strong> {selectedIncident.suppressedCount} downstream pod alerts collapsed under 1 root cause. {selectedIncident.rootCause}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn-crimson-primary" onClick={onOpenRunbookModal} style={{ padding: '8px 16px' }}>
              <Play size={13} />
              <span>Trigger Mitigation Runbook</span>
            </button>
            <button className="btn-slate-secondary" onClick={onNavigateToHosts}>
              <span>Inspect Origin Host</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Vitals & Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="card-white" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '14px' }}>
            Telemetry Vitals
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>p99 Latency:</span>
              <strong style={{ color: '#E11D48' }}>{selectedIncident.vitals.p99LatencyMs} ms</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Error Rate:</span>
              <strong style={{ color: '#E11D48' }}>{selectedIncident.vitals.errorRatePercent}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Ingress Bandwidth:</span>
              <strong style={{ color: '#0F172A' }}>{selectedIncident.vitals.ingressBandwidthGbps} Gbps</strong>
            </div>
          </div>
        </div>

        <div className="card-white" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '14px' }}>
            Target Infrastructure Node
          </h2>
          <div style={{ fontSize: '13px', color: '#0F172A', fontWeight: 600 }}>
            {selectedIncident.targetNode}
          </div>
          <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
            Role: Ingress Reverse Proxy • Region: us-east-1a
          </p>
          <div style={{ marginTop: '16px' }}>
            <button className="btn-slate-secondary" onClick={onOpenRunbookModal} style={{ fontSize: '12px' }}>
              <Zap size={13} color="#E11D48" />
              <span>Simulate Mitigation Workflow</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
