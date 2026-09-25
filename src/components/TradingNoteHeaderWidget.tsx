/**
 * Component: TradingNoteHeaderWidget
 * วิดเจ็ตโน้ตเตือนสติตารางเวลาเข้าซื้อและวันหยุดตลาดหุ้นสหรัฐฯ
 * รองรับ 2 โหมดการใช้งาน:
 * 1. โหมดค่าเริ่มต้น (Docked Dropdown): กางลงมาจากแถบ AppBar ด้านบนข้างปุ่มสำรองข้อมูล
 * 2. โหมดหน้าต่างลอย (Floating Draggable Window): สามารถกดปุ่มแยกออกมาลากไปมาบนหน้าจอได้อย่างอิสระ
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Popover,
  useTheme,
} from '@mui/material';
import {
  ExternalLink,
  X,
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
import { TradingNoteContent, FloatingTradingNoteWindow } from './trading-note';

interface NotePosition {
  x: number;
  y: number;
}

const STORAGE_MODE_KEY = 'moneylust_trading_note_mode';
const STORAGE_POS_KEY = 'moneylust_trading_note_pos_v4';
const STORAGE_MINIMIZED_KEY = 'moneylust_trading_note_minimized';

/**
 * คอมโพเนนต์หลักสำหรับจัดการโน้ตเตือนสติ ทั้งในแถบ AppBar และแบบหน้าต่างลอย
 * 
 * @returns JSX Element สำหรับปุ่มบน Header และหน้าต่างโน้ต
 */
export const TradingNoteHeaderWidget: React.FC = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  // 1. โหมดการแสดงผล: 'docked' (ในแถบ Header Dropdown) หรือ 'floating' (หน้าต่างลอยบนจอ)
  const [mode, setMode] = useState<'docked' | 'floating'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MODE_KEY);
      return saved === 'floating' ? 'floating' : 'docked';
    } catch {
      return 'docked';
    }
  });

  // สถานะเปิด/ปิด Dropdown ในโหมด Docked
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isDropdownOpen = Boolean(anchorEl);

  // แท็บปัจจุบัน: 'windows' (ตารางเวลาเข้าซื้อ) หรือ 'holidays' (ปฏิทินวันหยุด)
  const [activeTab, setActiveTab] = useState<'windows' | 'holidays'>('windows');

  // ข้อมูลวันหยุดตลาดหุ้นสหรัฐฯ
  const [holidays, setHolidays] = useState<MarketHolidayItem[]>([]);
  const [holidaySource, setHolidaySource] = useState<'finnhub' | 'fallback'>('fallback');
  const [isLoadingHolidays, setIsLoadingHolidays] = useState<boolean>(false);

  // สถานะตำแหน่งการ์ดในโหมดลอย
  const [position, setPosition] = useState<NotePosition>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_POS_KEY);
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

  // ข้อมูลฤดูกาลและเวลาเปิดปิดของตลาดสหรัฐฯ
  const seasonInfo = useMemo(() => getUsMarketSeasonInfo(currentTime), [
    currentTime.getDate(),
    currentTime.getMonth(),
    currentTime.getFullYear(),
  ]);

  // ตรวจสอบว่าเวลาปัจจุบันตรงกับช่วงเวลาเข้าซื้อหรือไม่
  const activeWindow = checkActiveTradingWindow(currentTime, seasonInfo);
  const formattedTimeStr = currentTime.toLocaleTimeString('th-TH', { hour12: false });

  // ตรวจสอบวันปิดทำการตลาดหุ้นสหรัฐฯ
  const closureCheck: UpcomingClosureCheck = useMemo(
    () => checkUpcomingMarketClosure(currentTime, holidays),
    [currentTime.getDate(), holidays]
  );

  /**
   * สลับโหมดเป็น 'floating' (แยกหน้าต่างลอย)
   */
  const handlePopOut = () => {
    setAnchorEl(null);
    setMode('floating');
    try {
      localStorage.setItem(STORAGE_MODE_KEY, 'floating');
    } catch (e) {
      console.warn('Could not save note mode:', e);
    }
  };

  /**
   * สลับโหมดเป็น 'docked' (ยึดกลับเข้าแถบ Header)
   */
  const handleDockBack = () => {
    setMode('docked');
    try {
      localStorage.setItem(STORAGE_MODE_KEY, 'docked');
    } catch (e) {
      console.warn('Could not save note mode:', e);
    }
  };

  /**
   * บันทึกตำแหน่งหน้าต่างลอย
   */
  const savePosition = useCallback((newPos: NotePosition) => {
    setPosition(newPos);
    try {
      localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(newPos));
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
    const defaultX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 415) : 100;
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

  // จัดการการลากหน้าต่าง
  useEffect(() => {
    if (!isDragging || mode !== 'floating') return;

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
        localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(position));
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
  }, [isDragging, isMinimized, position, mode]);

  // จุดแสดงสถานะตลาด (Status Indicator Color)
  const statusDotColor = useMemo(() => {
    if (closureCheck.isClosedToday) return '#ef4444'; // แดง
    if (closureCheck.isClosedTomorrow) return '#f59e0b'; // ส้ม
    if (activeWindow?.isHot) return '#10b981'; // เขียวสด (ช่วงเข้าซื้อที่ดีที่สุด)
    if (seasonInfo.isMarketOpenNow) return '#34d399'; // เขียวอ่อน
    return '#94a3b8'; // เทา (ตลาดปิด)
  }, [closureCheck, activeWindow, seasonInfo]);

  return (
    <>
      {/* 1. ปุ่มไอคอนบน Header (AppBar) */}
      <Tooltip
        title={
          mode === 'floating'
            ? 'โน้ตเตือนสติตารางเวลาเข้าซื้อ (กำลังแสดงหน้าต่างลอยบนจอ - คลิกเพื่อยึดกลับเข้า Header)'
            : 'โน้ตเตือนสติตารางเวลาเข้าซื้อ & วันหยุดตลาด (คลิกเพื่อเปิด)'
        }
        arrow
      >
        <IconButton
          onClick={(e) => {
            if (mode === 'floating') {
              // ถ้าลอยอยู่ คลิกเพื่อยึดกลับเข้า Header
              handleDockBack();
            } else {
              // ถ้า docked อยู่ คลิกเพื่อเปิด/ปิด Dropdown
              setAnchorEl(anchorEl ? null : e.currentTarget);
            }
          }}
          color="inherit"
          sx={{
            p: 1,
            borderRadius: 2,
            transition: 'all 0.2s',
            position: 'relative',
            backgroundColor: mode === 'floating'
              ? isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.2)'
              : 'transparent',
            '&:hover': {
              backgroundColor: isLight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.18)',
            },
          }}
        >
          {/* หมุดกระดาษสีแดงแท้ๆ ไม่มีกรอบ */}
          <Typography
            component="span"
            sx={{
              fontSize: '1.15rem',
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))',
              transform: 'rotate(-5deg)',
              userSelect: 'none',
            }}
          >
            📌
          </Typography>

          {/* จุดไฟสถานะตลาด (Status Dot) */}
          <Box
            sx={{
              position: 'absolute',
              top: 5,
              right: 5,
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: statusDotColor,
              boxShadow: `0 0 6px ${statusDotColor}`,
            }}
          />
        </IconButton>
      </Tooltip>

      {/* 2. หน้าต่าง Dropdown ในโหมด Docked (เปิดชิดขวาจอ) */}
      <Popover
        open={mode === 'docked' && isDropdownOpen}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorReference="anchorPosition"
        anchorPosition={{
          top: typeof window !== 'undefined' && window.innerWidth < 600 ? 64 : 72,
          left: typeof window !== 'undefined'
            ? window.innerWidth - (window.innerWidth < 600 ? 12 : 20)
            : 1000,
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: { xs: 340, sm: 390 },
            maxWidth: 'calc(100vw - 24px)',
            borderRadius: '16px',
            background: isLight
              ? 'linear-gradient(135deg, rgba(255, 253, 240, 0.95) 0%, rgba(254, 249, 215, 0.92) 100%)'
              : 'linear-gradient(135deg, rgba(24, 24, 27, 0.95) 0%, rgba(15, 23, 42, 0.96) 100%)',
            backdropFilter: 'blur(16px)',
            border: isLight ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(245, 158, 11, 0.25)',
            boxShadow: isLight
              ? '0 12px 32px rgba(217, 119, 6, 0.15), 0 4px 12px rgba(0,0,0,0.06)'
              : '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 158, 11, 0.12)',
            overflow: 'hidden',
          },
        }}
      >
        {/* แถบหัว Dropdown */}
        <Box
          sx={{
            px: 1.5,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isLight
              ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)'
              : 'linear-gradient(90deg, rgba(245, 158, 11, 0.2) 0%, rgba(16, 185, 129, 0.12) 100%)',
            borderBottom: isLight ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Typography component="span" sx={{ fontSize: '1.05rem', lineHeight: 1, transform: 'rotate(-5deg)' }}>
              📌
            </Typography>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{
                fontFamily: 'Prompt',
                fontSize: '0.82rem',
                color: isLight ? '#92400e' : '#fef08a',
              }}
            >
              โน้ตเตือนสติตารางเวลาเข้าซื้อ
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={0.5}>
            {/* ปุ่มแยกหน้าต่างลอย (Pop-out / Float) */}
            <Tooltip title="แยกออกเป็นหน้าต่างลอยบนจอ (สามารถลากไปมาได้)" arrow placement="top">
              <IconButton
                size="small"
                onClick={handlePopOut}
                sx={{
                  p: 0.5,
                  color: isLight ? '#78350f' : '#fef3c7',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
                }}
              >
                <ExternalLink size={14} />
              </IconButton>
            </Tooltip>

            {/* ปุ่มปิด */}
            <IconButton
              size="small"
              onClick={() => setAnchorEl(null)}
              sx={{
                p: 0.5,
                color: isLight ? '#78350f' : '#fef3c7',
                opacity: 0.7,
                '&:hover': { opacity: 1 },
              }}
            >
              <X size={15} />
            </IconButton>
          </Stack>
        </Box>

        {/* เนื้อหาใน Dropdown */}
        <TradingNoteContent
          closureCheck={closureCheck}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          seasonInfo={seasonInfo}
          activeWindow={activeWindow}
          formattedTimeStr={formattedTimeStr}
          holidays={holidays}
          holidaySource={holidaySource}
          isLoadingHolidays={isLoadingHolidays}
          onRefreshHolidays={loadHolidays}
        />
      </Popover>

      {/* 3. หน้าต่างลอยบนจอในโหมด Floating */}
      {mode === 'floating' && (
        <FloatingTradingNoteWindow
          position={position}
          isDragging={isDragging}
          isMinimized={isMinimized}
          activeWindow={activeWindow}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onDockBack={handleDockBack}
          onResetPosition={handleResetPosition}
          onToggleMinimized={toggleMinimized}
        >
          <TradingNoteContent
            closureCheck={closureCheck}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            seasonInfo={seasonInfo}
            activeWindow={activeWindow}
            formattedTimeStr={formattedTimeStr}
            holidays={holidays}
            holidaySource={holidaySource}
            isLoadingHolidays={isLoadingHolidays}
            onRefreshHolidays={loadHolidays}
          />
        </FloatingTradingNoteWindow>
      )}
    </>
  );
};

export default TradingNoteHeaderWidget;
