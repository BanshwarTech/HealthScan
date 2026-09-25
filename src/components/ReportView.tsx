import React, { useState } from 'react';
import { 
  ArrowLeft, 
  RotateCw, 
  Share2, 
  Printer, 
  Download, 
  Check, 
  ExternalLink, 
  Shield, 
  Clock, 
  Calendar,
  Lock,
  Layers,
  Search,
  Zap,
  Globe,
  Network,
  Cpu
} from 'lucide-react';
import { ScanReport } from '../types';
import { OverviewTab } from './tabs/OverviewTab';
import { FindingsList } from './FindingsList';
import { SslTab } from './tabs/SslTab';
import { HeadersTab } from './tabs/HeadersTab';
import { DnsTab } from './tabs/DnsTab';
import { SeoTab } from './tabs/SeoTab';
import { PerformanceCookiesTab } from './tabs/PerformanceCookiesTab';
import { TechTab } from './tabs/TechTab';

interface ReportViewProps {
  report: ScanReport;
  onBack: () => void;
  onRescan: (url: string) => void;
  isPublicView?: boolean;
}

export const ReportView: React.FC<ReportViewProps> = ({
  report,
  onBack,
  onRescan,
  isPublicView = false
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const shareUrl = `${window.location.origin}?token=${report.publicToken}`;

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit-${report.domain}-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'findings', label: `Issues (${report.metrics.criticalCount + report.metrics.highCount + report.metrics.mediumCount + report.metrics.lowCount})`, icon: Shield },
    { id: 'ssl', label: 'SSL / TLS Certificate', icon: Lock },
    { id: 'headers', label: 'HTTP Headers', icon: Shield },
    { id: 'dns', label: 'DNS & Email', icon: Network },
    { id: 'seo', label: 'SEO & Crawl', icon: Search },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'tech', label: 'Technologies', icon: Cpu }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {!isPublicView && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Back to scanner"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Website Health & Security Report
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(report.startedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {report.domain}
              </h1>
              <a
                href={report.normalizedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-400 p-1"
                title="Open website in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isPublicView && (
            <button
              onClick={() => onRescan(report.url)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Rescan</span>
            </button>
          )}

          <button
            onClick={() => setShowShareModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Share Link</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors print:hidden"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Print PDF</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors print:hidden"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Target details bar */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <strong className="text-slate-300">Target:</strong> {report.normalizedUrl}
          </span>
          {report.ipAddress && (
            <span className="flex items-center gap-1.5 font-mono">
              <Network className="w-3.5 h-3.5 text-emerald-400" />
              <strong className="text-slate-300">IP:</strong> {report.ipAddress}
            </span>
          )}
          {report.durationMs && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <strong className="text-slate-300">Audit Time:</strong> {(report.durationMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>

        <span className="text-[11px] text-slate-500 font-medium">
          Passive automated audit • Non-invasive
        </span>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-800 no-scrollbar print:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <OverviewTab report={report} onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'findings' && (
          <FindingsList findings={report.findings} />
        )}
        {activeTab === 'ssl' && (
          <SslTab 
            ssl={report.categories.ssl} 
            domain={report.domain} 
            securityScore={report.scores.security}
            headersInfo={report.categories.headers}
            cookies={report.categories.cookies}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'headers' && (
          <HeadersTab headersInfo={report.categories.headers} />
        )}
        {activeTab === 'dns' && (
          <DnsTab dns={report.categories.dns} domain={report.domain} />
        )}
        {activeTab === 'seo' && (
          <SeoTab 
            seo={report.categories.seo} 
            robots={report.categories.robots} 
            sitemap={report.categories.sitemap} 
            links={report.categories.links}
          />
        )}
        {activeTab === 'performance' && (
          <PerformanceCookiesTab 
            performance={report.categories.performance} 
            cookies={report.categories.cookies}
          />
        )}
        {activeTab === 'tech' && (
          <TechTab technologies={report.categories.technologies} />
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white space-y-4">
            <h3 className="font-bold text-lg text-white">Share Public Health Report</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Anyone with this cryptographically secured token link can view this complete report without an account.
            </p>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 font-mono text-xs text-slate-300 break-all">
              <span className="truncate">{shareUrl}</span>
              <button
                onClick={handleCopyShareLink}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex-shrink-0 flex items-center gap-1 transition-colors"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
