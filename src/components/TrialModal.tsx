import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchDashboard: () => void;
}

export const TrialModal: React.FC<TrialModalProps> = ({ isOpen, onClose, onLaunchDashboard }) => {
  const [email, setEmail] = useState('');
  const [clusterRegion, setClusterRegion] = useState('us-east-1');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisioned, setProvisioned] = useState(false);

  if (!isOpen) return null;

  const handleDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsProvisioning(true);

    setTimeout(() => {
      setIsProvisioning(false);
      setProvisioned(true);
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-card"
        style={{
          width: '560px',
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
              <Sparkles size={16} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A' }}>
              Deploy Free 14-Day Enterprise Trial
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

        {!provisioned ? (
          <form onSubmit={handleDeploy} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
              Spin up your dedicated sovereign telemetry collector workspace in seconds. No credit card required. Full ML alert correlation and unlimited hosts during your trial period.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                Corporate Work Email
              </label>
              <input
                type="email"
                required
                placeholder="devops@enterprise.corp"
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

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                Primary Ingestion Region
              </label>
              <select
                value={clusterRegion}
                onChange={(e) => setClusterRegion(e.target.value)}
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
                <option value="us-east-1">US East (N. Virginia, us-east-01)</option>
                <option value="eu-west-1">Europe (Frankfurt, eu-west-01)</option>
                <option value="ap-southeast-1">Asia Pacific (Singapore, ap-south-01)</option>
                <option value="on-prem">Sovereign On-Premises / Air-Gapped Helm</option>
              </select>
            </div>

            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: '#475569',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0F172A', fontWeight: 500 }}>
                <CheckCircle2 size={14} color="#10B981" />
                <span>Instant single-binary eBPF curl installer</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0F172A', fontWeight: 500 }}>
                <CheckCircle2 size={14} color="#10B981" />
                <span>Pre-configured ML alert correlation engine</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProvisioning}
              className="btn-crimson-primary"
              style={{ padding: '11px', fontSize: '13px', width: '100%' }}
            >
              {isProvisioning ? (
                <span>Provisioning Sovereign Mesh...</span>
              ) : (
                <>
                  <span>Initialize 14-Day Enterprise Cluster</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
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
              Cluster Initialized Successfully
            </h4>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px', maxWidth: '400px', marginInline: 'auto', lineHeight: 1.5 }}>
              Your workspace in <strong>{clusterRegion}</strong> is active. You can now launch straight into the live command deck to test topology tracing and real-time alerts.
            </p>

            <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                className="btn-crimson-primary"
                onClick={() => {
                  onClose();
                  onLaunchDashboard();
                }}
              >
                <span>Launch Enterprise Command Deck</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
