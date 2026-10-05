/**
 * Vercel Serverless Function: api/webull/screener.ts
 * Proxy ดึงข้อมูลการจัดอันดับหุ้น Top Gainers / Top Losers สดจาก Webull OpenAPI 100%
 * สะอาด คลีน ไม่มี Mock สัญลักษณ์หุ้นตกค้างในโค้ด
 */

import { execFile } from 'child_process';
import path from 'path';

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

const PERIOD_TO_RANK_TYPE: Record<string, string> = {
  preMarket: 'PRE_MARKET',
  afterHours: 'AFTER_MARKET',
  '5m': 'MIN_5',
  '1d': 'DAY_1',
  '5d': 'DAY_5',
  '1m': 'MONTH_1',
  '3m': 'MONTH_3',
  '52w': 'WEEK_52',
};

/**
 * ดึงข้อมูลการจัดอันดับหุ้นสดจาก Webull OpenAPI ผ่าน Python Bridge
 * 
 * @param rankType - ชนิดของการจัดอันดับ เช่น PRE_MARKET, AFTER_MARKET, MIN_5, DAY_1 ฯลฯ
 * @param direction - ทิศทางการจัดอันดับ DESC (Gainers) หรือ ASC (Losers)
 * @param limit - จำนวนหุ้นที่ต้องการดึง (สูงสุด 200)
 * @returns Promise<ScreenerStockItem[] | null> รายการหุ้นสดจาก Webull
 */
async function fetchFromWebullSdk(rankType: string, direction: string, limit = 50): Promise<ScreenerStockItem[] | null> {
  return new Promise((resolve) => {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'webull_screener.py');
    execFile(
      'python',
      [scriptPath, rankType, direction, limit.toString()],
      {
        env: {
          ...process.env,
          WEBULL_APP_KEY: process.env.WEBULL_APP_KEY || '',
          WEBULL_APP_SECRET: process.env.WEBULL_APP_SECRET || '',
          WEBULL_ACCESS_TOKEN: process.env.WEBULL_ACCESS_TOKEN || '',
        },
        timeout: 10000,
      },
      (error, stdout) => {
        if (error || !stdout) {
          return resolve(null);
        }
        try {
          const parsed = JSON.parse(stdout.trim());
          if (parsed.success && Array.isArray(parsed.data) && parsed.data.length > 0) {
            return resolve(parsed.data);
          }
        } catch {
          // ignore error
        }
        resolve(null);
      }
    );
  });
}

/**
 * Main Handler สำหรับ Vercel Serverless Function: /api/webull/screener
 * 
 * @param req - HTTP Request object
 * @param res - HTTP Response object
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const direction = (req.query.direction || 'DESC').toString().toUpperCase(); // DESC = Gainers, ASC = Losers
  const period = (req.query.period || 'preMarket').toString(); // preMarket, afterHours, 5m, 1d, 5d, 1m, 3m, 52w
  const isGainers = direction === 'DESC';

  const rankType = PERIOD_TO_RANK_TYPE[period] || 'PRE_MARKET';
  const liveWebullData = await fetchFromWebullSdk(rankType, direction, 50);

  if (liveWebullData && liveWebullData.length > 0) {
    return res.status(200).json({
      success: true,
      source: 'webull_live_openapi',
      direction: isGainers ? 'gainers' : 'losers',
      period,
      count: liveWebullData.length,
      data: liveWebullData,
    });
  }

  // หากไม่สามารถดึงข้อมูลจาก Webull ได้ จะส่งข้อมูลเปล่าพร้อมข้อความแจ้งเตือน
  return res.status(200).json({
    success: false,
    source: 'webull_live_openapi',
    direction: isGainers ? 'gainers' : 'losers',
    period,
    count: 0,
    data: [],
    message: 'ไม่สามารถเชื่อมต่อ Webull API เพื่อดึงข้อมูลได้ หรือเซิร์ฟเวอร์ตลาดอาจปิดให้บริการอยู่ในขณะนี้',
  });
}
