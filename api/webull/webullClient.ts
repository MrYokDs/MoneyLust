/**
 * Module: api/webull/webullClient.ts
 * โมดูลเชื่อมต่อ Webull OpenAPI ด้วย Node.js / TypeScript เพียวๆ 100%
 * คำนวณ HMAC-SHA256 Signature ตามมาตรฐานของ Webull โดยใช้โมดูล crypto ของ Node.js
 * รองรับการทำงานทั้งบน Localhost (Vite) และ Vercel Serverless Functions โดยไม่ต้องใช้ Python
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface WebullCredentials {
  appKey: string;
  appSecret: string;
  token: string;
  host: string;
}

export interface WebullRequestOptions {
  method: 'GET' | 'POST';
  uri: string;
  queries?: Record<string, string>;
  body?: Record<string, any>;
  credentials?: Partial<WebullCredentials>;
}

/**
 * เข้ารหัสสตริงตามมาตรฐาน RFC 3986 เพื่อให้ตรงกับฟังก์ชัน quote(..., safe='') ของ Python
 * 
 * @param str - ข้อความที่ต้องการเข้ารหัส
 * @returns ข้อความที่เข้ารหัสตามมาตรฐาน RFC 3986
 */
export function rfc3986Quote(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * ดึงข้อมูล Credentials สำหรับเชื่อมต่อ Webull OpenAPI
 * รองรับการอ่านจาก process.env (Vercel) และไฟล์คอนฟิกในเครื่อง (.env.local, conf/token.txt)
 * 
 * @returns ออบเจกต์ WebullCredentials ที่พร้อมใช้งาน
 */
export function getWebullCredentials(): WebullCredentials {
  let appKey = process.env.WEBULL_APP_KEY || '';
  let appSecret = process.env.WEBULL_APP_SECRET || '';
  let token = process.env.WEBULL_ACCESS_TOKEN || '';
  let host = process.env.WEBULL_API_HOST || 'https://api.webull.co.th';

  // ลบ https:// หรือ http:// ออกจาก host หากมี
  host = host.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();

  // อ่านจาก conf/token.txt หากใน environment ยังไม่มี token
  if (!token) {
    try {
      const tokenPath = path.resolve(process.cwd(), 'conf', 'token.txt');
      if (fs.existsSync(tokenPath)) {
        token = fs.readFileSync(tokenPath, 'utf-8').trim();
      }
    } catch {
      // ละเว้นข้อผิดพลาดกรณีไม่มีไฟล์
    }
  }

  // อ่านจาก .env.local กรณีรันใน Local Dev
  if (!appKey || !appSecret || !token) {
    try {
      const envPath = path.resolve(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('WEBULL_APP_KEY=') && !appKey) {
            appKey = trimmed.split('=', 2)[1].trim();
          } else if (trimmed.startsWith('WEBULL_APP_SECRET=') && !appSecret) {
            appSecret = trimmed.split('=', 2)[1].trim();
          } else if (trimmed.startsWith('WEBULL_ACCESS_TOKEN=') && !token) {
            token = trimmed.split('=', 2)[1].trim();
          } else if (trimmed.startsWith('WEBULL_API_HOST=') && !host) {
            host = trimmed.split('=', 2)[1].replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
          }
        }
      }
    } catch {
      // ละเว้นข้อผิดพลาด
    }
  }

  return { appKey, appSecret, token, host: host || 'api.webull.co.th' };
}

/**
 * คำนวณ HMAC-SHA256 Signature และประกอบ Headers สำหรับ Webull OpenAPI
 * 
 * @param host - โดเมนของ Webull API เช่น api.webull.co.th
 * @param uri - เส้นทาง API เช่น /market-data/stocks/snapshots/list
 * @param queries - พารามิเตอร์ Query String
 * @param body - ข้อมูล Body สำหรับคำขอ POST
 * @param appKey - รหัส Webull App Key
 * @param appSecret - รหัส Webull App Secret
 * @param token - Webull Access Token
 * @returns ออบเจกต์ Headers ที่ผ่านการลงนามเรียบร้อยแล้ว
 */
export function buildSignedHeaders(
  host: string,
  uri: string,
  queries?: Record<string, string>,
  body?: Record<string, any>,
  appKey?: string,
  appSecret?: string,
  token?: string
): Record<string, string> {
  const creds = getWebullCredentials();
  const effectiveAppKey = appKey || creds.appKey;
  const effectiveAppSecret = appSecret || creds.appSecret;
  const effectiveToken = token !== undefined ? token : creds.token;

  const nowIso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const nonce = crypto.randomUUID();

  const signParams: Record<string, string> = {
    host: host,
    'x-app-key': effectiveAppKey,
    'x-timestamp': nowIso,
    'x-signature-version': '1.0',
    'x-signature-algorithm': 'HMAC-SHA256',
    'x-signature-nonce': nonce,
  };

  // รวม query params เข้าใน signParams
  if (queries) {
    for (const [key, value] of Object.entries(queries)) {
      if (value !== undefined && value !== null) {
        signParams[key] = String(value);
      }
    }
  }

  // คำนวณ Body Hash (SHA-256 Hex Digest) ถ้ามี body
  let bodyString: string | null = null;
  let rawBody: string | null = null;

  if (body !== undefined && body !== null) {
    rawBody = JSON.stringify(body);
    bodyString = crypto.createHash('sha256').update(rawBody).digest('hex').toUpperCase();
  }

  // เรียงลำดับคีย์ตามตัวอักษรเพื่อสร้าง String to Sign
  const sortedKeys = Object.keys(signParams).sort();
  const sortedArray = sortedKeys.map((k) => `${k}=${signParams[k]}`);

  let stringToSign = uri;
  if (stringToSign) {
    stringToSign = `${stringToSign}&${sortedArray.join('&')}`;
  } else {
    stringToSign = sortedArray.join('&');
  }

  if (bodyString) {
    stringToSign = `${stringToSign}&${bodyString}`;
  }

  const encodedStringToSign = rfc3986Quote(stringToSign);
  const signature = crypto
    .createHmac('sha256', `${effectiveAppSecret}&`)
    .update(encodedStringToSign)
    .digest('base64');

  const headers: Record<string, string> = {
    Host: host,
    'x-version': 'v3',
    'x-app-key': effectiveAppKey,
    'x-timestamp': nowIso,
    'x-signature-version': '1.0',
    'x-signature-algorithm': 'HMAC-SHA256',
    'x-signature-nonce': nonce,
    'x-signature': signature,
    'x-webull-client-source': 'sdk',
    'User-Agent': 'WebullApiSDK',
  };

  if (effectiveToken) {
    headers['x-access-token'] = effectiveToken;
  }

  if (rawBody !== null) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

/**
 * ส่งคำขอ HTTP ไปยัง Webull OpenAPI โดยตรง (Pure Node.js)
 * 
 * @param options - ตัวเลือกคำขอ เช่น method, uri, queries, body
 * @returns ผลลัพธ์ข้อมูลที่ตอบกลับมาจาก Webull ในรูปแบบ JSON
 */
export async function executeWebullRequest<T = any>(options: WebullRequestOptions): Promise<T> {
  const creds = getWebullCredentials();
  const host = options.credentials?.host || creds.host;
  const appKey = options.credentials?.appKey || creds.appKey;
  const appSecret = options.credentials?.appSecret || creds.appSecret;
  const token = options.credentials?.token !== undefined ? options.credentials.token : creds.token;

  const headers = buildSignedHeaders(
    host,
    options.uri,
    options.queries,
    options.body,
    appKey,
    appSecret,
    token
  );

  let url = `https://${host}${options.uri}`;
  if (options.queries && Object.keys(options.queries).length > 0) {
    const searchParams = new URLSearchParams();
    for (const [k, v] of Object.entries(options.queries)) {
      if (v !== undefined && v !== null) {
        searchParams.append(k, String(v));
      }
    }
    url += `?${searchParams.toString()}`;
  }

  const fetchOptions: RequestInit = {
    method: options.method,
    headers,
  };

  if (options.method === 'POST' && options.body !== undefined && options.body !== null) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    let errorJson: any;
    try {
      errorJson = JSON.parse(errorText);
    } catch {
      errorJson = { message: errorText };
    }
    const err = new Error(errorJson.message || `Webull API Error (Status ${response.status})`);
    (err as any).status = response.status;
    (err as any).data = errorJson;
    throw err;
  }

  return (await response.json()) as T;
}
