export interface TrancheDetail {
  trancheNumber: number;
  budgetAllocated: number;
  price: number;
  sharesBought: number;
  actualSpent: number;
  leftoverCash: number;
  
  // Cumulative stats
  cumulativeBudgetAllocated: number;
  cumulativeSpent: number;
  cumulativeShares: number;
  cumulativeAverageCost: number;
  cumulativeLeftoverCash: number;
  priceDiscountPercent: number;
  averageCostDiscountPercent: number;
}

export interface CalculationResult {
  id: string;
  stockSymbol: string;
  currentPrice: number;
  totalBudget: number;
  tranchesCount: number;
  dropPercentage: number;
  dropMode: 'progressive' | 'fixed';
  roundingMode: 'fractional' | 'integer' | 'boardlot';
  createdAt: string;
  
  tranches: TrancheDetail[];
  
  // Summary stats
  totalActualSpent: number;
  totalSharesBought: number;
  finalAverageCost: number;
  totalLeftoverCash: number;
  overallDiscountPercent: number;
  currency?: 'THB' | 'USD';
  exchangeRate?: number;
  targetProfitPercent?: number;
  feePercent?: number;
  actualSellPrice?: number;
  targetSellPrice?: number;
  realizedProfitLossAmount?: number;
  realizedProfitLossPercent?: number;
  currentPriceIsFirstTranche?: boolean;

  // Actual executed stats (if actualTranchesCount is less than tranchesCount)
  actualTranchesCount?: number;
  actualSpent?: number;
  actualShares?: number;
  actualAverageCost?: number;
  actualLeftoverCash?: number;
  actualDiscountPercent?: number;
  actualTargetSellPrice?: number;
  actualEquivalentTargetSellPrice?: number;
  actualRealizedProfitLossAmount?: number;
  actualRealizedProfitLossPercent?: number;
  actualRealizedProfitLossPercentOfFullPlan?: number;
  portfolioId?: string;
  soldAt?: string;
}

/**
 * Calculates stock purchase tranches (average-down strategy).
 * Divide budget equally, allocating remainder to the final tranche.
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
 * Format currency to beautiful Thai Baht format
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
 * Format standard number with commas
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Format currency to USD format
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
 * Format currency dynamically based on THB/USD and optionally include conversion
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
