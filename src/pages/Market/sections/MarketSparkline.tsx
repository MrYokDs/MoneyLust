/** Route: /market */
/**
 * Component: MarketSparkline.tsx
 * แสดงกราฟเส้นจิ๋ว (Mini Sparkline SVG) จำลองทิศทางการเคลื่อนไหวของราคาหุ้น
 */

import React from 'react';
import { Box } from '@mui/material';

interface MarketSparklineProps {
  data: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
}

/**
 * คอมโพเนนต์แสดงกราฟเส้น Sparkline จำลองการเคลื่อนไหวของราคา
 * 
 * @param props - พารามิเตอร์ประกอบด้วย data (ชุดตัวเลขราคา), isPositive (ทิศทางบวก/ลบ), width และ height
 * @returns JSX Element สำหรับ SVG Sparkline
 */
export const MarketSparkline: React.FC<MarketSparklineProps> = ({
  data,
  isPositive,
  width = 90,
  height = 28,
}) => {
  if (!data || data.length < 2) {
    return (
      <Box sx={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
        -
      </Box>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const effectiveHeight = height - padding * 2;

  // สร้างจุดพิกัด SVG (x, y)
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * (width - 4) + 2;
    const y = height - padding - ((val - min) / range) * effectiveHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const strokeColor = isPositive ? '#10b981' : '#ef4444';
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
  const areaD = `${pathD} L ${width - 2},${height} L 2,${height} Z`;

  return (
    <Box sx={{ width, height, display: 'inline-flex', alignItems: 'center' }}>
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <path d={areaD} fill={fillColor} />
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );
};

export default MarketSparkline;
