import React from 'react';

export const IntelligenceStatusPanel: React.FC = () => {
  const [showImpactModal, setShowImpactModal] = React.useState(false);

  const statuses = [
    { name: 'Quality Intelligence', status: 'OPERATIONAL' },
    { name: 'Risk Intelligence', status: 'OPERATIONAL' },
    { name: 'Settlement Intelligence', status: 'OPERATIONAL' },
    { name: 'Audit Intelligence', status: 'OPERATIONAL' },
  ];

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 shadow-xl shadow-black/20">
        <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Intelligence Status</h3>
        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
          {statuses.map((status) => (
            <div key={status.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/40 p-2.5">
              <span className="text-slate-300">{status.name}</span>
              <span className="font-mono text-[10px] font-bold text-emerald-400">🟢 {status.status}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowImpactModal(true)}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-950/30 transition hover:from-blue-500 hover:to-indigo-500"
        >
          🏆 Explain Business Impact
        </button>
      </div>

      {showImpactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400">Business Impact Analysis</h3>
              <button type="button" onClick={() => setShowImpactModal(false)} className="font-mono text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="mb-1 font-semibold text-rose-400">Traditional Settlement:</h4>
                <ul className="list-disc space-y-0.5 pl-5 text-slate-400">
                  <li>Funds released before quality validation</li>
                  <li>Higher dispute risk</li>
                  <li>Manual reviews & delays</li>
                  <li>Limited traceability</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-1 font-semibold text-emerald-400">Afferent Commerce:</h4>
                <ul className="list-disc space-y-0.5 pl-5 text-slate-300">
                  <li>Quality-driven settlement</li>
                  <li>AI-assisted decisions</li>
                  <li>Human governance</li>
                  <li>PayPal execution</li>
                  <li>Full auditability</li>
                </ul>
              </div>
              <div className="border-t border-white/10 pt-2">
                <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-400">Outcome:</h4>
                <p className="text-sm font-semibold text-white">Lower fraud · Fewer disputes · Higher trust</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowImpactModal(false)}
              className="mt-5 w-full rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-700"
            >
              Close Insight
            </button>
          </div>
        </div>
      )}
    </>
  );
};