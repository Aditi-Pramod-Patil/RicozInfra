import React, { useState } from 'react';
import { X, Calendar, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSandbox: () => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose, onOpenSandbox }) => {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [hosts, setHosts] = useState('250-1000');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-card"
        style={{
          width: '540px',
          maxWidth: '92vw',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#FFF1F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E11D48',
            }}>
              <Calendar size={16} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A' }}>
              Book Technical Architecture Review
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
              Schedule a 30-minute 1-on-1 walkthrough with a Principal SRE. We'll inspect your topology, discuss eBPF integration, and demonstrate live alert correlation.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                Corporate Work Email
              </label>
              <input
                type="email"
                required
                placeholder="alex@enterprise.corp"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Acme Global"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                  Monitored Fleet Scale
                </label>
                <select
                  value={hosts}
                  onChange={(e) => setHosts(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="50-250">50 – 250 Hosts</option>
                  <option value="250-1000">250 – 1,000 Hosts</option>
                  <option value="1000-5000">1,000 – 5,000 Hosts</option>
                  <option value="5000+">5,000+ Sovereign Mesh</option>
                </select>
              </div>
            </div>

            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12px',
              color: '#475569',
            }}>
              <ShieldCheck size={16} color="#10B981" />
              <span>Includes SOC2 NDA protection and custom deployment sizing.</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="submit"
                className="btn-crimson-primary"
                style={{ flex: 1, padding: '10px' }}
              >
                <span>Confirm Demo Booking</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#ECFDF5',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
              marginBottom: '14px',
            }}>
              <CheckCircle2 size={24} />
            </div>
            <h4 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A' }}>
              Architecture Review Scheduled
            </h4>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px', maxWidth: '380px', marginInline: 'auto', lineHeight: 1.5 }}>
              Calendar invitation dispatched to <strong>{email}</strong>. While waiting, you can immediately explore our live interactive sandbox.
            </p>

            <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button className="btn-slate-secondary" onClick={onClose}>
                Close
              </button>
              <button
                className="btn-crimson-primary"
                onClick={() => {
                  onClose();
                  onOpenSandbox();
                }}
              >
                <span>Explore Live Sandbox</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
