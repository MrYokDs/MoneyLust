"""
Bridge script: scripts/webull_quote.py
ดึงข้อมูล Snapshot ราคาหุ้น Real-time จาก Webull OpenAPI ผ่าน official Python SDK
ส่งออกผลลัพธ์เป็น JSON พร้อมราคาล่าสุด, % การเปลี่ยนแปลงจากวันก่อนหน้า ณ เวลานั้น, สถานะตลาด และข้อมูลพื้นฐาน
"""

import sys
import json
import os
import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from webull.core.client import ApiClient
from webull.data.quotes.market_data import MarketData

def format_market_cap(val):
    if not val or val <= 0:
        return '-'
    if val >= 1e12:
        return f"${val / 1e12:.2f}T"
    if val >= 1e9:
        return f"${val / 1e9:.2f}B"
    if val >= 1e6:
        return f"${val / 1e6:.2f}M"
    return f"${val:,.0f}"

def main():
    symbol = sys.argv[1].upper().strip() if len(sys.argv) > 1 else 'AAPL'

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

    try:
        md = MarketData(client)
        res = md.get_snapshot([symbol], 'US_STOCK', extend_hour_required=True, overnight_required=False)
        items = res.json()

        if not isinstance(items, list) or len(items) == 0:
            print(json.dumps({'success': False, 'message': f'ไม่พบข้อมูลหุ้น {symbol}', 'data': None}))
            return

        item = items[0]
        trade_status = item.get('trade_status') or 'REG'
        
        # ราคาปิดวันก่อนหน้า
        pre_close = float(item.get('pre_close') or 0)

        # ราคา ณ เวลานั้น (รวมช่วงก่อน/หลังตลาดปิด)
        ext_price = float(item.get('extend_hour_last_price') or 0)
        regular_price = float(item.get('price') or item.get('close') or 0)

        if trade_status in ('PRE', 'POST') and ext_price > 0:
            current_price = ext_price
        elif regular_price > 0:
            current_price = regular_price
        elif ext_price > 0:
            current_price = ext_price
        else:
            current_price = pre_close

        # คำนวณการเปลี่ยนแปลงจากวันก่อนหน้า ณ เวลานั้น
        if pre_close > 0 and current_price > 0:
            change = current_price - pre_close
            change_percent = (change / pre_close) * 100
        else:
            change = float(item.get('change') or 0)
            change_percent = float(item.get('change_ratio') or 0) * 100

        # ป้ายสถานะตลาด
        session_labels = {
            'PRE': 'ก่อนตลาดเปิด (Pre-Market)',
            'REG': 'ตลาดปกติ (Regular)',
            'POST': 'หลังตลาดปิด (After-Hours)',
            'CLOSED': 'ปิดตลาด (Closed)'
        }
        session_label = session_labels.get(trade_status, 'ตลาดหุ้นสหรัฐฯ')

        # ข้อมูลปัจจัยพื้นฐาน
        market_val = float(item.get('market_value') or 0)
        market_cap_formatted = format_market_cap(market_val)

        pe_val = item.get('pe_ratio')
        pe_ratio = f"{float(pe_val):.2f}" if pe_val and float(pe_val) > 0 else '-'

        pb_val = item.get('pb_ratio')
        pb_ratio = f"{float(pb_val):.2f}" if pb_val and float(pb_val) > 0 else '-'

        high_52 = item.get('fifty_two_wk_high')
        low_52 = item.get('fifty_two_wk_low')
        if high_52 and low_52:
            fifty_two_week_range = f"${float(low_52):.2f} - ${float(high_52):.2f}"
        else:
            fifty_two_week_range = '-'

        yield_val = item.get('yield')
        dividend_yield = f"{float(yield_val) * 100:.2f}%" if yield_val and float(yield_val) > 0 else '0.00%'

        result = {
            'success': True,
            'data': {
                'symbol': symbol,
                'currentPrice': round(current_price, 4 if current_price < 10 else 2),
                'preClose': round(pre_close, 4 if pre_close < 10 else 2),
                'change': round(change, 4 if abs(change) < 1 else 2),
                'changePercent': round(change_percent, 2),
                'tradeStatus': trade_status,
                'sessionLabel': session_label,
                'volume': int(float(item.get('volume') or item.get('extend_hour_volume') or 0)),
                'marketCap': market_cap_formatted,
                'rawMarketCap': market_val,
                'peRatio': pe_ratio,
                'pbRatio': pb_ratio,
                'fiftyTwoWeekRange': fifty_two_week_range,
                'yield': dividend_yield,
                'open': float(item.get('open') or 0),
                'high': float(item.get('high') or 0),
                'low': float(item.get('low') or 0),
                'lastUpdated': datetime.datetime.now().strftime('%H:%M:%S'),
                'source': 'Webull OpenAPI'
            }
        }
        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({'success': False, 'message': str(e), 'data': None}, ensure_ascii=False))

if __name__ == '__main__':
    main()
