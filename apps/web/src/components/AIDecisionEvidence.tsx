import React from 'react';

interface AIDecisionEvidenceProps {
  orderId?: string;
  merchantScore?: number;
  riskScore?: number;
  qualityScore?: number;
  confidence?: number;
  recommendedAmount?: number;
  recommendation?: string;
}

export const AIDecisionEvidence: React.FC<AIDecisionEvidenceProps> = ({
  orderId = '#ORD-2026-8842',
  merchantScore = 91,
  riskScore = 12,
  qualityScore = 94,
  confidence = 96,
  recommendedAmount = 48750.0,
  recommendation = 'APPROVE SETTLEMENT',
}) => {
  const metrics = [
    { label: 'Merchant Reliability', value: `${merchantScore}/100` },
    { label: 'Transaction Risk', value: `${riskScore}/100 (LOW)` },
    { label: 'Quality Verification', value: `${qualityScore}/100 (VERIFIED)` },
    { label: 'AI Confidence', value: `${confidence}%` },
  ];

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-indigo-950/40 p-5 shadow-xl shadow-indigo-950/20">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold tracking-wider text-teal-400 uppercase">Business Decision Evidence</h3>
        <span className="font-mono text-xs text-slate-400">Order ID: {orderId}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <span className="block text-[10px] uppercase tracking-widest text-slate-500">{metric.label}</span>
            <span className="mt-1 block font-mono text-lg font-bold text-slate-100">{metric.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="block text-[10px] uppercase tracking-widest text-slate-500">Recommended Settlement</span>
          <span className="mt-1 block font-mono text-2xl font-extrabold tracking-tight text-white">
            ${recommendedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <span className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm">
          ✅ {recommendation}
        </span>
      </div>
    </div>
  );
};