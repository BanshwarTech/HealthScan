import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Copy, Check, Terminal, Sparkles } from 'lucide-react';
import { SecurityHeadersInfo } from '../../types';

interface HeadersTabProps {
  headersInfo: SecurityHeadersInfo;
}

export const HeadersTab: React.FC<HeadersTabProps> = ({ headersInfo }) => {
  const [showRaw, setShowRaw] = useState(false);
  const [showConfigHelper, setShowConfigHelper] = useState(false);
  const [configType, setConfigType] = useState<'nginx' | 'apache' | 'laravel' | 'cloudflare'>('nginx');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const copyHeader = (key: string, val: string) => {
    navigator.clipboard.writeText(`${key}: ${val}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const configSnippets = {
    nginx: `# Add these directives inside your Nginx 'server { ... }' block:
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:;" always;`,

    apache: `# Add these directives inside your Apache .htaccess or VirtualHost:
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:;"
</IfModule>`,

    laravel: `// In Laravel, register a SecurityHeaders middleware (app/Http/Middleware/SecurityHeaders.php):
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);

    $response->headers->set('X-Content-Type-Options', 'nosniff');
    $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
    $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
    $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    $response->headers->set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:;");

    return $response;
}`,

    cloudflare: `# In Cloudflare Dashboard:
1. Navigate to: Rules > Transform Rules > Modify Response Header
2. Click "Create rule"
3. Set action: "Set dynamic" or "Set static"
4. Add Header Names and Values:
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: SAMEORIGIN
   - Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: camera=(), microphone=(), geolocation=()`
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(configSnippets[configType]);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const missingHeaders = headersInfo.evaluated.filter(h => h.status === 'missing');

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">HTTP Security Headers Evaluation</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Security headers instruct browsers to enforce security policies and protect against XSS, clickjacking, and MIME sniffing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfigHelper(!showConfigHelper)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>How to Fix (Snippets)</span>
          </button>

          <button
            onClick={() => setShowRaw(!showRaw)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <span>{showRaw ? 'Hide Raw' : 'All Raw Headers'}</span>
            {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Configuration Helper Snippet Card */}
      {showConfigHelper && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-blue-500/40 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span>Quick Remediation Snippets for Missing Headers</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Copy and paste these headers into your web server or application to achieve a 95%+ Security Score.
              </p>
            </div>

            {/* Config Type Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['nginx', 'apache', 'laravel', 'cloudflare'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setConfigType(t)}
                  className={`px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wider text-[11px] transition-colors ${
                    configType === t
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed">
              {configSnippets[configType]}
            </pre>
            <button
              onClick={handleCopySnippet}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1 shadow transition-colors"
            >
              {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSnippet ? 'Copied Snippet!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Evaluated Headers Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="divide-y divide-slate-800">
          {headersInfo.evaluated.map((h, idx) => {
            const isGood = h.status === 'good';
            const isMissing = h.status === 'missing';

            return (
              <div key={idx} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-850/60 transition-colors">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2.5">
                    {isGood ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : isMissing ? (
                      <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    )}
                    <span className="font-mono text-sm font-bold text-white">
                      {h.name}
                    </span>
                  </div>

                  {h.value ? (
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 font-mono text-xs text-slate-300 break-all">
                      {h.value}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Header not present in HTTP response.
                    </p>
                  )}

                  <p className="text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Recommendation: </span>
                    {h.recommendation}
                  </p>
                </div>

                <div className="flex-shrink-0 md:text-right">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isGood
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : isMissing
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    {isGood ? 'Configured' : isMissing ? 'Missing' : 'Warning'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw Headers Drawer */}
      {showRaw && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Raw HTTP Response Headers ({Object.keys(headersInfo.allHeaders).length})
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-xs max-h-80 overflow-y-auto pr-2">
            {Object.entries(headersInfo.allHeaders).map(([key, val]) => (
              <div
                key={key}
                className="group flex items-start justify-between gap-3 p-2 rounded hover:bg-slate-800/70 border border-transparent hover:border-slate-700/60"
              >
                <div className="break-all">
                  <span className="text-blue-400 font-semibold">{key}: </span>
                  <span className="text-slate-300">{val}</span>
                </div>
                <button
                  onClick={() => copyHeader(key, val)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-white transition-opacity flex-shrink-0"
                  title="Copy header"
                >
                  {copiedKey === key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
