export interface StockOption {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface StockDetail {
  name: string;
  marketCap: string;
  sector: string;
  industry: string;
  fiftyTwoWeekRange: string;
  previousClose: string;
  yield: string;
}
