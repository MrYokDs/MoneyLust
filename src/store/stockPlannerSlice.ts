import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CalculationResult } from '../utils/stockMath';

export interface Portfolio {
  id: string;
  name: string;
  createdAt: string;
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
    roundingMode: 'fractional',
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
    }
  },
});

export const { savePlan, deletePlan, updateCurrentParams, setActivePlanId, clearAllPlans, addPortfolio, deletePortfolio, reorderPortfolios } = stockPlannerSlice.actions;
export default stockPlannerSlice.reducer;
