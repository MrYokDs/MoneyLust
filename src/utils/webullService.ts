/**
 * Utility: webullService.ts
 * ให้บริการดึงข้อมูลราคาหุ้นและสถิติตลาดแบบ Real-Time จาก Webull Open API
 * ทำงานผ่าน Serverless Proxy (/api/webull/quote) เพื่อความปลอดภัยสูงสุด (ไม่เปิดเผย App Secret บน Browser)
 */

import { WebullRealTimeQuote } from '../pages/StockPlanner/types';
import { emitTokenExpiredEvent } from './webullTokenService';

export interface WebullQuoteData {
  success: boolean;
  data: WebullRealTimeQuote | null;
  message?: string;
}

/**
 * ดึงข้อมูลราคาหุ้น Real-time และสถานะตลาดจาก Webull Open API ผ่าน Serverless Proxy
 * 
 * @param symbol - รหัสย่อหุ้น เช่น AAPL, NVDA, TSLA
 * @returns Promise<WebullQuoteData> ผลลัพธ์ Snapshot ราคาหุ้น สถิติการซื้อขาย และเวลาอัปเดต
 */
export const fetchWebullStockQuote = async (symbol: string): Promise<WebullQuoteData> => {
  const cleanSymbol = symbol.trim().toUpperCase();
  if (!cleanSymbol) {
    return {
      success: false,
      data: null,
      message: 'ไม่ได้ระบุรหัสหุ้น',
    };
  }

  try {
    const response = await fetch(`/api/webull/quote?symbol=${encodeURIComponent(cleanSymbol)}`);
    if (response.status === 401) {
      emitTokenExpiredEvent();
      return {
        success: false,
        data: null,
        message: 'Webull Access Token หมดอายุ กรุณาขอ Token ใหม่',
      };
    }
    if (!response.ok) {
      return {
        success: false,
        data: null,
        message: `HTTP Error ${response.status}`,
      };
    }
    const result: WebullQuoteData = await response.json();
    if (!result.success && result.message && result.message.toLowerCase().includes('token')) {
      emitTokenExpiredEvent(result.message);
    }
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Webull Proxy',
    };
  }
};

export interface ScreenerStockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sparkline: number[];
}

export interface ScreenerResponse {
  success: boolean;
  source: string;
  direction: 'gainers' | 'losers';
  period: string;
  count: number;
  data: ScreenerStockItem[];
  message?: string;
}

/**
 * ดึงข้อมูลการจัดอันดับหุ้น Top Gainers หรือ Top Losers ตามช่วงเวลาที่เลือก
 * 
 * @param direction - 'gainers' (หุ้นขึ้นสูงสุด) หรือ 'losers' (หุ้นลงต่ำสุด)
 * @param period - ช่วงเวลา เช่น 'preMarket', 'afterHours', '5m', '1d', '5d', '1m', '3m', '52w'
 * @returns Promise<ScreenerResponse> รายการหุ้นพร้อมสถิติและ Sparkline
 */
export const fetchWebullScreener = async (
  direction: 'gainers' | 'losers' = 'gainers',
  period: string = 'preMarket'
): Promise<ScreenerResponse> => {
  const dirParam = direction === 'gainers' ? 'DESC' : 'ASC';

  try {
    const res = await fetch(`/api/webull/screener?direction=${dirParam}&period=${encodeURIComponent(period)}`);
    if (res.status === 401) {
      emitTokenExpiredEvent();
      return {
        success: false,
        source: 'Webull',
        direction,
        period,
        count: 0,
        data: [],
        message: 'Webull Access Token หมดอายุ กรุณาขอ Token ใหม่',
      };
    }
    if (!res.ok) {
      return {
        success: false,
        source: 'local_fallback',
        direction,
        period,
        count: 0,
        data: [],
        message: `HTTP Error ${res.status}`,
      };
    }
    const json: ScreenerResponse = await res.json();
    if (!json.success && json.message && json.message.toLowerCase().includes('token')) {
      emitTokenExpiredEvent(json.message);
    }
    return json;
  } catch (err: any) {
    return {
      success: false,
      source: 'local_fallback',
      direction,
      period,
      count: 0,
      data: [],
      message: err.message || 'Network error',
    };
  }
};

