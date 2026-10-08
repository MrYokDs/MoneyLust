/**
 * หมายเลขเวอร์ชันของระบบ MoneyLust ที่ดึงมาจาก package.json โดยอัตโนมัติ
 * กำหนดค่าผ่านตัวแปรระดับคอมไพเลอร์ __APP_VERSION__ ใน vite.config.ts
 */
export const APP_VERSION: string = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.4';
