import React, { useState } from 'react';
import type { HostNode, HostType } from '../types';
import { useFleet } from '../context/FleetContext';
import { AddHostModal } from '../components/AddHostModal';
import { 
  Terminal, 
  X, 
  AlertTriangle,
  Search,
  Server,
  Plus
} from 'lucide-react';

interface HostInventoryViewProps {
  selectedHostName?: string;
  onOpenTerminal: (hostname: string, ip: string) => void;
  onNavigateToIncidents: () => void;
}

export const HostInventoryView: React.FC<HostInventoryViewProps> = ({
  selectedHostName,
  onOpenTerminal,
  onNavigateToIncidents: _onNavigateToIncidents,
}) => {
  const { hosts } = useFleet();
  const [activeTab, setActiveTab] = useState<'all' | HostType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'nominal' | 'critical'>('all');
  const [isAddHostModalOpen, setIsAddHostModalOpen] = useState(false);

  const [selectedHost, setSelectedHost] = useState<HostNode | null>(() => {
    if (hosts.length === 0) return null;
    return hosts.find((h) => h.hostname === selectedHostName) || hosts[0] || null;
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter logic over live hosts array
  const filteredHosts = hosts.filter((host) => {
    if (activeTab !== 'all' && host.type !== activeTab) return false;
    if (regionFilter !== 'all' && host.region !== regionFilter) return false;
    if (statusFilter !== 'all' && host.status !== statusFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        host.hostname.toLowerCase().includes(q) ||
        host.ip.includes(q) ||
        host.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRowClick = (host: HostNode) => {
    setSelectedHost(host);
    setIsDrawerOpen(true);
  };

  const bareMetalCount = hosts.filter(h => h.type === 'bare-metal').length;
  const esxiCount = hosts.filter(h => h.type === 'esxi').length;
  const k8sCount = hosts.filter(h => h.type === 'k8s').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header: Fleet Host Inventory */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0F172A' }}>
            Fleet Host Inventory
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
            {hosts.length === 0
              ? '0 monitored instances. Deploy the telemetry agent to start tracking.'
              : `${hosts.length} monitored instances across Bare-Metal, VMware ESXi, and Kubernetes.`}
          </p>
        </div>

        {/* Global Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn-crimson-primary"
            onClick={() => setIsAddHostModalOpen(true)}
          >
            <Plus size={14} />
            <span>Add First Host / Download Agent</span>
          </button>

          {hosts.length > 0 && selectedHost && (
            <button 
              className="btn-slate-secondary"
              onClick={() => onOpenTerminal(selectedHost.hostname, selectedHost.ip)}
            >
              <Terminal size={14} />
              <span>Connect via SSH</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Controls & Filter Pills */}
      <div className="card-white" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div className="filter-pills-row">
          <button
            className={`filter-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Hosts ({hosts.length})
          </button>
          <button
            className={`filter-pill-btn ${activeTab === 'bare-metal' ? 'active' : ''}`}
            onClick={() => setActiveTab('bare-metal')}
          >
            Bare-Metal ({bareMetalCount})
          </button>
          <button
            className={`filter-pill-btn ${activeTab === 'esxi' ? 'active' : ''}`}
            onClick={() => setActiveTab('esxi')}
          >
            VMware ({esxiCount})
          </button>
          <button
            className={`filter-pill-btn ${activeTab === 'k8s' ? 'active' : ''}`}
            onClick={() => setActiveTab('k8s')}
          >
            Kubernetes ({k8sCount})
          </button>
        </div>

        {/* Search & Region Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search hostname, IP, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 32px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: '12.5px',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">Region: All</option>
            <option value="us-east-1a">us-east-1a</option>
            <option value="us-east-1b">us-east-1b</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">Status: All</option>
            <option value="nominal">Nominal Only</option>
            <option value="critical">Critical / Incident</option>
          </select>
        </div>
      </div>

      {/* 3. Spacious Data Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Hostname</th>
              <th>Role</th>
              <th>CPU</th>
              <th>RAM</th>
              <th>Throughput</th>
              <th>Uptime</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredHosts.length === 0 ? (
              /* Centered Empty State Prompt */
              <tr>
                <td colSpan={7} style={{ padding: '64px 24px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94A3B8'
                    }}>
                      <Server size={22} />
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>
                      0 Monitored Hosts Found
                    </h3>
                    <p style={{ fontSize: '12.5px', color: '#64748B', maxWidth: '420px', lineHeight: 1.5 }}>
                      No live telemetry daemon reporting for this workspace or filter criteria. Deploy the collector agent to populate host metrics.
                    </p>

                    <div style={{ marginTop: '8px' }}>
                      <button
                        onClick={() => setIsAddHostModalOpen(true)}
                        className="btn-crimson-primary"
                      >
                        <Plus size={14} />
                        <span>+ Add First Host</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredHosts.map((host) => {
                const isSelected = selectedHost?.id === host.id;
                const isCritical = host.status === 'critical';

                return (
                  <tr
                    key={host.id}
                    className={isSelected ? 'selected' : ''}
                    onClick={() => handleRowClick(host)}
                  >
                    {/* Hostname & IP */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={isCritical ? 'pulse-dot-crimson' : 'pulse-dot-emerald'} />
                        <div>
                          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px' }}>
                            {host.hostname}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                            {host.ip}
                            {host.secondaryIp && <span style={{ color: '#94A3B8' }}> • {host.secondaryIp}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role / Cluster */}
                    <td>
                      <div style={{ fontWeight: 500, color: '#0F172A', fontSize: '12.5px' }}>
                        {host.role}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                        {host.cluster} ({host.region})
                      </div>
                    </td>

                    {/* CPU Usage */}
                    <td style={{ minWidth: '150px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: isCritical ? '#E11D48' : '#0F172A', fontSize: '12px' }}>
                          {host.cpuLoad}%
                        </span>
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                          Dual vCPU
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(host.cpuLoad, 100)}%`,
                            height: '100%',
                            background: isCritical ? '#E11D48' : '#64748B',
                            borderRadius: '9999px'
                          }}
                        />
                      </div>
                    </td>

                    {/* Memory / RAM */}
                    <td>
                      <div style={{ fontWeight: 500, color: '#0F172A', fontSize: '12.5px' }}>
                        {host.memoryUsedGb} GB / {host.memoryTotalGb} GB
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        {((host.memoryUsedGb / host.memoryTotalGb) * 100).toFixed(1)}% ECC RAM
                      </div>
                    </td>

                    {/* Throughput */}
                    <td>
                      <div style={{ fontWeight: 500, color: '#0F172A', fontSize: '12px' }}>
                        Rx: {host.rxGbps} Gbps
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                        Tx: {host.txGbps} Gbps
                      </div>
                    </td>

                    {/* Uptime */}
                    <td>
                      <span style={{ fontSize: '12px', color: '#475569' }}>
                        {host.uptime}
                      </span>
                    </td>

                    {/* Status Pill */}
                    <td>
                      {isCritical ? (
                        <span className="metric-pill-crimson">
                          <AlertTriangle size={11} />
                          <span>Incident Ref</span>
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
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Slide-Over Host Inspector Drawer (420px width) */}
      {isDrawerOpen && selectedHost && (
        <div className="drawer-backdrop" onClick={() => setIsDrawerOpen(false)}>
          <div className="drawer-panel-420" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={selectedHost.status === 'critical' ? 'pulse-dot-crimson' : 'pulse-dot-emerald'} />
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                    {selectedHost.hostname}
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  {selectedHost.ip} • {selectedHost.role}
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Vitals Summary */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                  Hardware Specs &amp; Location
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Cluster:</span>
                    <div style={{ fontWeight: 500, color: '#0F172A', marginTop: '2px' }}>{selectedHost.cluster}</div>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Region:</span>
                    <div style={{ fontWeight: 500, color: '#0F172A', marginTop: '2px' }}>{selectedHost.region}</div>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Rack Location:</span>
                    <div style={{ fontWeight: 500, color: '#0F172A', marginTop: '2px' }}>{selectedHost.rackLocation}</div>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Active Sockets:</span>
                    <div style={{ fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>{selectedHost.tcpSockets.established.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button 
                className="btn-slate-secondary" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => onOpenTerminal(selectedHost.hostname, selectedHost.ip)}
              >
                <Terminal size={14} />
                <span>Open Interactive SSH Terminal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Host Modal */}
      <AddHostModal
        isOpen={isAddHostModalOpen}
        onClose={() => setIsAddHostModalOpen(false)}
      />
    </div>
  );
};
