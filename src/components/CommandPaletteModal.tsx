import React, { useState, useEffect } from 'react';
import type { PageView } from '../types';
import { 
  Search, 
  Activity, 
  Server, 
  GitFork, 
  AlertTriangle, 
  Terminal, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { HOSTS_LIST } from '../data/mockData';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: PageView) => void;
  onSelectHost: (hostname: string) => void;
  onOpenTerminal: (hostname: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectHost,
  onOpenTerminal,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNavItems = [
    { label: 'Go to Fleet Overview', view: 'overview' as PageView, icon: Activity, meta: 'System health & fleet stats' },
    { label: 'Go to Host Inventory', view: 'hosts' as PageView, icon: Server, meta: '1,428 compute & edge nodes' },
    { label: 'Go to Topology Map', view: 'topology' as PageView, icon: GitFork, meta: 'End-to-end dependency graph' },
    { label: 'Go to Incidents & Alerts', view: 'incidents' as PageView, icon: AlertTriangle, meta: 'INC-9402 P1 War Room' },
  ];

  const filteredNav = quickNavItems.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase()) || i.meta.toLowerCase().includes(query.toLowerCase())
  );

  const filteredHosts = HOSTS_LIST.filter(
    (h) => h.hostname.toLowerCase().includes(query.toLowerCase()) || h.ip.includes(query)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-card"
        style={{
          width: '620px',
          maxWidth: '92vw',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          borderBottom: '1px solid #E2E8F0',
          background: '#FFFFFF',
        }}>
          <Search size={16} color="#94A3B8" />
          <input
            autoFocus
            type="text"
            placeholder="Search commands, hosts, IPs, or incidents (⌘K)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#0F172A',
              fontSize: '13.5px',
              fontWeight: 500,
            }}
          />
          <span style={{
            fontSize: '10.5px',
            fontWeight: 600,
            padding: '2px 6px',
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            borderRadius: '4px',
            color: '#64748B',
          }}>
            ESC
          </span>
        </div>

        {/* Command Items List */}
        <div style={{ padding: '12px', maxHeight: '380px', overflowY: 'auto' }}>
          {/* Active Incident Quick Jump */}
          {(query === '' || 'inc-9402'.includes(query.toLowerCase()) || 'war room'.includes(query.toLowerCase()) || 'gateway'.includes(query.toLowerCase())) && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ padding: '4px 10px', fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
                Active Incident
              </div>
              <div
                onClick={() => {
                  onNavigate('incidents');
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#FFF1F2',
                  border: '1px solid #FECDD3',
                  cursor: 'pointer',
                  marginTop: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldAlert size={16} color="#E11D48" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#E11D48' }}>
                      #INC-9402: Upstream Gateway Drop
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                      12 downstream alerts collapsed • 99.4% correlation confidence
                    </div>
                  </div>
                </div>
                <ArrowRight size={14} color="#E11D48" />
              </div>
            </div>
          )}

          {/* Navigation Views */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ padding: '4px 10px', fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              Navigation Views
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              {filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.view}
                    onClick={() => {
                      onNavigate(item.view);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={14} color="#64748B" />
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A' }}>
                        {item.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>{item.meta}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hosts matching query */}
          {filteredHosts.length > 0 && (
            <div>
              <div style={{ padding: '4px 10px', fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
                Monitored Hosts &amp; Nodes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {filteredHosts.slice(0, 5).map((host) => (
                  <div
                    key={host.id}
                    onClick={() => {
                      onSelectHost(host.hostname);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={host.status === 'critical' ? 'pulse-dot-crimson' : 'pulse-dot-emerald'} />
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A' }}>
                        {host.hostname}
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>({host.ip})</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTerminal(host.hostname);
                        onClose();
                      }}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Terminal size={11} />
                      <span>SSH</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
