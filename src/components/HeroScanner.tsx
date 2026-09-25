import React, { useState } from 'react';
import { Search, ShieldAlert, ArrowRight, CheckCircle2, Lock, Zap, FileText, Globe, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PLAN_LIMITS } from '../firebase';

interface HeroScannerProps {
  onScan: (url: string) => void;
  isLoading: boolean;
  onQuotaReached: (reason?: string) => void;
  onOpenUpgradeModal: () => void;
}

export const HeroScanner: React.FC<HeroScannerProps> = ({ 
  onScan, 
  isLoading,
  onQuotaReached,
  onOpenUpgradeModal
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { user, profile, checkScanAllowed, openAuthModal } = useAuth();

  const currentPlan = profile?.plan || 'free';
  const planConfig = PLAN_LIMITS[currentPlan];
  const scansUsed = profile?.dailyScansUsed || 0;
  const isUnlimited = planConfig.dailyScanLimit === Infinity;

  const sampleUrls = [
    { label: 'Stripe', url: 'https://stripe.com' },
    { label: 'Wikipedia', url: 'https://wikipedia.org' },
    { label: 'GitHub', url: 'https://github.com' },
    { label: 'Example', url: 'https://example.com' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError('Please enter a website URL to audit.');
      return;
    }

    // SSRF client hint if user types localhost
    if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
      setError('Internal and localhost addresses are prohibited for security.');
      return;
    }

    // Check plan quota
    const quota = await checkScanAllowed();
    if (!quota.allowed) {
      onQuotaReached(quota.reason);
      return;
    }

    onScan(trimmed);
  };

  const handleQuickPick = async (url: string) => {
    setUrlInput(url);
    setError(null);

    const quota = await checkScanAllowed();
    if (!quota.allowed) {
      onQuotaReached(quota.reason);
      return;
    }

    onScan(url);
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[250px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Automated Technical & Security Scanner</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-4 leading-tight">
          Scan. Secure.{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
            Improve.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
          Analyze your website's security, performance, SEO and technical health in minutes with actionable recommendations.
        </p>

        {/* URL Input Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-4">
          <div className="relative flex flex-col sm:flex-row items-center p-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl shadow-blue-950/40 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <div className="flex items-center w-full pl-3 pr-2 py-2">
              <Globe className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter website URL (e.g., https://example.com)"
                className="w-full bg-transparent text-white placeholder-slate-400 text-base sm:text-lg focus:outline-none"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto mt-2 sm:mt-0 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex-shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Auditing...</span>
                </>
              ) : (
                <>
                  <span>Scan Website</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="mt-2.5 text-sm text-rose-400 flex items-center justify-center gap-1.5 font-medium">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </form>

        {/* Live Plan Quota Indicator */}
        <div className="max-w-2xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-2 px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {user ? (
              <span>
                Plan: <strong className="text-white uppercase">{planConfig.badge}</strong> · Today's Scans: <strong>{isUnlimited ? `${scansUsed} (Unlimited)` : `${scansUsed} / ${planConfig.dailyScanLimit}`}</strong>
              </span>
            ) : (
              <span>
                Guest Mode: <strong className="text-white">3 Daily Scans</strong> · Create free account for 5 scans/day
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className="text-blue-400 hover:text-blue-300 font-semibold hover:underline flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                <span>Switch / Upgrade Plan</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="text-blue-400 hover:text-blue-300 font-semibold hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Register to unlock limits</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Sample Picks */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 text-xs text-slate-400">
          <span>Or test a popular site:</span>
          {sampleUrls.map((sample) => (
            <button
              key={sample.url}
              onClick={() => handleQuickPick(sample.url)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              {sample.label}
            </button>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-4 border-t border-slate-800/80 text-left">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Free scan</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Lock className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Security-focused</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>Detailed recommendations</span>
          </div>
        </div>
      </div>
    </section>
  );
};

