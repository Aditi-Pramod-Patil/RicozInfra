import React, { useState, useEffect } from 'react';
import type { PageView } from './types';
import { Header } from './components/Header';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { TerminalModal } from './components/TerminalModal';
import { RunbookModal } from './components/RunbookModal';
import { LandingView } from './views/LandingView';
import { OverviewView } from './views/OverviewView';
import { HostInventoryView } from './views/HostInventoryView';
import { TopologyView } from './views/TopologyView';
import { IncidentsView } from './views/IncidentsView';
import { TelemetryView } from './views/TelemetryView';
import { RunbooksView } from './views/RunbooksView';
import { FLEET_METRICS } from './data/mockData';

export const App: React.FC = () => {
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
  const [activeP1Count, setActiveP1Count] = useState<number>(FLEET_METRICS.activeP1Incidents);

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

  const handleOpenTerminal = (hostname: string, ip: string = '10.240.12.84') => {
    setTerminalState({
      isOpen: true,
      hostname,
      ip,
    });
  };

  const handleSelectHost = (hostname: string) => {
    setSelectedHostName(hostname);
    setCurrentView('hosts');
  };

  const handleRunbookSuccess = () => {
    // When runbook executes successfully
    setActiveP1Count(0);
  };

  // If on Public Marketing Landing Page
  if (currentView === 'landing') {
    return (
      <LandingView
        onNavigateToApp={(view) => setCurrentView(view || 'overview')}
      />
    );
  }

  // Otherwise, render Live Enterprise Command Deck
  return (
    <div className="app-container">
      {/* Persistent Global Top Navigation Header (Pure White) */}
      <Header
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenSearch={() => setIsSearchOpen(true)}
        cluster={cluster}
        onSelectCluster={(c) => setCluster(c)}
        activeP1Count={activeP1Count}
      />

      {/* Main Dedicated Light-Mode Viewport */}
      <main className="main-viewport">
        {currentView === 'overview' && (
          <OverviewView
            onNavigate={(view) => setCurrentView(view)}
            onOpenRunbookModal={() => setIsRunbookModalOpen(true)}
          />
        )}

        {currentView === 'hosts' && (
          <HostInventoryView
            selectedHostName={selectedHostName}
            onOpenTerminal={handleOpenTerminal}
            onNavigateToIncidents={() => setCurrentView('incidents')}
          />
        )}

        {currentView === 'topology' && (
          <TopologyView
            onSelectHost={handleSelectHost}
            onNavigateToIncidents={() => setCurrentView('incidents')}
          />
        )}

        {currentView === 'incidents' && (
          <IncidentsView
            onOpenRunbookModal={() => setIsRunbookModalOpen(true)}
            onNavigateToHosts={() => {
              setSelectedHostName('prod-edge-gw-01');
              setCurrentView('hosts');
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
        onNavigate={(view) => setCurrentView(view)}
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

export default App;
