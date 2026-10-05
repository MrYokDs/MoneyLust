/**
 * Vercel Serverless Function: api/webull/quote.ts
 * Proxy สำหรับดึงข้อมูล Snapshot ราคาหุ้น Real-time จาก Webull OpenAPI 100% ผ่าน Python Bridge
 */

import { execFile } from 'child_process';
import path from 'path';

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
 * ดึงข้อมูล Snapshot ราคาหุ้น Real-time จาก Webull OpenAPI ผ่าน Python Bridge
 * 
 * @param symbol - รหัสย่อหุ้น เช่น AAPL, NVDA, TSLA
 * @returns Promise<WebullStockQuote | null> ข้อมูลราคาและสถานะตลาด
 */
async function fetchStockQuoteFromSdk(symbol: string): Promise<WebullStockQuote | null> {
  return new Promise((resolve) => {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'webull_quote.py');
    execFile(
      'python',
      [scriptPath, symbol],
      {
        env: {
          ...process.env,
          WEBULL_APP_KEY: process.env.WEBULL_APP_KEY || '',
          WEBULL_APP_SECRET: process.env.WEBULL_APP_SECRET || '',
          WEBULL_ACCESS_TOKEN: process.env.WEBULL_ACCESS_TOKEN || '',
        },
        timeout: 8000,
      },
      (error, stdout) => {
        if (error || !stdout) {
          return resolve(null);
        }
        try {
          const parsed = JSON.parse(stdout.trim());
          if (parsed.success && parsed.data) {
            return resolve(parsed.data);
          }
        } catch {
          // ignore parse error
        }
        resolve(null);
      }
    );
  });
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
    const quote = await fetchStockQuoteFromSdk(symbol);

    if (quote) {
      return res.status(200).json({
        success: true,
        data: quote,
      } as WebullQuoteApiResponse);
    }

    return res.status(200).json({
      success: false,
      data: null,
      message: `ไม่สามารถดึงข้อมูลราคา Real-Time ของหุ้น ${symbol} จาก Webull ได้`,
    } as WebullQuoteApiResponse);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Webull OpenAPI',
    } as WebullQuoteApiResponse);
  }
}
