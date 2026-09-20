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
  { label: '0.5% / วัน (เน้นมั่นคง)', value: '0.5' },
  { label: '1.0% / วัน (เป้าหมายมาตรฐาน)', value: '1.0' },
  { label: '1.5% / วัน (สายเทรดคล่องตัว)', value: '1.5' },
  { label: '2.0% / วัน (สาย Aggressive)', value: '2.0' },
  { label: '3.0% / วัน (สายซิ่ง)', value: '3.0' },
];
