import React from 'react';
import { X, AlertCircle, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PLAN_LIMITS } from '../../firebase';

interface ScanLimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUpgrade: () => void;
  reason?: string;
}

export const ScanLimitReachedModal: React.FC<ScanLimitReachedModalProps> = ({
  isOpen,
  onClose,
  onOpenUpgrade,
  reason
}) => {
  const { user, profile, openAuthModal } = useAuth();

  if (!isOpen) return null;

  const currentPlan = profile?.plan || 'free';
  const planConfig = PLAN_LIMITS[currentPlan];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl p-6 overflow-hidden text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">
          Daily Scan Quota Reached
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed mb-6">
          {reason || `You have reached your daily quota on the ${planConfig.name} plan. Your quota will automatically reset tomorrow, or you can upgrade to scan immediately.`}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => {
              onClose();
              onOpenUpgrade();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Zap className="w-4 h-4 text-blue-200" />
            <span>Upgrade to Pro (50 Scans / Day)</span>
          </button>

          {!user && (
            <button
              onClick={() => {
                onClose();
                openAuthModal('signin');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
            >
              Sign In to Your Account
            </button>
          )}

          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Close & Review Previous Audits
          </button>
        </div>
      </div>
    </div>
  );
};
