/**
 * Utility Service: src/utils/webullTokenService.ts
 * ให้บริการตรวจสอบสถานะ, ต่ออายุ (Refresh), และขอ Access Token ใหม่จาก Webull OpenAPI
 */

export interface WebullTokenInfo {
  success: boolean;
  token?: string;
  status?: 'NORMAL' | 'NOT_VERIFIED' | 'EXPIRED' | 'UNKNOWN' | string;
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
 * ดึงสถานะและอายุคงเหลือของ Webull Access Token ปัจจุบัน
 * 
 * @returns Promise<WebullTokenInfo> ข้อมูลสถานะและวันหมดอายุของ Token
 */
export const fetchWebullTokenStatus = async (): Promise<WebullTokenInfo> => {
  try {
    const res = await fetch('/api/webull/token?action=status');
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      return { success: false, message: errData?.message || errData?.error || `HTTP Error ${res.status}` };
    }
    return await res.json();
  } catch (error: any) {
    return { success: false, message: error.message || 'ไม่สามารถเชื่อมต่อ Token Service ได้' };
  }
};

/**
 * ต่ออายุ (Refresh) Webull Access Token ปัจจุบัน เพื่อขยายวันหมดอายุโดยอัตโนมัติ
 * 
 * @returns Promise<WebullTokenInfo> ผลลัพธ์การต่ออายุ Token
 */
export const refreshWebullToken = async (): Promise<WebullTokenInfo> => {
  try {
    const res = await fetch('/api/webull/token?action=refresh', { method: 'POST' });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      return { success: false, message: errData?.message || errData?.error || `HTTP Error ${res.status}` };
    }
    return await res.json();
  } catch (error: any) {
    return { success: false, message: error.message || 'เกิดข้อผิดพลาดในการต่ออายุ Token' };
  }
};

/**
 * ส่งคำขอสร้าง Token ใหม่ (จะส่ง Push Notification ไปยังแอป Webull บนมือถือ)
 * 
 * @returns Promise<WebullTokenInfo> Candidate Token ที่รอการอนุมัติ
 */
export const createWebullToken = async (): Promise<WebullTokenInfo> => {
  try {
    const res = await fetch('/api/webull/token?action=create', { method: 'POST' });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      return { success: false, message: errData?.message || errData?.error || `HTTP Error ${res.status}` };
    }
    return await res.json();
  } catch (error: any) {
    return { success: false, message: error.message || 'เกิดข้อผิดพลาดในการส่งคำขอ Token' };
  }
};

/**
 * ตรวจสอบว่าผู้ใช้ได้กดอนุมัติ (Authorize) คำขอ Token ในแอป Webull แล้วหรือยัง
 * 
 * @param token - Candidate Token ที่ต้องการตรวจสอบ
 * @returns Promise<WebullTokenInfo> สถานะการอนุมัติ (isVerified)
 */
export const verifyWebullToken = async (token: string): Promise<WebullTokenInfo> => {
  try {
    const res = await fetch(`/api/webull/token?action=verify&token=${encodeURIComponent(token)}`, {
      method: 'POST',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      return { success: false, message: errData?.message || errData?.error || `HTTP Error ${res.status}` };
    }
    return await res.json();
  } catch (error: any) {
    return { success: false, message: error.message || 'เกิดข้อผิดพลาดในการตรวจสอบ Token' };
  }
};

/**
 * ส่งสัญญาณ Event แจ้งเตือนทั้งแอปว่า Token หมดอายุ เพื่อให้หน้าต่าง Modal เด้งขึ้นมาอัตโนมัติ
 * 
 * @param message - ข้อความแจ้งเตือนข้อผิดพลาด
 */
export const emitTokenExpiredEvent = (message?: string): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('webull-token-expired', {
        detail: { message: message || 'Webull Access Token หมดอายุ กรุณาขอ Token ใหม่' },
      })
    );
  }
};
