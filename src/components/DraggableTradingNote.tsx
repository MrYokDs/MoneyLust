/**
 * Component: DraggableTradingNote (วิดเจ็ตกระดาษโน้ตเตือนสติตารางเวลาเข้าซื้อแบบลากได้อิสระ แสดงผลทุกหน้า)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  useTheme,
  Collapse,
} from '@mui/material';
import {
  Pin,
  Minimize2,
  Maximize2,
  Clock,
  RotateCcw,
  Sparkles,
  GripHorizontal,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface NotePosition {
  x: number;
  y: number;
}

const STORAGE_KEY = 'moneylust_trading_note_pos_v2';
const STORAGE_MINIMIZED_KEY = 'moneylust_trading_note_minimized';

/**
 * คอมโพเนนต์กระดาษโน้ตเตือนสตินักเทรด (Global Draggable Trading Sticky Note)
 * แสดงช่วงเวลาที่เหมาะสมแก่การเข้าซื้อที่สุด สามารถใช้เมาส์ลากไปมาบนหน้าจอได้อย่างอิสระทุกหน้า
 * พร้อมฟังก์ชันย่อ/ขยาย และระบบตรวจสอบเวลาจริง (Live Window Alert)
 * 
 * @returns JSX Element สำหรับวิดเจ็ตกระดาษโน้ตแบบลากได้ระดับ Global
 */
export const DraggableTradingNote: React.FC = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

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
    const defaultX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 340) : 100;
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    const defaultX = Math.max(20, window.innerWidth - 340);
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
      const cardWidth = isMinimized ? 180 : 320;
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
        const cardWidth = isMinimized ? 180 : 320;
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

  const checkActiveWindow = (date: Date): { text: string; isHot: boolean } | null => {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    if ((hours === 3 || hours === 15) && minutes >= 0 && minutes <= 5) {
      return { text: '⚡ ช่วงเวลาเข้าซื้อที่ดีที่สุด (Window 1)', isHot: true };
    }
    if ((hours === 3 || hours === 15) && minutes >= 25 && minutes <= 30) {
      return { text: '📉 ขาลง: จังหวะเข้าซื้อ (Window 2)', isHot: true };
    }
    if ((hours === 4 || hours === 16) && minutes >= 25 && minutes <= 30) {
      return { text: '📉 ขาลง: จังหวะเข้าซื้อ (Window 3)', isHot: true };
    }
    return null;
  };

  const activeWindow = checkActiveWindow(currentTime);
  const formattedTimeStr = currentTime.toLocaleTimeString('th-TH', { hour12: false });

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
          width: isMinimized ? 'auto' : { xs: 290, sm: 320 },
          borderRadius: '14px',
          background: isLight
            ? 'linear-gradient(135deg, rgba(255, 253, 240, 0.92) 0%, rgba(254, 249, 215, 0.88) 100%)'
            : 'linear-gradient(135deg, rgba(24, 24, 27, 0.88) 0%, rgba(15, 23, 42, 0.92) 100%)',
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
        {/* แถบหัวโน้ต (Draggable Header Bar) */}
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
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                borderRadius: '6px',
                background: isLight ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.25)',
                color: isLight ? '#b45309' : '#fbbf24',
              }}
            >
              <Pin size={13} style={{ transform: 'rotate(-45deg)' }} />
            </Box>
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
                gap: 0.5,
              }}
            >
              📌 โน้ตเตือนสติการเข้าซื้อ
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
                  label="เฝ้าระวังจังหวะ"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    backgroundColor: isLight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.2)',
                    color: isLight ? '#b45309' : '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                />
              </Stack>
            )}

            {/* รายการช่วงเวลาเข้าซื้อที่กำหนด */}
            <Stack spacing={0.9}>
              {/* ช่วงที่ 1: 03:00 - 03:05 */}
              <Box
                sx={{
                  p: 1,
                  borderRadius: '8px',
                  backgroundColor: isLight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.04)',
                  border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.07)',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CheckCircle2 size={15} color="#10b981" />
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{
                        fontSize: '0.82rem',
                        color: isLight ? '#065f46' : '#34d399',
                        fontFamily: 'monospace',
                      }}
                    >
                      3:00 - 3:05
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', display: 'block' }}>
                      จังหวะเข้าซื้อที่ดีที่สุด (Primary Entry)
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  label="Best Time"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                />
              </Box>

              {/* ช่วงที่ 2: 3:25 - 3:30 (ถ้ากราฟเป็นขาลง) */}
              <Box
                sx={{
                  p: 1,
                  borderRadius: '8px',
                  backgroundColor: isLight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.04)',
                  border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.07)',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TrendingDown size={15} color="#f59e0b" />
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{
                        fontSize: '0.82rem',
                        color: isLight ? '#92400e' : '#fbbf24',
                        fontFamily: 'monospace',
                      }}
                    >
                      3:25 - 3:30
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', display: 'block' }}>
                      เฉพาะเมื่อกราฟเป็นขาลง
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  label="Downtrend"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                />
              </Box>

              {/* ช่วงที่ 3: 4:25 - 4:30 (ถ้ากราฟเป็นขาลง) */}
              <Box
                sx={{
                  p: 1,
                  borderRadius: '8px',
                  backgroundColor: isLight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.04)',
                  border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.07)',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TrendingDown size={15} color="#f59e0b" />
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{
                        fontSize: '0.82rem',
                        color: isLight ? '#92400e' : '#fbbf24',
                        fontFamily: 'monospace',
                      }}
                    >
                      4:25 - 4:30
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', display: 'block' }}>
                      เฉพาะเมื่อกราฟเป็นขาลง
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  label="Downtrend"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                />
              </Box>
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
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.67rem',
                  lineHeight: 1.35,
                  fontStyle: 'italic',
                }}
              >
                💡 เตือนใจ: รอรอบเวลาแท่งเทียน อย่ารีบเข้าซื้อก่อนเวลา คุมอารมณ์และแผนการแบ่งไม้เสมอ
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

export default DraggableTradingNote;
