import React, { useState } from 'react';
import { X, Copy, Check, Server, ShieldCheck, Play, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFleet } from '../context/FleetContext';

interface AddHostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddHostModal: React.FC<AddHostModalProps> = ({ isOpen, onClose }) => {
  const { organization } = useAuth();
  const { simulateAgentConnect } = useFleet();
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [installMethod, setInstallMethod] = useState<'curl' | 'docker' | 'k8s'>('curl');

  if (!isOpen) return null;

  const apiKey = organization?.apiKey || 'rcz_live_production_key_sample';

  const curlCommand = `curl -sSL https://get.ricozinfra.com/install.sh | sudo bash -s -- --token=${apiKey}`;
  const dockerCommand = `docker run -d --name ricoz-collector --net=host --restart=always \\
  -e INGESTION_URL=https://api.ricozinfra.com/api/v1/telemetry/ingest \\
  -e ORG_API_KEY=${apiKey} \\
  ricozinfra/collector:latest`;
  const k8sCommand = `helm repo add ricoz https://charts.ricozinfra.com
helm install ricoz-daemon ricoz/ricoz-collector \\
  --set apiKey="${apiKey}" \\
  --namespace ricoz-system --create-namespace`;

  const copyToClipboard = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleSimulate = () => {
    simulateAgentConnect();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-card select-none"
        style={{
          width: '640px',
          maxWidth: '92vw',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Server size={16} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Deploy Telemetry Collector Daemon
              </h3>
              <p className="text-xs text-slate-500">
                Connect your first bare-metal server, cloud VM, or Kubernetes cluster.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 mt-5 p-1 bg-slate-50 border border-slate-200 rounded-lg">
          <button
            onClick={() => setInstallMethod('curl')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              installMethod === 'curl'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Linux / Shell (cURL)
          </button>
          <button
            onClick={() => setInstallMethod('docker')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              installMethod === 'docker'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Docker Container
          </button>
          <button
            onClick={() => setInstallMethod('k8s')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              installMethod === 'k8s'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kubernetes (Helm)
          </button>
        </div>

        {/* Command Box */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 px-1">
            <span>Run command as root or with sudo privileges:</span>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <ShieldCheck size={12} /> Auto-detects OS &amp; eBPF
            </span>
          </div>

          <div className="relative rounded-lg bg-slate-900 p-4 text-white text-xs leading-relaxed overflow-x-auto border border-slate-800">
            <pre className="font-sans whitespace-pre-wrap break-all text-slate-100 select-all">
              {installMethod === 'curl' && curlCommand}
              {installMethod === 'docker' && dockerCommand}
              {installMethod === 'k8s' && k8sCommand}
            </pre>

            <button
              onClick={() =>
                copyToClipboard(
                  installMethod === 'curl'
                    ? curlCommand
                    : installMethod === 'docker'
                    ? dockerCommand
                    : k8sCommand,
                  installMethod
                )
              }
              className="absolute right-3 top-3 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Copy snippet"
            >
              {copiedTab === installMethod ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Security Details */}
        <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
          <span>
            The daemon consumes &lt;15MB RAM and &lt;0.5% CPU. Telemetry is streamed over TLS 1.3 with sub-second heartbeats directly to your tenant partition.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSimulate}
            className="btn-slate-secondary text-xs"
            title="Simulate immediate incoming heartbeat for development testing"
          >
            <Play size={12} className="text-emerald-500" />
            <span>Simulate Live Agent Heartbeat</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                copyToClipboard(curlCommand, 'bottom');
              }}
              className="btn-crimson-primary text-xs"
            >
              <span>{copiedTab === 'bottom' ? 'Copied to Clipboard!' : 'Copy Install Command'}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
