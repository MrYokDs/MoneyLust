/**
 * Vercel Serverless Function: api/webull/token.ts
 * Proxy จัดการ Webull Access Token: ตรวจสอบสถานะ, ต่ออายุ (Refresh), และขอ Token ใหม่
 * รองรับการอัปเดตไฟล์ .env.local และ conf/token.txt บนเครื่องอัตโนมัติ
 */

import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';

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
 * บันทึก Token ใหม่ลงในไฟล์ .env.local และ conf/token.txt
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
 * เรียกใช้ Python Bridge เพื่อจัดการ Token
 * 
 * @param action - การกระทำ ('status' | 'refresh' | 'create' | 'verify')
 * @param paramToken - Token ที่ต้องการตรวจสอบ (สำหรับ verify)
 * @returns Promise<WebullTokenStatusResponse> ผลลัพธ์จาก Webull SDK
 */
async function callTokenBridge(action: string, paramToken = ''): Promise<WebullTokenStatusResponse> {
  return new Promise((resolve) => {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'webull_token.py');
    execFile(
      'python',
      [scriptPath, action, paramToken],
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
          return resolve({ success: false, message: error?.message || 'Script execution failed' });
        }
        try {
          const parsed = JSON.parse(stdout.trim());
          return resolve(parsed);
        } catch {
          return resolve({ success: false, message: 'Invalid JSON response from bridge' });
        }
      }
    );
  });
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
    const result = await callTokenBridge(action, candidateToken);

    // หากคำสั่ง refresh หรือ verify สำเร็จและมี token ใหม่ ให้บันทึกลงเครื่องอัตโนมัติ
    if (result.success && result.token && (action === 'refresh' || (action === 'verify' && result.isVerified))) {
      persistNewToken(result.token);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการประมวลผล Token',
    });
  }
}
