import React from 'react';
import { Search, FileText, CheckCircle2, AlertTriangle, AlertCircle, Link2, ExternalLink, Image } from 'lucide-react';
import { SeoInfo, RobotsInfo, SitemapInfo, ScannedLink } from '../../types';

interface SeoTabProps {
  seo: SeoInfo;
  robots: RobotsInfo;
  sitemap: SitemapInfo;
  links: {
    crawledCount: number;
    internalCount: number;
    externalCount: number;
    brokenCount: number;
    items: ScannedLink[];
  };
}

export const SeoTab: React.FC<SeoTabProps> = ({ seo, robots, sitemap, links }) => {
  return (
    <div className="space-y-6">
      {/* Intro */}
      <div>
        <h3 className="text-base font-bold text-white">Technical SEO & Crawlability</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Evaluating metadata tags, semantic headings, sitemaps, robots rules, and hyperlink integrity.
        </p>
      </div>

      {/* Primary Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title Tag */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-semibold text-sm text-white">Page Title Tag</span>
            <span className="text-xs font-mono text-slate-400">
              {seo.titleLength || 0} / 60 chars
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 font-medium">
            {seo.title || <span className="text-rose-400 italic">Missing title tag</span>}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Optimal range: 30 - 60 chars</span>
            {(seo.titleLength || 0) >= 30 && (seo.titleLength || 0) <= 60 ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Optimal
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> Review Length
              </span>
            )}
          </div>
        </div>

        {/* Meta Description */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-semibold text-sm text-white">Meta Description</span>
            <span className="text-xs font-mono text-slate-400">
              {seo.descriptionLength || 0} / 160 chars
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200">
            {seo.description || <span className="text-amber-400 italic">No meta description found</span>}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Optimal range: 120 - 160 chars</span>
            {(seo.descriptionLength || 0) >= 120 && (seo.descriptionLength || 0) <= 160 ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Optimal
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> {seo.description ? 'Review Length' : 'Missing'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Crawl Diagnostics & Headings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Headings */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
            Heading Hierarchy
          </span>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">H1 Headings:</span>
            <span className={`font-bold font-mono ${seo.headings.h1.length === 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {seo.headings.h1.length} {seo.headings.h1.length === 1 ? '✓' : '(Needs 1)'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>H2 Subheadings:</span>
            <span className="font-mono text-slate-200">{seo.headings.h2Count}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>H3 Headings:</span>
            <span className="font-mono text-slate-200">{seo.headings.h3Count}</span>
          </div>
        </div>

        {/* Image Alt */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
            Image Accessibility
          </span>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Total Images:</span>
            <span className="font-bold font-mono text-slate-200">{seo.images.total}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Missing Alt:</span>
            <span className={`font-bold font-mono ${seo.images.missingAlt === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {seo.images.missingAlt}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            {seo.images.missingAlt === 0 ? 'All images have alt tags' : 'Alt text helps screen readers'}
          </div>
        </div>

        {/* Robots.txt */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
            robots.txt File
          </span>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Status:</span>
            <span className={`font-bold ${robots.exists ? 'text-emerald-400' : 'text-amber-400'}`}>
              {robots.exists ? `Available (200)` : `HTTP ${robots.statusCode || 404}`}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Disallow Rules:</span>
            <span className="font-mono text-slate-200">{robots.disallowRulesCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Sitemaps Referenced:</span>
            <span className="font-mono text-slate-200">{robots.sitemaps.length}</span>
          </div>
        </div>

        {/* XML Sitemap */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
            XML Sitemap
          </span>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Status:</span>
            <span className={`font-bold ${sitemap.exists ? 'text-emerald-400' : 'text-amber-400'}`}>
              {sitemap.exists ? (sitemap.isIndex ? 'Sitemap Index' : 'Valid XML') : 'Not Found'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>URLs Indexed:</span>
            <span className="font-mono text-slate-200">{sitemap.urlCount || 0}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {sitemap.exists ? 'Search engines can index all paths' : 'Missing /sitemap.xml'}
          </div>
        </div>
      </div>

      {/* Crawled Hyperlinks Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-sm text-white">
              Sampled Links Audit ({links.crawledCount} links tested)
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
              {links.internalCount} Internal
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-medium">
              {links.externalCount} External
            </span>
            {links.brokenCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                {links.brokenCount} Broken (4xx/5xx)
              </span>
            )}
          </div>
        </div>

        {links.items.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4 text-center">No hyperlinks crawled on root page.</p>
        ) : (
          <div className="divide-y divide-slate-800/80 max-h-80 overflow-y-auto pr-1">
            {links.items.map((link, idx) => {
              const isBroken = link.statusCode >= 400 || link.statusCode === 0;

              return (
                <div key={idx} className="py-2 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 truncate max-w-lg">
                    <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                      link.isInternal ? 'bg-slate-800 text-slate-300' : 'bg-slate-800 text-indigo-300'
                    }`}>
                      {link.isInternal ? 'Internal' : 'External'}
                    </span>
                    <span className="text-slate-200 truncate font-mono">{link.url}</span>
                    {link.anchorText && (
                      <span className="text-slate-500 italic truncate hidden sm:inline">
                        ("{link.anchorText}")
                      </span>
                    )}
                  </div>

                  <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                    isBroken
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {link.statusCode || 'ERR'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
