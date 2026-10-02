package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"
)

const (
	AgentVersion = "1.0.0"
	Banner       = `
   ___  _             ____       __          
  / _ \(_)______  ___ /  _/__  _/ /______ _  
 / , _/ / __/ _ \/_ // / / _ \/ _/ __/ _ `/  
/_/|_/_/\__/\___//___/___/_//_/_/ /_/\_,_/   
  Enterprise Infrastructure Telemetry Daemon
`
)

func main() {
	configPath := flag.String("config", "/etc/ricozinfra/agent.yaml", "Path to agent configuration YAML")
	gatewayFlag := flag.String("gateway", "", "Ingestion Gateway URL override")
	apiKeyFlag := flag.String("token", "", "Organization API Key override")
	showVersion := flag.Bool("version", false, "Print agent version and exit")
	flag.Parse()

	if *showVersion {
		fmt.Printf("ricoz-agent version %s\n", AgentVersion)
		os.Exit(0)
	}

	fmt.Print(Banner)
	log.Printf("[Daemon] Initializing RicozInfra Collector v%s...", AgentVersion)

	// 1. Load System & Hardware Configuration
	cfg, err := LoadConfig(*configPath)
	if err != nil {
		log.Fatalf("❌ [Config] Failed to load configuration: %v", err)
	}

	// Apply CLI overrides if specified
	if *gatewayFlag != "" {
		cfg.GatewayURL = *gatewayFlag
	}
	if *apiKeyFlag != "" {
		cfg.APIKey = *apiKeyFlag
	}

	log.Printf("================================================================")
	log.Printf("🏷️  Host Identifier: %s", cfg.HostID)
	log.Printf("💻 Hostname:        %s", cfg.Hostname)
	log.Printf("🏢 Cluster / Role:  %s / %s", cfg.Cluster, cfg.Role)
	log.Printf("🐧 Kernel / Arch:   Linux %s (%s, %d cores)", cfg.KernelVersion, cfg.Architecture, cfg.NumCPU)
	log.Printf("☁️  Hypervisor:      %s", cfg.Hypervisor)
	log.Printf("📡 Ingest Gateway:  %s", cfg.GatewayURL)
	log.Printf("🌐 Latency Probe:   %s", cfg.ProbeTarget)
	log.Printf("🗄️  Buffer Circuit:  %d samples (5 minutes)", cfg.BufferCapacity)
	log.Printf("================================================================")

	// 2. Initialize Subsystem Collectors
	metricsCol := NewMetricsCollector()
	netCol := NewNetworkCollector(cfg.ProbeTarget)
	defer netCol.Close()

	// 3. Initialize Circular Spool Buffer
	ringBuffer := NewRingBuffer(cfg.BufferCapacity)

	// 4. Initialize Secure HTTP/2 Dispatch Client
	client, err := NewTelemetryClient(HTTPClientConfig{
		GatewayURL: cfg.GatewayURL,
		APIKey:     cfg.APIKey,
		Timeout:    4 * time.Second,
		UserAgent:  fmt.Sprintf("RicozInfra-Collector/%s (%s; %s)", AgentVersion, cfg.Architecture, cfg.Hypervisor),
	})
	if err != nil {
		log.Fatalf("❌ [Client] Failed to initialize dispatcher: %v", err)
	}

	// 5. Setup OS Signal Traps for Graceful Shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM, syscall.SIGHUP)

	ticker := time.NewTicker(cfg.SampleInterval)
	defer ticker.Stop()

	log.Println("🚀 [Daemon] Telemetry sampling engine active (1000ms loop). Ready.")

	var consecutiveFailures int

	for {
		select {
		case sig := <-sigChan:
			log.Printf("\n🛑 [Daemon] Caught signal %v. Initiating graceful shutdown...", sig)
			// Attempt to flush buffered samples before exit
			if ringBuffer.Len() > 0 {
				log.Printf("📦 [Spool] Flushing %d buffered samples before termination...", ringBuffer.Len())
				flushCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
				packets := ringBuffer.Drain()
				_ = client.SendBatch(flushCtx, packets)
				cancel()
			}
			log.Println("👋 [Daemon] Collector cleanly stopped. Exiting.")
			return

		case <-ticker.C:
			// --- STEP 1: Kernel Subsystem Metrics Sampling ---
			cpuPct := metricsCol.SampleCPUUtilization()
			memTotal, memUsed, memPressure := metricsCol.SampleMemory()
			diskReadBytes, diskWriteBytes, diskReadMB := metricsCol.SampleDiskIO()
			_, _, _ = netCol.SampleInterfaces() // compute NIC deltas
			sockStats := netCol.SampleTCPSockets()
			probeRes := netCol.GetProbeResult()

			packet := TelemetryPacket{
				HostID:    cfg.HostID,
				Hostname:  cfg.Hostname,
				Cluster:   cfg.Cluster,
				Role:      cfg.Role,
				Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
				Metrics: SystemMetrics{
					CPUUtilization:    cpuPct,
					MemoryUsedBytes:   memUsed,
					MemoryTotalBytes:  memTotal,
					MemoryPressurePct: memPressure,
					DiskReadBytes:     diskReadBytes,
					DiskReadMB:        diskReadMB,
					DiskWriteBytes:    diskWriteBytes,
					PacketLossPct:     probeRes.PacketLossPct,
					RTTMs:             probeRes.RTTMs,
					ActiveSockets:     sockStats.TotalInUse,
				},
			}

			// --- STEP 2: Transmission & Resilience Circuit ---
			ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)

			if ringBuffer.Len() > 0 {
				// We have spooled data from a previous network hiccup.
				// Batch send spooled data + current packet to catch up.
				spooled := ringBuffer.DrainBatch(20) // send up to 20 per tick
				batch := append(spooled, packet)

				err := client.SendBatch(ctx, batch)
				cancel()

				if err == nil {
					log.Printf("⚡ [Telemetry Flush] Resumed! Sent batch of %d packets (%d remaining in spool). CPU: %.1f%%, RTT: %.2fms",
						len(batch), ringBuffer.Len(), cpuPct, probeRes.RTTMs)
					consecutiveFailures = 0
				} else {
					consecutiveFailures++
					// Re-enqueue spooled packets and current packet
					for _, p := range batch {
						ringBuffer.Push(p)
					}
					if consecutiveFailures%10 == 1 {
						log.Printf("⚠️ [Circuit-Breaker] Upstream unavailable (%v). Spooling: %d/%d packets",
							err, ringBuffer.Len(), ringBuffer.Capacity())
					}
				}
			} else {
				// Nominal real-time path
				err := client.SendTelemetry(ctx, packet)
				cancel()

				if err == nil {
					if consecutiveFailures > 0 {
						log.Println("✅ [Gateway] Connection restored to nominal state.")
						consecutiveFailures = 0
					}
				} else {
					consecutiveFailures++
					evicted := ringBuffer.Push(packet)
					if evicted {
						log.Printf("🔥 [Spool-Overflow] Buffer full! Evicted oldest sample to honor memory limit. Spooled: %d", ringBuffer.Len())
					} else if consecutiveFailures%5 == 1 {
						log.Printf("⚠️ [Network-Hiccup] Ingestion failed (%v). Spooling data point (%d/%d)",
							err, ringBuffer.Len(), ringBuffer.Capacity())
					}
				}
			}
		}
	}
}
