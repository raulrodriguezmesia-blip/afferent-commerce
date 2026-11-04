import React from 'react';

interface TransactionInfo {
  orderId: string;
  transactionId: string;
  payoutId: string;
  status: string;
}

export const TransactionCenter: React.FC<{ data: TransactionInfo }> = ({ data }) => {
  const rows = [
    { label: 'Order ID', value: data.orderId },
    { label: 'Transaction ID', value: data.transactionId },
    { label: 'Payout ID', value: data.payoutId },
    { label: 'Status', value: data.status },
  ];

  return (
    <div className="panel">
      <h4 className="panel-title">PayPal Transaction Center</h4>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
            <span className="text-xs text-slate-500">{row.label}</span>
            <span className="font-mono text-xs font-semibold text-slate-100 break-all">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};