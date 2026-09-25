import React from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Search, 
  Activity, 
  Terminal, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { ScanReport } from '../../types';
import { ScoreGauge } from '../ScoreGauge';

interface OverviewTabProps {
  report: ScanReport;
  onNavigateTab: (tabId: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ report, onNavigateTab }) => {
  const { scores, aiSummary, metrics } = report;

  const categoryCards = [
    {
      id: 'security',
      title: 'Security',
      score: scores.security,
      weight: '30%',
      icon: ShieldCheck,
      color: 'blue',
      tab: 'ssl'
    },
    {
      id: 'performance',
      title: 'Performance',
      score: scores.performance,
      weight: '20%',
      icon: Zap,
      color: 'amber',
      tab: 'performance'
    },
    {
      id: 'seo',
      title: 'SEO Health',
      score: scores.seo,
      weight: '25%',
      icon: Search,
      color: 'emerald',
      tab: 'seo'
    },
    {
      id: 'availability',
      title: 'Availability',
      score: scores.availability,
      weight: '15%',
      icon: Activity,
      color: 'teal',
      tab: 'findings'
    },
    {
      id: 'technical',
      title: 'Technical & DNS',
      score: scores.technical,
      weight: '10%',
      icon: Terminal,
      color: 'purple',
      tab: 'dns'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Score Gauge & Executive Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Score Card */}
        <div className="lg:col-span-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 p-6 flex flex-col items-center justify-center text-center shadow-xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Overall Health Score
          </span>
          <ScoreGauge score={scores.overall} size="lg" />
          
          <div className="grid grid-cols-3 gap-2 w-full mt-6 pt-5 border-t border-slate-800/80 text-center">
            <div>
              <span className="text-xl font-bold text-rose-400">{metrics.criticalCount + metrics.highCount}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">High/Crit</span>
            </div>
            <div>
              <span className="text-xl font-bold text-amber-400">{metrics.mediumCount}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Medium</span>
            </div>
            <div>
              <span className="text-xl font-bold text-emerald-400">{metrics.passedCount}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Passed</span>
            </div>
          </div>
        </div>

        {/* AI Executive Summary Card */}
        <div className="lg:col-span-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-850 border border-slate-700/80 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Executive Technical Summary</h3>
                {aiSummary?.aiProvider === 'nvidia' ? (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    NVIDIA NIM AI ({aiSummary.aiModel || 'Llama 3.3'})
                  </span>
                ) : aiSummary?.aiProvider === 'gemini' ? (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                    Gemini 2.5 Flash
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold">
                    Heuristic Security Rules
                  </span>
                )}
              </div>
              {aiSummary?.executiveScoreRating && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {aiSummary.executiveScoreRating}
                </span>
              )}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {aiSummary?.summary || 'Audit complete. Review findings breakdown below.'}
            </p>

            {/* Top Priorities Checklist */}
            {aiSummary?.topPriorities && aiSummary.topPriorities.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Top Priority Remediation Items:
                  </span>
                  <button
                    onClick={() => onNavigateTab('findings')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all hover:scale-105"
                  >
                    <span>View All Issues & Code Fixes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {aiSummary.topPriorities.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Highlights */}
          {aiSummary?.positiveHighlights && aiSummary.positiveHighlights.length > 0 && (
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">Strengths:</span>
              {aiSummary.positiveHighlights.map((hi, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  {hi}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Scores Grid */}
      <div>
        <h3 className="text-base font-bold text-white mb-3">Health Category Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categoryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => onNavigateTab(card.tab)}
                className="group cursor-pointer rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-4 transition-all hover:bg-slate-850 shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-300 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Weight {card.weight}</span>
                </div>

                <div className="flex items-baseline justify-between mb-1">
                  <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white">
                    {card.title}
                  </h4>
                  <span className={`text-base font-bold ${
                    card.score >= 85 ? 'text-emerald-400' : card.score >= 70 ? 'text-blue-400' : 'text-amber-400'
                  }`}>
                    {card.score}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      card.score >= 85 ? 'bg-emerald-500' : card.score >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${card.score}%` }}
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-end text-[11px] text-slate-400 group-hover:text-blue-400 transition-colors">
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
