/**
 * Module: api/_webullCore.js
 * Core Webull OpenAPI helper for Vercel Serverless Functions and Vite Dev Server
 * Prefixed with underscore (_) so Vercel ignores it as an API route.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Encode string following RFC 3986 (matches Python quote(..., safe=''))
 * @param {string} str
 * @returns {string}
 */
export function rfc3986Quote(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * Resolve credentials from process.env or local config files
 * @returns {{ appKey: string, appSecret: string, token: string, host: string }}
 */
export function getWebullCredentials() {
  let appKey = process.env.WEBULL_APP_KEY || '';
  let appSecret = process.env.WEBULL_APP_SECRET || '';
  let token = process.env.WEBULL_ACCESS_TOKEN || '';
  let host = process.env.WEBULL_API_HOST || 'https://api.webull.co.th';

  host = host.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();

  // Try reading from conf/token.txt or .env.local only if in local development
  try {
    if (!token) {
      const tokenPath = path.resolve(process.cwd(), 'conf', 'token.txt');
      if (fs.existsSync(tokenPath)) {
        token = fs.readFileSync(tokenPath, 'utf-8').trim();
      }
    }

    if (!appKey || !appSecret || !token) {
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
    }
  } catch {
    // Read-only filesystem on Vercel or missing files: ignore safely
  }

  return { appKey, appSecret, token, host: host || 'api.webull.co.th' };
}

/**
 * Build signed headers for Webull OpenAPI
 */
export function buildSignedHeaders(host, uri, queries, body, appKey, appSecret, token) {
  const creds = getWebullCredentials();
  const effectiveAppKey = appKey || creds.appKey;
  const effectiveAppSecret = appSecret || creds.appSecret;
  const effectiveToken = token !== undefined ? token : creds.token;

  const nowIso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const nonce = crypto.randomUUID();

  const signParams = {
    host: host,
    'x-app-key': effectiveAppKey,
    'x-timestamp': nowIso,
    'x-signature-version': '1.0',
    'x-signature-algorithm': 'HMAC-SHA256',
    'x-signature-nonce': nonce,
  };

  if (queries) {
    for (const [key, value] of Object.entries(queries)) {
      if (value !== undefined && value !== null) {
        signParams[key] = String(value);
      }
    }
  }

  let bodyString = null;
  let rawBody = null;
  if (body !== undefined && body !== null) {
    rawBody = JSON.stringify(body);
    bodyString = crypto.createHash('sha256').update(rawBody).digest('hex').toUpperCase();
  }

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

  const headers = {
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
 * Execute HTTP Request to Webull OpenAPI
 */
export async function executeWebullRequest(options) {
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

  const fetchOptions = {
    method: options.method,
    headers,
  };

  if (options.method === 'POST' && options.body !== undefined && options.body !== null) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    let errorJson;
    try {
      errorJson = JSON.parse(errorText);
    } catch {
      errorJson = { message: errorText };
    }
    const err = new Error(errorJson.message || `Webull API Error (Status ${response.status})`);
    err.status = response.status;
    err.data = errorJson;
    throw err;
  }

  return await response.json();
}
