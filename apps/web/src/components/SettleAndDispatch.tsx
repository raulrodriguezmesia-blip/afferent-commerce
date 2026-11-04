import React, { useState } from 'react';

interface SettleAndDispatchProps {
  apiBase: string;
  objectLabel: string;
  telemetry: any;
}

export const SettleAndDispatch: React.FC<SettleAndDispatchProps> = ({ apiBase, objectLabel, telemetry }) => {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState(25.0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = async () => {
    if (!email.trim()) {
      setError('Please enter a recipient email');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/settle-and-dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object_label: objectLabel,
          telemetry: telemetry || {},
          recipient_email: email,
          amount: amount,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Settlement failed');
    } finally {
      setLoading(false);
    }
  };

  const panelStyle: React.CSSProperties = {
    background: 'rgba(15,23,42,0.62)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 20, backdropFilter: 'blur(10px)',
  };

  const actionColor = (action: string) => {
    if (action === 'RELEASE_PAYMENT') return '#10b981';
    if (action === 'HOLD_FOR_REVIEW') return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={panelStyle}>
      <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', marginBottom: 12 }}>
        Settle & Dispatch • Agentic Commerce
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Recipient Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="auditor@enterprise.com"
            style={{ width: '100%', background: 'rgba(15,15,23,0.9)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 16, padding: '6px 10px', color: '#f8fafc', fontSize: 12 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Amount (USD)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={0.01}
            step={0.01}
            style={{ width: '100%', background: 'rgba(15,15,23,0.9)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 16, padding: '6px 10px', color: '#f8fafc', fontSize: 12 }}
          />
        </div>
        <button
          onClick={execute}
          disabled={loading}
          style={{
            background: loading ? 'rgba(139,92,246,0.3)' : 'linear-gradient(90deg,#10b981,#059669)',
            border: 'none', borderRadius: 16, padding: '8px 16px', color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600,
          }}
        >
          {loading ? 'Processing...' : '🚀 Validate & Pay via PayPal'}
        </button>
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8 }}>{error}</div>}
      {result && (
        <div style={{ fontSize: 12, color: '#e2e8f0', background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>Order: <strong>{result.order_id}</strong></span>
            <span style={{ color: actionColor(result.payment_action), fontWeight: 700 }}>{result.status}</span>
          </div>
          <div>Quality Score: <strong style={{ color: result.quality_score >= 70 ? '#10b981' : result.quality_score >= 40 ? '#f59e0b' : '#ef4444' }}>{result.quality_score}/100</strong></div>
          <div>Action: <strong>{result.payment_action}</strong></div>
          <div>Amount: ${result.total_amount} {result.currency}</div>
          <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 11 }}>{result.nemotron_diagnosis}</div>
          <div style={{ marginTop: 8, fontSize: 11, color: result.email_dispatch?.status === 'simulated' ? '#f59e0b' : '#10b981' }}>
            📧 Email: {result.email_dispatch?.status} → {result.email_dispatch?.recipient}
          </div>
          {result.pdf_generated && (
            <div style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>📄 PDF report generated</div>
          )}
        </div>
      )}
    </div>
  );
};
