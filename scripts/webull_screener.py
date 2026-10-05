"""
Bridge script: scripts/webull_screener.py
ดึงข้อมูลการจัดอันดับหุ้นสดจาก Webull OpenAPI ผ่าน official Python SDK
ส่งออกผลลัพธ์เป็น JSON สำหรับ Node.js / Next / Vite Serverless API
"""

import sys
import json
import os
from webull.core.client import ApiClient
from webull.data.request.screener.get_gainers_losers_request_v2 import GetGainersLosersRequestV2

def main():
    rank_type = sys.argv[1] if len(sys.argv) > 1 else 'PRE_MARKET'
    direction = sys.argv[2] if len(sys.argv) > 2 else 'DESC'
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 30

    app_key = os.environ.get('WEBULL_APP_KEY', '')
    app_secret = os.environ.get('WEBULL_APP_SECRET', '')
    region_id = os.environ.get('WEBULL_REGION_ID', 'th')
    token = os.environ.get('WEBULL_ACCESS_TOKEN', '')

    # ดึงค่าสำรองจาก conf/token.txt และ .env.local กรณีไม่ได้ส่งผ่าน environment
    if not token and os.path.exists('conf/token.txt'):
        try:
            with open('conf/token.txt', 'r', encoding='utf-8') as f:
                token = f.read().strip()
        except Exception:
            pass

    if (not app_key or not app_secret or not token) and os.path.exists('.env.local'):
        try:
            with open('.env.local', 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('WEBULL_APP_KEY=') and not app_key:
                        app_key = line.split('=', 1)[1].strip()
                    elif line.startswith('WEBULL_APP_SECRET=') and not app_secret:
                        app_secret = line.split('=', 1)[1].strip()
                    elif line.startswith('WEBULL_ACCESS_TOKEN=') and not token:
                        token = line.split('=', 1)[1].strip()
        except Exception:
            pass

    client = ApiClient(app_key, app_secret, region_id)
    client.set_token(token)

    req = GetGainersLosersRequestV2()
    req.set_category('US_STOCK')
    req.set_rank_type(rank_type)
    req.set_direction(direction)
    req.set_sort_by('CHANGE_RATIO')

    try:
        res = client.get_response(req)
        raw_items = res.json()
        if not isinstance(raw_items, list):
            print(json.dumps({'success': False, 'message': 'Invalid response', 'data': []}))
            return

        formatted = []
        for q in raw_items[:limit]:
            price = float(q.get('price') or q.get('close') or 0)
            change = float(q.get('change') or 0)
            change_ratio = float(q.get('change_ratio') or 0)
            change_percent = round(change_ratio * 100, 2)
            prev_price = float(q.get('pre_close') or (price - change))
            open_price = float(q.get('open') or prev_price)
            high_price = float(q.get('high') or max(price, open_price))
            low_price = float(q.get('low') or min(price, open_price))

            # สร้าง sparkline จุดราคา
            sparkline = [prev_price, open_price, low_price, high_price, price]

            formatted.append({
                'symbol': q.get('symbol', ''),
                'name': q.get('name', '') or q.get('symbol', ''),
                'price': price,
                'change': change,
                'changePercent': change_percent,
                'volume': int(float(q.get('volume') or 0)),
                'marketCap': int(float(q.get('market_value') or 0)),
                'sparkline': sparkline
            })

        print(json.dumps({'success': True, 'count': len(formatted), 'data': formatted}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e), 'data': []}))

if __name__ == '__main__':
    main()
