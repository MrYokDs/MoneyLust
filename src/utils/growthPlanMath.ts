import {
  DailyGrowthItem,
  GrowthPlanConfig,
  PortfolioBenchmark,
} from '../types';

/**
 * คำนวณตารางจำลองการเติบโตแบบดอกเบี้ยทบต้นรายวัน (Daily Compound Growth)
 * จากเงินต้น อัตราผลตอบแทนต่อวัน และมูลค่าเป้าหมาย
 * 
 * @param config - การตั้งค่าแผนการลงทุน (เงินต้น, % กำไรต่อวัน, เป้าหมายพอร์ต)
 * @param maxDays - จำนวนวันสูงสุดที่อนุญาตให้คำนวณ (ค่าเริ่มต้น 1000 วัน เพื่อป้องกัน infinite loop)
 * @returns รายการแจกแจงผลตอบแทนรายวัน (DailyGrowthItem[])
 */
export const calculateDailyGrowthPlan = (
  config: GrowthPlanConfig,
  maxDays: number = 1000
): DailyGrowthItem[] => {
  const { initialCapital, dailyReturnPercent, targetAmount } = config;

  if (initialCapital <= 0 || dailyReturnPercent <= 0 || targetAmount <= initialCapital) {
    return [];
  }

  const items: DailyGrowthItem[] = [];
  let currentBalance = initialCapital;
  const targetGrowthRange = targetAmount - initialCapital;

  for (let day = 1; day <= maxDays; day++) {
    const startingBalance = currentBalance;
    const dailyProfit = startingBalance * (dailyReturnPercent / 100);
    const endingBalance = startingBalance + dailyProfit;
    const cumulativeProfit = endingBalance - initialCapital;
    const cumulativeReturnPercent = (cumulativeProfit / initialCapital) * 100;
    const progressPercent = Math.min(
      100,
      Math.max(0, (cumulativeProfit / targetGrowthRange) * 100)
    );

    items.push({
      day,
      startingBalance,
      dailyProfit,
      dailyReturnPercent,
      endingBalance,
      cumulativeProfit,
      cumulativeReturnPercent,
      progressPercent,
    });

    currentBalance = endingBalance;

    // หากถึงหรือเกินเป้าหมายแล้ว ให้หยุดการคำนวณ
    if (endingBalance >= targetAmount) {
      break;
    }
  }

  return items;
};

/**
 * ค้นหาวันที่เริ่มต้นเทรดวันแรกของพอร์ตการลงทุน (First Trade Date)
 * โดยหาจากวันที่สร้างแผนการเทรดแรกสุดในพอร์ต หรือใช้วันที่สร้างพอร์ตเป็นค่าสำรอง
 * 
 * @param plans - รายการแผนการเทรดทั้งหมดในพอร์ต
 * @param portfolioCreatedAt - วันที่สร้างพอร์ตการลงทุน (ISO string)
 * @returns วันที่เริ่มต้นเทรดในรูปแบบ ISO string
 */
export const getPortfolioFirstTradeDate = (
  plans?: Array<{ createdAt?: string }>,
  portfolioCreatedAt?: string
): string => {
  if (plans && plans.length > 0) {
    const validTimestamps = plans
      .map((p) => (p.createdAt ? new Date(p.createdAt).getTime() : NaN))
      .filter((t) => !isNaN(t));

    if (validTimestamps.length > 0) {
      return new Date(Math.min(...validTimestamps)).toISOString();
    }
  }

  return portfolioCreatedAt || new Date().toISOString();
};

/**
 * คำนวณจำนวนวันทำการเทรด (Trading Days) ที่ผ่านไปแล้วนับจากวันที่เริ่มต้นจนถึงปัจจุบัน
 * นับเฉพาะวันจันทร์ถึงศุกร์ (ไม่รวมวันเสาร์-อาทิตย์) โดยวันเริ่มต้นนับเป็น Day 1 ของแผน
 * 
 * @param startDateInput - วันที่เริ่มต้นเทรด (ISO string หรือ Date)
 * @param currentDateInput - วันที่ปัจจุบัน (ค่าเริ่มต้นคือวันปัจจุบัน)
 * @returns จำนวนวันทำการเทรดที่ผ่านไป (อย่างน้อย 1 วัน)
 */
export const calculateElapsedTradingDays = (
  startDateInput: string | Date,
  currentDateInput: Date = new Date()
): number => {
  const start = new Date(startDateInput);
  const current = new Date(currentDateInput);

  if (isNaN(start.getTime())) {
    return 1;
  }

  // ปรับเวลาให้เป็นเที่ยงคืนเพื่อเปรียบเทียบเฉพาะวันตามปฏิทิน
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const end = new Date(current.getFullYear(), current.getMonth(), current.getDate());

  if (d > end) {
    return 1;
  }

  let tradingDays = 0;
  const cur = new Date(d);

  while (cur <= end) {
    const dayOfWeek = cur.getDay(); // 0 = อาทิตย์, 6 = เสาร์
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      tradingDays++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return Math.max(1, tradingDays);
};

/**
 * วิเคราะห์และหาตำแหน่งของพอร์ตการลงทุนจริงเมื่อเทียบกับแผนการเติบโตรายวัน (Benchmark Positioning)
 * คำนวณวันทำการที่ผ่านไปนับจากวันเริ่มเทรดจริง และเปรียบเทียบความล่าช้า/เร็วกว่าทั้งจำนวนวันและ % ความคืบหน้า
 * 
 * @param currentPortfolioValue - มูลค่าพอร์ตการลงทุนจริง ณ ปัจจุบัน
 * @param initialCapital - เงินต้นเริ่มต้นตามแผน
 * @param targetAmount - มูลค่าเป้าหมายตามแผน
 * @param items - รายการแจกแจงรายวันของแผนที่ผ่านการคำนวณแล้ว
 * @param firstTradeDateInput - วันที่เริ่มเทรดวันแรกของพอร์ต (ถ้าไม่ระบุจะใช้วันที่ปัจจุบันเป็น Day 1)
 * @returns ข้อมูลสถานะเปรียบเทียบพอร์ตจริงกับแผน (PortfolioBenchmark) หรือ undefined หากข้อมูลไม่เพียงพอ
 */
export const findPortfolioBenchmarkPosition = (
  currentPortfolioValue: number,
  initialCapital: number,
  targetAmount: number,
  items: DailyGrowthItem[],
  firstTradeDateInput?: string | Date
): PortfolioBenchmark | undefined => {
  if (items.length === 0 || initialCapital <= 0 || targetAmount <= initialCapital) {
    return undefined;
  }

  const firstTradeDate = firstTradeDateInput
    ? new Date(firstTradeDateInput).toISOString()
    : new Date().toISOString();

  // 1. คำนวณวันทำการที่ผ่านไปนับจากวันเริ่มเทรด
  const elapsedTradingDays = calculateElapsedTradingDays(firstTradeDate);

  // วันที่ควรจะอยู่ตามแผน (จำกัดไม่เกินวันสุดท้ายของแผน)
  const expectedDay = Math.min(items.length, Math.max(1, elapsedTradingDays));
  const expectedItem = items[expectedDay - 1];
  const expectedBalance = expectedItem ? expectedItem.endingBalance : targetAmount;
  const expectedProgressPercent = expectedItem ? expectedItem.progressPercent : 100;

  // 2. คำนวณความคืบหน้าจริงของพอร์ต (% Progress)
  const targetGrowthRange = targetAmount - initialCapital;
  const currentProfit = currentPortfolioValue - initialCapital;
  const progressPercent = Math.min(
    100,
    Math.max(0, (currentProfit / targetGrowthRange) * 100)
  );

  // 3. กรณีมูลค่าพอร์ตปัจจุบันถึงหรือเกินเป้าหมายแล้ว
  if (currentPortfolioValue >= targetAmount) {
    const lastItem = items[items.length - 1];
    const matchedDay = lastItem.day;
    const daysBehind = expectedDay - matchedDay;
    const progressBehindPercent = 0;

    return {
      currentPortfolioValue,
      matchedDay,
      planBalanceAtMatchedDay: lastItem.endingBalance,
      differenceAmount: currentPortfolioValue - targetAmount,
      progressPercent: 100,
      remainingDays: 0,
      status: 'achieved',
      firstTradeDate,
      elapsedTradingDays,
      expectedDay,
      expectedBalance,
      expectedProgressPercent,
      daysBehind,
      progressBehindPercent,
      summaryText: '🏆 บรรลุเป้าหมายพอร์ตแล้ว!',
    };
  }

  // 4. กรณีมูลค่าพอร์ตยังน้อยกว่าหรือเท่ากับเงินต้นเริ่มต้น (ยังไม่เริ่มมีกำไร)
  if (currentPortfolioValue <= initialCapital) {
    const matchedDay = 1;
    const daysBehind = Math.max(0, expectedDay - matchedDay);
    const progressBehindPercent = Number((expectedProgressPercent - 0).toFixed(2));

    let summaryText = '';
    if (daysBehind > 0) {
      summaryText = `ช้ากว่าแผน ${daysBehind} วัน (ความคืบหน้าช้าไป ${progressBehindPercent.toFixed(1)}%)`;
    } else {
      summaryText = `ตรงตามวัน (Day 1) แต่ความคืบหน้าช้าไป ${progressBehindPercent.toFixed(1)}%`;
    }

    return {
      currentPortfolioValue,
      matchedDay: 0,
      planBalanceAtMatchedDay: initialCapital,
      differenceAmount: currentPortfolioValue - initialCapital,
      progressPercent: 0,
      remainingDays: items.length,
      status: 'behind',
      firstTradeDate,
      elapsedTradingDays,
      expectedDay,
      expectedBalance,
      expectedProgressPercent,
      daysBehind,
      progressBehindPercent,
      summaryText,
    };
  }

  // 5. ค้นหาวันที่ในแผนที่มูลค่าใกล้เคียงกับพอร์ตจริง
  // หาไอเท็มแรกที่มียอด endingBalance >= currentPortfolioValue
  let matchedIndex = items.findIndex((item) => item.endingBalance >= currentPortfolioValue);
  if (matchedIndex === -1) {
    matchedIndex = items.length - 1;
  }

  const matchedItem = items[matchedIndex];
  const matchedDay = matchedItem.day;
  const differenceAmount = currentPortfolioValue - matchedItem.endingBalance;
  const remainingDays = Math.max(0, items.length - matchedDay);

  // คำนวณความล่าช้า/เร็วกว่าเทียบกับวันเวลาตามแผน
  const daysBehind = expectedDay - matchedDay;
  const progressBehindPercent = Number((expectedProgressPercent - progressPercent).toFixed(2));

  // กำหนดสถานะ (status)
  let status: 'ahead' | 'on_track' | 'behind' = 'on_track';
  if (daysBehind > 0 || progressBehindPercent > 0.5) {
    status = 'behind';
  } else if (daysBehind < 0 || progressBehindPercent < -0.5) {
    status = 'ahead';
  } else {
    status = 'on_track';
  }

  // สร้างข้อความสรุปภาษาไทย
  let summaryText = '';
  if (daysBehind > 0) {
    const pctStr = progressBehindPercent > 0
      ? ` (ความคืบหน้าช้าไป ${progressBehindPercent.toFixed(1)}%)`
      : '';
    summaryText = `ช้ากว่าแผน ${daysBehind} วัน${pctStr}`;
  } else if (daysBehind < 0) {
    const aheadDays = Math.abs(daysBehind);
    const pctStr = progressBehindPercent < 0
      ? ` (ความคืบหน้าเร็วกว่าเป้าหมาย ${Math.abs(progressBehindPercent).toFixed(1)}%)`
      : '';
    summaryText = `เร็วกว่าแผน ${aheadDays} วัน${pctStr}`;
  } else {
    // daysBehind === 0 (จำนวนวันเท่ากัน)
    if (progressBehindPercent > 0.1) {
      summaryText = `ตรงตามวัน (Day ${matchedDay}) แต่ความคืบหน้าช้าไป ${progressBehindPercent.toFixed(1)}%`;
    } else if (progressBehindPercent < -0.1) {
      summaryText = `ตรงตามวัน (Day ${matchedDay}) ความคืบหน้าเร็วกว่าเป้าหมาย ${Math.abs(progressBehindPercent).toFixed(1)}%`;
    } else {
      summaryText = `เดินหน้าตรงตามแผนเป๊ะ (Day ${matchedDay})`;
    }
  }

  return {
    currentPortfolioValue,
    matchedDay,
    planBalanceAtMatchedDay: matchedItem.endingBalance,
    differenceAmount,
    progressPercent,
    remainingDays,
    status,
    firstTradeDate,
    elapsedTradingDays,
    expectedDay,
    expectedBalance,
    expectedProgressPercent,
    daysBehind,
    progressBehindPercent,
    summaryText,
  };
};
