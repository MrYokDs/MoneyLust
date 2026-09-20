import {
  TrancheDetail,
  CalculationResult,
  DropMode,
  RoundingMode,
  CurrencyMode,
  FeeMode,
  Portfolio,
  PortfolioSummary,
} from '../types';

export type {
  TrancheDetail,
  CalculationResult,
  DropMode,
  RoundingMode,
  CurrencyMode,
  FeeMode,
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
 * @param feeMode - รูปแบบการคิดค่าธรรมเนียม ('percent' หรือ 'per_share' สำหรับ Penny Stock)
 * @param feePerShare - ค่าธรรมเนียมต่อหุ้น (กรณีคิดต่อหุ้น เช่น $0.005)
 * @param minFeePerTranche - ค่าธรรมเนียมขั้นต่ำต่อคำสั่ง (เช่น 0 หรือ 1 USD)
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
  portfolioId: string = 'unassigned',
  feeMode: FeeMode = 'percent',
  feePerShare: number = 0.005,
  minFeePerTranche: number = 0
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

  // ฟังก์ชันคำนวณค่าธรรมเนียม (รองรับทั้งแบบ % มูลค่า และแบบต่อหุ้น Penny Stock พร้อมเช็กค่าธรรมเนียมขั้นต่ำ)
  const calcFee = (shares: number, grossAmount: number): number => {
    let fee = feeMode === 'per_share' ? shares * feePerShare : grossAmount * feeRate;
    if (minFeePerTranche > 0 && shares > 0) {
      fee = Math.max(minFeePerTranche, fee);
    }
    return parseFloat(fee.toFixed(4));
  };

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

    // 3. Calculate shares bought based on roundingMode and feeMode
    let rawShares = 0;
    if (feeMode === 'per_share') {
      const availBudget = Math.max(0, budgetAllocated - minFeePerTranche);
      rawShares = availBudget / (price + feePerShare);
    } else {
      rawShares = budgetAllocated / (price * (1 + feeRate));
    }

    let sharesBought = 0;
    if (roundingMode === 'fractional') {
      sharesBought = parseFloat(rawShares.toFixed(4));
    } else if (roundingMode === 'integer') {
      sharesBought = Math.floor(rawShares);
    } else if (roundingMode === 'boardlot') {
      sharesBought = Math.floor(rawShares / 100) * 100;
    }

    let baseSpent = sharesBought * price;
    let feeAmount = sharesBought > 0 ? calcFee(sharesBought, baseSpent) : 0;

    // ป้องกันยอดรวมค่าหุ้น + ค่าธรรมเนียม เกินงบที่จัดสรรในไม้นั้น
    while (sharesBought > 0 && (baseSpent + feeAmount) > budgetAllocated) {
      if (roundingMode === 'boardlot' && sharesBought >= 100) {
        sharesBought -= 100;
      } else if (roundingMode === 'integer') {
        sharesBought -= 1;
      } else if (roundingMode === 'fractional') {
        sharesBought = Math.max(0, parseFloat((sharesBought - 0.001).toFixed(4)));
      } else {
        break;
      }
      baseSpent = sharesBought * price;
      feeAmount = sharesBought > 0 ? calcFee(sharesBought, baseSpent) : 0;
    }

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
  const targetNetFull = totalActualSpent * (1 + profitRate);
  let targetSellPrice = 0;
  if (totalSharesBought > 0) {
    if (feeMode === 'per_share') {
      const sellFee = Math.max(minFeePerTranche, totalSharesBought * feePerShare);
      targetSellPrice = (targetNetFull + sellFee) / totalSharesBought;
    } else {
      const priceWithRate = (1 - feeRate) > 0 ? targetNetFull / (totalSharesBought * (1 - feeRate)) : 0;
      const gross = totalSharesBought * priceWithRate;
      if (gross * feeRate < minFeePerTranche) {
        targetSellPrice = (targetNetFull + minFeePerTranche) / totalSharesBought;
      } else {
        targetSellPrice = priceWithRate;
      }
    }
    targetSellPrice = parseFloat(targetSellPrice.toFixed(4));
  }

  // Realized profit/loss based on actualSellPrice
  let realizedProfitLossAmount = 0;
  let realizedProfitLossPercent = 0;
  if (actualSellPrice > 0 && totalSharesBought > 0) {
    const grossSell = totalSharesBought * actualSellPrice;
    const sellFee = calcFee(totalSharesBought, grossSell);
    const netSell = grossSell - sellFee;
    realizedProfitLossAmount = netSell - totalActualSpent;
    realizedProfitLossPercent = totalActualSpent > 0 ? (realizedProfitLossAmount / totalActualSpent) * 100 : 0;
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

  let actualTargetSellPrice = 0;
  if (actualShares > 0) {
    const actualTargetNet = actualSpent * (1 + profitRate);
    if (feeMode === 'per_share') {
      const sellFee = Math.max(minFeePerTranche, actualShares * feePerShare);
      actualTargetSellPrice = (actualTargetNet + sellFee) / actualShares;
    } else {
      const priceWithRate = (1 - feeRate) > 0 ? actualTargetNet / (actualShares * (1 - feeRate)) : 0;
      const gross = actualShares * priceWithRate;
      if (gross * feeRate < minFeePerTranche) {
        actualTargetSellPrice = (actualTargetNet + minFeePerTranche) / actualShares;
      } else {
        actualTargetSellPrice = priceWithRate;
      }
    }
    actualTargetSellPrice = parseFloat(actualTargetSellPrice.toFixed(4));
  }

  const fullTargetProfitAmount = totalActualSpent * profitRate;
  let actualEquivalentTargetSellPrice = 0;
  if (actualShares > 0) {
    const equivTargetNet = actualSpent + fullTargetProfitAmount;
    if (feeMode === 'per_share') {
      const sellFee = Math.max(minFeePerTranche, actualShares * feePerShare);
      actualEquivalentTargetSellPrice = (equivTargetNet + sellFee) / actualShares;
    } else {
      const priceWithRate = (1 - feeRate) > 0 ? equivTargetNet / (actualShares * (1 - feeRate)) : 0;
      const gross = actualShares * priceWithRate;
      if (gross * feeRate < minFeePerTranche) {
        actualEquivalentTargetSellPrice = (equivTargetNet + minFeePerTranche) / actualShares;
      } else {
        actualEquivalentTargetSellPrice = priceWithRate;
      }
    }
    actualEquivalentTargetSellPrice = parseFloat(actualEquivalentTargetSellPrice.toFixed(4));
  }

  let actualRealizedProfitLossAmount = 0;
  let actualRealizedProfitLossPercent = 0;
  let actualRealizedProfitLossPercentOfFullPlan = 0;
  if (actualSellPrice > 0 && actualShares > 0) {
    const grossSell = actualShares * actualSellPrice;
    const sellFee = calcFee(actualShares, grossSell);
    const netSell = grossSell - sellFee;
    actualRealizedProfitLossAmount = netSell - actualSpent;
    actualRealizedProfitLossPercent = actualSpent > 0 ? (actualRealizedProfitLossAmount / actualSpent) * 100 : 0;

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
    feeMode,
    feePerShare,
    minFeePerTranche,
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
 * แปลงจำนวนเงินระหว่างสกุล THB และ USD ตามอัตราแลกเปลี่ยน
 * 
 * @param amount - จำนวนเงินที่ต้องการแปลง
 * @param from - สกุลเงินต้นทาง ('THB' หรือ 'USD')
 * @param to - สกุลเงินปลายทาง ('THB' หรือ 'USD')
 * @param exchangeRate - อัตราแลกเปลี่ยน (บาทต่อ 1 USD)
 * @param decimals - จำนวนทศนิยมที่ต้องการปัด (ค่าเริ่มต้น 2 ตำแหน่ง)
 * @returns จำนวนเงินที่แปลงแล้ว (ตัวเลข)
 */
export const convertCurrencyAmount = (
  amount: number,
  from: 'THB' | 'USD',
  to: 'THB' | 'USD',
  exchangeRate: number = 36.5,
  decimals: number = 2
): number => {
  if (from === to || amount <= 0 || exchangeRate <= 0) {
    return amount;
  }
  const converted = from === 'THB' && to === 'USD'
    ? amount / exchangeRate
    : amount * exchangeRate;

  return Number(converted.toFixed(decimals));
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

/**
 * โครงสร้างข้อมูลผลการคำนวณระดับราคาตัดขาดทุน (Stop Loss Levels)
 */
export interface StopLossLevels {
  /** % ขาดทุนแนะนำ เพื่อให้ผลตอบแทน 2 วันยังเหลือกำไรสุทธิ 50% ของเป้าหมาย */
  conservativeLossPercent: number;
  /** ราคาตัดขาดทุนแนะนำ */
  conservativeStopPrice: number;
  /** % ขาดทุนสูงสุดที่ยังไม่กินเงินต้นของวันก่อนหน้า (จุด Breakeven คืนเฉพาะกำไร) */
  breakevenLossPercent: number;
  /** ราคาตัดขาดทุนระดับวิกฤต (ห้ามหลุดเพื่อไม่ให้กินเงินต้นเดิม) */
  breakevenStopPrice: number;
  /** อัตราส่วนผลตอบแทนต่อความเสี่ยง (Risk-Reward Ratio) */
  riskRewardRatio: number;
}

/**
 * คำนวณระดับราคาตัดขาดทุน (Stop Loss) อัจฉริยะ อิงจาก % กำไรที่คาดหวัง และราคาต้นทุนเฉลี่ย
 * 
 * @param targetProfitPercent - เปอร์เซ็นต์กำไรที่คาดหวัง (เช่น 15)
 * @param baseCost - ราคาต้นทุนเฉลี่ยต่อหุ้น หรือราคาเข้าซื้อ
 * @returns ผลลัพธ์ระดับ Stop Loss ทั้งระดับคุมเสี่ยงและระดับวิกฤต (StopLossLevels)
 */
export const calculateStopLossLevels = (
  targetProfitPercent: number,
  baseCost: number
): StopLossLevels => {
  const p = Math.max(0, targetProfitPercent);
  const cost = Math.max(0, baseCost);

  if (p === 0 || cost === 0) {
    return {
      conservativeLossPercent: 0,
      conservativeStopPrice: cost,
      breakevenLossPercent: 0,
      breakevenStopPrice: cost,
      riskRewardRatio: 0,
    };
  }

  // 1. ระดับคุมความเสี่ยงแนะนำ (Conservative): ขาดทุนได้ไม่เกินเท่านี้ เพื่อให้ 2 วันเฉลี่ยยังเหลือกำไรสุทธิ 50% ของเป้าหมาย
  // สูตร: (P / 2) / (100 + P) * 100
  const conservativeLossPercent = parseFloat((((p / 2) / (100 + p)) * 100).toFixed(2));
  const conservativeStopPrice = parseFloat(Math.max(0.01, cost * (1 - conservativeLossPercent / 100)).toFixed(2));

  // 2. ระดับวิกฤตกันทุนเดิม (Breakeven): คืนเฉพาะกำไรที่เพิ่งได้มา ไม่กินทุนของวันก่อนหน้า
  // สูตร: P / (100 + P) * 100
  const breakevenLossPercent = parseFloat(((p / (100 + p)) * 100).toFixed(2));
  const breakevenStopPrice = parseFloat(Math.max(0.01, cost * (1 - breakevenLossPercent / 100)).toFixed(2));

  // 3. Risk-Reward Ratio (เป้าหมายกำไร เทียบกับ ความเสี่ยงที่ยอมรับ)
  const riskRewardRatio = conservativeLossPercent > 0 ? parseFloat((p / conservativeLossPercent).toFixed(2)) : 0;

  return {
    conservativeLossPercent,
    conservativeStopPrice,
    breakevenLossPercent,
    breakevenStopPrice,
    riskRewardRatio,
  };
};
