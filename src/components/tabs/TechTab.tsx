import React from 'react';
import { Cpu, ShieldCheck, Info } from 'lucide-react';
import { DetectedTechnology } from '../../types';

interface TechTabProps {
  technologies: DetectedTechnology[];
}

export const TechTab: React.FC<TechTabProps> = ({ technologies }) => {
  return (
    <div className="space-y-6">
      {/* Intro */}
      <div>
        <h3 className="text-base font-bold text-white">Possible Technologies Detected</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Identified through publicly visible response headers, DOM signatures, and script asset patterns.
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/30 text-xs text-blue-200 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p>
          Detection is based on passive heuristics. Framework signatures help engineering teams verify that public version disclosures are kept minimal.
        </p>
      </div>

      {technologies.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
          <Cpu className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-200">No Common Framework Signatures Exposed</p>
          <p className="text-xs text-slate-500 mt-1">
            Server and HTML headers are well-obfuscated or custom built.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {technologies.map((tech, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-2 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {tech.category}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  tech.confidence === 'high'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    : 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                }`}>
                  {tech.confidence} confidence
                </span>
              </div>

              <h4 className="text-lg font-bold text-white">{tech.name}</h4>

              {tech.evidence && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-500 block">Evidence:</span>
                  <p className="text-xs text-slate-300 font-mono break-all mt-0.5">
                    {tech.evidence}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
