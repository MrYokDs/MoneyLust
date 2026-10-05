"""
Bridge script: scripts/webull_token.py
จัดการ Webull Access Token ผ่าน official Python SDK
รองรับคำสั่ง: status, refresh, create, verify
"""

import sys
import json
import os
import datetime
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from webull.core.client import ApiClient
from webull.core.http.initializer.token.token_operation import TokenOperation

def main():
    action = sys.argv[1].lower().strip() if len(sys.argv) > 1 else 'status'
    param_token = sys.argv[2].strip() if len(sys.argv) > 2 else ''

    app_key = os.environ.get('WEBULL_APP_KEY', '')
    app_secret = os.environ.get('WEBULL_APP_SECRET', '')
    region_id = os.environ.get('WEBULL_REGION_ID', 'th')
    current_token = param_token or os.environ.get('WEBULL_ACCESS_TOKEN', '')

    # ดึงค่าสำรองจาก conf/token.txt และ .env.local กรณีไม่ได้ส่งผ่าน environment
    if not current_token and os.path.exists('conf/token.txt'):
        try:
            with open('conf/token.txt', 'r', encoding='utf-8') as f:
                current_token = f.read().strip()
        except Exception:
            pass

    if (not app_key or not app_secret or not current_token) and os.path.exists('.env.local'):
        try:
            with open('.env.local', 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('WEBULL_APP_KEY=') and not app_key:
                        app_key = line.split('=', 1)[1].strip()
                    elif line.startswith('WEBULL_APP_SECRET=') and not app_secret:
                        app_secret = line.split('=', 1)[1].strip()
                    elif line.startswith('WEBULL_ACCESS_TOKEN=') and not current_token:
                        current_token = line.split('=', 1)[1].strip()
        except Exception:
            pass

    client = ApiClient(app_key, app_secret, region_id)
    if current_token:
        client.set_token(current_token)

    top = TokenOperation(client)

    try:
        if action == 'status':
            res = top.check_token(current_token)
            data = res.json()
            expires_at = data.get('expires_at') or data.get('expires') or 0
            now = time.time()
            exp_sec = expires_at / 1000 if expires_at > 1e11 else expires_at
            days_left = max(0, (exp_sec - now) / 86400) if exp_sec > 0 else 0
            hours_left = max(0, (exp_sec - now) / 3600) if exp_sec > 0 else 0

            exp_date_str = datetime.datetime.fromtimestamp(exp_sec).strftime('%d/%m/%Y %H:%M:%S') if exp_sec > 0 else '-'

            is_normal = data.get('status') == 'NORMAL'
            is_expired = now >= exp_sec if exp_sec > 0 else True

            print(json.dumps({
                'success': True,
                'token': data.get('token') or current_token,
                'status': data.get('status', 'UNKNOWN'),
                'isNormal': is_normal and not is_expired,
                'isExpired': is_expired,
                'expiresAt': expires_at,
                'expiresDate': exp_date_str,
                'daysRemaining': round(days_left, 1),
                'hoursRemaining': round(hours_left, 1),
            }))

        elif action == 'refresh':
            res = top.refresh_token(current_token)
            data = res.json()
            expires_at = data.get('expires_at') or data.get('expires') or 0
            now = time.time()
            exp_sec = expires_at / 1000 if expires_at > 1e11 else expires_at
            days_left = max(0, (exp_sec - now) / 86400) if exp_sec > 0 else 0

            exp_date_str = datetime.datetime.fromtimestamp(exp_sec).strftime('%d/%m/%Y %H:%M:%S') if exp_sec > 0 else '-'

            print(json.dumps({
                'success': True,
                'token': data.get('token') or current_token,
                'status': data.get('status', 'NORMAL'),
                'expiresAt': expires_at,
                'expiresDate': exp_date_str,
                'daysRemaining': round(days_left, 1),
                'message': 'ต่ออายุ Token สำเร็จเรียบร้อย'
            }))

        elif action == 'create':
            res = top.create_token(None)
            data = res.json()
            candidate_token = data.get('token') or ''
            status = data.get('status') or 'NOT_VERIFIED'

            print(json.dumps({
                'success': True,
                'token': candidate_token,
                'status': status,
                'message': 'ส่งคำขอไปยังแอป Webull เรียบร้อยแล้ว กรุณากดอนุมัติบนมือถือ'
            }))

        elif action == 'verify':
            token_to_check = param_token or current_token
            res = top.check_token(token_to_check)
            data = res.json()
            is_verified = data.get('status') == 'NORMAL'
            expires_at = data.get('expires_at') or data.get('expires') or 0
            now = time.time()
            exp_sec = expires_at / 1000 if expires_at > 1e11 else expires_at
            days_left = max(0, (exp_sec - now) / 86400) if exp_sec > 0 else 0
            exp_date_str = datetime.datetime.fromtimestamp(exp_sec).strftime('%d/%m/%Y %H:%M:%S') if exp_sec > 0 else '-'

            print(json.dumps({
                'success': True,
                'token': token_to_check,
                'status': data.get('status', 'NOT_VERIFIED'),
                'isVerified': is_verified,
                'expiresAt': expires_at,
                'expiresDate': exp_date_str,
                'daysRemaining': round(days_left, 1),
            }))

        else:
            print(json.dumps({'success': False, 'message': f'Unknown action {action}'}))

    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

if __name__ == '__main__':
    main()
