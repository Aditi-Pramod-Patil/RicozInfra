import React, { useState } from 'react';
import type { PageView } from '../types';
import { useFleet } from '../context/FleetContext';
import { useAuth } from '../context/AuthContext';
import { AddHostModal } from '../components/AddHostModal';
import { 
  AlertTriangle, 
  ArrowRight, 
  Check, 
  Play, 
  ShieldAlert, 
  Server,
  GitFork,
  Terminal,
  Copy,
  Plus
} from 'lucide-react';

interface OverviewViewProps {
  onNavigate: (view: PageView) => void;
  onOpenRunbookModal: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onOpenRunbookModal,
}) => {
  const { hosts, activeIncidents, metricsData, isZeroState, simulateAgentConnect, resetToZeroState, loadRealFleetData } = useFleet();
  const { organization } = useAuth();
  const [acknowledged, setAcknowledged] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [isAddHostModalOpen, setIsAddHostModalOpen] = useState(false);

  const apiKey = organization?.apiKey || 'rcz_live_production_key_sample';
  const curlCommand = `curl -sSL https://get.ricozinfra.com/install.sh | sudo bash -s -- --token=${apiKey}`;

  const copySnippet = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  // Sparkline data
  const sparkPoints = isZeroState ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] : [38, 35, 34, 40, 46, 51, 53, 55, 88, 62, 49, 44, 42, 41];
  const minSpark = 0;
  const maxSpark = 100;
  const svgSparkWidth = 140;
  const svgSparkHeight = 32;

  const sparklineD = sparkPoints.map((val, idx) => {
    const x = (idx / (sparkPoints.length - 1)) * svgSparkWidth;
    const y = svgSparkHeight - ((val - minSpark) / (maxSpark - minSpark)) * svgSparkHeight;
    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  // Full-width chart dimensions
  const chartWidth = 1000;
  const chartHeight = 240;
  const padX = 40;
  const padY = 30;
  const plotWidth = chartWidth - padX * 2;
  const plotHeight = chartHeight - padY * 2;
  const maxVal = 160;

  const activePoints = metricsData.length > 0 ? metricsData : [
    { time: '00:00', hour: 0, loadAvg: 0, throughputGbps: 0, ingressRate: 0, packetDropRate: 0 },
    { time: '06:00', hour: 6, loadAvg: 0, throughputGbps: 0, ingressRate: 0, packetDropRate: 0 },
    { time: '12:00', hour: 12, loadAvg: 0, throughputGbps: 0, ingressRate: 0, packetDropRate: 0 },
    { time: '18:00', hour: 18, loadAvg: 0, throughputGbps: 0, ingressRate: 0, packetDropRate: 0 },
    { time: '24:00', hour: 24, loadAvg: 0, throughputGbps: 0, ingressRate: 0, packetDropRate: 0 },
  ];

  const linePoints = activePoints.map((pt, idx) => {
    const x = padX + (idx / (activePoints.length - 1)) * plotWidth;
    const y = padY + plotHeight - (pt.throughputGbps / maxVal) * plotHeight;
    return { x, y, pt };
  });

  const linePathD = linePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPathD = `${linePathD} L ${padX + plotWidth} ${padY + plotHeight} L ${padX} ${padY + plotHeight} Z`;

  const activeIncident = activeIncidents[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 1. ONBOARDING EMPTY STATE BANNER (When zero hosts are connected) */}
      {isZeroState ? (
        <section className="bg-white border border-slate-200 rounded-xl p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Zero Infrastructure Connected Yet
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                No Infrastructure Connected Yet
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Deploy the RicozInfra telemetry collector daemon to your first server or Kubernetes cluster to stream real-time metrics.
              </p>

              {/* Command snippet with one-click copy */}
              <div className="pt-2">
                <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-2.5 sm:p-3 text-white text-xs max-w-xl font-sans">
                  <Terminal size={14} className="text-slate-400 shrink-0" />
                  <code className="text-slate-200 overflow-x-auto whitespace-nowrap select-all font-sans text-xs flex-1">
                    {curlCommand}
                  </code>
                  <button
                    onClick={copySnippet}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    title="Copy to clipboard"
                  >
                    {copiedSnippet ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              <button
                onClick={() => setIsAddHostModalOpen(true)}
                className="btn-crimson-primary text-xs justify-center"
              >
                <Plus size={14} />
                <span>Add First Host / Download Agent</span>
              </button>

              <button
                onClick={simulateAgentConnect}
                className="btn-slate-secondary text-xs justify-center"
                title="Connect an active agent with real-time heartbeat"
              >
                <Play size={12} className="text-emerald-500" />
                <span>Simulate Agent Connection</span>
              </button>

              <button
                onClick={loadRealFleetData}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors text-center"
              >
                Inspect Populated Fleet Demo
              </button>
            </div>
          </div>
        </section>
      ) : activeIncident ? (
        /* Active Incident Banner (Shown only when real incident exists) */
        <section className="incident-banner">
          <div className="incident-banner-left">
            <span className="incident-tag-p1">P1 CRITICAL</span>
            <div>
              <div className="incident-banner-title">
                <ShieldAlert size={16} color="#E11D48" />
                <span>Incident #{activeIncident.id}: {activeIncident.title}</span>
                {acknowledged && (
                  <span className="metric-pill-emerald" style={{ marginLeft: '6px' }}>
                    <Check size={11} /> Ack'd
                  </span>
                )}
              </div>
              <div className="incident-banner-desc">
                {activeIncident.rootCause} (99.4% ML confidence)
              </div>
            </div>
          </div>

          <div className="incident-actions">
            <button 
              className="btn-crimson-primary" 
              onClick={() => onNavigate('incidents')}
            >
              <AlertTriangle size={13} />
              <span>Open Incident War Room</span>
            </button>

            <button 
              className="btn-slate-secondary" 
              onClick={onOpenRunbookModal}
            >
              <Play size={13} color="#10B981" />
              <span>Auto-Runbook Ready</span>
            </button>

            <button 
              className={acknowledged ? "btn-ghost-muted" : "btn-slate-secondary"}
              onClick={() => setAcknowledged(!acknowledged)}
            >
              {acknowledged ? (
                <>
                  <Check size={13} color="#10B981" />
                  <span>Ack'd</span>
                </>
              ) : (
                <span>Acknowledge</span>
              )}
            </button>
          </div>
        </section>
      ) : (
        /* Positive Empty State: All Systems Operational */
        <section className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Check size={16} />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span>All Systems Operational</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Zero active P1/P2 incidents detected across {hosts.length} monitored hosts.
              </div>
            </div>
          </div>

          <button
            onClick={resetToZeroState}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Reset to Zero State
          </button>
        </section>
      )}

      {/* 2. 4 Key Metric Cards (Dynamic Zero-Data or Live Data) */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '24px'
      }}>
        {/* Metric 1: Fleet Nodes Active */}
        <div className="card-white" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Fleet Nodes Active
            </span>
            {isZeroState ? (
              <span className="metric-pill-slate">
                <span>Awaiting Agent</span>
              </span>
            ) : (
              <span className="metric-pill-emerald">
                <span className="pulse-dot-emerald" />
                <span>Nominal</span>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.03em' }}>
              {isZeroState ? '0' : hosts.length.toLocaleString()}
            </span>
            <span style={{ fontSize: '15px', fontWeight: 400, color: '#94A3B8' }}>
              / {isZeroState ? '0' : hosts.length.toLocaleString()}
            </span>
          </div>

          <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748B' }}>
            {isZeroState ? (
              <span>0 Active Nodes registered</span>
            ) : (
              <span>100% operational capacity • 0 unreachable</span>
            )}
          </div>
        </div>

        {/* Metric 2: Fleet Avg CPU Load */}
        <div className="card-white" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Fleet Avg CPU Load
            </span>
            <span className="metric-pill-slate">
              <span>{isZeroState ? 'No Telemetry' : '±3.8% σ'}</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.03em' }}>
                {isZeroState ? '—' : `${hosts[0]?.cpuLoad || 44.6}%`}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                {isZeroState ? 'Awaiting metrics stream' : `Peak: ${hosts[0]?.cpuLoad || 44.6}% (${hosts[0]?.hostname || 'node-01'})`}
              </div>
            </div>

            {/* Clean minimalist slate stroke line sparkline */}
            <svg width={svgSparkWidth} height={svgSparkHeight} style={{ overflow: 'visible' }}>
              <path
                d={sparklineD}
                fill="none"
                stroke="#94A3B8"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Metric 3: Total Throughput */}
        <div className="card-white" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Total Throughput
            </span>
            <span className="metric-pill-slate">
              <span>{isZeroState ? 'Zero Ingress' : 'BGP Edge Mesh'}</span>
            </span>
          </div>

          <div style={{ fontSize: '28px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.03em' }}>
            {isZeroState ? '0.0' : (hosts[0]?.rxGbps ? `${(hosts[0].rxGbps + (hosts[0].txGbps || 0)).toFixed(1)}` : '148.6')}{' '}
            <span style={{ fontSize: '18px', fontWeight: 500, color: '#64748B' }}>Gbps</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '12px', fontSize: '12px', color: '#64748B' }}>
            <div>
              <span style={{ color: '#94A3B8' }}>Rx: </span>
              <strong style={{ color: '#0F172A', fontWeight: 600 }}>{isZeroState ? '—' : '82.0 Gbps'}</strong>
            </div>
            <span style={{ color: '#CBD5E1' }}>•</span>
            <div>
              <span style={{ color: '#94A3B8' }}>Tx: </span>
              <strong style={{ color: '#0F172A', fontWeight: 600 }}>{isZeroState ? '—' : '66.6 Gbps'}</strong>
            </div>
          </div>
        </div>

        {/* Metric 4: Correlated Incidents */}
        <div className="card-white" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Correlated Incidents
            </span>
            {activeIncidents.length > 0 ? (
              <span className="metric-pill-crimson">
                <span className="pulse-dot-crimson" />
                <span>{activeIncidents.length} Active</span>
              </span>
            ) : (
              <span className="metric-pill-emerald">
                <span className="pulse-dot-emerald" />
                <span>Nominal</span>
              </span>
            )}
          </div>

          <div style={{ fontSize: '28px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.03em' }}>
            {activeIncidents.length}{' '}
            <span style={{ fontSize: '18px', fontWeight: 400, color: '#94A3B8' }}>Active</span>
          </div>

          <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748B' }}>
            {activeIncidents.length > 0 ? '12 downstream alerts collapsed' : 'Zero outages across registered nodes'}
          </div>
        </div>
      </section>

      {/* 3. 24-Hour Fleet Health & Workload Ingestion Chart */}
      <section className="card-white" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
              Fleet Telemetry &amp; Workload Ingestion ({selectedTimeframe})
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '3px' }}>
              {isZeroState
                ? 'Awaiting first telemetry heartbeat from installed collector agents.'
                : 'Continuous telemetry ingestion across registered hosts with ML anomaly correlation.'}
            </p>
          </div>

          {/* Timeframe pill selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '3px'
          }}>
            {(['1h', '6h', '24h', '7d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: selectedTimeframe === tf ? 600 : 500,
                  color: selectedTimeframe === tf ? '#0F172A' : '#64748B',
                  background: selectedTimeframe === tf ? '#F1F5F9' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Chart Canvas */}
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <linearGradient id="ingressGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#334155" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#334155" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 40, 80, 120, 160].map((val) => {
              const y = padY + plotHeight - (val / maxVal) * plotHeight;
              return (
                <g key={val}>
                  <line
                    x1={padX}
                    y1={y}
                    x2={chartWidth - padX}
                    y2={y}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                  />
                  <text
                    x={padX - 10}
                    y={y + 4}
                    fontSize="10"
                    fill="#94A3B8"
                    textAnchor="end"
                    fontWeight="500"
                  >
                    {val}G
                  </text>
                </g>
              );
            })}

            {isZeroState ? (
              /* Flat baseline when zero data */
              <>
                <line
                  x1={padX}
                  y1={padY + plotHeight}
                  x2={chartWidth - padX}
                  y2={padY + plotHeight}
                  stroke="#CBD5E1"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <text
                  x={chartWidth / 2}
                  y={chartHeight / 2}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="13"
                  fontWeight="500"
                >
                  Awaiting first telemetry heartbeat...
                </text>
              </>
            ) : (
              /* Real or simulated data line */
              <>
                <path d={areaPathD} fill="url(#ingressGradient)" />
                <path
                  d={linePathD}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* X-axis time labels */}
            {linePoints.map((p, idx) => (
              <text
                key={idx}
                x={p.x}
                y={chartHeight - 8}
                fontSize="10"
                fill="#94A3B8"
                textAnchor="middle"
                fontWeight="500"
              >
                {p.pt.time}
              </text>
            ))}
          </svg>
        </div>
      </section>

      {/* 4. Quick Jump Cards */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        <div 
          className="card-white" 
          style={{ padding: '24px', cursor: 'pointer' }}
          onClick={() => onNavigate('hosts')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={16} color="#0F172A" />
              <h3 style={{ fontSize: '14.5px', fontWeight: 600, color: '#0F172A' }}>
                Host Inventory
              </h3>
            </div>
            <ArrowRight size={14} color="#94A3B8" />
          </div>
          <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>
            {hosts.length === 0 ? 'No registered nodes yet. Deploy the collector agent.' : `Inspect ${hosts.length} monitored bare-metal servers, VMs, and pods.`}
          </p>
        </div>

        <div 
          className="card-white" 
          style={{ padding: '24px', cursor: 'pointer' }}
          onClick={() => onNavigate('topology')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitFork size={16} color="#0F172A" />
              <h3 style={{ fontSize: '14.5px', fontWeight: 600, color: '#0F172A' }}>
                Topology Map
              </h3>
            </div>
            <ArrowRight size={14} color="#94A3B8" />
          </div>
          <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>
            Interactive 4-tier service mesh tracing ingress routes and dependencies.
          </p>
        </div>

        <div 
          className="card-white" 
          style={{ padding: '24px', cursor: 'pointer' }}
          onClick={() => onNavigate('runbooks')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} color="#0F172A" />
              <h3 style={{ fontSize: '14.5px', fontWeight: 600, color: '#0F172A' }}>
                Autonomous Runbooks
              </h3>
            </div>
            <ArrowRight size={14} color="#94A3B8" />
          </div>
          <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>
            Event-driven self-healing policies mitigating threshold breaches in &lt;200ms.
          </p>
        </div>
      </section>

      {/* Add Host Modal */}
      <AddHostModal
        isOpen={isAddHostModalOpen}
        onClose={() => setIsAddHostModalOpen(false)}
      />
    </div>
  );
};
