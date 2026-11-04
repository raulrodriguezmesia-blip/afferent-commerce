import React, { useState, useEffect } from 'react';

interface TransactionHistoryProps {
  apiBase: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ apiBase }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/orders`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const panelStyle: React.CSSProperties = {
    background: 'rgba(15,23,42,0.62)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 20, backdropFilter: 'blur(10px)',
  };

  const statusColor = (s: string) => {
    if (s === 'COMPLETED') return '#10b981';
    if (s === 'HELD') return '#f59e0b';
    if (s === 'CREATED') return '#8b5cf6';
    return '#9ca3af';
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', margin: 0 }}>
          Transaction History • Agentic Commerce
        </h3>
        <button
          onClick={fetchOrders}
          disabled={loading}
          style={{
            background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 16, padding: '4px 10px', color: '#c4b5fd', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 11,
          }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      {orders.length === 0 && (
        <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 12 }}>
          No transactions yet. Run a quality assessment to create an order.
        </div>
      )}
      {orders.map((o: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(36,36,47,0.5)', fontSize: 12 }}>
          <div>
            <div style={{ color: '#f8fafc', fontWeight: 600 }}>{o.order_id}</div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>{o.amount} {o.currency} • {o.items?.[0]?.object_label || 'N/A'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 9,
              background: `${statusColor(o.status)}20`, color: statusColor(o.status),
              border: `1px solid ${statusColor(o.status)}40`, fontWeight: 600,
            }}>
              {o.status}
            </span>
            {o.payment_released && (
              <div style={{ fontSize: 9, color: '#10b981', marginTop: 2 }}>✓ Released</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
