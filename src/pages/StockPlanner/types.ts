export interface StockOption {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export type FinancialTrendStatus = 'improved' | 'worsened' | 'neutral' | 'unknown';

export interface FinancialMetricTrend {
  status: FinancialTrendStatus;
  changePercent?: number | null;
  currentVal?: number | null;
  prevVal?: number | null;
  prevFormatted?: string;
  badgeText: string;
  tooltipText: string;
}

export interface CompanyFinancials {
  period: string;
  prevPeriod?: string;
  totalRevenue?: string;
  prevTotalRevenue?: string;
  grossProfit?: string;
  prevGrossProfit?: string;
  operatingIncome?: string;
  prevOperatingIncome?: string;
  netIncome?: string;
  prevNetIncome?: string;
  netIncomeCommon?: string;
  prevNetIncomeCommon?: string;
  totalLiabilities?: string;
  prevTotalLiabilities?: string;
  longTermDebt?: string;
  currency?: string;
  totalEquityThousands?: number;
}

export interface StockDetail {
  name: string;
  marketCap: string;
  sector: string;
  industry: string;
  fiftyTwoWeekRange: string;
  previousClose: string;
  yield: string;
  peRatio?: string;
  pbRatio?: string;
  description?: string;
  financials?: CompanyFinancials | null;
}

