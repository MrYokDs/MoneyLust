/**
 * Component: MarketHolidaysTab
 * แสดงรายการวันหยุดและวันปิดทำการของตลาดหุ้นสหรัฐฯ (NYSE/NASDAQ) ประจำปีปัจจุบัน
 * ดึงข้อมูลจาก Finnhub API พร้อมระบุวันที่ในเวลาประเทศไทย
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Button,
  Popover,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Calendar,
  RefreshCw,
  Key,
  CalendarDays,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  MarketHolidayItem,
  saveFinnhubApiKey,
  getStoredFinnhubApiKey,
} from '../../utils/finnhubMarketHolidays';

interface MarketHolidaysTabProps {
  holidays: MarketHolidayItem[];
  source: 'finnhub' | 'fallback';
  isLoading: boolean;
  onRefresh: (customKey?: string) => Promise<void>;
}

/**
 * แท็บที่ 2: แสดงปฏิทินวันหยุดตลาดหุ้นสหรัฐฯ (เทียบเวลาไทย) จาก Finnhub API
 * 
 * @param props - คุณสมบัติที่ส่งเข้ามาประกอบด้วย holidays, source, isLoading, onRefresh
 * @returns JSX Element สำหรับแสดงเนื้อหาปฏิทินวันหยุด
 */
export const MarketHolidaysTab: React.FC<MarketHolidaysTabProps> = ({
  holidays,
  source,
  isLoading,
  onRefresh,
}) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const currentYear = new Date().getFullYear();

  // ตัวกรอง: 'upcoming' (ที่กำลังจะมาถึง) หรือ 'all' (ทั้งหมดของปี)
  const [filterMode, setFilterMode] = useState<'upcoming' | 'all'>('upcoming');

  // จัดการ Popover สำหรับตั้งค่า Finnhub API Key
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [inputKey, setInputKey] = useState<string>(() => getStoredFinnhubApiKey());

  const handleOpenKeySettings = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setInputKey(getStoredFinnhubApiKey());
  };

  const handleCloseKeySettings = () => {
    setAnchorEl(null);
  };

  const handleSaveKey = async () => {
    saveFinnhubApiKey(inputKey);
    handleCloseKeySettings();
    await onRefresh(inputKey);
  };

  // กรองวันหยุด
  const todayStr = new Date().toISOString().split('T')[0];
  const displayedHolidays = filterMode === 'upcoming'
    ? holidays.filter((h) => h.atDate >= todayStr)
    : holidays;

  return (
    <Box>
      {/* แถบหัวข้อมูลสถานะ API & ตัวกรอง */}
      <Box
        sx={{
          mb: 1.25,
          p: 1,
          borderRadius: '8px',
          background: isLight
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
          border: isLight ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(59, 130, 246, 0.25)',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={0.6}>
            <CalendarDays size={14} color="#3b82f6" />
            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.73rem', color: isLight ? '#1e3a8a' : '#bfdbfe' }}>
              ปฏิทินวันหยุดตลาดหุ้นสหรัฐฯ ({currentYear})
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Tooltip title={source === 'finnhub' ? 'ดึงสดจาก Finnhub API' : 'โหมดปฏิทินมาตรฐานสหรัฐฯ (Auto-calculated)'} arrow>
              <Chip
                icon={source === 'finnhub' ? <Zap size={11} color="#3b82f6" /> : <ShieldCheck size={11} color="#10b981" />}
                label={source === 'finnhub' ? 'Finnhub Live' : 'มาตรฐาน US'}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  backgroundColor: source === 'finnhub'
                    ? isLight ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.25)'
                    : isLight ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.25)',
                  color: source === 'finnhub' ? '#2563eb' : '#10b981',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              />
            </Tooltip>

            <Tooltip title="ตั้งค่า Finnhub API Key" arrow>
              <IconButton size="small" onClick={handleOpenKeySettings} sx={{ p: 0.3, color: 'text.secondary' }}>
                <Key size={12} />
              </IconButton>
            </Tooltip>

            <Tooltip title="รีเฟรชข้อมูล" arrow>
              <IconButton size="small" onClick={() => onRefresh()} disabled={isLoading} sx={{ p: 0.3, color: 'text.secondary' }}>
                {isLoading ? <CircularProgress size={12} /> : <RefreshCw size={12} />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* ปุ่มสลับตัวกรองวันหยุด */}
        <Stack direction="row" spacing={0.75} mt={0.8}>
          <Chip
            label={`ที่กำลังจะมาถึง (${holidays.filter((h) => h.atDate >= todayStr).length})`}
            size="small"
            onClick={() => setFilterMode('upcoming')}
            sx={{
              height: 20,
              fontSize: '0.62rem',
              fontWeight: filterMode === 'upcoming' ? 700 : 500,
              cursor: 'pointer',
              backgroundColor: filterMode === 'upcoming'
                ? isLight ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.35)'
                : 'transparent',
              color: filterMode === 'upcoming' ? '#2563eb' : 'text.secondary',
              border: filterMode === 'upcoming' ? '1px solid #3b82f6' : '1px solid rgba(100, 116, 139, 0.2)',
            }}
          />
          <Chip
            label={`ทั้งหมดของปี (${holidays.length})`}
            size="small"
            onClick={() => setFilterMode('all')}
            sx={{
              height: 20,
              fontSize: '0.62rem',
              fontWeight: filterMode === 'all' ? 700 : 500,
              cursor: 'pointer',
              backgroundColor: filterMode === 'all'
                ? isLight ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.35)'
                : 'transparent',
              color: filterMode === 'all' ? '#2563eb' : 'text.secondary',
              border: filterMode === 'all' ? '1px solid #3b82f6' : '1px solid rgba(100, 116, 139, 0.2)',
            }}
          />
        </Stack>
      </Box>

      {/* รายการวันหยุดของตลาดหุ้นสหรัฐฯ */}
      <Box sx={{ maxHeight: 220, overflowY: 'auto', pr: 0.5, '::-webkit-scrollbar': { width: 4 } }}>
        <Stack spacing={0.8}>
          {displayedHolidays.length === 0 ? (
            <Box sx={{ py: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                ไม่มีวันหยุดที่กำลังจะมาถึงในปีนี้แล้ว
              </Typography>
            </Box>
          ) : (
            displayedHolidays.map((item, idx) => {
              const isPast = item.atDate < todayStr;
              return (
                <Box
                  key={`${item.atDate}-${idx}`}
                  sx={{
                    p: 0.9,
                    borderRadius: '8px',
                    opacity: isPast ? 0.6 : 1,
                    backgroundColor: isPast
                      ? isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)'
                      : isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.04)',
                    border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flex: 1, mr: 1 }}>
                    <Calendar
                      size={15}
                      color={
                        item.isBankHolidayOnly
                          ? '#3b82f6'
                          : item.isClosedAllDay
                            ? '#ef4444'
                            : '#f59e0b'
                      }
                      style={{ flexShrink: 0 }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        sx={{
                          fontSize: '0.75rem',
                          color: isLight ? '#0f172a' : '#f8fafc',
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.eventNameTh}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: item.isBankHolidayOnly
                            ? isLight ? '#1d4ed8' : '#93c5fd'
                            : item.isClosedAllDay
                              ? isLight ? '#b91c1c' : '#f87171'
                              : isLight ? '#b45309' : '#fbbf24',
                          fontSize: '0.67rem',
                          display: 'block',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                        }}
                      >
                        {item.thaiDateStr}
                      </Typography>
                    </Box>
                  </Stack>

                  <Chip
                    label={
                      item.isBankHolidayOnly
                        ? 'ธนาคารหยุด (ตลาดเปิด)'
                        : item.isClosedAllDay
                          ? 'ปิดเต็มวัน'
                          : 'ปิดเร็ว (Early)'
                    }
                    size="small"
                    sx={{
                      flexShrink: 0,
                      height: 18,
                      fontSize: '0.58rem',
                      fontWeight: 700,
                      backgroundColor: item.isBankHolidayOnly
                        ? isLight ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.22)'
                        : item.isClosedAllDay
                          ? isLight ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.22)'
                          : isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.25)',
                      color: item.isBankHolidayOnly
                        ? '#2563eb'
                        : item.isClosedAllDay
                          ? '#ef4444'
                          : '#f59e0b',
                      border: item.isBankHolidayOnly
                        ? '1px solid rgba(59, 130, 246, 0.3)'
                        : item.isClosedAllDay
                          ? '1px solid rgba(239, 68, 68, 0.3)'
                          : '1px solid rgba(245, 158, 11, 0.3)',
                    }}
                  />
                </Box>
              );
            })
          )}
        </Stack>
      </Box>

      {/* หมายเหตุท้ายตาราง */}
      <Box sx={{ mt: 1, pt: 0.8, borderTop: isLight ? '1px dashed rgba(0,0,0,0.08)' : '1px dashed rgba(255,255,255,0.08)' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.63rem', display: 'block', lineHeight: 1.3 }}>
          *วันที่ภาษาไทยเทียบกับเวลาเปิดของรอบคืนนั้นตามเวลาประเทศไทย (ปิดเต็มวัน = ตลาดหุ้นงดทำการทั้งคืน, ธนาคารหยุด = ตลาดหุ้นเปิดปกติ)
        </Typography>
      </Box>

      {/* Popover สำหรับตั้งค่า Finnhub API Key */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseKeySettings}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            p: 1.5,
            width: 280,
            borderRadius: '10px',
            backgroundColor: isLight ? '#ffffff' : '#18181b',
            border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          },
        }}
      >
        <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem', display: 'block', mb: 0.5 }}>
          🔑 Finnhub API Token (ไม่บังคับ)
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', display: 'block', mb: 1 }}>
          สมัครฟรีได้ที่ finnhub.io เพื่อดึงวันหยุดสด (หากไม่กรอก ระบบจะใช้ปฏิทินคำนวณอัตโนมัติ)
        </Typography>
        <TextField
          size="small"
          placeholder="วาง API Token ที่นี่"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          fullWidth
          sx={{ mb: 1, '& input': { fontSize: '0.72rem', py: 0.6 } }}
        />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button size="small" onClick={handleCloseKeySettings} sx={{ fontSize: '0.65rem', py: 0.2 }}>
            ยกเลิก
          </Button>
          <Button size="small" variant="contained" onClick={handleSaveKey} sx={{ fontSize: '0.65rem', py: 0.2 }}>
            บันทึก
          </Button>
        </Stack>
      </Popover>
    </Box>
  );
};

export default MarketHolidaysTab;
