/* Service layer for Afferent Commerce - PayPal/agentic commerce calls */
import { fetchApi } from '../lib/api';
import type { Order, OrdersListResponse } from '../types/orders';
import type { SettlementResult } from '../types/settlement';

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetchApi<OrdersListResponse>('/api/v1/orders');
  return res.orders || [];
}

export async function executeSettlement(
  auditorEmail: string,
  amountUSD: number
): Promise<{ result: SettlementResult; toastMessage: string }> {
  try {
    const res = await fetchApi<SettlementResult>('/api/v1/settle-and-dispatch', {
      method: 'POST',
      body: JSON.stringify({
        object_label: 'default',
        telemetry: {},
        recipient_email: auditorEmail,
        amount: amountUSD,
      })
    });
    const isReleased = res.payment_action === 'RELEASED';
    const toastMessage = isReleased
      ? 'Payout liberado exitosamente ✅'
      : res.payment_action === 'HELD'
        ? 'Payout retenido por calidad ⚠️'
        : 'Payout rechazado 🚫';
    return { result: res, toastMessage };
  } catch (err: unknown) {
    const error = err as { response?: { data?: { detail?: string } }; message?: string };
    throw new Error(error.response?.data?.detail || error.message || 'Error de conexión con PayPal API');
  }
}