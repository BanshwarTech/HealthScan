import React from 'react';
import { Network, Mail, Shield, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { DnsRecordInfo } from '../../types';

interface DnsTabProps {
  dns: DnsRecordInfo;
  domain: string;
}

export const DnsTab: React.FC<DnsTabProps> = ({ dns, domain }) => {
  return (
    <div className="space-y-6">
      {/* Intro */}
      <div>
        <h3 className="text-base font-bold text-white">DNS Records & Email Security</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Auditing authoritative routing, IPv4/IPv6 dual-stack resolution, and anti-spoofing policies (SPF/DMARC).
        </p>
      </div>

      {/* Email Security Cards: SPF & DMARC */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SPF */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-sm text-white">SPF (Sender Policy Framework)</span>
            </div>
            {dns.spf?.exists ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <AlertTriangle className="w-3 h-3" /> Not Configured
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            SPF defines which IP addresses or mail relays are authorized to send emails on behalf of @{domain}.
          </p>

          {dns.spf?.record ? (
            <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 break-all border border-slate-800">
              {dns.spf.record}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No SPF TXT record detected.</p>
          )}
        </div>

        {/* DMARC */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-sm text-white">DMARC Policy Enforcement</span>
            </div>
            {dns.dmarc?.exists ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> Policy: {dns.dmarc.policy}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <AlertTriangle className="w-3 h-3" /> Missing DMARC
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            DMARC coordinates email authentication across SPF and DKIM and prevents domain spoofing in phishing campaigns.
          </p>

          {dns.dmarc?.record ? (
            <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 break-all border border-slate-800">
              {dns.dmarc.record}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No TXT record found at _dmarc.{domain}.</p>
          )}
        </div>
      </div>

      {/* Standard DNS Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* A & AAAA */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 font-semibold text-sm text-white">
            <Network className="w-4 h-4 text-emerald-400" />
            <span>IP Routing Records (A & AAAA)</span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                A Records (IPv4)
              </span>
              {dns.a && dns.a.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {dns.a.map((ip, i) => (
                    <span key={i} className="px-2 py-1 rounded bg-slate-800 font-mono text-xs text-slate-200 border border-slate-700">
                      {ip}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500">None</span>
              )}
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                AAAA Records (IPv6)
              </span>
              {dns.aaaa && dns.aaaa.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {dns.aaaa.map((ip, i) => (
                    <span key={i} className="px-2 py-1 rounded bg-slate-800 font-mono text-xs text-slate-200 border border-slate-700">
                      {ip}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500">No IPv6 configured</span>
              )}
            </div>
          </div>
        </div>

        {/* Nameservers (NS) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 font-semibold text-sm text-white">
            <Network className="w-4 h-4 text-purple-400" />
            <span>Authoritative Nameservers (NS)</span>
          </div>

          {dns.ns && dns.ns.length > 0 ? (
            <div className="space-y-1.5">
              {dns.ns.map((ns, i) => (
                <div key={i} className="p-2 rounded bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800">
                  {ns}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No NS records returned.</p>
          )}
        </div>

        {/* MX Mail Records */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 font-semibold text-sm text-white">
            <Mail className="w-4 h-4 text-amber-400" />
            <span>Mail Exchanger Records (MX)</span>
          </div>

          {dns.mx && dns.mx.length > 0 ? (
            <div className="space-y-1.5">
              {dns.mx.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800">
                  <span>{m.exchange}</span>
                  <span className="text-slate-400">Pri: {m.priority}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Domain does not publish MX records.</p>
          )}
        </div>

        {/* CAA Records */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 font-semibold text-sm text-white">
            <Shield className="w-4 h-4 text-teal-400" />
            <span>Certificate Authority Authorization (CAA)</span>
          </div>

          {dns.caa && dns.caa.length > 0 ? (
            <div className="space-y-1.5 font-mono text-xs text-slate-300">
              {dns.caa.map((c, i) => (
                <div key={i} className="p-2 rounded bg-slate-950 border border-slate-800">
                  {JSON.stringify(c)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed">
              No CAA records found. Any CA is allowed to issue certificates for this domain.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
