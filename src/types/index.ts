export type PageView = 
  | 'landing'
  | 'signin'
  | 'signup'
  | 'overview' 
  | 'hosts' 
  | 'topology' 
  | 'incidents' 
  | 'telemetry' 
  | 'runbooks';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'sre' | 'viewer';
  orgId: string;
  orgName: string;
  apiKey: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  apiKey: string;
  createdAt: string;
}

export type HostType = 'bare-metal' | 'esxi' | 'k8s';

export type HostStatus = 'nominal' | 'critical';

export interface HostProcess {
  pid: number;
  name: string;
  cpu: number;
  memory: string;
}

export interface HostNode {
  id: string;
  hostname: string;
  ip: string;
  secondaryIp?: string;
  type: HostType;
  role: string;
  cluster: string;
  region: string;
  rackLocation: string;
  kernel: string;
  cpuLoad: number;
  cpuCores: { core: number; load: number }[];
  memoryUsedGb: number;
  memoryTotalGb: number;
  ioThroughput: string;
  rxGbps: number;
  txGbps: number;
  uptime: string;
  tcpSockets: {
    established: number;
    timeWait: number;
    closeWait: number;
  };
  status: HostStatus;
  incidentRef?: string;
  topProcesses: HostProcess[];
}

export interface TimeSeriesPoint {
  time: string;
  hour: number;
  loadAvg: number;
  throughputGbps: number;
  ingressRate: number;
  packetDropRate: number;
  isIncidentMarker?: boolean;
  incidentAnnotation?: string;
}

export interface TopologyNode {
  id: string;
  label: string;
  tier: 1 | 2 | 3 | 4 | 5;
  tierName: string;
  role: string;
  ip: string;
  status: 'nominal' | 'critical';
  cpuPercent: number;
  qps: number;
  p99LatencyMs: number;
  errorRate: number;
  x: number;
  y: number;
}

export interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  status: 'nominal' | 'degraded';
  latencyAnnotation?: string;
  errorRateAnnotation?: string;
  throughput: string;
}

export interface IncidentAlert {
  id: string;
  title: string;
  severity: 'P1' | 'P2' | 'P3';
  status: 'Active' | 'Mitigating' | 'Resolved';
  startTime: string;
  duration: string;
  targetNode: string;
  confidenceScore: number;
  suppressedCount: number;
  rootCause: string;
  vitals: {
    p99LatencyMs: number;
    normalP99Ms: number;
    errorRatePercent: number;
    normalErrorRate: number;
    ingressBandwidthGbps: number;
    normalIngressGbps: number;
  };
  timeline: {
    time: string;
    title: string;
    description: string;
    isMilestone?: boolean;
    level: 'critical' | 'info' | 'ml';
  }[];
  blastRadius: {
    namespace: string;
    service: string;
    status: 'impacted' | 'isolated';
    impactDetail: string;
  }[];
  selfHealingRule: {
    condition: string;
    action: string;
    successRate: string;
    mttr: string;
    lastExecuted: string;
  };
}

export interface RunbookItem {
  id: string;
  name: string;
  category: 'Network' | 'Compute' | 'Storage';
  description: string;
  stepsCount: number;
  avgDuration: string;
  status: 'Verified' | 'Draft';
  targetType: string;
  lastRunResult: 'Success' | 'Pending';
}
