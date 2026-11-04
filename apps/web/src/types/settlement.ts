/* Settlement types */
export interface SettlementRequest {
  object_label: string;
  telemetry: Record<string, unknown>;
  recipient_email: string;
  amount: number;
  platform_fee_percent?: number;
}

export interface FraudFlagsSettlement {
  risk_level: 'low' | 'medium' | 'high';
  risk_score: number;
  flags: string[];
  blocked?: boolean;
}

export interface SplitPayment {
  total_amount: number;
  platform_fee: number;
  merchant_settlement: number;
  platform_fee_percent: number;
  currency: string;
}

export interface SettlementResult {
  order_id: string;
  status: string;
  quality_score: number;
  payment_action: 'RELEASED' | 'HELD' | 'REJECTED' | string;
  nemotron_diagnosis: string;
  fraud_flags: FraudFlagsSettlement;
  split_payment: SplitPayment;
  email_dispatch?: Record<string, unknown>;
  pdf_generated?: boolean;
  total_amount?: number;
  currency?: string;
  message?: string;
  riskLevel?: string;
  success?: boolean;
}

export interface SettleAndDispatchResponse extends SettlementResult {}