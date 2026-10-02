#!/usr/bin/env bash
# ==============================================================================
# RicozInfra Universal Host Telemetry Collector Installer
# Supports: Ubuntu, Debian, RHEL, CentOS, Rocky, AlmaLinux, Amazon Linux 2023
# Usage:
#   curl -sSL https://get.ricozinfra.com/install.sh | sudo bash -s -- --token=YOUR_API_KEY
# ==============================================================================

set -euo pipefail

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

VERSION="${RICOZ_VERSION:-1.0.0}"
RELEASE_BASE_URL="${RICOZ_RELEASE_URL:-https://github.com/Aditi-Pramod-Patil/RicozInfra/releases/download/v${VERSION}}"
DEFAULT_GATEWAY="https://ingest.ricozinfra.com/api/v1/telemetry/ingest"
GATEWAY_URL="${RICOZ_GATEWAY:-$DEFAULT_GATEWAY}"
API_TOKEN=""
CLUSTER="us-east-cluster-01"
ROLE="Edge-Gateway"

print_banner() {
    echo -e "${CYAN}${BOLD}"
    cat << "EOF"
   ___  _             ____       __          
  / _ \(_)______  ___ /  _/__  _/ /______ _  
 / , _/ / __/ _ \/_ // / / _ \/ _/ __/ _ `/  
/_/|_/_/\__/\___//___/___/_//_/_/ /_/\_,_/   
  Enterprise Infrastructure Telemetry Daemon
EOF
    echo -e "${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# 1. Parse command-line flags
while [ $# -gt 0 ]; do
    case "$1" in
        --token=*)
            API_TOKEN="${1#*=}"
            ;;
        -t|--token)
            shift
            API_TOKEN="${1:-}"
            ;;
        --gateway=*)
            GATEWAY_URL="${1#*=}"
            ;;
        -g|--gateway)
            shift
            GATEWAY_URL="${1:-}"
            ;;
        --cluster=*)
            CLUSTER="${1#*=}"
            ;;
        -c|--cluster)
            shift
            CLUSTER="${1:-}"
            ;;
        --role=*)
            ROLE="${1#*=}"
            ;;
        -r|--role)
            shift
            ROLE="${1:-}"
            ;;
        --version=*)
            VERSION="${1#*=}"
            ;;
        -v|--version)
            shift
            VERSION="${1:-}"
            ;;
        --help|-h)
            echo "Usage: $0 --token=<ORG_API_KEY> [--gateway=<URL>] [--cluster=<NAME>] [--role=<ROLE>]"
            exit 0
            ;;
        *)
            log_warn "Unknown parameter: $1"
            ;;
    esac
    shift
done

print_banner

# 2. Check root privilege
if [ "$(id -u)" -ne 0 ]; then
    log_error "This script must be executed with root privileges. Please re-run using sudo."
    exit 1
fi

# 3. Check API token
if [ -z "$API_TOKEN" ]; then
    if [ -n "${RICOZ_API_KEY:-}" ]; then
        API_TOKEN="$RICOZ_API_KEY"
    else
        log_error "Missing required organization API token!"
        echo -e "Provide your token via: ${BOLD}--token=YOUR_API_KEY${NC} or ${BOLD}export RICOZ_API_KEY=YOUR_KEY${NC}"
        exit 1
    fi
fi

# 4. Check systemd presence
if ! command -v systemctl >/dev/null 2>&1; then
    log_error "systemd is required to register and manage the ricoz-agent service."
    exit 1
fi

# 5. Detect system architecture
ARCH=$(uname -m)
case "$ARCH" in
    x86_64)
        TARGET_ARCH="amd64"
        ;;
    aarch64|arm64)
        TARGET_ARCH="arm64"
        ;;
    *)
        log_error "Unsupported architecture: $ARCH. RicozInfra collector requires x86_64 or aarch64."
        exit 1
        ;;
esac

log_info "Detected environment: Linux ($(uname -r)) on ${TARGET_ARCH}"
log_info "Ingestion Target:    ${GATEWAY_URL}"
log_info "Assigned Cluster:    ${CLUSTER}"
log_info "Assigned Role:       ${ROLE}"

# 6. Prepare download utility
FETCH_CMD=""
if command -v curl >/dev/null 2>&1; then
    FETCH_CMD="curl -sSL -f"
elif command -v wget >/dev/null 2>&1; then
    FETCH_CMD="wget -qO-"
else
    log_error "Neither curl nor wget was found on this system. Please install one to proceed."
    exit 1
fi

# 7. Stop existing service if running
if systemctl is-active --quiet ricoz-agent.service 2>/dev/null; then
    log_info "Stopping existing ricoz-agent service..."
    systemctl stop ricoz-agent.service || true
fi

# 8. Deploy Binary
INSTALL_BIN="/usr/local/bin/ricoz-agent"
TMP_BIN="/tmp/ricoz-agent-download"

BINARY_NAME="ricoz-agent-linux-${TARGET_ARCH}"
DOWNLOAD_URL="${RELEASE_BASE_URL}/${BINARY_NAME}"

log_info "Installing collector binary v${VERSION}..."

# Check if local pre-built binary exists in current repo workspace
if [ -f "./bin/${BINARY_NAME}" ]; then
    log_info "Using local binary ./bin/${BINARY_NAME}..."
    cp "./bin/${BINARY_NAME}" "$INSTALL_BIN"
elif [ -f "./${BINARY_NAME}" ]; then
    log_info "Using local binary ./${BINARY_NAME}..."
    cp "./${BINARY_NAME}" "$INSTALL_BIN"
elif [ -f "./bin/ricoz-agent" ]; then
    log_info "Using local binary ./bin/ricoz-agent..."
    cp "./bin/ricoz-agent" "$INSTALL_BIN"
else
    log_info "Fetching binary from ${DOWNLOAD_URL}..."
    if ! $FETCH_CMD "$DOWNLOAD_URL" > "$TMP_BIN" 2>/dev/null; then
        log_warn "Remote binary download failed or release not yet tagged."
        log_info "Attempting build from source via Go toolchain if available..."
        if command -v go >/dev/null 2>&1; then
            log_info "Go compiler found. Compiling static binary..."
            CGO_ENABLED=0 go build -ldflags="-s -w" -o "$INSTALL_BIN" ./
        else
            log_error "Unable to download precompiled binary and 'go' compiler is not installed."
            log_error "Please download ricoz-agent manually or ensure network access to GitHub releases."
            exit 1
        fi
    else
        mv "$TMP_BIN" "$INSTALL_BIN"
    fi
fi

chmod 755 "$INSTALL_BIN"
log_success "Binary installed at ${INSTALL_BIN}"

# 9. Write Configuration
CONFIG_DIR="/etc/ricozinfra"
CONFIG_FILE="${CONFIG_DIR}/agent.yaml"

log_info "Configuring agent at ${CONFIG_FILE}..."
mkdir -p "$CONFIG_DIR"
chmod 700 "$CONFIG_DIR"

cat << EOF > "$CONFIG_FILE"
# RicozInfra Production Telemetry Configuration
gateway_url: "${GATEWAY_URL}"
api_key: "${API_TOKEN}"
cluster: "${CLUSTER}"
role: "${ROLE}"
sample_interval: "1000ms"
probe_target: "1.1.1.1:443"
buffer_capacity: 300
EOF

chmod 600 "$CONFIG_FILE"
log_success "Configuration written with restricted permissions (0600)"

# 10. Write Systemd Unit File
SYSTEMD_UNIT="/etc/systemd/system/ricoz-agent.service"
log_info "Creating systemd unit file at ${SYSTEMD_UNIT}..."

cat << 'EOF' > "$SYSTEMD_UNIT"
[Unit]
Description=RicozInfra Telemetry Collector Daemon
Documentation=https://docs.ricozinfra.com/agent
After=network-online.target systemd-sysctl.service
Wants=network-online.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/ricoz-agent --config /etc/ricozinfra/agent.yaml
Restart=always
RestartSec=5s
KillMode=process
TimeoutStopSec=10s

# Strict resource boundaries (< 25MB RAM, < 0.5% CPU)
MemoryAccounting=yes
MemoryHigh=24M
MemoryMax=32M
CPUAccounting=yes
CPUQuota=5%
LimitNOFILE=65536
TasksMax=128

# Kernel sandboxing
ProtectHome=true
ProtectSystem=strict
ProtectKernelModules=true
ProtectKernelTunables=true
ProtectControlGroups=true
NoNewPrivileges=true
ReadWritePaths=/etc/ricozinfra
ReadOnlyPaths=/proc /sys

StandardOutput=journal
StandardError=journal
SyslogIdentifier=ricoz-agent

[Install]
WantedBy=multi-user.target
EOF

chmod 644 "$SYSTEMD_UNIT"

# 11. Reload and Start Systemd Daemon
log_info "Reloading systemd and enabling ricoz-agent..."
systemctl daemon-reload
systemctl enable ricoz-agent.service
systemctl restart ricoz-agent.service

# 12. Verify status
sleep 1.5
if systemctl is-active --quiet ricoz-agent.service; then
    PID=$(systemctl show --property MainPID --value ricoz-agent.service)
    echo ""
    log_success "${BOLD}RicozInfra Telemetry Collector is running! (PID: ${PID})${NC}"
    echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "  ${BOLD}Status:${NC}        ${GREEN}active (running)${NC}"
    echo -e "  ${BOLD}Config:${NC}        ${CONFIG_FILE}"
    echo -e "  ${BOLD}Binary:${NC}        ${INSTALL_BIN}"
    echo -e "  ${BOLD}RAM Limit:${NC}     32 MB (Hard Max) / 24 MB (Target)"
    echo -e "  ${BOLD}CPU Quota:${NC}     5% (Average consumption: < 0.5%)"
    echo -e "  ${BOLD}Logs:${NC}          journalctl -u ricoz-agent -f"
    echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
else
    log_error "Service failed to start. Review logs via: journalctl -u ricoz-agent -n 50"
    exit 1
fi
