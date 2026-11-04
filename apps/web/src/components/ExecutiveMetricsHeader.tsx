import React from 'react';

interface ExecutiveMetricsHeaderProps {
  aiDecisions?: number;
  successRate?: number;
  riskPrevented?: number;
  paypalExecutions?: number;
  auditCoverage?: number;
}

export const ExecutiveMetricsHeader: React.FC<ExecutiveMetricsHeaderProps> = ({
  aiDecisions = 156,
  successRate = 99.2,
  riskPrevented = 142500,
  paypalExecutions = 156,
  auditCoverage = 100,
}) => {
  const metrics = [
    { label: 'AI Decisions', value: aiDecisions.toLocaleString() },
    { label: 'Success Rate', value: `${successRate}%` },
    { label: 'Risk Prevented', value: `$${riskPrevented.toLocaleString()}` },
    { label: 'PayPal Executions', value: paypalExecutions.toLocaleString() },
    { label: 'Audit Coverage', value: `${auditCoverage}%` },
  ];

  return (
    <div className="panel">
      <h4 className="panel-title">Executive Metrics</h4>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-center">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">{metric.label}</div>
            <div className="mt-1 font-mono text-sm font-bold text-emerald-400">{metric.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};