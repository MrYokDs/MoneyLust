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
 * วิเคราะห์และหาตำแหน่งของพอร์ตการลงทุนจริงเมื่อเทียบกับแผนการเติบโตรายวัน (Benchmark Positioning)
 * 
 * @param currentPortfolioValue - มูลค่าพอร์ตการลงทุนจริง ณ ปัจจุบัน
 * @param initialCapital - เงินต้นเริ่มต้นตามแผน
 * @param targetAmount - มูลค่าเป้าหมายตามแผน
 * @param items - รายการแจกแจงรายวันของแผนที่ผ่านการคำนวณแล้ว
 * @returns ข้อมูลสถานะเปรียบเทียบพอร์ตจริงกับแผน (PortfolioBenchmark) หรือ undefined หากข้อมูลไม่เพียงพอ
 */
export const findPortfolioBenchmarkPosition = (
  currentPortfolioValue: number,
  initialCapital: number,
  targetAmount: number,
  items: DailyGrowthItem[]
): PortfolioBenchmark | undefined => {
  if (items.length === 0 || initialCapital <= 0 || targetAmount <= initialCapital) {
    return undefined;
  }

  const targetGrowthRange = targetAmount - initialCapital;
  const currentProfit = currentPortfolioValue - initialCapital;
  const progressPercent = Math.min(
    100,
    Math.max(0, (currentProfit / targetGrowthRange) * 100)
  );

  // 1. กรณีมูลค่าพอร์ตปัจจุบันถึงหรือเกินเป้าหมายแล้ว
  if (currentPortfolioValue >= targetAmount) {
    const lastItem = items[items.length - 1];
    return {
      currentPortfolioValue,
      matchedDay: lastItem.day,
      planBalanceAtMatchedDay: lastItem.endingBalance,
      differenceAmount: currentPortfolioValue - targetAmount,
      progressPercent: 100,
      remainingDays: 0,
      status: 'achieved',
    };
  }

  // 2. กรณีมูลค่าพอร์ตยังน้อยกว่าหรือเท่ากับเงินต้นเริ่มต้น
  if (currentPortfolioValue <= initialCapital) {
    return {
      currentPortfolioValue,
      matchedDay: 0,
      planBalanceAtMatchedDay: initialCapital,
      differenceAmount: currentPortfolioValue - initialCapital,
      progressPercent: 0,
      remainingDays: items.length,
      status: 'behind',
    };
  }

  // 3. ค้นหาวันที่ในแผนที่มูลค่าใกล้เคียงกับพอร์ตจริงมากที่สุด
  // หาไอเท็มแรกที่มียอด endingBalance >= currentPortfolioValue
  let matchedIndex = items.findIndex((item) => item.endingBalance >= currentPortfolioValue);
  if (matchedIndex === -1) {
    matchedIndex = items.length - 1;
  }

  const matchedItem = items[matchedIndex];
  const differenceAmount = currentPortfolioValue - matchedItem.endingBalance;
  const remainingDays = Math.max(0, items.length - matchedItem.day);

  let status: 'ahead' | 'on_track' | 'behind' = 'on_track';
  if (differenceAmount > matchedItem.dailyProfit * 0.2) {
    status = 'ahead';
  } else if (differenceAmount < -matchedItem.dailyProfit * 0.2) {
    status = 'behind';
  }

  return {
    currentPortfolioValue,
    matchedDay: matchedItem.day,
    planBalanceAtMatchedDay: matchedItem.endingBalance,
    differenceAmount,
    progressPercent,
    remainingDays,
    status,
  };
};
