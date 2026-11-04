import React from 'react';

export const AgentObservabilityCenter: React.FC = () => {
  const services = [
    { name: 'Orders API', status: 'healthy' },
    { name: 'Risk Engine', status: 'healthy' },
    { name: 'Recommendation Service', status: 'healthy' },
    { name: 'Nemotron', status: 'healthy' },
    { name: 'PayPal', status: 'healthy' },
    { name: 'Audit Service', status: 'healthy' },
  ];

  const statusColor: Record<string, string> = {
    healthy: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-rose-400',
  };

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Observability</h4>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Agent Status', value: 'ONLINE', color: 'text-emerald-400' },
          { label: 'Pipeline', value: 'ACTIVE', color: 'text-emerald-400' },
          { label: 'AI Model', value: 'NEMOTRON', color: 'text-indigo-400' },
          { label: 'Environment', value: 'SANDBOX', color: 'text-blue-400' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <div className="text-[10px] text-slate-500">{item.label}</div>
            <div className={`mt-1 text-xs font-bold ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">Health Score</span>
          <span className="font-mono text-xs font-semibold text-emerald-400">99.2%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-[99.2%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {services.map((service) => (
          <div key={service.name} className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-950/30 px-3 py-2">
            <span className="text-xs text-slate-400">{service.name}</span>
            <span className={`text-[10px] font-mono font-bold ${statusColor[service.status]}`}>{service.status.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};