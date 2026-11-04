/* Legacy/shared component types */
export interface AnomalyResult {
  anomalies?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface ComplianceReportData {
  checks?: Array<Record<string, unknown>>;
  score?: number;
  [key: string]: unknown;
}

export interface TactilePrediction {
  predictedDeformation?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface GraspPlan {
  contact_points?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface MaterialCalibrationResult {
  [key: string]: unknown;
}

export interface NvidiaStatus {
  status?: string;
  [key: string]: unknown;
}

export interface PaymentReleaseResult {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface SettleDispatchResult {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface StreamFrame {
  [key: string]: unknown;
}

export interface ReplayFrame {
  [key: string]: unknown;
}

export interface MaterialProfile {
  [key: string]: unknown;
}

export interface PhysicalReport {
  [key: string]: unknown;
}