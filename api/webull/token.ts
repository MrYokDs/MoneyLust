/**
 * Vercel Serverless Function: api/webull/token.ts
 * Proxy จัดการ Webull Access Token: ตรวจสอบสถานะ, ต่ออายุ (Refresh), และขอ Token ใหม่
 * รองรับการอัปเดตไฟล์ .env.local และ conf/token.txt บนเครื่องอัตโนมัติ
 */

import path from 'path';
import fs from 'fs';
import { executeWebullRequest, getWebullCredentials } from '../_webullCore.js';

export interface WebullTokenStatusResponse {
  success: boolean;
  token?: string;
  status?: string;
  isNormal?: boolean;
  isExpired?: boolean;
  expiresAt?: number;
  expiresDate?: string;
  daysRemaining?: number;
  hoursRemaining?: number;
  isVerified?: boolean;
  message?: string;
}

/**
 * บันทึก Token ใหม่ลงในไฟล์ .env.local และ conf/token.txt (เมื่อรันบนเครื่อง Localhost)
 * 
 * @param newToken - ค่า Token ใหม่ที่ต้องการบันทึก
 */
function persistNewToken(newToken: string): void {
  try {
    process.env.WEBULL_ACCESS_TOKEN = newToken;

    // 1. อัปเดต conf/token.txt
    const confDir = path.resolve(process.cwd(), 'conf');
    if (!fs.existsSync(confDir)) {
      fs.mkdirSync(confDir, { recursive: true });
    }
    fs.writeFileSync(path.join(confDir, 'token.txt'), newToken, 'utf-8');

    // 2. อัปเดต .env.local
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const regex = /^WEBULL_ACCESS_TOKEN=.*$/m;
      if (regex.test(content)) {
        const updated = content.replace(regex, `WEBULL_ACCESS_TOKEN=${newToken}`);
        fs.writeFileSync(envPath, updated, 'utf-8');
      } else {
        fs.appendFileSync(envPath, `\nWEBULL_ACCESS_TOKEN=${newToken}\n`, 'utf-8');
      }
    }
  } catch (err) {
    console.error('Failed to persist new Webull token:', err);
  }
}

/**
 * ดำเนินการจัดการ Token ผ่าน Webull OpenAPI โดยตรงด้วย Node.js
 * 
 * @param action - คำสั่ง ('status' | 'refresh' | 'create' | 'verify')
 * @param paramToken - Token ที่ต้องการตรวจสอบ (สำหรับ verify)
 * @returns ผลลัพธ์สถานะ Token
 */
async function processTokenAction(action: string, paramToken = ''): Promise<WebullTokenStatusResponse> {
  const creds = getWebullCredentials();
  const currentToken = paramToken || creds.token;

  if (action === 'status') {
    const data = await executeWebullRequest<any>({
      method: 'POST',
      uri: '/auth/tokens/check',
      body: { token: currentToken },
      credentials: { token: currentToken },
    });

    const expiresAt = data.expires_at || data.expires || 0;
    const now = Date.now() / 1000;
    const expSec = expiresAt > 1e11 ? expiresAt / 1000 : expiresAt;
    const daysLeft = expSec > 0 ? Math.max(0, (expSec - now) / 86400) : 0;
    const hoursLeft = expSec > 0 ? Math.max(0, (expSec - now) / 3600) : 0;

    let expDateStr = '-';
    if (expSec > 0) {
      const d = new Date(expSec * 1000);
      expDateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    }

    const isNormal = data.status === 'NORMAL';
    const isExpired = expSec > 0 ? now >= expSec : true;

    return {
      success: true,
      token: data.token || currentToken,
      status: data.status || 'UNKNOWN',
      isNormal: isNormal && !isExpired,
      isExpired,
      expiresAt,
      expiresDate: expDateStr,
      daysRemaining: Number(daysLeft.toFixed(1)),
      hoursRemaining: Number(hoursLeft.toFixed(1)),
    };
  }

  if (action === 'refresh') {
    const data = await executeWebullRequest<any>({
      method: 'POST',
      uri: '/openapi/auth/token/refresh',
      body: { token: currentToken },
      credentials: { token: currentToken },
    });

    const expiresAt = data.expires_at || data.expires || 0;
    const now = Date.now() / 1000;
    const expSec = expiresAt > 1e11 ? expiresAt / 1000 : expiresAt;
    const daysLeft = expSec > 0 ? Math.max(0, (expSec - now) / 86400) : 0;

    let expDateStr = '-';
    if (expSec > 0) {
      const d = new Date(expSec * 1000);
      expDateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    }

    const newToken = data.token || currentToken;
    if (newToken) {
      persistNewToken(newToken);
    }

    return {
      success: true,
      token: newToken,
      status: data.status || 'NORMAL',
      expiresAt,
      expiresDate: expDateStr,
      daysRemaining: Number(daysLeft.toFixed(1)),
      message: 'ต่ออายุ Token สำเร็จเรียบร้อย',
    };
  }

  if (action === 'create') {
    const data = await executeWebullRequest<any>({
      method: 'POST',
      uri: '/auth/tokens/create',
      body: {},
      credentials: { token: '' },
    });

    const candidateToken = data.token || '';
    const status = data.status || 'NOT_VERIFIED';

    return {
      success: true,
      token: candidateToken,
      status,
      message: 'ส่งคำขอไปยังแอป Webull เรียบร้อยแล้ว กรุณากดอนุมัติบนมือถือ',
    };
  }

  if (action === 'verify') {
    const tokenToCheck = paramToken || currentToken;
    const data = await executeWebullRequest<any>({
      method: 'POST',
      uri: '/auth/tokens/check',
      body: { token: tokenToCheck },
      credentials: { token: tokenToCheck },
    });

    const isVerified = data.status === 'NORMAL';
    if (isVerified && tokenToCheck) {
      persistNewToken(tokenToCheck);
    }

    return {
      success: true,
      token: tokenToCheck,
      status: data.status,
      isVerified,
      message: isVerified ? 'ยืนยันตัวตนสำเร็จแล้ว' : 'กำลังรอการอนุมัติบนแอป Webull...',
    };
  }

  return {
    success: false,
    message: `Unknown action: ${action}`,
  };
}

/**
 * Main Handler สำหรับ Vercel Serverless Function: /api/webull/token
 * 
 * @param req - HTTP Request
 * @param res - HTTP Response
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = (req.query.action || 'status').toString().toLowerCase();
  const candidateToken = (req.query.token || '').toString();

  try {
    const result = await processTokenAction(action, candidateToken);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการประมวลผล Token',
    });
  }
}
