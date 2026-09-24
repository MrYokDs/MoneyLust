/**
 * Component: TradingWindowsTab
 * แสดงตารางเวลาเข้าซื้อ 3 ช่วงเวลา พร้อมข้อมูลเวลาเปิด-ปิดตลาดหุ้นสหรัฐฯ ตามช่วงเดือน (DST)
 */

import React from 'react';
import { Box, Typography, Stack, Chip, useTheme } from '@mui/material';
import {
  Clock,
  Sparkles,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Sun,
  Snowflake,
} from 'lucide-react';
import { UsMarketSeasonInfo, ActiveTradingWindow } from '../../utils/usMarketTime';

interface TradingWindowsTabProps {
  seasonInfo: UsMarketSeasonInfo;
  activeWindow: ActiveTradingWindow | null;
  formattedTimeStr: string;
}

/**
 * แท็บที่ 1: แสดงตารางช่วงเวลาเข้าซื้อที่เหมาะสม และเวลาเปิด-ปิดตลาดตามฤดูกาล
 * 
 * @param props - คุณสมบัติที่ส่งเข้ามาประกอบด้วย seasonInfo, activeWindow และ formattedTimeStr
 * @returns JSX Element สำหรับแสดงเนื้อหาตารางเวลาเข้าซื้อ
 */
export const TradingWindowsTab: React.FC<TradingWindowsTabProps> = ({
  seasonInfo,
  activeWindow,
  formattedTimeStr,
}) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  return (
    <Box>
      {/* แถบแจ้งเวลาเปิด-ปิดตลาดหุ้นสหรัฐฯ ตามเดือนปัจจุบัน (DST vs Standard) */}
      <Box
        sx={{
          mb: 1.25,
          p: 1,
          borderRadius: '8px',
          background: isLight
            ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(16, 185, 129, 0.1) 100%)',
          border: isLight ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid rgba(6, 182, 212, 0.25)',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={0.6}>
            {seasonInfo.isDst ? <Sun size={13} color="#f59e0b" /> : <Snowflake size={13} color="#06b6d4" />}
            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.73rem', color: isLight ? '#0f172a' : '#f1f5f9' }}>
              🇺🇸 ตลาดสหรัฐฯ ({seasonInfo.isDst ? 'DST' : 'ปกติ'}):
            </Typography>
          </Stack>
          <Chip
            label={seasonInfo.isMarketOpenNow ? '🟢 ตลาดเปิด' : '⚪ ตลาดปิด'}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.6rem',
              fontWeight: 700,
              backgroundColor: seasonInfo.isMarketOpenNow
                ? isLight ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.25)'
                : isLight ? 'rgba(100, 116, 139, 0.1)' : 'rgba(100, 116, 139, 0.2)',
              color: seasonInfo.isMarketOpenNow ? '#10b981' : 'text.secondary',
              border: seasonInfo.isMarketOpenNow ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(100, 116, 139, 0.2)',
            }}
          />
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
            เวลาเทรด: <strong style={{ color: '#06b6d4' }}>{seasonInfo.marketHoursDesc}</strong>
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.62rem' }}>
            ({seasonInfo.seasonPeriod})
          </Typography>
        </Stack>
      </Box>

      {/* แถบแจ้งเตือน Realtime Active Window หรือ นาฬิกาปัจจุบัน */}
      {activeWindow ? (
        <Box
          sx={{
            mb: 1.25,
            p: 0.9,
            borderRadius: '8px',
            backgroundColor: isLight ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.25)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            animation: 'pulse 2s infinite ease-in-out',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' },
              '70%': { boxShadow: '0 0 0 6px rgba(16, 185, 129, 0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
            },
          }}
        >
          <Sparkles size={16} color="#10b981" />
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ color: isLight ? '#065f46' : '#34d399', fontSize: '0.72rem' }}
          >
            {activeWindow.text}
          </Typography>
        </Box>
      ) : (
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Clock size={12} color={isLight ? '#b45309' : '#fbbf24'} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
              เวลาปัจจุบัน: <strong style={{ color: isLight ? '#1f2937' : '#f3f4f6' }}>{formattedTimeStr}</strong>
            </Typography>
          </Stack>
          <Chip
            label={seasonInfo.isDst ? 'โหมดฤดูร้อน (มี.ค.-พ.ย.)' : 'โหมดเวลาปกติ (พ.ย.-มี.ค.)'}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.6rem',
              fontWeight: 600,
              backgroundColor: isLight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.2)',
              color: isLight ? '#b45309' : '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          />
        </Stack>
      )}

      {/* รายการช่วงเวลาเข้าซื้อที่ปรับตามฤดูกาลอัตโนมัติ */}
      <Stack spacing={0.9}>
        {seasonInfo.windows.map((w) => {
          const isItemHot = activeWindow?.windowId === w.id;
          return (
            <Box
              key={w.id}
              sx={{
                p: 1,
                borderRadius: '8px',
                backgroundColor: isItemHot
                  ? isLight ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.2)'
                  : isLight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.04)',
                border: isItemHot
                  ? '1px solid #10b981'
                  : isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: w.isDowntrend ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)',
                  backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.07)',
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flex: 1, mr: 1 }}>
                {w.isDowntrend ? (
                  <TrendingDown size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
                ) : (
                  <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0 }} />
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{
                      fontSize: '0.82rem',
                      color: w.isDowntrend
                        ? isLight ? '#92400e' : '#fbbf24'
                        : isLight ? '#065f46' : '#34d399',
                      fontFamily: 'monospace',
                    }}
                  >
                    {w.timeRange}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', display: 'block', whiteSpace: 'nowrap' }}>
                    {w.title}
                  </Typography>
                </Box>
              </Stack>
              <Chip
                label={w.badgeLabel}
                size="small"
                sx={{
                  flexShrink: 0,
                  height: 18,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  backgroundColor: w.isDowntrend ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: w.isDowntrend ? '#f59e0b' : '#10b981',
                  border: w.isDowntrend ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                }}
              />
            </Box>
          );
        })}
      </Stack>

      {/* Mindset / Warning Footer Note */}
      <Box
        sx={{
          mt: 1.25,
          pt: 1,
          borderTop: isLight ? '1px dashed rgba(0,0,0,0.1)' : '1px dashed rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 0.75,
        }}
      >
        <AlertCircle size={13} color="#06b6d4" style={{ marginTop: 2, flexShrink: 0 }} />
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.67rem',
              lineHeight: 1.35,
              display: 'block',
              fontStyle: 'italic',
            }}
          >
            💡 เตือนใจ: รอรอบเวลาแท่งเทียน อย่ารีบเข้าซื้อก่อนเวลา คุมอารมณ์และแผนการแบ่งไม้เสมอ
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.63rem',
              lineHeight: 1.3,
              display: 'block',
              mt: 0.4,
              opacity: 0.85,
            }}
          >
            *ระบบปรับเวลาเข้าซื้ออัตโนมัติตาม Daylight Saving Time (DST) ช่วง มี.ค.-พ.ย. เปิด 20:30-03:00 น. และช่วง พ.ย.-มี.ค. จะเลื่อนช้าลง 1 ชม. (เปิด 21:30-04:00 น.)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default TradingWindowsTab;
