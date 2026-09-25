/**
 * Component: TradingNoteContent
 * ส่วนเนื้อหากระดาษโน้ตเตือนสติ (แบนเนอร์เตือนวันหยุด, แถบสลับแท็บ, ตารางเวลาเข้าซื้อ และปฏิทินวันหยุด)
 * ใช้ร่วมกันทั้งในโหมด Header Dropdown และโหมด Floating Draggable Window
 */

import React from 'react';
import {
  Box,
  Typography,
  Stack,
  useTheme,
} from '@mui/material';
import {
  Clock,
  CalendarDays,
  AlertTriangle,
} from 'lucide-react';
import { UsMarketSeasonInfo, ActiveTradingWindow } from '../../utils/usMarketTime';
import {
  MarketHolidayItem,
  UpcomingClosureCheck,
} from '../../utils/finnhubMarketHolidays';
import { TradingWindowsTab, MarketHolidaysTab } from './index';

export interface TradingNoteContentProps {
  closureCheck: UpcomingClosureCheck;
  activeTab: 'windows' | 'holidays';
  setActiveTab: (tab: 'windows' | 'holidays') => void;
  seasonInfo: UsMarketSeasonInfo;
  activeWindow: ActiveTradingWindow | null;
  formattedTimeStr: string;
  holidays: MarketHolidayItem[];
  holidaySource: 'finnhub' | 'fallback';
  isLoadingHolidays: boolean;
  onRefreshHolidays: (customKey?: string) => Promise<void>;
}

/**
 * คอมโพเนนต์แสดงเนื้อหาภายในของโน้ตเตือนสติ
 * 
 * @param props - ข้อมูลสถานะตลาด เวลา วันหยุด และฟังก์ชันสลับแท็บ
 * @returns JSX Element สำหรับเนื้อหาภายในโน้ต
 */
export const TradingNoteContent: React.FC<TradingNoteContentProps> = ({
  closureCheck,
  activeTab,
  setActiveTab,
  seasonInfo,
  activeWindow,
  formattedTimeStr,
  holidays,
  holidaySource,
  isLoadingHolidays,
  onRefreshHolidays,
}) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  return (
    <Box sx={{ p: 1.5 }}>
      {/* ⚠️ แบนเนอร์เตือนสติเมื่อ "วันถัดไป" หรือ "วันนี้" ตลาดปิดทำการ (รวมเสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์) */}
      {(closureCheck.isClosedToday || closureCheck.isClosedTomorrow) && (
        <Box
          sx={{
            mb: 1.25,
            p: 1.2,
            borderRadius: '10px',
            background: closureCheck.isClosedToday
              ? isLight
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.18) 100%)'
              : isLight
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(217, 119, 6, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(180, 83, 9, 0.18) 100%)',
            border: closureCheck.isClosedToday
              ? isLight ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(239, 68, 68, 0.45)'
              : isLight ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <Box
            sx={{
              p: 0.6,
              borderRadius: '50%',
              backgroundColor: closureCheck.isClosedToday
                ? isLight ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.25)'
                : isLight ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              mt: 0.1,
            }}
          >
            <AlertTriangle
              size={14}
              color={closureCheck.isClosedToday ? '#ef4444' : '#f59e0b'}
            />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{
                fontSize: '0.78rem',
                color: closureCheck.isClosedToday
                  ? isLight ? '#991b1b' : '#fca5a5'
                  : isLight ? '#92400e' : '#fde047',
                display: 'block',
                lineHeight: 1.35,
              }}
            >
              {closureCheck.reason}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                color: closureCheck.isClosedToday
                  ? isLight ? '#b91c1c' : '#f87171'
                  : isLight ? '#b45309' : '#fcd34d',
                display: 'block',
                mt: 0.25,
                fontWeight: 500,
                lineHeight: 1.35,
              }}
            >
              {closureCheck.adviceText}
            </Typography>
          </Box>
        </Box>
      )}

      {/* แถบสลับแท็บ (Tab Switcher: เวลาเข้าซื้อ vs ปฏิทินวันหยุด) */}
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          mb: 1.25,
          p: 0.4,
          borderRadius: '8px',
          backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
          border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Box
          onClick={() => setActiveTab('windows')}
          sx={{
            flex: 1,
            py: 0.5,
            px: 1,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.6,
            cursor: 'pointer',
            backgroundColor: activeTab === 'windows'
              ? isLight ? '#ffffff' : 'rgba(255,255,255,0.14)'
              : 'transparent',
            color: activeTab === 'windows'
              ? isLight ? '#0f172a' : '#ffffff'
              : 'text.secondary',
            boxShadow: activeTab === 'windows' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Clock size={12} color={activeTab === 'windows' ? '#10b981' : 'currentColor'} />
          <Typography variant="caption" fontWeight={activeTab === 'windows' ? 700 : 500} sx={{ fontSize: '0.7rem' }}>
            เวลาเข้าซื้อ
          </Typography>
        </Box>

        <Box
          onClick={() => setActiveTab('holidays')}
          sx={{
            flex: 1,
            py: 0.5,
            px: 1,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.6,
            cursor: 'pointer',
            backgroundColor: activeTab === 'holidays'
              ? isLight ? '#ffffff' : 'rgba(255,255,255,0.14)'
              : 'transparent',
            color: activeTab === 'holidays'
              ? isLight ? '#0f172a' : '#ffffff'
              : 'text.secondary',
            boxShadow: activeTab === 'holidays' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <CalendarDays size={12} color={activeTab === 'holidays' ? '#3b82f6' : 'currentColor'} />
          <Typography variant="caption" fontWeight={activeTab === 'holidays' ? 700 : 500} sx={{ fontSize: '0.7rem' }}>
            วันหยุดตลาด
          </Typography>
        </Box>
      </Stack>

      {/* แสดงเนื้อหาตามแท็บที่เลือก */}
      {activeTab === 'windows' ? (
        <TradingWindowsTab
          seasonInfo={seasonInfo}
          activeWindow={activeWindow}
          formattedTimeStr={formattedTimeStr}
        />
      ) : (
        <MarketHolidaysTab
          holidays={holidays}
          source={holidaySource}
          isLoading={isLoadingHolidays}
          onRefresh={onRefreshHolidays}
        />
      )}
    </Box>
  );
};

export default TradingNoteContent;
