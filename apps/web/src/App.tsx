import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, Send, FileText, TrendingUp, Cpu,
  CheckCircle2, AlertTriangle, XCircle, BarChart2,
  Box, Layers, Bell, User, Activity, DollarSign, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';
const WS_URL = 'ws://localhost:8000/ws/finops-assistant';

interface FraudFlags {
  risk_level: 'low' | 'medium' | 'high';
  risk_score: number;
  flags: string[];
}

interface QualityResult {
  quality_score: number;
  payment_action: 'RELEASED' | 'HELD' | 'REJECTED';
  nemotron_diagnosis: string;
  split_payment: { platform_fee: number; merchant_settlement: number; total_amount: number };
  fraud_flags: FraudFlags;
}

interface Order {
  order_id: string;
  status: string;
  amount: number;
  currency: string;
  quality_assessment: any;
  payment_released: boolean;
  created_at: string;
}

interface Message { role: 'user' | 'assistant'; content: string; }

type TabId = 'wizard' | 'analytics' | 'forensic';

const TABS: { id: TabId; label: string; Icon: React.FC<{ size?: number }>; description: string }[] = [
  { id: 'wizard', label: 'Settle Wizard', Icon: Layers, description: 'Guided PayPal payout flow' },
  { id: 'analytics', label: 'FinOps Analytics', Icon: BarChart2, description: 'Revenue & risk metrics' },
  { id: 'forensic', label: 'Forensic Ledger', Icon: Box, description: 'Transaction traceability' },
];

function KPICard({ title, value, subtitle, icon: Icon, color }: { title: string; value: string; subtitle: string; icon: any; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 shadow-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${color}`}>
          <Icon size={20} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{subtitle}</span>
      </div>
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-100 font-mono">{value}</h3>
    </motion.div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    low: 'bg-emerald-900/50 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-900/50 text-amber-400 border-amber-500/30',
    high: 'bg-rose-900/50 text-rose-400 border-rose-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold capitalize ${styles[level]}`}>
      {level}
    </span>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('wizard');
  const [auditorEmail, setAuditorEmail] = useState('auditor@enterprise.com');
  const [amountUSD, setAmountUSD] = useState('1500.00');
  const [chatMessage, setChatMessage] = useState('');
  const [chatLogs, setChatLogs] = useState<Message[]>([
    { role: 'assistant', content: 'Afferent FinOps Agent inicializado. Conectado a PayPal Orders API v2 y NVIDIA Nemotron.' }
  ]);
  const [isConnected, setIsConnected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<QualityResult | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
      ws.current = new WebSocket(WS_URL);
      ws.current.onopen = () => setIsConnected(true);
      ws.current.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 3000);
      };
      ws.current.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.content) {
            setChatLogs(prev => [...prev, { role: 'assistant', content: data.content }]);
          }
        } catch { /* ignore */ }
      };
    };
    connect();
    return () => ws.current?.close();
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !isConnected) return;
    const msg = chatMessage;
    setChatLogs(prev => [...prev, { role: 'user', content: msg }]);
    ws.current?.send(JSON.stringify({ message: msg }));
    setChatMessage('');
  };

  const executeQualitySettlement = async () => {
    if (!auditorEmail || !amountUSD) {
      toast.error('Completa el correo del auditor y el monto.', { icon: '🚫' });
      return;
    }
    setIsAnalyzing(true);
    setPaymentResult(null);
    try {
      const res = await axios.post(`${API_BASE}/settle-and-dispatch`, {
        auditor_email: auditorEmail,
        amount: parseFloat(amountUSD),
        idempotency_key: `req_${Date.now()}`
      });
      setPaymentResult(res.data);
      toast.success(
        res.data.payment_action === 'RELEASED'
          ? 'Payout liberado exitosamente ✅'
          : res.data.payment_action === 'HELD'
            ? 'Payout retenido por calidad ⚠️'
            : 'Payout rechazado 🚫'
      );
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error de conexión con PayPal API', { icon: '🚫' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/orders`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch { /* ignore */ } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <>
      <Toaster position="top-right" />

      <header className="border-b border-slate-800 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/30">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-slate-100">Afferent Commerce</h1>
                <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-blue-400">
                  PayPal API v2
                </span>
              </div>
              <p className="text-xs text-slate-500">Merchant Financial Hub • Quality-Gated Settlement</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-400">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sandbox Operativo</span>
            </div>
            <button className="p-2 text-slate-400 hover:bg-slate-800 rounded-full transition">
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        <div className="flex flex-wrap gap-1 border border-slate-800 rounded-3xl bg-[#0a0a0f]/50 backdrop-blur p-1 shadow-lg mb-8">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <tab.Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              {activeTab === 'wizard' && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-800 bg-[#0a0a0f]/60 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-400" />
                        <h2 className="text-base font-semibold text-slate-100">
                          Inspección de Facturas & Payouts PayPal v2
                        </h2>
                      </div>
                      <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[10px] font-mono font-semibold text-blue-400">
                        Paso 1 de 3
                      </span>
                    </div>
                    <div className="p-6">
                      <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 px-6 py-12 text-center transition-all hover:border-blue-400 hover:bg-slate-800/30 cursor-pointer">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                          <FileText className="h-6 w-6 text-blue-400" />
                        </div>
                        <p className="mt-4 text-sm font-medium text-slate-300">
                          Arrastra tu factura PDF o payload ISO
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          or <span className="font-medium text-blue-400">select a file</span>
                        </p>
                        <p className="mt-3 text-xs text-slate-500">PDF, JPG, PNG or XML • Max 10MB</p>
                      </div>

                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-400 uppercase tracking-wider">
                            Correo del Auditor
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                              type="email"
                              value={auditorEmail}
                              onChange={(e) => setAuditorEmail(e.target.value)}
                              className="w-full rounded-xl border border-slate-700 bg-[#0a0a0f] pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                              placeholder="auditor@empresa.com"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-400 uppercase tracking-wider">
                            Monto a Liquidar (USD)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                              type="text"
                              value={amountUSD}
                              onChange={(e) => setAmountUSD(e.target.value)}
                              className="w-full rounded-xl border border-slate-700 bg-[#0a0a0f] pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={executeQualitySettlement}
                        disabled={isAnalyzing}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-6 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {isAnalyzing
                          ? <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Procesando…
                            </div>
                          : <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" />
                              Validar Calidad y Autorizar Pago vía PayPal v2
                            </div>
                        }
                        </button>

                        {paymentResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 rounded-3xl border border-slate-800 bg-[#0a0a0f]/50 backdrop-blur p-5 shadow-xl"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-sm font-semibold text-slate-300">Resultado de Liquidación</h3>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                paymentResult.payment_action === 'RELEASED'
                                  ? 'bg-emerald-900/50 text-emerald-400 border-emerald-500/30'
                                  : paymentResult.payment_action === 'HELD'
                                    ? 'bg-amber-900/50 text-amber-400 border-amber-500/30'
                                    : 'bg-rose-900/50 text-rose-400 border-rose-500/30'
                              }`}>
                                {paymentResult.payment_action}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="rounded-2xl border border-blue-500/20 bg-blue-900/20 p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Plataforma (5%)</span>
                                  <span className="text-xs font-bold text-white font-mono">5%</span>
                                </div>
                                <div className="text-2xl font-black text-blue-300 font-mono">
                                  ${paymentResult.split_payment.platform_fee.toFixed(2)}
                                </div>
                              </div>
                              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-900/20 p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Vendedor (95%)</span>
                                  <span className="text-xs font-bold text-white font-mono">95%</span>
                                </div>
                                <div className="text-2xl font-black text-emerald-300 font-mono">
                                  ${paymentResult.split_payment.merchant_settlement.toFixed(2)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2 text-sm">
                                  <AlertTriangle className="h-4 w-4 text-slate-500" />
                                  <span className="font-medium text-slate-300">Nivel de Riesgo</span>
                                </div>
                                <div className="text-xs text-slate-500">
                                  Score: {paymentResult.fraud_flags.risk_score} / 100
                                </div>
                              </div>
                              <RiskBadge level={paymentResult.fraud_flags.risk_level} />
                            </div>

                            {paymentResult.fraud_flags.flags.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {paymentResult.fraud_flags.flags.map((flag) => (
                                  <span key={flag} className="px-2 py-1 rounded border border-slate-700 bg-[#0a0a0f]/50 text-xs text-slate-400">
                                    {flag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <KPICard title="Calidad Verificada" subtitle="Piezas aprobadas" value="12" icon={CheckCircle2} color="bg-emerald-900/50 text-emerald-400" />
                    <KPICard title="En Revisión" subtitle="Requiere auditor manual" value="3" icon={AlertTriangle} color="bg-amber-900/50 text-amber-400" />
                    <KPICard title="Bloqueados" subtitle="Por Quality-Gate" value="1" icon={XCircle} color="bg-rose-900/50 text-rose-400" />
                  </div>

                  <div className="bg-[#0a0a0f]/60 border border-slate-800 rounded-3xl shadow-xl flex flex-col h-[560px] backdrop-blur">
                    <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3 bg-slate-900/40">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-5 w-5 text-blue-400" />
                        <div>
                          <p className="text-sm font-semibold text-slate-100">Asistente FinOps AI</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                            Nemotron 3
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 bg-[#0a0a0f] border-b border-slate-800 overflow-y-auto p-4 space-y-3">
                      {chatLogs.map((log, idx) => (
                        <div key={idx} className={`p-3 rounded-xl leading-relaxed ${
                          log.sender === 'user'
                            ? 'bg-blue-600/20 text-white ml-4 border border-blue-500/30'
                            : 'bg-slate-800/50 text-slate-300 mr-4 border border-slate-700/50'
                      }`}>
                          <span className="font-semibold block text-[10px] uppercase tracking-wider mb-1 text-slate-500">
                            {log.sender === 'user' ? 'Auditor' : 'FinOps Agent'}
                          </span>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{log.content}</ReactMarkdown>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 flex gap-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Pregunta sobre fondos retenidos, pagos…"
                        className="flex-1 rounded-xl border border-slate-700 bg-[#0a0a0f] pl-3 pr-4 py-2.5 text-xs text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50"
                        disabled={!isConnected}
                      />
                      <button
                        type="submit"
                        disabled={!isConnected || !chatMessage.trim()}
                        className="rounded-xl bg-blue-600 px-3 py-2.5 text-white text-xs transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            )}
            {activeTab === 'analytics' && (
              <div className="grid gap-6 md:grid-cols-3">
                <KPICard title="Revenue Total (Sandbox)" subtitle="Volumen procesado" value="$128,430.00" icon={TrendingUp} color="bg-blue-900/50 text-blue-400" />
                <KPICard title="Valor Promedio de Orden" subtitle="AOV" value="$84.20" icon={DollarSign} color="bg-indigo-900/50 text-indigo-400" />
                <KPICard title="Payouts Pendientes" subtitle="En revisión de calidad" value="$12,100.50" icon={DollarSign} color="bg-amber-900/50 text-amber-400" />

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="md:col-span-2 bg-slate-900/50 rounded-3xl border border-slate-800 p-6 shadow-xl backdrop-blur"
                >
                  <h3 className="text-sm font-semibold mb-4 text-slate-300 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-blue-400" />
                    Crecimiento de Revenue
                  </h3>
                  <div className="h-64">
                    <svg width="100%" height="100%" viewBox="0 0 600 300">
                      <rect x="50" y="240" width="60" height="30" fill="#2563eb" />
                      <rect x="130" y="210" width="60" height="60" fill="#2563eb" />
                      <rect x="210" y="270" width="60" height="0" fill="#2563eb" />
                      <rect x="290" y="180" width="60" height="90" fill="#2563eb" />
                      <rect x="370" y="150" width="60" height="120" fill="#2563eb" />
                      <rect x="450" y="220" width="60" height="60" fill="#2563eb" />
                      <rect x="530" y="200" width="60" height="80" fill="#2563eb" />
                    </svg>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-3 font-mono">
                    <span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span><span>Sab</span><span>Dom</span>
                  </div>
                </motion.div>
              </div>
            )}
            {activeTab === 'forensic' && (
              <div className="rounded-3xl border border-slate-800 bg-[#0a0a0f]/60 backdrop-blur shadow-xl p-8 flex flex-col items-center justify-center text-center">
                <Box className="h-20 w-20 text-blue-400 animate-pulse mb-4" />
                <h2 className="text-lg font-semibold text-slate-100">Forensic Ledger</h2>
                <p className="mt-2 text-sm text-slate-500 max-w-md">
                  Trazabilidad forense de sesiones de inspección y transacciones PayPal.
                </p>
              </div>
            )}
          </div>
        </motion.div>
        </AnimatePresence>

        <div className="fixed bottom-6 right-6 w-full max-w-[400px]">
          <div className="flex h-14 w-full items-center justify-center bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/30 px-4 cursor-pointer hover:scale-105 transition" onClick={() => setIsConnected(prev => !prev)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 flex-shrink-0">
              <Cpu className="h-4 w-4" />
            </div>
            <div className="ml-3 flex flex-col">
              <div className="text-sm font-semibold text-white">FinOps AI Assistant</div>
              <div className="text-xs text-blue-100 flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                {isConnected ? 'Conectado' : 'Desconectado'}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isConnected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed bottom-24 right-0 w-full max-w-[400px] h-[500px] bg-[#0a0a0f] rounded-t-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-[#0a0a0f]/80 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                      <Cpu className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-100">FinOps AI</span>
                  </div>
                  <button onClick={() => setIsConnected(false)} className="text-slate-400 hover:text-slate-200">
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0f]">
                  {chatLogs.map((log, idx) => (
                    <div key={idx} className={`flex gap-2.5 ${log.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        log.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 rounded-tl-sm'
                      }`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{log.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  <div className="h-20" />
                </div>
                <div className="border-t border-slate-800 p-4 bg-[#0a0a0f] flex gap-2">
                  <input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Pregunta sobre pagos, calidad o riesgo…"
                    className="flex-1 rounded-xl border border-slate-700 bg-[#0a0a0f] pl-3 pr-4 py-2.5 text-xs text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50"
                    disabled={!isConnected}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!isConnected || !chatMessage.trim()}
                    className="rounded-xl bg-blue-600 px-3 py-2.5 text-white text-xs transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}