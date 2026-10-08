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

/**
 * คำนวณช่วงเวลาเริ่มต้นของตลาดหุ้นสหรัฐฯ (MarketPeriod) ตามเวลาจริงของตลาด New York (ET - Eastern Time)
 * - Pre-market: 04:00 - 09:30 ET
 * - After-hours: 16:00 - 20:00 ET
 * - ช่วงเวลาอื่นๆ (ตลาดเปิดปกติ 09:30 - 16:00 ET หรือช่วงปิดตลาดกลางคืน): '1d'
 * 
 * @returns MarketPeriod ที่เหมาะสมกับเวลาปัจจุบันของตลาดหุ้นสหรัฐฯ
 */
export const getDefaultMarketPeriodByTime = (): MarketPeriod => {
  try {
    const now = new Date();
    // ดึงเวลาในโซน America/New_York (US Eastern Time)
    // ระบบ IANA tzdb จะคำนวณและปรับเปลี่ยนเวลาตามฤดูกาล (Daylight Saving Time: EDT / Standard Time: EST) ให้อัตโนมัติ 100%
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const weekdayPart = parts.find((p) => p.type === 'weekday')?.value;
    const hourPart = parts.find((p) => p.type === 'hour');
    const minutePart = parts.find((p) => p.type === 'minute');

    // วันเสาร์หรืออาทิตย์ในนิวยอร์ก ตลาดปิดทำการ ให้ค่าเริ่มต้นเป็น 1 Day ('1d')
    if (weekdayPart === 'Sat' || weekdayPart === 'Sun') {
      return '1d';
    }

    const hour = hourPart ? parseInt(hourPart.value, 10) : 0;
    const minute = minutePart ? parseInt(minutePart.value, 10) : 0;
    const timeInMinutes = hour * 60 + minute;

    // Pre-Market: 04:00 AM (240 นาที) ถึง 09:30 AM (570 นาที) ET
    // (เวลาไทย: 15:00-20:30 ช่วง Daylight Saving หรือ 16:00-21:30 ช่วง Standard Time)
    if (timeInMinutes >= 240 && timeInMinutes < 570) {
      return 'preMarket';
    }

    // After-Hours: 04:00 PM (16:00 = 960 นาที) ถึง 08:00 PM (20:00 = 1200 นาที) ET
    // (เวลาไทย: 03:00-07:00 ช่วง Daylight Saving หรือ 04:00-08:00 ช่วง Standard Time)
    if (timeInMinutes >= 960 && timeInMinutes < 1200) {
      return 'afterHours';
    }

    // ช่วงเวลาอื่นๆ (ตลาดเปิดทำการปกติ 09:30 - 16:00 ET หรือช่วงปิดตลาดตอนดึก) ให้เลือก 1 Day ('1d')
    return '1d';
  } catch (err) {
    console.warn('Failed to detect NY market time, falling back to 1d:', err);
    return '1d';
  }
};
