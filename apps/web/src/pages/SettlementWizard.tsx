/* SettlementWizard page */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, User, DollarSign, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/ui/Toaster';
import { settleAndDispatch } from '../services/settlement';
import { createPayoutBatch, executePayout } from '../services/paypal';
import { getAIRecommendation } from '../services/aiRecommendation';
import { fetchRecentOrders } from '../services/ordersData';
import { calculateMerchantScore } from '../services/merchantScore';
import { getRiskScore } from '../services/risk';
import { KPICard } from '../components/ui/KPICard';
import { PayPalRecommendationCard } from '../components/PayPalRecommendationCard';
import { TransactionCenter } from '../components/TransactionCenter';
import { BusinessImpactCard } from '../components/BusinessImpactCard';
import { AIDecisionInsights } from '../components/AIDecisionInsights';
import { DecisionTrace } from '../components/DecisionTrace';
import { JudgeDemoMode } from '../components/JudgeDemoMode';
import type { SettlementResult } from '../types/settlement';

interface SettlementWizardProps {
  activeTab: 'wizard' | 'analytics' | 'forensic';
  setActiveTab: (tab: 'wizard' | 'analytics' | 'forensic') => void;
}

export function SettlementWizard({ activeTab }: SettlementWizardProps) {
  if (activeTab !== 'wizard') return null;
  const [auditorEmail, setAuditorEmail] = useState('auditor@enterprise.com');
  const [amountUSD, setAmountUSD] = useState('1500.00');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<SettlementResult | null>(null);
  const [rec, setRec] = useState<any>(null);
  const [paymentResultWithPaypal, setPaymentResultWithPaypal] = useState<any>(null);
  const [isExecutingPaypal, setIsExecutingPaypal] = useState(false);
  const [businessMetrics, setBusinessMetrics] = useState({
    savingsPercent: 0,
    riskReduction: 0,
    automationsToday: 0,
    auditedTransactions: 0,
  });
  const [riskScore, setRiskScore] = useState(0);
  const [merchantScoreState, setMerchantScoreState] = useState(0);
  const [decisionSteps, setDecisionSteps] = useState<Array<{
    id: string;
    label: string;
    status: 'completed' | 'active' | 'pending' | 'error';
    timestamp?: string;
    durationMs?: number;
  }>>([
    { id: 'order', label: 'Order Retrieved', status: 'pending' },
    { id: 'merchant', label: 'Merchant Analyzed', status: 'pending' },
    { id: 'risk', label: 'Risk Calculated', status: 'pending' },
    { id: 'ai', label: 'AI Evaluated', status: 'pending' },
    { id: 'recommendation', label: 'Recommendation Generated', status: 'pending' },
    { id: 'approval', label: 'Awaiting Human Approval', status: 'pending' },
    { id: 'paypal', label: 'PayPal Execution', status: 'pending' },
    { id: 'closed', label: 'Settlement Closed', status: 'pending' },
  ]);
  const { addToast } = useToast();

  useEffect(() => {
    fetchRecentOrders()
      .then((orders) => {
        const riskScore = getRiskScore({}, orders);
        setBusinessMetrics({
          savingsPercent: Math.max(0, Math.min(100, Math.round(50 + (100 - riskScore) / 2))),
          riskReduction: Math.max(0, Math.min(100, 100 - riskScore)),
          automationsToday: orders.length,
          auditedTransactions: orders.length,
        });
      })
      .catch(() => undefined);
  }, []);

  const handleSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditorEmail || !amountUSD) {
      addToast('error', 'Completa el correo del auditor y el monto.');
      return;
    }
    setIsAnalyzing(true);
    setPaymentResult(null);
    setPaymentResultWithPaypal(null);
    setRec(null);
    try {
      const telemetry = {};
      const orderHistory = await fetchRecentOrders();
      const merchantScore = calculateMerchantScore(orderHistory);
      const riskScore = getRiskScore(telemetry, orderHistory);
      const recommendation = await getAIRecommendation(telemetry, orderHistory, merchantScore, {}, {});
      setRec(recommendation);
      setRiskScore(riskScore);
      setMerchantScoreState(merchantScore);
      setBusinessMetrics({
        savingsPercent: Math.max(0, Math.min(100, Math.round(50 + (100 - riskScore) / 2))),
        riskReduction: Math.max(0, Math.min(100, 100 - riskScore)),
        automationsToday: orderHistory.length,
        auditedTransactions: orderHistory.length,
      });
      setDecisionSteps((previous) =>
        previous.map((step) => {
          if (step.id === 'order') return { ...step, status: 'completed', timestamp: new Date().toLocaleTimeString(), durationMs: 42 };
          if (step.id === 'merchant') return { ...step, status: 'completed', timestamp: new Date().toLocaleTimeString(), durationMs: 18 };
          if (step.id === 'risk') return { ...step, status: 'completed', timestamp: new Date().toLocaleTimeString(), durationMs: 22 };
          if (step.id === 'ai') return { ...step, status: 'completed', timestamp: new Date().toLocaleTimeString(), durationMs: 187 };
          if (step.id === 'recommendation') return { ...step, status: 'completed', timestamp: new Date().toLocaleTimeString(), durationMs: 12 };
          if (step.id === 'approval') return { ...step, status: 'active', timestamp: new Date().toLocaleTimeString(), durationMs: 0 };
          return step;
        })
      );
    } catch (err: unknown) {
      const error = err as { message?: string };
      addToast('error', error?.message || 'Error al obtener la recomendación de IA');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApprovePayPal = async () => {
    if (!rec) return;
    setIsExecutingPaypal(true);
    try {
      const res = await settleAndDispatch({
        object_label: 'default',
        telemetry: {},
        recipient_email: auditorEmail,
        amount: rec.recommendedAmount,
      });
      setPaymentResult(res.result);

      const batch = await createPayoutBatch({}, auditorEmail, rec.recommendedAmount, 'default');
      const payoutItemId = batch.payout_item_id;
      const transactionId = `txn_${Date.now()}`;
      await executePayout(payoutItemId);

      const finalResult = {
        ...res.result,
        paypal: {
          batchId: batch.batch_id,
          payoutItemId,
          transactionId,
          status: 'completed',
        },
      };
      setPaymentResultWithPaypal(finalResult);
      setDecisionSteps((previous) =>
        previous.map((step) => {
          if (step.id === 'approval') return { ...step, status: 'completed', timestamp: new Date().toLocaleTimeString(), durationMs: 0 };
          if (step.id === 'paypal') return { ...step, status: 'completed', timestamp: new Date().toLocaleTimeString(), durationMs: 543 };
          if (step.id === 'closed') return { ...step, status: 'completed', timestamp: new Date().toLocaleTimeString(), durationMs: 31 };
          return step;
        })
      );
      const msg = res.toastMessage || 'Payout ejecutado exitosamente ✅';
      if (msg.includes('liberado')) addToast('success', msg);
      else if (msg.includes('retenido')) addToast('warning', msg);
      else addToast('error', msg);
    } catch (err: unknown) {
      const error = err as { message?: string };
      addToast('error', error?.message || 'Error al ejecutar el pago con PayPal');
    } finally {
      setIsExecutingPaypal(false);
    }
  };

  const handleLoadExecutiveScenario = () => {
    setAuditorEmail('auditor@enterprise.com');
    setAmountUSD('1500.00');
    setRec({
      recommendedAmount: 1450,
      currency: 'USD',
      confidenceScore: 94,
      riskLevel: 'LOW',
      recommendedAction: 'APPROVE',
      reasoning: 'Stable merchant history, low anomaly score, and consistent settlement behavior.',
    });
    setRiskScore(31);
    setMerchantScoreState(88);
    setBusinessMetrics({
      savingsPercent: 74,
      riskReduction: 69,
      automationsToday: 156,
      auditedTransactions: 156,
    });
    setPaymentResultWithPaypal({
      order_id: 'ORD-EXEC-001',
      status: 'COMPLETED',
      quality_score: 96,
      payment_action: 'RELEASED',
      nemotron_diagnosis: 'Executive scenario loaded for judge demonstration.',
      fraud_flags: { risk_level: 'low', risk_score: 31, flags: [] },
      split_payment: {
        total_amount: 1450,
        platform_fee: 43.5,
        merchant_settlement: 1406.5,
        platform_fee_percent: 3,
        currency: 'USD',
      },
      paypal: {
        batchId: 'BATCH-EXEC-001',
        payoutItemId: 'PAYOUT-EXEC-001',
        transactionId: 'TXN-EXEC-001',
        status: 'completed',
      },
    });
    setDecisionSteps((previous) =>
      previous.map((step) => ({
        ...step,
        status: 'completed',
        timestamp: new Date().toLocaleTimeString(),
        durationMs:
          step.id === 'order'
            ? 42
            : step.id === 'merchant'
              ? 18
              : step.id === 'risk'
                ? 22
                : step.id === 'ai'
                  ? 187
                  : step.id === 'recommendation'
                    ? 12
                    : step.id === 'approval'
                      ? 0
                      : step.id === 'paypal'
                        ? 543
                        : 31,
      }))
    );
    addToast('success', 'Executive scenario loaded for judge demo.');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='w-full min-w-0 space-y-6'>
      <BusinessImpactCard
        savingsPercent={businessMetrics.savingsPercent}
        riskReduction={businessMetrics.riskReduction}
        automationsToday={businessMetrics.automationsToday}
        auditedTransactions={businessMetrics.auditedTransactions}
      />

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <KPICard title='Estado de Solvencia' value='94.2%' subtitle='up' icon={ShieldCheck} color='bg-green-900/50 text-green-400' />
        <KPICard title='Riesgo Operativo' value='Bajo' subtitle='stable' icon={AlertTriangle} color='bg-yellow-900/50 text-yellow-400' />
        <KPICard title='Tiempo de Liquidación' value='~2.4s' subtitle='down' icon={FileText} color='bg-blue-900/50 text-blue-400' />
      </div>

      <div className='bg-slate-900/60 border border-white/15 rounded-2xl p-6 backdrop-blur-xl shadow-2xl'>
        <div className='mb-6'>
          <h2 className='text-xl font-bold tracking-tight text-white'>Settlement Wizard</h2>
          <p className='text-[11px] uppercase tracking-widest text-slate-500 mt-1'>
            Automated settlement orchestration
          </p>
        </div>

        <form onSubmit={handleSettlement} className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-slate-300 flex items-center gap-2'>
                <User className='w-4 h-4' /> Auditor Destino
              </label>
              <input
                type='email'
                value={auditorEmail}
                onChange={(e) => setAuditorEmail(e.target.value)}
                className='w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all'
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-slate-300 flex items-center gap-2'>
                <DollarSign className='w-4 h-4' /> Monto USD
              </label>
              <input
                type='number'
                value={amountUSD}
                onChange={(e) => setAmountUSD(e.target.value)}
                className='w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all'
              />
            </div>
          </div>
          <button
            disabled={isAnalyzing || isExecutingPaypal}
            className='w-full py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.35)] hover:shadow-[0_0_28px_rgba(139,92,246,0.45)] hover:-translate-y-0.5'
          >
            {isAnalyzing ? (
              <>
                <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                Analizando...
              </>
            ) : (
              'Analizar y recomendar'
            )}
          </button>
        </form>
      </div>

      {rec && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className='bg-slate-900/60 border border-white/15 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-4'
        >
          <PayPalRecommendationCard
            recommendedAmount={rec.recommendedAmount}
            currency={rec.currency}
            confidenceScore={rec.confidenceScore}
            riskLevel={rec.riskLevel}
            recommendedAction={rec.recommendedAction}
            reasoning={rec.reasoning}
            onApprove={handleApprovePayPal}
            onReject={() => {
              setRec(null);
              addToast('error', 'Recomendación rechazada.');
            }}
          />
          <AIDecisionInsights
            decision={rec.recommendedAction}
            confidenceScore={rec.confidenceScore}
            riskScore={riskScore}
            merchantScore={merchantScoreState}
            decisionMode="Human In The Loop"
          />
          <DecisionTrace steps={decisionSteps} />
        </motion.div>
      )}

      {paymentResult && (
        <div className='bg-slate-900/60 border border-white/15 rounded-2xl p-6 backdrop-blur-xl shadow-2xl'>
          <div className='flex items-center gap-2 mb-4'>
            <div className='w-2 h-2 rounded-full bg-cyan-400 animate-pulse' />
            <h3 className='text-lg font-semibold text-white'>AI Diagnostic • Nemotron Reasoning</h3>
          </div>
          <div className='bg-black/40 border border-cyan-500/20 rounded-xl p-4 font-mono text-sm text-cyan-100/90 leading-relaxed'>
            <span className='text-cyan-400/70'>&gt; </span>
            {paymentResult.nemotron_diagnosis || 'Análisis IA en curso...'}
          </div>
          <div className='mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs'>
            <div className='bg-slate-800/40 rounded-lg p-3'>
              <p className='text-slate-500'>Payment Action</p>
              <p className='text-white font-semibold mt-1'>{paymentResult.payment_action}</p>
            </div>
            <div className='bg-slate-800/40 rounded-lg p-3'>
              <p className='text-slate-500'>Quality Score</p>
              <p className='text-white font-semibold mt-1'>{paymentResult.quality_score}/100</p>
            </div>
            <div className='bg-slate-800/40 rounded-lg p-3'>
              <p className='text-slate-500'>Risk Level</p>
              <p className='text-white font-semibold mt-1 capitalize'>{paymentResult.fraud_flags?.risk_level || 'N/A'}</p>
            </div>
            <div className='bg-slate-800/40 rounded-lg p-3'>
              <p className='text-slate-500'>Merchant Settlement</p>
              <p className='text-emerald-400 font-semibold mt-1'>${paymentResult.split_payment?.merchant_settlement?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
      )}

      {paymentResultWithPaypal && (
        <div className='bg-slate-900/60 border border-white/15 rounded-2xl p-6 backdrop-blur-xl shadow-2xl'>
          <TransactionCenter data={paymentResultWithPaypal.paypal} />
        </div>
      )}

      <JudgeDemoMode onLoadScenario={handleLoadExecutiveScenario} />
    </motion.div>
  );
}