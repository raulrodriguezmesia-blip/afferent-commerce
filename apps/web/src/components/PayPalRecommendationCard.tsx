import React from 'react';

interface PayPalRecommendationCardProps {
  recommendedAmount: number;
  currency: string;
  confidenceScore: number;
  riskLevel: string;
  recommendedAction: string;
  reasoning: string;
  onApprove: () => void;
  onReject: () => void;
}

export const PayPalRecommendationCard: React.FC<PayPalRecommendationCardProps> = ({
  recommendedAmount,
  currency,
  confidenceScore,
  riskLevel,
  reasoning,
  onApprove,
  onReject,
}) => {
  const safeConfidence = Math.max(0, Math.min(100, confidenceScore));
  const riskColor =
    riskLevel === 'LOW' ? 'text-emerald-400' : riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="panel">
      <h4 className="panel-title">AI Recommendation</h4>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Recommended Settlement</div>
          <div className="mt-1 font-mono text-lg font-bold text-white">
            {recommendedAmount} {currency}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Risk Level</div>
          <div className={`mt-1 font-mono text-lg font-bold ${riskColor}`}>{riskLevel}</div>
        </div>
      </div>
      <div className="mb-4">
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
      <div className="mb-4 rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <div className="mb-1 text-[10px] uppercase tracking-widest text-slate-500">Reasoning</div>
        <p className="text-xs leading-5 text-slate-300">{reasoning}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onApprove}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-950/30 transition hover:from-emerald-500 hover:to-teal-400"
        >
          Approve via PayPal
        </button>
        <button
          type="button"
          onClick={onReject}
          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-950/30 transition hover:bg-rose-500"
        >
          Reject Recommendation
        </button>
      </div>
    </div>
  );
};