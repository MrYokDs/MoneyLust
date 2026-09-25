/**
 * Component: FloatingTradingNoteWindow
 * หน้าต่างกระดาษโน้ตแบบลากได้อิสระบนหน้าจอ (Floating Draggable Window)
 * มีปุ่มยึดกลับเข้า Header, ปุ่มรีเซ็ตตำแหน่ง, ปุ่มย่อ/ขยาย และด้ามจับลาก
 */

import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Collapse,
  useTheme,
} from '@mui/material';
import {
  Minimize2,
  Maximize2,
  RotateCcw,
  GripHorizontal,
  ArrowDownToLine,
} from 'lucide-react';
import { ActiveTradingWindow } from '../../utils/usMarketTime';

interface NotePosition {
  x: number;
  y: number;
}

interface FloatingTradingNoteWindowProps {
  position: NotePosition;
  isDragging: boolean;
  isMinimized: boolean;
  activeWindow: ActiveTradingWindow | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onDockBack: () => void;
  onResetPosition: (e: React.MouseEvent) => void;
  onToggleMinimized: () => void;
  children: React.ReactNode;
}

/**
 * กรอบหน้าต่างลอยแบบลากได้พร้อมแถบเครื่องมือควบคุม
 * 
 * @param props - พิกัด, สถานะการลาก, ฟังก์ชันควบคุมหน้าต่าง และ children
 * @returns JSX Element สำหรับหน้าต่างลอย
 */
export const FloatingTradingNoteWindow: React.FC<FloatingTradingNoteWindowProps> = ({
  position,
  isDragging,
  isMinimized,
  activeWindow,
  onMouseDown,
  onTouchStart,
  onDockBack,
  onResetPosition,
  onToggleMinimized,
  children,
}) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

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
        {/* แถบหัวโน้ตแบบลากได้ */}
        <Box
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
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
            <Typography component="span" sx={{ fontSize: '1.05rem', lineHeight: 1, transform: 'rotate(-5deg)' }}>
              📌
            </Typography>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{
                fontFamily: 'Prompt',
                fontSize: '0.8rem',
                color: isLight ? '#92400e' : '#fef08a',
              }}
            >
              โน้ตเตือนสติตารางเวลาเข้าซื้อ
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={0.25}>
            {/* ปุ่มยึดกลับเข้าแถบด้านบน (Dock to Header) */}
            <Tooltip title="ยึดกลับเข้าแถบเมนูด้านบน" arrow placement="top">
              <IconButton
                size="small"
                onClick={onDockBack}
                sx={{
                  p: 0.4,
                  color: isLight ? '#78350f' : '#fef3c7',
                  opacity: 0.8,
                  '&:hover': { opacity: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
                }}
              >
                <ArrowDownToLine size={13} />
              </IconButton>
            </Tooltip>

            {/* ปุ่มรีเซ็ตตำแหน่ง */}
            <Tooltip title="รีเซ็ตตำแหน่งกลับมุมขวาบน" arrow placement="top">
              <IconButton
                size="small"
                onClick={onResetPosition}
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

            {/* ปุ่มย่อ/ขยาย */}
            <Tooltip title={isMinimized ? 'ขยายกระดาษโน้ต' : 'ย่อขนาด'} arrow placement="top">
              <IconButton
                size="small"
                onClick={onToggleMinimized}
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

            {/* ด้ามจับลาก */}
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

        {/* เนื้อหาหน้าต่างลอย */}
        <Collapse in={!isMinimized} timeout={200}>
          {children}
        </Collapse>
      </Box>
    </Box>
  );
};

export default FloatingTradingNoteWindow;
