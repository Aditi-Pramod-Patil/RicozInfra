import React, { useState, useEffect } from 'react';
import type { PageView } from '../types';
import { 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  Server, 
  GitFork, 
  Lock, 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  Zap, 
  Globe, 
  Radio
} from 'lucide-react';
import { DemoModal } from '../components/DemoModal';
import { TrialModal } from '../components/TrialModal';

interface LandingViewProps {
  onNavigateToApp: (view?: PageView) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigateToApp }) => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [hostsCount, setHostsCount] = useState(250);
  const [retentionPeriod, setRetentionPeriod] = useState<'7d' | '30d' | '1y'>('30d');
  
  // Real-time fluctuating telemetry simulation in Hero mockup
  const [heroEvents, setHeroEvents] = useState(214);
  const [heroLatency, setHeroLatency] = useState(4.2);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroEvents(prev => Math.max(198, Math.min(235, prev + (Math.floor(Math.random() * 7) - 3))));
      setHeroLatency(prev => +(Math.max(3.8, Math.min(4.9, prev + (Math.random() * 0.4 - 0.2))).toFixed(1)));
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  // Pricing calculations
  // At default 250 hosts and 30 Days (Standard): exactly $1,450 / month!
  const ratePerHost = {
    '7d': 4.80,
    '30d': 5.80,
    '1y': 9.20,
  };
  const estimatedMonthly = Math.round(hostsCount * ratePerHost[retentionPeriod]);

  // Smooth scroll handler
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', color: '#0F172A', position: 'relative' }}>
      {/* ============================================================
          2. PUBLIC HEADER / NAVIGATION
          ============================================================ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: '64px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        }}
      >
        {/* Left: Brand & Status Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <span>RicozInfra</span>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#E11D48',
              display: 'inline-block'
            }} />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '3px 10px',
              borderRadius: '9999px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              fontSize: '11.5px',
              color: '#475569',
            }}
          >
            <span className="pulse-dot-emerald" />
            <span style={{ fontWeight: 600, color: '#0F172A' }}>Platform Status:</span>
            <span>99.992% Nominal</span>
          </div>
        </div>

        {/* Center Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => scrollToSection('capabilities')}
            className="nav-link-btn"
            style={{ fontSize: '13px' }}
          >
            Platform Capabilities
          </button>
          <button
            onClick={() => scrollToSection('architecture')}
            className="nav-link-btn"
            style={{ fontSize: '13px' }}
          >
            Architecture
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            className="nav-link-btn"
            style={{ fontSize: '13px' }}
          >
            Enterprise Pricing
          </button>
          <button
            onClick={() => scrollToSection('security')}
            className="nav-link-btn"
            style={{ fontSize: '13px' }}
          >
            Security &amp; Compliance
          </button>
          <button
            onClick={() => scrollToSection('differentiators')}
            className="nav-link-btn"
            style={{ fontSize: '13px' }}
          >
            Differentiators
          </button>
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => onNavigateToApp('overview')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0F172A')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
          >
            Sign In
          </button>

          <button
            onClick={() => setIsDemoModalOpen(true)}
            className="btn-slate-secondary"
            style={{ fontSize: '12.5px', padding: '7px 14px' }}
          >
            Book Technical Demo
          </button>

          <button
            onClick={() => setIsTrialModalOpen(true)}
            className="btn-crimson-primary"
            style={{ fontSize: '12.5px', padding: '7px 16px' }}
          >
            Start Free Trial
          </button>
        </div>
      </header>

      {/* ============================================================
          SECTION 1: HERO (Breathing, High-Impact)
          ============================================================ */}
      <section style={{
        padding: '80px 32px 96px 32px',
        maxWidth: '1280px',
        marginInline: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>
        {/* Pill Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          fontSize: '12.5px',
          fontWeight: 500,
          color: '#334155',
          marginBottom: '24px',
        }}>
          <span className="pulse-dot-emerald" />
          <span>eBPF-Powered Telemetry Engine — Zero Sidecar Overhead</span>
          <span style={{ color: '#CBD5E1' }}>•</span>
          <span style={{ color: '#64748B' }}>Kernel Tracepoint Ingestion</span>
        </div>

        {/* Main Headline */}
        <h1 style={{
          fontSize: '54px',
          fontWeight: 700,
          color: '#0F172A',
          letterSpacing: '-0.035em',
          lineHeight: 1.15,
          maxWidth: '920px',
          marginBottom: '20px',
        }}>
          Full-Spectrum Infrastructure Observability in Real Time.
        </h1>

        {/* Sub-headline */}
        <p style={{
          fontSize: '18px',
          color: '#475569',
          maxWidth: '820px',
          lineHeight: 1.6,
          marginBottom: '36px',
        }}>
          Unified health, performance, and availability tracking across bare-metal, virtualized machines, high-throughput networks, and hybrid clouds with ML-driven alert noise reduction.
        </p>

        {/* Dual CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '64px' }}>
          <button
            onClick={() => setIsTrialModalOpen(true)}
            className="btn-crimson-primary"
            style={{ fontSize: '14.5px', padding: '12px 26px', borderRadius: '8px' }}
          >
            <span>Deploy Free 14-Day Enterprise Trial</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => onNavigateToApp('overview')}
            className="btn-slate-secondary"
            style={{ fontSize: '14.5px', padding: '12px 24px', borderRadius: '8px' }}
          >
            <span>Launch Interactive Web Sandbox</span>
            <ExternalLink size={15} style={{ color: '#64748B' }} />
          </button>
        </div>

        {/* Live Interactive Mock Visual (Light-Mode Preview Card) */}
        <div
          className="card-white"
          style={{
            width: '100%',
            maxWidth: '1080px',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.6)',
            overflow: 'hidden',
            textAlign: 'left',
          }}
        >
          {/* Mockup Window Top Header */}
          <div style={{
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#CBD5E1' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#CBD5E1' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#CBD5E1' }} />
              <div style={{
                marginLeft: '12px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '3px 12px',
                fontSize: '11.5px',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <Lock size={11} color="#94A3B8" />
                <span>ricozinfra.internal/app/overview</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="metric-pill-emerald" style={{ fontSize: '10.5px' }}>
                <span className="pulse-dot-emerald" />
                <span>Live Kernel Stream</span>
              </span>
              <button
                onClick={() => onNavigateToApp('overview')}
                style={{
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Expand Live Sandbox →
              </button>
            </div>
          </div>

          {/* Mockup Content Body */}
          <div style={{ padding: '24px 28px', background: '#FFFFFF' }}>
            {/* Mock Correlated Alert Notification Pill */}
            <div style={{
              background: '#FFF1F2',
              border: '1px solid #FECDD3',
              borderLeft: '4px solid #E11D48',
              borderRadius: '8px',
              padding: '12px 18px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={16} color="#E11D48" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                  Incident #INC-9402: Upstream Gateway Drop
                </span>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  — 12 downstream alerts collapsed into 1 root cause (99.4% confidence)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="metric-pill-crimson" style={{ fontSize: '10.5px' }}>
                  P1 CRITICAL
                </span>
                <button
                  onClick={() => onNavigateToApp('incidents')}
                  className="btn-crimson-primary"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  Inspect Incident
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}>
              <div className="card-white" style={{ padding: '14px', background: '#F8FAFC' }}>
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>Fleet Nodes Active</div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>
                  1,428 <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 400 }}>/ 1,432</span>
                </div>
              </div>

              <div className="card-white" style={{ padding: '14px', background: '#F8FAFC' }}>
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>Fleet Ingestion Load</div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>
                  {heroEvents}k <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>events/sec</span>
                </div>
              </div>

              <div className="card-white" style={{ padding: '14px', background: '#F8FAFC' }}>
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>eBPF Socket Latency</div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>
                  {heroLatency} <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>ms avg</span>
                </div>
              </div>

              <div className="card-white" style={{ padding: '14px', background: '#F8FAFC' }}>
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>Total Throughput</div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>
                  148.6 <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>Gbps</span>
                </div>
              </div>
            </div>

            {/* Clean Single-Line Slate Workload Graph */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
                    Live Fleet Workload Ingestion
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                    ({heroEvents}k events/sec • {heroLatency}ms latency)
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>Past 24 Hours</span>
              </div>

              {/* SVG Line Graph */}
              <svg viewBox="0 0 900 120" style={{ width: '100%', height: '90px', display: 'block' }}>
                {/* Horizontal Gridlines */}
                <line x1="0" y1="20" x2="900" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="60" x2="900" y2="60" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="100" x2="900" y2="100" stroke="#F1F5F9" strokeWidth="1" />

                {/* Shaded Area */}
                <path
                  d="M 0 80 Q 150 90, 300 65 T 500 45 Q 600 20, 680 95 T 820 60 L 900 55 L 900 120 L 0 120 Z"
                  fill="#F8FAFC"
                />

                {/* Main Slate Stroke Line */}
                <path
                  d="M 0 80 Q 150 90, 300 65 T 500 45 Q 600 20, 680 95 T 820 60 L 900 55"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />

                {/* Anomaly Indicator at 14:18 UTC */}
                <line x1="680" y1="15" x2="680" y2="115" stroke="#E11D48" strokeWidth="1.5" strokeDasharray="3 3" />
                <circle cx="680" cy="95" r="4.5" fill="#E11D48" stroke="#FFFFFF" strokeWidth="2" />
                <rect x="635" y="8" width="90" height="18" rx="4" fill="#FFF1F2" stroke="#FECDD3" />
                <text x="680" y="21" fill="#E11D48" fontSize="9.5" fontWeight="600" textAnchor="middle">
                  14:18 Incident
                </text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 2: FOUR CORE CAPABILITIES (Clean 2x2 Grid)
          ============================================================ */}
      <section id="capabilities" style={{
        padding: '96px 32px',
        maxWidth: '1280px',
        marginInline: 'auto',
        borderTop: '1px solid #E2E8F0',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#E11D48',
          }}>
            Unified Telemetry Pillars
          </span>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#0F172A',
            letterSpacing: '-0.025em',
            marginTop: '8px',
          }}>
            Engineered for Modern Hybrid Topologies
          </h2>
          <p style={{ fontSize: '16px', color: '#64748B', maxWidth: '640px', marginInline: 'auto', marginTop: '10px' }}>
            From low-level Linux kernel tracepoints to globally distributed multi-cloud VPC meshes.
          </p>
        </div>

        {/* 2x2 Clean Grid (p-8, bg-[#F8FAFC], border border-slate-200) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
          gap: '28px',
        }}>
          {/* Pillar 1: Server & Virtualization Monitoring */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0F172A',
                marginBottom: '20px',
              }}>
                <Server size={20} />
              </div>

              <h3 style={{ fontSize: '19px', fontWeight: 600, color: '#0F172A', marginBottom: '10px' }}>
                1. Server &amp; Virtualization Monitoring
              </h3>

              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
                Deep inspection of VMware ESXi, KVM, Docker containers, and Kubernetes pods. Core-by-core load distribution, memory leaks, and zombie process detection without high CPU daemon overhead.
              </p>
            </div>

            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#334155',
            }}>
              <span>K8s cgroups • Hypervisor IOPS • Thread Contention</span>
              <strong style={{ color: '#10B981', fontWeight: 600 }}>0.8% Agent Footprint</strong>
            </div>
          </div>

          {/* Pillar 2: Network Performance Monitoring */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0F172A',
                marginBottom: '20px',
              }}>
                <Radio size={20} />
              </div>

              <h3 style={{ fontSize: '19px', fontWeight: 600, color: '#0F172A', marginBottom: '10px' }}>
                2. Network Performance Monitoring
              </h3>

              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
                Sub-millisecond latency tracking, packet loss maps, BGP route flapping detection, and switch-level interface saturation. Trace connection drops before users report outages.
              </p>
            </div>

            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#334155',
            }}>
              <span>TCP SYN Backlog • BGP Peering • Interface Drops</span>
              <strong style={{ color: '#0F172A', fontWeight: 600 }}>100μs Resolution</strong>
            </div>
          </div>

          {/* Pillar 3: Hybrid & Multi-Cloud Visibility */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0F172A',
                marginBottom: '20px',
              }}>
                <Globe size={20} />
              </div>

              <h3 style={{ fontSize: '19px', fontWeight: 600, color: '#0F172A', marginBottom: '10px' }}>
                3. Hybrid &amp; Multi-Cloud Visibility
              </h3>

              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
                Unified telemetry across AWS, Google Cloud, Microsoft Azure, and on-premises sovereign data centers with unified host tagging and zero blind spots across transit gateways.
              </p>
            </div>

            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#334155',
            }}>
              <span>AWS VPC Peering • Azure ExpressRoute • DirectConnect</span>
              <strong style={{ color: '#0F172A', fontWeight: 600 }}>Single Glass Pane</strong>
            </div>
          </div>

          {/* Pillar 4: Smart Thresholds & Alert Correlation */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#E11D48',
                marginBottom: '20px',
              }}>
                <Sparkles size={20} />
              </div>

              <h3 style={{ fontSize: '19px', fontWeight: 600, color: '#0F172A', marginBottom: '10px' }}>
                4. Smart Thresholds &amp; Alert Correlation
              </h3>

              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
                Dynamic ML baselining eliminating alert fatigue. Collapses cascading microservice failures into a single prioritized root-cause incident with automated blast radius mapping.
              </p>
            </div>

            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#334155',
            }}>
              <span>Noise Reduction Ratio: 92% • Zero Pager Fatigue</span>
              <strong style={{ color: '#E11D48', fontWeight: 600 }}>99.4% Precision</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 3: UNIQUE PRODUCT DIFFERENTIATORS (3-Column Clean Row)
          ============================================================ */}
      <section id="differentiators" style={{
        padding: '96px 32px',
        maxWidth: '1280px',
        marginInline: 'auto',
        borderTop: '1px solid #E2E8F0',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#E11D48',
          }}>
            Next-Gen Observability
          </span>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#0F172A',
            letterSpacing: '-0.025em',
            marginTop: '8px',
          }}>
            Built for High-Stakes Reliability Engineering
          </h2>
          <p style={{ fontSize: '16px', color: '#64748B', maxWidth: '640px', marginInline: 'auto', marginTop: '10px' }}>
            Three critical enterprise capabilities you won't find in legacy dashboard tools.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '28px',
        }}>
          {/* Card 1: Incident DVR Time Machine */}
          <div className="card-white" style={{ padding: '32px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F172A',
              marginBottom: '18px',
            }}>
              <Clock size={19} />
            </div>

            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>
              Incident DVR Time Machine
            </h3>

            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
              Scrub back to the exact second an outage began to inspect frozen cluster memory states, active socket queues, and thread stacks without recreating crashes in production.
            </p>

            <div style={{
              fontSize: '12px',
              color: '#64748B',
              paddingTop: '16px',
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <CheckCircle2 size={14} color="#10B981" />
              <span>Full kernel state replay buffer</span>
            </div>
          </div>

          {/* Card 2: Blast Radius Simulator */}
          <div className="card-white" style={{ padding: '32px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F172A',
              marginBottom: '18px',
            }}>
              <GitFork size={19} />
            </div>

            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>
              Blast Radius Simulator
            </h3>

            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
              Graph-based predictive modeling showing downstream customer impact before deploying config changes or draining nodes. Validates fault boundaries in advance.
            </p>

            <div style={{
              fontSize: '12px',
              color: '#64748B',
              paddingTop: '16px',
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <CheckCircle2 size={14} color="#10B981" />
              <span>Automated topology dependency tracing</span>
            </div>
          </div>

          {/* Card 3: Autonomous Self-Healing Runbooks */}
          <div className="card-white" style={{ padding: '32px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#FFF1F2',
              border: '1px solid #FECDD3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E11D48',
              marginBottom: '18px',
            }}>
              <Zap size={19} />
            </div>

            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>
              Autonomous Self-Healing Runbooks
            </h3>

            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
              Event-driven automated scripts that drain nodes, failover BGP anycast routes, and rotate caches within 200ms of SLA breach with full audit logging.
            </p>

            <div style={{
              fontSize: '12px',
              color: '#64748B',
              paddingTop: '16px',
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <CheckCircle2 size={14} color="#10B981" />
              <span>18s average MTTR in production</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 4: INTERACTIVE ENTERPRISE PRICING CALCULATOR
          ============================================================ */}
      <section id="pricing" style={{
        padding: '96px 32px',
        maxWidth: '1280px',
        marginInline: 'auto',
        borderTop: '1px solid #E2E8F0',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#E11D48',
          }}>
            Predictable Economics
          </span>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#0F172A',
            letterSpacing: '-0.025em',
            marginTop: '8px',
          }}>
            Transparent, Scale-Based Pricing. No Data Egress Penalties.
          </h2>
          <p style={{ fontSize: '16px', color: '#64748B', maxWidth: '680px', marginInline: 'auto', marginTop: '10px' }}>
            Zero per-gigabyte network egress charges, zero per-seat user fees. Pay solely for monitored active nodes.
          </p>
        </div>

        {/* Interactive Pricing Card Box */}
        <div
          className="card-white"
          style={{
            maxWidth: '1000px',
            marginInline: 'auto',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.05)',
            marginBottom: '64px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '48px' }}>
            {/* Left Controls: Node Slider & Retention */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
                  Monitored Instances / Nodes:
                </label>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>
                  {hostsCount.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>hosts</span>
                </div>
              </div>

              {/* Slider (10 to 5000) */}
              <input
                type="range"
                min="10"
                max="5000"
                step="10"
                value={hostsCount}
                onChange={(e) => setHostsCount(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#E11D48',
                  cursor: 'pointer',
                  height: '6px',
                  background: '#E2E8F0',
                  borderRadius: '9999px',
                }}
              />

              {/* Quick Jump Host Presets */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                {[50, 250, 1000, 2500, 5000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setHostsCount(preset)}
                    style={{
                      background: hostsCount === preset ? '#F1F5F9' : 'transparent',
                      border: '1px solid',
                      borderColor: hostsCount === preset ? '#CBD5E1' : 'transparent',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: hostsCount === preset ? '#0F172A' : '#64748B',
                      cursor: 'pointer',
                    }}
                  >
                    {preset === 5000 ? '5,000+' : preset}
                  </button>
                ))}
              </div>

              {/* Metric Retention Toggles: [ 7 Days ] [ 30 Days (Standard) ] [ 1 Year (Compliance) ] */}
              <div style={{ marginTop: '36px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '12px' }}>
                  High-Resolution Telemetry Retention:
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <button
                    onClick={() => setRetentionPeriod('7d')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: retentionPeriod === '7d' ? '1.5px solid #0F172A' : '1px solid #E2E8F0',
                      background: retentionPeriod === '7d' ? '#F8FAFC' : '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: retentionPeriod === '7d' ? 600 : 500,
                      color: '#0F172A',
                      cursor: 'pointer',
                    }}
                  >
                    7 Days
                  </button>

                  <button
                    onClick={() => setRetentionPeriod('30d')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: retentionPeriod === '30d' ? '1.5px solid #0F172A' : '1px solid #E2E8F0',
                      background: retentionPeriod === '30d' ? '#F8FAFC' : '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: retentionPeriod === '30d' ? 600 : 500,
                      color: '#0F172A',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    30 Days (Standard)
                  </button>

                  <button
                    onClick={() => setRetentionPeriod('1y')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: retentionPeriod === '1y' ? '1.5px solid #0F172A' : '1px solid #E2E8F0',
                      background: retentionPeriod === '1y' ? '#F8FAFC' : '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: retentionPeriod === '1y' ? 600 : 500,
                      color: '#0F172A',
                      cursor: 'pointer',
                    }}
                  >
                    1 Year (Compliance)
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Real-time Calculated Price Card */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Estimated Monthly Investment
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '42px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.03em' }}>
                    ${estimatedMonthly.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '15px', color: '#64748B' }}>/ month</span>
                </div>

                <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, marginBottom: '22px' }}>
                  ✓ Billed transparently per node • $0.00 egress costs
                </div>

                {/* Breakdown Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} color="#10B981" />
                    <span>eBPF collectors included across all instances</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} color="#10B981" />
                    <span>Unlimited user seats &amp; RBAC teams</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} color="#10B981" />
                    <span>SSO / SAML 2.0 &amp; Okta integration</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} color="#10B981" />
                    <span>Automated self-healing runbook triggers</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '28px' }}>
                <button
                  onClick={() => setIsTrialModalOpen(true)}
                  className="btn-crimson-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '8px' }}
                >
                  <span>Lock In Pricing &amp; Deploy Trial</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Tier Summary Matrix (Starter, Professional, Enterprise SLA) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          {/* Starter */}
          <div className="card-white" style={{ padding: '28px' }}>
            <h4 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A' }}>
              Starter
            </h4>
            <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px', marginBottom: '18px' }}>
              For emerging engineering teams launching initial clusters.
            </p>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', marginBottom: '20px' }}>
              $4.50 <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 400 }}>/ host / mo</span>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', color: '#475569' }}>
              <li>• 10s tick-rate telemetry frequency</li>
              <li>• Up to 50 monitored instances</li>
              <li>• Standard email &amp; community support</li>
              <li>• 7-day metric retention</li>
            </ul>
          </div>

          {/* Professional */}
          <div className="card-white" style={{ padding: '28px', border: '1.5px solid #0F172A', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '20px',
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: '10.5px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '9999px',
            }}>
              POPULAR
            </div>
            <h4 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A' }}>
              Professional
            </h4>
            <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px', marginBottom: '18px' }}>
              High-throughput production infrastructure with ML alerts.
            </p>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', marginBottom: '20px' }}>
              $5.80 <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 400 }}>/ host / mo</span>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', color: '#475569' }}>
              <li>• <strong>1s real-time tick-rate frequency</strong></li>
              <li>• Up to 1,000 monitored hosts</li>
              <li>• ML-driven alert noise deduplication</li>
              <li>• 4-hour business support SLA</li>
            </ul>
          </div>

          {/* Enterprise SLA */}
          <div className="card-white" style={{ padding: '28px', border: '1.5px solid #E11D48' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '17px', fontWeight: 600, color: '#E11D48' }}>
                Enterprise SLA
              </h4>
              <span className="metric-pill-crimson" style={{ fontSize: '10px' }}>MISSION CRITICAL</span>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px', marginBottom: '18px' }}>
              For global sovereign infrastructure and strict compliance.
            </p>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', marginBottom: '20px' }}>
              Custom <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 400 }}>/ volume tier</span>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', color: '#475569' }}>
              <li>• <strong>100ms sub-second tick-rate frequency</strong></li>
              <li>• Unlimited hosts &amp; sovereign VPC deployment</li>
              <li>• Dedicated Principal SRE &amp; 15-minute P1 SLA</li>
              <li>• Custom automated runbook scripting</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 5: ENTERPRISE TRUST & SECURITY
          ============================================================ */}
      <section id="security" style={{
        padding: '96px 32px',
        maxWidth: '1280px',
        marginInline: 'auto',
        borderTop: '1px solid #E2E8F0',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#E11D48',
          }}>
            Zero Compromise
          </span>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#0F172A',
            letterSpacing: '-0.025em',
            marginTop: '8px',
          }}>
            Certified Security &amp; Sovereign Cloud Readiness
          </h2>
          <p style={{ fontSize: '16px', color: '#64748B', maxWidth: '640px', marginInline: 'auto', marginTop: '10px' }}>
            Built to satisfy the stringent requirements of Tier-1 banks, defense contractors, and health networks.
          </p>
        </div>

        {/* Compliance Badges Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
          marginBottom: '36px',
        }}>
          {[
            { name: 'SOC2 Type II Certified', desc: 'Annual third-party audit of Security & Confidentiality' },
            { name: 'ISO 27001 Certified', desc: 'Information security management system standards' },
            { name: 'HIPAA BAA Compliant', desc: 'Protected health data handling with signed BAAs' },
            { name: 'GDPR & CCPA Compliant', desc: 'Data localization and sovereign EU citizen storage' },
          ].map((item, idx) => (
            <div key={idx} className="card-white" style={{ padding: '22px 20px', textAlign: 'center' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#ECFDF5',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
                marginBottom: '10px',
              }}>
                <ShieldCheck size={20} />
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
                {item.name}
              </h4>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', lineHeight: 1.4 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Air-Gapped & On-Premises Callout Box */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '32px 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
        }}>
          <div style={{ maxWidth: '780px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Lock size={18} color="#0F172A" />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A' }}>
                Air-Gapped &amp; On-Premises Sovereign Deployment
              </h3>
            </div>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
              Run RicozInfra entirely inside your sovereign cloud or private VPC without outbound internet access. Helm charts, offline license tokens, and local ClickHouse storage engines provide total data autonomy.
            </p>
          </div>

          <button
            onClick={() => setIsDemoModalOpen(true)}
            className="btn-slate-secondary"
            style={{ fontSize: '13px', padding: '10px 18px', whiteSpace: 'nowrap' }}
          >
            <span>Request Sovereign Architecture Kit</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* ============================================================
          SECTION 6: CLEAN FOOTER
          ============================================================ */}
      <footer style={{
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        padding: '80px 32px 48px 32px',
        maxWidth: '1280px',
        marginInline: 'auto',
      }}>
        {/* Multi-Column Footer */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '40px',
          marginBottom: '64px',
        }}>
          {/* Brand Info */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '12px',
            }}>
              <span>RicozInfra</span>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#E11D48',
                display: 'inline-block'
              }} />
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, maxWidth: '280px', marginBottom: '18px' }}>
              The enterprise infrastructure monitoring platform tracking servers, networks, and cloud infrastructure with ML-driven alert correlation.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
              <span className="pulse-dot-emerald" />
              <span>All Systems Operational (99.992%)</span>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.04em' }}>
              Product
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#475569' }}>
              <li><a href="#capabilities" style={{ color: 'inherit', textDecoration: 'none' }}>Server Monitoring</a></li>
              <li><a href="#capabilities" style={{ color: 'inherit', textDecoration: 'none' }}>Network Telemetry</a></li>
              <li><a href="#capabilities" style={{ color: 'inherit', textDecoration: 'none' }}>Topology Mapping</a></li>
              <li><a href="#capabilities" style={{ color: 'inherit', textDecoration: 'none' }}>Alert Correlation</a></li>
              <li><a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing Calculator</a></li>
            </ul>
          </div>

          {/* Solutions Column */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.04em' }}>
              Solutions
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#475569' }}>
              <li><a href="#security" style={{ color: 'inherit', textDecoration: 'none' }}>Air-Gapped VPC</a></li>
              <li><a href="#security" style={{ color: 'inherit', textDecoration: 'none' }}>Financial Services</a></li>
              <li><a href="#security" style={{ color: 'inherit', textDecoration: 'none' }}>Defense &amp; Government</a></li>
              <li><a href="#differentiators" style={{ color: 'inherit', textDecoration: 'none' }}>High-Throughput Edge</a></li>
              <li><a href="#differentiators" style={{ color: 'inherit', textDecoration: 'none' }}>Autonomous Runbooks</a></li>
            </ul>
          </div>

          {/* Integrations Column */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.04em' }}>
              Integrations
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#475569' }}>
              <li><span style={{ color: 'inherit' }}>Kubernetes Helm</span></li>
              <li><span style={{ color: 'inherit' }}>VMware ESXi 8.x</span></li>
              <li><span style={{ color: 'inherit' }}>AWS CloudWatch</span></li>
              <li><span style={{ color: 'inherit' }}>BGP Route Servers</span></li>
              <li><span style={{ color: 'inherit' }}>PagerDuty &amp; OpsGenie</span></li>
            </ul>
          </div>

          {/* Developers Column */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.04em' }}>
              Developers
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#475569' }}>
              <li><button onClick={() => onNavigateToApp('overview')} style={{ background: 'transparent', border: 'none', padding: 0, color: 'inherit', fontSize: '13px', cursor: 'pointer' }}>Live Sandbox</button></li>
              <li><span style={{ color: 'inherit' }}>eBPF Agent Core</span></li>
              <li><span style={{ color: 'inherit' }}>API Documentation</span></li>
              <li><span style={{ color: 'inherit' }}>Terraform Provider</span></li>
              <li><span style={{ color: 'inherit' }}>Release Notes</span></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.04em' }}>
              Security &amp; Legal
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#475569' }}>
              <li><a href="#security" style={{ color: 'inherit', textDecoration: 'none' }}>SOC2 Type II Report</a></li>
              <li><a href="#security" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a></li>
              <li><span style={{ color: 'inherit' }}>Terms of Service</span></li>
              <li><span style={{ color: 'inherit' }}>Responsible Disclosure</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Line */}
        <div style={{
          borderTop: '1px solid #E2E8F0',
          paddingTop: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          fontSize: '12.5px',
          color: '#64748B',
        }}>
          <div>
            © 2026 RicozInfra Systems. Enterprise Command Deck. Single font system powered by Inter.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => onNavigateToApp('overview')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#E11D48',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Open Live Platform App</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onOpenSandbox={() => onNavigateToApp('overview')}
      />

      <TrialModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        onLaunchDashboard={() => onNavigateToApp('overview')}
      />
    </div>
  );
};
