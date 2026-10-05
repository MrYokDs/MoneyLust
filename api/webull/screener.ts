/**
 * Vercel Serverless Function: api/webull/screener.ts
 * Proxy ดึงข้อมูลการจัดอันดับหุ้น Top Gainers / Top Losers สดจาก Webull OpenAPI 100%
 * สะอาด คลีน ไม่มี Mock สัญลักษณ์หุ้นตกค้างในโค้ด
 */

import { executeWebullRequest } from './webullClient';

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
 * ดึงข้อมูลการจัดอันดับหุ้นสดจาก Webull OpenAPI ด้วย Node.js เพียวๆ (HMAC Signed)
 * 
 * @param rankType - ชนิดของการจัดอันดับ เช่น PRE_MARKET, AFTER_MARKET, MIN_5, DAY_1
 * @param direction - ทิศทางการจัดอันดับ DESC (Gainers) หรือ ASC (Losers)
 * @param limit - จำนวนหุ้นที่ต้องการดึง
 * @returns Promise<ScreenerStockItem[] | null> รายการหุ้นสดจาก Webull
 */
async function fetchScreenerDirect(rankType: string, direction: string, limit = 50): Promise<ScreenerStockItem[] | null> {
  const rawItems = await executeWebullRequest<any[]>({
    method: 'GET',
    uri: '/market-data/screeners/gainers-losers/list',
    queries: {
      category: 'US_STOCK',
      direction: direction,
      rank_type: rankType,
      sort_by: 'CHANGE_RATIO',
    },
  });

  if (!Array.isArray(rawItems)) {
    return null;
  }

  const formatted: ScreenerStockItem[] = [];
  for (const q of rawItems.slice(0, limit)) {
    const price = parseFloat(q.price || q.close || '0');
    const change = parseFloat(q.change || '0');
    const changeRatio = parseFloat(q.change_ratio || '0');
    const changePercent = Number((changeRatio * 100).toFixed(2));
    const prevPrice = parseFloat(q.pre_close || String(price - change));
    const openPrice = parseFloat(q.open || String(prevPrice));
    const highPrice = parseFloat(q.high || String(Math.max(price, openPrice)));
    const lowPrice = parseFloat(q.low || String(Math.min(price, openPrice)));

    formatted.push({
      symbol: q.symbol || '',
      name: q.name || q.symbol || '',
      price,
      change,
      changePercent,
      volume: Math.round(parseFloat(q.volume || '0')),
      marketCap: Math.round(parseFloat(q.market_value || '0')),
      sparkline: [prevPrice, openPrice, lowPrice, highPrice, price],
    });
  }

  return formatted;
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
  const period = (req.query.period || 'preMarket').toString();
  const isGainers = direction === 'DESC';

  try {
    const rankType = PERIOD_TO_RANK_TYPE[period] || 'PRE_MARKET';
    const liveWebullData = await fetchScreenerDirect(rankType, direction, 50);

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

    return res.status(200).json({
      success: false,
      source: 'webull_live_openapi',
      direction: isGainers ? 'gainers' : 'losers',
      period,
      count: 0,
      data: [],
      message: 'ไม่สามารถเชื่อมต่อ Webull API เพื่อดึงข้อมูลได้ หรือเซิร์ฟเวอร์ตลาดอาจปิดให้บริการอยู่ในขณะนี้',
    });
  } catch (error: any) {
    return res.status(error.status || 500).json({
      success: false,
      source: 'webull_live_openapi',
      direction: isGainers ? 'gainers' : 'losers',
      period,
      count: 0,
      data: [],
      message: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Webull Screener API',
    });
  }
}
