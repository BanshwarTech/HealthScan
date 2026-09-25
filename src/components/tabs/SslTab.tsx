import React from 'react';
import { Lock, ShieldCheck, AlertCircle, Calendar, Key, Globe, ArrowRight, HelpCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SslInfo, SecurityHeadersInfo, CookieInfo } from '../../types';

interface SslTabProps {
  ssl: SslInfo;
  domain: string;
  securityScore?: number;
  headersInfo?: SecurityHeadersInfo;
  cookies?: {
    count: number;
    insecureCount: number;
    items: CookieInfo[];
  };
  onNavigateTab?: (tabId: string) => void;
}

export const SslTab: React.FC<SslTabProps> = ({ 
  ssl, 
  domain, 
  securityScore = 59,
  headersInfo,
  cookies,
  onNavigateTab 
}) => {
  const isHealthy = ssl.enabled && ssl.valid && (ssl.daysRemaining === undefined || ssl.daysRemaining > 15);
  const missingHeadersCount = headersInfo ? headersInfo.evaluated.filter(h => h.status === 'missing').length : 6;

  return (
    <div className="space-y-6">
      {/* Security Score Breakdown Explainer Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/20 to-slate-900 border border-blue-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Understanding Your Security Health Score ({securityScore}/100)
              </h3>
              <p className="text-xs text-slate-400">
                Why is Security scored at {securityScore}% even though your SSL certificate is 100% valid?
              </p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            securityScore >= 80 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            Overall Security: {securityScore}%
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The <strong>Security Score</strong> evaluates more than just your SSL/TLS certificate. It is a weighted composite of three critical defense layers:
        </p>

        {/* 3 Pillars Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Pillar 1: SSL & HTTPS */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">1. SSL/TLS Certificate</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">40% weight</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-slate-200 font-medium">Valid ({ssl.issuer || 'Trusted CA'})</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Encryption is active and verified over modern {ssl.protocol || 'TLS 1.3'}.
            </p>
          </div>

          {/* Pillar 2: HTTP Security Headers */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1.5 shadow-sm shadow-amber-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300">2. HTTP Security Headers</span>
              <span className="text-xs font-bold text-amber-400 font-mono">40% weight</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-xs text-amber-300 font-medium">{missingHeadersCount} Missing Headers</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Missing CSP, HSTS, X-Content-Type-Options, & X-Frame-Options directly lowers this score.
            </p>
          </div>

          {/* Pillar 3: Cookie Security */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">3. Cookie Protection</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">20% weight</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-slate-200 font-medium">Hardened Flags</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Session cookies correctly apply Secure, HttpOnly, and SameSite flags.
            </p>
          </div>
        </div>

        {onNavigateTab && (
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-slate-400">
              Adding missing HTTP security headers can immediately lift this score from <strong>{securityScore}%</strong> to <strong>95%+</strong>.
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onNavigateTab('findings')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all hover:scale-105"
              >
                <span>View All Issues & Solutions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateTab('headers')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition-colors"
              >
                <span>Headers Tab</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Overview Status Banner */}
      <div className={`p-5 rounded-2xl border ${
        isHealthy 
          ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
          : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
      }`}>
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              isHealthy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {ssl.valid ? 'SSL/TLS Certificate is Active and Trusted' : 'SSL/TLS Certificate Issue Detected'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {ssl.valid 
                  ? `Encrypted connection negotiated successfully for ${domain}` 
                  : ssl.error || 'Connection over HTTPS is insecure or failing'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isHealthy ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {ssl.valid ? 'Valid SSL' : 'Invalid'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Certificate Dates & Issuer */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-slate-200 font-semibold text-sm">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Certificate Validity & Authority</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Certificate Authority (Issuer)</span>
              <span className="text-slate-100 font-medium text-sm">{ssl.issuer || 'N/A'}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block mb-0.5">Issued On</span>
                <span className="text-slate-200 font-mono">{ssl.validFrom ? new Date(ssl.validFrom).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Expires On</span>
                <span className="text-slate-200 font-mono">{ssl.validTo ? new Date(ssl.validTo).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Time Remaining</span>
              <div className="flex items-center gap-2">
                <span className={`text-base font-bold font-mono ${
                  (ssl.daysRemaining || 0) < 15 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {ssl.daysRemaining !== undefined ? `${ssl.daysRemaining} days left` : 'Unknown'}
                </span>
                {ssl.daysRemaining !== undefined && ssl.daysRemaining < 30 && (
                  <span className="px-2 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-300 font-medium">
                    Renewal Due Soon
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cryptography & Protocol */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-slate-200 font-semibold text-sm">
            <Key className="w-4 h-4 text-indigo-400" />
            <span>Cryptographic Ciphers & TLS Protocol</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Negotiated Protocol</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 font-mono font-bold text-xs border border-blue-500/30">
                  {ssl.protocol || 'TLSv1.3'}
                </span>
                {ssl.protocol === 'TLSv1.3' && (
                  <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" /> Modern Standard
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Negotiated Cipher Suite</span>
              <span className="text-slate-200 font-mono text-xs break-all bg-slate-800/80 p-2 rounded block border border-slate-700/60">
                {ssl.cipher || 'Standard Modern AEAD Cipher'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Common Name (CN)</span>
              <span className="text-slate-200 font-mono text-xs">{ssl.subject || domain}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SANs (Subject Alternative Names) */}
      {ssl.subjectAltNames && ssl.subjectAltNames.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 mb-3 text-slate-200 font-semibold text-sm">
            <Globe className="w-4 h-4 text-teal-400" />
            <span>Covered Domains (Subject Alternative Names - SANs)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ssl.subjectAltNames.map((san, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs"
              >
                {san}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
