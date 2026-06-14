import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CalculationResult } from '../utils/stockMath';

export interface CapitalAdjustment {
  id: string;
  date: string;
  amountChange: number;
}

export interface Portfolio {
  id: string;
  name: string;
  createdAt: string;
  initialCapital?: number;
  adjustments?: CapitalAdjustment[];
}

export interface StockPlannerState {
  savedPlans: CalculationResult[];
  portfolios: Portfolio[];
  activePlanId: string | null;
  currentParams: {
    stockSymbol: string;
    currentPrice: string;
    totalBudget: string;
    tranchesCount: string;
    dropPercentage: string;
    dropMode: 'progressive' | 'fixed';
    roundingMode: 'fractional' | 'integer' | 'boardlot';
    currency: 'THB' | 'USD';
    exchangeRate: string;
    targetProfitPercent: string;
    feePercent: string;
    actualSellPrice: string;
    actualTranchesCount: string;
    currentPriceIsFirstTranche?: boolean;
    portfolioId: string;
  };
}

const LOCAL_STORAGE_KEY = 'wealthflow_saved_plans';

const loadPlansFromLocalStorage = (): CalculationResult[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load plans from localStorage', e);
    return [];
  }
};

const savePlansToLocalStorage = (plans: CalculationResult[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(plans));
  } catch (e) {
    console.error('Failed to save plans to localStorage', e);
  }
};

const LOCAL_PORTFOLIOS_KEY = 'wealthflow_portfolios';

const loadPortfoliosFromLocalStorage = (): Portfolio[] => {
  try {
    const data = localStorage.getItem(LOCAL_PORTFOLIOS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    if (parsed.length === 0) {
      return [{ id: 'unassigned', name: 'ยังไม่ได้จัดพอร์ตการลงทุน', createdAt: new Date().toISOString() }];
    }
    return parsed;
  } catch (e) {
    return [{ id: 'unassigned', name: 'ยังไม่ได้จัดพอร์ตการลงทุน', createdAt: new Date().toISOString() }];
  }
};

const savePortfoliosToLocalStorage = (portfolios: Portfolio[]) => {
  try {
    localStorage.setItem(LOCAL_PORTFOLIOS_KEY, JSON.stringify(portfolios));
  } catch (e) {
    console.error('Failed to save portfolios to localStorage', e);
  }
};

const initialState: StockPlannerState = {
  savedPlans: loadPlansFromLocalStorage(),
  portfolios: loadPortfoliosFromLocalStorage(),
  activePlanId: null,
  currentParams: {
    stockSymbol: 'NVDA',
    currentPrice: '100',
    totalBudget: '1000',
    tranchesCount: '1',
    dropPercentage: '3',
    dropMode: 'progressive',
    roundingMode: 'integer',
    currency: 'USD',
    exchangeRate: '36.50',
    targetProfitPercent: '10',
    feePercent: '1.2',
    actualSellPrice: '',
    actualTranchesCount: '',
    currentPriceIsFirstTranche: true,
    portfolioId: 'unassigned',
  },
};

export const stockPlannerSlice = createSlice({
  name: 'stockPlanner',
  initialState,
  reducers: {
    savePlan: (state, action: PayloadAction<CalculationResult>) => {
      const existingIndex = state.savedPlans.findIndex(p => p.id === action.payload.id);
      if (existingIndex > -1) {
        // Overwrite existing plan (with updated timestamp/content)
        state.savedPlans[existingIndex] = {
          ...action.payload,
          createdAt: new Date().toISOString() // update timestamp to reflect edit time
        };
      } else {
        // Save as a brand-new plan
        state.savedPlans = [action.payload, ...state.savedPlans];
        // Auto-set initial capital for portfolio if not set
        if (action.payload.portfolioId && action.payload.portfolioId !== 'unassigned') {
          const port = state.portfolios.find(p => p.id === action.payload.portfolioId);
          if (port && port.initialCapital === undefined) {
            port.initialCapital = action.payload.totalBudget;
            savePortfoliosToLocalStorage(state.portfolios);
          }
        }
      }
      savePlansToLocalStorage(state.savedPlans);
    },
    deletePlan: (state, action: PayloadAction<string>) => {
      state.savedPlans = state.savedPlans.filter(plan => plan.id !== action.payload);
      if (state.activePlanId === action.payload) {
        state.activePlanId = null;
      }
      savePlansToLocalStorage(state.savedPlans);
    },
    updateCurrentParams: (state, action: PayloadAction<Partial<StockPlannerState['currentParams']>>) => {
      state.currentParams = { ...state.currentParams, ...action.payload };
    },
    setActivePlanId: (state, action: PayloadAction<string | null>) => {
      state.activePlanId = action.payload;
    },
    clearAllPlans: (state) => {
      state.savedPlans = [];
      state.activePlanId = null;
      savePlansToLocalStorage([]);
    },
    addPortfolio: (state, action: PayloadAction<Portfolio>) => {
      state.portfolios = [...state.portfolios, action.payload];
      savePortfoliosToLocalStorage(state.portfolios);
    },
    deletePortfolio: (state, action: PayloadAction<string>) => {
      // Cannot delete unassigned
      if (action.payload === 'unassigned') return;
      state.portfolios = state.portfolios.filter(p => p.id !== action.payload);
      // Delete all plans under this portfolio
      state.savedPlans = state.savedPlans.filter(p => p.portfolioId !== action.payload);
      if (state.currentParams.portfolioId === action.payload) {
        state.currentParams.portfolioId = 'unassigned';
      }
      savePortfoliosToLocalStorage(state.portfolios);
      savePlansToLocalStorage(state.savedPlans);
    },
    reorderPortfolios: (state, action: PayloadAction<Portfolio[]>) => {
      state.portfolios = action.payload;
      savePortfoliosToLocalStorage(state.portfolios);
    },
    updatePortfolioCapital: (state, action: PayloadAction<{ id: string; capital: number }>) => {
      const p = state.portfolios.find(p => p.id === action.payload.id);
      if (p) {
        const oldCapital = p.initialCapital || 0;
        const diff = action.payload.capital - oldCapital;
        if (diff !== 0) {
          p.initialCapital = action.payload.capital;
          
          if (!p.adjustments) p.adjustments = [];
          p.adjustments.push({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            amountChange: diff
          });
          
          savePortfoliosToLocalStorage(state.portfolios);
        }
      }
    },
    clearPortfolioAdjustments: (state, action: PayloadAction<string>) => {
      const p = state.portfolios.find(p => p.id === action.payload);
      if (p) {
        p.adjustments = [];
        savePortfoliosToLocalStorage(state.portfolios);
      }
    }
  },
});

export const { savePlan, deletePlan, updateCurrentParams, setActivePlanId, clearAllPlans, addPortfolio, deletePortfolio, reorderPortfolios, updatePortfolioCapital, clearPortfolioAdjustments } = stockPlannerSlice.actions;
export default stockPlannerSlice.reducer;
