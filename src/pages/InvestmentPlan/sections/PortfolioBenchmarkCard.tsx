/**
 * Route: /investment-plan
 * Section: PortfolioBenchmarkCard (การ์ดวิเคราะห์เปรียบเทียบพอร์ตจริงกับเป้าหมายตามแผน และระบุตำแหน่งก้าวปัจจุบัน)
 */

import React from 'react';
import {
  Grid,
  Typography,
  Stack,
  Box,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  Target,
  Award,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { PortfolioBenchmark, CurrencyMode, DailyGrowthItem } from '../../../types';

interface PortfolioBenchmarkCardProps {
  benchmark?: PortfolioBenchmark;
  items: DailyGrowthItem[];
  currency: CurrencyMode;
  initialCapital: number;
  targetAmount: number;
  portfolioName?: string;
}

/**
 * คอมโพเนนต์แสดงผลการเปรียบเทียบพอร์ตการลงทุนจริงกับแผนการเติบโต
 * สรุปความคืบหน้า ตำแหน่งวัน (Day) และระยะเวลาที่เหลือจนถึงเป้าหมาย
 * 
 * @param props - คุณสมบัติของการ์ดเปรียบเทียบ
 * @returns JSX Element การ์ดวิเคราะห์สถานะแผน
 */
export const PortfolioBenchmarkCard: React.FC<PortfolioBenchmarkCardProps> = ({
  benchmark,
  items,
  currency,
  initialCapital,
  targetAmount,
  portfolioName,
}) => {
  const currencySymbol = currency === 'USD' ? '$' : '฿';
  const totalDays = items.length > 0 ? items[items.length - 1].day : 0;
  const finalBalance = items.length > 0 ? items[items.length - 1].endingBalance : targetAmount;
  const totalProfit = finalBalance - initialCapital;

  /**
   * ฟังก์ชันจัดรูปแบบตัวเลขสกุลเงิน
   * 
   * @param val - ยอดเงิน
   * @returns ข้อความจัดรูปแบบสกุลเงิน
   */
  const formatMoney = (val: number): string => {
    return `${currencySymbol}${val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  /**
   * สร้าง Chip แสดงสถานะเปรียบเทียบพอร์ตจริงกับแผน
   * 
   * @param status - สถานะของ Benchmark
   * @returns JSX Element สำหรับ Chip
   */
  const renderStatusChip = (status?: string): React.ReactElement => {
    switch (status) {
      case 'achieved':
        return (
          <Chip
            icon={<Award size={14} />}
            label="🏆 บรรลุเป้าหมายพอร์ตแล้ว!"
            color="success"
            sx={{ fontWeight: 'bold', fontFamily: 'Prompt' }}
          />
        );
      case 'ahead':
        return (
          <Chip
            icon={<Zap size={14} />}
            label="🚀 เติบโตเร็วกว่าแผน"
            color="success"
            variant="outlined"
            sx={{ fontWeight: 'bold', fontFamily: 'Prompt' }}
          />
        );
      case 'behind':
        return (
          <Chip
            icon={<AlertTriangle size={14} />}
            label="⏳ ตามหลังแผนเล็กน้อย"
            color="warning"
            variant="outlined"
            sx={{ fontWeight: 'bold', fontFamily: 'Prompt' }}
          />
        );
      default:
        return (
          <Chip
            icon={<CheckCircle2 size={14} />}
            label="✅ เดินหน้าตามแผนเป๊ะ"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 'bold', fontFamily: 'Prompt' }}
          />
        );
    }
  };

  // กรณีเชื่อมต่อกับพอร์ตจริง
  if (benchmark) {
    return (
      <GlassCard
        sx={{
          p: 3,
          background: (theme) =>
            theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)'
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
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <TrendingUp size={22} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold" fontFamily="Prompt">
                  สถานะพอร์ตจริงเทียบกับแผน: {portfolioName || 'พอร์ตที่เลือก'}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontFamily="Prompt">
                  วิเคราะห์ตำแหน่งก้าวและระยะเวลาที่เหลือสู่เป้าหมาย
                </Typography>
              </Box>
            </Stack>

            {renderStatusChip(benchmark.status)}
          </Stack>

          {/* ไฮไลต์ตำแหน่งพอร์ตปัจจุบัน */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '12px',
              bgcolor: (theme) =>
                theme.palette.mode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)',
              border: (theme) =>
                theme.palette.mode === 'light'
                  ? '1px solid rgba(0,0,0,0.06)'
                  : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                  มูลค่าพอร์ตปัจจุบัน
                </Typography>
                <Typography variant="h5" fontWeight="900" color="primary.main" fontFamily="Prompt">
                  {formatMoney(benchmark.currentPortfolioValue)}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                  ตำแหน่งปัจจุบันเทียบเท่ากับ
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={1}>
                  <Typography variant="h5" fontWeight="900" color="info.main" fontFamily="Prompt">
                    Day {benchmark.matchedDay}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontFamily="Prompt">
                    / {totalDays} วัน
                  </Typography>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                  ระยะเวลาที่ต้องเดินหน้าต่อ
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Clock size={18} color="#f59e0b" />
                  <Typography variant="h6" fontWeight="bold" fontFamily="Prompt">
                    อีก {benchmark.remainingDays} วัน
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          {/* Progress Bar ความคืบหน้าสู่เป้าหมาย */}
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" fontWeight="600" fontFamily="Prompt">
                ความคืบหน้าสู่เป้าหมาย ({formatMoney(targetAmount)})
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="primary.main" fontFamily="Prompt">
                {benchmark.progressPercent.toFixed(1)}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={benchmark.progressPercent}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: (theme) =>
                  theme.palette.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                },
              }}
            />
          </Stack>
        </Stack>
      </GlassCard>
    );
  }

  // กรณีแผนจำลองอิสระ (ยังไม่ได้เชื่อมต่อพอร์ต)
  return (
    <GlassCard sx={{ p: 3 }}>
      <Stack spacing={2.5}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              p: 1,
              borderRadius: '10px',
              bgcolor: 'primary.main',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Target size={20} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold" fontFamily="Prompt">
              สรุปภาพรวมแผนการเติบโต
            </Typography>
            <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
              ระยะเวลาและกำไรคาดหวังตามสมมติฐานการทบต้น
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }}>
              <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                เงินต้นเริ่มต้น
              </Typography>
              <Typography variant="h6" fontWeight="bold" fontFamily="Prompt">
                {formatMoney(initialCapital)}
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }}>
              <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                เป้าหมายปลายทาง
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main" fontFamily="Prompt">
                {formatMoney(targetAmount)}
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }}>
              <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                กำไรคาดหวังรวม
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main" fontFamily="Prompt">
                +{formatMoney(totalProfit)}
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }}>
              <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                ระยะเวลาที่ต้องใช้
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="info.main" fontFamily="Prompt">
                {totalDays} วัน
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Stack>
    </GlassCard>
  );
};

export default PortfolioBenchmarkCard;
