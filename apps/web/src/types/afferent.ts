/* Afferent Commerce - Unified Types */

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface FraudFlags {
  risk_level: 'low' | 'medium' | 'high';
  risk_score: number;
  flags: string[];
}

export interface QualityResult {
  quality_score: number;
  payment_action: 'RELEASED' | 'HELD' | 'REJECTED';
  nemotron_diagnosis: string;
  split_payment: {
    platform_fee: number;
    merchant_settlement: number;
    total_amount: number;
  };
  fraud_flags: FraudFlags;
}

export interface Order {
  order_id: string;
  status: string;
  amount: number;
  currency: string;
  quality_assessment: any;
  payment_released: boolean;
  created_at: string;
}

export interface SettleAndDispatchRequest {
  object_label: string;
  telemetry: Record<string, any>;
  recipient_email: string;
  amount: number;
  platform_fee_percent?: number;
}

export interface QualityAssessRequest {
  object_label: string;
  telemetry: Record<string, any>;
}

export interface AfferentResponse {
  object_label: string;
  image_base64: string;
  predictions: Record<string, any>;
}

export interface AcousticFrictionProfile {
  dominant_frequency_hz: number;
  stick_slip_energy: number;
  harmonic_spectrum: number[];
}

export interface MultiDigitTopology {
  active_digits: string[];
  center_of_pressure: number[];
  torque_balance_index: number;
}

export interface NeuromorphicReflex {
  edge_latency_ms: number;
  slip_detected: boolean;
  reflex_override_engaged: boolean;
}

export interface TactileCell {
  x: number;
  y: number;
  risk_level: 'SAFE' | 'CAUTION' | 'DANGER' | string;
  force_n?: number;
  pressure_kpa: number;
  max_pressure_kPa?: number;
  rigidity_score?: number;
}

export interface MaterialProfile {
  [key: string]: unknown;
}

export interface PhysicalReport {
  [key: string]: unknown;
}