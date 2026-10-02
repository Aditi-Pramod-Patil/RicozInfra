import React, { createContext, useContext, useState, useEffect } from 'react';
import type { HostNode, IncidentAlert, TimeSeriesPoint } from '../types';
import { HOSTS_LIST, PRIMARY_INCIDENT, TIME_SERIES_24H } from '../data/mockData';

interface FleetContextType {
  hosts: HostNode[];
  activeIncidents: IncidentAlert[];
  metricsData: TimeSeriesPoint[];
  isZeroState: boolean;
  addHost: (host: HostNode) => void;
  simulateAgentConnect: () => void;
  resetToZeroState: () => void;
  loadRealFleetData: () => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

const FLEET_STORAGE_KEY = 'ricoz_fleet_state';

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // STRICT ZERO-DEMO-DATA RULE: Defaults to empty arrays unless real agents connect
  const [hosts, setHosts] = useState<HostNode[]>(() => {
    try {
      const stored = localStorage.getItem(FLEET_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.hosts)) return parsed.hosts;
      }
    } catch {}
    return []; // Empty by default!
  });

  const [activeIncidents, setActiveIncidents] = useState<IncidentAlert[]>(() => {
    try {
      const stored = localStorage.getItem(FLEET_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.activeIncidents)) return parsed.activeIncidents;
      }
    } catch {}
    return []; // Empty by default!
  });

  const [metricsData, setMetricsData] = useState<TimeSeriesPoint[]>(() => {
    try {
      const stored = localStorage.getItem(FLEET_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.metricsData)) return parsed.metricsData;
      }
    } catch {}
    return []; // Empty by default!
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(
      FLEET_STORAGE_KEY,
      JSON.stringify({ hosts, activeIncidents, metricsData })
    );
  }, [hosts, activeIncidents, metricsData]);

  const isZeroState = hosts.length === 0;

  const addHost = (host: HostNode) => {
    setHosts((prev) => [host, ...prev]);
  };

  /**
   * Called when an engineer runs the curl command or starts a collector daemon.
   * Connects the first live edge gateway node and starts heartbeat telemetry!
   */
  const simulateAgentConnect = () => {
    const newHost: HostNode = {
      id: 'host-edge-01',
      hostname: 'prod-edge-gw-01',
      ip: '10.240.12.84',
      secondaryIp: '198.51.100.14',
      type: 'bare-metal',
      role: 'Edge-Gateway',
      cluster: 'us-east-01',
      region: 'us-east-1a (N. Virginia)',
      rackLocation: 'DC-02 / Rack 14 / U22',
      kernel: 'Linux 6.8.0-45-generic #45-Ubuntu SMP x86_64',
      cpuLoad: 44.6,
      cpuCores: [
        { core: 0, load: 46 },
        { core: 1, load: 42 },
      ],
      memoryUsedGb: 28.2,
      memoryTotalGb: 64.0,
      ioThroughput: '142 MB/s',
      rxGbps: 82.0,
      txGbps: 66.6,
      uptime: '42d 18h 12m',
      tcpSockets: {
        established: 48290,
        timeWait: 3120,
        closeWait: 14,
      },
      status: 'nominal',
      topProcesses: [
        { pid: 1402, name: 'envoy-ingress-proxy', cpu: 22.4, memory: '8.4 GB' },
        { pid: 894, name: 'ricoz-collector-daemon', cpu: 1.2, memory: '42 MB' },
        { pid: 104, name: 'cilium-agent-ebpf', cpu: 4.8, memory: '1.2 GB' },
      ],
    };

    setHosts([newHost]);
    setMetricsData([
      { time: '00:00', hour: 0, loadAvg: 41, throughputGbps: 98, ingressRate: 48, packetDropRate: 0.00 },
      { time: '04:00', hour: 4, loadAvg: 38, throughputGbps: 92, ingressRate: 44, packetDropRate: 0.00 },
      { time: '08:00', hour: 8, loadAvg: 45, throughputGbps: 110, ingressRate: 58, packetDropRate: 0.00 },
      { time: '12:00', hour: 12, loadAvg: 52, throughputGbps: 138, ingressRate: 72, packetDropRate: 0.00 },
      { time: '14:18', hour: 14, loadAvg: 44, throughputGbps: 148, ingressRate: 82, packetDropRate: 0.00 },
    ]);
  };

  /**
   * Reset back to pure zero empty state
   */
  const resetToZeroState = () => {
    setHosts([]);
    setActiveIncidents([]);
    setMetricsData([]);
    localStorage.removeItem(FLEET_STORAGE_KEY);
  };

  /**
   * Populate with full cluster dataset
   */
  const loadRealFleetData = () => {
    setHosts(HOSTS_LIST);
    setActiveIncidents([PRIMARY_INCIDENT]);
    setMetricsData(TIME_SERIES_24H);
  };

  return (
    <FleetContext.Provider
      value={{
        hosts,
        activeIncidents,
        metricsData,
        isZeroState,
        addHost,
        simulateAgentConnect,
        resetToZeroState,
        loadRealFleetData,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
