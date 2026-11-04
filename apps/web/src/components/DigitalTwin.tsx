import React, { useState } from 'react';
import type { TactilePrediction } from '../types/legacy';

interface DigitalTwinProps {
  apiBase: string;
  objectLabel: string;
}

interface DigitalTwinPrediction extends TactilePrediction {
  strategy?: string;
  predictedForce?: number;
  contactPoints?: Array<Record<string, unknown>>;
  confidence?: number;
  riskAssessment?: string;
}

export const DigitalTwin: React.FC<DigitalTwinProps> = ({ apiBase, objectLabel }) => {
  const [prediction, setPrediction] = useState<DigitalTwinPrediction | null>(null);
  const [loading, setLoading] = useState(false);

  const simulate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/plan-grasp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object_label: objectLabel }),
      });
      const plan = await res.json();
      setPrediction({
        strategy: (plan as Record<string, unknown>).strategy as string,
        predictedForce: (plan as Record<string, unknown>).predicted_force_n as number,
        contactPoints: (plan as Record<string, unknown>).contact_points as Array<Record<string, unknown>>,
        confidence: (plan as Record<string, unknown>).confidence as number,
        predictedDeformation: ((plan as Record<string, unknown>).contact_points as Array<Record<string, unknown>>).map((cp: Record<string, unknown>) => ({
          digit: cp.digit,
          pressure: cp.predicted_pressure_kpa,
          displacement: ((Number(cp.predicted_pressure_kpa) || 0) / 100).toFixed(3),
        })),
        riskAssessment: ((plan as Record<string, unknown>).predicted_force_n as number) > 2.0 ? 'HIGH' : ((plan as Record<string, unknown>).predicted_force_n as number) > 1.0 ? 'MODERATE' : 'LOW',
      });
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const panelStyle: React.CSSProperties = {
    background: 'rgba(15,23,42,0.62)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 20, backdropFilter: 'blur(10px)',
  };

  const riskColor = (r: string) => r === 'HIGH' ? '#ef4444' : r === 'MODERATE' ? '#f59e0b' : '#10b981';

  return (
    <div style={panelStyle}>
      <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', marginBottom: 12 }}>
        Digital Twin • Pre-Contact Simulation
      </h3>
      <button
        onClick={simulate}
        disabled={loading}
        style={{
          background: loading ? 'rgba(139,92,246,0.3)' : 'linear-gradient(90deg,#8b5cf6,#a855f7)',
          border: 'none', borderRadius: 16, padding: '6px 14px', color: '#fff',
          cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, marginBottom: 12, width: '100%',
        }}
      >
        {loading ? 'Simulating...' : 'Run Pre-Contact Simulation'}
      </button>
      {prediction && (
        <div style={{ fontSize: 12, color: '#e2e8f0', background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 10 }}>
          <div style={{ color: '#c4b5fd', fontWeight: 600, marginBottom: 6 }}>Prediction Complete</div>
          <div>Strategy: <strong>{prediction.strategy}</strong></div>
          <div>Predicted Force: <strong>{prediction.predictedForce} N</strong></div>
          <div>Confidence: {((prediction.confidence ?? 0) * 100).toFixed(1)}%</div>
          <div>Risk: <strong style={{ color: riskColor(prediction.riskAssessment || 'LOW') }}>{prediction.riskAssessment}</strong></div>
          <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 11 }}>Predicted Deformation:</div>
          {prediction.predictedDeformation?.map((d: Record<string, unknown>, i: number) => (
            <div key={i} style={{ fontSize: 11, color: '#94a3b8' }}>
              {String(d.digit)}: pressure={String(d.pressure)} kPa, displacement={String(d.displacement)} mm
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 11, color: '#10b981' }}>
            Simulation ready. Actual contact will be compared against prediction.
          </div>
        </div>
      )}
      {!prediction && !loading && (
        <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 10 }}>
          Run simulation to predict contact deformation before physical interaction.
        </div>
      )}
    </div>
  );
};
