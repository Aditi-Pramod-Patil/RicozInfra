import React, { useState } from 'react';
import type { PageView } from '../types';
import { 
  Activity, 
  Server, 
  GitFork, 
  AlertTriangle, 
  Radio,
  BookOpen,
  Search, 
  Bell, 
  ChevronDown,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

interface HeaderProps {
  currentView: PageView;
  onNavigate: (view: PageView) => void;
  onOpenSearch: () => void;
  cluster: string;
  onSelectCluster: (cluster: string) => void;
  activeP1Count: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenSearch,
  cluster,
  onSelectCluster,
  activeP1Count,
}) => {
  const [showClusterMenu, setShowClusterMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const clusters = [
    { id: 'us-east-01', name: 'us-east-01 (Primary Production)', region: 'us-east-1', status: 'critical' },
    { id: 'eu-west-01', name: 'eu-west-01 (Frankfurt Standby)', region: 'eu-west-1', status: 'nominal' },
    { id: 'ap-south-01', name: 'ap-south-01 (Singapore Edge)', region: 'ap-southeast-1', status: 'nominal' },
  ];

  return (
    <header className="h-14 w-full bg-white border-b border-slate-200 sticky top-0 z-40 select-none">
      <div className="max-w-[1440px] h-full mx-auto px-6 sm:px-8 lg:px-10 flex items-center justify-between">
        {/* Left: Brand Wordmark & Status Badge */}
        <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onNavigate('overview')}
          className="flex items-center gap-1.5 focus:outline-none cursor-pointer group"
          title="RicozInfra Home"
        >
          <span className="text-base font-bold text-slate-900 tracking-tight group-hover:text-slate-700 transition-colors">
            RicozInfra
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block mb-0.5" />
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-semibold text-slate-900">Status:</span>
          <span className="text-slate-500 font-medium">99.992% Nominal</span>
        </div>
      </div>

      {/* Center Nav Links: Clean underline tabs with strict single-line whitespace-nowrap */}
      <nav className="h-full flex items-center gap-6 shrink-0">
        {/* 1. Overview */}
        <button
          onClick={() => onNavigate('overview')}
          className={`h-full flex items-center gap-2 text-sm whitespace-nowrap transition-colors ${
            currentView === 'overview'
              ? 'text-slate-900 font-semibold border-b-2 border-slate-900 -mb-px'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <Activity size={14} className="shrink-0" />
          <span>Overview</span>
        </button>

        {/* 2. Host Inventory */}
        <button
          onClick={() => onNavigate('hosts')}
          className={`h-full flex items-center gap-2 text-sm whitespace-nowrap transition-colors ${
            currentView === 'hosts'
              ? 'text-slate-900 font-semibold border-b-2 border-slate-900 -mb-px'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <Server size={14} className="shrink-0" />
          <span>Host Inventory</span>
        </button>

        {/* 3. Topology Map */}
        <button
          onClick={() => onNavigate('topology')}
          className={`h-full flex items-center gap-2 text-sm whitespace-nowrap transition-colors ${
            currentView === 'topology'
              ? 'text-slate-900 font-semibold border-b-2 border-slate-900 -mb-px'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <GitFork size={14} className="shrink-0" />
          <span>Topology Map</span>
        </button>

        {/* 4. Incidents & Alerts */}
        <button
          onClick={() => onNavigate('incidents')}
          className={`h-full flex items-center gap-2 text-sm whitespace-nowrap transition-colors ${
            currentView === 'incidents'
              ? 'text-slate-900 font-semibold border-b-2 border-slate-900 -mb-px'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <AlertTriangle size={14} className="shrink-0" />
          <span>Incidents &amp; Alerts</span>
          {activeP1Count > 0 && (
            <span className="bg-rose-600 text-white text-[10.5px] font-bold px-1.5 py-0.2 rounded-full leading-tight ml-0.5">
              {activeP1Count}
            </span>
          )}
        </button>

        {/* 5. Network & Telemetry */}
        <button
          onClick={() => onNavigate('telemetry')}
          className={`h-full flex items-center gap-2 text-sm whitespace-nowrap transition-colors ${
            currentView === 'telemetry'
              ? 'text-slate-900 font-semibold border-b-2 border-slate-900 -mb-px'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <Radio size={14} className="shrink-0" />
          <span>Network &amp; Telemetry</span>
        </button>

        {/* 6. Runbooks */}
        <button
          onClick={() => onNavigate('runbooks')}
          className={`h-full flex items-center gap-2 text-sm whitespace-nowrap transition-colors ${
            currentView === 'runbooks'
              ? 'text-slate-900 font-semibold border-b-2 border-slate-900 -mb-px'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <BookOpen size={14} className="shrink-0" />
          <span>Runbooks</span>
        </button>
      </nav>

      {/* Right Controls: Compact Search, Region Selector, Bell, Subtle Exit Link, Avatar */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Compact Search Bar */}
        <button
          onClick={onOpenSearch}
          className="w-44 h-8 px-2.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-md text-xs text-slate-400 transition-colors"
          title="Search resources (⌘K)"
        >
          <div className="flex items-center gap-2">
            <Search size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-500 font-normal">Search</span>
          </div>
          <span className="text-[10.5px] font-medium bg-white border border-slate-200 px-1 py-0.5 rounded text-slate-400">
            ⌘K
          </span>
        </button>

        {/* Region / Cluster Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowClusterMenu(!showClusterMenu);
              setShowNotifMenu(false);
            }}
            className="h-8 px-2.5 flex items-center gap-2 border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cluster === 'us-east-01' ? 'bg-rose-600 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="whitespace-nowrap">{cluster}</span>
            <ChevronDown size={12} className="text-slate-400 shrink-0" />
          </button>

          {showClusterMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 z-50">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Active Cluster
              </div>
              {clusters.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectCluster(c.id);
                    setShowClusterMenu(false);
                  }}
                  className={`px-2.5 py-2 rounded-md cursor-pointer flex items-center justify-between text-xs transition-colors ${
                    c.id === cluster
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.status === 'critical' ? 'bg-rose-600' : 'bg-emerald-500'}`} />
                    <span>{c.name}</span>
                  </div>
                  {c.id === cluster && <CheckCircle2 size={13} className="text-emerald-600" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowClusterMenu(false);
            }}
            className="relative w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-transparent hover:border-slate-200 transition-colors"
            title="System Notifications"
          >
            <Bell size={15} />
            {activeP1Count > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-600 rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-900">Correlated Alerts</span>
                <span className="text-[11px] text-slate-400 font-medium">Live Stream</span>
              </div>
              <div className="mt-2.5 flex flex-col gap-2">
                <div
                  onClick={() => {
                    onNavigate('incidents');
                    setShowNotifMenu(false);
                  }}
                  className="p-2.5 rounded-md bg-rose-50/70 border border-rose-200 cursor-pointer hover:bg-rose-50 transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold">
                    <ShieldAlert size={13} className="shrink-0" />
                    <span>#INC-9402: Upstream Gateway Drop</span>
                  </div>
                  <div className="text-[11.5px] text-slate-600 mt-1 leading-snug">
                    12 downstream alerts collapsed into 1 root cause (99.4% confidence)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Subtle "Exit to Website" link on the far right */}
        <button
          onClick={() => onNavigate('landing')}
          className="text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors whitespace-nowrap px-1 py-1"
          title="Return to public marketing overview"
        >
          Exit to Website
        </button>

        {/* User Account Avatar */}
        <div
          className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center shrink-0 cursor-default select-none shadow-xs"
          title="Authenticated as Principal SRE (admin@ricozinfra.internal)"
        >
          AD
        </div>
      </div>
    </div>
  </header>
  );
};
