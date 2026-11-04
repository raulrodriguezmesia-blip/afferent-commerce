import React, { useState } from 'react';

interface PaymentReleaseProps {
  apiBase: string;
  objectLabel: string;
  telemetry: any;
  onPaymentReleased?: (result: any) => void;
}

export const PaymentRelease: React.FC<PaymentReleaseProps> = ({ apiBase, objectLabel, telemetry, onPaymentReleased }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const assessQuality = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/quality-assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object_label: objectLabel, telemetry }),
      });
      const data = await res.json();
      setResult(data);
      if (onPaymentReleased) onPaymentReleased(data);
    } catch (e: any) {
      setError(e.message || 'Quality assessment failed');
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
        Payment Release • Agentic Commerce
      </h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Object: {objectLabel}</span>
        <button
          onClick={assessQuality}
          disabled={loading}
          style={{
            background: loading ? 'rgba(139,92,246,0.3)' : 'linear-gradient(90deg,#8b5cf6,#a855f7)',
            border: 'none', borderRadius: 16, padding: '6px 14px', color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, marginLeft: 'auto',
          }}
        >
          {loading ? 'Assessing...' : '🤖 AI Quality Assess'}
        </button>
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8 }}>{error}</div>}
      {result && (
        <div style={{ fontSize: 12, color: '#e2e8f0', background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>Quality Score: <strong style={{ color: result.quality_score >= 70 ? '#10b981' : result.quality_score >= 40 ? '#f59e0b' : '#ef4444' }}>{result.quality_score}/100</strong></span>
            <span style={{ color: actionColor(result.payment_action), fontWeight: 700, fontSize: 12 }}>
              {result.payment_action}
            </span>
          </div>
          <div>Confidence: {(result.confidence * 100).toFixed(1)}%</div>
          <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 11 }}>{result.nemotron_diagnosis}</div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8' }}>
            Telemetry: uncertainty={result.telemetry_summary.uncertainty}, gating={result.telemetry_summary.gating},
            force_margin={result.telemetry_summary.force_margin}%, latency={result.telemetry_summary.edge_latency}ms
          </div>
        </div>
      )}
      {!result && !loading && (
        <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 10 }}>
          Run AI quality assessment to determine payment release.
        </div>
      )}
    </div>
  );
};
