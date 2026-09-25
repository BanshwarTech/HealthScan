import React from 'react';
import { CheckCircle2, Loader2, Circle, Shield, Globe } from 'lucide-react';

interface ScanProgressModalProps {
  isOpen: boolean;
  targetDomain: string;
  currentStep: string;
  progressPercent: number;
  onCancel?: () => void;
}

const CHECKLIST_STEPS = [
  { label: 'Initializing security checks & SSRF validation', threshold: 10 },
  { label: 'Checking website availability & HTTP responses', threshold: 25 },
  { label: 'Checking SSL/TLS certificate & ciphers', threshold: 40 },
  { label: 'Checking HTTP security headers (CSP, HSTS, XFO)', threshold: 55 },
  { label: 'Checking DNS records, SPF, DMARC & CAA', threshold: 70 },
  { label: 'Checking SEO health & HTML metadata', threshold: 80 },
  { label: 'Checking robots.txt & XML sitemap', threshold: 88 },
  { label: 'Checking performance indicators, links & cookies', threshold: 95 },
  { label: 'Generating comprehensive audit report', threshold: 100 }
];

export const ScanProgressModal: React.FC<ScanProgressModalProps> = ({
  isOpen,
  targetDomain,
  currentStep,
  progressPercent,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-white overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-500/15 blur-3xl rounded-full" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Auditing Website</h3>
              <p className="text-xs text-slate-400 truncate max-w-[260px] font-mono">{targetDomain}</p>
            </div>
          </div>
          <span className="text-xl font-bold font-mono text-blue-400">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2.5 mb-6 overflow-hidden border border-slate-700/60">
          <div
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-400 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          />
        </div>

        {/* Active step readout */}
        <div className="mb-5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
          <span className="text-sm font-medium text-slate-200 truncate">
            {currentStep || 'Analyzing target...'}
          </span>
        </div>

        {/* Checklist */}
        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-1">
          {CHECKLIST_STEPS.map((step, idx) => {
            const isCompleted = progressPercent >= step.threshold;
            const isCurrent = !isCompleted && (idx === 0 || progressPercent >= CHECKLIST_STEPS[idx - 1].threshold);

            return (
              <div
                key={idx}
                className={`flex items-center gap-2.5 text-xs py-1 px-2 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-blue-500/10 text-blue-300 font-medium'
                    : isCompleted
                    ? 'text-slate-300'
                    : 'text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                )}
                <span className="truncate">{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Non-invasive passive inspection
          </span>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-200 hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
