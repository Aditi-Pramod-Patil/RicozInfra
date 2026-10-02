package main

import (
	"bytes"
	"compress/gzip"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"sync"
	"time"
)

// HTTPClientConfig holds dispatcher transport options
type HTTPClientConfig struct {
	GatewayURL string
	APIKey     string
	ProxyURL   string
	Timeout    time.Duration
	UserAgent  string
}

// TelemetryClient provides compressed, authenticated dispatch with connection pooling
type TelemetryClient struct {
	client     *http.Client
	gatewayURL string
	apiKey     string
	userAgent  string
	bufferPool *sync.Pool
	gzipPool   *sync.Pool
}

// NewTelemetryClient initializes the HTTP/2 transport with zero-allocation compression pools
func NewTelemetryClient(cfg HTTPClientConfig) (*TelemetryClient, error) {
	if cfg.Timeout == 0 {
		cfg.Timeout = 5 * time.Second
	}
	if cfg.UserAgent == "" {
		cfg.UserAgent = "RicozInfra-Collector/1.0"
	}

	// Configure high-performance transport
	transport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   5 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		MaxIdleConns:          20,
		MaxIdleConnsPerHost:   10,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   5 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
		ForceAttemptHTTP2:     true, // Enable native HTTP/2 over TLS
	}

	// Custom HTTP/HTTPS proxy support
	if cfg.ProxyURL != "" {
		pURL, err := url.Parse(cfg.ProxyURL)
		if err != nil {
			return nil, fmt.Errorf("invalid proxy URL: %w", err)
		}
		transport.Proxy = http.ProxyURL(pURL)
	}

	// Air-gapped VPC internal TLS override if requested
	if os.Getenv("RICOZ_INSECURE_SKIP_VERIFY") == "true" {
		transport.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
	}

	// Allocation-efficient sync.Pools for gzip compression
	bufPool := &sync.Pool{
		New: func() any {
			return new(bytes.Buffer)
		},
	}

	gzPool := &sync.Pool{
		New: func() any {
			return gzip.NewWriter(io.Discard)
		},
	}

	return &TelemetryClient{
		client: &http.Client{
			Transport: transport,
			Timeout:   cfg.Timeout,
		},
		gatewayURL: cfg.GatewayURL,
		apiKey:     cfg.APIKey,
		userAgent:  cfg.UserAgent,
		bufferPool: bufPool,
		gzipPool:   gzPool,
	}, nil
}

// SendTelemetry dispatches a single telemetry packet with gzip compression
func (c *TelemetryClient) SendTelemetry(ctx context.Context, packet TelemetryPacket) error {
	return c.dispatchJSON(ctx, packet)
}

// SendBatch dispatches an aggregated batch of telemetry packets
func (c *TelemetryClient) SendBatch(ctx context.Context, packets []TelemetryPacket) error {
	if len(packets) == 0 {
		return nil
	}
	if len(packets) == 1 {
		return c.dispatchJSON(ctx, packets[0])
	}
	return c.dispatchJSON(ctx, packets)
}

// dispatchJSON serializes, compresses, and posts payload to ingestion gateway
func (c *TelemetryClient) dispatchJSON(ctx context.Context, payload any) error {
	// 1. JSON serialize
	rawJSON, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("json serialization error: %w", err)
	}

	// 2. Compress via pooled buffer and gzip writer
	buf := c.bufferPool.Get().(*bytes.Buffer)
	buf.Reset()
	defer c.bufferPool.Put(buf)

	gz := c.gzipPool.Get().(*gzip.Writer)
	gz.Reset(buf)
	if _, err := gz.Write(rawJSON); err != nil {
		c.gzipPool.Put(gz)
		return fmt.Errorf("gzip compression error: %w", err)
	}
	if err := gz.Close(); err != nil {
		c.gzipPool.Put(gz)
		return fmt.Errorf("gzip close error: %w", err)
	}
	c.gzipPool.Put(gz)

	// 3. Create HTTP Request
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.gatewayURL, buf)
	if err != nil {
		return fmt.Errorf("create request failed: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Content-Encoding", "gzip")
	req.Header.Set("User-Agent", c.userAgent)

	if c.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
	}

	// 4. Execute request
	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("dispatch connection error: %w", err)
	}
	defer func() {
		// Drain and close body for keep-alive reuse
		_, _ = io.Copy(io.Discard, resp.Body)
		_ = resp.Body.Close()
	}()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("gateway returned non-2xx status code: %d", resp.StatusCode)
	}

	return nil
}
