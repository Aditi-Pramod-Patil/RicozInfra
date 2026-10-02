# RicozInfra Telemetry Collector Daemon (`ricoz-agent`)

The **RicozInfra Collector** is a production-grade, ultra-lightweight host telemetry agent written in pure Go (Golang) with **zero external runtime dependencies**. It compiles into a single statically linked binary designed to monitor bare-metal Linux servers, VMware ESXi virtual machines, and Kubernetes DaemonSets with sub-second accuracy.

---

## ⚡ Performance Budget & Footprint Guarantee

| Resource | Target Budget | Observed Real-World Footprint |
| :--- | :--- | :--- |
| **Resident Set Size (RAM)** | `< 25.0 MB` | **~14.2 MB** (Enforced by `MemoryMax=32M`) |
| **CPU Utilization** | `< 0.5%` overhead | **~0.15% - 0.28%** on standard 4-core Linux |
| **Binary Size** | `< 15.0 MB` | **~9.1 MB** (stripped with `-ldflags="-s -w"`) |
| **External CLI Dependencies** | Zero | Direct `/proc` and `/sys` virtual filesystem parsing |

---

## 🏗️ Architecture & Subsystems

```
                     ┌───────────────────────────────────┐
                     │    Linux Kernel Virtual FS        │
                     │  /proc/stat, /proc/meminfo, etc.  │
                     └─────────────────┬─────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ricoz-agent                                     │
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────┐  │
│  │ Metrics Collector     │  │ Network Collector     │  │ Async RTT Probe │  │
│  │ - CPU delta jiffies   │  │ - /proc/net/dev delta │  │ - TCP SYN-ACK   │  │
│  │ - MemAvailable/Total  │  │ - /proc/net/sockstat  │  │ - Microsecond   │  │
│  │ - /proc/diskstats I/O │  │ - Socket tables       │  │   jitter/loss   │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  └────────┬────────┘  │
│              │                          │                       │           │
│              └──────────────────────────┼───────────────────────┘           │
│                                         ▼                                   │
│                        ┌─────────────────────────────────┐                  │
│                        │  Telemetry Packet Assembly      │                  │
│                        │  (1,000ms real-time sampling)   │                  │
│                        └────────────────┬────────────────┘                  │
│                                         │                                   │
│            ┌────────────────────────────┴───────────────────────────┐       │
│            │                                                        │       │
│    (Network Nominal)                                        (Network Down)  │
│            ▼                                                        ▼       │
│  ┌────────────────────────┐                               ┌────────────────┐│
│  │ HTTP/2 Dispatch Client │                               │ In-Memory Ring ││
│  │ - sync.Pool gzip comp. │                               │ Buffer (FIFO)  ││
│  │ - Connection Pooling   │                               │ 300 data pts   ││
│  │ - Bearer Token Auth    │                               │ 5-min circuit  ││
│  └───────────┬────────────┘                               └────────────────┘│
└──────────────┼──────────────────────────────────────────────────────────────┘
               ▼
     POST /api/v1/telemetry/ingest (HTTP/2 + gzip)
```

### 1. Direct Kernel Telemetry Gathering
- **CPU Utilization**: Directly reads `/proc/stat` to calculate true non-idle vs idle CPU jiffies across all available cores without launching external processes.
- **Memory Pressure**: Parses `/proc/meminfo` capturing `MemTotal`, `MemAvailable`, `Buffers`, and `Cached` to compute true OS memory pressure.
- **Disk I/O Subsystem**: Parses `/proc/diskstats` for physical drive sectors read and written, ignoring virtual loopback and ram devices.
- **Process Vitals**: Directly iterates `/proc/[pid]/statm` and `/proc/[pid]/comm` to isolate top consuming processes.
- **Network Interfaces**: Directly parses `/proc/net/dev` with timestamp-differenced snapshots to compute exact Rx/Tx bytes/sec, packet rates, and drop counters per NIC.
- **Socket Counters**: Reads `/proc/net/sockstat` for instantaneous kernel-level tracking of active, TIME_WAIT, and CLOSE sockets.
- **Microsecond Latency Probe**: Built-in non-blocking TCP SYN-ACK probe tracking regional gateway RTT, jitter, and packet loss without requiring `CAP_NET_RAW`.

### 2. High-Efficiency HTTP/2 Transport & Memory Management
- **Zero-Allocation Compression**: Utilizes `sync.Pool` for `bytes.Buffer` and `gzip.Writer` recycling, eliminating garbage collection pressure.
- **5-Minute Circular Spool Buffer**: Thread-safe 300-point bounded FIFO ring buffer spools telemetry during network disconnects and auto-flushes in adaptive batches upon recovery.

---

## 🚀 One-Line Production Installer

Run on any supported Linux machine (Ubuntu, Debian, RHEL, CentOS, Rocky, Amazon Linux):

```bash
curl -sSL https://get.ricozinfra.com/install.sh | sudo bash -s -- --token=YOUR_API_KEY
```

Optional installer flags:
- `--token=<KEY>`: Your organization API bearer token (**Required**).
- `--gateway=<URL>`: Custom ingestion endpoint (Default: `https://ingest.ricozinfra.com/api/v1/telemetry/ingest`).
- `--cluster=<NAME>`: Infrastructure cluster name (Default: `us-east-cluster-01`).
- `--role=<ROLE>`: Host role (Default: `Edge-Gateway`).

---

## 🛠️ Building From Source

### Prerequisites
- Go 1.22+ installed
- Make (optional)

### Compilation
```bash
# Build native binary for host OS
make build

# Cross-compile for Linux amd64
make build-linux-amd64

# Cross-compile for Linux arm64 (AWS Graviton, Apple Silicon, etc.)
make build-linux-arm64

# Package release tarballs with SHA256 checksums
make package
```

The resulting stripped binaries will be placed in `./bin/ricoz-agent`.

---

## ⚙️ Configuration (`/etc/ricozinfra/agent.yaml`)

```yaml
gateway_url: "https://ingest.ricozinfra.com/api/v1/telemetry/ingest"
api_key: "ricoz_live_sec_prod_key_99420a7b"
cluster: "us-east-cluster-01"
role: "Edge-Gateway"
sample_interval: "1000ms"
probe_target: "1.1.1.1:443"
buffer_capacity: 300
```

---

## 🛡️ Systemd Service Management

```bash
# View collector live stream logs
journalctl -u ricoz-agent -f

# Check service status and resource accounting
systemctl status ricoz-agent

# Restart daemon
sudo systemctl restart ricoz-agent
```
