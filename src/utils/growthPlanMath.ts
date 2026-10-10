import {
  DailyGrowthItem,
  GrowthPlanConfig,
  PortfolioBenchmark,
  CurrencyMode,
} from '../types';

/**
 * คำนวณตารางจำลองการเติบโตแบบดอกเบี้ยทบต้นรายวัน (Daily Compound Growth)
 * จากเงินต้น อัตราผลตอบแทนต่อวัน และมูลค่าเป้าหมาย
 * รองรับการคำนวณช่วงเวลาฟื้นทุน (Recovery Phase) อัตโนมัติในกรณีที่มูลค่าพอร์ตปัจจุบันติดลบต่ำกว่าเงินต้นเริ่มต้น
 * 
 * @param config - การตั้งค่าแผนการลงทุน (เงินต้น, % กำไรต่อวัน, เป้าหมายพอร์ต)
 * @param maxDays - จำนวนวันสูงสุดที่อนุญาตให้คำนวณ (ค่าเริ่มต้น 1000 วัน เพื่อป้องกัน infinite loop)
 * @param currentPortfolioValue - มูลค่าพอร์ตการลงทุนจริงปัจจุบัน (ถ้ามีและน้อยกว่า initialCapital จะคำนวณช่วงฟื้นทุนเพิ่มเข้ามาในตาราง)
 * @returns รายการแจกแจงผลตอบแทนรายวัน (DailyGrowthItem[])
 */
export const calculateDailyGrowthPlan = (
  config: GrowthPlanConfig,
  maxDays: number = 1000,
  currentPortfolioValue?: number
): DailyGrowthItem[] => {
  const { initialCapital, dailyReturnPercent, targetAmount } = config;

  if (initialCapital <= 0 || dailyReturnPercent <= 0 || targetAmount <= initialCapital) {
    return [];
  }

  const items: DailyGrowthItem[] = [];
  const targetGrowthRange = targetAmount - initialCapital;

  // 1. ตรวจสอบว่ามีประวัติช่วงฟื้นทุน (Recovery Phase) หรือไม่
  // โดยตรวจสอบจาก config.recoveryStartCapital หรือ currentPortfolioValue ที่ต่ำกว่า initialCapital
  // หากมีทั้งสองตัว จะเลือกจุดที่ต่ำที่สุดเพื่อบันทึกประวัติการขาดทุน (Drawdown) สูงสุด
  const lowestDrawdown = config.recoveryStartCapital;
  let effectiveRecoveryStart: number | undefined = undefined;

  if (lowestDrawdown !== undefined && lowestDrawdown > 0 && lowestDrawdown < initialCapital) {
    effectiveRecoveryStart = lowestDrawdown;
    if (currentPortfolioValue !== undefined && currentPortfolioValue > 0 && currentPortfolioValue < lowestDrawdown) {
      effectiveRecoveryStart = currentPortfolioValue;
    }
  } else if (
    currentPortfolioValue !== undefined &&
    currentPortfolioValue > 0 &&
    currentPortfolioValue < initialCapital
  ) {
    effectiveRecoveryStart = currentPortfolioValue;
  }

  let overallDayIndex = 1;

  if (effectiveRecoveryStart !== undefined && effectiveRecoveryStart < initialCapital) {
    let recoveryBalance = effectiveRecoveryStart;
    let recDay = 1;

    // วนลูปคำนวณช่วงฟื้นทุนจนกระทั่งยอดเงินกลับมาแตะ initialCapital
    while (recoveryBalance < initialCapital && overallDayIndex <= maxDays) {
      const startingBalance = recoveryBalance;
      const dailyProfit = startingBalance * (dailyReturnPercent / 100);
      const endingBalance = startingBalance + dailyProfit;
      const cumulativeProfit = endingBalance - effectiveRecoveryStart;
      const cumulativeReturnPercent = (cumulativeProfit / effectiveRecoveryStart) * 100;

      items.push({
        day: overallDayIndex,
        startingBalance,
        dailyProfit,
        dailyReturnPercent,
        endingBalance,
        cumulativeProfit,
        cumulativeReturnPercent,
        progressPercent: 0,
        isRecovery: true,
        recoveryDay: recDay,
        displayDayLabel: `ฟื้นทุน Day ${recDay}`,
      });

      recDay++;
      overallDayIndex++;
      recoveryBalance = endingBalance;
    }
  }

  // 2. คำนวณช่วงเติบโตตามแผนปกติ (Growth Phase) จาก initialCapital ไปจนถึง targetAmount
  let currentBalance = initialCapital;
  let normalDay = 1;

  while (overallDayIndex <= maxDays) {
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
      day: overallDayIndex,
      startingBalance,
      dailyProfit,
      dailyReturnPercent,
      endingBalance,
      cumulativeProfit,
      cumulativeReturnPercent,
      progressPercent,
      isRecovery: false,
      displayDayLabel: `Day ${normalDay}`,
    });

    normalDay++;
    overallDayIndex++;
    currentBalance = endingBalance;

    if (endingBalance >= targetAmount) {
      break;
    }
  }

  return items;
};

/**
 * ค้นหาวันที่เริ่มต้นเทรดวันแรกของพอร์ตการลงทุน (First Trade Date)
 * ลำดับความสำคัญ:
 * 1. ใช้วันที่ผู้ใช้กำหนดเอง (customFirstTradeDate) หากมีระบุไว้
 * 2. หากไม่ระบุ จะหาจากวันที่สร้างแผนการเทรดแรกสุดในพอร์ต
 * 3. หากไม่มีแผน จะใช้วันที่สร้างพอร์ตเป็นค่าสำรอง
 * 
 * @param plans - รายการแผนการเทรดทั้งหมดในพอร์ต
 * @param portfolioCreatedAt - วันที่สร้างพอร์ตการลงทุน (ISO string)
 * @param customFirstTradeDate - วันที่เริ่มเทรดที่ผู้ใช้กำหนดเอง (ISO string หรือ YYYY-MM-DD)
 * @returns วันที่เริ่มต้นเทรดในรูปแบบ ISO string
 */
export const getPortfolioFirstTradeDate = (
  plans?: Array<{ createdAt?: string }>,
  portfolioCreatedAt?: string,
  customFirstTradeDate?: string
): string => {
  if (customFirstTradeDate) {
    const customTime = new Date(customFirstTradeDate).getTime();
    if (!isNaN(customTime)) {
      return new Date(customFirstTradeDate).toISOString();
    }
  }

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
  firstTradeDateInput?: string | Date,
  currency: CurrencyMode = 'THB'
): PortfolioBenchmark | undefined => {
  if (items.length === 0 || initialCapital <= 0 || targetAmount <= initialCapital) {
    return undefined;
  }

  const currencySymbol = currency === 'USD' ? '$' : '฿';
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

  const recoveryItems = items.filter((item) => item.isRecovery);
  const recoveryCount = recoveryItems.length;
  const normalCount = items.length - recoveryCount;
  const hasRecoveryHistory = recoveryCount > 0;

  // 3. กรณีมูลค่าพอร์ตปัจจุบันถึงหรือเกินเป้าหมายแล้ว
  if (currentPortfolioValue >= targetAmount) {
    const lastItem = items[items.length - 1];
    const matchedDay = lastItem.day;
    const daysBehind = expectedDay - matchedDay;
    const progressBehindPercent = 0;
    const normalMatchedDay = normalCount;

    return {
      currentPortfolioValue,
      matchedDay,
      matchedDayLabel: lastItem.displayDayLabel || `Day ${normalCount}`,
      normalMatchedDay,
      hasRecoveryHistory,
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
      isInRecovery: false,
      recoveryDays: recoveryCount,
      normalPlanDays: normalCount,
      totalPlanDays: items.length,
    };
  }

  // 4. ค้นหาวันที่ในแผนที่มูลค่าใกล้เคียงกับพอร์ตจริง
  // หาไอเท็มแรกที่มียอด endingBalance >= currentPortfolioValue
  let matchedIndex = items.findIndex((item) => item.endingBalance >= currentPortfolioValue);
  if (matchedIndex === -1) {
    if (items.length > 0 && currentPortfolioValue < items[0].startingBalance) {
      matchedIndex = 0;
    } else {
      matchedIndex = items.length - 1;
    }
  }

  const matchedItem = items[matchedIndex];
  const matchedDay = matchedItem.day;
  const isInRecovery = matchedItem.isRecovery ?? (currentPortfolioValue < initialCapital);
  const matchedRecoveryDay = matchedItem.isRecovery ? matchedItem.recoveryDay : undefined;
  const normalMatchedDay = !matchedItem.isRecovery ? (matchedDay - recoveryCount) : undefined;
  const matchedDayLabel =
    matchedItem.displayDayLabel ||
    (isInRecovery
      ? `ฟื้นทุน Day ${matchedRecoveryDay || 1}`
      : `Day ${normalMatchedDay || 1}`);

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
  if (isInRecovery) {
    const diffFormatted = Math.abs(currentPortfolioValue - initialCapital).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const remainingRecDays =
      recoveryCount > 0 ? Math.max(0, recoveryCount - (matchedRecoveryDay || 1) + 1) : 0;
    summaryText = `ช่วงฟื้นตัวกลับสู่ทุนเดิม (${matchedDayLabel}) ขาดทุน ${currencySymbol}${diffFormatted} ต้องใช้เวลาฟื้นทุนอีกประมาณ ${remainingRecDays} วัน (จากช่วงฟื้นทุนทั้งหมด ${recoveryCount} วัน)`;
  } else if (daysBehind > 0) {
    const pctStr =
      progressBehindPercent > 0 ? ` (ความคืบหน้าช้าไป ${progressBehindPercent.toFixed(1)}%)` : '';
    summaryText = `ช้ากว่าแผน ${daysBehind} วัน${pctStr}`;
  } else if (daysBehind < 0) {
    const aheadDays = Math.abs(daysBehind);
    const pctStr =
      progressBehindPercent < 0
        ? ` (ความคืบหน้าเร็วกว่าเป้าหมาย ${Math.abs(progressBehindPercent).toFixed(1)}%)`
        : '';
    summaryText = `เร็วกว่าแผน ${aheadDays} วัน${pctStr}`;
  } else {
    // daysBehind === 0 (จำนวนวันเท่ากัน)
    if (progressBehindPercent > 0.1) {
      summaryText = `ตรงตามวัน (${matchedDayLabel}) แต่ความคืบหน้าช้าไป ${progressBehindPercent.toFixed(1)}%`;
    } else if (progressBehindPercent < -0.1) {
      summaryText = `ตรงตามวัน (${matchedDayLabel}) ความคืบหน้าเร็วกว่าเป้าหมาย ${Math.abs(progressBehindPercent).toFixed(1)}%`;
    } else {
      summaryText = `เดินหน้าตรงตามแผนเป๊ะ (${matchedDayLabel})`;
    }
  }

  return {
    currentPortfolioValue,
    matchedDay,
    matchedDayLabel,
    matchedRecoveryDay,
    normalMatchedDay,
    hasRecoveryHistory,
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
    isInRecovery,
    recoveryDays: recoveryCount,
    normalPlanDays: normalCount,
    totalPlanDays: items.length,
  };
};
