package main

import (
	"sync"
)

// TelemetryPacket matches the RicozInfra ingestion JSON schema
type TelemetryPacket struct {
	HostID    string        `json:"host_id"`
	Hostname  string        `json:"hostname"`
	Cluster   string        `json:"cluster"`
	Role      string        `json:"role"`
	Timestamp string        `json:"timestamp"`
	Metrics   SystemMetrics `json:"metrics"`
}

// RingBuffer is a thread-safe, fixed-capacity circular buffer with FIFO eviction.
// When capacity is reached, new entries overwrite the oldest items, strictly preventing
// unbounded memory expansion during prolonged upstream network outages.
type RingBuffer struct {
	mu       sync.Mutex
	data     []TelemetryPacket
	capacity int
	head     int // Read index (oldest item)
	tail     int // Write index (next insertion point)
	count    int // Number of items currently queued
}

// NewRingBuffer allocates a bounded circular buffer with exact capacity
func NewRingBuffer(capacity int) *RingBuffer {
	if capacity <= 0 {
		capacity = 300 // Default 300 data points (5 minutes at 1Hz)
	}
	return &RingBuffer{
		data:     make([]TelemetryPacket, capacity),
		capacity: capacity,
		head:     0,
		tail:     0,
		count:    0,
	}
}

// Push adds a telemetry packet to the ring buffer.
// If the buffer is full, the oldest entry is evicted (dropped) to honor the memory budget.
func (rb *RingBuffer) Push(packet TelemetryPacket) bool {
	rb.mu.Lock()
	defer rb.mu.Unlock()

	evicted := false
	if rb.count == rb.capacity {
		// Buffer is full: overwrite oldest item by advancing head
		rb.head = (rb.head + 1) % rb.capacity
		rb.count--
		evicted = true
	}

	rb.data[rb.tail] = packet
	rb.tail = (rb.tail + 1) % rb.capacity
	rb.count++

	return evicted
}

// Drain retrieves and removes all buffered packets in chronological order
func (rb *RingBuffer) Drain() []TelemetryPacket {
	rb.mu.Lock()
	defer rb.mu.Unlock()

	if rb.count == 0 {
		return nil
	}

	result := make([]TelemetryPacket, rb.count)
	for i := 0; i < rb.count; i++ {
		idx := (rb.head + i) % rb.capacity
		result[i] = rb.data[idx]
	}

	// Reset pointers
	rb.head = 0
	rb.tail = 0
	rb.count = 0

	return result
}

// DrainBatch retrieves up to maxCount items in chronological order
func (rb *RingBuffer) DrainBatch(maxCount int) []TelemetryPacket {
	rb.mu.Lock()
	defer rb.mu.Unlock()

	if rb.count == 0 || maxCount <= 0 {
		return nil
	}

	n := maxCount
	if n > rb.count {
		n = rb.count
	}

	result := make([]TelemetryPacket, n)
	for i := 0; i < n; i++ {
		idx := (rb.head + i) % rb.capacity
		result[i] = rb.data[idx]
	}

	rb.head = (rb.head + n) % rb.capacity
	rb.count -= n

	return result
}

// Len returns the current number of buffered packets
func (rb *RingBuffer) Len() int {
	rb.mu.Lock()
	defer rb.mu.Unlock()
	return rb.count
}

// Capacity returns the maximum buffer size
func (rb *RingBuffer) Capacity() int {
	return rb.capacity
}
