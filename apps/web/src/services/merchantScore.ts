import type { Order } from '../types/orders';

export function calculateMerchantScore(orderHistory: Order[]): number {
  if (!orderHistory.length) {
    return 50;
  }

  const completedOrders = orderHistory.filter((order) => order.status === 'COMPLETED').length;
  const heldOrders = orderHistory.filter((order) => order.status === 'HELD').length;
  const rejectedOrders = orderHistory.filter((order) => order.status === 'REJECTED').length;

  const completionRate = completedOrders / orderHistory.length;
  const heldRate = heldOrders / orderHistory.length;
  const rejectedRate = rejectedOrders / orderHistory.length;

  let score = 50;
  score += completionRate * 30;
  score -= heldRate * 20;
  score -= rejectedRate * 30;
  score += Math.min(20, orderHistory.length * 2);

  return Math.max(0, Math.min(100, Math.round(score)));
}