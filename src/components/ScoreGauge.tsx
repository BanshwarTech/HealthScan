import React from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 'md',
  showLabel = true
}) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  // Color mapping
  let colorClass = 'text-emerald-500';
  let strokeColor = '#10b981';
  let bgClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let label = 'Excellent';

  if (clampedScore < 50) {
    colorClass = 'text-rose-500';
    strokeColor = '#f43f5e';
    bgClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    label = 'Critical Attention';
  } else if (clampedScore < 70) {
    colorClass = 'text-amber-500';
    strokeColor = '#f59e0b';
    bgClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    label = 'Needs Improvement';
  } else if (clampedScore < 85) {
    colorClass = 'text-blue-500';
    strokeColor = '#3b82f6';
    bgClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    label = 'Good Baseline';
  }

  const dimensions = {
    sm: { width: 64, stroke: 6, text: 'text-lg', labelText: 'text-[10px]' },
    md: { width: 110, stroke: 9, text: 'text-3xl', labelText: 'text-xs' },
    lg: { width: 160, stroke: 12, text: 'text-5xl', labelText: 'text-sm' },
  }[size];

  const radius = (dimensions.width - dimensions.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: dimensions.width, height: dimensions.width }}>
        <svg
          className="transform -rotate-90"
          width={dimensions.width}
          height={dimensions.width}
        >
          {/* Background circle */}
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.width / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={dimensions.stroke}
            className="text-slate-800"
            fill="transparent"
          />
          {/* Animated score circle */}
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.width / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={dimensions.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`font-black tracking-tight ${dimensions.text} text-white`}>
            {clampedScore}
          </span>
          {size === 'lg' && (
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
              / 100
            </span>
          )}
        </div>
      </div>

      {showLabel && (
        <div className={`mt-2 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${bgClass}`}>
          {label}
        </div>
      )}
    </div>
  );
};
