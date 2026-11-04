import React from 'react';

export const P0Cards: React.FC = () => {
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Critical Metrics</h4>

      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner">
        <div className="mb-3 text-xs font-medium text-slate-400">Nemotron Decision Engine</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Confidence</span>
            <span className="font-mono text-xs font-semibold text-emerald-400">94%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Risk Level</span>
            <span className="font-mono text-xs font-semibold text-emerald-400">LOW</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Recommended</span>
            <span className="font-mono text-xs font-semibold text-white">$1,450 USD</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner">
        <div className="mb-3 text-xs font-medium text-slate-400">PayPal Integration</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Status</span>
            <span className="font-mono text-xs font-semibold text-emerald-400">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Connected</span>
            <span className="font-mono text-xs font-semibold text-emerald-400">Yes</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">API</span>
            <span className="font-mono text-xs font-semibold text-white">Payouts API</span>
          </div>
        </div>
      </div>
    </div>
  );
};