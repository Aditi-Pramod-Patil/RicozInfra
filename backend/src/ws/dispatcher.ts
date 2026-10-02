import type { WebSocket } from 'ws';
import { NodeRegistry } from '../registry/nodeRegistry.js';
import { config } from '../config.js';

interface ClientMetadata {
  id: string;
  socket: WebSocket;
  isAlive: boolean;
  clusterFilter?: string;
}

export class WebSocketDispatcher {
  private clients: Map<string, ClientMetadata> = new Map();
  private broadcastTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private registry = NodeRegistry.getInstance();

  constructor() {
    this.startHeartbeatLoop();
    this.startBroadcastLoop();
  }

  /**
   * Register a new connected WebSocket client
   */
  public registerClient(socket: WebSocket, id = `client-${Math.random().toString(36).substring(2, 9)}`): void {
    const client: ClientMetadata = {
      id,
      socket,
      isAlive: true,
    };

    this.clients.set(id, client);
    console.log(`[WS Dispatcher] Client ${id} connected. Total active clients: ${this.clients.size}`);

    // Send immediate initial sync snapshot
    this.sendSnapshot(client);

    socket.on('pong', () => {
      const c = this.clients.get(id);
      if (c) c.isAlive = true;
    });

    socket.on('message', (data: string | Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'PONG') {
          const c = this.clients.get(id);
          if (c) c.isAlive = true;
        } else if (msg.type === 'FILTER_CLUSTER') {
          const c = this.clients.get(id);
          if (c) c.clusterFilter = msg.cluster;
        } else if (msg.type === 'PING') {
          if (socket.readyState === 1) {
            socket.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
          }
        }
      } catch {
        // Ignore malformed client frames
      }
    });

    socket.on('close', () => {
      this.clients.delete(id);
      console.log(`[WS Dispatcher] Client ${id} disconnected. Active clients: ${this.clients.size}`);
    });

    socket.on('error', (err: Error) => {
      console.warn(`[WS Dispatcher] Client ${id} error:`, err.message);
      this.clients.delete(id);
    });
  }

  /**
   * Prepare live telemetry broadcast payload from NodeRegistry
   */
  public generateBroadcastPayload() {
    const summary = this.registry.getRollupSummary();
    const activeNodes = this.registry.getActiveNodes();
    const isAwaitingTelemetry = activeNodes.length === 0;

    return {
      type: 'FLEET_TELEMETRY_DELTA',
      timestamp: new Date().toISOString(),
      isAwaitingTelemetry,
      summary: {
        fleet_nodes_active: summary.totalNodes,
        fleet_nodes_total: summary.totalNodes,
        global_avg_cpu_pct: summary.avgCpu,
        aggregate_throughput_gbps: summary.totalThroughputGbps,
        mean_rtt_ms: summary.meanRttMs,
        aggregate_packet_loss_pct: summary.aggregatePacketLossPct,
        active_tcp_connections: summary.activeTcpConnections,
        active_p1_incidents: summary.activeIncidents.length,
      },
      fleetSummary: {
        totalNodes: summary.totalNodes,
        avgCpu: summary.avgCpu,
        totalThroughputGbps: summary.totalThroughputGbps,
        meanRttMs: summary.meanRttMs,
        aggregatePacketLossPct: summary.aggregatePacketLossPct,
        activeTcpConnections: summary.activeTcpConnections,
        activeIncidents: summary.activeIncidents,
      },
      hosts: activeNodes.map((n) => ({
        id: n.id,
        hostname: n.hostname,
        cluster: n.cluster,
        role: n.role,
        type: n.type,
        ip: n.ip,
        region: n.region,
        cpuLoad: n.cpuLoad,
        memoryPct: n.memoryPct,
        rxGbps: n.rxGbps,
        txGbps: n.txGbps,
        uptime: n.uptime,
        status: n.status,
        lastSeen: n.lastSeen,
      })),
    };
  }

  /**
   * 1-Second Broadcast loop pushing real-time aggregated metrics to frontends
   */
  private startBroadcastLoop(): void {
    this.broadcastTimer = setInterval(() => {
      if (this.clients.size === 0) return;

      try {
        const payload = this.generateBroadcastPayload();
        const serialized = JSON.stringify(payload);

        for (const [id, client] of this.clients.entries()) {
          if (client.socket.readyState === 1) { // OPEN
            client.socket.send(serialized);
          } else {
            this.clients.delete(id);
          }
        }
      } catch (err) {
        console.error('[WS Dispatcher] Broadcast tick error:', (err as Error).message);
      }
    }, config.ws.broadcastIntervalMs || 1000);
  }

  /**
   * Heartbeat cycle checking socket health every 15s
   */
  private startHeartbeatLoop(): void {
    this.heartbeatTimer = setInterval(() => {
      for (const [id, client] of this.clients.entries()) {
        if (!client.isAlive) {
          console.log(`[WS Dispatcher] Terminating idle/dead client ${id}`);
          client.socket.terminate();
          this.clients.delete(id);
          continue;
        }

        client.isAlive = false;
        try {
          client.socket.ping();
        } catch {
          this.clients.delete(id);
        }
      }
    }, config.ws.heartbeatIntervalMs || 15000);
  }

  /**
   * Immediate snapshot sent when a frontend connects
   */
  private sendSnapshot(client: ClientMetadata): void {
    try {
      const payload = this.generateBroadcastPayload();
      if (client.socket.readyState === 1) {
        client.socket.send(JSON.stringify(payload));
      }
    } catch (err) {
      console.warn('[WS Dispatcher] Failed to send snapshot:', (err as Error).message);
    }
  }

  public getConnectedClientCount(): number {
    return this.clients.size;
  }

  public stop(): void {
    if (this.broadcastTimer) clearInterval(this.broadcastTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    for (const [, client] of this.clients.entries()) {
      client.socket.close();
    }
    this.clients.clear();
  }
}
