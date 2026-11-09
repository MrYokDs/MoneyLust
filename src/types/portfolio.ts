import { GrowthPlanConfig } from './growthPlan';

export interface CapitalAdjustment {
  id: string;
  date: string;
  amountChange: number;
  note?: string;
}

export interface Portfolio {
  id: string;
  name: string;
  createdAt: string;
  firstTradeDate?: string;
  initialCapital?: number;
  adjustments?: CapitalAdjustment[];
  growthPlan?: GrowthPlanConfig;
}

export interface PortfolioSummary {
  initialCapital: number;
  totalRealizedPL: number;
  totalUnsoldSpent: number;
  totalUnsoldFees: number;
  availableCash: number;
  currentPortfolioValue: number;
}
