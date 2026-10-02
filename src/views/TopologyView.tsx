import React, { useState, useRef } from 'react';
import type { TopologyNode } from '../types';
import { TOPOLOGY_NODES, TOPOLOGY_EDGES } from '../data/mockData';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  AlertTriangle, 
  X,
  CheckCircle2
} from 'lucide-react';

interface TopologyViewProps {
  onSelectHost?: (hostname: string) => void;
  onNavigateToIncidents: () => void;
}

export const TopologyView: React.FC<TopologyViewProps> = ({
  onSelectHost,
  onNavigateToIncidents,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-edge-gw-01');
  const [highlightDegradedOnly, setHighlightDegradedOnly] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.6));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.topology-node-card')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Selected node lookup
  const selectedNode = TOPOLOGY_NODES.find((n) => n.id === selectedNodeId) || null;

  // Node position map
  const nodeMap = new Map<string, TopologyNode>();
  TOPOLOGY_NODES.forEach((n) => nodeMap.set(n.id, n));

  // Architectural tiers: Ingress Edge -> API Gateways -> Compute Mesh -> Data Stores
  const tiers = [
    { tier: 1, name: 'Ingress Edge', xRange: 160 },
    { tier: 2, name: 'API Gateways', xRange: 440 },
    { tier: 3, name: 'Compute Mesh', xRange: 740 },
    { tier: 4, name: 'Data Stores', xRange: 1040 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      {/* Top Header Controls Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0F172A' }}>
            Topology Canvas & Service Dependencies
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '3px' }}>
            Interactive dependency mesh from Ingress Edge down to Compute Mesh and Data Stores.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className={highlightDegradedOnly ? 'btn-crimson-primary' : 'btn-slate-secondary'}
            onClick={() => setHighlightDegradedOnly(!highlightDegradedOnly)}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <AlertTriangle size={13} />
            <span>Highlight Degraded Path Only</span>
          </button>

          {/* Zoom / Pan Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              style={{
                background: 'transparent',
                border: 'none',
                padding: '6px 10px',
                cursor: 'pointer',
                color: '#475569',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ZoomIn size={14} />
            </button>
            <div style={{ width: '1px', height: '16px', background: '#E2E8F0' }} />
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              style={{
                background: 'transparent',
                border: 'none',
                padding: '6px 10px',
                cursor: 'pointer',
                color: '#475569',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ZoomOut size={14} />
            </button>
            <div style={{ width: '1px', height: '16px', background: '#E2E8F0' }} />
            <button
              onClick={handleReset}
              title="Reset View"
              style={{
                background: 'transparent',
                border: 'none',
                padding: '6px 10px',
                cursor: 'pointer',
                color: '#475569',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Open Canvas with Faint Dotted Grid */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="card-white bg-faint-dots"
        style={{
          width: '100%',
          height: '620px',
          overflow: 'hidden',
          position: 'relative',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        {/* Tier Header Markers */}
        <div style={{
          position: 'absolute',
          top: '14px',
          left: 0,
          right: 0,
          display: 'flex',
          pointerEvents: 'none',
          zIndex: 5,
          transform: `translateX(${pan.x}px) scale(${zoom})`,
          transformOrigin: 'top left',
        }}>
          {tiers.map((t) => (
            <div
              key={t.tier}
              style={{
                position: 'absolute',
                left: `${t.xRange - 70}px`,
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#64748B',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                whiteSpace: 'nowrap'
              }}
            >
              {t.name}
            </div>
          ))}
        </div>

        {/* Pan & Zoom Transform World */}
        <div
          style={{
            position: 'absolute',
            width: '1500px',
            height: '650px',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
            transition: isDragging ? 'none' : 'transform 0.05s ease-out',
          }}
        >
          {/* SVG Connection Lines */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '1500px',
              height: '650px',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {TOPOLOGY_EDGES.map((edge) => {
              const src = nodeMap.get(edge.source);
              const tgt = nodeMap.get(edge.target);
              if (!src || !tgt) return null;

              const isDegraded = edge.status === 'degraded';
              if (highlightDegradedOnly && !isDegraded) return null;

              const srcX = src.x + 90;
              const srcY = src.y + 40;
              const tgtX = tgt.x - 90;
              const tgtY = tgt.y + 40;
              const midX = (srcX + tgtX) / 2;

              const pathD = `M ${srcX} ${srcY} C ${midX} ${srcY}, ${midX} ${tgtY}, ${tgtX} ${tgtY}`;

              return (
                <g key={edge.id}>
                  {/* Connection Path: Slate-300 for nominal, Crimson for degraded */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isDegraded ? '#E11D48' : '#CBD5E1'}
                    strokeWidth={isDegraded ? 2.5 : 1.5}
                    strokeDasharray={isDegraded ? '5 5' : 'none'}
                  />

                  {/* Degraded Badge: "182ms p99" in Crimson */}
                  {isDegraded && (
                    <g transform={`translate(${midX}, ${(srcY + tgtY) / 2})`}>
                      <rect
                        x="-38"
                        y="-12"
                        width="76"
                        height="22"
                        rx="4"
                        fill="#FFF1F2"
                        stroke="#FECDD3"
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3"
                        fill="#E11D48"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        182ms p99
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Topology Node Cards: Crisp White Cards with Thin Slate Borders */}
          {TOPOLOGY_NODES.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isCritical = node.status === 'critical';

            return (
              <div
                key={node.id}
                className="topology-node-card"
                onClick={() => setSelectedNodeId(node.id)}
                style={{
                  position: 'absolute',
                  left: `${node.x - 90}px`,
                  top: `${node.y}px`,
                  width: '180px',
                  background: '#FFFFFF',
                  border: isCritical 
                    ? '1.5px solid #E11D48' 
                    : isSelected 
                      ? '1.5px solid #0F172A' 
                      : '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  boxShadow: isSelected 
                    ? '0 6px 16px rgba(0, 0, 0, 0.08)' 
                    : '0 1px 3px rgba(0, 0, 0, 0.03)',
                  cursor: 'pointer',
                  zIndex: isSelected ? 10 : 2,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
                    {node.role}
                  </span>
                  <span className={isCritical ? 'pulse-dot-crimson' : 'pulse-dot-emerald'} />
                </div>

                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {node.label}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#64748B' }}>
                  <span>Load: <strong style={{ color: isCritical ? '#E11D48' : '#0F172A', fontWeight: 600 }}>{node.cpuPercent}%</strong></span>
                  <span>{node.p99LatencyMs}ms</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Selected Node Detail Card */}
        {selectedNode && (
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              width: '320px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
              padding: '18px',
              zIndex: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={selectedNode.status === 'critical' ? 'pulse-dot-crimson' : 'pulse-dot-emerald'} />
                <strong style={{ fontSize: '14px', color: '#0F172A' }}>{selectedNode.label}</strong>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '14px' }}>
              <div>Tier: <strong style={{ color: '#0F172A', fontWeight: 500 }}>{tiers.find(t => t.tier === selectedNode.tier)?.name}</strong></div>
              <div style={{ marginTop: '2px' }}>Role: <strong style={{ color: '#0F172A', fontWeight: 500 }}>{selectedNode.role}</strong></div>
              <div style={{ marginTop: '2px' }}>IP: <strong style={{ color: '#0F172A', fontWeight: 500 }}>{selectedNode.ip}</strong></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              <div className="card-white" style={{ padding: '8px 10px', background: '#F8FAFC' }}>
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>CPU LOAD</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: selectedNode.cpuPercent > 85 ? '#E11D48' : '#0F172A' }}>
                  {selectedNode.cpuPercent}%
                </div>
              </div>
              <div className="card-white" style={{ padding: '8px 10px', background: '#F8FAFC' }}>
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>P99 LATENCY</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: selectedNode.p99LatencyMs > 100 ? '#E11D48' : '#0F172A' }}>
                  {selectedNode.p99LatencyMs} ms
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedNode.status === 'critical' ? (
                <button
                  className="btn-crimson-primary"
                  onClick={onNavigateToIncidents}
                  style={{ width: '100%', fontSize: '12px', padding: '8px' }}
                >
                  <AlertTriangle size={13} />
                  <span>Open War Room (#INC-9402)</span>
                </button>
              ) : (
                <div style={{ fontSize: '11.5px', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0' }}>
                  <CheckCircle2 size={13} />
                  <span>Operational &amp; Nominal</span>
                </div>
              )}

              {onSelectHost && (
                <button
                  className="btn-slate-secondary"
                  onClick={() => onSelectHost(selectedNode.label)}
                  style={{ width: '100%', fontSize: '11.5px', padding: '7px' }}
                >
                  Inspect in Host Inventory
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
