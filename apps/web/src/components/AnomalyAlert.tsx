import React, { useState, useEffect } from 'react';
import type { AnomalyResult } from '../types/legacy';

interface AnomalyAlertProps {
  apiBase: string;
  context?: Record<string, unknown>;
}

export const AnomalyAlert: React.FC<AnomalyAlertProps> = ({ apiBase, context }) => {
  const [result, setResult] = useState<AnomalyResult | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    setLoading(true);
    try {
      const frames = context?.streamFrames || [];
      const res = await fetch(`${apiBase}/api/v1/anomaly-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames }),
      });
      setResult(await res.json() as AnomalyResult);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(check, 10000);
    check();
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const riskColor = (r: string) => r === 'high' ? '#ef4444' : r === 'medium' ? '#f59e0b' : '#10b981';

  const panelStyle: React.CSSProperties = {
    background: 'rgba(15,23,42,0.62)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 20, backdropFilter: 'blur(10px)',
  };

  return (
    <div style={panelStyle}>
      <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', marginBottom: 12 }}>
        Anomaly Detection • Predictive Maintenance
      </h3>
      <button
        onClick={check}
        disabled={loading}
        style={{
          background: loading ? 'rgba(139,92,246,0.3)' : 'linear-gradient(90deg,#8b5cf6,#a855f7)',
          border: 'none', borderRadius: 16, padding: '6px 14px', color: '#fff',
          cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, marginBottom: 12,
        }}
      >
        {loading ? 'Checking...' : 'Run Anomaly Check'}
      </button>
      {result && (
        <div>
          <div style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: 999, marginBottom: 8,
            background: `${riskColor(String(result.risk_level ?? 'low'))}20`, color: riskColor(String(result.risk_level ?? 'low')),
            fontWeight: 600, fontSize: 12, border: `1px solid ${riskColor(String(result.risk_level ?? 'low'))}40`,
          }}>
            Risk: {String(result.risk_level ?? '').toUpperCase()} • {Number(result.anomaly_count ?? 0)} anomalies
          </div>
          <div style={{ fontSize: 12, color: '#e2e8f0', marginBottom: 8 }}>{String(result.summary ?? 'No summary available')}</div>
          {(result.anomalies ?? []).map((a: Record<string, unknown>, i: number) => (
            <div key={i} style={{ fontSize: 11, color: '#94a3b8', padding: '4px 0', borderBottom: '1px solid rgba(36,36,47,0.5)' }}>
              [{String(a.severity ?? '').toUpperCase()}] {String(a.type ?? '')} {a.value !== undefined ? `— ${a.value}` : ''}
            </div>
          ))}
          {(result.anomalies ?? []).length === 0 && (
            <div style={{ fontSize: 11, color: '#10b981' }}>All systems nominal. No degradation detected.</div>
          )}
        </div>
      )}
    </div>
  );
};
