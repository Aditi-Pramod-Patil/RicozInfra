import React, { useState } from 'react';
import type { PageView } from '../types';
import { 
  FLEET_METRICS, 
  TIME_SERIES_24H 
} from '../data/mockData';
import { 
  AlertTriangle, 
  ArrowRight, 
  Check, 
  Play, 
  ShieldAlert, 
  Server,
  GitFork
} from 'lucide-react';

interface OverviewViewProps {
  onNavigate: (view: PageView) => void;
  onOpenRunbookModal: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onOpenRunbookModal,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [hoveredPoint, setHoveredPoint] = useState<typeof TIME_SERIES_24H[0] | null>(null);

  // Sparkline points calculation for Fleet Avg CPU Load card (clean minimalist slate stroke line)
  const sparkPoints = [38, 35, 34, 40, 46, 51, 53, 55, 88, 62, 49, 44, 42, 41];
  const minSpark = 30;
  const maxSpark = 95;
  const svgSparkWidth = 140;
  const svgSparkHeight = 32;

  const sparklineD = sparkPoints.map((val, idx) => {
    const x = (idx / (sparkPoints.length - 1)) * svgSparkWidth;
    const y = svgSparkHeight - ((val - minSpark) / (maxSpark - minSpark)) * svgSparkHeight;
    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  // Full-width 24h chart dimensions
  const chartWidth = 1000;
  const chartHeight = 240;
  const padX = 40;
  const padY = 30;
  const plotWidth = chartWidth - padX * 2;
  const plotHeight = chartHeight - padY * 2;
  const maxVal = 160; // Max throughput Gbps

  // Line points for clean slate-700 stroke line
  const linePoints = TIME_SERIES_24H.map((pt, idx) => {
    const x = padX + (idx / (TIME_SERIES_24H.length - 1)) * plotWidth;
    const y = padY + plotHeight - (pt.throughputGbps / maxVal) * plotHeight;
    return { x, y, pt };
  });

  const linePathD = linePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPathD = `${linePathD} L ${padX + plotWidth} ${padY + plotHeight} L ${padX} ${padY + plotHeight} Z`;

  // Marker for incident at 14:18 UTC (point index 8 in mock data)
  const incidentPoint = linePoints.find(p => p.pt.isIncidentMarker) || linePoints[8];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 1. Correlated Incident Alert Banner */}
      <section className="incident-banner">
        <div className="incident-banner-left">
          <span className="incident-tag-p1">P1 CRITICAL</span>
          <div>
            <div className="incident-banner-title">
              <ShieldAlert size={16} color="#E11D48" />
              <span>Incident #INC-9402: Upstream Gateway Drop</span>
              {acknowledged && (
                <span className="metric-pill-emerald" style={{ marginLeft: '6px' }}>
                  <Check size={11} /> Ack'd
                </span>
              )}
            </div>
            <div className="incident-banner-desc">
              12 downstream pod alerts collapsed under 1 root cause: socket pool exhaustion on prod-edge-gw-01 (99.4% ML confidence)
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

      {/* 2. 4 Key Metric Cards (Row layout, spacious white cards with subtle slate-200 border) */}
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
            <span className="metric-pill-emerald">
              <span className="pulse-dot-emerald" />
              <span>Nominal</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.03em' }}>
              {FLEET_METRICS.activeNodes.toLocaleString()}
            </span>
            <span style={{ fontSize: '15px', fontWeight: 400, color: '#94A3B8' }}>
              / {FLEET_METRICS.totalNodes.toLocaleString()}
            </span>
          </div>

          <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748B' }}>
            <span>99.72% operational capacity</span>
            <span style={{ color: '#94A3B8', marginLeft: '6px' }}>• 4 standby nodes</span>
          </div>
        </div>

        {/* Metric 2: Fleet Avg CPU Load */}
        <div className="card-white" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Fleet Avg CPU Load
            </span>
            <span className="metric-pill-slate">
              <span>±3.8% σ</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.03em' }}>
                {FLEET_METRICS.avgCpuLoad}%
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                Peak: <strong style={{ color: '#0F172A', fontWeight: 600 }}>{FLEET_METRICS.cpuPeak}%</strong> (prod-edge-gw-01)
              </div>
            </div>

            {/* Clean minimalist slate stroke line sparkline */}
            <svg width={svgSparkWidth} height={svgSparkHeight} style={{ overflow: 'visible' }}>
              <path
                d={sparklineD}
                fill="none"
                stroke="#64748B"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={svgSparkWidth}
                cy={svgSparkHeight - ((sparkPoints[sparkPoints.length - 1] - minSpark) / (maxSpark - minSpark)) * svgSparkHeight}
                r="3"
                fill="#334155"
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
              <span>BGP Edge Mesh</span>
            </span>
          </div>

          <div style={{ fontSize: '28px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.03em' }}>
            {FLEET_METRICS.totalThroughputGbps} <span style={{ fontSize: '18px', fontWeight: 500, color: '#64748B' }}>Gbps</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '12px', fontSize: '12px', color: '#64748B' }}>
            <div>
              <span style={{ color: '#94A3B8' }}>Rx: </span>
              <strong style={{ color: '#0F172A', fontWeight: 600 }}>82.0 Gbps</strong>
            </div>
            <span style={{ color: '#CBD5E1' }}>•</span>
            <div>
              <span style={{ color: '#94A3B8' }}>Tx: </span>
              <strong style={{ color: '#0F172A', fontWeight: 600 }}>66.6 Gbps</strong>
            </div>
          </div>
        </div>

        {/* Metric 4: Correlated Incidents */}
        <div className="card-white" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Correlated Incidents
            </span>
            <span className="metric-pill-crimson">
              <span className="pulse-dot-crimson" />
              <span>1 Active P1</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 600, color: '#E11D48', letterSpacing: '-0.03em' }}>
              1
            </span>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              Active Critical Outage
            </span>
          </div>

          <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748B' }}>
            <span>12 alerts grouped under root cause</span>
          </div>
        </div>
      </section>

      {/* 3. 24-Hour Fleet Health Chart */}
      <section className="card-white" style={{ padding: '28px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
              24-Hour Fleet Health & Workload Ingestion
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
              Continuous fleet ingress and throughput monitoring across 1,428 hosts with ML anomaly correlation.
            </p>
          </div>

          {/* Timeframe Selector Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F8FAFC', padding: '3px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            {(['1h', '6h', '24h', '7d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: selectedTimeframe === tf ? 600 : 500,
                  color: selectedTimeframe === tf ? '#0F172A' : '#64748B',
                  background: selectedTimeframe === tf ? '#FFFFFF' : 'transparent',
                  boxShadow: selectedTimeframe === tf ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Chart Container */}
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style={{ width: '100%', height: 'auto', display: 'block', minWidth: '700px' }}
          >
            <defs>
              <linearGradient id="lightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#334155" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#334155" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle Light-Gray Grid Lines (#F1F5F9) */}
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
                    y={y + 3.5}
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

            {/* Area Fill */}
            <path d={areaPathD} fill="url(#lightAreaGrad)" />

            {/* Single Clean Slate-700 Stroke Line representing workload ingestion */}
            <path
              d={linePathD}
              fill="none"
              stroke="#334155"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Single Vertical Marker at 14:18 UTC indicating incident anomaly */}
            {incidentPoint && (
              <g>
                <line
                  x1={incidentPoint.x}
                  y1={padY}
                  x2={incidentPoint.x}
                  y2={padY + plotHeight}
                  stroke="#E11D48"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Anomaly Badge */}
                <rect
                  x={incidentPoint.x - 52}
                  y={padY - 22}
                  width="104"
                  height="20"
                  rx="4"
                  fill="#FFF1F2"
                  stroke="#FECDD3"
                  strokeWidth="1"
                />
                <text
                  x={incidentPoint.x}
                  y={padY - 9}
                  fill="#E11D48"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  14:18 UTC • Anomaly
                </text>

                {/* Pulsing incident point */}
                <circle
                  cx={incidentPoint.x}
                  cy={incidentPoint.y}
                  r="5"
                  fill="#E11D48"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              </g>
            )}

            {/* Hover Circles and Time Labels */}
            {linePoints.map((p, idx) => (
              <g key={idx}>
                {/* Time Axis Labels */}
                <text
                  x={p.x}
                  y={chartHeight - 8}
                  fontSize="10"
                  fill="#94A3B8"
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {p.pt.time}
                </text>

                {/* Hover trigger circle */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="12"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(p.pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* Interactive indicator dot on hover */}
                {hoveredPoint?.time === p.pt.time && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="#0F172A"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                )}
              </g>
            ))}
          </svg>

          {/* Interactive Tooltip Popover */}
          {hoveredPoint && (
            <div
              className="chart-tooltip-popover"
              style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A' }}>
                  {hoveredPoint.time} UTC
                </span>
                {hoveredPoint.isIncidentMarker && (
                  <span className="metric-pill-crimson" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    Incident Spike
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#475569' }}>
                Throughput: <strong style={{ color: '#0F172A', fontWeight: 600 }}>{hoveredPoint.throughputGbps} Gbps</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#475569' }}>
                Fleet Load: <strong style={{ color: '#0F172A', fontWeight: 600 }}>{hoveredPoint.loadAvg}%</strong>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Bottom Quick Jump Cards: Clean white tiles with subtle hover lift */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {/* Quick Jump 1: Topology Map */}
        <div 
          className="card-white" 
          onClick={() => onNavigate('topology')}
          style={{ padding: '24px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0F172A'
              }}>
                <GitFork size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '14.5px', fontWeight: 600, color: '#0F172A' }}>
                  Topology Map
                </h3>
                <span style={{ fontSize: '11.5px', color: '#64748B' }}>5 Tiers • Ingress to Data</span>
              </div>
            </div>
            <ArrowRight size={16} style={{ color: '#94A3B8' }} />
          </div>
          <p style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.5 }}>
            Inspect full traffic pathways and degraded crimson links between prod-edge-gw-01 and downstream Kubernetes pods.
          </p>
        </div>

        {/* Quick Jump 2: Host Inventory */}
        <div 
          className="card-white" 
          onClick={() => onNavigate('hosts')}
          style={{ padding: '24px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0F172A'
              }}>
                <Server size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '14.5px', fontWeight: 600, color: '#0F172A' }}>
                  Host Inventory
                </h3>
                <span style={{ fontSize: '11.5px', color: '#64748B' }}>1,428 Monitored Instances</span>
              </div>
            </div>
            <ArrowRight size={16} style={{ color: '#94A3B8' }} />
          </div>
          <p style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.5 }}>
            Filter by Bare-Metal, VMware ESXi, and Kubernetes. Open 420px slide-over inspector drawer to launch SSH console.
          </p>
        </div>

        {/* Quick Jump 3: Incident War Room */}
        <div 
          className="card-white" 
          onClick={() => onNavigate('incidents')}
          style={{ padding: '24px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#FFF1F2',
                border: '1px solid #FECDD3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#E11D48'
              }}>
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '14.5px', fontWeight: 600, color: '#0F172A' }}>
                  Incident War Room
                </h3>
                <span style={{ fontSize: '11.5px', color: '#E11D48', fontWeight: 600 }}>#INC-9402 P1 Active</span>
              </div>
            </div>
            <ArrowRight size={16} style={{ color: '#94A3B8' }} />
          </div>
          <p style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.5 }}>
            Review 99.4% confidence ML alert deduplication, blast radius matrix, and execute autonomous self-healing runbook.
          </p>
        </div>
      </section>
    </div>
  );
};
