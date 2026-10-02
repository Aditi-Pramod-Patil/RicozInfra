import React, { useState, useRef } from 'react';
import type { TopologyNode } from '../types';
import { TOPOLOGY_NODES, TOPOLOGY_EDGES } from '../data/mockData';
import { useFleet } from '../context/FleetContext';
import { AddHostModal } from '../components/AddHostModal';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  AlertTriangle, 
  GitFork,
  Plus,
  Play
} from 'lucide-react';

interface TopologyViewProps {
  onSelectHost?: (hostname: string) => void;
  onNavigateToIncidents: () => void;
}

export const TopologyView: React.FC<TopologyViewProps> = ({
  onSelectHost: _onSelectHost,
  onNavigateToIncidents: _onNavigateToIncidents,
}) => {
  const { isZeroState, simulateAgentConnect } = useFleet();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-edge-gw-01');
  const [highlightDegradedOnly, setHighlightDegradedOnly] = useState(false);
  const [isAddHostModalOpen, setIsAddHostModalOpen] = useState(false);

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

  // Selected node lookup (available for future detail panel)
  TOPOLOGY_NODES.find((n) => n.id === selectedNodeId);

  // Node position map
  const nodeMap = new Map<string, TopologyNode>();
  TOPOLOGY_NODES.forEach((n) => nodeMap.set(n.id, n));

  // Architectural tiers (used for layout reference)
  // Tier 1: Ingress Edge (x:160), Tier 2: API Gateways (x:440)
  // Tier 3: Compute Mesh (x:740), Tier 4: Data Stores (x:1040)

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
            Topology Canvas &amp; Service Dependencies
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '3px' }}>
            Interactive dependency mesh from Ingress Edge down to Compute Mesh and Data Stores.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isZeroState && (
            <button
              className={highlightDegradedOnly ? 'btn-crimson-primary' : 'btn-slate-secondary'}
              onClick={() => setHighlightDegradedOnly(!highlightDegradedOnly)}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <AlertTriangle size={13} />
              <span>Highlight Degraded Path Only</span>
            </button>
          )}

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
          position: 'relative',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {isZeroState ? (
          /* Empty State: Topology Prompt */
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
          }}>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '36px',
              maxWidth: '520px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B'
              }}>
                <GitFork size={22} />
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                Topology Mesh Awaiting Host Connection
              </h3>

              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
                Topology will automatically map once agent telemetry is received from at least one ingress or compute node.
              </p>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  onClick={() => setIsAddHostModalOpen(true)}
                  className="btn-crimson-primary text-xs"
                >
                  <Plus size={14} />
                  <span>Deploy First Agent</span>
                </button>

                <button
                  onClick={simulateAgentConnect}
                  className="btn-slate-secondary text-xs"
                >
                  <Play size={12} className="text-emerald-500" />
                  <span>Simulate Connection</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Live Canvas Render */
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '1280px',
              height: '620px',
              transformOrigin: '0 0',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.05s ease-out',
            }}
          >
            {/* SVG Connection Lines */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <defs>
                <marker id="arrowNominal" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#CBD5E1" />
                </marker>
                <marker id="arrowDegraded" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#E11D48" />
                </marker>
              </defs>

              {TOPOLOGY_EDGES.map((edge) => {
                const src = nodeMap.get(edge.source);
                const tgt = nodeMap.get(edge.target);
                if (!src || !tgt) return null;

                const isDegraded = edge.status === 'degraded';
                if (highlightDegradedOnly && !isDegraded) return null;

                const startX = src.x + 85;
                const startY = src.y + 40;
                const endX = tgt.x - 85;
                const endY = tgt.y + 40;
                const midX = (startX + endX) / 2;

                const pathData = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

                return (
                  <g key={edge.id}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={isDegraded ? '#E11D48' : '#CBD5E1'}
                      strokeWidth={isDegraded ? 2.5 : 1.5}
                      strokeDasharray={isDegraded ? '5 5' : 'none'}
                      markerEnd={isDegraded ? 'url(#arrowDegraded)' : 'url(#arrowNominal)'}
                    />
                    {edge.latencyAnnotation && (
                      <g transform={`translate(${midX}, ${(startY + endY) / 2 - 8})`}>
                        <rect x="-28" y="-10" width="56" height="18" rx="4" fill={isDegraded ? '#FFF1F2' : '#FFFFFF'} stroke={isDegraded ? '#FECDD3' : '#E2E8F0'} />
                        <text x="0" y="3" fill={isDegraded ? '#E11D48' : '#64748B'} fontSize="10" fontWeight="600" textAnchor="middle">
                          {edge.latencyAnnotation}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
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
                    left: `${node.x - 85}px`,
                    top: `${node.y}px`,
                    width: '170px',
                    background: '#FFFFFF',
                    border: isSelected ? '2px solid #0F172A' : isCritical ? '1px solid #FECDD3' : '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    boxShadow: isSelected ? '0 8px 18px -4px rgba(15, 23, 42, 0.12)' : '0 2px 5px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    zIndex: isSelected ? 20 : 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={isCritical ? 'pulse-dot-crimson' : 'pulse-dot-emerald'} />
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                        {node.role}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {node.label}
                  </div>

                  <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                    <span style={{ color: '#94A3B8' }}>CPU: <strong style={{ color: isCritical ? '#E11D48' : '#0F172A' }}>{node.cpuPercent}%</strong></span>
                    <span style={{ color: '#94A3B8' }}>p99: <strong style={{ color: isCritical ? '#E11D48' : '#0F172A' }}>{node.p99LatencyMs}ms</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Host Modal */}
      <AddHostModal
        isOpen={isAddHostModalOpen}
        onClose={() => setIsAddHostModalOpen(false)}
      />
    </div>
  );
};
