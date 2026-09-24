/**
 * Utility: dataBackup.ts
 * จัดการการสำรองข้อมูล (Export Backup) และกู้คืนข้อมูล (Import Backup)
 * เพื่อใช้ในการย้ายข้อมูลระหว่าง Localhost และเว็บจริง (Vercel) หรือจัดเก็บข้อมูลสำรอง
 */

export interface MoneyLustBackupPayload {
  appName: string;
  version: string;
  exportedAt: string;
  data: Record<string, string>;
}

export interface ImportResult {
  success: boolean;
  message: string;
  plansCount: number;
  portfoliosCount: number;
}

const BACKUP_KEYS = [
  'wealthflow_saved_plans',
  'wealthflow_portfolios',
  'wealthflow_investment_plan_form',
  'wealthflow_theme',
  'moneylust_trading_note_pos_v4',
  'moneylust_trading_note_minimized',
  'moneylust_finnhub_api_token',
];

/**
 * ดึงข้อมูลทั้งหมดใน LocalStorage ที่เกี่ยวข้องกับระบบ MoneyLust
 * 
 * @returns วัตถุ MoneyLustBackupPayload พร้อมข้อมูลและ Metadata
 */
export const getExportPayload = (): MoneyLustBackupPayload => {
  const data: Record<string, string> = {};

  BACKUP_KEYS.forEach((key) => {
    const val = localStorage.getItem(key);
    if (val !== null) {
      data[key] = val;
    }
  });

  return {
    appName: 'MoneyLust',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data,
  };
};

/**
 * ดาวน์โหลดข้อมูลสำรองเป็นไฟล์ JSON เข้าคอมพิวเตอร์
 * 
 * @returns ชื่อไฟล์ที่ดาวน์โหลด
 */
export const downloadBackupJson = (): string => {
  const payload = getExportPayload();
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `moneylust_backup_${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
};

/**
 * คัดลอกข้อมูลสำรองทั้งหมดลงในคลิปบอร์ด (Clipboard) เพื่อนำไปวางในเว็บ Vercel ได้ทันที
 * 
 * @returns Promise<boolean> คืนค่า true หากสำเร็จ
 */
export const copyBackupToClipboard = async (): Promise<boolean> => {
  try {
    const payload = getExportPayload();
    const jsonStr = JSON.stringify(payload);
    await navigator.clipboard.writeText(jsonStr);
    return true;
  } catch (e) {
    console.error('Failed to copy backup to clipboard:', e);
    return false;
  }
};

/**
 * นำเข้าข้อมูลสำรองจากสตริง JSON และบันทึกลงใน LocalStorage
 * 
 * @param jsonText - สตริง JSON ของไฟล์สำรอง
 * @returns ผลการนำเข้า ImportResult
 */
export const importBackupFromJson = (jsonText: string): ImportResult => {
  try {
    const parsed = JSON.parse(jsonText);
    let targetData: Record<string, string> | null = null;

    if (parsed && typeof parsed === 'object') {
      if (parsed.data && typeof parsed.data === 'object') {
        targetData = parsed.data;
      } else {
        // กรณีเป็น JSON แบบดิบ (raw localStorage dump)
        targetData = parsed;
      }
    }

    if (!targetData) {
      return {
        success: false,
        message: 'รูปแบบไฟล์ไม่ถูกต้อง หรือไม่พบข้อมูล',
        plansCount: 0,
        portfoliosCount: 0,
      };
    }

    // บันทึกลง LocalStorage
    let countPlans = 0;
    let countPortfolios = 0;

    Object.entries(targetData).forEach(([key, val]) => {
      if (typeof val === 'string') {
        localStorage.setItem(key, val);
        if (key === 'wealthflow_saved_plans') {
          try {
            const arr = JSON.parse(val);
            if (Array.isArray(arr)) countPlans = arr.length;
          } catch {
            // ignore
          }
        }
        if (key === 'wealthflow_portfolios') {
          try {
            const arr = JSON.parse(val);
            if (Array.isArray(arr)) countPortfolios = arr.length;
          } catch {
            // ignore
          }
        }
      }
    });

    return {
      success: true,
      message: `นำเข้าข้อมูลสำเร็จ (${countPlans} แผนการเทรด, ${countPortfolios} พอร์ตโฟลิโอ)`,
      plansCount: countPlans,
      portfoliosCount: countPortfolios,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการอ่านไฟล์: ${err.message || 'รูปแบบไม่ถูกต้อง'}`,
      plansCount: 0,
      portfoliosCount: 0,
    };
  }
};
