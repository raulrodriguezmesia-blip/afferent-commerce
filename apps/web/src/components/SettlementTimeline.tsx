import React from 'react';

interface LogEntry {
  timestamp: string;
  event: string;
  details?: Record<string, unknown>;
}

const timelineEvents = [
  { event: 'Order Created', details: { orderId: 'ORD-12345' } },
  { event: 'Quality Evidence Received', details: { qualityScore: 94 } },
  { event: 'Risk Analysis Completed', details: { riskScore: 12 } },
  { event: 'AI Recommendation Generated', details: { amount: 1450, confidence: 96 } },
  { event: 'Human Approval Granted', details: { actor: 'Auditor' } },
  { event: 'PayPal Settlement Executed', details: { transactionId: 'TXN-12345' } },
  { event: 'Audit Record Stored', details: { auditId: 'AUD-12345' } },
];

export const SettlementTimeline: React.FC = () => {
  const [log, setLog] = React.useState<LogEntry[]>([]);

  React.useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < timelineEvents.length) {
        const event = timelineEvents[i];
        setLog((prev) => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            event: event.event,
            details: event.details,
          },
        ]);
        i += 1;
      } else {
        clearInterval(timer);
      }
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Settlement Timeline</h4>
      <div className="relative space-y-3">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-indigo-500/40 via-white/10 to-transparent" />
        {log.map((entry, idx) => (
          <div key={`${entry.event}-${idx}`} className="relative flex gap-3 pl-1">
            <div className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-emerald-400/40 bg-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.35)]" />
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