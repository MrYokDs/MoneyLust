/**
 * Route: /
 * Component: FundSplitDiagram (แผนภาพและแถบสไลเดอร์แสดงการแบ่งสัดส่วนงบประมาณรายไม้)
 */

import React from 'react';
import {
  Paper,
  Stack,
  Typography,
  Box,
  Chip,
  Divider,
  useTheme,
} from '@mui/material';
import { PieChart } from 'lucide-react';
import { CalculationResult, formatNumber, formatCurrency } from '../../utils/stockMath';

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
  const { tranches, roundingMode, currency = 'THB', exchangeRate = 36.5 } = result;

  // คำนวณงบประมาณฐานเพื่อใช้เปรียบเทียบเศษที่ถูกทบ
  const baseBudget = Math.floor(result.totalBudget / result.tranchesCount);

  return (
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
          theme.palette.mode === 'light'
            ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)'
            : 'linear-gradient(180deg, rgba(17, 25, 40, 0.5) 0%, rgba(10, 15, 30, 0.7) 100%)',
        backdropFilter: 'blur(16px) saturate(180%)',
        boxShadow:
          theme.palette.mode === 'light'
            ? '0 8px 32px 0 rgba(31, 38, 135, 0.05)'
            : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      }}
    >
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

          return (
            <Box
              key={index}
              sx={{
                minWidth: { xs: 220, sm: 240, md: 260 },
                flexShrink: 0,
                position: 'relative',
                p: 2,
                borderRadius: 3,
                border: '1px solid',
                borderColor:
                  theme.palette.mode === 'light'
                    ? isLast
                      ? 'rgba(6, 182, 212, 0.4)'
                      : 'rgba(0, 0, 0, 0.08)'
                    : isLast
                    ? 'rgba(6, 182, 212, 0.25)'
                    : 'rgba(255, 255, 255, 0.05)',
                background:
                  theme.palette.mode === 'light'
                    ? isLast
                      ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(255, 255, 255, 0.95) 100%)'
                      : 'linear-gradient(135deg, rgba(0, 0, 0, 0.01) 0%, rgba(255, 255, 255, 0.8) 100%)'
                    : isLast
                    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(10, 20, 40, 0.4) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(10, 15, 25, 0.4) 100%)',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow:
                    theme.palette.mode === 'light'
                      ? isLast
                        ? '0 6px 20px rgba(6, 182, 212, 0.15)'
                        : '0 6px 15px rgba(31, 38, 135, 0.05)'
                      : isLast
                      ? '0 6px 20px rgba(6, 182, 212, 0.2)'
                      : '0 6px 15px rgba(0, 0, 0, 0.3)',
                  borderColor: isLast ? 'secondary.main' : 'primary.main',
                },
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Chip
                  size="small"
                  label={`ไม้ที่ ${t.trancheNumber}`}
                  color={isLast ? 'secondary' : 'primary'}
                  variant={isLast ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 'bold' }}
                />
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  {percent.toFixed(2)}%
                </Typography>
              </Stack>

              <Typography
                variant="h5"
                fontWeight="800"
                color={isLast ? 'secondary.light' : 'text.primary'}
              >
                {formatCurrency(t.sharesBought * t.price, currency, false, exchangeRate)}
              </Typography>

              {isLast && t.budgetAllocated > baseBudget && (
                <Typography
                  variant="caption"
                  color="secondary.light"
                  sx={{ display: 'block', mt: 0.5 }}
                >
                  💡 มีการรวมเศษทศนิยม (+
                  {formatCurrency(t.budgetAllocated - baseBudget, currency, false, exchangeRate)})
                </Typography>
              )}

              <Divider sx={{ my: 1, opacity: 0.3 }} />

              <Stack spacing={0.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    ราคาซื้อเป้าหมาย:
                  </Typography>
                  <Typography variant="caption" fontWeight="bold" color="success.main">
                    {formatCurrency(t.price, currency, false, exchangeRate)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    จำนวนหุ้นที่จะได้:
                  </Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {formatNumber(t.sharesBought, roundingMode === 'fractional' ? 4 : 0)} หุ้น
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default FundSplitDiagram;
