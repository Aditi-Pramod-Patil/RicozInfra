SHELL := /bin/bash
VERSION ?= 1.0.0
GIT_COMMIT ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
LDFLAGS := -s -w -X main.AgentVersion=$(VERSION) -X main.GitCommit=$(GIT_COMMIT)

.PHONY: all build build-linux-amd64 build-linux-arm64 clean test package

all: build

build:
	@echo "🔨 Building native ricoz-agent..."
	CGO_ENABLED=0 go build -ldflags="$(LDFLAGS)" -trimpath -o bin/ricoz-agent .

build-linux-amd64:
	@echo "🐧 Cross-compiling for Linux amd64..."
	mkdir -p bin
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="$(LDFLAGS)" -trimpath -o bin/ricoz-agent-linux-amd64 .

build-linux-arm64:
	@echo "🐧 Cross-compiling for Linux arm64..."
	mkdir -p bin
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags="$(LDFLAGS)" -trimpath -o bin/ricoz-agent-linux-arm64 .

package: build-linux-amd64 build-linux-arm64
	@echo "📦 Creating release archives and SHA256 checksums..."
	tar -czf bin/ricoz-agent-$(VERSION)-linux-amd64.tar.gz -C bin ricoz-agent-linux-amd64
	tar -czf bin/ricoz-agent-$(VERSION)-linux-arm64.tar.gz -C bin ricoz-agent-linux-arm64
	cd bin && sha256sum *.tar.gz > checksums.txt
	@echo "✅ Packaging complete. Binaries located in ./bin/"

test:
	@echo "🧪 Running unit tests..."
	go test -v -race ./...

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf bin/
