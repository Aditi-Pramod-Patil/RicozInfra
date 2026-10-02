import React, { useState } from 'react';
import { PRIMARY_INCIDENT } from '../data/mockData';
import { 
  Play, 
  Sparkles, 
  ChevronRight
} from 'lucide-react';

interface IncidentsViewProps {
  onOpenRunbookModal: () => void;
  onNavigateToHosts: () => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  onOpenRunbookModal,
  onNavigateToHosts,
}) => {
  const [selectedIncident] = useState(PRIMARY_INCIDENT);
  const [ruleEnabled, setRuleEnabled] = useState(true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 1. Incident Header Card with correlation details (12 alerts grouped, 99.4% confidence) */}
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
                <span>99.4% Correlation Confidence</span>
              </span>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                Duration: {selectedIncident.duration} (Started {selectedIncident.startTime})
              </span>
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Incident #{selectedIncident.id}: {selectedIncident.title}
            </h1>

            <p style={{ fontSize: '13px', color: '#475569', marginTop: '6px', maxWidth: '850px', lineHeight: 1.5 }}>
              <strong>ML Correlation Engine:</strong> 12 downstream pod alerts collapsed under 1 root cause. {selectedIncident.rootCause}
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

        {/* 12 Alerts Grouped Banner */}
        <div
          style={{
            marginTop: '16px',
            padding: '10px 14px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={14} color="#E11D48" />
            <span style={{ color: '#0F172A', fontWeight: 600 }}>12 Alarms Suppressed & Grouped:</span>
            <span style={{ color: '#64748B' }}>
              Downstream 504 Gateway Timeouts on billing-pipeline and auth-service collapsed into single root cause.
            </span>
          </div>
          <span style={{ color: '#E11D48', fontWeight: 600 }}>12 / 12 Deduplicated</span>
        </div>
      </section>

      {/* 2. Key Telemetry Vitals: P99 Latency (2,410ms), Downstream Error Rate (18.4%), Ingress Bandwidth (4.2 Gbps) */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        {/* Vital 1: P99 Latency */}
        <div className="card-white" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              P99 End-to-End Latency
            </span>
            <span className="metric-pill-crimson">+5,638% Spike</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 600, color: '#E11D48', letterSpacing: '-0.03em' }}>
              2,410
            </span>
            <span style={{ fontSize: '16px', fontWeight: 500, color: '#64748B' }}>ms</span>
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748B' }}>
            Baseline Nominal: <strong style={{ color: '#0F172A', fontWeight: 500 }}>42 ms</strong>
          </div>
        </div>

        {/* Vital 2: Downstream Error Rate */}
        <div className="card-white" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Downstream Error Rate
            </span>
            <span className="metric-pill-crimson">HTTP 504 Gateway Timeouts</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 600, color: '#E11D48', letterSpacing: '-0.03em' }}>
              18.4
            </span>
            <span style={{ fontSize: '16px', fontWeight: 500, color: '#64748B' }}>%</span>
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748B' }}>
            Baseline Nominal: <strong style={{ color: '#0F172A', fontWeight: 500 }}>&lt; 0.02%</strong>
          </div>
        </div>

        {/* Vital 3: Ingress Bandwidth */}
        <div className="card-white" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Ingress Bandwidth
            </span>
            <span className="metric-pill-slate">Throttled via eBPF</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.03em' }}>
              4.2
            </span>
            <span style={{ fontSize: '16px', fontWeight: 500, color: '#64748B' }}>Gbps</span>
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748B' }}>
            Nominal Capacity: <strong style={{ color: '#0F172A', fontWeight: 500 }}>12.8 Gbps</strong>
          </div>
        </div>
      </section>

      {/* 3. Telemetry Anomaly Timeline: Step-by-step chronological audit log with clean vertical connecting line */}
      <section className="card-white" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
          Telemetry & Anomaly Timeline
        </h2>
        <p style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '24px' }}>
          Chronological audit of telemetry breaches, socket buffer saturation, and ML correlation.
        </p>

        <div style={{ position: 'relative', paddingLeft: '28px' }}>
          {/* Clean Vertical Connecting Line (#E2E8F0) */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              bottom: '8px',
              left: '11px',
              width: '2px',
              background: '#E2E8F0',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {selectedIncident.timeline.map((step, idx) => {
              const isMilestone = step.isMilestone;
              const isCritical = step.level === 'critical';

              return (
                <div key={idx} style={{ position: 'relative' }}>
                  {/* Timeline Node Marker */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-28px',
                      top: '2px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: isMilestone ? '#FFF1F2' : '#FFFFFF',
                      border: isCritical ? '2px solid #E11D48' : isMilestone ? '2px solid #E11D48' : '2px solid #94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: isCritical || isMilestone ? '#E11D48' : '#94A3B8',
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
                        {step.time}
                      </span>
                      {isMilestone && (
                        <span className="metric-pill-crimson" style={{ fontSize: '10px', padding: '1px 6px' }}>
                          ML MILESTONE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A', marginTop: '3px' }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px', lineHeight: 1.5 }}>
                      {step.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Blast Radius Matrix: Clean list showing impacted microservices versus healthy isolated clusters */}
      <section className="card-white" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
          Blast Radius Matrix
        </h2>
        <p style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '20px' }}>
          Real-time impact boundary showing degraded downstream dependencies versus isolated healthy clusters.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {selectedIncident.blastRadius.map((item, idx) => {
            const isImpacted = item.status === 'impacted';

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: isImpacted ? '#FFF1F2' : '#F8FAFC',
                  border: isImpacted ? '1px solid #FECDD3' : '1px solid #E2E8F0',
                  borderRadius: '8px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={isImpacted ? 'pulse-dot-crimson' : 'pulse-dot-emerald'} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                      {item.service}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                      Namespace: <strong>{item.namespace}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '12px', color: isImpacted ? '#E11D48' : '#475569', fontWeight: 500 }}>
                    {item.impactDetail}
                  </span>
                  <span className={isImpacted ? 'metric-pill-crimson' : 'metric-pill-emerald'}>
                    {isImpacted ? 'IMPACTED' : 'ISOLATED & HEALTHY'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Autonomous Self-Healing Card: Trigger rule and execution stats */}
      <section className="card-white" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
              Autonomous Self-Healing Policy
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
              Pre-configured closed-loop remediation policy evaluated by ML correlation engine.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Policy Active</span>
            <input
              type="checkbox"
              checked={ruleEnabled}
              onChange={() => setRuleEnabled(!ruleEnabled)}
              style={{ accentColor: '#10B981', cursor: 'pointer', width: '16px', height: '16px' }}
            />
          </div>
        </div>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#0F172A',
            }}>
              WHEN CPU &gt; 90% FOR 5m
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>THEN</span>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#0F172A',
            }}>
              Drain &amp; Route to Warm Standby (prod-edge-gw-03)
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0', fontSize: '12px', color: '#475569', flexWrap: 'wrap' }}>
            <div>
              Historical Reliability: <strong style={{ color: '#0F172A', fontWeight: 600 }}>4/4 Success (100%)</strong>
            </div>
            <div>
              Mean Time to Remediation: <strong style={{ color: '#10B981', fontWeight: 600 }}>18s MTTR</strong>
            </div>
            <div>
              Last Triggered: <span style={{ color: '#64748B' }}>3d ago on us-east-cluster-02 (0 packet loss)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
