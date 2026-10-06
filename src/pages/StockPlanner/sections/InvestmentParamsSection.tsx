/**
 * Route: /
 * Section: InvestmentParamsSection (ส่วนระบุพารามิเตอร์การลงทุน งบประมาณ จำนวนไม้ และการกระจายราคา)
 */

import React from 'react';
import {
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  InputAdornment,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Tooltip,
  Box,
  Stack,
  Button,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { DollarSign, Coins, Percent, Layers, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../../utils/stockMath';
import CurrencyTextField from '../../../components/CurrencyTextField';

interface InvestmentParamsSectionProps {
  currency: 'THB' | 'USD';
  exchangeRate: number;
  stockSymbol?: string;
  currentPrice: string;
  currentPriceIsFirstTranche: boolean;
  totalBudget: string;
  maxAvailableBudgetClamped: number | null;
  maxAvailableBudget: number | null;
  isAtMaxLimit: boolean;
  onePercentMarketCap?: number | null;
  stockMarketCapUSD?: number | null;
  budgetLimitReason?: 'market_cap' | 'portfolio' | null;
  portfolioCashLimit?: number | null;
  limitBudgetToOnePercentMarketCap?: boolean;
  dropPercentage: string;
  tranchesCount: string;
  maxPossibleTranches: number;
  dropMode: 'progressive' | 'fixed';
  roundingMode: 'fractional' | 'integer' | 'boardlot';
  feePercent?: string;
  feeMode?: 'percent' | 'per_share';
  feePerShare?: string;
  minFeePerTranche?: string;
  onChange: (field: string, value: any) => void;
}

export const InvestmentParamsSection: React.FC<InvestmentParamsSectionProps> = ({
  currency,
  exchangeRate,
  stockSymbol,
  currentPrice,
  currentPriceIsFirstTranche,
  totalBudget,
  maxAvailableBudgetClamped,
  isAtMaxLimit,
  onePercentMarketCap,
  stockMarketCapUSD,
  budgetLimitReason,
  portfolioCashLimit,
  limitBudgetToOnePercentMarketCap,
  dropPercentage,
  tranchesCount,
  maxPossibleTranches,
  dropMode,
  roundingMode,
  feePercent,
  feeMode = 'percent',
  feePerShare,
  minFeePerTranche,
  onChange,
}) => {
  const priceNum = parseFloat(currentPrice) || 0;
  const budgetNum = parseFloat(totalBudget) || 0;
  const feePercentNum = parseFloat(feePercent || '0') || 0;
  const feePerShareNum = parseFloat(feePerShare || '0.005') || 0.005;
  const minFeeNum = parseFloat(minFeePerTranche || '0') || 0;

  // คำนวณต้นทุนขั้นต่ำในการซื้อ 1 หุ้นเต็ม (ราคาหุ้น + ค่าธรรมเนียม)
  let feeForOneShare = 0;
  if (feeMode === 'per_share') {
    feeForOneShare = Math.max(minFeeNum, 1 * feePerShareNum);
  } else {
    feeForOneShare = Math.max(minFeeNum, priceNum * (feePercentNum / 100));
  }
  const minCostForOneShare = priceNum > 0 ? priceNum + feeForOneShare : 0;
  const shortfallForOneShare = Math.max(0, minCostForOneShare - budgetNum);
  const isBudgetShortForOneShare =
    roundingMode === 'integer' && priceNum > 0 && budgetNum > 0 && budgetNum < minCostForOneShare;

  return (
    <>
      {/* Current Price & First Tranche Checkbox Grouped together */}
      <Box>
        <CurrencyTextField
          label={currency === 'USD' ? 'ราคาปัจจุบัน (USD)' : 'ราคาปัจจุบัน (บาท)'}
          placeholder="0.00"
          value={currentPrice}
          onChange={(val) => onChange('currentPrice', val)}
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
              checked={currentPriceIsFirstTranche}
              onChange={(e) => onChange('currentPriceIsFirstTranche', e.target.checked)}
              size="small"
              sx={{
                color: 'rgba(16, 185, 129, 0.5)',
                '&.Mui-checked': {
                  color: '#10b981',
                },
              }}
            />
          }
          label={
            <Typography
              variant="body2"
              sx={{ fontFamily: 'Prompt', color: 'text.secondary', userSelect: 'none', fontSize: '0.85rem' }}
            >
              ใช้ราคาปัจจุบันซื้อเป็นไม้แรก (Tranche 1)
            </Typography>
          }
          sx={{ mt: 0.3, ml: 0 }}
        />
      </Box>

      {/* Investment Budget */}
      <Box>
        <CurrencyTextField
          label={currency === 'USD' ? 'งบลงทุนทั้งหมด (USD)' : 'งบลงทุนทั้งหมด (บาท)'}
          placeholder="0.00"
          value={totalBudget}
          onChange={(val) => {
            let clampedVal = val;
            if (maxAvailableBudgetClamped !== null && parseFloat(val) > maxAvailableBudgetClamped) {
              clampedVal = maxAvailableBudgetClamped.toString();
            }
            onChange('totalBudget', clampedVal);
          }}
          fullWidth
          error={isAtMaxLimit}
          helperText={
            budgetLimitReason === 'market_cap' && maxAvailableBudgetClamped !== null
              ? isAtMaxLimit
                ? `ถึงขีดจำกัด 1% Market Cap แล้ว! (สูงสุด ${formatCurrency(maxAvailableBudgetClamped, currency, false, exchangeRate)})`
                : `จำกัดงบสูงสุดไม่เกิน 1% ของ Market Cap: ${formatCurrency(maxAvailableBudgetClamped, currency, false, exchangeRate)}`
              : budgetLimitReason === 'portfolio' && maxAvailableBudgetClamped !== null
                ? isAtMaxLimit
                  ? `ถึงขีดจำกัดเงินสดในพอร์ตแล้ว! (สูงสุด ${formatCurrency(maxAvailableBudgetClamped, currency, false, exchangeRate)})`
                  : `พอร์ตนี้จำกัดงบลงทุนได้สูงสุด: ${formatCurrency(maxAvailableBudgetClamped, currency, false, exchangeRate)}`
                : maxAvailableBudgetClamped !== null
                  ? isAtMaxLimit
                    ? `ถึงขีดจำกัดแล้ว! ลงทุนได้สูงสุด: ${formatCurrency(maxAvailableBudgetClamped, currency, false, exchangeRate)}`
                    : `จำกัดงบลงทุนได้สูงสุด: ${formatCurrency(maxAvailableBudgetClamped, currency, false, exchangeRate)}`
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

        {/* 1% Market Cap Liquidity Guard Banner (Ultra Minimal & Compact) */}
        {stockMarketCapUSD && stockMarketCapUSD > 0 ? (
          <Box
            sx={{
              mt: 0.8,
              mb: 2,
              py: 0.5,
              px: 1,
              borderRadius: 1.5,
              backgroundColor: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.4,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} flexWrap="wrap">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={limitBudgetToOnePercentMarketCap !== false}
                    onChange={(e) => onChange('limitBudgetToOnePercentMarketCap', e.target.checked)}
                    size="small"
                    sx={{
                      p: 0.4,
                      color: 'rgba(59, 130, 246, 0.5)',
                      '&.Mui-checked': { color: '#60a5fa' },
                    }}
                  />
                }
                label={
                  <Stack direction="row" spacing={0.6} alignItems="center">
                    <ShieldCheck size={14} color="#60a5fa" />
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'Prompt',
                        fontWeight: 600,
                        color: '#93c5fd',
                        fontSize: '0.76rem',
                        userSelect: 'none',
                      }}
                    >
                      จำกัดงบสูงสุด 1% Cap{stockSymbol ? ` (${stockSymbol})` : ''}
                    </Typography>
                  </Stack>
                }
                sx={{ m: 0 }}
              />

              {onePercentMarketCap !== null && limitBudgetToOnePercentMarketCap !== false && (
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', fontFamily: 'Prompt' }}>
                    1% Cap: <Box component="span" sx={{ color: '#60a5fa', fontWeight: 600 }}>{formatCurrency(onePercentMarketCap || 0, currency, false, exchangeRate)}</Box>
                  </Typography>
                  {maxAvailableBudgetClamped !== null && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => onChange('totalBudget', maxAvailableBudgetClamped.toString())}
                      sx={{
                        fontSize: '0.68rem',
                        fontFamily: 'Prompt',
                        textTransform: 'none',
                        py: 0.1,
                        px: 0.8,
                        minHeight: 0,
                        lineHeight: 1.2,
                        borderRadius: 1,
                        backgroundColor: 'rgba(56, 189, 248, 0.08)',
                        color: '#38bdf8',
                        '&:hover': { backgroundColor: 'rgba(56, 189, 248, 0.18)' },
                      }}
                    >
                      ⚡ ใช้ Cap เต็ม
                    </Button>
                  )}
                </Stack>
              )}
            </Stack>

            {limitBudgetToOnePercentMarketCap !== false && budgetLimitReason === 'market_cap' && portfolioCashLimit !== null && (
              <Typography
                variant="caption"
                display="block"
                sx={{ color: '#fbbf24', fontSize: '0.68rem', fontFamily: 'Prompt', lineHeight: 1.2, pl: 0.5 }}
              >
                ⚠️ เงินสดพอร์ตมี {formatCurrency(portfolioCashLimit || 0, currency, false, exchangeRate)} แต่จำกัดที่ 1% Cap เพื่อความปลอดภัยสภาพคล่อง
              </Typography>
            )}
          </Box>
        ) : null}

        {/* Smart Live Cost Helper under budget */}
        {isBudgetShortForOneShare ? (
          <Box
            sx={{
              mt: 1,
              p: 1.5,
              borderRadius: 2,
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" fontWeight="bold" color="warning.main" display="block">
                  งบไม่พอซื้อ 1 หุ้นเต็ม
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{ fontSize: '0.75rem', lineHeight: 1.3 }}
                >
                  ซื้อ 1 หุ้นเต็มต้องใช้ {formatCurrency(minCostForOneShare, currency, false, exchangeRate)} (ราคาหุ้น {formatCurrency(priceNum, currency, false, exchangeRate)} + ค่าธรรมเนียม {formatCurrency(feeForOneShare, currency, false, exchangeRate)}) ขาดอีก{' '}
                  <Box component="span" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                    {formatCurrency(shortfallForOneShare, currency, false, exchangeRate)}
                  </Box>
                </Typography>
                <Stack direction="row" spacing={1} mt={0.8} flexWrap="wrap">
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    onClick={() => onChange('roundingMode', 'fractional')}
                    sx={{
                      fontSize: '0.72rem',
                      fontFamily: 'Prompt',
                      textTransform: 'none',
                      py: 0.2,
                      px: 1,
                      borderRadius: 1.5,
                    }}
                  >
                    ⚡ สลับเป็นโหมดเศษหุ้น (ซื้อตามงบที่มี)
                  </Button>
                  {maxAvailableBudgetClamped !== null && maxAvailableBudgetClamped >= minCostForOneShare && (
                    <Button
                      size="small"
                      variant="text"
                      color="primary"
                      onClick={() =>
                        onChange('totalBudget', (Math.ceil(minCostForOneShare * 100) / 100).toString())
                      }
                      sx={{
                        fontSize: '0.72rem',
                        fontFamily: 'Prompt',
                        textTransform: 'none',
                        py: 0.2,
                        px: 1,
                      }}
                    >
                      ปรับงบเป็นพอดี 1 หุ้น
                    </Button>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Box>
        ) : (
          priceNum > 0 && (
            <Box sx={{ mt: 2.5, pt: 1, pb: 0.5 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', fontSize: '0.73rem', ml: 0.5 }}
              >
                💡 ซื้อ 1 หุ้นเต็มขั้นต่ำ: {formatCurrency(minCostForOneShare, currency, false, exchangeRate)} (ราคาหุ้น {formatCurrency(priceNum, currency, false, exchangeRate)} + ค่าธรรมเนียม ~{formatCurrency(feeForOneShare, currency, false, exchangeRate)})
              </Typography>
            </Box>
          )
        )}
      </Box>

      {/* Drop percentage */}
      <TextField
        label="ราคาที่จะถัวเฉลี่ยลดลงต่อไม้ (%)"
        type="number"
        placeholder="เช่น 3 หรือ 5"
        value={dropPercentage}
        onChange={(e) => onChange('dropPercentage', e.target.value)}
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
        value={tranchesCount}
        onChange={(e) => {
          let val = parseInt(e.target.value);
          if (!isNaN(val) && (roundingMode === 'integer' || roundingMode === 'boardlot')) {
            if (val > maxPossibleTranches) val = maxPossibleTranches;
          }
          onChange('tranchesCount', isNaN(val) ? e.target.value : val.toString());
        }}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Layers size={18} color="#9ca3af" />
            </InputAdornment>
          ),
        }}
        helperText={
          roundingMode === 'integer' || roundingMode === 'boardlot'
            ? `สามารถแบ่งได้สูงสุด ${maxPossibleTranches} ไม้ (เพื่อให้ซื้อได้อย่างน้อยไม้ละ ${roundingMode === 'boardlot' ? '100' : '1'} หุ้น)`
            : undefined
        }
        sx={{
          '& .MuiFormHelperText-root': { fontFamily: 'Prompt', color: 'info.main' },
        }}
      />

      {/* Drop Calculation Mode */}
      <FormControl component="fieldset">
        <FormLabel
          component="legend"
          sx={{ mb: 1, fontSize: '0.875rem', color: 'text.secondary', fontFamily: 'Prompt' }}
        >
          วิธีการคำนวณราคาหักลด
        </FormLabel>
        <RadioGroup
          row
          value={dropMode}
          onChange={(e) => onChange('dropMode', e.target.value)}
        >
          <FormControlLabel
            value="progressive"
            control={<Radio size="small" />}
            label={
              <Tooltip title="คำนวณหัก % จากราคาของไม้ก่อนหน้าลดหลั่นลงไป">
                <Typography variant="body2" sx={{ fontFamily: 'Prompt' }}>
                  ถัวสะสม (-% จากไม้ก่อนหน้า)
                </Typography>
              </Tooltip>
            }
          />
          <FormControlLabel
            value="fixed"
            control={<Radio size="small" />}
            label={
              <Tooltip title="คำนวณหัก % จากราคาเริ่มต้นของไม้แรกคงที่">
                <Typography variant="body2" sx={{ fontFamily: 'Prompt' }}>
                  ถัวคงที่ (-% จากไม้แรก)
                </Typography>
              </Tooltip>
            }
          />
        </RadioGroup>
      </FormControl>

      {/* Rounding Mode Option - Modern ToggleButtonGroup */}
      <FormControl fullWidth>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <FormLabel sx={{ fontSize: '0.875rem', color: 'text.secondary', fontFamily: 'Prompt' }}>
            รูปแบบการปัดเศษหุ้น
          </FormLabel>
          {currency === 'USD' && (
            <Chip
              size="small"
              label="Webull / US รองรับเศษหุ้น"
              color="success"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          )}
        </Stack>
        <ToggleButtonGroup
          value={roundingMode}
          exclusive
          onChange={(_, val) => {
            if (val) onChange('roundingMode', val);
          }}
          fullWidth
          size="small"
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: { xs: 0.75, sm: 1 },
            '& .MuiToggleButtonGroup-grouped': {
              border: '1px solid rgba(255, 255, 255, 0.12) !important',
              borderRadius: '8px !important',
              mx: 0,
            },
            '& .MuiToggleButton-root': {
              fontFamily: 'Prompt',
              fontSize: { xs: '0.7rem', sm: '0.78rem' },
              py: { xs: 0.6, sm: 1 },
              px: { xs: 0.5, sm: 1 },
              lineHeight: 1.2,
              textTransform: 'none',
              '&.Mui-selected': {
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: 'success.main',
                borderColor: 'success.main !important',
                fontWeight: 'bold',
              },
            },
          }}
        >
          <ToggleButton value="integer">
            เต็มหน่วย 1 หุ้น
          </ToggleButton>
          <ToggleButton value="fractional">
            ⚡ เศษหุ้น (US)
          </ToggleButton>
          <ToggleButton value="boardlot">
            บอร์ดล็อต (SET)
          </ToggleButton>
        </ToggleButtonGroup>
      </FormControl>
    </>
  );
};

export default InvestmentParamsSection;
