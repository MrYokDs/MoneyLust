/**
 * Route: /
 * หน้าหลักสำหรับคำนวณและวางแผนกลยุทธ์การแบ่งไม้เข้าซื้อหุ้น (Stock Grid Planner)
 */

import React, { useMemo, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Stack } from '@mui/material';
import { PATHS } from '../../routes';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  updateCurrentParams,
  savePlan,
  setActivePlanId,
  addPortfolio,
  Portfolio,
} from '../../store/stockPlannerSlice';
import {
  calculateStockTranches,
  formatNumber,
  calculatePortfolioSummary,
  convertCurrencyAmount,
} from '../../utils/stockMath';
import GridVisualizer from '../../components/GridVisualizer';
import { StockOption, StockDetail } from './types';
import StockPlannerForm from './sections/StockPlannerForm';
import TrancheDetailsTable from './sections/TrancheDetailsTable';
import EmptyPlannerAlert from './sections/EmptyPlannerAlert';

export const StockPlanner: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const currentParams = useAppSelector((state) => state.stockPlanner.currentParams);
  const activePlanId = useAppSelector((state) => state.stockPlanner.activePlanId);
  const portfolios = useAppSelector((state) => state.stockPlanner.portfolios);
  const savedPlans = useAppSelector((state) => state.stockPlanner.savedPlans);

  const [options, setOptions] = useState<StockOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [portfolioInputValue, setPortfolioInputValue] = useState('');
  const [stockDetail, setStockDetail] = useState<StockDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Sync local Autocomplete input with Redux stockSymbol
  useEffect(() => {
    if (currentParams.stockSymbol !== inputValue) {
      setInputValue(currentParams.stockSymbol || '');
    }
  }, [currentParams.stockSymbol]);

  // Sync portfolio input value
  useEffect(() => {
    if (currentParams.portfolioId) {
      const p = portfolios.find((port) => port.id === currentParams.portfolioId);
      if (p && p.id !== 'unassigned') {
        setPortfolioInputValue(p.name);
      } else {
        setPortfolioInputValue('');
      }
    }
  }, [currentParams.portfolioId, portfolios]);

  // Fetch full company name and live market cap from Nasdaq summary API via local Vite proxy
  useEffect(() => {
    if (!currentParams.stockSymbol || currentParams.stockSymbol.trim().length === 0) {
      setStockDetail(null);
      return;
    }

    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const symbol = currentParams.stockSymbol.toUpperCase().trim();
        let assetClass = 'stocks';

        let response = await fetch(`/api/nasdaq-summary/${symbol}/summary?assetclass=${assetClass}`);
        let json = await response.json();

        if (!json || json.status?.rCode !== 200 || !json.data?.summaryData) {
          assetClass = 'etf';
          response = await fetch(`/api/nasdaq-summary/${symbol}/summary?assetclass=${assetClass}`);
          json = await response.json();
        }

        if (json && json.status?.rCode === 200 && json.data?.summaryData) {
          const d = json.data.summaryData;

          let rawMarketCap = '';
          if (d.MarketCap?.value) {
            rawMarketCap = d.MarketCap.value;
          } else if (d.AUM?.value) {
            rawMarketCap = d.AUM.value;
          }

          let formattedMarketCap = '-';
          if (rawMarketCap && rawMarketCap !== 'N/A') {
            const cleanNum = parseFloat(rawMarketCap.replace(/,/g, ''));
            if (!isNaN(cleanNum)) {
              if (cleanNum >= 1e12) {
                formattedMarketCap = `$${(cleanNum / 1e12).toFixed(2)}T`;
              } else if (cleanNum >= 1e9) {
                formattedMarketCap = `$${(cleanNum / 1e9).toFixed(2)}B`;
              } else if (cleanNum >= 1e6) {
                formattedMarketCap = `$${(cleanNum / 1e6).toFixed(2)}M`;
              } else {
                formattedMarketCap = `$${formatNumber(cleanNum, 0)}`;
              }
            } else {
              formattedMarketCap = rawMarketCap;
            }
          }

          setStockDetail({
            name: json.data.companyName || d.Exchange?.value || '',
            marketCap: formattedMarketCap,
            sector: d.Sector?.value || '-',
            industry: d.Industry?.value || '-',
            fiftyTwoWeekRange: d.FiftTwoWeekHighLow?.value || '-',
            previousClose: d.PreviousClose?.value || '-',
            yield: d.Yield?.value || d.ExpenseRatio?.value || '-',
          });
        } else {
          setStockDetail(null);
        }
      } catch (error) {
        console.error('Error fetching stock summary:', error);
        setStockDetail(null);
      } finally {
        setLoadingDetail(false);
      }
    };

    const timeoutId = setTimeout(fetchDetail, 400);
    return () => clearTimeout(timeoutId);
  }, [currentParams.stockSymbol]);

  // Dynamic search from Yahoo Finance via local Vite dev proxy
  useEffect(() => {
    let active = true;

    if (inputValue.trim().length < 2) {
      setOptions([]);
      return undefined;
    }

    setLoading(true);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/stock-search?q=${encodeURIComponent(inputValue)}&quotesCount=8&newsCount=0`
        );
        const data = await response.json();

        if (active) {
          if (data && data.quotes) {
            const formattedOptions: StockOption[] = data.quotes
              .filter((q: any) => q.symbol)
              .map((q: any) => ({
                symbol: q.symbol,
                name: q.longname || q.shortname || '',
                exchange: q.exchDisp || q.exchange || '',
                type: q.typeDisp || q.quoteType || '',
              }));
            setOptions(formattedOptions);
          } else {
            setOptions([]);
          }
        }
      } catch (error) {
        console.error('Error fetching stock suggestions:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [inputValue]);

  /**
   * ซิงก์ค่าการเปลี่ยนแปลงในฟิลด์อินพุตเข้าสู่ Redux Store
   * 
   * @param field - ชื่อฟิลด์พารามิเตอร์ที่ต้องการแก้ไข
   * @param value - ค่าใหม่ของฟิลด์นั้น
   * @returns void
   */
  const handleChange = (field: keyof typeof currentParams | string, value: any): void => {
    dispatch(updateCurrentParams({ [field]: value }));
  };

  const stockSymbol = currentParams.stockSymbol;
  const currentPrice = parseFloat(currentParams.currentPrice) || 0;
  const totalBudget = parseFloat(currentParams.totalBudget) || 0;
  const tranchesCount = parseInt(currentParams.tranchesCount) || 1;
  const dropPercentage = parseFloat(currentParams.dropPercentage) || 0;
  const dropMode = currentParams.dropMode;
  const roundingMode = currentParams.roundingMode;
  const currency = currentParams.currency;
  const portfolioId = currentParams.portfolioId;
  const exchangeRate = parseFloat(currentParams.exchangeRate) || 36.5;

  const maxPossibleTranches = useMemo(() => {
    if (totalBudget <= 0 || currentPrice <= 0) return 99;
    if (roundingMode === 'fractional') return 99;

    const firstPrice =
      currentParams.currentPriceIsFirstTranche !== false
        ? currentPrice
        : currentPrice * (1 - dropPercentage / 100);

    const feeRate = (parseFloat(currentParams.feePercent) || 0) / 100;
    const costPerShare = firstPrice * (1 + feeRate);

    const minCostPerTranche = roundingMode === 'boardlot' ? costPerShare * 100 : costPerShare;

    const max = Math.floor(totalBudget / minCostPerTranche);
    return max > 0 ? max : 0;
  }, [
    totalBudget,
    currentPrice,
    dropPercentage,
    roundingMode,
    currentParams.feePercent,
    currentParams.currentPriceIsFirstTranche,
  ]);

  // Auto-clamp tranches count when maxPossibleTranches drops below the current value
  useEffect(() => {
    if (roundingMode === 'integer' || roundingMode === 'boardlot') {
      const current = parseInt(currentParams.tranchesCount) || 1;
      const maxAllowed = maxPossibleTranches > 0 ? maxPossibleTranches : 1;

      if (current > maxAllowed) {
        dispatch(updateCurrentParams({ tranchesCount: maxAllowed.toString() }));
      }
    }
  }, [maxPossibleTranches, roundingMode, currentParams.tranchesCount, dispatch]);

  // Poll real-time USD/THB exchange rate every 5 seconds if currency is USD
  useEffect(() => {
    if (currency !== 'USD') return;

    const fetchRate = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data && data.rates && data.rates.THB) {
          const liveRate = data.rates.THB;
          dispatch(updateCurrentParams({ exchangeRate: liveRate.toFixed(2) }));
        }
      } catch (err) {
        console.error('Failed to fetch real-time exchange rate:', err);
      }
    };

    fetchRate();
    const interval = setInterval(fetchRate, 5000);
    return () => clearInterval(interval);
  }, [currency, dispatch]);

  // Memoized Calculation Results
  const calcResult = useMemo(() => {
    if (currentPrice <= 0 || totalBudget <= 0 || tranchesCount <= 0) {
      return null;
    }
    const targetProfit = parseFloat(currentParams.targetProfitPercent) || 0;
    const fee = parseFloat(currentParams.feePercent) || 0;
    const actualSell = parseFloat(currentParams.actualSellPrice) || 0;
    const actualTranches = parseInt(currentParams.actualTranchesCount) || tranchesCount;
    const feeMode = currentParams.feeMode || 'percent';
    const feePerShare = parseFloat(currentParams.feePerShare) || 0.005;
    const minFeePerTranche = parseFloat(currentParams.minFeePerTranche) || 0;

    return calculateStockTranches(
      stockSymbol,
      currentPrice,
      totalBudget,
      tranchesCount,
      dropPercentage,
      dropMode,
      roundingMode,
      currency,
      exchangeRate,
      targetProfit,
      fee,
      actualSell,
      actualTranches,
      currentParams.currentPriceIsFirstTranche !== false,
      portfolioId,
      feeMode,
      feePerShare,
      minFeePerTranche
    );
  }, [
    stockSymbol,
    currentPrice,
    totalBudget,
    tranchesCount,
    dropPercentage,
    dropMode,
    roundingMode,
    currency,
    exchangeRate,
    currentParams.targetProfitPercent,
    currentParams.feePercent,
    currentParams.feeMode,
    currentParams.feePerShare,
    currentParams.minFeePerTranche,
    currentParams.actualSellPrice,
    currentParams.actualTranchesCount,
    currentParams.currentPriceIsFirstTranche,
    portfolioId,
  ]);

  // Check available limit if assigned to an existing portfolio
  const maxAvailableUSD = useMemo(() => {
    if (!portfolioId || portfolioId === 'unassigned') return null;

    const isNewPortfolio =
      portfolioInputValue &&
      portfolioInputValue.trim() !== '' &&
      !portfolios.find((p) => p.id === portfolioId);
    if (isNewPortfolio) return null;

    const portfolio = portfolios.find((p) => p.id === portfolioId);
    if (!portfolio) return null;

    const summary = calculatePortfolioSummary(portfolio, savedPlans, exchangeRate);

    let currentPlanSpentUSD = 0;
    if (activePlanId) {
      const existingPlan = savedPlans.find((p) => p.id === activePlanId);
      if (existingPlan) {
        const spent =
          existingPlan.actualSpent ?? existingPlan.totalActualSpent ?? existingPlan.totalBudget;
        currentPlanSpentUSD =
          (existingPlan.currency || 'THB') === 'THB' ? spent / exchangeRate : spent;
      }
    }

    return summary.availableCash + currentPlanSpentUSD;
  }, [portfolioId, portfolioInputValue, portfolios, savedPlans, exchangeRate, activePlanId]);

  const maxAvailableBudget = useMemo(() => {
    if (maxAvailableUSD === null) return null;
    return currency === 'THB' ? maxAvailableUSD * exchangeRate : maxAvailableUSD;
  }, [maxAvailableUSD, currency, exchangeRate]);

  const maxAvailableBudgetClamped = useMemo(() => {
    if (maxAvailableBudget === null) return null;
    return Math.floor(maxAvailableBudget * 100) / 100;
  }, [maxAvailableBudget]);

  const isAtMaxLimit =
    maxAvailableBudgetClamped !== null && totalBudget >= maxAvailableBudgetClamped;

  /**
   * จัดการการเลือกหรือสร้างพอร์ตการลงทุนใหม่ และอัปเดตงบประมาณตามเงินสดคงเหลือของพอร์ต
   * 
   * @param selected - ออบเจกต์พอร์ตโฟลิโอที่เลือก หรือ null หากพิมพ์สร้างใหม่
   * @param textValue - ข้อความชื่อพอร์ตในกรณีที่พิมพ์สร้างใหม่
   * @returns void
   */
  const handleSelectPortfolio = (selected: Portfolio | null, textValue?: string): void => {
    if (selected) {
      handleChange('portfolioId', selected.id);
      setPortfolioInputValue(selected.name);

      if (selected.id !== 'unassigned') {
        const summary = calculatePortfolioSummary(
          selected,
          savedPlans,
          parseFloat(currentParams.exchangeRate) || 36.5
        );
        if (summary.availableCash > 0) {
          handleChange('totalBudget', summary.availableCash.toString());
        }
      }
    } else if (textValue !== undefined) {
      setPortfolioInputValue(textValue);
    } else {
      handleChange('portfolioId', 'unassigned');
      setPortfolioInputValue('');
    }
  };

  /**
   * ตรวจสอบความถูกต้องของข้อมูล บันทึกหรืออัปเดตแผนการลงทุนลงในระบบ พร้อมนำทางไปยังหน้ารายละเอียดพอร์ต
   * 
   * @returns void
   */
  const handleSave = (): void => {
    if (!calcResult) {
      enqueueSnackbar('กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึก', { variant: 'error' });
      return;
    }

    if (maxAvailableBudgetClamped !== null && totalBudget > maxAvailableBudgetClamped + 0.01) {
      enqueueSnackbar('งบลงทุนต้องไม่เกินเงินที่สามารถลงทุนได้ของพอร์ต', { variant: 'error' });
      return;
    }

    let currentPortfolioId = portfolioId;
    if (portfolioInputValue && portfolioInputValue.trim() !== '') {
      const existing = portfolios.find(
        (p) => p.name.toLowerCase() === portfolioInputValue.trim().toLowerCase()
      );
      if (!existing) {
        const newId = crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 9);
        dispatch(
          addPortfolio({
            id: newId,
            name: portfolioInputValue.trim(),
            createdAt: new Date().toISOString(),
          })
        );
        currentPortfolioId = newId;
        handleChange('portfolioId', newId);
        enqueueSnackbar(`สร้างพอร์ตใหม่ "${portfolioInputValue.trim()}" เรียบร้อย!`, {
          variant: 'success',
        });
      } else {
        currentPortfolioId = existing.id;
        handleChange('portfolioId', existing.id);
      }
    }

    const finalCalcResult = { ...calcResult, portfolioId: currentPortfolioId };

    let soldAt: string | undefined = undefined;
    if (finalCalcResult.actualSellPrice && finalCalcResult.actualSellPrice > 0) {
      if (activePlanId) {
        const existingPlan = savedPlans.find((p) => p.id === activePlanId);
        soldAt = existingPlan?.soldAt || new Date().toISOString();
      } else {
        soldAt = new Date().toISOString();
      }
    }

    const planToSave = activePlanId
      ? { ...finalCalcResult, id: activePlanId, soldAt }
      : { ...finalCalcResult, soldAt };
    dispatch(savePlan(planToSave));

    if (activePlanId) {
      enqueueSnackbar(`อัปเดตแผนการถัวหุ้น ${calcResult.stockSymbol} สำเร็จ!`, {
        variant: 'success',
        autoHideDuration: 3000,
      });
    } else {
      dispatch(setActivePlanId(planToSave.id));
      enqueueSnackbar(`บันทึกแผนการถัวหุ้น ${calcResult.stockSymbol} สำเร็จ!`, {
        variant: 'success',
        autoHideDuration: 3000,
      });
    }

    dispatch(setActivePlanId(null));
    setTimeout(() => {
      navigate(PATHS.PORTFOLIO(currentPortfolioId));
    }, 800);
  };

  /**
   * รีเซ็ตพารามิเตอร์การวางแผนทั้งหมดกลับเป็นค่าเริ่มต้น พร้อมแสดงการแจ้งเตือน
   * 
   * @returns void
   */
  const handleReset = (): void => {
    dispatch(setActivePlanId(null));
    dispatch(
      updateCurrentParams({
        stockSymbol: '', currentPrice: '', totalBudget: '1000', tranchesCount: '2',
        dropPercentage: '15', dropMode: 'progressive', roundingMode: 'fractional',
        currency: 'USD', targetProfitPercent: '10', feePercent: '0.10', feeMode: 'percent',
        feePerShare: '0.005', minFeePerTranche: '0', actualSellPrice: '',
        actualTranchesCount: '', currentPriceIsFirstTranche: false, portfolioId: 'unassigned',
      })
    );
    enqueueSnackbar('รีเซ็ตข้อมูลเริ่มต้นเรียบร้อย', { variant: 'info' });
  };

  /**
   * แปลงค่าตัวเลขที่กรอกไว้ตามอัตราแลกเปลี่ยน พร้อมสลับสกุลเงินอัตโนมัติ
   * 
   * @returns void
   */
  const handleConvertCurrencyValues = (): void => {
    const targetCurrency = currency === 'THB' ? 'USD' : 'THB';
    const rate = parseFloat(currentParams.exchangeRate) || 36.5;
    const currentPriceNum = parseFloat(currentParams.currentPrice) || 0;
    const totalBudgetNum = parseFloat(currentParams.totalBudget) || 0;
    const actualSellPriceNum = parseFloat(currentParams.actualSellPrice) || 0;

    const updates: any = { currency: targetCurrency };
    if (currentPriceNum > 0) {
      updates.currentPrice = convertCurrencyAmount(currentPriceNum, currency, targetCurrency, rate).toString();
    }
    if (totalBudgetNum > 0) {
      updates.totalBudget = convertCurrencyAmount(totalBudgetNum, currency, targetCurrency, rate).toString();
    }
    if (actualSellPriceNum > 0) {
      updates.actualSellPrice = convertCurrencyAmount(actualSellPriceNum, currency, targetCurrency, rate).toString();
    }

    dispatch(updateCurrentParams(updates));
    enqueueSnackbar(`แปลงค่าตัวเลขเป็น ${targetCurrency} เรียบร้อย (เรต ${rate.toFixed(2)})`, {
      variant: 'success',
    });
  };

  return (
    <Box sx={{ flexGrow: 1, py: 1 }}>
      <Grid container spacing={4}>
        {/* 1. Form Inputs Section */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <StockPlannerForm
            activePlanId={activePlanId}
            stockSymbol={stockSymbol}
            portfolios={portfolios}
            portfolioId={portfolioId}
            portfolioInputValue={portfolioInputValue}
            setPortfolioInputValue={setPortfolioInputValue}
            onSelectPortfolio={handleSelectPortfolio}
            currency={currency}
            exchangeRate={currentParams.exchangeRate}
            onCurrencyChange={(c) => handleChange('currency', c)}
            onExchangeRateChange={(r) => handleChange('exchangeRate', r)}
            onConvertCurrencyValues={handleConvertCurrencyValues}
            stockInputValue={inputValue}
            setStockInputValue={setInputValue}
            stockOptions={options}
            loadingStockOptions={loading}
            stockDetail={stockDetail}
            loadingStockDetail={loadingDetail}
            onSelectStock={(sym) => handleChange('stockSymbol', sym)}
            onApplyPrice={(price) => {
              handleChange('currentPrice', price);
              enqueueSnackbar(`ดึงราคาล่าสุด ${stockDetail?.previousClose} เรียบร้อย!`, { variant: 'success' });
            }}
            currentPrice={currentParams.currentPrice}
            currentPriceIsFirstTranche={currentParams.currentPriceIsFirstTranche !== false}
            totalBudget={currentParams.totalBudget}
            maxAvailableBudgetClamped={maxAvailableBudgetClamped}
            maxAvailableBudget={maxAvailableBudget}
            isAtMaxLimit={isAtMaxLimit}
            dropPercentage={currentParams.dropPercentage}
            tranchesCount={currentParams.tranchesCount}
            maxPossibleTranches={maxPossibleTranches}
            dropMode={dropMode}
            roundingMode={roundingMode}
            targetProfitPercent={currentParams.targetProfitPercent}
            feePercent={currentParams.feePercent}
            feeMode={currentParams.feeMode || 'percent'}
            feePerShare={currentParams.feePerShare || '0.005'}
            minFeePerTranche={currentParams.minFeePerTranche || '0'}
            actualSellPrice={currentParams.actualSellPrice}
            actualTranchesCount={currentParams.actualTranchesCount}
            calcResult={calcResult}
            onParamChange={handleChange}
            onReset={handleReset}
            onSave={handleSave}
            onCancelActivePlan={() => dispatch(setActivePlanId(null))}
          />
        </Grid>

        {/* 2. Visualizations and Tables Section */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {calcResult ? (
            <Stack spacing={4}>
              <GridVisualizer result={calcResult} />
              <TrancheDetailsTable
                calcResult={calcResult}
                currency={currency}
                exchangeRate={exchangeRate}
                roundingMode={roundingMode}
              />
            </Stack>
          ) : (
            <EmptyPlannerAlert />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default StockPlanner;
