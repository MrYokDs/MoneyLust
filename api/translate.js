/**
 * Vercel Serverless Function: /api/translate
 * พร็อกซีแปลภาษาข้อความสรุปบริษัทผ่าน Google Translate API
 *
 * @param {import('@vercel/node').VercelRequest} req - คำขอ HTTP ที่ส่งเข้ามา
 * @param {import('@vercel/node').VercelResponse} res - การตอบกลับ HTTP
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { client = 'gtx', sl = 'en', tl = 'th', dt = 't', q } = req.query;

  if (!q) {
    return res.status(200).json([]);
  }

  try {
    const targetUrl = `https://translate.googleapis.com/translate_a/single?client=${client}&sl=${sl}&tl=${tl}&dt=${dt}&q=${encodeURIComponent(
      q.toString()
    )}`;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json([]);
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in Vercel /api/translate serverless function:', error);
    return res.status(500).json([]);
  }
}
