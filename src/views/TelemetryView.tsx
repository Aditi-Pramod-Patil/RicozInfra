import React, { useState } from 'react';
import { 
  AlertTriangle,
  RefreshCw,
  Server
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';

export const TelemetryView: React.FC = () => {
  const { isZeroState } = useFleet();
  const [timeframe, setTimeframe] = useState<'15m' | '1h' | '24h' | '7d'>('24h');
  const [interfaceFilter, setInterfaceFilter] = useState<'all' | 'edge' | 'vpc'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredPointA, setHoveredPointA] = useState<{ time: string; val: number } | null>(null);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  // Interfaces data for Interface & Route Saturation Table
  const allInterfaces = isZeroState ? [] : [
    {
      id: 'if-1',
      name: 'bond0 (Aggregated LACP 40GbE)',
      type: 'edge',
      target: 'us-east-1a Core Leaf Switch',
      mtu: '9000 (Jumbo)',
      rxLoad: '82.0 Gbps',
      rxPercent: 68.3,
      txLoad: '66.6 Gbps',
      txPercent: 55.5,
      droppedPackets: '0 (0.00%)',
      status: 'nominal' as const,
    },
    {
      id: 'if-2',
      name: 'eth0 (Ingress Primary 25GbE)',
      type: 'edge',
      target: 'Cloudflare Transit Anycast AS13335',
      mtu: '1500',
      rxLoad: '21.4 Gbps',
      rxPercent: 85.6,
      txLoad: '14.2 Gbps',
      txPercent: 56.8,
      droppedPackets: '14,892 (1.24%)',
      status: 'critical' as const,
    },
    {
      id: 'if-3',
      name: 'eth1 (Ingress Secondary 25GbE)',
      type: 'edge',
      target: 'Fastly Ingress Fallback AS54113',
      mtu: '1500',
      rxLoad: '12.8 Gbps',
      rxPercent: 51.2,
      txLoad: '10.4 Gbps',
      txPercent: 41.6,
      droppedPackets: '0 (0.00%)',
      status: 'nominal' as const,
    },
    {
      id: 'if-4',
      name: 'vxlan0 (Cilium Overlay Mesh)',
      type: 'vpc',
      target: 'Kubernetes Pod Interconnect (k8s-cluster-alpha)',
      mtu: '9000 (Jumbo)',
      rxLoad: '48.2 Gbps',
      rxPercent: 72.1,
      txLoad: '44.8 Gbps',
      txPercent: 66.8,
      droppedPackets: '42 (0.001%)',
      status: 'nominal' as const,
    },
    {
      id: 'if-5',
      name: 'tgw-peer-01 (AWS Transit Gateway)',
      type: 'vpc',
      target: 'vpc-us-east-1-production (10.240.0.0/16)',
      mtu: '8500',
      rxLoad: '18.6 Gbps',
      rxPercent: 46.5,
      txLoad: '16.2 Gbps',
      txPercent: 40.5,
      droppedPackets: '0 (0.00%)',
      status: 'nominal' as const,
    },
    {
      id: 'if-6',
      name: 'express-route-01 (Azure Interconnect)',
      type: 'vpc',
      target: 'Azure East US Sovereign VNet Mesh',
      mtu: '1500',
      rxLoad: '10.4 Gbps',
      rxPercent: 34.6,
      txLoad: '9.2 Gbps',
      txPercent: 30.6,
      droppedPackets: '0 (0.00%)',
      status: 'nominal' as const,
    },
    {
      id: 'if-7',
      name: 'lo (Kernel Loopback Socket)',
      type: 'all',
      target: '127.0.0.1 / localhost',
      mtu: '65536',
      rxLoad: '4.8 Gbps',
      rxPercent: 12.0,
      txLoad: '4.8 Gbps',
      txPercent: 12.0,
      droppedPackets: '0 (0.00%)',
      status: 'nominal' as const,
    },
  ];

  const filteredInterfaces = allInterfaces.filter((item) => {
    if (interfaceFilter === 'all') return true;
    return item.type === interfaceFilter;
  });

  // Chart A points (Bandwidth throughput over time)
  const chartAPoints = [
    { time: '00:00', val: 98 },
    { time: '03:00', val: 92 },
    { time: '06:00', val: 110 },
    { time: '09:00', val: 138 },
    { time: '12:00', val: 152 },
    { time: '14:18', val: 182, isSpike: true },
    { time: '16:00', val: 142 },
    { time: '18:00', val: 145 },
    { time: '21:00', val: 148 },
    { time: '24:00', val: 136 },
  ];

  const chartAWidth = 520;
  const chartAHeight = 170;
  const padX = 35;
  const padY = 25;
  const plotW = chartAWidth - padX * 2;
  const plotH = chartAHeight - padY * 2;
  const maxGbps = 200;

  const pointsA = chartAPoints.map((pt, idx) => ({
    x: padX + (idx / (chartAPoints.length - 1)) * plotW,
    y: padY + plotH - (pt.val / maxGbps) * plotH,
    pt,
  }));

  const lineAD = pointsA.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaAD = `${lineAD} L ${padX + plotW} ${padY + plotH} L ${padX} ${padY + plotH} Z`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 1. Header with Timeframe selector & Interface Filter */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0F172A' }}>
            Network Performance &amp; Ingress Telemetry
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
            Sub-millisecond packet metrics, regional interface saturation, and BGP route stability.
          </p>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Timeframe Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '3px',
          }}>
            {(['15m', '1h', '24h', '7d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: timeframe === tf ? 600 : 500,
                  color: timeframe === tf ? '#0F172A' : '#64748B',
                  background: timeframe === tf ? '#F1F5F9' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Interface Filter Dropdown */}
          <select
            value={interfaceFilter}
            onChange={(e) => setInterfaceFilter(e.target.value as any)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: '12.5px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Ingress Interfaces</option>
            <option value="edge">Edge Gateways Only</option>
            <option value="vpc">VPC Peering &amp; Mesh</option>
          </select>

          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            className="btn-slate-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Key Network KPI Cards (Row layout, soft-gray surfaces #F8FAFC, clean hairline border) */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
      }}>
        {/* KPI 1: Aggregate Throughput */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Aggregate Throughput
            </span>
            <span className="metric-pill-slate">
              <span>{isZeroState ? 'No Ingress' : 'Peak: 182.4 Gbps'}</span>
            </span>
          </div>

          <div style={{ fontSize: '28px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.03em' }}>
            {isZeroState ? '—' : '148.6'} <span style={{ fontSize: '16px', fontWeight: 500, color: '#64748B' }}>Gbps</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px', fontSize: '12px', color: '#64748B' }}>
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

        {/* KPI 2: Mean Round-Trip Time (RTT) */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Mean Round-Trip Time (RTT)
            </span>
            <span className={isZeroState ? 'metric-pill-slate' : 'metric-pill-emerald'}>
              {!isZeroState && <span className="pulse-dot-emerald" />}
              <span>{isZeroState ? 'Awaiting Stream' : 'Optimal'}</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '28px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.03em' }}>
              {isZeroState ? '—' : '4.2'}
            </span>
            <span style={{ fontSize: '16px', fontWeight: 500, color: '#64748B' }}>ms</span>
          </div>

          <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748B' }}>
            {isZeroState ? 'Awaiting node ping heartbeats' : 'Global Edge to Spine Core switches'}
          </div>
        </div>

        {/* KPI 3: Aggregate Packet Loss */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Aggregate Packet Loss
            </span>
            <span className="metric-pill-emerald">
              <span className="pulse-dot-emerald" />
              <span>Nominal</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '28px', fontWeight: 600, color: '#10B981', letterSpacing: '-0.03em' }}>
              {isZeroState ? '0.00' : '0.002'}
            </span>
            <span style={{ fontSize: '16px', fontWeight: 500, color: '#64748B' }}>%</span>
          </div>

          <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748B' }}>
            {isZeroState ? 'Awaiting packet drop counters' : 'SLA Threshold: < 0.05% packet loss'}
          </div>
        </div>

        {/* KPI 4: Active TCP Connections */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Active TCP Connections
            </span>
            <span className="metric-pill-slate">
              <span>{isZeroState ? 'Awaiting Stream' : 'Zero Drops'}</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '28px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.03em' }}>
              {isZeroState ? '0' : '48,290'}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>sockets</span>
          </div>

          <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748B' }}>
            {isZeroState ? '0 sockets tracked' : 'ESTABLISHED across 14 edge ingress nodes'}
          </div>
        </div>
      </section>

      {/* 3. Dual Split Chart View: Chart A & Chart B */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: '24px',
      }}>
        {/* Chart A: Bandwidth & Ingestion Volume */}
        <div className="card-white" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                Ingress Bandwidth &amp; Volume ({timeframe})
              </h2>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                Aggregate ingress throughput across BGP edge transit and VPC links.
              </p>
            </div>
            <span className="metric-pill-slate">Gbps Scale</span>
          </div>

          {/* Chart SVG */}
          <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
            <svg viewBox={`0 0 ${chartAWidth} ${chartAHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <linearGradient id="chartAArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#334155" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#334155" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {[0, 50, 100, 150, 200].map((g) => {
                const y = padY + plotH - (g / maxGbps) * plotH;
                return (
                  <g key={g}>
                    <line x1={padX} y1={y} x2={chartAWidth - padX} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                    <text x={padX - 8} y={y + 3.5} fontSize="9.5" fill="#94A3B8" textAnchor="end" fontWeight="500">
                      {g}G
                    </text>
                  </g>
                );
              })}

              <path d={areaAD} fill="url(#chartAArea)" />
              <path d={lineAD} fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

              {/* Incident Peak Marker at 14:18 */}
              <circle cx="270" cy="40" r="4.5" fill="#E11D48" stroke="#FFFFFF" strokeWidth="2" />
              <rect x="235" y="16" width="70" height="18" rx="4" fill="#FFF1F2" stroke="#FECDD3" />
              <text x="270" y="28" fill="#E11D48" fontSize="9.5" fontWeight="600" textAnchor="middle">
                182.4G Peak
              </text>

              {/* Data points */}
              {pointsA.map((p, i) => (
                <g key={i}>
                  <text x={p.x} y={chartAHeight - 6} fontSize="9.5" fill="#94A3B8" textAnchor="middle" fontWeight="500">
                    {p.pt.time}
                  </text>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="8"
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredPointA(p.pt)}
                    onMouseLeave={() => setHoveredPointA(null)}
                  />
                </g>
              ))}
            </svg>

            {hoveredPointA && (
              <div
                className="chart-tooltip-popover"
                style={{ top: '30%', left: '50%', transform: 'translate(-50%, -50%)' }}
              >
                <div style={{ fontSize: '11px', color: '#64748B' }}>{hoveredPointA.time} UTC</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                  {hoveredPointA.val} Gbps
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart B: Global Edge Latency & Packet Drops */}
        <div className="card-white" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                Global Edge Latency &amp; Packet Drops
              </h2>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                Cross-region latency tracking with incident packet drop indicator.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>US-East:</span>
              <strong style={{ fontSize: '11.5px', color: '#0F172A' }}>4.2ms</strong>
            </div>
          </div>

          {/* Regional latency bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#0F172A', fontWeight: 500 }}>US-East (Primary Core)</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>4.2 ms (0.00% drop)</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: '12%', height: '100%', background: '#10B981', borderRadius: '9999px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#0F172A', fontWeight: 500 }}>EU-West (Frankfurt Standby)</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>18.6 ms (0.01% drop)</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: '38%', height: '100%', background: '#334155', borderRadius: '9999px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#0F172A', fontWeight: 500 }}>AP-South (Singapore Edge)</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>42.1 ms (0.02% drop)</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: '74%', height: '100%', background: '#64748B', borderRadius: '9999px' }} />
              </div>
            </div>
          </div>

          {/* Crimson Spike Indicator Box */}
          <div style={{
            background: '#FFF1F2',
            border: '1px solid #FECDD3',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={15} color="#E11D48" />
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#E11D48' }}>
                  Single Packet Drop Spike (&gt;1%) Recorded
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                  eth0 ingress buffer saturation during 14:18 UTC incident (1.24% drop)
                </div>
              </div>
            </div>
            <span className="metric-pill-crimson" style={{ fontSize: '11px' }}>14:18 UTC</span>
          </div>
        </div>
      </section>

      {/* 4. Interface & Route Saturation Table */}
      <section className="card-white" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
              Interface &amp; Route Saturation Table
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
              Physical bonding interfaces, MTU limits, and live packet drop counters across nodes.
            </p>
          </div>

          <div style={{ fontSize: '12px', color: '#64748B' }}>
            Showing <strong>{filteredInterfaces.length}</strong> active routes
          </div>
        </div>

        {/* Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Interface / Device</th>
                <th>Route Target</th>
                <th>MTU</th>
                <th>Rx Load</th>
                <th>Tx Load</th>
                <th>Dropped Packets</th>
                <th>Health Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterfaces.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '56px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94A3B8'
                      }}>
                        <Server size={20} />
                      </div>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>
                        0 Active Network Interfaces Detected
                      </h3>
                      <p style={{ fontSize: '12.5px', color: '#64748B', maxWidth: '420px', lineHeight: 1.5 }}>
                        Deploy the RicozInfra telemetry collector daemon to stream interface vitals and socket telemetry.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInterfaces.map((item) => {
                const isCritical = item.status === 'critical';

                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={isCritical ? 'pulse-dot-crimson' : 'pulse-dot-emerald'} />
                        <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px' }}>
                          {item.name}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span style={{ color: '#475569', fontSize: '12.5px' }}>
                        {item.target}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        {item.mtu}
                      </span>
                    </td>

                    <td style={{ minWidth: '120px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '3px' }}>
                        {item.rxLoad}
                      </div>
                      <div style={{ width: '100%', height: '4px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ width: `${item.rxPercent}%`, height: '100%', background: isCritical ? '#E11D48' : '#334155' }} />
                      </div>
                    </td>

                    <td style={{ minWidth: '120px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '3px' }}>
                        {item.txLoad}
                      </div>
                      <div style={{ width: '100%', height: '4px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ width: `${item.txPercent}%`, height: '100%', background: '#64748B' }} />
                      </div>
                    </td>

                    <td>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: isCritical ? 600 : 400,
                        color: isCritical ? '#E11D48' : '#64748B',
                      }}>
                        {item.droppedPackets}
                      </span>
                    </td>

                    <td>
                      {isCritical ? (
                        <span className="metric-pill-crimson">
                          <AlertTriangle size={11} />
                          <span>Degraded</span>
                        </span>
                      ) : (
                        <span className="metric-pill-emerald">
                          <span className="pulse-dot-emerald" />
                          <span>Nominal</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
