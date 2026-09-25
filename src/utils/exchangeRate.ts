/**
 * Utility: exchangeRate.ts
 * จัดการการดึงและแคชอัตราแลกเปลี่ยนค่าเงิน USD/THB แบบเรียลไทม์
 * รองรับทั้ง Primary API และ Fallback API พร้อมจัดเก็บใน LocalStorage เพื่อให้โหลดได้ทันที
 */

const STORAGE_EXCHANGE_RATE_KEY = 'wealthflow_cached_exchange_rate';
const DEFAULT_FALLBACK_RATE = 33.45;

/**
 * ดึงอัตราแลกเปลี่ยนที่แคชไว้ล่าสุดใน LocalStorage
 * หากยังไม่มีข้อมูลในแคช จะใช้อัตราแลกเปลี่ยนอ้างอิงล่าสุดเป็นค่าเริ่มต้น
 * 
 * @returns อัตราแลกเปลี่ยน THB ต่อ 1 USD (ตัวเลข)
 */
export const getCachedExchangeRate = (): number => {
  try {
    const cached = localStorage.getItem(STORAGE_EXCHANGE_RATE_KEY);
    if (cached) {
      const parsed = parseFloat(cached);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading cached exchange rate:', err);
  }
  return DEFAULT_FALLBACK_RATE;
};

/**
 * บันทึกอัตราแลกเปลี่ยนล่าสุดลงใน LocalStorage สำหรับใช้งานแบบทันทีในการเปิดแอปครั้งถัดไป
 * 
 * @param rate - อัตราแลกเปลี่ยน THB ต่อ 1 USD
 * @returns void
 */
export const saveCachedExchangeRate = (rate: number): void => {
  try {
    if (rate > 0 && !isNaN(rate)) {
      localStorage.setItem(STORAGE_EXCHANGE_RATE_KEY, rate.toFixed(2));
    }
  } catch (err) {
    console.error('Error saving cached exchange rate:', err);
  }
};

/**
 * ดึงอัตราแลกเปลี่ยน USD/THB ล่าสุดจากเซิร์ฟเวอร์แบบเรียลไทม์
 * มีระบบดึงจาก Open Exchange Rates (Primary) และ Fallback API อัตโนมัติหากเกิดข้อผิดพลาด
 * 
 * @returns Promise คืนค่าตัวเลขอัตราแลกเปลี่ยน THB ต่อ 1 USD หรือ null หากล้มเหลว
 */
export const fetchLiveExchangeRate = async (): Promise<number | null> => {
  // 1. ลองดึงจาก Primary API (Open ER API)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && typeof data.rates.THB === 'number' && data.rates.THB > 0) {
        const liveRate = data.rates.THB;
        saveCachedExchangeRate(liveRate);
        return liveRate;
      }
    }
  } catch (primaryErr) {
    console.warn('Primary exchange rate API failed, trying fallback...', primaryErr);
  }

  // 2. ลองดึงจาก Fallback API (ExchangeRate-API)
  try {
    const fallbackRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      if (fallbackData && fallbackData.rates && typeof fallbackData.rates.THB === 'number' && fallbackData.rates.THB > 0) {
        const fallbackRate = fallbackData.rates.THB;
        saveCachedExchangeRate(fallbackRate);
        return fallbackRate;
      }
    }
  } catch (fallbackErr) {
    console.error('All exchange rate APIs failed:', fallbackErr);
  }

  // 3. หากเชื่อมต่อเน็ตไม่ได้ คืนค่าจากแคชเดิม
  return getCachedExchangeRate();
};
