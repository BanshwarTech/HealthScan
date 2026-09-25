import React from 'react';
import { Zap, Clock, ShieldCheck, AlertCircle, Cookie, CheckCircle2, AlertTriangle, FileCode } from 'lucide-react';
import { PerformanceInfo, CookieInfo } from '../../types';

interface PerformanceCookiesTabProps {
  performance: PerformanceInfo;
  cookies: {
    count: number;
    insecureCount: number;
    items: CookieInfo[];
  };
}

export const PerformanceCookiesTab: React.FC<PerformanceCookiesTabProps> = ({ performance, cookies }) => {
  const kbSize = Math.round(performance.contentSizeBytes / 1024);

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div>
        <h3 className="text-base font-bold text-white">Performance Metrics & Cookie Security</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Auditing initial network response latency, compression efficiency, and stateful cookie security flags.
        </p>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TTFB */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Time to First Byte (TTFB)</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${
              performance.ttfbMs < 300 ? 'text-emerald-400' : performance.ttfbMs < 800 ? 'text-blue-400' : 'text-rose-400'
            }`}>
              {performance.ttfbMs}
            </span>
            <span className="text-xs text-slate-400 font-mono">ms</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {performance.ttfbMs < 800 ? 'Meets Google CWV target (< 800ms)' : 'Exceeds recommended 800ms limit'}
          </p>
        </div>

        {/* Compression */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>HTTP Compression</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white capitalize">
              {performance.compression}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {performance.compression !== 'none' ? 'Payload minified over wire' : 'Uncompressed response payload'}
          </p>
        </div>

        {/* Payload Size */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>HTML Document Size</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">
              {kbSize}
            </span>
            <span className="text-xs text-slate-400 font-mono">KB</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {kbSize < 1000 ? 'Lean initial payload' : 'Consider minifying DOM scripts'}
          </p>
        </div>

        {/* Total Time */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>Total Response Time</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">
              {performance.totalTimeMs}
            </span>
            <span className="text-xs text-slate-400 font-mono">ms</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Full round-trip document download
          </p>
        </div>
      </div>

      {/* Cookie Security Section */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-amber-400" />
            <h4 className="font-semibold text-sm sm:text-base text-white">
              Cookie Security Audit ({cookies.count} cookies inspected)
            </h4>
          </div>

          <div className="flex items-center gap-2">
            {cookies.insecureCount > 0 ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {cookies.insecureCount} Insecure Flags
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                All Flags Secure
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Privacy Notice: </span>
          Cookie values are encrypted/redacted and never transmitted or logged. Only security attributes (Secure, HttpOnly, SameSite) are analyzed.
        </p>

        {cookies.items.length === 0 ? (
          <div className="text-center py-8 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No Tracking or Session Cookies Set on Landing Page</p>
            <p className="text-xs text-slate-400 mt-1">Initial response is completely stateless.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Cookie Name</th>
                  <th className="py-2.5 px-3">Secure Flag</th>
                  <th className="py-2.5 px-3">HttpOnly Flag</th>
                  <th className="py-2.5 px-3">SameSite</th>
                  <th className="py-2.5 px-3">Domain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {cookies.items.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-850/50">
                    <td className="py-2.5 px-3 font-bold text-white">{c.name}</td>
                    <td className="py-2.5 px-3">
                      {c.secure ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1 font-bold">
                          <AlertCircle className="w-3.5 h-3.5" /> No (Insecure)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {c.httpOnly ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1 font-bold">
                          <AlertCircle className="w-3.5 h-3.5" /> No (XSS risk)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {c.sameSite ? (
                        <span className="text-slate-200">{c.sameSite}</span>
                      ) : (
                        <span className="text-amber-400 italic">None / Unset</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{c.domain || 'Host-only'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
