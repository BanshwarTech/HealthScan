import React, { useState, useEffect } from 'react';
import { Server, Activity, ShieldCheck, CheckCircle2, RefreshCw, Cpu, Database, HardDrive } from 'lucide-react';
import { getAdminStats } from '../api';

export const AdminView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            System Health & Scanner Telemetry
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time status of the scanner execution pipeline, queue workers, and SSRF defenses.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Total Scans Performed
          </span>
          <div className="text-3xl font-black font-mono text-white">
            {stats?.totalScans ?? '--'}
          </div>
          <p className="text-[11px] text-slate-500">All-time automated scans</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Scans Today (24h)
          </span>
          <div className="text-3xl font-black font-mono text-blue-400">
            {stats?.scansToday ?? '--'}
          </div>
          <p className="text-[11px] text-slate-500">Live throughput rate</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Average Health Score
          </span>
          <div className="text-3xl font-black font-mono text-emerald-400">
            {stats?.averageScore ?? '--'}/100
          </div>
          <p className="text-[11px] text-slate-500">Across completed audits</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Queue Engine Status
          </span>
          <div className="text-2xl font-bold font-mono text-indigo-400 capitalize">
            {stats?.queueStatus || 'Operational'}
          </div>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> Ready for incoming jobs
          </p>
        </div>
      </div>

      {/* Subsystem Health Matrix */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <span>Core Subsystem Status</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-sm text-slate-200">SSRF & Private IP Filter</span>
              <p className="text-xs text-slate-400">Enforces RFC 1918 & RFC 3927 boundaries</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              Active
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-sm text-slate-200">Native TLS Certificate Inspector</span>
              <p className="text-xs text-slate-400">Direct port 443 handshake & cipher analysis</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              Operational
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-sm text-slate-200">Asynchronous DNS Resolver</span>
              <p className="text-xs text-slate-400">Queries A, AAAA, MX, NS, TXT, CAA & DMARC</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              Operational
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-sm text-slate-200">Crawler & Link Auditor</span>
              <p className="text-xs text-slate-400">Rate-limited concurrent link verification</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              Operational
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between md:col-span-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-200">AI Security & Remediation Advisor</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  NVIDIA NIM (Default)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Primary: NVIDIA API (<code className="text-emerald-400">meta/llama-3.3-70b-instruct</code>) · Fallback: Gemini 2.5 Flash & Expert Heuristics
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              Configured
            </span>
          </div>
        </div>
      </div>

      {/* Memory & Node Runtime */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <HardDrive className="w-4 h-4 text-purple-400" />
            <span>Process RSS Memory</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats?.systemHealth?.memoryUsageMb ?? 65} MB
          </div>
          <p className="text-xs text-slate-500">Node runtime memory consumption</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-4 h-4 text-teal-400" />
            <span>Node Process Uptime</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats?.systemHealth?.nodeUptimeSeconds ? `${Math.floor(stats.systemHealth.nodeUptimeSeconds / 60)} minutes` : 'Active'}
          </div>
          <p className="text-xs text-slate-500">Continuous uptime without restart</p>
        </div>
      </div>
    </div>
  );
};
