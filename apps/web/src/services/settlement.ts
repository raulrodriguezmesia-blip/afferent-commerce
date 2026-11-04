/* Service layer for Afferent Commerce - API calls */
import { fetchApi } from '../lib/api';
import type { SettleAndDispatchRequest } from '../types/afferent';
import type { SettlementResult } from '../types/settlement';
import type { OrdersListResponse, Order } from '../types/orders';
import type { QualityAssessRequest } from '../types/afferent';
import type { ApiResponse } from '../types/api';

// Payment settlement service
export async function settleAndDispatch(payload: SettleAndDispatchRequest): Promise<{ result: SettlementResult; toastMessage: string }> {
  const res = await fetchApi<SettlementResult>('/api/v1/settle-and-dispatch', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'X-Idempotency-Key': `req_${Date.now()}`
    }
  });
  const isReleased = res.payment_action === 'RELEASED';
  const toastMessage = isReleased
    ? 'Payout liberado exitosamente ✅'
    : res.payment_action === 'HELD'
      ? 'Payout retenido por calidad ⚠️'
      : 'Payout rechazado 🚫';
  return { result: res, toastMessage };
}

// Orders service
export async function getOrders(): Promise<Order[]> {
  const res = await fetchApi<OrdersListResponse>('/api/v1/orders');
  return res.orders || [];
}

// Quality assessment service
export async function qualityAssess(payload: QualityAssessRequest): Promise<ApiResponse<Record<string, unknown>>> {
  return fetchApi<ApiResponse<Record<string, unknown>>>('/api/v1/quality-assess', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}