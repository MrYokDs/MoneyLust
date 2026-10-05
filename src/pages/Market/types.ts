/** Route: /market */
/**
 * Types & Interfaces สำหรับหน้าภาพรวมตลาดหุ้น (US Stock Market Screener)
 */

import { ScreenerStockItem } from '../../utils/webullService';

export type MarketDirection = 'gainers' | 'losers';

export type MarketPeriod =
  | 'preMarket'
  | 'afterHours'
  | '5m'
  | '1d'
  | '5d'
  | '1m'
  | '3m'
  | '52w';

export interface MarketPeriodOption {
  value: MarketPeriod;
  label: string;
  shortLabel: string;
  badge?: string;
}

export const MARKET_PERIOD_OPTIONS: MarketPeriodOption[] = [
  { value: 'preMarket', label: 'Pre-market (ก่อนเปิดตลาด)', shortLabel: 'Pre-market', badge: 'PM' },
  { value: 'afterHours', label: 'After-hours (หลังปิดตลาด)', shortLabel: 'After-hours', badge: 'AH' },
  { value: '5m', label: '5 Minutes (5 นาที)', shortLabel: '5 Min' },
  { value: '1d', label: '1 Day (1 วัน)', shortLabel: '1 Day' },
  { value: '5d', label: '5 Days (5 วัน)', shortLabel: '5 Days' },
  { value: '1m', label: '1 Month (1 เดือน)', shortLabel: '1 Month' },
  { value: '3m', label: '3 Months (3 เดือน)', shortLabel: '3 Months' },
  { value: '52w', label: '52 Weeks (52 สัปดาห์)', shortLabel: '52 Weeks' },
];

export type { ScreenerStockItem };
