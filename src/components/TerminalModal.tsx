import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, X, Copy, Check } from 'lucide-react';

interface TerminalModalProps {
  isOpen: boolean;
  hostname: string;
  ip: string;
  onClose: () => void;
}

interface LogEntry {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({
  isOpen,
  hostname,
  ip,
  onClose,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<LogEntry[]>([
    { type: 'system', text: `Linux 6.8.0-31-generic (x86_64) — RicozInfra Edge Node Agent v3.4.1` },
    { type: 'system', text: `Authorized SSH Session established to ${hostname} (${ip}) on port 22` },
    { type: 'system', text: `Last login: Thu Oct  1 14:14:02 UTC from 10.240.0.4 (bastion-gateway)` },
    { type: 'system', text: `Type 'help' for diagnostic commands or click quick action buttons below.\n` },
  ]);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (!isOpen) return null;

  const handleCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    const newHistory: LogEntry[] = [...history, { type: 'input', text: `root@${hostname}:~# ${trimmed}` }];

    const lower = trimmed.toLowerCase();
    if (lower === 'clear') {
      setHistory([]);
      setInputVal('');
      return;
    } else if (lower === 'help') {
      newHistory.push({
        type: 'output',
        text: `Available diagnostic utilities:
  uptime           Display system load averages and active run duration
  top              Inspect active process thread tree & memory allocation
  ss -tuna         Inspect socket allocation table & TIME_WAIT counters
  free -m          Display physical ECC RAM breakdown (used / buff / cache)
  systemctl status Show status of Envoy reverse proxy service
  clear            Clear terminal screen buffer`,
      });
    } else if (lower === 'uptime') {
      newHistory.push({
        type: 'output',
        text: ` 14:48:12 up 142 days, 18:12,  2 users,  load average: 14.82, 11.20, 8.44`,
      });
    } else if (lower === 'top' || lower === 'htop') {
      newHistory.push({
        type: 'output',
        text: `top - 14:48:15 up 142 days, 18:12,  2 users,  load average: 14.82, 11.20, 8.44
Tasks: 384 total,   3 running, 381 sleeping,   0 stopped,   0 zombie
%Cpu(s): 92.4 us,  6.2 sy,  0.0 ni,  1.1 id,  0.2 wa,  0.0 hi,  0.1 si
MiB Mem :  64284.1 total,   5884.1 free,  56400.0 used,   2000.0 buff/cache

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 1402 envoy     20   0 35.804g 34.200g  42100 R  74.2  53.2 418:14.22 envoy-proxy-worker
  894 root      20   0  5.120g  4.800g  12400 S   8.9   7.5  42:18.05 ebpf-telemetry-agent
  312 root      20   0  2.410g  2.100g   8900 S   5.4   3.3  18:04.10 k8s-kubelet`,
      });
    } else if (lower.includes('ss') || lower.includes('netstat')) {
      newHistory.push({
        type: 'output',
        text: `Netid State      Recv-Q Send-Q Local Address:Port  Peer Address:Port
tcp   ESTAB      0      12400  10.240.12.84:443   172.64.0.1:52194
tcp   TIME-WAIT  0      0      10.240.12.84:443   198.51.100.4:41202
tcp   ESTAB      0      18200  10.240.12.84:443   10.244.3.48:8080 (billing-pipeline)
[WARN] Kernel socket buffer backlog saturated: 14,892 active sockets ESTABLISHED, 422 in TIME_WAIT`,
      });
    } else if (lower.includes('free')) {
      newHistory.push({
        type: 'output',
        text: `               total        used        free      shared  buff/cache   available
Mem:           64284       58400        3884         420        2000        5100
Swap:           8192        1240        6952`,
      });
    } else if (lower.includes('systemctl')) {
      newHistory.push({
        type: 'output',
        text: `● envoy.service - Envoy Edge Reverse Proxy
     Loaded: loaded (/etc/systemd/system/envoy.service; enabled)
     Active: active (running) since Wed 2026-05-12 04:10:00 UTC
   Main PID: 1402 (envoy)
      Tasks: 64 (limit: 131072)
     Memory: 34.2G (limit: 48.0G)
     CGroup: /system.slice/envoy.service
             └─1402 /usr/local/bin/envoy -c /etc/envoy/envoy.yaml --concurrency 2`,
      });
    } else {
      newHistory.push({
        type: 'output',
        text: `Executed: ${trimmed} (exit code 0)\nCommand finished. For available diagnostic commands, type 'help'.`,
      });
    }

    setHistory(newHistory);
    setInputVal('');
  };

  const handleCopyLogs = () => {
    const text = history.map((h) => h.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const macros = ['uptime', 'top', 'ss -tuna', 'free -m', 'systemctl status', 'clear'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '740px',
          maxWidth: '95vw',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Terminal Header Bar */}
        <div style={{
          padding: '14px 18px',
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TerminalIcon size={15} style={{ color: '#0F172A' }} />
            <strong style={{ fontSize: '13px', color: '#0F172A' }}>
              SSH Console: {hostname} ({ip})
            </strong>
            <span className="metric-pill-emerald" style={{ fontSize: '10px', padding: '1px 6px' }}>
              Connected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleCopyLogs}
              title="Copy session logs"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11.5px',
              }}
            >
              {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Quick Action Macros */}
        <div style={{
          padding: '8px 18px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
        }}>
          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>QUICK MACROS:</span>
          {macros.map((m) => (
            <button
              key={m}
              onClick={() => handleCommand(m)}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                color: '#334155',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Terminal Screen Body (Clean Off-White Surface with Strict Inter Font) */}
        <div style={{
          padding: '18px',
          background: '#F8FAFC',
          minHeight: '340px',
          maxHeight: '440px',
          overflowY: 'auto',
          fontSize: '12px',
          lineHeight: '1.6',
          color: '#334155',
        }}>
          {history.map((item, idx) => (
            <div key={idx} style={{ marginBottom: '6px', whiteSpace: 'pre-wrap' }}>
              {item.type === 'input' && (
                <div style={{ color: '#0F172A', fontWeight: 600 }}>{item.text}</div>
              )}
              {item.type === 'system' && (
                <div style={{ color: '#64748B' }}>{item.text}</div>
              )}
              {item.type === 'output' && (
                <div style={{ color: '#334155' }}>{item.text}</div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Command Input Prompt */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCommand(inputVal);
          }}
          style={{
            padding: '10px 18px',
            background: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ color: '#0F172A', fontWeight: 600, fontSize: '12px' }}>
            root@{hostname}:~#
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type diagnostic command (e.g., uptime, ss -tuna, top)..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#0F172A',
              fontSize: '12.5px',
              fontWeight: 500,
            }}
          />
          <button
            type="submit"
            className="btn-slate-secondary"
            style={{ padding: '4px 10px', fontSize: '11.5px' }}
          >
            Run
          </button>
        </form>
      </div>
    </div>
  );
};
