/**
 * Vercel Serverless Function: api/webull/quote.ts
 * Proxy สำหรับดึงข้อมูล Snapshot ราคาหุ้น Real-time จาก Webull OpenAPI 100% ผ่าน Python Bridge
 */

import { executeWebullRequest } from '../_webullCore.js';

export interface WebullStockQuote {
  symbol: string;
  currentPrice: number;
  preClose: number;
  change: number;
  changePercent: number;
  tradeStatus: string;
  sessionLabel: string;
  volume: number;
  marketCap: string;
  rawMarketCap: number;
  peRatio: string;
  pbRatio: string;
  fiftyTwoWeekRange: string;
  yield: string;
  open: number;
  high: number;
  low: number;
  lastUpdated: string;
  source: string;
}

export interface WebullQuoteApiResponse {
  success: boolean;
  data: WebullStockQuote | null;
  message?: string;
}

/**
 * แปลงตัวเลขมูลค่าตลาด (Market Cap) ให้อยู่ในรูปตัวย่อที่อ่านง่าย เช่น $3.25T, $850.20B
 * 
 * @param val - มูลค่าตลาดเป็นตัวเลข
 * @returns ข้อความมูลค่าตลาดที่ฟอร์แมตแล้ว
 */
function formatMarketCap(val: number): string {
  if (!val || val <= 0) return '-';
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toLocaleString()}`;
}

/**
 * ดึงข้อมูล Snapshot ราคาหุ้น Real-time จาก Webull OpenAPI ด้วย Node.js เพียวๆ (HMAC Signed)
 * 
 * @param symbol - รหัสย่อหุ้น เช่น AAPL, NVDA, TSLA
 * @returns Promise<WebullStockQuote | null> ข้อมูลราคาและสถานะตลาด
 */
async function fetchStockQuoteDirect(symbol: string): Promise<WebullStockQuote | null> {
  const items = await executeWebullRequest<any[]>({
    method: 'GET',
    uri: '/market-data/stocks/snapshots/list',
    queries: {
      category: 'US_STOCK',
      extend_hour_required: 'true',
      symbols: symbol,
    },
  });

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const item = items[0];
  const tradeStatus = item.trade_status || 'REG';
  const preClose = parseFloat(item.pre_close || '0');
  const extPrice = parseFloat(item.extend_hour_last_price || '0');
  const regularPrice = parseFloat(item.price || item.close || '0');

  let currentPrice = preClose;
  if ((tradeStatus === 'PRE' || tradeStatus === 'POST') && extPrice > 0) {
    currentPrice = extPrice;
  } else if (regularPrice > 0) {
    currentPrice = regularPrice;
  } else if (extPrice > 0) {
    currentPrice = extPrice;
  }

  let change = 0;
  let changePercent = 0;
  if (preClose > 0 && currentPrice > 0) {
    change = currentPrice - preClose;
    changePercent = (change / preClose) * 100;
  } else {
    change = parseFloat(item.change || '0');
    changePercent = parseFloat(item.change_ratio || '0') * 100;
  }

  const sessionLabels: Record<string, string> = {
    PRE: 'ก่อนตลาดเปิด (Pre-Market)',
    REG: 'ตลาดปกติ (Regular)',
    RTH: 'ตลาดปกติ (Regular)',
    POST: 'หลังตลาดปิด (After-Hours)',
    CLOSED: 'ปิดตลาด (Closed)',
  };
  const sessionLabel = sessionLabels[tradeStatus] || 'ตลาดหุ้นสหรัฐฯ';

  const marketVal = parseFloat(item.market_value || '0');
  const peVal = item.pe_ratio;
  const pbVal = item.pb_ratio;
  const high52 = item.fifty_two_wk_high;
  const low52 = item.fifty_two_wk_low;
  const yieldVal = item.yield;

  const now = new Date();
  const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  return {
    symbol,
    currentPrice: Number(currentPrice < 10 ? currentPrice.toFixed(4) : currentPrice.toFixed(2)),
    preClose: Number(preClose < 10 ? preClose.toFixed(4) : preClose.toFixed(2)),
    change: Number(Math.abs(change) < 1 ? change.toFixed(4) : change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    tradeStatus,
    sessionLabel,
    volume: Math.round(parseFloat(item.volume || item.extend_hour_volume || '0')),
    marketCap: formatMarketCap(marketVal),
    rawMarketCap: marketVal,
    peRatio: peVal && parseFloat(peVal) > 0 ? parseFloat(peVal).toFixed(2) : '-',
    pbRatio: pbVal && parseFloat(pbVal) > 0 ? parseFloat(pbVal).toFixed(2) : '-',
    fiftyTwoWeekRange: high52 && low52 ? `$${parseFloat(low52).toFixed(2)} - $${parseFloat(high52).toFixed(2)}` : '-',
    yield: yieldVal && parseFloat(yieldVal) > 0 ? `${(parseFloat(yieldVal) * 100).toFixed(2)}%` : '0.00%',
    open: parseFloat(item.open || '0'),
    high: parseFloat(item.high || '0'),
    low: parseFloat(item.low || '0'),
    lastUpdated: timeString,
    source: 'Webull OpenAPI',
  };
}

/**
 * Main Handler สำหรับ Vercel Serverless Function: /api/webull/quote
 * 
 * @param req - HTTP Request
 * @param res - HTTP Response
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const symbol = (req.query.symbol || req.query.symbols || 'AAPL').toString().toUpperCase().trim();

  try {
    const quote = await fetchStockQuoteDirect(symbol);

    if (quote) {
      return res.status(200).json({
        success: true,
        data: quote,
      } as WebullQuoteApiResponse);
    }

    return res.status(200).json({
      success: false,
      data: null,
      message: `ไม่พบข้อมูลราคาหุ้น ${symbol} จาก Webull`,
    } as WebullQuoteApiResponse);
  } catch (error: any) {
    return res.status(error.status || 500).json({
      success: false,
      data: null,
      message: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Webull OpenAPI',
    } as WebullQuoteApiResponse);
  }
}
