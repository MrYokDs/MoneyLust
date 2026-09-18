export type DropMode = 'progressive' | 'fixed';
export type RoundingMode = 'fractional' | 'integer' | 'boardlot';
export type CurrencyMode = 'THB' | 'USD';

export interface TrancheDetail {
  trancheNumber: number;
  budgetAllocated: number;
  price: number;
  sharesBought: number;
  actualSpent: number;
  leftoverCash: number;

  // Cumulative stats
  cumulativeBudgetAllocated: number;
  cumulativeSpent: number;
  cumulativeShares: number;
  cumulativeAverageCost: number;
  cumulativeLeftoverCash: number;
  priceDiscountPercent: number;
  averageCostDiscountPercent: number;
}

export interface CalculationResult {
  id: string;
  stockSymbol: string;
  currentPrice: number;
  totalBudget: number;
  tranchesCount: number;
  dropPercentage: number;
  dropMode: DropMode;
  roundingMode: RoundingMode;
  createdAt: string;

  tranches: TrancheDetail[];

  // Summary stats
  totalActualSpent: number;
  totalSharesBought: number;
  finalAverageCost: number;
  totalLeftoverCash: number;
  overallDiscountPercent: number;
  currency?: CurrencyMode;
  exchangeRate?: number;
  targetProfitPercent?: number;
  feePercent?: number;
  actualSellPrice?: number;
  targetSellPrice?: number;
  realizedProfitLossAmount?: number;
  realizedProfitLossPercent?: number;
  currentPriceIsFirstTranche?: boolean;

  // Actual executed stats (if actualTranchesCount is less than tranchesCount)
  actualTranchesCount?: number;
  actualSpent?: number;
  actualShares?: number;
  actualAverageCost?: number;
  actualLeftoverCash?: number;
  actualDiscountPercent?: number;
  actualTargetSellPrice?: number;
  actualEquivalentTargetSellPrice?: number;
  actualRealizedProfitLossAmount?: number;
  actualRealizedProfitLossPercent?: number;
  actualRealizedProfitLossPercentOfFullPlan?: number;
  portfolioId?: string;
  soldAt?: string;
}
