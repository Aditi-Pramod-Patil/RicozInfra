/**
 * RicozInfra Dummy Telemetry Emitter (Mock Agent)
 * Simulates a lightweight host agent reporting to POST /api/v1/telemetry/ingest every 1000ms.
 * Run via: npm run agent:mock
 */

const BACKEND_BASE = process.env.BACKEND_URL ? process.env.BACKEND_URL.replace(/\/$/, '') : '';
const INGEST_URL = process.env.INGESTION_GATEWAY_URL || (BACKEND_BASE ? `${BACKEND_BASE}/api/v1/telemetry/ingest` : 'http://localhost:8080/api/v1/telemetry/ingest');
const HOSTNAME = 'prod-edge-gw-01';
const HOST_ID = 'c73e34b2-2980-4c31-90c7-prod-edge-gw-01';
const CLUSTER = 'us-east-cluster-01';
const ROLE = 'Edge-Gateway';

console.log('\n======================================================');
console.log('📡 [RicozInfra Mock Agent] Starting live telemetry stream...');
console.log(`Target Gateway: ${INGEST_URL}`);
console.log(`Target Host:    ${HOSTNAME} (${ROLE}) [${HOST_ID}]`);
console.log(`Cluster:        ${CLUSTER}`);
console.log(`Interval:       Every 1000ms`);
console.log('======================================================\n');

let sampleCount = 0;

async function sendTelemetryTick() {
  sampleCount++;

  // Simulate realistic fluctuating metrics
  const isSpike = Math.random() < 0.05;
  const cpu = Number((42.4 + (Math.random() * 4 - 2) + (isSpike ? 45 : 0)).toFixed(1));
  const rtt = Number((4.2 + (Math.random() * 0.4 - 0.2) + (isSpike ? 150 : 0)).toFixed(1));
  const packetLoss = isSpike ? Number((2.8 + Math.random() * 1.5).toFixed(2)) : 0.001;
  const sockets = 48290 + Math.floor(Math.random() * 200 - 100);

  const payload = {
    host_id: HOST_ID,
    hostname: HOSTNAME,
    cluster: CLUSTER,
    role: ROLE,
    timestamp: new Date().toISOString(),
    metrics: {
      cpu_utilization: cpu,
      memory_used_bytes: 36248924160 + Math.floor(Math.random() * 50000000),
      memory_total_bytes: 68719476736,
      memory_pressure_pct: 52.7,
      disk_read_bytes: 18454937,
      disk_read_mb: 17.6,
      packet_loss_pct: packetLoss,
      rtt_ms: rtt,
      active_sockets: sockets,
    },
  };

  try {
    const res = await fetch(INGEST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RicozInfra-MockAgent/1.0',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json() as any;
      console.log(
        `⚡ [Mock-Agent #${sampleCount}] Heartbeat sent: CPU=${cpu}% | RTT=${rtt}ms | Sockets=${sockets} (HTTP ${res.status} Accepted, activeNodes=${data.active_nodes ?? 1})`
      );
    } else {
      const text = await res.text();
      console.warn(`⚠️ [Mock-Agent #${sampleCount}] Gateway returned HTTP ${res.status}: ${text}`);
    }
  } catch (err) {
    console.warn(`❌ [Mock-Agent #${sampleCount}] Connection failed: ${(err as Error).message}`);
    console.log('   (Ensure RicozInfra Ingestion Server is running: npm run server in backend/)');
  }
}

// Tick immediately then every 1000ms
sendTelemetryTick();
setInterval(sendTelemetryTick, 1000);
