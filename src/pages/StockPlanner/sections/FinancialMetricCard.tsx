/**
 * Route: /
 * Section: FinancialMetricCard (กล่องแสดงตัวชี้วัดทางการเงินพร้อมการเปรียบเทียบงวดก่อนหน้า)
 */

import React from 'react';
import { Box, Typography, Tooltip, Stack, useTheme } from '@mui/material';
import InfoTooltipLabel from '../../../components/InfoTooltipLabel';
import { evaluateFinancialTrend } from '../../../utils/stockFinancials';

interface FinancialMetricCardProps {
  label: string;
  tooltip: string;
  currentVal?: string;
  prevVal?: string;
  isLiability?: boolean;
  prevPeriod?: string;
}

/**
 * คอมโพเนนต์แสดงกล่องตัวชี้วัดทางการเงินแต่ละรายการ
 * จัดวางตัวเลขและสถานะแนวโน้ม (Badge) เคียงข้างกันในแนวนอน เพื่อความกระชับและอ่านง่าย
 * 
 * @param props - คุณสมบัติของคอมโพเนนต์ ได้แก่ ชื่อตัวชี้วัด, คำอธิบาย tooltip, ค่างวดปัจจุบัน และค่างวดก่อนหน้า
 * @returns JSX Element สำหรับกล่องตัวชี้วัดทางการเงิน
 */
export const FinancialMetricCard: React.FC<FinancialMetricCardProps> = ({
  label,
  tooltip,
  currentVal,
  prevVal,
  isLiability = false,
  prevPeriod,
}) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  // ประเมินผลเปรียบเทียบกับงวดก่อนหน้า
  const trend = evaluateFinancialTrend(currentVal, prevVal, isLiability, prevPeriod);

  /**
   * กำหนดสีของตัวเลขหลัก
   * 
   * @param val - สตริงตัวเลขงวดปัจจุบัน
   * @returns รหัสสีสำหรับตัวเลข
   */
  const getPrimaryColor = (val?: string): string => {
    if (!val || val === '--') return 'text.secondary';
    if (isLiability) return '#f59e0b'; // หนี้สินใช้โทนสีเหลืองอำพัน/ส้ม
    if (val.includes('-') || val.includes('(')) return '#f43f5e'; // ขาดทุนใช้สีแดงกุหลาบ
    return '#10b981'; // กำไรใช้สีเขียวมรกต
  };

  /**
   * สีพื้นหลังและข้อความของ Badge ตัวบ่งชี้สถานะ
   */
  const getBadgeStyle = () => {
    switch (trend.status) {
      case 'improved':
        return {
          color: isLight ? '#047857' : '#34d399',
          bg: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.22)',
          border: isLight ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(52, 211, 153, 0.35)',
        };
      case 'worsened':
        return {
          color: isLight ? '#be123c' : '#fb7185',
          bg: isLight ? 'rgba(244, 63, 94, 0.12)' : 'rgba(244, 63, 94, 0.22)',
          border: isLight ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(251, 113, 133, 0.35)',
        };
      case 'neutral':
        return {
          color: 'text.secondary',
          bg: isLight ? 'rgba(100, 116, 139, 0.08)' : 'rgba(148, 163, 184, 0.12)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        };
      default:
        return {
          color: 'text.secondary',
          bg: 'transparent',
          border: '1px solid transparent',
        };
    }
  };

  const badgeStyle = getBadgeStyle();

  return (
    <Box
      sx={{
        p: 1.15,
        borderRadius: '8px',
        background: isLight ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.03)',
        border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 0.6,
        minHeight: '66px',
        transition: 'all 0.2s ease',
        '&:hover': {
          background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.06)',
          borderColor: isLight ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
          transform: 'translateY(-1px)',
          boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : '0 2px 8px rgba(0,0,0,0.2)',
        },
      }}
    >
      {/* ส่วนหัวและคำอธิบาย Tooltip */}
      <InfoTooltipLabel
        label={label}
        tooltip={tooltip}
        fontSize="0.68rem"
        iconSize={11}
      />

      {/* แถวแสดงตัวเลขหลัก เคียงข้างด้วย Badge ตัวบ่งชี้แนวโน้ม */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={0.5}
      >
        <Typography
          variant="body2"
          fontWeight="bold"
          sx={{
            color: getPrimaryColor(currentVal),
            fontSize: '0.92rem',
            letterSpacing: '-0.2px',
            lineHeight: 1.2,
          }}
        >
          {currentVal || '-'}
        </Typography>

        {/* แถบ Badge เปรียบเทียบกับงวดก่อนหน้า วางเคียงข้างตัวเลข */}
        {trend.status !== 'unknown' && (
          <Tooltip
            title={
              <Box sx={{ p: 0.5 }}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', mb: 0.25 }}>
                  📊 เปรียบเทียบกับงวดก่อนหน้า {prevPeriod ? `(${prevPeriod})` : ''}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.72rem' }}>
                  {trend.tooltipText}
                </Typography>
              </Box>
            }
            arrow
            placement="top"
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 0.75,
                py: 0.2,
                borderRadius: '6px',
                backgroundColor: badgeStyle.bg,
                border: badgeStyle.border,
                cursor: 'help',
                transition: 'all 0.15s ease',
                '&:hover': {
                  filter: 'brightness(1.15)',
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.64rem',
                  fontWeight: 600,
                  color: badgeStyle.color,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                {trend.badgeText}
              </Typography>
            </Box>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
};

export default FinancialMetricCard;

