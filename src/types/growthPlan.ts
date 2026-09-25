import { CurrencyMode } from './stock';

/**
 * รายละเอียดข้อมูลการเติบโตแบบทบต้นในแต่ละวัน
 */
export interface DailyGrowthItem {
  /** วันที่ (Day 1, Day 2, ...) */
  day: number;
  /** เงินต้น ณ ต้นวัน */
  startingBalance: number;
  /** กำไรเป้าหมายประจำวัน (จำนวนเงิน) */
  dailyProfit: number;
  /** % กำไรเป้าหมายประจำวัน */
  dailyReturnPercent: number;
  /** ยอดเงินปลายวันสะสม */
  endingBalance: number;
  /** กำไรสะสมทั้งหมดตั้งแต่เริ่มต้น */
  cumulativeProfit: number;
  /** % อัตราผลตอบแทนสะสมทั้งหมด */
  cumulativeReturnPercent: number;
  /** % ความคืบหน้าสู่เป้าหมายปลายทาง */
  progressPercent: number;
}

/**
 * ค่าพารามิเตอร์การตั้งค่าสำหรับแผนการเติบโตของเงินลงทุน
 */
export interface GrowthPlanConfig {
  /** เงินต้นเริ่มต้น */
  initialCapital: number;
  /** % ผลตอบแทนคาดหวังต่อวัน */
  dailyReturnPercent: number;
  /** มูลค่าเป้าหมายของพอร์ต */
  targetAmount: number;
  /** รหัสพอร์ตการลงทุนที่เชื่อมโยง (ถ้ามี เช่น 'unassigned' หรือ id พอร์ต หรือ 'none') */
  portfolioId: string;
  /** สกุลเงิน ('THB' หรือ 'USD') */
  currency: CurrencyMode;
  /** อัตราแลกเปลี่ยนอ้างอิง */
  exchangeRate?: number;
  /** วันเวลาที่บันทึกแผน */
  updatedAt?: string;
}

/**
 * ข้อมูลการเปรียบเทียบพอร์ตจริงกับแผนการลงทุน (Benchmark)
 */
export interface PortfolioBenchmark {
  /** มูลค่าพอร์ตจริงปัจจุบัน */
  currentPortfolioValue: number;
  /** เทียบเท่ากับแผนในวันที่ (Day) ที่มูลค่าพอร์ตปัจจุบันไปถึง */
  matchedDay: number;
  /** ยอดเงินตามแผนในวันที่เทียบเท่า */
  planBalanceAtMatchedDay: number;
  /** ส่วนต่างระหว่างพอร์ตจริงกับยอดตามแผน ณ วันนั้น */
  differenceAmount: number;
  /** % ความคืบหน้าของพอร์ตจริงสู่เป้าหมาย */
  progressPercent: number;
  /** จำนวนวันที่ต้องเดินหน้าต่อเพื่อบรรลุเป้าหมายตามแผน */
  remainingDays: number;
  /** สถานะเมื่อเทียบกับแผน ('ahead' | 'on_track' | 'behind' | 'achieved') */
  status: 'ahead' | 'on_track' | 'behind' | 'achieved';
  /** วันที่เริ่มต้นเทรดของพอร์ต (ISO String) */
  firstTradeDate?: string;
  /** จำนวนวันทำการเทรด (จันทร์-ศุกร์) ที่ผ่านไปแล้วนับจากวันเริ่มเทรดวันแรก */
  elapsedTradingDays: number;
  /** วันที่ควรจะอยู่ตามระยะเวลาของแผน (Expected Day) */
  expectedDay: number;
  /** ยอดเงินที่ควรจะได้ตามแผน ณ วันที่ควรจะอยู่ */
  expectedBalance: number;
  /** % ความคืบหน้าที่ควรจะได้ตามแผน ณ วันที่ควรจะอยู่ */
  expectedProgressPercent: number;
  /** จำนวนวันที่ช้ากว่าแผน (> 0 คือช้ากว่า X วัน, < 0 คือเร็วกว่า X วัน, 0 คือตรงตามวัน) */
  daysBehind: number;
  /** % ความคืบหน้าที่ช้ากว่าแผน (> 0 คือช้ากว่า X%, < 0 คือเร็วกว่า X%, 0 คือตรงเป้า) */
  progressBehindPercent: number;
  /** ข้อความสรุปสถานะการเปรียบเทียบเป็นภาษาไทย */
  summaryText: string;
}

/**
 * ผลลัพธ์จากการคำนวณแผนการลงทุนทบต้น
 */
export interface GrowthPlanResult {
  /** การตั้งค่าที่ใช้คำนวณ */
  config: GrowthPlanConfig;
  /** จำนวนวันทั้งหมดที่ต้องใช้จนถึงเป้าหมาย */
  totalDays: number;
  /** รายการแจกแจงรายวัน */
  items: DailyGrowthItem[];
  /** ข้อมูลเปรียบเทียบกับพอร์ตจริง (หากเลือกเชื่อมโยง) */
  benchmark?: PortfolioBenchmark;
}
