import React from 'react';

interface AgentStatusPanelProps {
  statuses?: Array<{ name: string; status: string }>;
}

export const AgentStatusPanel: React.FC<AgentStatusPanelProps> = ({
  statuses = [
    { name: 'Quality Agent', status: 'ONLINE' },
    { name: 'Risk Agent', status: 'ONLINE' },
    { name: 'Settlement Agent', status: 'ONLINE' },
    { name: 'Audit Agent', status: 'ONLINE' },
  ],
}) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-white">
      <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Agent Status</h4>
      <div className="space-y-2 text-xs">
        {statuses.map((agent) => (
          <div key={agent.name} className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-950/40 px-3 py-2">
            <span className="text-slate-300">{agent.name}</span>
            <span className="font-mono text-[10px] font-bold text-emerald-400">🟢 {agent.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};