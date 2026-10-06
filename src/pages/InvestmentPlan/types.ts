import { CurrencyMode } from '../../types';

/**
 * รูปแบบของฟอร์มกรอกข้อมูลแผนการลงทุนทบต้น
 */
export interface GrowthPlanFormData {
  /** เงินต้นเริ่มต้น */
  initialCapital: string;
  /** % ผลตอบแทนคาดหวังต่อวัน */
  dailyReturnPercent: string;
  /** มูลค่าเป้าหมายของพอร์ต */
  targetAmount: string;
  /** รหัสพอร์ตที่เชื่อมโยง ('none' | 'unassigned' | portfolio.id) */
  portfolioId: string;
  /** สกุลเงินที่ใช้ ('THB' | 'USD') */
  currency: CurrencyMode;
  /** อัตราแลกเปลี่ยน (บาทต่อ 1 USD) */
  exchangeRate: string;
}

/**
 * Preset อัตราผลตอบแทนต่อวันที่ใช้บ่อย
 */
export interface DailyReturnPreset {
  label: string;
  value: string;
}

export const DAILY_RETURN_PRESETS: DailyReturnPreset[] = [
  { label: '10% / วัน', value: '10' },
  { label: '15% / วัน', value: '15' },
  { label: '20% / วัน', value: '20' },
  { label: '25% / วัน', value: '25' },
  { label: '30% / วัน', value: '30' },
  { label: '35% / วัน', value: '35' },
];
