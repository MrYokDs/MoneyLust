/**
 * Route: /
 * Section: StockPlannerForm (ฟอร์มกรอกข้อมูลการวางแผนและคำนวณการแบ่งไม้ซื้อหุ้น)
 */

import React from 'react';
import {
  Stack,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import { Settings, RefreshCw, Bookmark } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import PortfolioSelectField from './PortfolioSelectField';
import CurrencyExchangeField from './CurrencyExchangeField';
import StockSearchSection from './StockSearchSection';
import InvestmentParamsSection from './InvestmentParamsSection';
import ExitStrategySection from './ExitStrategySection';
import { Portfolio } from '../../../store/stockPlannerSlice';
import { StockOption, StockDetail } from '../types';
import { CalculationResult } from '../../../utils/stockMath';

interface StockPlannerFormProps {
  activePlanId: string | null;
  stockSymbol: string;
  portfolios: Portfolio[];
  portfolioId: string;
  portfolioInputValue: string;
  setPortfolioInputValue: (val: string) => void;
  onSelectPortfolio: (portfolio: Portfolio | null, textValue?: string) => void;
  currency: 'THB' | 'USD';
  exchangeRate: string;
  onCurrencyChange: (c: 'THB' | 'USD') => void;
  onExchangeRateChange: (rate: string) => void;
  stockInputValue: string;
  setStockInputValue: (val: string) => void;
  stockOptions: StockOption[];
  loadingStockOptions: boolean;
  stockDetail: StockDetail | null;
  loadingStockDetail: boolean;
  onSelectStock: (symbol: string) => void;
  onApplyPrice: (price: string) => void;
  currentPrice: string;
  currentPriceIsFirstTranche: boolean;
  totalBudget: string;
  maxAvailableBudgetClamped: number | null;
  maxAvailableBudget: number | null;
  isAtMaxLimit: boolean;
  dropPercentage: string;
  tranchesCount: string;
  maxPossibleTranches: number;
  dropMode: 'progressive' | 'fixed';
  roundingMode: 'fractional' | 'integer' | 'boardlot';
  targetProfitPercent: string;
  feePercent: string;
  actualSellPrice: string;
  actualTranchesCount: string;
  calcResult: CalculationResult | null;
  onParamChange: (field: string, value: any) => void;
  onReset: () => void;
  onSave: () => void;
  onCancelActivePlan: () => void;
}

export const StockPlannerForm: React.FC<StockPlannerFormProps> = ({
  activePlanId,
  stockSymbol,
  portfolios,
  portfolioId,
  portfolioInputValue,
  setPortfolioInputValue,
  onSelectPortfolio,
  currency,
  exchangeRate,
  onCurrencyChange,
  onExchangeRateChange,
  stockInputValue,
  setStockInputValue,
  stockOptions,
  loadingStockOptions,
  stockDetail,
  loadingStockDetail,
  onSelectStock,
  onApplyPrice,
  currentPrice,
  currentPriceIsFirstTranche,
  totalBudget,
  maxAvailableBudgetClamped,
  maxAvailableBudget,
  isAtMaxLimit,
  dropPercentage,
  tranchesCount,
  maxPossibleTranches,
  dropMode,
  roundingMode,
  targetProfitPercent,
  feePercent,
  actualSellPrice,
  actualTranchesCount,
  calcResult,
  onParamChange,
  onReset,
  onSave,
  onCancelActivePlan,
}) => {
  return (
    <GlassCard sx={{ height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Settings size={22} color="#10b981" />
          <Typography variant="h5" fontWeight="bold" fontFamily="Prompt">
            ข้อมูลการลงทุน
          </Typography>
        </Stack>
        <Button
          variant="outlined"
          size="small"
          onClick={onReset}
          startIcon={<RefreshCw size={14} />}
          sx={{
            borderColor: 'rgba(255,255,255,0.08)',
            color: 'text.secondary',
            '&:hover': {
              borderColor: 'primary.main',
              color: 'primary.light',
            },
          }}
        >
          รีเซ็ต
        </Button>
      </Stack>

      <Stack spacing={3}>
        {activePlanId && (
          <Alert
            severity="info"
            icon={false}
            sx={{
              borderRadius: 3,
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              py: 1,
              px: 2,
              '& .MuiAlert-message': {
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 0,
              },
            }}
          >
            <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'Prompt', color: 'secondary.light' }}>
              📝 กำลังแก้ไขแผน {stockSymbol}
            </Typography>
            <Button
              variant="text"
              size="small"
              color="secondary"
              onClick={onCancelActivePlan}
              sx={{ fontFamily: 'Prompt', fontWeight: 'bold', py: 0.2, px: 1, minWidth: 0, textTransform: 'none' }}
            >
              สร้างใหม่แทน
            </Button>
          </Alert>
        )}

        {/* Portfolio Selection */}
        <PortfolioSelectField
          portfolios={portfolios}
          portfolioId={portfolioId}
          portfolioInputValue={portfolioInputValue}
          setPortfolioInputValue={setPortfolioInputValue}
          onSelectPortfolio={onSelectPortfolio}
        />

        {/* Currency Selection */}
        <CurrencyExchangeField
          currency={currency}
          exchangeRate={exchangeRate}
          onCurrencyChange={onCurrencyChange}
          onExchangeRateChange={onExchangeRateChange}
        />

        {/* Stock Search & Company Details */}
        <StockSearchSection
          inputValue={stockInputValue}
          setInputValue={setStockInputValue}
          options={stockOptions}
          loading={loadingStockOptions}
          stockDetail={stockDetail}
          loadingDetail={loadingStockDetail}
          onSelectStock={onSelectStock}
          onApplyPrice={onApplyPrice}
        />

        {/* Investment Parameters */}
        <InvestmentParamsSection
          currency={currency}
          exchangeRate={parseFloat(exchangeRate) || 36.5}
          currentPrice={currentPrice}
          currentPriceIsFirstTranche={currentPriceIsFirstTranche}
          totalBudget={totalBudget}
          maxAvailableBudgetClamped={maxAvailableBudgetClamped}
          maxAvailableBudget={maxAvailableBudget}
          isAtMaxLimit={isAtMaxLimit}
          dropPercentage={dropPercentage}
          tranchesCount={tranchesCount}
          maxPossibleTranches={maxPossibleTranches}
          dropMode={dropMode}
          roundingMode={roundingMode}
          onChange={onParamChange}
        />

        {/* Exit Strategy */}
        <ExitStrategySection
          currency={currency}
          tranchesCount={parseInt(tranchesCount) || 1}
          targetProfitPercent={targetProfitPercent}
          feePercent={feePercent}
          actualSellPrice={actualSellPrice}
          actualTranchesCount={actualTranchesCount}
          onChange={onParamChange}
        />

        {/* Action Button */}
        <Stack direction="row" spacing={2} pt={1}>
          <Button
            variant="contained"
            fullWidth
            onClick={onSave}
            disabled={!calcResult}
            startIcon={<Bookmark size={18} />}
            sx={{
              py: 1.5,
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)',
            }}
          >
            บันทึกแผนการลงทุน
          </Button>
        </Stack>
      </Stack>
    </GlassCard>
  );
};

export default StockPlannerForm;
