/**
 * Route: /
 * Component: FundSplitDiagram (แผนภาพและแถบสไลเดอร์แสดงการแบ่งสัดส่วนงบประมาณรายไม้)
 */

import React from 'react';
import {
  Stack,
  Typography,
  Box,
  Chip,
  Divider,
  Button,
  useTheme,
} from '@mui/material';
import GlassCard from '../GlassCard';
import { PieChart, AlertTriangle, Zap } from 'lucide-react';
import { CalculationResult, formatNumber, formatCurrency } from '../../utils/stockMath';
import { useAppDispatch } from '../../store';
import { updateCurrentParams } from '../../store/stockPlannerSlice';

interface FundSplitDiagramProps {
  /** ข้อมูลผลการคำนวณการแบ่งไม้ */
  result: CalculationResult;
}

/**
 * คอมโพเนนต์แสดงแผนภาพการกระจายสัดส่วนเงินลงทุนในแต่ละไม้ พร้อมทบเศษไปไม้สุดท้าย
 * 
 * @param props - คุณสมบัติของคอมโพเนนต์ ประกอบด้วยผลลัพธ์การคำนวณ result
 * @returns JSX Element แสดงการ์ดสัดส่วนเงินทุน
 */
export const FundSplitDiagram: React.FC<FundSplitDiagramProps> = ({ result }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const {
    tranches,
    roundingMode,
    currency = 'THB',
    exchangeRate = 36.5,
    feePercent = 0,
    feeMode = 'percent',
    feePerShare = 0.005,
    minFeePerTranche = 0,
  } = result;

  // คำนวณงบประมาณฐานเพื่อใช้เปรียบเทียบเศษที่ถูกทบ
  const baseBudget = Math.floor(result.totalBudget / result.tranchesCount);

  return (
    <GlassCard sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
        <PieChart size={20} color={theme.palette.primary.main} />
        <Typography variant="h6" fontWeight="bold">
          การแบ่งสัดส่วนเงินลงทุน ({tranches.length} ไม้)
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" mb={2}>
        เงินทุนจะถูกหารเท่า ๆ กัน และเศษที่เหลือจากการหารทั้งหมดจะถูกทบไปลงที่
        <Box component="span" sx={{ color: 'secondary.main', fontWeight: 'bold', mx: 0.5 }}>
          ไม้สุดท้าย (ไม้ที่ {tranches.length})
        </Box>
        โดยอัตโนมัติ เพื่อไม่ให้เงินลงทุนขาดตกบกพร่อง
      </Typography>

      {/* Visual Bar Split - Horizontal Scroll Slider */}
      <Stack
        direction="row"
        spacing={2}
        sx={{
          width: '100%',
          overflowX: 'auto',
          pb: 2,
          pt: 1,
          '&::-webkit-scrollbar': {
            height: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(16, 185, 129, 0.3)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '4px',
          },
        }}
      >
        {tranches.map((t, index) => {
          const isLast = index === tranches.length - 1;
          const percent = (t.budgetAllocated / result.totalBudget) * 100;
          const isZeroShares = t.sharesBought === 0;

          // คำนวณต้นทุนขั้นต่ำที่ต้องใช้เพื่อซื้อหุ้นขั้นต่ำ (1 หุ้น หรือ 100 หุ้น) รวมค่าธรรมเนียม
          const minShares = roundingMode === 'boardlot' ? 100 : 1;
          let minFee = 0;
          let minCostNeeded = 0;
          let rawShares = 0;

          if (feeMode === 'per_share') {
            minFee = Math.max(minFeePerTranche, minShares * feePerShare);
            minCostNeeded = minShares * t.price + minFee;
            const avail = Math.max(0, t.budgetAllocated - minFeePerTranche);
            rawShares = avail / (t.price + feePerShare);
          } else {
            const feeRate = feePercent / 100;
            const gross = minShares * t.price;
            minFee = Math.max(minFeePerTranche, gross * feeRate);
            minCostNeeded = gross + minFee;
            rawShares = t.budgetAllocated / (t.price * (1 + feeRate));
          }

          const shortfall = Math.max(0, minCostNeeded - t.budgetAllocated);

          return (
            <Box
              key={index}
              sx={{
                minWidth: { xs: 260, sm: 280, md: 300 },
                flexShrink: 0,
                position: 'relative',
                p: 2.5,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: isZeroShares
                  ? 'rgba(245, 158, 11, 0.6)'
                  : theme.palette.mode === 'light'
                  ? isLast
                    ? 'rgba(6, 182, 212, 0.4)'
                    : 'rgba(0, 0, 0, 0.08)'
                  : isLast
                  ? 'rgba(6, 182, 212, 0.25)'
                  : 'rgba(255, 255, 255, 0.05)',
                background: isZeroShares
                  ? theme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, rgba(254, 243, 199, 0.6) 0%, rgba(255, 255, 255, 0.95) 100%)'
                    : 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)'
                  : theme.palette.mode === 'light'
                  ? isLast
                    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(255, 255, 255, 0.95) 100%)'
                    : 'linear-gradient(135deg, rgba(0, 0, 0, 0.01) 0%, rgba(255, 255, 255, 0.8) 100%)'
                  : isLast
                  ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(10, 20, 40, 0.4) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(10, 15, 25, 0.4) 100%)',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: isZeroShares
                    ? '0 6px 20px rgba(245, 158, 11, 0.2)'
                    : theme.palette.mode === 'light'
                    ? isLast
                      ? '0 6px 20px rgba(6, 182, 212, 0.15)'
                      : '0 6px 15px rgba(31, 38, 135, 0.05)'
                    : isLast
                    ? '0 6px 20px rgba(6, 182, 212, 0.2)'
                    : '0 6px 15px rgba(0, 0, 0, 0.3)',
                  borderColor: isZeroShares
                    ? 'warning.main'
                    : isLast
                    ? 'secondary.main'
                    : 'primary.main',
                },
              }}
            >
              {/* Header: Tranche Number & Percentage */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Chip
                  size="small"
                  label={`ไม้ที่ ${t.trancheNumber}`}
                  color={isZeroShares ? 'warning' : isLast ? 'secondary' : 'primary'}
                  variant={isZeroShares || isLast ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 'bold' }}
                />
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  {percent.toFixed(2)}% ของงบ
                </Typography>
              </Stack>

              {/* Main Metric: Allocated Budget for this tranche */}
              <Box mb={1.5}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  งบจัดสรรในไม้นี้
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight="800"
                  color={isZeroShares ? 'warning.main' : isLast ? 'secondary.light' : 'text.primary'}
                >
                  {formatCurrency(t.budgetAllocated, currency, false, exchangeRate)}
                </Typography>
                {isLast && t.budgetAllocated > baseBudget && (
                  <Typography
                    variant="caption"
                    color="secondary.light"
                    sx={{ display: 'block', mt: 0.2 }}
                  >
                    💡 รวมเศษทศนิยม (+{formatCurrency(t.budgetAllocated - baseBudget, currency, false, exchangeRate)})
                  </Typography>
                )}
              </Box>

              {/* Financial Breakdown or Warning Box */}
              {isZeroShares && (
                <Box
                  sx={{
                    p: 1.5,
                    mb: 1.5,
                    borderRadius: '8px',
                    backgroundColor:
                      theme.palette.mode === 'light'
                        ? 'rgba(254, 243, 199, 0.7)'
                        : 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="flex-start" mb={0.5}>
                    <AlertTriangle
                      size={16}
                      color={theme.palette.warning.main}
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    <Box>
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        color="warning.main"
                        display="block"
                      >
                        งบไม่พอซื้อขั้นต่ำ {minShares} หุ้น
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ fontSize: '0.72rem', lineHeight: 1.3 }}
                      >
                        ต้องการ {formatCurrency(minCostNeeded, currency, false, exchangeRate)} (รวมค่าธรรมเนียม)
                      </Typography>
                      <Typography
                        variant="caption"
                        color="error.main"
                        fontWeight="bold"
                        display="block"
                        sx={{ fontSize: '0.72rem' }}
                      >
                        ขาดอีก {formatCurrency(shortfall, currency, false, exchangeRate)}
                      </Typography>
                    </Box>
                  </Stack>

                  {roundingMode !== 'fractional' && rawShares > 0 && (
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      color="warning"
                      startIcon={<Zap size={13} />}
                      onClick={() => dispatch(updateCurrentParams({ roundingMode: 'fractional' }))}
                      sx={{
                        mt: 1,
                        py: 0.4,
                        fontSize: '0.72rem',
                        fontFamily: 'Prompt',
                        textTransform: 'none',
                        borderRadius: '6px',
                        borderColor: 'rgba(245, 158, 11, 0.5)',
                        '&:hover': {
                          borderColor: 'warning.main',
                          backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        },
                      }}
                    >
                      สลับซื้อเศษหุ้น (ได้ ~{rawShares.toFixed(3)} หุ้น)
                    </Button>
                  )}
                </Box>
              )}

              <Divider sx={{ my: 1.2, opacity: 0.3 }} />

              {/* Purchase Parameters & Details */}
              <Stack spacing={0.7}>
                {!isZeroShares && (
                  <>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        🛒 ใช้ซื้อจริง:
                      </Typography>
                      <Typography variant="caption" fontWeight="bold" color="success.main">
                        {formatCurrency(t.actualSpent, currency, false, exchangeRate)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        💵 เงินสดเหลือ:
                      </Typography>
                      <Typography variant="caption" fontWeight="bold" color="text.secondary">
                        {formatCurrency(t.leftoverCash, currency, false, exchangeRate)}
                      </Typography>
                    </Stack>
                  </>
                )}
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    ราคาซื้อเป้าหมาย:
                  </Typography>
                  <Typography variant="caption" fontWeight="bold" color="primary.main">
                    {formatCurrency(t.price, currency, false, exchangeRate)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    จำนวนหุ้นที่จะได้:
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color={isZeroShares ? 'text.disabled' : 'text.primary'}
                  >
                    {formatNumber(t.sharesBought, roundingMode === 'fractional' ? 4 : 0)} หุ้น
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </GlassCard>
  );
};

export default FundSplitDiagram;
