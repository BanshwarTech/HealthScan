import React from 'react';
import { ShieldCheck, Activity, Layers, Server, Plus, History } from 'lucide-react';

interface NavbarProps {
  currentView: 'scanner' | 'report' | 'dashboard' | 'admin';
  onNavigate: (view: 'scanner' | 'report' | 'dashboard' | 'admin') => void;
  onNewScan: () => void;
  hasActiveReport: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onNewScan,
  hasActiveReport
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('scanner')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  HealthScan
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  SaaS
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Security & Technical Health Auditor</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onNavigate('scanner')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                currentView === 'scanner'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Scanner</span>
            </button>

            {hasActiveReport && (
              <button
                onClick={() => onNavigate('report')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentView === 'report'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Active Report</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                currentView === 'dashboard'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Projects & History</span>
            </button>

            <button
              onClick={() => onNavigate('admin')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                currentView === 'admin'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Server className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">System Health</span>
            </button>
          </nav>

          {/* Quick CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNewScan}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Audit</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
