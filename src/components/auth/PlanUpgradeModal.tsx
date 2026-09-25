import React from 'react';
import { X, Check, Zap, Sparkles, Shield, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PLAN_LIMITS, PlanType } from '../../firebase';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({ isOpen, onClose }) => {
  const { profile, changePlan, user, openAuthModal } = useAuth();

  if (!isOpen) return null;

  const currentPlan = profile?.plan || 'free';

  const handleSelectPlan = async (plan: PlanType) => {
    if (!user) {
      onClose();
      openAuthModal('signin');
      return;
    }
    await changePlan(plan);
    onClose();
  };

  const plansList: { id: PlanType; price: string; period: string; icon: any; popular?: boolean }[] = [
    {
      id: 'free',
      price: '$0',
      period: 'forever',
      icon: Shield
    },
    {
      id: 'pro',
      price: '$29',
      period: 'per month',
      icon: Zap,
      popular: true
    },
    {
      id: 'enterprise',
      price: '$99',
      period: 'per month',
      icon: Crown
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Subscription Plans & Scan Quotas
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Choose the Right Plan for Your Needs
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Upgrade or switch your active plan to increase your daily scanning volume, unlock deep vulnerability scans, and access priority exports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plansList.map((p) => {
            const config = PLAN_LIMITS[p.id];
            const isCurrent = currentPlan === p.id;
            const Icon = p.icon;

            return (
              <div
                key={p.id}
                className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all ${
                  p.popular
                    ? 'bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900 border-2 border-blue-500 shadow-xl shadow-blue-500/10 scale-100 md:scale-105'
                    : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                    Most Popular
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${
                      p.popular ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-300'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {config.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">
                    {config.name}
                  </h3>
                  
                  <div className="flex items-baseline gap-1 my-3">
                    <span className="text-3xl font-extrabold text-white">{p.price}</span>
                    <span className="text-xs text-slate-400">/{p.period}</span>
                  </div>

                  <div className="py-2.5 px-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4 text-xs font-medium text-blue-300">
                    Quota: <strong>{config.dailyScanLimit === Infinity ? 'Unlimited' : `${config.dailyScanLimit} scans/day`}</strong>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                    {config.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan(p.id)}
                  disabled={isCurrent}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                      : p.popular
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:scale-[1.02]'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Active Plan</span>
                    </>
                  ) : (
                    <span>Switch to {config.badge}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
