/**
 * Route: /
 * Component: CostReductionSummary (การ์ดสรุปส่วนลดต้นทุนเฉลี่ยและสถิติภาพรวมทั้งสิ้น)
 */

import React from 'react';
import {
  Stack,
  Typography,
  Box,
  Divider,
  useTheme,
} from '@mui/material';
import GlassCard from '../GlassCard';
import { DollarSign, TrendingDown, ShoppingBag } from 'lucide-react';
import { CalculationResult, formatNumber, formatCurrency } from '../../utils/stockMath';

interface CostReductionSummaryProps {
  /** ข้อมูลผลการคำนวณการแบ่งไม้ */
  result: CalculationResult;
}

/**
 * คอมโพเนนต์แสดงการ์ดสรุปส่วนลดต้นทุนเฉลี่ยของพอร์ต และภาพรวมงบลงทุน/หุ้นที่ได้รับ
 * รองรับการแสดงผลอัจฉริยะทั้งกรณีซื้อไม้เดียว (Lump Sum) และกรณีแบ่งซื้อถัวเฉลี่ยหลายไม้ (DCA)
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
    tranchesCount,
    overallDiscountPercent,
    feePercent = 0,
  } = result;

  const isSingleTranche = tranchesCount <= 1;
  const isPositiveDiscount = overallDiscountPercent > 0;

  return (
    <Stack spacing={3} sx={{ width: '100%' }}>
      {/* Quick KPI: Total discount / Strategy context */}
      <GlassCard
        sx={{
          p: 3,
          position: 'relative',
          overflow: 'hidden',
          background: isSingleTranche
            ? theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(255, 255, 255, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(10, 15, 25, 0.7) 100%)'
            : theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(255, 255, 255, 0.85) 100%)'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(10, 15, 25, 0.7) 100%)',
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
          {isSingleTranche ? <ShoppingBag size={140} /> : <TrendingDown size={140} />}
        </Box>

        <Stack spacing={1}>
          <Typography
            variant="subtitle2"
            color={isSingleTranche ? 'info.main' : 'primary.light'}
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            {isSingleTranche
              ? 'การซื้อไม้เดียวที่ราคาตลาด (Lump Sum)'
              : 'ส่วนลดต้นทุนเฉลี่ยของพอร์ต (DCA Discount)'}
          </Typography>

          <Typography
            variant="h3"
            fontWeight="900"
            className={!isSingleTranche && isPositiveDiscount ? 'glow-text-emerald' : undefined}
            sx={{
              my: 1,
              color: isSingleTranche
                ? 'text.primary'
                : isPositiveDiscount
                ? 'success.main'
                : 'text.secondary',
            }}
          >
            {isSingleTranche
              ? '0.00%'
              : `${isPositiveDiscount ? '+' : ''}${formatNumber(overallDiscountPercent, 2)}%`}
          </Typography>

          {isSingleTranche ? (
            <Typography variant="body2" color="text.secondary">
              คุณเลือกเข้าซื้อเพียง 1 ไม้ที่ราคาปัจจุบัน จึงไม่มีส่วนลดต้นทุนจากการแบ่งไม้ถัวเฉลี่ย{' '}
              {feePercent > 0 && (
                <>(มีต้นทุนค่าธรรมเนียมซื้อ +{feePercent}% รวมอยู่ในราคาเข้าซื้อ)</>
              )}
              <Box
                component="span"
                sx={{
                  display: 'block',
                  mt: 0.8,
                  color: 'info.main',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                💡 หากต้องการลดต้นทุนเฉลี่ยเมื่อราคาหุ้นย่อตัว ลองแบ่งซื้อเป็น 2 ไม้ขึ้นไป
              </Box>
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              หากหุ้น {stockSymbol} ตกจาก{' '}
              {formatCurrency(currentPrice, currency, false, exchangeRate)} ลงไปถึงเป้าหมายไม้สุดท้าย
              การแบ่งซื้อวิธีนี้จะช่วยลดราคาต้นทุนเฉลี่ยลงไปได้ถึง{' '}
              <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                {overallDiscountPercent}%
              </span>{' '}
              เมื่อเทียบกับการทุ่มซื้อไม้แรกทีเดียวทั้งหมด!
            </Typography>
          )}
        </Stack>
      </GlassCard>

      {/* Detailed Stats */}
      <GlassCard sx={{ p: 3 }}>
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
      </GlassCard>
    </Stack>
  );
};

export default CostReductionSummary;
