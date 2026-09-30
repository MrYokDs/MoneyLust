/**
 * Vercel Serverless Function: /api/stock-search
 * พร็อกซีค้นหาสัญลักษณ์หุ้นจาก Yahoo Finance API พร้อมจำลอง Header เพื่อป้องกัน 429 Too Many Requests
 *
 * @param {import('@vercel/node').VercelRequest} req - คำขอ HTTP ที่ส่งเข้ามา
 * @param {import('@vercel/node').VercelResponse} res - การตอบกลับ HTTP
 */
export default async function handler(req, res) {
  // กำหนด CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q, quotesCount = '8', newsCount = '0' } = req.query;

  if (!q || !q.toString().trim()) {
    return res.status(200).json({ quotes: [] });
  }

  try {
    const queryStr = q.toString().trim();
    const targetUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
      queryStr
    )}&quotesCount=${quotesCount}&newsCount=${newsCount}`;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://finance.yahoo.com',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Yahoo Finance returned status ${response.status}`);
      return res.status(response.status).json({ quotes: [] });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in Vercel /api/stock-search serverless function:', error);
    return res.status(500).json({ quotes: [], error: 'Failed to fetch stock search results' });
  }
}
