import React, { useState, useRef, useEffect } from 'react';
import { 
  User as UserIcon, 
  LogOut, 
  Zap, 
  ShieldCheck, 
  Clock, 
  ChevronDown, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PLAN_LIMITS } from '../../firebase';

interface UserProfileDropdownProps {
  onOpenUpgradeModal: () => void;
  onOpenHistoryModal: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  onOpenUpgradeModal,
  onOpenHistoryModal
}) => {
  const { user, profile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user || !profile) return null;

  const currentPlan = profile.plan || 'free';
  const planConfig = PLAN_LIMITS[currentPlan];
  const scansUsed = profile.dailyScansUsed || 0;
  const isUnlimited = planConfig.dailyScanLimit === Infinity;
  const percentUsed = isUnlimited ? 0 : Math.min(100, Math.round((scansUsed / planConfig.dailyScanLimit) * 100));

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-white transition-all text-xs font-medium"
      >
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={profile.displayName} 
            className="w-6 h-6 rounded-full object-cover border border-slate-600"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
            {profile.displayName.slice(0, 2)}
          </div>
        )}

        <div className="hidden sm:flex flex-col items-start text-left">
          <span className="font-semibold text-white truncate max-w-[110px]">
            {profile.displayName}
          </span>
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
            {planConfig.badge} Plan
          </span>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 text-xs z-50 animate-in fade-in duration-100">
          {/* User Info Header */}
          <div className="pb-3 border-b border-slate-800">
            <p className="font-bold text-sm text-white truncate">
              {profile.displayName}
            </p>
            <p className="text-slate-400 text-[11px] truncate mt-0.5">
              {profile.email}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold text-[10px]">
              <Sparkles className="w-3 h-3" />
              <span>{planConfig.name}</span>
            </div>
          </div>

          {/* Daily Quota Progress */}
          <div className="py-3 border-b border-slate-800">
            <div className="flex items-center justify-between text-slate-300 text-[11px] mb-1.5 font-medium">
              <span>Daily Scans Used</span>
              <span className="font-bold text-white">
                {isUnlimited ? `${scansUsed} (Unlimited)` : `${scansUsed} / ${planConfig.dailyScanLimit}`}
              </span>
            </div>

            {!isUnlimited && (
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    percentUsed >= 90 ? 'bg-rose-500' : percentUsed >= 60 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            )}

            <button
              onClick={() => { setIsOpen(false); onOpenUpgradeModal(); }}
              className="mt-3 w-full py-1.5 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30 font-semibold flex items-center justify-center gap-1.5 transition-colors text-xs"
            >
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Manage / Upgrade Plan</span>
            </button>
          </div>

          {/* History link */}
          <div className="py-2 border-b border-slate-800">
            <button
              onClick={() => { setIsOpen(false); onOpenHistoryModal(); }}
              className="w-full py-1.5 px-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2 text-left transition-colors font-medium"
            >
              <Clock className="w-4 h-4 text-slate-400" />
              <span>My Audit History</span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="pt-2">
            <button
              onClick={() => { setIsOpen(false); logout(); }}
              className="w-full py-1.5 px-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 text-left transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
