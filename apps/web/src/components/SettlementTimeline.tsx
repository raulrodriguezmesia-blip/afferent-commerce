import React from 'react';

interface LogEntry {
  timestamp: string;
  event: string;
  details?: Record<string, unknown>;
}

export const SettlementTimeline: React.FC = () => {
  const [log, setLog] = React.useState<LogEntry[]>([]);

  const addEvent = (event: string, details?: Record<string, unknown>) => {
    setLog((prev) => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        event,
        details,
      },
    ]);
  };

  React.useEffect(() => {
    const intervals = [
      () => addEvent('Order Created', { orderId: 'ORD-12345' }),
      () => addEvent('Merchant Validated'),
      () => addEvent('Risk Assessed', { riskScore: 20 }),
      () => addEvent('Nemotron Evaluated', { recommendation: true }),
      () => addEvent('Recommendation Generated', { amount: 1450 }),
      () => addEvent('Human Approved'),
      () => addEvent('PayPal Batch Created', { batchId: 'batch_98765' }),
      () => addEvent('Payout Executed', { payoutId: 'payout_11223' }),
      () => addEvent('Settlement Closed'),
    ];

    let i = 0;
    const timer = setInterval(() => {
      if (i < intervals.length) {
        intervals[i]();
        i += 1;
      } else {
        clearInterval(timer);
      }
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Settlement Lifecycle</h4>
      <div className="relative space-y-3">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-indigo-500/40 via-white/10 to-transparent" />
        {log.map((entry, idx) => (
          <div key={`${entry.event}-${idx}`} className="relative flex gap-3 pl-1">
            <div className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-indigo-400/40 bg-slate-950 shadow-[0_0_12px_rgba(99,102,241,0.35)]" />
            <div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-xs font-semibold text-slate-100">{entry.event}</span>
                <span className="shrink-0 font-mono text-[10px] text-slate-500">{entry.timestamp.split('T')[1].slice(0, 8)}</span>
              </div>
              {entry.details && (
                <div className="mt-1 truncate font-mono text-[10px] text-slate-500">{JSON.stringify(entry.details)}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};