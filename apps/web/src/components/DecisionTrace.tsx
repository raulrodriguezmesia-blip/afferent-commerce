import React from 'react';

interface TraceStep {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending' | 'error';
  timestamp?: string;
  durationMs?: number;
}

interface DecisionTraceProps {
  steps: TraceStep[];
}

const statusColor: Record<TraceStep['status'], string> = {
  completed: 'text-emerald-400 border-emerald-500/40',
  active: 'text-blue-400 border-blue-500/40',
  pending: 'text-slate-500 border-white/10',
  error: 'text-rose-400 border-rose-500/40',
};

export const DecisionTrace: React.FC<DecisionTraceProps> = ({ steps }) => {
  return (
    <div className="panel">
      <h4 className="panel-title">Decision Trace</h4>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 rounded-xl border bg-slate-950/30 px-3 py-2 ${statusColor[step.status]}`}
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-900/60 text-xs font-bold">
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-slate-100">{step.label}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest">{step.status}</div>
            </div>
            <div className="text-right text-[10px] text-slate-500">
              <div>{step.timestamp || '--:--:--'}</div>
              <div>{step.durationMs ? `${step.durationMs} ms` : '--'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};