/**
 * Route: /
 * Component: CostReductionSummary (การ์ดสรุปส่วนลดต้นทุนเฉลี่ยและสถิติภาพรวมทั้งสิ้น)
 */

import React from 'react';
import {
  Paper,
  Stack,
  Typography,
  Box,
  Divider,
  useTheme,
} from '@mui/material';
import { DollarSign, TrendingDown } from 'lucide-react';
import { CalculationResult, formatNumber, formatCurrency } from '../../utils/stockMath';

interface CostReductionSummaryProps {
  /** ข้อมูลผลการคำนวณการแบ่งไม้ */
  result: CalculationResult;
}

/**
 * คอมโพเนนต์แสดงการ์ดสรุปส่วนลดต้นทุนเฉลี่ยของพอร์ต และภาพรวมงบลงทุน/หุ้นที่ได้รับ
 * 
 * @param props - คุณสมบัติของคอมโพเนนต์ ประกอบด้วยผลลัพธ์การคำนวณ result
 * @returns JSX Element แสดงการ์ด KPI ส่วนลดและสถิติสรุป
 */
export const CostReductionSummary: React.FC<CostReductionSummaryProps> = ({ result }) => {
  const theme = useTheme();
  const {
    currentPrice,
    stockSymbol,
    roundingMode,
    currency = 'THB',
    exchangeRate = 36.5,
  } = result;

  return (
    <Stack spacing={3} sx={{ width: '100%' }}>
      {/* Quick KPI: Total discount */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden',
          border:
            theme.palette.mode === 'light'
              ? '1px solid rgba(0, 0, 0, 0.08)'
              : '1px solid rgba(255, 255, 255, 0.08)',
          background:
            theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(255, 255, 255, 0.85) 100%)'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(10, 15, 25, 0.6) 100%)',
          backdropFilter: 'blur(16px) saturate(180%)',
          boxShadow:
            theme.palette.mode === 'light'
              ? '0 8px 32px 0 rgba(31, 38, 135, 0.05)'
              : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            right: -10,
            bottom: -10,
            opacity: 0.05,
            transform: 'rotate(-10deg)',
          }}
        >
          <TrendingDown size={140} />
        </Box>

        <Stack spacing={1}>
          <Typography
            variant="subtitle2"
            color="primary.light"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            ส่วนลดต้นทุนเฉลี่ยของพอร์ต
          </Typography>
          <Typography variant="h3" fontWeight="900" className="glow-text-emerald" sx={{ my: 1 }}>
            {formatNumber(result.overallDiscountPercent, 2)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            หากหุ้น {stockSymbol} ตกจาก{' '}
            {formatCurrency(currentPrice, currency, false, exchangeRate)} ลงไปถึงเป้าหมายไม้สุดท้าย
            การแบ่งซื้อวิธีนี้จะลดราคาต้นทุนซื้อเฉลี่ยลงไปได้ถึง{' '}
            <span style={{ fontWeight: 'bold', color: '#10b981' }}>
              {result.overallDiscountPercent}%
            </span>{' '}
            เมื่อเทียบกับการซื้อไม้แรกทีเดียวทั้งหมด!
          </Typography>
        </Stack>
      </Paper>

      {/* Detailed Stats */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          border:
            theme.palette.mode === 'light'
              ? '1px solid rgba(0, 0, 0, 0.08)'
              : '1px solid rgba(255, 255, 255, 0.08)',
          background:
            theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(17, 25, 40, 0.65)',
          backdropFilter: 'blur(16px) saturate(180%)',
          boxShadow:
            theme.palette.mode === 'light'
              ? '0 8px 32px 0 rgba(31, 38, 135, 0.05)'
              : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        }}
      >
        <Typography variant="h6" fontWeight="bold" mb={2}>
          สรุปยอดรวมทั้งสิ้น
        </Typography>

        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <DollarSign size={16} color={theme.palette.text.secondary} />
              <Typography variant="body2" color="text.secondary">
                งบลงทุนทั้งหมด
              </Typography>
            </Stack>
            <Typography variant="body1" fontWeight="bold">
              {formatCurrency(result.totalBudget, currency, currency === 'USD', exchangeRate)}
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <DollarSign size={16} color={theme.palette.text.secondary} />
              <Typography variant="body2" color="text.secondary">
                เงินใช้ซื้อจริงสะสม
              </Typography>
            </Stack>
            <Typography variant="body1" fontWeight="bold">
              {formatCurrency(result.totalActualSpent, currency, false, exchangeRate)}
            </Typography>
          </Stack>

          <Divider sx={{ opacity: 0.3 }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              จำนวนหุ้นรวมที่ได้
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {formatNumber(result.totalSharesBought, roundingMode === 'fractional' ? 4 : 0)} หุ้น
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              ราคาต้นทุนเฉลี่ยของพอร์ต
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="secondary.light">
              {formatCurrency(result.finalAverageCost, currency, false, exchangeRate)}
            </Typography>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default CostReductionSummary;
