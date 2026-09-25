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
  firstTradeDate?: string;
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
  firstTradeDate,
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
    dailyItems,
    firstTradeDate
  );

  const currencySymbol = growthPlan.currency === 'USD' ? '$' : '฿';
  const totalDays = dailyItems.length;

  const formatMoney = (val: number): string => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const formatted = `${currencySymbol}${absVal.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    return isNegative ? `-${formatted}` : formatted;
  };

  const renderStatusBadge = (bench?: typeof benchmark): React.ReactElement | null => {
    if (!bench) return null;
    const { status } = bench;

    switch (status) {
      case 'achieved':
        return (
          <Chip
            icon={<Award size={13} />}
            label="บรรลุเป้าหมายแล้ว"
            color="success"
            size="small"
            sx={{ fontWeight: 'bold', fontFamily: 'Prompt' }}
          />
        );
      case 'ahead':
        return (
          <Chip
            icon={<Zap size={13} />}
            label="เร็วกว่าแผน"
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
            label="ช้ากว่าแผน"
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
            label="เดินหน้าตามแผน"
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
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                <Typography variant="h6" fontWeight="bold" fontFamily="Prompt">
                  แผนการเติบโตของพอร์ต (Linked Growth Plan)
                </Typography>
                {renderStatusBadge(benchmark)}
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
            <Grid container spacing={2} alignItems="flex-start">
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                  ตำแหน่งปัจจุบัน
                </Typography>
                <Typography variant="h6" fontWeight="900" color="info.main" fontFamily="Prompt">
                  Day {benchmark.matchedDay} <span style={{ fontSize: '0.8rem', color: '#888' }}>/ {totalDays} วัน</span>
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    fontFamily: 'Prompt',
                    fontSize: '0.72rem',
                    color: benchmark.daysBehind > 0 ? 'warning.main' : benchmark.daysBehind < 0 ? 'success.main' : 'text.secondary',
                    fontWeight: benchmark.daysBehind !== 0 ? 'bold' : 'normal',
                  }}
                >
                  {benchmark.daysBehind > 0
                    ? `ควรอยู่ Day ${benchmark.expectedDay} (ช้าไป ${benchmark.daysBehind} วัน)`
                    : benchmark.daysBehind < 0
                    ? `ควรอยู่ Day ${benchmark.expectedDay} (เร็วกว่า ${Math.abs(benchmark.daysBehind)} วัน)`
                    : `ตรงตามวันของแผน (Day ${benchmark.expectedDay})`}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                  ความคืบหน้าจริง
                </Typography>
                <Typography variant="h6" fontWeight="900" color="primary.main" fontFamily="Prompt">
                  {benchmark.progressPercent.toFixed(1)}%
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    fontFamily: 'Prompt',
                    fontSize: '0.72rem',
                    color: benchmark.progressBehindPercent > 0 ? 'warning.main' : benchmark.progressBehindPercent < 0 ? 'success.main' : 'text.secondary',
                    fontWeight: Math.abs(benchmark.progressBehindPercent) >= 0.1 ? 'bold' : 'normal',
                  }}
                >
                  {benchmark.progressBehindPercent > 0
                    ? `ความคืบหน้าช้าไป ${benchmark.progressBehindPercent.toFixed(1)}%`
                    : benchmark.progressBehindPercent < 0
                    ? `เร็วกว่าเป้าหมาย +${Math.abs(benchmark.progressBehindPercent).toFixed(1)}%`
                    : `ตรงตามเป้าหมายของวัน`}
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
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontFamily: 'Prompt', fontSize: '0.72rem' }}>
                  เทรดมาแล้ว {benchmark.elapsedTradingDays} วันทำการ
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                  มูลค่าเป้าหมาย
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="text.primary" fontFamily="Prompt">
                  {formatMoney(growthPlan.targetAmount)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontFamily: 'Prompt', fontSize: '0.72rem' }}>
                  เป้าหมายตามแผนวันนี้: {formatMoney(benchmark.expectedBalance)}
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

              {/* แถบสรุปข้อความภาษาไทย */}
              {benchmark.summaryText && (
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      p: 1.2,
                      px: 1.8,
                      borderRadius: 2,
                      bgcolor:
                        benchmark.status === 'behind'
                          ? 'rgba(245, 158, 11, 0.08)'
                          : benchmark.status === 'ahead' || benchmark.status === 'achieved'
                          ? 'rgba(16, 185, 129, 0.08)'
                          : 'rgba(59, 130, 246, 0.08)',
                      border: `1px solid ${
                        benchmark.status === 'behind'
                          ? 'rgba(245, 158, 11, 0.25)'
                          : benchmark.status === 'ahead' || benchmark.status === 'achieved'
                          ? 'rgba(16, 185, 129, 0.25)'
                          : 'rgba(59, 130, 246, 0.25)'
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {benchmark.status === 'behind' ? (
                        <AlertTriangle size={15} color="#f59e0b" />
                      ) : benchmark.status === 'achieved' ? (
                        <Award size={15} color="#10b981" />
                      ) : (
                        <Zap size={15} color="#10b981" />
                      )}
                      <Typography variant="caption" fontWeight="bold" fontFamily="Prompt">
                        สรุปสถานะ: {benchmark.summaryText}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" fontFamily="Prompt" sx={{ fontSize: '0.7rem' }}>
                      เริ่มนับวันแรกจากวันที่เริ่มเทรด ({benchmark.firstTradeDate ? new Date(benchmark.firstTradeDate).toLocaleDateString('th-TH') : '-'})
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </Stack>
    </GlassCard>
  );
};

export default PortfolioGrowthPlanCard;
