import {
  TrancheDetail,
  CalculationResult,
  DropMode,
  RoundingMode,
  CurrencyMode,
  Portfolio,
  PortfolioSummary,
} from '../types';

export type {
  TrancheDetail,
  CalculationResult,
  DropMode,
  RoundingMode,
  CurrencyMode,
  PortfolioSummary,
};

/**
 * คำนวณการแบ่งไม้เข้าซื้อหุ้นตามกลยุทธ์ถัวเฉลี่ยต้นทุนขาลง (Average-Down Strategy)
 * แบ่งสัดส่วนงบประมาณเท่าๆ กันในแต่ละไม้ และทบเศษที่เหลือไปรวมไว้ที่ไม้สุดท้ายอัตโนมัติ
 * 
 * @param stockSymbol - สัญลักษณ์หุ้น เช่น AAPL, NVDA, PTT
 * @param currentPrice - ราคาหุ้นปัจจุบัน
 * @param totalBudget - งบประมาณรวมที่ต้องการลงทุน
 * @param tranchesCount - จำนวนไม้ที่ต้องการแบ่งซื้อ
 * @param dropPercentage - เปอร์เซ็นต์การย่อตัวของราคาในแต่ละไม้
 * @param dropMode - รูปแบบการย่อตัว ('progressive' ย่อทบสะสม หรือ 'fixed' คงที่)
 * @param roundingMode - วิธีการปัดเศษหุ้น ('fractional' เศษหุ้น, 'integer' จำนวนเต็ม, 'boardlot' ขั้นละ 100 หุ้น)
 * @param currency - สกุลเงิน ('THB' หรือ 'USD')
 * @param exchangeRate - อัตราแลกเปลี่ยน THB ต่อ 1 USD
 * @param targetProfitPercent - เป้าหมายกำไรที่ต้องการ (%)
 * @param feePercent - อัตราค่าธรรมเนียมการซื้อขาย (%)
 * @param actualSellPrice - ราคาที่ขายได้จริง (สำหรับคำนวณกำไร/ขาดทุนจริง)
 * @param actualTranchesCount - จำนวนไม้ที่เข้าซื้อจริงได้
 * @param currentPriceIsFirstTranche - กำหนดว่าราคาปัจจุบันคือไม้แรกหรือไม่
 * @param portfolioId - รหัสพอร์ตโฟลิโอที่เชื่อมโยง
 * @returns ผลลัพธ์การคำนวณแจกแจงรายไม้และสถิติสะสมทั้งหมด (CalculationResult)
 */
export const calculateStockTranches = (
  stockSymbol: string,
  currentPrice: number,
  totalBudget: number,
  tranchesCount: number,
  dropPercentage: number,
  dropMode: 'progressive' | 'fixed' = 'progressive',
  roundingMode: 'fractional' | 'integer' | 'boardlot' = 'integer',
  currency: 'THB' | 'USD' = 'THB',
  exchangeRate: number = 36.5,
  targetProfitPercent: number = 0,
  feePercent: number = 0,
  actualSellPrice: number = 0,
  actualTranchesCount?: number,
  currentPriceIsFirstTranche: boolean = true,
  portfolioId: string = 'unassigned'
): CalculationResult => {
  const symbol = stockSymbol.trim().toUpperCase() || 'STOCK';
  const cleanPrice = Math.max(0.01, currentPrice);
  const cleanBudget = Math.max(1, totalBudget);
  const cleanTranches = Math.max(1, Math.min(50, tranchesCount));
  const cleanDrop = Math.max(0, dropPercentage);
  const feeRate = feePercent / 100;
  const profitRate = targetProfitPercent / 100;

  // 1. Equal Budget allocation with remainder assigned to the last tranche
  const baseBudget = Math.floor(cleanBudget / cleanTranches);
  const remainderBudget = cleanBudget - (baseBudget * cleanTranches);

  const tranches: TrancheDetail[] = [];
  
  let accumBudgetAllocated = 0;
  let accumSpent = 0;
  let accumShares = 0;
  let accumLeftover = 0;

  for (let i = 1; i <= cleanTranches; i++) {
    // Allocate remainder to the last tranche
    const budgetAllocated = i === cleanTranches ? (baseBudget + remainderBudget) : baseBudget;
    accumBudgetAllocated += budgetAllocated;

    // 2. Calculate purchase price for this tranche
    let price = cleanPrice;
    const dropMultiplier = currentPriceIsFirstTranche ? (i - 1) : i;

    if (dropMultiplier > 0) {
      if (dropMode === 'progressive') {
        if (currentPriceIsFirstTranche) {
          const prevPrice = tranches[i - 2].price;
          price = prevPrice * (1 - cleanDrop / 100);
        } else {
          if (i === 1) {
            price = cleanPrice * (1 - cleanDrop / 100);
          } else {
            const prevPrice = tranches[i - 2].price;
            price = prevPrice * (1 - cleanDrop / 100);
          }
        }
      } else {
        // Fixed drop relative to the original currentPrice
        price = cleanPrice * (1 - dropMultiplier * cleanDrop / 100);
      }
    }
    // Clamp price to a minimum of 0.01
    price = Math.max(0.01, parseFloat(price.toFixed(4)));

    // 3. Calculate shares bought based on roundingMode
    const rawShares = budgetAllocated / (price * (1 + feeRate));
    let sharesBought = 0;
    
    if (roundingMode === 'fractional') {
      sharesBought = parseFloat(rawShares.toFixed(4));
    } else if (roundingMode === 'integer') {
      sharesBought = Math.floor(rawShares);
    } else if (roundingMode === 'boardlot') {
      sharesBought = Math.floor(rawShares / 100) * 100;
    }

    const baseSpent = sharesBought * price;
    const feeAmount = baseSpent * feeRate;
    const actualSpent = parseFloat((baseSpent + feeAmount).toFixed(4));
    const leftoverCash = parseFloat((budgetAllocated - actualSpent).toFixed(4));

    // 4. Calculate cumulative statistics
    accumSpent += actualSpent;
    accumShares += sharesBought;
    accumLeftover += leftoverCash;

    const cumulativeAverageCost = accumShares > 0 ? parseFloat((accumSpent / accumShares).toFixed(4)) : 0;
    const priceDiscountPercent = parseFloat((((cleanPrice - price) / cleanPrice) * 100).toFixed(2));
    const averageCostDiscountPercent = parseFloat((((cleanPrice - cumulativeAverageCost) / cleanPrice) * 100).toFixed(2));

    tranches.push({
      trancheNumber: i,
      budgetAllocated,
      price,
      sharesBought,
      actualSpent,
      leftoverCash,
      cumulativeBudgetAllocated: accumBudgetAllocated,
      cumulativeSpent: parseFloat(accumSpent.toFixed(4)),
      cumulativeShares: parseFloat(accumShares.toFixed(4)),
      cumulativeAverageCost,
      cumulativeLeftoverCash: parseFloat(accumLeftover.toFixed(4)),
      priceDiscountPercent,
      averageCostDiscountPercent,
    });
  }

  const totalActualSpent = parseFloat(accumSpent.toFixed(4));
  const totalSharesBought = parseFloat(accumShares.toFixed(4));
  const finalAverageCost = totalSharesBought > 0 ? parseFloat((totalActualSpent / totalSharesBought).toFixed(4)) : 0;
  const totalLeftoverCash = parseFloat(accumLeftover.toFixed(4));
  const overallDiscountPercent = parseFloat((((cleanPrice - finalAverageCost) / cleanPrice) * 100).toFixed(2));

  // Sell Strategy & Profit Calculations (accounting for transaction fees)
  // Formula: targetSellPrice = finalAverageCost * (1 + profitRate) / (1 - feeRate)
  // Since finalAverageCost already includes the buy fee
  const targetSellPrice = finalAverageCost > 0 && (1 - feeRate) > 0
    ? parseFloat(((finalAverageCost * (1 + profitRate)) / (1 - feeRate)).toFixed(4))
    : 0;

  // Realized profit/loss based on actualSellPrice
  let realizedProfitLossAmount = 0;
  let realizedProfitLossPercent = 0;
  if (actualSellPrice > 0) {
    const totalBuyCost = totalActualSpent; // already includes fee
    const totalSellAmount = totalSharesBought * actualSellPrice * (1 - feeRate);
    realizedProfitLossAmount = totalSellAmount - totalBuyCost;
    realizedProfitLossPercent = totalBuyCost > 0 ? (realizedProfitLossAmount / totalBuyCost) * 100 : 0;
  }

  // Actual execution stats based on actualTranchesCount parameter
  const cleanActualTranches = Math.max(1, Math.min(cleanTranches, actualTranchesCount || cleanTranches));
  
  // Find the tranche at cleanActualTranches
  const actualTrancheObj = tranches[cleanActualTranches - 1];
  const actualSpent = actualTrancheObj ? actualTrancheObj.cumulativeSpent : 0;
  const actualShares = actualTrancheObj ? actualTrancheObj.cumulativeShares : 0;
  const actualAverageCost = actualTrancheObj ? actualTrancheObj.cumulativeAverageCost : 0;
  const actualLeftoverCash = actualTrancheObj ? actualTrancheObj.cumulativeLeftoverCash : 0;
  const actualDiscountPercent = parseFloat((((cleanPrice - actualAverageCost) / cleanPrice) * 100).toFixed(2));

  const actualTargetSellPrice = actualAverageCost > 0 && (1 - feeRate) > 0
    ? parseFloat(((actualAverageCost * (1 + profitRate)) / (1 - feeRate)).toFixed(4))
    : 0;

  const fullTargetProfitAmount = totalActualSpent * profitRate;
  const actualBuyCost = actualSpent; // already includes fee
  const actualEquivalentTargetSellPrice = (actualShares > 0 && (1 - feeRate) > 0)
    ? parseFloat(((fullTargetProfitAmount + actualBuyCost) / (actualShares * (1 - feeRate))).toFixed(4))
    : 0;

  let actualRealizedProfitLossAmount = 0;
  let actualRealizedProfitLossPercent = 0;
  let actualRealizedProfitLossPercentOfFullPlan = 0;
  if (actualSellPrice > 0) {
    const totalBuyCost = actualSpent; // already includes fee
    const totalSellAmount = actualShares * actualSellPrice * (1 - feeRate);
    actualRealizedProfitLossAmount = totalSellAmount - totalBuyCost;
    actualRealizedProfitLossPercent = totalBuyCost > 0 ? (actualRealizedProfitLossAmount / totalBuyCost) * 100 : 0;

    const fullPlanBuyCost = totalActualSpent; // already includes fee
    actualRealizedProfitLossPercentOfFullPlan = fullPlanBuyCost > 0 ? (actualRealizedProfitLossAmount / fullPlanBuyCost) * 100 : 0;
  }

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
    stockSymbol: symbol,
    currentPrice: cleanPrice,
    totalBudget: cleanBudget,
    tranchesCount: cleanTranches,
    dropPercentage: cleanDrop,
    dropMode,
    roundingMode,
    createdAt: new Date().toISOString(),
    tranches,
    totalActualSpent,
    totalSharesBought,
    finalAverageCost,
    totalLeftoverCash,
    overallDiscountPercent,
    currency,
    exchangeRate,
    targetProfitPercent,
    feePercent,
    actualSellPrice,
    targetSellPrice,
    realizedProfitLossAmount: parseFloat(realizedProfitLossAmount.toFixed(4)),
    realizedProfitLossPercent: parseFloat(realizedProfitLossPercent.toFixed(2)),
    currentPriceIsFirstTranche,
    
    // Actual executed fields
    actualTranchesCount: cleanActualTranches,
    actualSpent: parseFloat(actualSpent.toFixed(4)),
    actualShares: parseFloat(actualShares.toFixed(4)),
    actualAverageCost: parseFloat(actualAverageCost.toFixed(4)),
    actualLeftoverCash: parseFloat(actualLeftoverCash.toFixed(4)),
    actualDiscountPercent: parseFloat(actualDiscountPercent.toFixed(2)),
    actualTargetSellPrice: parseFloat(actualTargetSellPrice.toFixed(4)),
    actualEquivalentTargetSellPrice: parseFloat(actualEquivalentTargetSellPrice.toFixed(4)),
    actualRealizedProfitLossAmount: parseFloat(actualRealizedProfitLossAmount.toFixed(4)),
    actualRealizedProfitLossPercent: parseFloat(actualRealizedProfitLossPercent.toFixed(2)),
    actualRealizedProfitLossPercentOfFullPlan: parseFloat(actualRealizedProfitLossPercentOfFullPlan.toFixed(2)),
    portfolioId,
  };
};

/**
 * แปลงตัวเลขเป็นข้อความสกุลเงินบาท (THB) พร้อมใส่เครื่องหมายคอมม่าและทศนิยม 2 ตำแหน่ง
 * 
 * @param amount - จำนวนเงินบาท
 * @returns ข้อความฟอร์แมตสกุลเงิน เช่น "฿1,250.00"
 */
export const formatTHB = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * จัดรูปแบบตัวเลขทั่วไปพร้อมเครื่องหมายคอมม่าคั่นหลักพัน
 * 
 * @param num - ตัวเลขที่ต้องการจัดรูปแบบ
 * @param decimals - จำนวนตำแหน่งทศนิยม (ค่าเริ่มต้น 0)
 * @returns ข้อความตัวเลขที่มีคอมม่า เช่น "1,250,000"
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * แปลงตัวเลขเป็นข้อความสกุลเงินดอลลาร์สหรัฐ (USD) พร้อมสัญลักษณ์ $
 * 
 * @param amount - จำนวนเงินดอลลาร์
 * @returns ข้อความฟอร์แมตสกุลเงิน เช่น "$1,250.00"
 */
export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * แปลงตัวเลขเป็นข้อความสกุลเงินตามสกุลที่เลือก (THB หรือ USD) แบบไดนามิก
 * 
 * @param amount - จำนวนเงิน
 * @param currency - สกุลเงินเป้าหมาย ('THB' หรือ 'USD')
 * @param _showExchange - แสดงอัตราแลกเปลี่ยนเทียบเคียง (ไม่บังคับ)
 * @param _exchangeRate - อัตราแลกเปลี่ยนที่ใช้อ้างอิง
 * @returns ข้อความสกุลเงินที่ฟอร์แมตแล้ว
 */
export const formatCurrency = (
  amount: number,
  currency: 'THB' | 'USD' = 'THB',
  _showExchange: boolean = false,
  _exchangeRate: number = 36.5
): string => {
  if (currency === 'THB') {
    return formatTHB(amount);
  } else {
    return formatUSD(amount);
  }
};

/**
 * คำนวณผลสรุปภาพรวมพอร์ตโฟลิโอ มูลค่าเงินทุน เงินที่ใช้ไป กำไรขาดทุนที่รับรู้แล้ว และเงินสดคงเหลือ
 * 
 * @param portfolio - ข้อมูลพอร์ตโฟลิโอ
 * @param plans - รายการแผนการลงทุนทั้งหมดในระบบ
 * @param currentExchangeRate - อัตราแลกเปลี่ยนปัจจุบันสำหรับแปลงค่าเงิน
 * @returns วัตถุสรุปภาพรวมพอร์ตการลงทุน (PortfolioSummary)
 */
export const calculatePortfolioSummary = (
  portfolio: Portfolio,
  plans: CalculationResult[],
  currentExchangeRate: number = 36.5
): PortfolioSummary => {
  const filteredPlans = plans.filter(p => p.portfolioId === portfolio.id);
  
  const getDefaultInitialCapital = () => {
    if (filteredPlans.length === 0) return 0;
    const firstPlan = filteredPlans[0];
    return firstPlan.currency === 'THB' ? firstPlan.totalBudget / currentExchangeRate : firstPlan.totalBudget;
  };

  const initialCapital = portfolio.initialCapital !== undefined ? portfolio.initialCapital : getDefaultInitialCapital();

  let totalRealizedPL = 0;
  let totalUnsoldSpent = 0;
  let totalUnsoldFees = 0;

  filteredPlans.forEach(plan => {
    const isSold = !!plan.soldAt || (plan.actualSellPrice && plan.actualSellPrice > 0);
    const toUSD = (amount: number) => plan.currency === 'THB' ? amount / currentExchangeRate : amount;
    
    const spent = toUSD(plan.actualSpent ?? plan.totalActualSpent);
    
    if (isSold) {
      totalRealizedPL += toUSD(plan.actualRealizedProfitLossAmount ?? plan.realizedProfitLossAmount ?? 0);
    } else {
      totalUnsoldSpent += spent;
      const feeRate = (plan.feePercent ?? 0.5) / 100;
      const baseSpent = spent / (1 + feeRate);
      const fee = spent - baseSpent;
      totalUnsoldFees += fee;
    }
  });

  const availableCash = initialCapital + totalRealizedPL - totalUnsoldSpent;
  const currentPortfolioValue = initialCapital + totalRealizedPL - totalUnsoldFees;

  return {
    initialCapital,
    totalRealizedPL,
    totalUnsoldSpent,
    totalUnsoldFees,
    availableCash,
    currentPortfolioValue
  };
};
