import React from 'react';

interface BusinessImpactCardProps {
  savingsPercent: number;
  riskReduction: number;
  automationsToday: number;
  auditedTransactions: number;
}

export const BusinessImpactCard: React.FC<BusinessImpactCardProps> = ({
  savingsPercent,
  riskReduction,
  automationsToday,
  auditedTransactions,
}) => {
  const metrics = [
    { label: 'Time Saved', value: `${savingsPercent}%` },
    { label: 'Risk Reduced', value: `${riskReduction}%` },
    { label: 'Automated', value: automationsToday.toLocaleString() },
    { label: 'Audited', value: auditedTransactions.toLocaleString() },
  ];

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-violet-950/60 p-5 shadow-lg shadow-indigo-950/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-300">Business Impact</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">Settlement performance</h3>
          <p className="mt-1 text-xs text-slate-400">Executive summary of automated financial operations.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-center">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">{metric.label}</div>
              <div className="mt-1 font-mono text-sm font-semibold text-slate-100">{metric.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};