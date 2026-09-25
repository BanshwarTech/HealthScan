import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Search,
  Code,
  Sparkles,
  Copy,
  Check,
  Wrench,
  Terminal
} from 'lucide-react';
import { ScanFinding, Severity, FindingCategory } from '../types';
import { getClientSolutionForFinding } from '../utils/solutions';

interface FindingsListProps {
  findings: ScanFinding[];
}

export const FindingsList: React.FC<FindingsListProps> = ({ findings }) => {
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<FindingCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [activeSnippetTab, setActiveSnippetTab] = useState<Record<string, number>>({});

  // Group counts
  const counts = useMemo(() => {
    return {
      all: findings.length,
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
      info: findings.filter(f => f.severity === 'info').length,
      passed: findings.filter(f => f.severity === 'passed').length
    };
  }, [findings]);

  // Filtered findings
  const filtered = useMemo(() => {
    return findings.filter(f => {
      if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false;
      if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.recommendation.toLowerCase().includes(q) ||
          (f.technical_details && f.technical_details.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [findings, selectedSeverity, selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Info className="w-3.5 h-3.5" />
            Low
          </span>
        );
      case 'info':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-700/50 text-slate-300 border border-slate-600">
            <Info className="w-3.5 h-3.5" />
            Info
          </span>
        );
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Passed
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Summary Counts Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedSeverity('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedSeverity === 'all'
              ? 'bg-slate-200 text-slate-900 shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          All Checks ({counts.all})
        </button>

        {counts.critical > 0 && (
          <button
            onClick={() => setSelectedSeverity('critical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedSeverity === 'critical'
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
            }`}
          >
            {counts.critical} Critical
          </button>
        )}

        {counts.high > 0 && (
          <button
            onClick={() => setSelectedSeverity('high')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedSeverity === 'high'
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                : 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20'
            }`}
          >
            {counts.high} High Issues
          </button>
        )}

        {counts.medium > 0 && (
          <button
            onClick={() => setSelectedSeverity('medium')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedSeverity === 'medium'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
            }`}
          >
            {counts.medium} Medium Issues
          </button>
        )}

        {counts.low > 0 && (
          <button
            onClick={() => setSelectedSeverity('low')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedSeverity === 'low'
                ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/30'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
            }`}
          >
            {counts.low} Low Issues
          </button>
        )}

        <button
          onClick={() => setSelectedSeverity('passed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedSeverity === 'passed'
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
          }`}
        >
          {counts.passed} Passed Checks
        </button>
      </div>

      {/* Filters & Search row */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search findings (e.g. CSP, SSL, H1, robots, cookies)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as any)}
          className="w-full sm:w-auto px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="security">Security & Availability</option>
          <option value="ssl">SSL / TLS</option>
          <option value="headers">HTTP Headers</option>
          <option value="dns">DNS & Email Protection</option>
          <option value="seo">SEO & Crawling</option>
          <option value="performance">Performance & TTFB</option>
          <option value="cookies">Cookies</option>
          <option value="technology">Technologies</option>
        </select>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 rounded-2xl border border-slate-800">
            <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">No findings match your filter.</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting the severity or search filters.</p>
          </div>
        ) : (
          filtered.map((finding) => {
            const isExpanded = expandedId === finding.id;
            const solutionGuide = finding.solution_guide || (finding.severity !== 'passed' ? getClientSolutionForFinding(finding.check_key) : undefined);
            const hasSolution = Boolean(solutionGuide);
            const snippets = solutionGuide?.code_snippets || [];
            const activeTabIdx = activeSnippetTab[finding.id] || 0;
            const currentSnippet = snippets[activeTabIdx] || snippets[0];

            return (
              <div
                key={finding.id}
                className="rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all overflow-hidden"
              >
                {/* Header row */}
                <div
                  onClick={() => toggleExpand(finding.id)}
                  className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    {getSeverityBadge(finding.severity)}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-sm sm:text-base text-white hover:text-blue-400 transition-colors">
                          {finding.title}
                        </h4>
                        {hasSolution && finding.severity !== 'passed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            <Wrench className="w-3 h-3" /> Solution Included
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {finding.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider">
                      {finding.category}
                    </span>

                    {hasSolution && finding.severity !== 'passed' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(finding.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/25 border border-blue-400/30 transition-all hover:scale-105 active:scale-95"
                      >
                        <Wrench className="w-3.5 h-3.5 text-blue-200" />
                        <span>{isExpanded ? 'Hide Solution' : 'View Solution & Code'}</span>
                      </button>
                    )}

                    <button className="p-1 rounded text-slate-400 hover:text-white">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 bg-slate-950/40 text-sm space-y-4 animate-in fade-in duration-150">
                    {/* Explanation */}
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                        Explanation
                      </span>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                        {finding.description}
                      </p>
                    </div>

                    {/* Impact */}
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-1">
                        Potential Impact
                      </span>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                        {finding.impact}
                      </p>
                    </div>

                    {/* Actionable Recommendation */}
                    <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40">
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 block mb-1">
                        Actionable Recommendation
                      </span>
                      <p className="text-blue-100 text-xs sm:text-sm leading-relaxed font-medium">
                        {finding.recommendation}
                      </p>
                    </div>

                    {/* INTERACTIVE SOLUTION & CODE FIX GUIDE */}
                    {solutionGuide && (
                      <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 shadow-lg space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <h5 className="font-bold text-sm text-white">
                              Direct Solution & Copy-Paste Fix
                            </h5>
                          </div>

                          <span className="text-[11px] font-semibold text-slate-400">
                            Apply this fix to resolve
                          </span>
                        </div>

                        {/* Summary */}
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                          {solutionGuide.summary}
                        </p>

                        {/* Steps Checklist */}
                        {solutionGuide.steps && solutionGuide.steps.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                              How to apply:
                            </span>
                            <div className="space-y-1">
                              {solutionGuide.steps.map((st, sIdx) => (
                                <div key={sIdx} className="flex items-start gap-2 text-xs text-slate-300">
                                  <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {sIdx + 1}
                                  </span>
                                  <span>{st}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Code Snippets with Platform Tabs */}
                        {snippets.length > 0 && currentSnippet && (
                          <div className="pt-2 space-y-2">
                            {/* Platform Tabs (if multiple snippets exist) */}
                            {snippets.length > 1 && (
                              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                                {snippets.map((snip, sIdx) => (
                                  <button
                                    key={sIdx}
                                    onClick={() => setActiveSnippetTab({ ...activeSnippetTab, [finding.id]: sIdx })}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                                      activeTabIdx === sIdx
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {snip.label}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Snippet Box */}
                            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800/80 text-[11px] text-slate-400 font-mono">
                                <span>{currentSnippet.label}</span>
                                <button
                                  onClick={() => copyToClipboard(currentSnippet.code, `${finding.id}-${activeTabIdx}`)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-sm"
                                >
                                  {copiedSnippetId === `${finding.id}-${activeTabIdx}` ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copy Code</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <pre className="p-3.5 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
                                {currentSnippet.code}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Technical details */}
                    {finding.technical_details && (
                      <div className="pt-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                          <Code className="w-3.5 h-3.5" />
                          Technical Raw Output
                        </span>
                        <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                          {finding.technical_details}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
