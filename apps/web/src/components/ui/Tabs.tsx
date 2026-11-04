/* Tabs component */
import { Layers, BarChart2, Box } from 'lucide-react';

export interface Tab {
  id: 'wizard' | 'analytics' | 'forensic';
  label: string;
  description: string;
  Icon: React.FC<{ size?: number }>;
}

export const TABS: Tab[] = [
  { id: 'wizard', label: 'Settle Wizard', Icon: Layers, description: 'Guided PayPal payout flow' },
  { id: 'analytics', label: 'FinOps Analytics', Icon: BarChart2, description: 'Revenue & risk metrics' },
  { id: 'forensic', label: 'Forensic Ledger', Icon: Box, description: 'Transaction traceability' },
];