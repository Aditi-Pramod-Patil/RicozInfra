import React, { useState } from 'react';
import type { HostNode, HostType } from '../types';
import { HOSTS_LIST } from '../data/mockData';
import { 
  Terminal, 
  X, 
  AlertTriangle,
  Search
} from 'lucide-react';

interface HostInventoryViewProps {
  selectedHostName?: string;
  onOpenTerminal: (hostname: string, ip: string) => void;
  onNavigateToIncidents: () => void;
}

export const HostInventoryView: React.FC<HostInventoryViewProps> = ({
  selectedHostName,
  onOpenTerminal,
  onNavigateToIncidents,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | HostType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'nominal' | 'critical'>('all');
  const [selectedHost, setSelectedHost] = useState<HostNode | null>(
    HOSTS_LIST.find((h) => h.hostname === selectedHostName) || HOSTS_LIST[0]
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Filter logic
  const filteredHosts = HOSTS_LIST.filter((host) => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header: Fleet Host Inventory with 1,428 monitored instances */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0F172A' }}>
            Fleet Host Inventory
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
            1,428 monitored instances across Bare-Metal, VMware ESXi, and Kubernetes.
          </p>
        </div>

        {/* Global Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className="btn-slate-secondary"
            onClick={() => onOpenTerminal(selectedHost?.hostname || 'prod-edge-gw-01', selectedHost?.ip || '10.240.12.84')}
          >
            <Terminal size={14} />
            <span>Connect via SSH</span>
          </button>
        </div>
      </div>

      {/* 2. Top Controls & Filter Pills: [ All Hosts (1,428) ] [ Bare-Metal (120) ] [ VMware (340) ] [ Kubernetes (972) ] */}
      <div className="card-white" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div className="filter-pills-row">
          <button
            className={`filter-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Hosts (1,428)
          </button>
          <button
            className={`filter-pill-btn ${activeTab === 'bare-metal' ? 'active' : ''}`}
            onClick={() => setActiveTab('bare-metal')}
          >
            Bare-Metal (120)
          </button>
          <button
            className={`filter-pill-btn ${activeTab === 'esxi' ? 'active' : ''}`}
            onClick={() => setActiveTab('esxi')}
          >
            VMware (340)
          </button>
          <button
            className={`filter-pill-btn ${activeTab === 'k8s' ? 'active' : ''}`}
            onClick={() => setActiveTab('k8s')}
          >
            Kubernetes (972)
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

      {/* 3. Spacious Data Table (generous row height py-4, subtle slate-200 dividers, hover:bg-slate-50) */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Hostname & IP</th>
              <th>Role / Cluster</th>
              <th>CPU Usage</th>
              <th>Memory / RAM</th>
              <th>Throughput</th>
              <th>Uptime</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredHosts.map((host) => {
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

                  {/* CPU Usage (subtle slate progress bar) */}
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
                    <div style={{ fontWeight: 500, color: '#0F172A', fontSize: '12.5px' }}>
                      {host.ioThroughput}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      ↓ {host.rxGbps}G • ↑ {host.txGbps}G
                    </div>
                  </td>

                  {/* Uptime */}
                  <td>
                    <div style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                      {host.uptime}
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    {isCritical ? (
                      <span className="metric-pill-crimson">
                        <AlertTriangle size={11} />
                        <span>P1 Outage</span>
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
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Slide-Over Host Inspector Drawer (Right Panel, 420px) */}
      {isDrawerOpen && selectedHost && (
        <div className="drawer-backdrop" onClick={() => setIsDrawerOpen(false)}>
          <div className="drawer-panel-420" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FFFFFF'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={selectedHost.status === 'critical' ? 'pulse-dot-crimson' : 'pulse-dot-emerald'} />
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                    {selectedHost.hostname}
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
                  {selectedHost.ip} • {selectedHost.role}
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Critical Banner if degraded */}
            {selectedHost.status === 'critical' && (
              <div style={{
                background: '#FFF1F2',
                borderBottom: '1px solid #FECDD3',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#E11D48', fontWeight: 600 }}>
                  <AlertTriangle size={14} />
                  <span>Linked to Incident #INC-9402</span>
                </div>
                <button
                  onClick={onNavigateToIncidents}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#E11D48',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  War Room →
                </button>
              </div>
            )}

            {/* Drawer Body Details */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Kernel & Physical Info */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Hardware & Environment
                </span>
                <div className="card-white" style={{ marginTop: '8px', padding: '14px', background: '#F8FAFC' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Kernel</span>
                      <strong style={{ color: '#0F172A', fontWeight: 500 }}>{selectedHost.kernel}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>IPv4 Primary</span>
                      <strong style={{ color: '#0F172A', fontWeight: 500 }}>{selectedHost.ip}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Rack Location</span>
                      <strong style={{ color: '#0F172A', fontWeight: 500 }}>{selectedHost.rackLocation}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Cluster & Region</span>
                      <strong style={{ color: '#0F172A', fontWeight: 500 }}>{selectedHost.cluster} ({selectedHost.region})</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual-Core vCPU Load Meter */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Dual-Core vCPU Load
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: selectedHost.cpuLoad > 85 ? '#E11D48' : '#0F172A' }}>
                    {selectedHost.cpuLoad}% Total
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  {selectedHost.cpuCores.map((c) => (
                    <div key={c.core} className="card-white" style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                        <span style={{ color: '#64748B' }}>Core #{c.core}</span>
                        <strong style={{ color: c.load > 85 ? '#E11D48' : '#0F172A', fontWeight: 600 }}>{c.load}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '4px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${c.load}%`,
                            height: '100%',
                            background: c.load > 85 ? '#E11D48' : '#475569',
                            borderRadius: '9999px'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RAM Pressure & TCP Sockets */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="card-white" style={{ padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                    ECC RAM PRESSURE
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>
                    {selectedHost.memoryUsedGb} <span style={{ fontSize: '12px', color: '#64748B' }}>/ {selectedHost.memoryTotalGb} GB</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                    {((selectedHost.memoryUsedGb / selectedHost.memoryTotalGb) * 100).toFixed(1)}% allocated
                  </div>
                </div>

                <div className="card-white" style={{ padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                    ACTIVE TCP SOCKETS
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: selectedHost.tcpSockets.established > 10000 ? '#E11D48' : '#0F172A', marginTop: '4px' }}>
                    {selectedHost.tcpSockets.established.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                    TIME_WAIT: {selectedHost.tcpSockets.timeWait}
                  </div>
                </div>
              </div>

              {/* Top 3 Consuming Processes */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Top 3 Resource Consuming Processes
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  {selectedHost.topProcesses.map((p) => (
                    <div key={p.pid} className="card-white" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '12.5px' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
                          PID {p.pid} • Memory: {p.memory}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: p.cpu > 50 ? '#E11D48' : '#0F172A' }}>
                          {p.cpu}% CPU
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div style={{
              marginTop: 'auto',
              padding: '18px 24px',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              gap: '12px'
            }}>
              <button
                className="btn-crimson-primary"
                onClick={() => onOpenTerminal(selectedHost.hostname, selectedHost.ip)}
                style={{ flex: 1, padding: '9px 16px' }}
              >
                <Terminal size={14} />
                <span>Connect via SSH</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
