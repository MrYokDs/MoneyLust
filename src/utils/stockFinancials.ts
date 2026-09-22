/**
 * Utility: stockFinancials.ts
 * รวบรวมฟังก์ชันคำนวณและเปรียบเทียบตัวเลขงบการเงิน ประเมินแนวโน้ม (ดีขึ้น/แย่ลง) และคำนวณ % การเปลี่ยนแปลง
 */

import { FinancialMetricTrend } from '../pages/StockPlanner/types';

/**
 * แปลงสตริงตัวเลขทางการเงิน (เช่น "$1,181", "-$1,710", "(1,855)", "--", "-") ให้เป็นค่าตัวเลข number
 * 
 * @param valStr - ข้อความสตริงตัวเลขงบการเงิน
 * @returns ค่าตัวเลข number หรือ null หากแปลงไม่ได้/ไม่มีข้อมูล
 */
export const parseFinancialNumber = (valStr?: string): number | null => {
  if (!valStr || valStr.trim() === '' || valStr === '--' || valStr === '-') {
    return null;
  }

  const trimmed = valStr.trim();
  // ตรวจสอบกรณีติดลบในวงเล็บ เช่น (1,855) หรือติดลบนำหน้า -$1,855
  const isNegative = trimmed.startsWith('(') || trimmed.includes('-');
  const cleanStr = trimmed.replace(/[^0-9.]/g, '');
  const parsedNum = parseFloat(cleanStr);

  if (isNaN(parsedNum)) {
    return null;
  }

  return isNegative ? -parsedNum : parsedNum;
};

/**
 * จัดรูปแบบค่าตัวเลขเปอร์เซ็นต์ให้มีเครื่องหมาย + หรือ - พร้อมทศนิยม 1 ตำแหน่ง
 * 
 * @param percent - ค่าเปอร์เซ็นต์
 * @returns สตริงเปอร์เซ็นต์ เช่น "+12.4%", "-5.2%", "0.0%"
 */
export const formatFinancialChangePercent = (percent: number): string => {
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
};

/**
 * ประเมินแนวโน้มและสถานะของตัวชี้วัดทางการเงิน (ดีขึ้น/แย่ลง/คงที่) เปรียบเทียบกับงวดก่อนหน้า
 * 
 * - สำหรับรายได้/กำไร:
 *   - รายได้/กำไรเพิ่มขึ้น หรือขาดทุนน้อยลง = ดีขึ้น (improved)
 *   - รายได้/กำไรลดลง หรือขาดทุนมากขึ้น = แย่ลง (worsened)
 * - สำหรับภาระหนี้สิน (Total Liabilities):
 *   - หนี้ลดลง = ดีขึ้น (improved)
 *   - หนี้เพิ่มขึ้น = แย่ลง (worsened)
 *   - คำนวณ % การเพิ่มขึ้น/ลดลงของหนี้สิน
 * 
 * @param currentStr - ตัวเลขงบงวดปัจจุบัน (เช่น "$1,181")
 * @param prevStr - ตัวเลขงบงวดก่อนหน้า (เช่น "$1,548")
 * @param isLiability - เป็นรายการหนี้สินหรือไม่ (ค่าเริ่มต้น: false)
 * @param prevPeriod - ป้ายเวลางวดก่อนหน้า (เช่น "31/03/2026")
 * @returns วัตถุ FinancialMetricTrend ประกอบด้วยสถานะ, % change, ข้อความ Badge และ Tooltip
 */
export const evaluateFinancialTrend = (
  currentStr?: string,
  prevStr?: string,
  isLiability: boolean = false,
  prevPeriod?: string
): FinancialMetricTrend => {
  const currentVal = parseFinancialNumber(currentStr);
  const prevVal = parseFinancialNumber(prevStr);

  const prevText = prevStr && prevStr !== '--' ? prevStr : 'ไม่มีข้อมูล';
  const periodText = prevPeriod ? ` (งวด ${prevPeriod})` : '';

  // กรณีไม่มีข้อมูลเปรียบเทียบ
  if (currentVal === null || prevVal === null) {
    return {
      status: 'unknown',
      currentVal,
      prevVal,
      prevFormatted: prevStr,
      badgeText: prevStr && prevStr !== '--' ? `ก่อนหน้า: ${prevStr}` : 'งวดแรก',
      tooltipText: `ไม่มีข้อมูลงวดก่อนหน้า${periodText}สำหรับนำมาเปรียบเทียบ`,
    };
  }

  // คำนวณเปอร์เซ็นต์การเปลี่ยนแปลง
  let changePercent: number | null = null;
  if (prevVal !== 0) {
    changePercent = ((currentVal - prevVal) / Math.abs(prevVal)) * 100;
  }

  // --- กรณีที่ 1: รายการหนี้สิน (Total Liabilities / Long-Term Debt) ---
  if (isLiability) {
    if (currentVal < prevVal) {
      // หนี้ลดลง = ดีขึ้น
      const pctStr = changePercent !== null ? `${Math.abs(changePercent).toFixed(1)}%` : '';
      return {
        status: 'improved',
        changePercent,
        currentVal,
        prevVal,
        prevFormatted: prevStr,
        badgeText: pctStr ? `▼ หนี้ลดลง ${pctStr}` : '▼ หนี้ลดลง',
        tooltipText: `หนี้สินลดลงจากงวดก่อนหน้า${periodText} ${pctStr ? `คิดเป็น ${pctStr}` : ''} (งวดก่อนหน้า: ${prevText}) ➔ ถือว่าดีขึ้น`,
      };
    } else if (currentVal > prevVal) {
      // หนี้เพิ่มขึ้น = แย่ลง
      const pctStr = changePercent !== null ? `${Math.abs(changePercent).toFixed(1)}%` : '';
      return {
        status: 'worsened',
        changePercent,
        currentVal,
        prevVal,
        prevFormatted: prevStr,
        badgeText: pctStr ? `▲ หนี้เพิ่มขึ้น ${pctStr}` : '▲ หนี้เพิ่มขึ้น',
        tooltipText: `หนี้สินเพิ่มขึ้นจากงวดก่อนหน้า${periodText} ${pctStr ? `คิดเป็น ${pctStr}` : ''} (งวดก่อนหน้า: ${prevText}) ➔ ควรระมัดระวัง`,
      };
    } else {
      return {
        status: 'neutral',
        changePercent: 0,
        currentVal,
        prevVal,
        prevFormatted: prevStr,
        badgeText: 'หนี้คงที่ (0%)',
        tooltipText: `ภาระหนี้สินเท่าเดิมเทียบกับงวดก่อนหน้า${periodText} (${prevText})`,
      };
    }
  }

  // --- กรณีที่ 2: รายการรายได้และผลกำไร (Revenue, Gross Profit, Operating Income, Net Income) ---
  if (currentVal > prevVal) {
    // ปรับตัวดีขึ้น (กำไรเพิ่มขึ้น / ขาดทุนน้อยลง / พลิกมีกำไร)
    if (currentVal < 0 && prevVal < 0) {
      // ขาดทุนลดลง เช่น จาก -$1,855 เป็น -$1,710
      const reducedLossPct = changePercent !== null ? `${Math.abs(changePercent).toFixed(1)}%` : '';
      return {
        status: 'improved',
        changePercent,
        currentVal,
        prevVal,
        prevFormatted: prevStr,
        badgeText: reducedLossPct ? `▲ ขาดทุนลดลง ${reducedLossPct}` : '▲ ขาดทุนลดลง',
        tooltipText: `ผลการดำเนินงานขาดทุนลดลงจากงวดก่อนหน้า${periodText} (งวดก่อนหน้า: ${prevText}) ➔ ถือว่าทิศทางดีขึ้น`,
      };
    } else if (prevVal < 0 && currentVal >= 0) {
      // พลิกจากขาดทุนกลับมามีกำไร
      return {
        status: 'improved',
        changePercent,
        currentVal,
        prevVal,
        prevFormatted: prevStr,
        badgeText: '▲ พลิกมีกำไร',
        tooltipText: `ผลการดำเนินงานพลิกฟื้นกลับมามีกำไร จากที่เคยขาดทุนในงวดก่อนหน้า${periodText} (${prevText}) ➔ ดีขึ้นอย่างมีนัยสำคัญ`,
      };
    } else {
      // เติบโตขึ้น (กำไร/รายได้เพิ่มขึ้น)
      const pctFormatted = changePercent !== null ? formatFinancialChangePercent(changePercent) : '';
      return {
        status: 'improved',
        changePercent,
        currentVal,
        prevVal,
        prevFormatted: prevStr,
        badgeText: pctFormatted ? `▲ ${pctFormatted}` : '▲ ดีขึ้น',
        tooltipText: `เติบโตขึ้น ${pctFormatted} จากงวดก่อนหน้า${periodText} (งวดก่อนหน้า: ${prevText}) ➔ ทิศทางดีขึ้น`,
      };
    }
  } else if (currentVal < prevVal) {
    // ปรับตัวแย่ลง (กำไรลดลง / ขาดทุนหนักขึ้น / พลิกขาดทุน)
    if (currentVal < 0 && prevVal < 0) {
      // ขาดทุนเพิ่มขึ้น เช่น จาก -$1,000 เป็น -$1,855
      const moreLossPct = changePercent !== null ? `${Math.abs(changePercent).toFixed(1)}%` : '';
      return {
        status: 'worsened',
        changePercent,
        currentVal,
        prevVal,
        prevFormatted: prevStr,
        badgeText: moreLossPct ? `▼ ขาดทุนเพิ่มขึ้น ${moreLossPct}` : '▼ ขาดทุนเพิ่มขึ้น',
        tooltipText: `ผลการดำเนินงานขาดทุนเพิ่มขึ้นจากงวดก่อนหน้า${periodText} (งวดก่อนหน้า: ${prevText}) ➔ ผลงานชะลอตัวลง`,
      };
    } else if (prevVal >= 0 && currentVal < 0) {
      // พลิกจากกำไรกลายเป็นขาดทุน
      return {
        status: 'worsened',
        changePercent,
        currentVal,
        prevVal,
        prevFormatted: prevStr,
        badgeText: '▼ พลิกขาดทุน',
        tooltipText: `ผลการดำเนินงานพลิกขาดทุน จากที่เคยมีกำไรในงวดก่อนหน้า${periodText} (${prevText}) ➔ ทิศทางแย่ลง`,
      };
    } else {
      // ผลกำไรหรือรายได้ลดลง
      const pctFormatted = changePercent !== null ? formatFinancialChangePercent(changePercent) : '';
      return {
        status: 'worsened',
        changePercent,
        currentVal,
        prevVal,
        prevFormatted: prevStr,
        badgeText: pctFormatted ? `▼ ${pctFormatted}` : '▼ ลดลง',
        tooltipText: `ลดลง ${pctFormatted} จากงวดก่อนหน้า${periodText} (งวดก่อนหน้า: ${prevText}) ➔ ทิศทางชะลอตัว`,
      };
    }
  } else {
    return {
      status: 'neutral',
      changePercent: 0,
      currentVal,
      prevVal,
      prevFormatted: prevStr,
      badgeText: 'คงที่ (0%)',
      tooltipText: `ผลประกอบการเท่าเดิมเทียบกับงวดก่อนหน้า${periodText} (${prevText})`,
    };
  }
};
