/* PayPal service layer - calls the FastAPI backend, never exposes credentials in the browser */
import { fetchApi } from '../lib/api';

export interface PayPalPayoutResult {
  batch_id: string;
  sender_batch_id: string;
  payout_item_id: string;
  transaction_id: string;
  status: string;
  amount: number;
  currency: string;
  recipient_email: string;
}

export async function createPayoutBatch(
  _telemetry: Record<string, unknown>,
  recipientEmail: string,
  amount: number,
  _objectLabel: string
): Promise<PayPalPayoutResult> {
  return fetchApi<PayPalPayoutResult>('/api/v1/paypal/payout', {
    method: 'POST',
    body: JSON.stringify({
      recipient_email: recipientEmail,
      amount,
      currency: 'USD',
      note: `Afferent Commerce settlement for ${_objectLabel}`,
    }),
  });
}

export async function executePayout(payoutItemId: string): Promise<PayPalPayoutResult> {
  return fetchApi<PayPalPayoutResult>(`/api/v1/paypal/payouts/${payoutItemId}`);
}