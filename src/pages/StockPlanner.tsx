import React, { useMemo, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  Select,
  InputAdornment,
  FormHelperText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Tooltip,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  useTheme,
  Autocomplete,
  CircularProgress,
  Checkbox
} from '@mui/material';
import {
  TrendingDown,
  DollarSign,
  Layers,
  Percent,
  Bookmark,
  RefreshCw,
  Coins,
  Settings
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { updateCurrentParams, savePlan, setActivePlanId, addPortfolio } from '../store/stockPlannerSlice';
import { calculateStockTranches, formatNumber, formatCurrency, calculatePortfolioSummary } from '../utils/stockMath';
import GlassCard from '../components/GlassCard';
import GridVisualizer from '../components/GridVisualizer';

export const StockPlanner: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const currentParams = useAppSelector(state => state.stockPlanner.currentParams);
  const activePlanId = useAppSelector(state => state.stockPlanner.activePlanId);
  const portfolios = useAppSelector(state => state.stockPlanner.portfolios);
  const savedPlans = useAppSelector(state => state.stockPlanner.savedPlans);

  interface StockOption {
    symbol: string;
    name: string;
    exchange: string;
    type: string;
  }

  const [options, setOptions] = React.useState<StockOption[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [portfolioInputValue, setPortfolioInputValue] = React.useState('');

  // Sync local Autocomplete input with Redux stockSymbol
  useEffect(() => {
    if (currentParams.stockSymbol !== inputValue) {
      setInputValue(currentParams.stockSymbol || '');
    }
  }, [currentParams.stockSymbol]);

  useEffect(() => {
    if (currentParams.portfolioId) {
      const p = portfolios.find(port => port.id === currentParams.portfolioId);
      if (p && p.id !== 'unassigned') {
        setPortfolioInputValue(p.name);
      } else {
        setPortfolioInputValue('');
      }
    }
  }, [currentParams.portfolioId, portfolios]);

  interface StockDetail {
    name: string;
    marketCap: string;
    sector: string;
    industry: string;
    fiftyTwoWeekRange: string;
    previousClose: string;
    yield: string;
  }
  
  const [stockDetail, setStockDetail] = React.useState<StockDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

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
        
        // Try fetching stocks summary first
        let response = await fetch(`/api/nasdaq-summary/${symbol}/summary?assetclass=${assetClass}`);
        let json = await response.json();
        
        // If stocks query fails or returns empty, try ETF
        if (!json || json.status?.rCode !== 200 || !json.data?.summaryData) {
          assetClass = 'etf';
          response = await fetch(`/api/nasdaq-summary/${symbol}/summary?assetclass=${assetClass}`);
          json = await response.json();
        }

        if (json && json.status?.rCode === 200 && json.data?.summaryData) {
          const d = json.data.summaryData;
          
          // Extract and format Market Cap
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
        if (activePlanId !== undefined) {
          setLoadingDetail(false);
        } else {
          setLoadingDetail(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchDetail, 400);
    return () => clearTimeout(timeoutId);
  }, [currentParams.stockSymbol]);

  // Dynamic search from Yahoo Finance via local Vite dev proxy (covers 100% of global/US stocks, keyless)
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

  // Sync inputs with Redux
  const handleChange = (field: keyof typeof currentParams, value: string | boolean) => {
    dispatch(updateCurrentParams({ [field]: value }));
  };

  // Convert inputs to numbers safely
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

    const firstPrice = currentParams.currentPriceIsFirstTranche !== false 
      ? currentPrice 
      : currentPrice * (1 - dropPercentage / 100);
      
    const feeRate = (parseFloat(currentParams.feePercent) || 0) / 100;
    const costPerShare = firstPrice * (1 + feeRate);
    
    const minCostPerTranche = roundingMode === 'boardlot' ? costPerShare * 100 : costPerShare;
    
    const max = Math.floor(totalBudget / minCostPerTranche);
    return max > 0 ? max : 0;
  }, [totalBudget, currentPrice, dropPercentage, roundingMode, currentParams.feePercent, currentParams.currentPriceIsFirstTranche]);

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

    // Initial fetch
    fetchRate();

    const interval = setInterval(fetchRate, 5000);
    return () => clearInterval(interval);
  }, [currency, dispatch]);

  // Memoized Calculation Results - Updates instantly as inputs change
  const calcResult = useMemo(() => {
    if (currentPrice <= 0 || totalBudget <= 0 || tranchesCount <= 0) {
      return null;
    }
    const targetProfit = parseFloat(currentParams.targetProfitPercent) || 0;
    const fee = parseFloat(currentParams.feePercent) || 0;
    const actualSell = parseFloat(currentParams.actualSellPrice) || 0;
    const actualTranches = parseInt(currentParams.actualTranchesCount) || tranchesCount;

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
      portfolioId
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
    currentParams.actualSellPrice,
    currentParams.actualTranchesCount,
    currentParams.currentPriceIsFirstTranche,
    portfolioId
  ]);

  // Check available limit if assigned to an existing portfolio
  const maxAvailableUSD = useMemo(() => {
    if (!portfolioId || portfolioId === 'unassigned') return null;
    
    // Check if it's a completely new portfolio being typed
    const isNewPortfolio = portfolioInputValue && portfolioInputValue.trim() !== '' && !portfolios.find(p => p.id === portfolioId);
    if (isNewPortfolio) return null;

    const portfolio = portfolios.find(p => p.id === portfolioId);
    if (!portfolio) return null;

    const summary = calculatePortfolioSummary(portfolio, savedPlans, exchangeRate);
    
    // If we're editing an existing plan, add its spent amount back to available cash
    let currentPlanSpentUSD = 0;
    if (activePlanId) {
      const existingPlan = savedPlans.find(p => p.id === activePlanId);
      if (existingPlan) {
        const spent = existingPlan.actualSpent ?? existingPlan.totalActualSpent ?? existingPlan.totalBudget;
        currentPlanSpentUSD = (existingPlan.currency || 'THB') === 'THB' ? spent / exchangeRate : spent;
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

  const isAtMaxLimit = maxAvailableBudgetClamped !== null && totalBudget >= maxAvailableBudgetClamped;

  // Handle Save Plan
  const handleSave = () => {
    if (!calcResult) {
      enqueueSnackbar('กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึก', { variant: 'error' });
      return;
    }

    if (maxAvailableBudgetClamped !== null && totalBudget > maxAvailableBudgetClamped + 0.01) {
      enqueueSnackbar(`งบลงทุนต้องไม่เกินเงินที่สามารถลงทุนได้ของพอร์ต`, { variant: 'error' });
      return;
    }

    let currentPortfolioId = portfolioId;
    if (portfolioInputValue && portfolioInputValue.trim() !== '') {
      const existing = portfolios.find(p => p.name.toLowerCase() === portfolioInputValue.trim().toLowerCase());
      if (!existing) {
        const newId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
        dispatch(addPortfolio({ id: newId, name: portfolioInputValue.trim(), createdAt: new Date().toISOString() }));
        currentPortfolioId = newId;
        handleChange('portfolioId', newId);
        enqueueSnackbar(`สร้างพอร์ตใหม่ "${portfolioInputValue.trim()}" เรียบร้อย!`, { variant: 'success' });
      } else {
        currentPortfolioId = existing.id;
        handleChange('portfolioId', existing.id);
      }
    }

    const finalCalcResult = { ...calcResult, portfolioId: currentPortfolioId };

    let soldAt: string | undefined = undefined;
    if (finalCalcResult.actualSellPrice && finalCalcResult.actualSellPrice > 0) {
      if (activePlanId) {
        const existingPlan = savedPlans.find(p => p.id === activePlanId);
        soldAt = existingPlan?.soldAt || new Date().toISOString();
      } else {
        soldAt = new Date().toISOString();
      }
    }

    // If activePlanId is set, overwrite the existing plan by matching IDs
    const planToSave = activePlanId ? { ...finalCalcResult, id: activePlanId, soldAt } : { ...finalCalcResult, soldAt };
    dispatch(savePlan(planToSave));

    if (activePlanId) {
      enqueueSnackbar(`อัปเดตแผนการถัวหุ้น ${calcResult.stockSymbol} สำเร็จ!`, {
        variant: 'success',
        autoHideDuration: 3000
      });
    } else {
      dispatch(setActivePlanId(planToSave.id));
      enqueueSnackbar(`บันทึกแผนการถัวหุ้น ${calcResult.stockSymbol} สำเร็จ!`, {
        variant: 'success',
        autoHideDuration: 3000
      });
    }

    dispatch(setActivePlanId(null));
    setTimeout(() => {
      navigate(`/portfolio/${currentPortfolioId}`);
    }, 800);
  };

  // Reset parameters
  const handleReset = () => {
    dispatch(setActivePlanId(null));
    dispatch(updateCurrentParams({
      stockSymbol: '',
      currentPrice: '',
      totalBudget: '1000',
      tranchesCount: '1',
      dropPercentage: '3',
      dropMode: 'progressive',
      roundingMode: 'fractional',
      currency: 'USD',
      targetProfitPercent: '10',
      feePercent: '1.2',
      actualSellPrice: '',
      actualTranchesCount: '',
      currentPriceIsFirstTranche: true,
      portfolioId: 'unassigned',
    }));
    enqueueSnackbar('รีเซ็ตข้อมูลเริ่มต้นเรียบร้อย', { variant: 'info' });
  };

  return (
    <Box sx={{ flexGrow: 1, py: 1 }}>
      <Grid container spacing={4}>
        {/* 1. Form Inputs */}
        <Grid size={{ xs: 12, lg: 4 }}>
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
                onClick={handleReset}
                startIcon={<RefreshCw size={14} />}
                sx={{
                  borderColor: 'rgba(255,255,255,0.08)',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.light'
                  }
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
                    '& .MuiAlert-message': { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 0 }
                  }}
                >
                  <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'Prompt', color: 'secondary.light' }}>
                    📝 กำลังแก้ไขแผน {stockSymbol}
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    color="secondary"
                    onClick={() => dispatch(setActivePlanId(null))}
                    sx={{ fontFamily: 'Prompt', fontWeight: 'bold', py: 0.2, px: 1, minWidth: 0, textTransform: 'none' }}
                  >
                    สร้างใหม่แทน
                  </Button>
                </Alert>
              )}

              {/* Portfolio Selection */}
              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1, fontSize: '0.85rem', color: 'text.secondary', fontFamily: 'Prompt', fontWeight: '500' }}>
                  พอร์ตการลงทุน
                </FormLabel>
                <Autocomplete
                  freeSolo
                  options={portfolios}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                  value={portfolios.find(p => p.id === portfolioId) || null}
                  inputValue={portfolioInputValue}
                  onInputChange={(_, newInputValue) => {
                    setPortfolioInputValue(newInputValue);
                  }}
                  onChange={(_, newValue) => {
                    if (typeof newValue === 'string') {
                      setPortfolioInputValue(newValue);
                    } else if (newValue && typeof newValue === 'object') {
                      handleChange('portfolioId', newValue.id);
                      setPortfolioInputValue(newValue.name);
                      
                      // Pull available cash as new total budget
                      if (newValue.id !== 'unassigned') {
                        const summary = calculatePortfolioSummary(newValue, savedPlans, parseFloat(currentParams.exchangeRate) || 36.5);
                        if (summary.availableCash > 0) {
                          handleChange('totalBudget', summary.availableCash.toString());
                        }
                      }
                    } else {
                      handleChange('portfolioId', 'unassigned');
                      setPortfolioInputValue('');
                    }
                  }}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      placeholder="เลือกพอร์ต หรือ พิมพ์เพื่อสร้างใหม่" 
                      size="small" 
                      InputProps={{
                        ...params.InputProps,
                        style: { fontFamily: 'Prompt' }
                      }}
                    />
                  )}
                  sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                />
              </FormControl>

              {/* Currency Selection */}
              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1, fontSize: '0.85rem', color: 'text.secondary', fontFamily: 'Prompt', fontWeight: '500' }}>
                  สกุลเงินที่ใช้งาน (Currency)
                </FormLabel>
                <ToggleButtonGroup
                  value={currentParams.currency}
                  exclusive
                  onChange={(_, val) => val && handleChange('currency', val)}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      py: 0.75,
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'text.secondary',
                      fontFamily: 'Prompt',
                      fontSize: '0.825rem',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        borderColor: '#10b981',
                        color: '#10b981',
                        '&:hover': {
                          backgroundColor: 'rgba(16, 185, 129, 0.25)',
                        }
                      }
                    }
                  }}
                >
                  <ToggleButton value="THB">
                    🇹🇭 THB (บาท)
                  </ToggleButton>
                  <ToggleButton value="USD">
                    🇺🇸 USD (ดอลลาร์)
                  </ToggleButton>
                </ToggleButtonGroup>
              </FormControl>

              {/* Exchange Rate (Visible only when currency is USD) */}
              {currentParams.currency === 'USD' && (
                <TextField
                  label="อัตราแลกเปลี่ยน (บาทต่อ 1 USD)"
                  type="number"
                  placeholder="36.50"
                  value={currentParams.exchangeRate}
                  onChange={(e) => handleChange('exchangeRate', e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Coins size={18} color="#10b981" />
                      </InputAdornment>
                    ),
                  }}
                  helperText={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'pulse 1.5s infinite ease-in-out'
                      }} />
                      <span>เรตจริงเรียลไทม์ (อัปเดตอัตโนมัติทุก 5 วินาที)</span>
                    </Stack>
                  }
                  sx={{
                    '& .MuiFormHelperText-root': { fontFamily: 'Prompt', color: '#10b981', fontWeight: 'bold' }
                  }}
                />
              )}

              {/* Stock Name (Autocomplete Search) */}
              <Autocomplete
                freeSolo
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                inputValue={inputValue}
                onInputChange={(_, newInputValue) => {
                  setInputValue(newInputValue);
                  handleChange('stockSymbol', newInputValue.toUpperCase());
                }}
                onChange={(_, newValue) => {
                  if (typeof newValue === 'string') {
                    handleChange('stockSymbol', newValue.toUpperCase());
                  } else if (newValue && typeof newValue === 'object') {
                    handleChange('stockSymbol', newValue.symbol);
                  }
                }}
                options={options}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return option.symbol;
                }}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props as any;
                  return (
                    <Box 
                      component="li" 
                      key={key || option.symbol} 
                      {...otherProps}
                      sx={{
                        p: '8px 16px !important',
                        borderBottom: theme.palette.mode === 'light' ? '1px solid rgba(0,0,0,0.04)' : '1px solid rgba(255,255,255,0.04)',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'light' ? 'rgba(16, 185, 129, 0.08) !important' : 'rgba(16, 185, 129, 0.15) !important'
                        }
                      }}
                    >
                      <Grid container alignItems="center" spacing={1}>
                        <Grid size={{ xs: 3 }}>
                          <Typography 
                            variant="body2" 
                            fontWeight="bold" 
                            color="#10b981"
                          >
                            {option.symbol}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 9 }}>
                          <Typography variant="body2" color="text.primary" fontWeight="500" noWrap>
                            {option.name}
                          </Typography>
                          <Stack direction="row" spacing={1} mt={0.5}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              🏢 {option.exchange}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              🏷️ {option.type}
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="ชื่อหุ้น / สินทรัพย์"
                    placeholder="ระบุสัญลักษณ์หุ้น เช่น AAPL, NVDA, TSLA"
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <TrendingDown size={18} color="#9ca3af" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <React.Fragment>
                          {loading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </React.Fragment>
                      ),
                    }}
                  />
                )}
              />

              {/* Sleek dynamic company details badge */}
              {loadingDetail && (
                <Box display="flex" alignItems="center" gap={1} mt={1} pl={1}>
                  <CircularProgress size={16} sx={{ color: '#10b981' }} />
                  <Typography variant="caption" sx={{ fontFamily: 'Prompt', color: 'text.secondary' }}>
                    กำลังดึงข้อมูลบริษัทและมูลค่าตลาดล่าสุด...
                  </Typography>
                </Box>
              )}

              {/* Company Info Badge */}
              {!loadingDetail && stockDetail && (
                <Box 
                  mt={1.5} 
                  p={1.5} 
                  sx={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Typography 
                    variant="body2" 
                    fontWeight="bold" 
                    color="#10b981"
                    sx={{ fontFamily: 'Prompt', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    🏢 {stockDetail.name}
                  </Typography>
                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                        มูลค่าตลาด (Market Cap)
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
                        {stockDetail.marketCap}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                        ปันผล / อัตราค่าดำเนินการ
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
                        {stockDetail.yield}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                        ราคาปิดวันก่อนหน้า
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold" 
                        sx={{ 
                          color: '#10b981', 
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          '&:hover': { textDecoration: 'underline', color: '#34d399' }
                        }}
                        onClick={() => {
                          const cleanPrice = stockDetail.previousClose.replace(/[^0-9.]/g, '');
                          if (cleanPrice) {
                            handleChange('currentPrice', cleanPrice);
                            enqueueSnackbar(`ดึงราคาล่าสุด ${stockDetail.previousClose} เรียบร้อย!`, { variant: 'success' });
                          }
                        }}
                      >
                        {stockDetail.previousClose} <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>(คลิกเพื่อกรอก)</Typography>
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                        ราคารอบ 52 สัปดาห์
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
                        {stockDetail.fiftyTwoWeekRange}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Current Price */}
              <TextField
                label={currentParams.currency === 'USD' ? "ราคาปัจจุบัน (USD)" : "ราคาปัจจุบัน (บาท)"}
                type="number"
                placeholder="0.00"
                value={currentParams.currentPrice}
                onChange={(e) => handleChange('currentPrice', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DollarSign size={18} color="#9ca3af" />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={currentParams.currentPriceIsFirstTranche !== false}
                    onChange={(e) => handleChange('currentPriceIsFirstTranche', e.target.checked)}
                    sx={{
                      color: 'rgba(16, 185, 129, 0.5)',
                      '&.Mui-checked': {
                        color: '#10b981',
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontFamily: 'Prompt', color: 'text.secondary', userSelect: 'none' }}>
                    ใช้ราคาปัจจุบันซื้อเป็นไม้แรก (Tranche 1)
                  </Typography>
                }
                sx={{ mt: -0.5, mb: 1, ml: 0 }}
              />

              {/* Investment Budget */}
              <TextField
                label={currentParams.currency === 'USD' ? "งบลงทุนทั้งหมด (USD)" : "งบลงทุนทั้งหมด (บาท)"}
                type="number"
                placeholder="0.00"
                value={currentParams.totalBudget}
                onChange={(e) => {
                  let val = e.target.value;
                  if (maxAvailableBudgetClamped !== null && parseFloat(val) > maxAvailableBudgetClamped) {
                    val = maxAvailableBudgetClamped.toString();
                  }
                  handleChange('totalBudget', val);
                }}
                fullWidth
                error={isAtMaxLimit}
                helperText={
                  isAtMaxLimit
                    ? `ถึงขีดจำกัดแล้ว! พอร์ตนี้ลงทุนได้สูงสุด: ${formatCurrency(maxAvailableBudget || 0, currency, false, exchangeRate)}`
                    : maxAvailableBudget !== null
                      ? `พอร์ตนี้จำกัดงบลงทุนได้สูงสุด: ${formatCurrency(maxAvailableBudget, currency, false, exchangeRate)}`
                      : undefined
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Coins size={18} color="#9ca3af" />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Drop percentage */}
              <TextField
                label="ราคาที่จะถัวเฉลี่ยลดลงต่อไม้ (%)"
                type="number"
                placeholder="เช่น 3 หรือ 5"
                value={currentParams.dropPercentage}
                onChange={(e) => handleChange('dropPercentage', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Percent size={18} color="#9ca3af" />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Tranches count */}
              <TextField
                label="จำนวนไม้ที่ต้องการแบ่งซื้อ"
                type="number"
                placeholder="เช่น 3 หรือ 4 ไม้"
                value={currentParams.tranchesCount}
                onChange={(e) => {
                  let val = parseInt(e.target.value);
                  if (!isNaN(val) && (roundingMode === 'integer' || roundingMode === 'boardlot')) {
                    if (val > maxPossibleTranches) val = maxPossibleTranches;
                  }
                  handleChange('tranchesCount', isNaN(val) ? e.target.value : val.toString());
                }}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Layers size={18} color="#9ca3af" />
                    </InputAdornment>
                  ),
                }}
                helperText={(roundingMode === 'integer' || roundingMode === 'boardlot') ? `สามารถแบ่งได้สูงสุด ${maxPossibleTranches} ไม้ (เพื่อให้ซื้อได้อย่างน้อยไม้ละ ${roundingMode === 'boardlot' ? '100' : '1'} หุ้น)` : undefined}
                sx={{
                  '& .MuiFormHelperText-root': { fontFamily: 'Prompt', color: 'info.main' }
                }}
              />

              {/* Drop Calculation Mode */}
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem', color: 'text.secondary', fontFamily: 'Prompt' }}>
                  วิธีการคำนวณราคาหักลด
                </FormLabel>
                <RadioGroup
                  row
                  value={dropMode}
                  onChange={(e) => handleChange('dropMode', e.target.value)}
                >
                  <FormControlLabel
                    value="progressive"
                    control={<Radio size="small" />}
                    label={
                      <Tooltip title="คำนวณหัก % จากราคาของไม้ก่อนหน้าลดหลั่นลงไป">
                        <Typography variant="body2" sx={{ fontFamily: 'Prompt' }}>ถัวสะสม (-% จากไม้ก่อนหน้า)</Typography>
                      </Tooltip>
                    }
                  />
                  <FormControlLabel
                    value="fixed"
                    control={<Radio size="small" />}
                    label={
                      <Tooltip title="คำนวณหัก % จากราคาเริ่มต้นของไม้แรกคงที่">
                        <Typography variant="body2" sx={{ fontFamily: 'Prompt' }}>ถัวคงที่ (-% จากไม้แรก)</Typography>
                      </Tooltip>
                    }
                  />
                </RadioGroup>
              </FormControl>

              {/* Rounding Mode Option */}
              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1, fontSize: '0.875rem', color: 'text.secondary', fontFamily: 'Prompt' }}>
                  รูปแบบการปัดเศษหุ้น
                </FormLabel>
                <Select
                  value={roundingMode}
                  onChange={(e) => handleChange('roundingMode', e.target.value as string)}
                  sx={{ borderRadius: 3 }}
                >
                  <MenuItem value="integer" style={{ fontFamily: 'Prompt' }}>
                    เต็มหน่วย 1 หุ้น (ตลาดหุ้นทั่วไป)
                  </MenuItem>
                  <MenuItem value="boardlot" style={{ fontFamily: 'Prompt' }}>
                    บอร์ดล็อต 100 หุ้น (สำหรับกระดานหลักไทย / SET)
                  </MenuItem>
                  <MenuItem value="fractional" style={{ fontFamily: 'Prompt' }}>
                    ทศนิยม 4 ตำแหน่ง (สำหรับคริปโต / หุ้นสหรัฐฯ)
                  </MenuItem>
                </Select>
              </FormControl>

              <Divider sx={{ my: 1.5, opacity: 0.1 }} />

              <Typography variant="subtitle2" color="primary.light" fontWeight="bold" sx={{ fontFamily: 'Prompt', display: 'flex', alignItems: 'center', gap: 1 }}>
                🎯 กลยุทธ์ทางออก & ค่าดำเนินการ (Exit Strategy)
              </Typography>

              {/* Target Profit % */}
              <TextField
                label="เปอร์เซ็นต์กำไรที่ต้องการ (%)"
                type="number"
                placeholder="เช่น 10"
                value={currentParams.targetProfitPercent}
                onChange={(e) => handleChange('targetProfitPercent', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Percent size={18} color="#10b981" />
                    </InputAdornment>
                  ),
                }}
                helperText="คำนวณราคาขายเป้าหมายหักค่าดำเนินการแล้ว"
                sx={{
                  '& .MuiFormHelperText-root': { fontFamily: 'Prompt', color: 'text.secondary' }
                }}
              />

              {/* Transaction Fee % */}
              <Autocomplete
                freeSolo
                options={['1.2', '0.15', '0.10', '0']}
                renderOption={(props, option) => {
                  let label = option;
                  if (option === '1.2') label = 'Dime (เฉลี่ย ~1.2%)';
                  if (option === '0.15') label = 'InnovestX / อื่นๆ (0.15%)';
                  if (option === '0.10') label = 'Webull (0.10%)';
                  if (option === '0') label = 'ฟรีค่าดำเนินการ (0%)';
                  return (
                    <li {...props}>
                      <Typography variant="body2" sx={{ fontFamily: 'Prompt' }}>
                        {label}
                      </Typography>
                    </li>
                  );
                }}
                value={currentParams.feePercent}
                onChange={(_, newValue) => handleChange('feePercent', newValue || '')}
                onInputChange={(_, newInputValue) => {
                  handleChange('feePercent', newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="ค่าดำเนินการซื้อขาย (%)"
                    placeholder="เช่น 1.2 หรือ 0.15"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start" sx={{ pl: 1 }}>
                            <Percent size={18} color="#f59e0b" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                    helperText="เลือกจากรายการ หรือพิมพ์กรอก % ค่าดำเนินการได้เอง"
                    sx={{
                      '& .MuiFormHelperText-root': { fontFamily: 'Prompt', color: 'text.secondary' }
                    }}
                  />
                )}
              />

              {/* Actual Selling Price */}
              <TextField
                label={currentParams.currency === 'USD' ? "ราคาที่ขายจริง (USD)" : "ราคาที่ขายจริง (บาท)"}
                type="number"
                placeholder="0.00"
                value={currentParams.actualSellPrice}
                onChange={(e) => handleChange('actualSellPrice', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DollarSign size={18} color="#3b82f6" />
                    </InputAdornment>
                  ),
                }}
                helperText="ระบุเพื่อคำนวณผลกำไร/ขาดทุนสุทธิหลังขายจริง"
                sx={{
                  '& .MuiFormHelperText-root': { fontFamily: 'Prompt', color: 'text.secondary' }
                }}
              />

              {/* Actual Tranches Count */}
              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1, fontSize: '0.875rem', color: 'text.secondary', fontFamily: 'Prompt' }}>
                  จำนวนไม้ที่ได้ซื้อจริง (Actual Tranches Bought)
                </FormLabel>
                <Select
                  value={(parseInt(currentParams.actualTranchesCount) <= tranchesCount ? currentParams.actualTranchesCount : '') || currentParams.tranchesCount}
                  onChange={(e) => handleChange('actualTranchesCount', e.target.value as string)}
                  sx={{ borderRadius: 3 }}
                >
                  {Array.from({ length: tranchesCount }, (_, i) => i + 1).map((val) => (
                    <MenuItem key={val} value={val.toString()} style={{ fontFamily: 'Prompt' }}>
                      {val} ไม้ (จากทั้งหมด {tranchesCount} ไม้)
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText sx={{ fontFamily: 'Prompt', mt: 0.5, color: 'text.secondary' }}>
                  เลือกจำนวนไม้ที่ร่วงลงมาและซื้อได้จริง เพื่อวิเคราะห์ผลการลงทุนจริงสะสม
                </FormHelperText>
              </FormControl>

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} pt={1}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSave}
                  disabled={!calcResult}
                  startIcon={<Bookmark size={18} />}
                  sx={{
                    py: 1.5,
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)'
                  }}
                >
                  บันทึกแผนการลงทุน
                </Button>
              </Stack>
            </Stack>
          </GlassCard>
        </Grid>

        {/* 2. Visualizations and Tables */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {calcResult ? (
            <Stack spacing={4}>
              {/* Dynamic Interactive Chart & Fund split */}
              <GridVisualizer result={calcResult} />

              {/* Detailed Tranche breakdown Table */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  border: theme.palette.mode === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(17, 25, 40, 0.65)',
                  backdropFilter: 'blur(16px) saturate(180%)',
                  boxShadow: theme.palette.mode === 'light' ? '0 8px 32px 0 rgba(31, 38, 135, 0.05)' : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                  overflow: 'hidden'
                }}
              >
                <Typography variant="h6" fontWeight="bold" mb={2.5} fontFamily="Prompt">
                  ตารางแสดงรายละเอียดรายไม้ (Tranche Details)
                </Typography>

                <TableContainer>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow sx={{ borderBottom: theme.palette.mode === 'light' ? '2px solid rgba(0,0,0,0.08)' : '2px solid rgba(255,255,255,0.1)' }}>
                        <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontFamily: 'Prompt' }}>ไม้ที่</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontFamily: 'Prompt' }} align="right">ราคาซื้อเป้าหมาย</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontFamily: 'Prompt' }} align="right">งบประมาณรายไม้</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontFamily: 'Prompt' }} align="right">จำนวนหุ้นที่ได้</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontFamily: 'Prompt' }} align="right">เงินใช้จริงรายไม้</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'primary.light', fontFamily: 'Prompt' }} align="right">ต้นทุนเฉลี่ยของพอร์ต</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'primary.light', fontFamily: 'Prompt' }} align="right">ลดต้นทุนได้ (%)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {calcResult.tranches.map((t) => {
                        const isLast = t.trancheNumber === calcResult.tranchesCount;
                        return (
                          <TableRow
                            key={t.trancheNumber}
                            sx={{
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                              transition: 'background-color 0.2s',
                              '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.02)'
                              },
                              ...(isLast && {
                                backgroundColor: 'rgba(6, 182, 212, 0.02)',
                              })
                            }}
                          >
                            <TableCell component="th" scope="row">
                              <Typography variant="body2" fontWeight="bold">
                                ไม้ {t.trancheNumber} {isLast && '(ไม้สุดท้าย)'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(t.price, currency, false, exchangeRate)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(t.budgetAllocated, currency, false, exchangeRate)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {formatNumber(t.sharesBought, roundingMode === 'fractional' ? 4 : 0)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(t.actualSpent, currency, false, exchangeRate)}
                            </TableCell>

                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.light' }}>
                              {formatCurrency(t.cumulativeAverageCost, currency, false, exchangeRate)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.light' }}>
                              {t.averageCostDiscountPercent > 0 ? `${t.averageCostDiscountPercent}%` : '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Stack>
          ) : (
            <Box
              sx={{
                height: '100%',
                minHeight: 400,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4
              }}
            >
              <Alert
                severity="info"
                sx={{
                  borderRadius: 4,
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.1)',
                  maxWidth: 500,
                  p: 3,
                  '& .MuiAlert-icon': {
                    alignItems: 'center',
                    fontSize: '2rem'
                  }
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold" mb={1} fontFamily="Prompt">
                  ยินดีต้อนรับสู่ WealthFlow Stock Grid Planner
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Prompt' }}>
                  กรุณากรอก **ราคาปัจจุบัน**, **งบลงทุนทั้งหมด**, และ **จำนวนไม้ที่ต้องการแบ่งซื้อ** ทางแถบด้านซ้ายมือ เพื่อเปิดระบบคำนวณและแสดงแผนผังการถัวเฉลี่ยหุ้นแบบเรียลไทม์ทันทีครับ!
                </Typography>
              </Alert>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default StockPlanner;
