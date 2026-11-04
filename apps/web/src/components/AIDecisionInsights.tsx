import React from 'react';

interface AIDecisionInsightsProps {
  decision?: string;
  confidenceScore?: number;
  riskScore?: number;
  merchantScore?: number;
  decisionMode?: string;
}

export const AIDecisionInsights: React.FC<AIDecisionInsightsProps> = ({
  decision = 'PENDING',
  confidenceScore = 0,
  riskScore = 0,
  merchantScore = 0,
  decisionMode = 'Human In The Loop',
}) => {
  const safeConfidence = Math.max(0, Math.min(100, confidenceScore));

  return (
    <div className="panel">
      <h4 className="panel-title">AI Decision Insights</h4>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Decision</div>
          <div className="mt-1 text-sm font-bold text-emerald-400">{decision}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Decision Mode</div>
          <div className="mt-1 text-sm font-bold text-violet-300">{decisionMode}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Risk Score</div>
          <div className="mt-1 font-mono text-sm font-bold text-amber-400">{riskScore}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Merchant Score</div>
          <div className="mt-1 font-mono text-sm font-bold text-blue-400">{merchantScore}</div>
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-slate-500">Confidence</span>
          <span className="font-mono text-xs font-bold text-emerald-400">{safeConfidence}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${safeConfidence}%` }}
          />
        </div>
      </div>
    </div>
  );
};