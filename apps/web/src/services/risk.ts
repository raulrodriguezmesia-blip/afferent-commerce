import type { Order } from '../types/orders';

export function getRiskScore(telemetry: Record<string, unknown>, orderHistory: Order[]): number {
  let score = 20;

  if (!orderHistory.length) {
    score += 10;
  }

  const heldOrders = orderHistory.filter(
    (order) => order.status === 'HELD' || order.payment_released === false
  ).length;
  score += Math.min(30, heldOrders * 8);

  const rejectedOrders = orderHistory.filter((order) => order.status === 'REJECTED').length;
  score += Math.min(20, rejectedOrders * 10);

  const totalAmount = orderHistory.reduce(
    (sum, order) => sum + (order.total_amount || order.amount || 0),
    0
  );
  const averageAmount = orderHistory.length ? totalAmount / orderHistory.length : 0;
  if (averageAmount > 5000) {
    score += 15;
  }

  const uncertainty = Number((telemetry as { uncertainty?: unknown }).uncertainty ?? 0);
  if (uncertainty > 0.5) {
    score += 15;
  }

  const edgeLatency = Number((telemetry as { edge_latency_ms?: unknown }).edge_latency_ms ?? 0);
  if (edgeLatency > 100) {
    score += 10;
  }

  const fraudRiskScores = orderHistory
    .map((order) => Number((order.fraud_flags as { risk_score?: unknown } | undefined)?.risk_score ?? 0))
    .filter((value) => Number.isFinite(value));
  if (fraudRiskScores.length) {
    const averageFraudRisk = fraudRiskScores.reduce((sum, value) => sum + value, 0) / fraudRiskScores.length;
    score += Math.min(25, averageFraudRisk * 0.25);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}