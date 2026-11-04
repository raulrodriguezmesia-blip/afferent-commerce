/* Orders types */
export interface OrderItem {
  object_label: string;
  quantity: number;
  unit_price: number;
  image_base64?: string;
}

export interface Order {
  order_id: string;
  status: 'CREATED' | 'COMPLETED' | 'HELD' | 'REJECTED' | string;
  total_amount: number;
  amount?: number;
  currency: string;
  items?: OrderItem[];
  quality_assessment?: Record<string, unknown>;
  force_budget?: Record<string, unknown>;
  payment_released: boolean;
  created_at: string;
  updated_at?: string;
  quality_score?: number;
  payment_action?: string;
  fraud_flags?: Record<string, unknown>;
  split_payment?: Record<string, unknown>;
}

export interface OrderResponse {
  orders: Order[];
}

export interface OrdersListResponse {
  orders: Order[];
}