/**
 * Route: Shared Component
 * Component: InfoTooltipLabel (ป้ายข้อความพร้อมไอคอน Tooltip อธิบายความหมายของค่าสถิติทางการเงิน)
 */

import React from 'react';
import { Box, Typography, Tooltip, Stack } from '@mui/material';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipLabelProps {
  /** ข้อความหัวข้อหรือชื่อเมตริก */
  label: string;
  /** คำอธิบายความหมายที่จะแสดงในกล่อง Tooltip */
  tooltip: string;
  /** ขนาดของฟอนต์ข้อความ เช่น '0.7rem' หรือ '0.68rem' */
  fontSize?: string;
  /** สีของข้อความ เช่น 'text.secondary' */
  color?: string;
  /** ขนาดของไอคอนเครื่องหมายคำถาม (px) */
  iconSize?: number;
}

/**
 * คอมโพเนนต์แสดงชื่อหัวข้อพร้อมไอคอนช่วยเหลือและ Tooltip สไตล์ Glassmorphism
 * ช่วยให้ผู้ใช้วางเมาส์เพื่ออ่านความหมายของตัวชี้วัดทางการเงินได้ชัดเจน
 * 
 * @param props - คุณสมบัติของคอมโพเนนต์ ได้แก่ label, tooltip, fontSize, color, iconSize
 * @returns JSX Element แสดงข้อความพร้อม Tooltip
 */
export const InfoTooltipLabel: React.FC<InfoTooltipLabelProps> = ({
  label,
  tooltip,
  fontSize = '0.7rem',
  color = 'text.secondary',
  iconSize = 12,
}) => {
  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ display: 'flex', width: 'fit-content', mb: 0.25 }}>
      <Typography
        variant="caption"
        sx={{
          color,
          fontSize,
          lineHeight: 1.2,
          display: 'inline-block',
        }}
      >
        {label}
      </Typography>
      <Tooltip
        title={
          <Box sx={{ p: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'Prompt',
                fontSize: '0.74rem',
                lineHeight: 1.45,
                display: 'block',
                color: '#e2e8f0',
              }}
            >
              {tooltip}
            </Typography>
          </Box>
        }
        arrow
        placement="top"
        enterTouchDelay={0}
        leaveTouchDelay={3000}
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              maxWidth: 270,
            },
          },
          arrow: {
            sx: {
              color: 'rgba(15, 23, 42, 0.95)',
              '&::before': {
                border: '1px solid rgba(16, 185, 129, 0.35)',
              },
            },
          },
        }}
      >
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'help',
            color: 'text.secondary',
            opacity: 0.7,
            transition: 'opacity 0.2s ease, color 0.2s ease',
            '&:hover': {
              opacity: 1,
              color: '#10b981',
            },
          }}
        >
          <HelpCircle size={iconSize} />
        </Box>
      </Tooltip>
    </Stack>
  );
};

export default InfoTooltipLabel;
