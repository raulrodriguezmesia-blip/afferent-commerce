import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { predictTactile } from './lib/api';
import { useTactileStream, type TactileStreamFrame } from './lib/websocket';
import { type AfferentResponse, type TactileCell, type NeuromorphicReflex, type MultiDigitTopology, type AcousticFrictionProfile } from './types/afferent';
import TactileHeatmap from './components/TactileHeatmap';
import TactileCoTPanel from './components/TactileCoTPanel';
import SafetyShield from './components/SafetyShield';
import ForceBudget from './components/ForceBudget';
import TactoEval from './components/TactoEval';
import MaterialInspector from './components/MaterialInspector';
import ClosedLoopControl from './components/ClosedLoopControl';
import MultiDigitSelector, { DIGIT_MAP } from './components/MultiDigitSelector';
import { ToastProvider, useToast } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PaymentRelease } from './components/PaymentRelease';
import { TransactionHistory } from './components/TransactionHistory';
import './styles/index.css';

const Tactile3DViewer = lazy(() => import('./components/Tactile3DViewer'));
const AcousticSpectrogram = lazy(() => import('./components/AcousticSpectrogram').then(m => ({ default: m.default })));
const NeuromorphicReflexHUD = lazy(() => import('./components/NeuromorphicReflexHUD').then(m => ({ default: m.default })));
const AfferentChatDrawer = lazy(() => import('./components/AfferentChatDrawer').then(m => ({ default: m.AfferentChatDrawer })));
const CustomDropdown = lazy(() => import('./components/CustomDropdown').then(m => ({ default: m.CustomDropdown })));
const SessionReplay = lazy(() => import('./components/SessionReplay').then(m => ({ default: m.SessionReplay })));
const MaterialCalibration = lazy(() => import('./components/MaterialCalibration').then(m => ({ default: m.MaterialCalibration })));
const ComplianceReport = lazy(() => import('./components/ComplianceReport').then(m => ({ default: m.ComplianceReport })));
const GraspPlanViewer = lazy(() => import('./components/GraspPlanViewer').then(m => ({ default: m.GraspPlanViewer })));
const AnomalyAlert = lazy(() => import('./components/AnomalyAlert').then(m => ({ default: m.AnomalyAlert })));
const LiveCharts = lazy(() => import('./components/LiveCharts').then(m => ({ default: m.LiveCharts })));
const DigitalTwin = lazy(() => import('./components/DigitalTwin').then(m => ({ default: m.DigitalTwin })));
const PresentationMode = lazy(() => import('./components/PresentationMode').then(m => ({ default: m.PresentationMode })));
const KeyboardShortcuts = lazy(() => import('./components/KeyboardShortcuts').then(m => ({ default: m.KeyboardShortcuts })));
const ShortcutHelp = lazy(() => import('./components/KeyboardShortcuts').then(m => ({ default: m.ShortcutHelp })));
const PerformanceMonitor = lazy(() => import('./components/PerformanceMonitor').then(m => ({ default: m.PerformanceMonitor })));
const SpaceMode = lazy(() => import('./components/SpaceMode').then(m => ({ default: m.SpaceMode })));
const SettingsPanel = lazy(() => import('./components/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const NvidiaModelStatus = lazy(() => import('./components/NvidiaModelStatus').then(m => ({ default: m.NvidiaModelStatus })));

function stressToCells(frame: TactileStreamFrame): TactileCell[] {
  const stress = frame.stress_distribution_kpa;
  const [w, h] = frame.grid_resolution;
  const flat = stress.flat();
  const max = flat.length ? Math.max(...flat) : 1;
  const cells: TactileCell[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = stress[y]?.[x] ?? 0;
      if (v <= 0.01) continue;
      const t = v / max;
      const risk: TactileCell['risk_level'] = t > 0.66 ? 'DANGER' : t > 0.33 ? 'CAUTION' : 'SAFE';
      cells.push({ x, y, max_pressure_kPa: Number(v.toFixed(2)), rigidity_score: Number((1 - t * 0.5).toFixed(2)), risk_level: risk });
    }
  }
  return cells;
}

function AppContent() {
  const toast = useToast();
  const [objectLabel, setObjectLabel] = useState('Thin-Walled Glassware (Wine Stemware)');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AfferentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  const [streaming, setStreaming] = useState(false);
  const [uThreshold, setUThreshold] = useState(0.25);
  const [fMax, setFMax] = useState(1.8);
  const [selectedDigit, setSelectedDigit] = useState('full');
  const [streamFrames, setStreamFrames] = useState<any[]>([]);
  const [apiBase, setApiBase] = useState('http://127.0.0.1:8000');
  const [presentationMode, setPresentationMode] = useState(false);
  const [shortcutHelp, setShortcutHelp] = useState(false);
  const [spaceMode, setSpaceMode] = useState(false);
  const [autoDemo, setAutoDemo] = useState(false);
  const [activeTab, setActiveTab] = useState<'commerce' | 'audit'>('commerce');

  const { frame, connected, sendControls } = useTactileStream('ws://localhost:8000/ws/v1/tactile-stream');

  const activeFrame = streaming ? frame : null;

  useEffect(() => {
    if (streaming) {
      sendControls({ u_threshold: uThreshold, f_max: fMax, object_label: objectLabel, active_digits: DIGIT_MAP[selectedDigit] || ['thumb', 'index', 'middle'], space_mode: spaceMode });
    }
  }, [uThreshold, fMax, objectLabel, streaming, selectedDigit, spaceMode, sendControls]);

  useEffect(() => {
    if (activeFrame) {
      setStreamFrames((prev) => {
        const next = [...prev, activeFrame];
        if (next.length > 200) return next.slice(-200);
        return next;
      });
    }
  }, [activeFrame]);
  const runInference = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictTactile(objectLabel, 'dummy');
      setData(res);
      toast.addToast(`Inference complete: ${objectLabel} analyzed`, 'success');
    } catch (e: any) {
      setError(e.message);
      toast.addToast(`Inference failed: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };


  const heatmapCells = useMemo(() => {
    if (activeFrame) return stressToCells(activeFrame);
    return data?.tactile_spatial_heatmap.cells || [];
  }, [activeFrame, data]);

  const gridSize: [number, number] = activeFrame
    ? activeFrame.grid_resolution
    : data?.tactile_spatial_heatmap.grid_resolution || [32, 32];

  const deformationField = activeFrame ? activeFrame.deformation_field_mm : (data?.material_profile?.deformation_field_mm || null);
  const stressField = activeFrame ? activeFrame.stress_distribution_kpa : (data?.material_profile?.stress_distribution_kpa || null);

  const cotData = data ? data.tactile_reasoning_cot : null;
  const streamCot = activeFrame ? {
    target_class: objectLabel,
    tactile_chain_of_thought: [
      `Phase: ${activeFrame.phase}`,
      `Uncertainty ${(activeFrame.uncertainty_score * 100).toFixed(1)}% vs threshold ${(activeFrame.u_threshold * 100).toFixed(0)}%`,
      `Applied force ${activeFrame.applied_force_n.toFixed(2)} N / cap ${activeFrame.f_max_n.toFixed(2)} N`,
      `Shear limit ${activeFrame.shear_limit_n.toFixed(2)} N • ${activeFrame.material_class}`,
      activeFrame.gating_decision === 'TACTILE_EXPLORATION_REQUIRED'
        ? 'Micro-contact exploratory probe active (~0.2 N) to calibrate local stiffness.'
        : activeFrame.gating_decision === 'GRASP_DENIED'
        ? 'EMERGENCY ABORT: force/shear limit exceeded.'
        : 'Conservative grasp authorized with safety margin.',
    ],
    uncertainty_score: activeFrame.uncertainty_score,
    gating_decision: activeFrame.gating_decision as any,
  } : null;

  const displayCot = streamCot || cotData;

  const activeDigits = DIGIT_MAP[selectedDigit] || ['thumb', 'index', 'middle'];

  const neuromorphic: NeuromorphicReflex | null = activeFrame?.neuromorphic_reflex || data?.neuromorphic_reflex || null;
  const multiDigit: MultiDigitTopology | null = activeFrame?.multi_digit_topology || data?.multi_digit_topology || null;
  const acoustic: AcousticFrictionProfile | null = activeFrame?.acoustic_friction_profile || data?.acoustic_friction_profile || null;

  const materialProfile = data?.material_profile || (activeFrame ? {
    elastic_modulus_gpa: 0,
    static_friction_coeff: 0,
    shear_limit_n: activeFrame.shear_limit_n,
    material_class: activeFrame.material_class,
    slip_threshold_n: 0,
    safety_margin_percent: 0,
    stress_distribution_kpa: activeFrame.stress_distribution_kpa,
    deformation_field_mm: activeFrame.deformation_field_mm,
  } : null);

  const physical = data?.physical_matrix;

  const shortcuts = [
    { key: ' ', action: () => setStreaming((p) => !p), description: 'Toggle live stream' },
    { key: '1', action: () => setSelectedDigit('thumb'), description: 'Select Thumb' },
    { key: '2', action: () => setSelectedDigit('index'), description: 'Select Index' },
    { key: '3', action: () => setSelectedDigit('middle'), description: 'Select Middle' },
    { key: '4', action: () => setSelectedDigit('full'), description: 'Select Full Hand' },
    { key: 'r', action: () => runInference(), description: 'Run inference' },
    { key: 'p', action: () => setPresentationMode(true), description: 'Presentation mode' },
    { key: '?', shift: true, action: () => setShortcutHelp(true), description: 'Show shortcuts' },
    { key: 'Escape', action: () => { setPresentationMode(false); setShortcutHelp(false); }, description: 'Close modals' },
  ];

  const presentationSteps = [
    { title: 'Welcome to Afferent Commerce', description: 'Agentic Commerce for Quality Control — tactile sensing + AI quality assessment + PayPal payment release.' },
    { title: 'Tactile Inspection', description: 'Run inference to inspect product quality using 32×32 spatial contact grid and material physics.' },
    { title: 'Live Telemetry Stream', description: 'Start live stream to see real-time 3D gel deformation, neuromorphic reflex, and acoustic spectrogram.' },
    { title: 'AI Quality Assessment', description: 'NVIDIA Nemotron evaluates quality and recommends payment action (RELEASE/HOLD/REJECT).' },
    { title: 'Payment Release', description: 'Autonomous payment release via PayPal Orders API v2 based on quality score.' },
    { title: 'Transaction History', description: 'Track all orders with status badges and export compliance reports.' },
  ];

  useEffect(() => {
    if (autoDemo) {
      const sequence = async () => {
        setViewMode('3d');
        await new Promise((r) => setTimeout(r, 1000));
        runInference();
        await new Promise((r) => setTimeout(r, 3000));
        setStreaming(true);
        await new Promise((r) => setTimeout(r, 5000));
        setSelectedDigit('full');
        await new Promise((r) => setTimeout(r, 2000));
        setStreaming(false);
        setAutoDemo(false);
      };
      sequence();
    }
  }, [autoDemo]);

  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#9ca3af', fontSize: 14 }}>Loading Afferent Commerce...</div>}>
      <div className="app">
        <KeyboardShortcuts shortcuts={shortcuts} />
        <ShortcutHelp shortcuts={shortcuts} visible={shortcutHelp} onClose={() => setShortcutHelp(false)} />
        <PresentationMode active={presentationMode} onToggle={() => setPresentationMode(false)} steps={presentationSteps} />
        <header>
          <div className="logo">
            <div className="logo-dot" />
            <div>
              <h1>Afferent Commerce</h1>
              <p className="tagline">Agentic Commerce for Quality Control — Tactile sensing + AI quality assessment + PayPal payment release</p>
            </div>
          </div>
          <div className="controls">
            <CustomDropdown
              options={['Igneous Rock', 'Tempered Glass', 'Biological Tissue', 'Wine Glass', 'Egg', 'Strawberry']}
              selected={objectLabel}
              onSelect={(opt) => setObjectLabel(opt)}
            />
            <input value={objectLabel} onChange={(e) => setObjectLabel(e.target.value)} placeholder="Or type a custom object label" />
            <button onClick={runInference} disabled={loading}>{loading ? 'Inferencing...' : 'Run Afferent Inference'}</button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 24px', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setActiveTab('commerce')}
            style={{
              background: activeTab === 'commerce' ? 'linear-gradient(90deg,#8b5cf6,#a855f7)' : 'transparent',
              border: '1px solid var(--border)', borderRadius: 8, padding: '8px 20px',
              color: activeTab === 'commerce' ? '#fff' : 'var(--sub)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            🛒 Agentic Commerce
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            style={{
              background: activeTab === 'audit' ? 'linear-gradient(90deg,#8b5cf6,#a855f7)' : 'transparent',
              border: '1px solid var(--border)', borderRadius: 8, padding: '8px 20px',
              color: activeTab === 'audit' ? '#fff' : 'var(--sub)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            📋 Transaction Ledger & Audit
          </button>
        </div>

        {activeTab === 'commerce' && (
          <main>
            <div className="column">
              {displayCot && <TactileCoTPanel cot={displayCot} />}
              {displayCot && <SafetyShield gating={displayCot.gating_decision} uncertainty={displayCot.uncertainty_score} forceBudget={data?.force_budget} />}
              <ClosedLoopControl
                viewMode={viewMode}
                setViewMode={setViewMode}
                streaming={streaming}
                setStreaming={setStreaming}
                connected={connected}
                uThreshold={uThreshold}
                setUThreshold={setUThreshold}
                fMax={fMax}
                setFMax={setFMax}
                onParamsChange={(u, f) => sendControls({ u_threshold: u, f_max: f })}
              />
              <NeuromorphicReflexHUD reflex={neuromorphic} />
              <NvidiaModelStatus apiBase={apiBase} />
              <LiveCharts streamFrames={streamFrames} />
              <PerformanceMonitor streamFrames={streamFrames} />
              <SpaceMode active={spaceMode} onToggle={() => setSpaceMode(!spaceMode)} objectLabel={objectLabel} />
              <SettingsPanel apiBase={apiBase} onApiBaseChange={setApiBase} />
              <button
                onClick={() => setPresentationMode(true)}
                style={{ background: 'linear-gradient(90deg,#8b5cf6,#a855f7)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: 11, width: '100%' }}
              >
                Presentation Mode
              </button>
              <button
                onClick={() => setAutoDemo(true)}
                disabled={autoDemo}
                style={{ background: autoDemo ? 'rgba(139,92,246,0.3)' : 'linear-gradient(90deg,#10b981,#059669)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', cursor: autoDemo ? 'not-allowed' : 'pointer', fontSize: 11, width: '100%' }}
              >
                {autoDemo ? 'Running Auto-Demo...' : 'Auto-Demo (for recording)'}
              </button>
              <button
                onClick={() => setShortcutHelp(true)}
                style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, padding: '8px 16px', color: '#c4b5fd', cursor: 'pointer', fontSize: 11, width: '100%' }}
              >
                Keyboard Shortcuts (?)
              </button>
            </div>
            <div className="column" style={{ alignItems: 'center', gap: 24 }}>
              <MultiDigitSelector selected={selectedDigit} onSelect={setSelectedDigit} topology={multiDigit} />
              {viewMode === '2d' ? (
                <TactileHeatmap cells={heatmapCells} gridSize={gridSize} />
              ) : (
                <ErrorBoundary name="3D Viewer">
                  <Tactile3DViewer deformationField={deformationField} stressField={stressField} gridSize={gridSize} activeDigits={activeDigits} />
                </ErrorBoundary>
              )}
              {data && <TactoEval telemetry={data.benchmark_telemetry} />}
              {activeFrame && (
                <div className="panel">
                  <h3>Live Telemetry</h3>
                  <div className="row"><span>Phase</span><strong>{activeFrame.phase}</strong></div>
                  <div className="row"><span>t</span><strong>{activeFrame.t_ms.toFixed(0)} ms</strong></div>
                  <div className="row"><span>Force</span><strong>{activeFrame.applied_force_n.toFixed(2)} N</strong></div>
                  <div className="row"><span>Gating</span><span className="badge">{activeFrame.gating_decision}</span></div>
                </div>
              )}
              <AcousticSpectrogram profile={acoustic} />
              <PaymentRelease apiBase={apiBase} objectLabel={objectLabel} telemetry={{ force_budget: data?.force_budget, neuromorphic_reflex: neuromorphic, tactile_reasoning_cot: data?.tactile_reasoning_cot, tactile_spatial_heatmap: data?.tactile_spatial_heatmap }} />
            </div>
            <div className="column">
              {data && <ForceBudget forceBudget={data.force_budget} physical={data.physical_matrix} />}
              {(data || activeFrame) && <MaterialInspector materialProfile={materialProfile} physical={physical} />}
              {data && (
                <div className="panel">
                  <h3>Model Stack</h3>
                  <div className="cot-list">
                    {data.metadata.model_stack.map((m, i) => <div key={i} className="cot-item"><span className="dot" />{m}</div>)}
                  </div>
                  <div className="status-bar" style={{ marginTop: 16 }}>Schema Validated • 32x32 Spatial Grid • Sim2Real Safety Shield • Omni-Tier Telemetry • Agentic Commerce</div>
                </div>
              )}
              <MaterialCalibration apiBase={apiBase} objectLabel={objectLabel} />
              <GraspPlanViewer apiBase={apiBase} objectLabel={objectLabel} />
              <DigitalTwin apiBase={apiBase} objectLabel={objectLabel} />
              <AnomalyAlert apiBase={apiBase} context={{ streamFrames }} />
              <ComplianceReport apiBase={apiBase} context={{ force_budget: data?.force_budget, neuromorphicReflex: neuromorphic, tactile_reasoning_cot: data?.tactile_reasoning_cot, benchmark_telemetry: data?.benchmark_telemetry, materialProfile: materialProfile, acousticFrictionProfile: acoustic, multiDigitTopology: multiDigit, objectLabel }} />
              <SessionReplay apiBase={apiBase} />
              <TransactionHistory apiBase={apiBase} />
            </div>
          </main>
        )}

        {activeTab === 'audit' && (
          <main>
            <div className="column">
              <TransactionHistory apiBase={apiBase} />
              <SessionReplay apiBase={apiBase} />
              <MaterialCalibration apiBase={apiBase} objectLabel={objectLabel} />
            </div>
            <div className="column" style={{ alignItems: 'center', gap: 24 }}>
              <ComplianceReport apiBase={apiBase} context={{ force_budget: data?.force_budget, neuromorphicReflex: neuromorphic, tactile_reasoning_cot: data?.tactile_reasoning_cot, benchmark_telemetry: data?.benchmark_telemetry, materialProfile: materialProfile, acousticFrictionProfile: acoustic, multiDigitTopology: multiDigit, objectLabel }} />
              <GraspPlanViewer apiBase={apiBase} objectLabel={objectLabel} />
              <DigitalTwin apiBase={apiBase} objectLabel={objectLabel} />
            </div>
            <div className="column">
              <AnomalyAlert apiBase={apiBase} context={{ streamFrames }} />
              <MaterialInspector materialProfile={materialProfile} physical={physical} />
              {data && (
                <div className="panel">
                  <h3>Model Stack</h3>
                  <div className="cot-list">
                    {data.metadata.model_stack.map((m, i) => <div key={i} className="cot-item"><span className="dot" />{m}</div>)}
                  </div>
                  <div className="status-bar" style={{ marginTop: 16 }}>Schema Validated • 32x32 Spatial Grid • Sim2Real Safety Shield • Omni-Tier Telemetry • Agentic Commerce</div>
                </div>
              )}
            </div>
          </main>
        )}

        {error && <div style={{ textAlign: 'center', color: 'var(--danger)', marginBottom: 24 }}>{error}</div>}
        <AfferentChatDrawer
          currentContext={{
            materialProfile,
            neuromorphicReflex: neuromorphic,
            multiDigitTopology: multiDigit,
            acousticFrictionProfile: acoustic,
          }}
        />
      </div>
    </Suspense>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
