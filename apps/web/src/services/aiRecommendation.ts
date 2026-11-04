import { fetchRecentOrders } from './ordersData';
import { getRiskScore } from './risk';
import { calculateMerchantScore } from './merchantScore';
import type { Order } from '../types/orders';

export interface Recommendation {
  recommendedAmount: number;
  currency: string;
  confidenceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedAction: 'APPROVE' | 'HOLD' | 'REVIEW' | 'REJECT';
  reasoning: string;
}

export async function getAIRecommendation(
  telemetry: Record<string, unknown>,
  orderHistory: Order[],
  merchantScore: number,
  qualityMetrics: Record<string, unknown>,
  riskSignals: Record<string, unknown>
): Promise<Recommendation> {
  const resolvedOrderHistory = orderHistory.length ? orderHistory : await fetchRecentOrders();
  const resolvedMerchantScore = Number.isFinite(merchantScore)
    ? merchantScore
    : calculateMerchantScore(resolvedOrderHistory);

  const riskScore = getRiskScore(telemetry, resolvedOrderHistory);

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  if (riskScore < 30) {
    riskLevel = 'LOW';
  } else if (riskScore < 70) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'HIGH';
  }

  const totalAmount = resolvedOrderHistory.reduce(
    (sum, order) => sum + (order.total_amount || order.amount || 0),
    0
  );
  const averageAmount = resolvedOrderHistory.length ? totalAmount / resolvedOrderHistory.length : 1000;
  const amountFactor = riskLevel === 'HIGH' ? 0.8 : riskLevel === 'MEDIUM' ? 0.9 : 1.0;
  const recommendedAmount = Math.max(1, Math.round(averageAmount * amountFactor));

  const confidenceScore = Math.max(
    50,
    Math.min(99, Math.round(100 - riskScore * 0.45 + resolvedMerchantScore * 0.25))
  );

  const recommendedAction =
    riskLevel === 'HIGH' ? 'HOLD' : riskLevel === 'MEDIUM' ? 'REVIEW' : 'APPROVE';

  const qualityScore = Number((qualityMetrics as { quality_score?: unknown }).quality_score ?? 0);
  const riskSignalCount = Object.keys(riskSignals || {}).length;

  const reasoning = [
    `Risk score ${riskScore} indicates ${riskLevel.toLowerCase()} risk.`,
    `Merchant score ${resolvedMerchantScore} reflects ${
      resolvedMerchantScore >= 70 ? 'strong' : resolvedMerchantScore >= 45 ? 'moderate' : 'weak'
    } payment history.`,
    `Average order amount ${averageAmount.toFixed(2)} USD was adjusted to ${recommendedAmount} USD for the current risk level.`,
    `Nemotron confidence is ${confidenceScore}% after evaluating ${resolvedOrderHistory.length} orders, ${riskSignalCount} risk signals and quality score ${qualityScore}.`,
  ].join(' ');

  return {
    recommendedAmount,
    currency: 'USD',
    confidenceScore,
    riskLevel,
    recommendedAction,
    reasoning,
  };
}