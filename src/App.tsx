import React, { useState, useEffect } from 'react';
import type { PageView } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FleetProvider, useFleet } from './context/FleetContext';
import { Header } from './components/Header';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { TerminalModal } from './components/TerminalModal';
import { RunbookModal } from './components/RunbookModal';
import { LandingView } from './views/LandingView';
import { SignInView } from './views/SignInView';
import { SignUpView } from './views/SignUpView';
import { OverviewView } from './views/OverviewView';
import { HostInventoryView } from './views/HostInventoryView';
import { TopologyView } from './views/TopologyView';
import { IncidentsView } from './views/IncidentsView';
import { TelemetryView } from './views/TelemetryView';
import { RunbooksView } from './views/RunbooksView';

/**
 * Inner app component that has access to Auth + Fleet context.
 * Enforces route protection: unauthenticated users are redirected to signin
 * when attempting to access any console view.
 */
const AppInner: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const { activeIncidents } = useFleet();

  // Default to the Public Marketing & Acquisition Landing Page
  const [currentView, setCurrentView] = useState<PageView>('landing');
  const [cluster, setCluster] = useState('us-east-01');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRunbookModalOpen, setIsRunbookModalOpen] = useState(false);
  const [terminalState, setTerminalState] = useState<{ isOpen: boolean; hostname: string; ip: string }>({
    isOpen: false,
    hostname: 'prod-edge-gw-01',
    ip: '10.240.12.84',
  });
  const [selectedHostName, setSelectedHostName] = useState<string>('prod-edge-gw-01');

  // Derive active P1 incident count from live FleetContext (zero-demo-data compliant)
  const activeP1Count = activeIncidents.filter(i => i.severity === 'P1' && i.status !== 'Resolved').length;

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * AUTH-GUARDED NAVIGATION:
   * Console views (overview, hosts, topology, incidents, telemetry, runbooks)
   * require authentication. Unauthenticated users are redirected to signin.
   * Landing, signin, and signup are always accessible.
   */
  const handleNavigate = (view: PageView) => {
    const publicViews: PageView[] = ['landing', 'signin', 'signup'];
    if (!publicViews.includes(view) && !isAuthenticated) {
      setCurrentView('signin');
      return;
    }
    // If authenticated user explicitly navigates to signin/signup, logout first
    // so they see a clean, fresh auth form
    if ((view === 'signin' || view === 'signup') && isAuthenticated) {
      logout();
    }
    setCurrentView(view);
  };

  const handleOpenTerminal = (hostname: string, ip: string = '10.240.12.84') => {
    setTerminalState({
      isOpen: true,
      hostname,
      ip,
    });
  };

  const handleSelectHost = (hostname: string) => {
    setSelectedHostName(hostname);
    handleNavigate('hosts');
  };

  const handleRunbookSuccess = () => {
    // Runbook execution handled through FleetContext
  };

  // Public Marketing Landing Page
  if (currentView === 'landing') {
    return (
      <LandingView
        onNavigateToApp={(view) => handleNavigate(view || 'overview')}
      />
    );
  }

  // Sign In Page (publicly accessible)
  if (currentView === 'signin') {
    return <SignInView onNavigate={handleNavigate} />;
  }

  // Sign Up Page (publicly accessible)
  if (currentView === 'signup') {
    return <SignUpView onNavigate={handleNavigate} />;
  }

  // Console views require authentication — redirect if not authenticated
  if (!isAuthenticated) {
    handleNavigate('signin');
    return null;
  }

  // Render Live Enterprise Command Deck (authenticated)
  return (
    <div className="app-container">
      {/* Persistent Global Top Navigation Header (Pure White) */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
        cluster={cluster}
        onSelectCluster={(c) => setCluster(c)}
        activeP1Count={activeP1Count}
      />

      {/* Main Dedicated Light-Mode Viewport */}
      <main className="main-viewport">
        {currentView === 'overview' && (
          <OverviewView
            onNavigate={handleNavigate}
            onOpenRunbookModal={() => setIsRunbookModalOpen(true)}
          />
        )}

        {currentView === 'hosts' && (
          <HostInventoryView
            selectedHostName={selectedHostName}
            onOpenTerminal={handleOpenTerminal}
            onNavigateToIncidents={() => handleNavigate('incidents')}
          />
        )}

        {currentView === 'topology' && (
          <TopologyView
            onSelectHost={handleSelectHost}
            onNavigateToIncidents={() => handleNavigate('incidents')}
          />
        )}

        {currentView === 'incidents' && (
          <IncidentsView
            onOpenRunbookModal={() => setIsRunbookModalOpen(true)}
            onNavigateToHosts={() => {
              setSelectedHostName('prod-edge-gw-01');
              handleNavigate('hosts');
            }}
          />
        )}

        {currentView === 'telemetry' && <TelemetryView />}

        {currentView === 'runbooks' && (
          <RunbooksView onOpenRunbookModal={() => setIsRunbookModalOpen(true)} />
        )}
      </main>

      {/* Interactive Global Command Palette Modal (Cmd+K) */}
      <CommandPaletteModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
        onSelectHost={handleSelectHost}
        onOpenTerminal={(hostname) => handleOpenTerminal(hostname)}
      />

      {/* Interactive Linux SSH Terminal Modal (Light Mode Inter Font) */}
      <TerminalModal
        isOpen={terminalState.isOpen}
        hostname={terminalState.hostname}
        ip={terminalState.ip}
        onClose={() => setTerminalState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Autonomous Runbook Execution Modal (Light Mode) */}
      <RunbookModal
        isOpen={isRunbookModalOpen}
        onClose={() => setIsRunbookModalOpen(false)}
        onSuccess={handleRunbookSuccess}
      />
    </div>
  );
};

/**
 * Root App component: Wraps the entire application in AuthProvider and FleetProvider.
 * This ensures useAuth() and useFleet() are available everywhere in the component tree.
 */
export const App: React.FC = () => {
  return (
    <AuthProvider>
      <FleetProvider>
        <AppInner />
      </FleetProvider>
    </AuthProvider>
  );
};

export default App;
