/**
 * Route: /
 * Component: ExecutionAndProfitSimulator (การ์ดแสดงผลลัพธ์การซื้อจริงและระบบจำลองราคาเป้าหมาย Exit Simulator)
 */

import React from 'react';
import {
  Paper,
  Stack,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  useTheme,
} from '@mui/material';
import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { CalculationResult, formatNumber, formatCurrency } from '../../utils/stockMath';

interface ExecutionAndProfitSimulatorProps {
  /** ข้อมูลผลการคำนวณการแบ่งไม้ */
  result: CalculationResult;
}

/**
 * คอมโพเนนต์แสดงผลลัพธ์จากการเข้าซื้อจริงรายไม้ และระบบจำลองกำไร/ราคาเป้าหมายขายทำกำไร
 * 
 * @param props - คุณสมบัติของคอมโพเนนต์ ประกอบด้วยผลลัพธ์การคำนวณ result
 * @returns JSX Element แสดงการ์ดผลการซื้อจริงและจำลองกำไร
 */
export const ExecutionAndProfitSimulator: React.FC<ExecutionAndProfitSimulatorProps> = ({
  result,
}) => {
  const theme = useTheme();
  const { roundingMode, currency = 'THB', exchangeRate = 36.5 } = result;

  return (
    <Grid container spacing={4} sx={{ width: '100%', m: 0 }}>
      {/* 1. Actual Execution Stats Summary Card */}
      <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', pl: '0 !important', pr: { xs: 0, md: 2 } }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            width: '100%',
            border:
              theme.palette.mode === 'light'
                ? '1px solid rgba(0, 0, 0, 0.08)'
                : '1px solid rgba(255, 255, 255, 0.08)',
            background:
              theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.06) 0%, rgba(255, 255, 255, 0.85) 100%)'
                : 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(10, 15, 25, 0.6) 100%)',
            backdropFilter: 'blur(16px) saturate(180%)',
            boxShadow:
              theme.palette.mode === 'light'
                ? '0 8px 32px 0 rgba(31, 38, 135, 0.05)'
                : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="h6"
            fontWeight="bold"
            mb={2}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            📈 ผลลัพธ์จากการซื้อจริง (Actual Execution)
          </Typography>

          <Stack spacing={2} sx={{ flexGrow: 1, justifyContent: 'center' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                ไม้ที่เข้าซื้อได้จริง
              </Typography>
              <Chip
                size="small"
                label={`${result.actualTranchesCount} จาก ${result.tranchesCount} ไม้`}
                color={
                  (result.actualTranchesCount || 0) < (result.tranchesCount || 0)
                    ? 'warning'
                    : 'success'
                }
                sx={{ fontWeight: 'bold' }}
              />
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                เงินที่ใช้ซื้อจริงสะสม
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {formatCurrency(
                  result.actualSpent || 0,
                  currency,
                  currency === 'USD',
                  exchangeRate
                )}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                จำนวนหุ้นรวมที่ได้จริง
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {formatNumber(result.actualShares || 0, roundingMode === 'fractional' ? 4 : 0)} หุ้น
              </Typography>
            </Stack>

            {/* ถ้ายังไม่ได้ระบุราคาขายจริง ให้แสดงราคาต้นทุนเฉลี่ยจริงที่นี่ */}
            {(!result.actualSellPrice || result.actualSellPrice <= 0) && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  ราคาต้นทุนเฉลี่ยจริง
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="secondary.light">
                  {formatCurrency(result.actualAverageCost || 0, currency, false, exchangeRate)}
                </Typography>
              </Stack>
            )}

            {!!result.actualSellPrice && result.actualSellPrice > 0 && (
              <>
                <Divider sx={{ opacity: 0.1 }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    ราคาที่ขายจริง
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(result.actualSellPrice, currency, false, exchangeRate)}
                  </Typography>
                </Stack>

                {/* ถ้าระบุราคาขายจริง แสดงราคาต้นทุนเฉลี่ยจริงใต้ราคาขาย */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mt={1.5}
                >
                  <Typography variant="body2" color="text.secondary">
                    ราคาต้นทุนเฉลี่ยจริง
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="secondary.light">
                    {formatCurrency(result.actualAverageCost || 0, currency, false, exchangeRate)}
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mt={1.5}
                >
                  <Typography variant="body2" color="text.secondary">
                    กำไร / ขาดทุนจริงสุทธิ
                  </Typography>
                  <Stack alignItems="end">
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color={
                        (result.actualRealizedProfitLossAmount || 0) >= 0
                          ? 'success.light'
                          : 'error.light'
                      }
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      {(result.actualRealizedProfitLossAmount || 0) >= 0 ? (
                        <TrendingUp size={16} />
                      ) : (
                        <TrendingDown size={16} />
                      )}
                      {formatCurrency(
                        result.actualRealizedProfitLossAmount || 0,
                        currency,
                        false,
                        exchangeRate
                      )}
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      color={
                        (result.actualRealizedProfitLossAmount || 0) >= 0
                          ? 'success.light'
                          : 'error.light'
                      }
                    >
                      {(result.actualRealizedProfitLossAmount || 0) >= 0 ? '+' : ''}
                      {result.actualRealizedProfitLossPercent}% (ROI)
                    </Typography>
                    {result.actualTranchesCount !== result.tranchesCount && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.72rem', mt: 0.3 }}
                      >
                        เทียบแผนเต็ม:{' '}
                        {(result.actualRealizedProfitLossAmount || 0) >= 0 ? '+' : ''}
                        {result.actualRealizedProfitLossPercentOfFullPlan}% ROI
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              </>
            )}
          </Stack>
        </Paper>
      </Grid>

      {/* 2. Exit & Profit Simulator Card */}
      <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', pr: '0 !important', pl: { xs: 0, md: 2 } }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            background:
              theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(255, 255, 255, 0.85) 100%)'
                : 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(10, 15, 25, 0.7) 100%)',
            border:
              theme.palette.mode === 'light'
                ? '1px solid rgba(6, 182, 212, 0.3)'
                : '1px solid rgba(6, 182, 212, 0.15)',
            backdropFilter: 'blur(16px) saturate(180%)',
            boxShadow:
              theme.palette.mode === 'light'
                ? '0 8px 32px 0 rgba(31, 38, 135, 0.05)'
                : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="h6"
            fontWeight="bold"
            mb={2}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            🎯 Exit & Profit Simulator
          </Typography>

          <Stack spacing={2} sx={{ flexGrow: 1, justifyContent: 'center' }}>
            {/* Planned target sell price (Full plan) */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight="bold">
                  ราคาขาย : เป้าหมายเมื่อซื้อครบแผน ({result.tranchesCount} ไม้)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  เพื่อให้ได้กำไร {result.targetProfitPercent}% จากทุนเต็มแผน{' '}
                  {formatCurrency(result.totalActualSpent, currency, false, exchangeRate)}
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight="bold" color="text.secondary">
                {formatCurrency(result.targetSellPrice || 0, currency, false, exchangeRate)}
              </Typography>
            </Stack>

            <Divider sx={{ opacity: 0.1 }} />

            {/* Actual target sell price (Based on actual executed tranches) */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" color="success.main" fontWeight="bold">
                  ราคาขาย : เป้าหมายจริง ณ ตอนนี้ ({result.actualTranchesCount} ไม้)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  เพื่อให้ได้กำไรสุทธิ {result.targetProfitPercent}% จากเงินลงทุนจริงสะสม{' '}
                  {formatCurrency(result.actualSpent || 0, currency, false, exchangeRate)}
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="950" color="success.main">
                {formatCurrency(result.actualTargetSellPrice || 0, currency, false, exchangeRate)}
              </Typography>
            </Stack>

            {result.actualTranchesCount !== result.tranchesCount && (
              <>
                <Divider sx={{ opacity: 0.1 }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="primary.light" fontWeight="bold">
                      ราคาขาย : เป้าหมายเทียบเท่าเพื่อให้ได้เงินกำไรเท่าแผนเต็ม
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      เพื่อให้ได้เม็ดเงินกำไรเท่ากับตอนซื้อครบทุกไม้ (≈{' '}
                      {formatCurrency(
                        ((result.totalActualSpent * (1 + (result.feePercent || 0) / 100)) *
                          (result.targetProfitPercent || 0)) /
                          100,
                        currency,
                        false,
                        exchangeRate
                      )}
                      ) แม้จะเข้าซื้อเพียง {result.actualTranchesCount} ไม้
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    fontWeight="950"
                    color="primary.light"
                    className="glow-text-cyan"
                  >
                    {formatCurrency(
                      result.actualEquivalentTargetSellPrice || 0,
                      currency,
                      false,
                      exchangeRate
                    )}
                  </Typography>
                </Stack>
              </>
            )}

            <Divider sx={{ opacity: 0.1 }} />

            {!!result.actualSellPrice && result.actualSellPrice > 0 ? (
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    ราคาที่ขายจริง
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(result.actualSellPrice, currency, false, exchangeRate)}
                  </Typography>
                </Stack>

                {/* Actual Executed Tranches Profit/Loss */}
                <Stack
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor:
                      (result.actualRealizedProfitLossAmount || 0) >= 0
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                    backgroundColor:
                      (result.actualRealizedProfitLossAmount || 0) >= 0
                        ? 'rgba(16, 185, 129, 0.03)'
                        : 'rgba(239, 68, 68, 0.03)',
                  }}
                  spacing={1}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      กำไร/ขาดทุน จากยอดซื้อจริง ({result.actualTranchesCount} ไม้)
                    </Typography>
                    <Stack alignItems="end">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color={
                          (result.actualRealizedProfitLossAmount || 0) >= 0
                            ? 'success.main'
                            : 'error.light'
                        }
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        {(result.actualRealizedProfitLossAmount || 0) >= 0 ? (
                          <TrendingUp size={16} />
                        ) : (
                          <TrendingDown size={16} />
                        )}
                        {formatCurrency(
                          result.actualRealizedProfitLossAmount || 0,
                          currency,
                          false,
                          exchangeRate
                        )}
                      </Typography>
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        color={
                          (result.actualRealizedProfitLossAmount || 0) >= 0
                            ? 'success.main'
                            : 'error.light'
                        }
                      >
                        {(result.actualRealizedProfitLossAmount || 0) >= 0 ? '+' : ''}
                        {result.actualRealizedProfitLossPercent}% (Net ROI)
                      </Typography>
                      {result.actualTranchesCount !== result.tranchesCount && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.72rem', mt: 0.3 }}
                        >
                          เทียบแผนเต็ม:{' '}
                          {(result.actualRealizedProfitLossAmount || 0) >= 0 ? '+' : ''}
                          {result.actualRealizedProfitLossPercentOfFullPlan}% ROI
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Stack>

                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor:
                      (result.actualRealizedProfitLossAmount || 0) >= 0
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                    backgroundColor:
                      (result.actualRealizedProfitLossAmount || 0) >= 0
                        ? 'rgba(16, 185, 129, 0.03)'
                        : 'rgba(239, 68, 68, 0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <CheckCircle2
                    size={16}
                    color={
                      (result.actualRealizedProfitLossAmount || 0) >= 0 ? '#10b981' : '#ef4444'
                    }
                  />
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: 'Prompt' }}
                    color={
                      (result.actualRealizedProfitLossAmount || 0) >= 0
                        ? 'success.light'
                        : 'error.light'
                    }
                  >
                    {(result.actualRealizedProfitLossAmount || 0) >= 0
                      ? 'ยอดเยี่ยม! คุณทำกำไรได้สำเร็จหลังหักค่าดำเนินการเรียบร้อย'
                      : 'แผนการขายนี้ขาดทุนสุทธิหลังหักค่าดำเนินการทั้งหมด'}
                  </Typography>
                </Box>
              </Stack>
            ) : (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.1)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Prompt' }}>
                  💡 ระบุ "ราคาที่ขายจริง" ที่เมนูตั้งค่าฝั่งซ้าย เพื่อประเมินยอดกำไร/ขาดทุนสุทธิทันที!
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ExecutionAndProfitSimulator;
