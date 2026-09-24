/**
 * Component: DraggableTradingNote (วิดเจ็ตกระดาษโน้ตเตือนสติตารางเวลาเข้าซื้อแบบลากได้อิสระ แสดงผลทุกหน้า)
 * พร้อมระบบแท็บสลับดูปฏิทินวันหยุดตลาดหุ้นสหรัฐฯ (Finnhub API) และระบบแจ้งเตือนไม่ควรเทรดเมื่อวันถัดไปตลาดปิด
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  useTheme,
  Collapse,
} from '@mui/material';
import {
  Minimize2,
  Maximize2,
  RotateCcw,
  GripHorizontal,
  Clock,
  CalendarDays,
  AlertTriangle,
} from 'lucide-react';
import {
  getUsMarketSeasonInfo,
  checkActiveTradingWindow,
} from '../utils/usMarketTime';
import {
  fetchFinnhubHolidays,
  checkUpcomingMarketClosure,
  MarketHolidayItem,
  UpcomingClosureCheck,
} from '../utils/finnhubMarketHolidays';
import { TradingWindowsTab, MarketHolidaysTab } from './trading-note';

interface NotePosition {
  x: number;
  y: number;
}

const STORAGE_KEY = 'moneylust_trading_note_pos_v4';
const STORAGE_MINIMIZED_KEY = 'moneylust_trading_note_minimized';

/**
 * คอมโพเนนต์กระดาษโน้ตเตือนสตินักเทรด (Global Draggable Trading Sticky Note)
 * แสดงช่วงเวลาที่เหมาะสมแก่การเข้าซื้อที่สุด สามารถใช้เมาส์ลากไปมาบนหน้าจอได้อย่างอิสระทุกหน้า
 * พร้อมระบบแท็บสลับดูปฏิทินวันหยุดตลาดหุ้นสหรัฐฯ และระบบแจ้งเตือนเมื่อวันถัดไปตลาดปิด
 * 
 * @returns JSX Element สำหรับวิดเจ็ตกระดาษโน้ตแบบลากได้ระดับ Global
 */
export const DraggableTradingNote: React.FC = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  // แท็บปัจจุบัน: 'windows' (ตารางเวลาเข้าซื้อ) หรือ 'holidays' (ปฏิทินวันหยุด)
  const [activeTab, setActiveTab] = useState<'windows' | 'holidays'>('windows');

  // ข้อมูลวันหยุดตลาดหุ้นสหรัฐฯ
  const [holidays, setHolidays] = useState<MarketHolidayItem[]>([]);
  const [holidaySource, setHolidaySource] = useState<'finnhub' | 'fallback'>('fallback');
  const [isLoadingHolidays, setIsLoadingHolidays] = useState<boolean>(false);

  // สถานะตำแหน่งการ์ด (ค่าเริ่มต้น: มุมขวาบน)
  const [position, setPosition] = useState<NotePosition>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved note position:', e);
    }
    const defaultX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 415) : 100;
    const defaultY = 85;
    return { x: defaultX, y: defaultY };
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_MINIMIZED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // เดินเวลานาฬิกาทุก 1 วินาที
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // โหลดข้อมูลวันหยุดเมื่อ Component Mount
  const loadHolidays = useCallback(async (customToken?: string) => {
    setIsLoadingHolidays(true);
    try {
      const result = await fetchFinnhubHolidays(customToken);
      setHolidays(result.data);
      setHolidaySource(result.source);
    } catch (err) {
      console.warn('Error loading holidays:', err);
    } finally {
      setIsLoadingHolidays(false);
    }
  }, []);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const savePosition = useCallback((newPos: NotePosition) => {
    setPosition(newPos);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPos));
    } catch (e) {
      console.warn('Could not save note position:', e);
    }
  }, []);

  const toggleMinimized = () => {
    const nextState = !isMinimized;
    setIsMinimized(nextState);
    try {
      localStorage.setItem(STORAGE_MINIMIZED_KEY, String(nextState));
    } catch (e) {
      console.warn('Could not save note minimized state:', e);
    }
  };

  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultX = Math.max(20, window.innerWidth - 415);
    const defaultY = 85;
    savePosition({ x: defaultX, y: defaultY });
  };

  const handleStartDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragOffsetRef.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    handleStartDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const cardWidth = 390;
      const cardHeight = isMinimized ? 44 : 260;
      const maxX = Math.max(10, window.innerWidth - cardWidth - 10);
      const maxY = Math.max(10, window.innerHeight - cardHeight - 10);
      const rawX = e.clientX - dragOffsetRef.current.x;
      const rawY = e.clientY - dragOffsetRef.current.y;
      setPosition({
        x: Math.max(10, Math.min(maxX, rawX)),
        y: Math.max(10, Math.min(maxY, rawY)),
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const cardWidth = 390;
        const cardHeight = isMinimized ? 44 : 260;
        const maxX = Math.max(10, window.innerWidth - cardWidth - 10);
        const maxY = Math.max(10, window.innerHeight - cardHeight - 10);
        const rawX = touch.clientX - dragOffsetRef.current.x;
        const rawY = touch.clientY - dragOffsetRef.current.y;
        setPosition({
          x: Math.max(10, Math.min(maxX, rawX)),
          y: Math.max(10, Math.min(maxY, rawY)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
      } catch (e) {
        console.warn('Could not save note position:', e);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, isMinimized, position]);

  // ข้อมูลฤดูกาลและเวลาเปิดปิดของตลาดสหรัฐฯ ตามช่วงเดือนปัจจุบัน (DST vs Standard)
  const seasonInfo = useMemo(() => getUsMarketSeasonInfo(currentTime), [
    currentTime.getDate(),
    currentTime.getMonth(),
    currentTime.getFullYear(),
  ]);

  // ตรวจสอบว่าเวลาปัจจุบันตรงกับช่วงเวลาเข้าซื้อหรือไม่
  const activeWindow = checkActiveTradingWindow(currentTime, seasonInfo);
  const formattedTimeStr = currentTime.toLocaleTimeString('th-TH', { hour12: false });

  // ตรวจสอบวันปิดทำการตลาดหุ้นสหรัฐฯ (วันนี้ / พรุ่งนี้ / เสาร์-อาทิตย์ / วันหยุดนักขัตฤกษ์)
  const closureCheck: UpcomingClosureCheck = useMemo(
    () => checkUpcomingMarketClosure(currentTime, holidays),
    [currentTime.getDate(), holidays]
  );

  return (
    <Box
      sx={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1300,
        userSelect: isDragging ? 'none' : 'auto',
        touchAction: 'none',
        transition: isDragging ? 'none' : 'transform 0.15s ease, box-shadow 0.2s ease',
      }}
    >
      <Box
        sx={{
          width: { xs: 340, sm: 390 },
          maxWidth: 'calc(100vw - 20px)',
          borderRadius: '14px',
          background: isLight
            ? 'linear-gradient(135deg, rgba(255, 253, 240, 0.94) 0%, rgba(254, 249, 215, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(24, 24, 27, 0.9) 0%, rgba(15, 23, 42, 0.94) 100%)',
          backdropFilter: 'blur(16px)',
          border: isLight
            ? activeWindow?.isHot
              ? '1.5px solid #10b981'
              : '1px solid rgba(245, 158, 11, 0.4)'
            : activeWindow?.isHot
              ? '1.5px solid #10b981'
              : '1px solid rgba(245, 158, 11, 0.35)',
          boxShadow: isLight
            ? activeWindow?.isHot
              ? '0 8px 32px rgba(16, 185, 129, 0.25), 0 2px 10px rgba(0,0,0,0.06)'
              : '0 8px 30px rgba(217, 119, 6, 0.15), 0 2px 8px rgba(0,0,0,0.04)'
            : activeWindow?.isHot
              ? '0 10px 36px rgba(16, 185, 129, 0.35), 0 2px 12px rgba(0,0,0,0.6)'
              : '0 10px 36px rgba(0, 0, 0, 0.5), 0 0 16px rgba(245, 158, 11, 0.12)',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'default',
        }}
      >
        {/* แถบหัวโน้ต (Draggable Header Bar) พร้อมหมุดสีแดงตัวจริงด้านซ้ายสุด */}
        <Box
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          sx={{
            px: 1.5,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: isDragging ? 'grabbing' : 'grab',
            background: isLight
              ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)'
              : 'linear-gradient(90deg, rgba(245, 158, 11, 0.2) 0%, rgba(16, 185, 129, 0.12) 100%)',
            borderBottom: isMinimized
              ? 'none'
              : isLight
                ? '1px solid rgba(245, 158, 11, 0.2)'
                : '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.75}>
            {/* หมุดกระดาษสีแดงแท้ๆ ไม่มีกรอบ (Authentic Red Pushpin) */}
            <Typography
              component="span"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))',
                transform: 'rotate(-5deg)',
                userSelect: 'none',
              }}
            >
              📌
            </Typography>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{
                fontFamily: 'Prompt',
                fontSize: '0.8rem',
                color: isLight ? '#92400e' : '#fef08a',
                letterSpacing: '-0.2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              โน้ตเตือนสติการเข้าซื้อ
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={0.25}>
            <Tooltip title="รีเซ็ตตำแหน่งกลับมุมขวาบน" arrow placement="top">
              <IconButton
                size="small"
                onClick={handleResetPosition}
                sx={{
                  p: 0.4,
                  color: isLight ? '#78350f' : '#fef3c7',
                  opacity: 0.7,
                  '&:hover': { opacity: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
                }}
              >
                <RotateCcw size={12} />
              </IconButton>
            </Tooltip>

            <Tooltip title={isMinimized ? 'ขยายกระดาษโน้ต' : 'ย่อขนาด'} arrow placement="top">
              <IconButton
                size="small"
                onClick={toggleMinimized}
                sx={{
                  p: 0.4,
                  color: isLight ? '#78350f' : '#fef3c7',
                  opacity: 0.8,
                  '&:hover': { opacity: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
                }}
              >
                {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              </IconButton>
            </Tooltip>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: isLight ? '#b45309' : '#a1a1aa',
                opacity: 0.6,
                ml: 0.5,
                cursor: 'grab',
              }}
            >
              <GripHorizontal size={14} />
            </Box>
          </Stack>
        </Box>

        {/* เนื้อหากระดาษโน้ต */}
        <Collapse in={!isMinimized} timeout={200}>
          <Box sx={{ p: 1.5 }}>
            {/* ⚠️ แบนเนอร์เตือนสติอัจฉริยะเมื่อ "วันถัดไป" หรือ "วันนี้" ตลาดปิดทำการ (รวมเสาร์-อาทิตย์) */}
            {(closureCheck.isClosedToday || closureCheck.isClosedTomorrow) && (
              <Box
                sx={{
                  mb: 1.25,
                  p: 1,
                  borderRadius: '8px',
                  background: closureCheck.isClosedToday
                    ? isLight
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%)'
                      : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.2) 100%)'
                    : isLight
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(217, 119, 6, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(180, 83, 9, 0.2) 100%)',
                  border: closureCheck.isClosedToday
                    ? '1.5px solid rgba(239, 68, 68, 0.4)'
                    : '1.5px solid rgba(245, 158, 11, 0.45)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 0.8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <AlertTriangle
                  size={16}
                  color={closureCheck.isClosedToday ? '#ef4444' : '#f59e0b'}
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    sx={{
                      fontSize: '0.74rem',
                      color: closureCheck.isClosedToday
                        ? isLight ? '#991b1b' : '#fca5a5'
                        : isLight ? '#92400e' : '#fde047',
                      display: 'block',
                      lineHeight: 1.3,
                    }}
                  >
                    {closureCheck.reason}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.67rem',
                      color: closureCheck.isClosedToday
                        ? isLight ? '#b91c1c' : '#f87171'
                        : isLight ? '#b45309' : '#fcd34d',
                      display: 'block',
                      mt: 0.3,
                      fontWeight: 600,
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
                onRefresh={loadHolidays}
              />
            )}
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

export default DraggableTradingNote;
