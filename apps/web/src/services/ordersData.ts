import { fetchOrders } from './orders';
import type { Order } from '../types/orders';

export async function fetchRecentOrders(limit = 20): Promise<Order[]> {
  const orders = await fetchOrders();
  return orders.slice(0, limit);
}