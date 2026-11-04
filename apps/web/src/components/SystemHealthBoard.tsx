import React from 'react';

export const SystemHealthBoard: React.FC = () => {
  const services = [
    { name: 'Orders API', status: 'ONLINE' },
    { name: 'Risk Engine', status: 'ONLINE' },
    { name: 'Nemotron', status: 'ONLINE' },
    { name: 'PayPal API', status: 'ONLINE' },
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">System Health</h4>
      <div className="grid grid-cols-1 gap-2">
        {services.map((service) => (
          <div key={service.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2">
            <span className="text-xs text-slate-400">{service.name}</span>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[10px] font-bold text-emerald-400">{service.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};