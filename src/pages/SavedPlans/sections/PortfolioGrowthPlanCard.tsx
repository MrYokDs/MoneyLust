/**
 * Route: /portfolio/:id
 * Section: PortfolioGrowthPlanCard (การ์ดแสดงแผนการลงทุนทบต้นที่เชื่อมโยงกับพอร์ต พร้อมความคืบหน้าและปุ่มเปิดดูแผนเต็ม)
 */

import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  Grid,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Target,
  ArrowRight,
  Sparkles,
  Award,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { Portfolio } from '../../../types';
import {
  calculateDailyGrowthPlan,
  findPortfolioBenchmarkPosition,
} from '../../../utils/growthPlanMath';

interface PortfolioGrowthPlanCardProps {
  portfolio: Portfolio;
  currentPortfolioValue: number;
  exchangeRate: number;
  onOpenPlan: () => void;
  onDeletePlan: () => void;
}

/**
 * คอมโพเนนต์แสดงผลแผนการลงทุนทบต้นที่เชื่อมโยงกับพอร์ตโฟลิโอปัจจุบัน
 * ช่วยให้นักลงทุนสามารถตรวจสอบสถานะเทียบกับเป้าหมาย และกดไปดูตารางรายวันได้โดยตรง
 * 
 * @param props - คุณสมบัติของคอมโพเนนต์
 * @returns JSX Element สำหรับแสดงแผนการเติบโตในหน้าพอร์ต
 */
export const PortfolioGrowthPlanCard: React.FC<PortfolioGrowthPlanCardProps> = ({
  portfolio,
  currentPortfolioValue,
  onOpenPlan,
  onDeletePlan,
}) => {
  const growthPlan = portfolio.growthPlan;

  // กรณีพอร์ตนี้ยังไม่ได้สร้างแผนการลงทุนทบต้น
  if (!growthPlan) {
    if (portfolio.id === 'unassigned') return null;

    return (
      <GlassCard
        sx={{
          p: 2.5,
          mb: 4,
          border: '1px dashed rgba(16, 185, 129, 0.35)',
          bgcolor: (theme) =>
            theme.palette.mode === 'light'
              ? 'rgba(16, 185, 129, 0.03)'
              : 'rgba(16, 185, 129, 0.05)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: 'rgba(16, 185, 129, 0.15)',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Target size={20} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" fontFamily="Prompt">
                ยังไม่มีแผนการลงทุนทบต้นสำหรับพอร์ตนี้
              </Typography>
              <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                สร้างแผนจำลองการเติบโตรายวัน กำหนดเป้าหมาย และติดตามเทียบเคียงแบบอัตโนมัติ
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<Sparkles size={14} />}
            onClick={onOpenPlan}
            sx={{
              fontFamily: 'Prompt',
              borderRadius: 2,
              px: 2,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            }}
          >
            สร้างแผนการลงทุนให้พอร์ตนี้
          </Button>
        </Stack>
      </GlassCard>
    );
  }

  // คำนวณตารางรายวันและ Benchmark ของแผนที่เชื่อมโยง
  const dailyItems = calculateDailyGrowthPlan(growthPlan);
  const benchmark = findPortfolioBenchmarkPosition(
    currentPortfolioValue,
    growthPlan.initialCapital,
    growthPlan.targetAmount,
    dailyItems
  );

  const currencySymbol = growthPlan.currency === 'USD' ? '$' : '฿';
  const totalDays = dailyItems.length;

  const formatMoney = (val: number): string => {
    return `${currencySymbol}${val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const renderStatusBadge = (status?: string): React.ReactElement | null => {
    switch (status) {
      case 'achieved':
        return (
          <Chip
            icon={<Award size={13} />}
            label="🏆 บรรลุเป้าหมายพอร์ตแล้ว!"
            color="success"
            size="small"
            sx={{ fontWeight: 'bold', fontFamily: 'Prompt' }}
          />
        );
      case 'ahead':
        return (
          <Chip
            icon={<Zap size={13} />}
            label="🚀 เติบโตเร็วกว่าแผน"
            color="success"
            size="small"
            variant="outlined"
            sx={{ fontWeight: 'bold', fontFamily: 'Prompt' }}
          />
        );
      case 'behind':
        return (
          <Chip
            icon={<AlertTriangle size={13} />}
            label="⏳ ตามหลังแผน"
            color="warning"
            size="small"
            variant="outlined"
            sx={{ fontWeight: 'bold', fontFamily: 'Prompt' }}
          />
        );
      default:
        return (
          <Chip
            icon={<CheckCircle2 size={13} />}
            label="✅ เดินหน้าตามแผน"
            color="primary"
            size="small"
            variant="outlined"
            sx={{ fontWeight: 'bold', fontFamily: 'Prompt' }}
          />
        );
    }
  };

  return (
    <GlassCard
      sx={{
        p: 3,
        mb: 4,
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%)'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.05) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
      }}
    >
      <Stack spacing={2.5}>
        {/* แถบหัวข้อและสถานะ */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1.5}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                p: 1.2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Target size={20} />
            </Box>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h6" fontWeight="bold" fontFamily="Prompt">
                  แผนการเติบโตของพอร์ต (Linked Growth Plan)
                </Typography>
                {renderStatusBadge(benchmark?.status)}
              </Stack>
              <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                เป้าหมาย {formatMoney(growthPlan.targetAmount)} (+{growthPlan.dailyReturnPercent}% / วัน)
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<Trash2 size={13} />}
              onClick={onDeletePlan}
              sx={{ fontFamily: 'Prompt', fontSize: '0.75rem', borderRadius: 2 }}
            >
              ยกเลิกแผนนี้
            </Button>

            <Button
              variant="contained"
              color="primary"
              size="small"
              endIcon={<ArrowRight size={14} />}
              onClick={onOpenPlan}
              sx={{
                fontFamily: 'Prompt',
                fontSize: '0.8rem',
                borderRadius: 2,
                px: 2,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              ดูแผนและตารางรายวันแบบเต็ม
            </Button>
          </Stack>
        </Stack>

        {/* สถิติตำแหน่งปัจจุบันและ Progress Bar */}
        {benchmark && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: (theme) =>
                theme.palette.mode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)',
              border: (theme) =>
                theme.palette.mode === 'light'
                  ? '1px solid rgba(0,0,0,0.06)'
                  : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                  ตำแหน่งปัจจุบัน
                </Typography>
                <Typography variant="h6" fontWeight="900" color="info.main" fontFamily="Prompt">
                  Day {benchmark.matchedDay} <span style={{ fontSize: '0.8rem', color: '#888' }}>/ {totalDays} วัน</span>
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                  ความคืบหน้า
                </Typography>
                <Typography variant="h6" fontWeight="900" color="primary.main" fontFamily="Prompt">
                  {benchmark.progressPercent.toFixed(1)}%
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                  ระยะเวลาที่เหลือ
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Clock size={16} color="#f59e0b" />
                  <Typography variant="h6" fontWeight="bold" fontFamily="Prompt">
                    อีก {benchmark.remainingDays} วัน
                  </Typography>
                </Stack>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                  มูลค่าเป้าหมาย
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="text.primary" fontFamily="Prompt">
                  {formatMoney(growthPlan.targetAmount)}
                </Typography>
              </Grid>

              {/* Progress bar เต็มความกว้าง */}
              <Grid size={{ xs: 12 }}>
                <LinearProgress
                  variant="determinate"
                  value={benchmark.progressPercent}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: (theme) =>
                      theme.palette.mode === 'light'
                        ? 'rgba(0,0,0,0.06)'
                        : 'rgba(255,255,255,0.08)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Stack>
    </GlassCard>
  );
};

export default PortfolioGrowthPlanCard;
