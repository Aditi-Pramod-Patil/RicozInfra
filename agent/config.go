package main

import (
	"bufio"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"runtime"
	"strings"
	"time"
)

// AgentConfig holds the daemon runtime parameters
type AgentConfig struct {
	GatewayURL     string        `json:"gateway_url" yaml:"gateway_url"`
	APIKey         string        `json:"api_key" yaml:"api_key"`
	HostID         string        `json:"host_id" yaml:"host_id"`
	Hostname       string        `json:"hostname" yaml:"hostname"`
	Cluster        string        `json:"cluster" yaml:"cluster"`
	Role           string        `json:"role" yaml:"role"`
	SampleInterval time.Duration `json:"sample_interval" yaml:"sample_interval"`
	ProbeTarget    string        `json:"probe_target" yaml:"probe_target"`
	KernelVersion  string        `json:"kernel_version"`
	Architecture   string        `json:"architecture"`
	NumCPU         int           `json:"num_cpu"`
	Hypervisor     string        `json:"hypervisor"`
	BufferCapacity int           `json:"buffer_capacity"`
}

// LoadConfig initializes configuration from config file, OS detection, and environment variables
func LoadConfig(configPath string) (*AgentConfig, error) {
	cfg := &AgentConfig{
		GatewayURL:     "http://localhost:8080/api/v1/telemetry/ingest",
		Cluster:        "us-east-cluster-01",
		Role:           "Edge-Gateway",
		SampleInterval: 1000 * time.Millisecond,
		ProbeTarget:    "1.1.1.1:443",
		Architecture:   fmt.Sprintf("%s/%s", runtime.GOOS, runtime.GOARCH),
		NumCPU:         runtime.NumCPU(),
		BufferCapacity: 300, // 5 minutes at 1Hz
	}

	// 1. Hostname detection
	if h, err := os.Hostname(); err == nil && h != "" {
		cfg.Hostname = h
	} else {
		cfg.Hostname = "unknown-host"
	}

	// 2. Machine ID / Host ID detection
	cfg.HostID = detectMachineID()

	// 3. Kernel Version detection
	cfg.KernelVersion = detectKernelVersion()

	// 4. Hypervisor / Hardware type detection (Bare-Metal vs VMware vs KVM vs Cloud)
	cfg.Hypervisor = detectHypervisor()
	if cfg.Hypervisor == "VMware" {
		cfg.Role = "VMware-ESXi"
	} else if cfg.Hypervisor == "Kubernetes" {
		cfg.Role = "K8s-Pod"
	}

	// 5. Environment variable overrides
	if val := os.Getenv("RICOZ_GATEWAY_URL"); val != "" {
		cfg.GatewayURL = val
	}
	if val := os.Getenv("RICOZ_API_KEY"); val != "" {
		cfg.APIKey = val
	}
	if val := os.Getenv("RICOZ_CLUSTER"); val != "" {
		cfg.Cluster = val
	}
	if val := os.Getenv("RICOZ_ROLE"); val != "" {
		cfg.Role = val
	}
	if val := os.Getenv("RICOZ_HOSTNAME"); val != "" {
		cfg.Hostname = val
	}
	if val := os.Getenv("RICOZ_PROBE_TARGET"); val != "" {
		cfg.ProbeTarget = val
	}

	return cfg, nil
}

// detectMachineID reads /etc/machine-id, /var/lib/dbus/machine-id, or generates a deterministic UUID
func detectMachineID() string {
	paths := []string{"/etc/machine-id", "/var/lib/dbus/machine-id", "/sys/class/dmi/id/product_uuid"}
	for _, p := range paths {
		if data, err := os.ReadFile(p); err == nil {
			id := strings.TrimSpace(string(data))
			if len(id) >= 16 {
				return id
			}
		}
	}

	// Fallback: Generate a persistent random ID in memory
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// detectKernelVersion reads /proc/version directly
func detectKernelVersion() string {
	if data, err := os.ReadFile("/proc/version"); err == nil {
		fields := strings.Fields(string(data))
		if len(fields) >= 3 {
			return fields[2] // Linux kernel release string
		}
		return strings.TrimSpace(string(data))
	}
	return runtime.Version()
}

// detectHypervisor inspects DMI / SMBIOS sysfs nodes without external binaries
func detectHypervisor() string {
	// Check Kubernetes pod environment
	if os.Getenv("KUBERNETES_SERVICE_HOST") != "" || fileExists("/var/run/secrets/kubernetes.io") {
		return "Kubernetes"
	}

	// Inspect DMI system vendor & product name
	productPaths := []string{
		"/sys/class/dmi/id/product_name",
		"/sys/class/dmi/id/sys_vendor",
		"/sys/devices/virtual/dmi/id/product_name",
	}

	for _, p := range productPaths {
		if data, err := os.ReadFile(p); err == nil {
			val := strings.ToLower(string(data))
			if strings.Contains(val, "vmware") {
				return "VMware"
			}
			if strings.Contains(val, "kvm") || strings.Contains(val, "qemu") || strings.Contains(val, "bochs") {
				return "KVM"
			}
			if strings.Contains(val, "amazon ec2") || strings.Contains(val, "nitro") {
				return "AWS-Nitro"
			}
			if strings.Contains(val, "google") {
				return "GCP-Compute"
			}
			if strings.Contains(val, "microsoft") {
				return "Azure-HyperV"
			}
		}
	}

	// Inspect /sys/hypervisor/type
	if data, err := os.ReadFile("/sys/hypervisor/type"); err == nil {
		hType := strings.TrimSpace(string(data))
		if hType != "" {
			return hType
		}
	}

	// Check /proc/cpuinfo for hypervisor flag
	if file, err := os.Open("/proc/cpuinfo"); err == nil {
		defer file.Close()
		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			line := scanner.Text()
			if strings.HasPrefix(line, "flags") && strings.Contains(line, "hypervisor") {
				return "Virtual-Machine"
			}
		}
	}

	return "Bare-Metal"
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
