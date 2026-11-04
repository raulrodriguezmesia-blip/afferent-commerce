/* Nemotron AI Panel */
import { Brain, CheckCircle2 } from 'lucide-react';

export function NemotronPanel() {
  return (
    <div className="border border-white/10 bg-slate-900/60 rounded-lg h-full">
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-slate-300" />
          <p className="text-sm font-medium text-slate-100">Nemotron AI</p>
        </div>
        <p className="mt-1 text-xs text-slate-500">Risk-aware reasoning & settlement guidance</p>
      </div>
      <div className="px-6 py-5 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400">AI Confidence</p>
            <p className="text-sm font-mono text-slate-100">94%</p>
          </div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-slate-300" style={{ width: '94%' }} />
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-400 mb-1">Risk Assessment</p>
            <p className="text-sm text-slate-100">Low — Within acceptable tolerance</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Recommendation</p>
            <p className="text-sm text-slate-100">Proceed with quality-gated release</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">AI Diagnosis</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Surface integrity verified. Force margins within tolerance. Multi-digit engagement stable. No shear stress anomalies detected.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <p className="text-xs text-slate-400">Agentic evaluation complete</p>
        </div>
      </div>
    </div>
  );
}