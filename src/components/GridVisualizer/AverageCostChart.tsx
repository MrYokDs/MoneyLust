/**
 * Route: /
 * Component: AverageCostChart (กราฟ SVG แสดงการเปรียบเทียบราคาหุ้นกับต้นทุนเฉลี่ยสะสม)
 */

import React, { useState } from 'react';
import {
  Paper,
  Stack,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import { TrendingDown } from 'lucide-react';
import { CalculationResult, formatNumber } from '../../utils/stockMath';

interface AverageCostChartProps {
  /** ข้อมูลผลการคำนวณการแบ่งไม้ */
  result: CalculationResult;
}

/**
 * คอมโพเนนต์กราฟจำลอง SVG แสดงเส้นราคาหุ้นแต่ละไม้เทียบกับเส้นต้นทุนเฉลี่ยสะสม
 * 
 * @param props - คุณสมบัติของคอมโพเนนต์ ประกอบด้วยผลลัพธ์การคำนวณ result
 * @returns JSX Element แสดงกราฟ SVG
 */
export const AverageCostChart: React.FC<AverageCostChartProps> = ({ result }) => {
  const theme = useTheme();
  const { tranches } = result;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // กำหนดขนาดมิติของ SVG Chart
  const width = 600;
  const height = 300;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // คำนวณขอบเขตค่าต่ำสุด-สูงสุดสำหรับแกน Y
  const maxVal =
    Math.max(...tranches.map((t) => Math.max(t.price, t.cumulativeAverageCost))) * 1.05;
  const minVal =
    Math.min(...tranches.map((t) => Math.min(t.price, t.cumulativeAverageCost))) * 0.95;
  const priceRange = maxVal - minVal;

  /**
   * คำนวณพิกัดแกน X ตามดัชนีของไม้
   * 
   * @param index - ลำดับของไม้ (0-indexed)
   * @returns พิกัดแนวนอน X
   */
  const getX = (index: number) => {
    if (tranches.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (tranches.length - 1)) * chartWidth;
  };

  /**
   * คำนวณพิกัดแกน Y ตามมูลค่าราคา
   * 
   * @param val - ราคาหุ้นหรือต้นทุนเฉลี่ย
   * @returns พิกัดแนวตั้ง Y
   */
  const getY = (val: number) => {
    if (priceRange === 0) return paddingTop + chartHeight / 2;
    return paddingTop + chartHeight - ((val - minVal) / priceRange) * chartHeight;
  };

  // สร้างเส้นและพื้นที่ SVG Paths
  let pricePath = '';
  let avgCostPath = '';
  let priceAreaPath = '';
  let avgCostAreaPath = '';

  tranches.forEach((t, i) => {
    const x = getX(i);
    const yPrice = getY(t.price);
    const yAvg = getY(t.cumulativeAverageCost);

    if (i === 0) {
      pricePath = `M ${x} ${yPrice}`;
      avgCostPath = `M ${x} ${yAvg}`;
      priceAreaPath = `M ${x} ${chartHeight + paddingTop} L ${x} ${yPrice}`;
      avgCostAreaPath = `M ${x} ${chartHeight + paddingTop} L ${x} ${yAvg}`;
    } else {
      pricePath += ` L ${x} ${yPrice}`;
      avgCostPath += ` L ${x} ${yAvg}`;
    }
  });

  if (tranches.length > 0) {
    const lastX = getX(tranches.length - 1);
    const yPriceLast = getY(tranches[tranches.length - 1].price);
    const yAvgLast = getY(tranches[tranches.length - 1].cumulativeAverageCost);

    priceAreaPath += ` L ${lastX} ${yPriceLast} L ${lastX} ${chartHeight + paddingTop} Z`;
    avgCostAreaPath += ` L ${lastX} ${yAvgLast} L ${lastX} ${chartHeight + paddingTop} Z`;
  }

  // เส้นตาราง Grid lines
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount + 1 }).map((_, i) => {
    const val = minVal + (priceRange * i) / gridCount;
    return {
      value: val,
      y: getY(val),
    };
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        border:
          theme.palette.mode === 'light'
            ? '1px solid rgba(0, 0, 0, 0.08)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        background:
          theme.palette.mode === 'light'
            ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)'
            : 'linear-gradient(180deg, rgba(17, 25, 40, 0.5) 0%, rgba(10, 15, 30, 0.7) 100%)',
        backdropFilter: 'blur(16px) saturate(180%)',
        boxShadow:
          theme.palette.mode === 'light'
            ? '0 8px 32px 0 rgba(31, 38, 135, 0.05)'
            : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <TrendingDown size={20} color={theme.palette.primary.main} />
          <Typography variant="h6" fontWeight="bold">
            กราฟเปรียบเทียบราคาหุ้น VS ต้นทุนเฉลี่ย
          </Typography>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: 'secondary.main',
              }}
            />
            <Typography variant="caption" color="text.secondary">
              ราคาหุ้นรายไม้
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
              }}
            />
            <Typography variant="caption" color="text.secondary">
              ต้นทุนเฉลี่ยสะสม
            </Typography>
          </Stack>
        </Stack>
      </Stack>

      {/* SVG Visual Canvas */}
      <Box
        sx={{
          width: '100%',
          overflowX: 'auto',
          position: 'relative',
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ overflow: 'visible', minWidth: 400 }}
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines & Y Axis Labels */}
          {gridLines.map((line, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={line.y}
                x2={width - paddingRight}
                y2={line.y}
                stroke={
                  theme.palette.mode === 'light'
                    ? 'rgba(0, 0, 0, 0.08)'
                    : 'rgba(255, 255, 255, 0.05)'
                }
                strokeWidth={1}
                strokeDasharray={i === gridCount || i === 0 ? '0' : '4 4'}
              />
              <text
                x={paddingLeft - 8}
                y={line.y + 4}
                fill={
                  theme.palette.mode === 'light'
                    ? 'rgba(15, 23, 42, 0.6)'
                    : 'rgba(243, 244, 246, 0.4)'
                }
                fontSize={10}
                textAnchor="end"
                fontFamily="Inter, Prompt"
              >
                {formatNumber(line.value, 1)}
              </text>
            </g>
          ))}

          {/* Vertical helper lines and Dots */}
          {tranches.map((t, i) => {
            const x = getX(i);
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={height - paddingBottom}
                  stroke={
                    theme.palette.mode === 'light'
                      ? 'rgba(0, 0, 0, 0.05)'
                      : 'rgba(255, 255, 255, 0.03)'
                  }
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={height - paddingBottom + 20}
                  fill={
                    theme.palette.mode === 'light'
                      ? 'rgba(15, 23, 42, 0.6)'
                      : 'rgba(243, 244, 246, 0.5)'
                  }
                  fontSize={11}
                  textAnchor="middle"
                  fontFamily="Prompt"
                  fontWeight={hoveredIndex === i ? 'bold' : 'normal'}
                >
                  ไม้ {t.trancheNumber}
                </text>
              </g>
            );
          })}

          {/* Chart Area Fills */}
          {tranches.length > 1 && (
            <>
              <path d={avgCostAreaPath} fill="url(#avgGrad)" />
              <path d={priceAreaPath} fill="url(#priceGrad)" />
            </>
          )}

          {/* Lines */}
          {tranches.length > 1 && (
            <>
              <path
                d={pricePath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="4 2"
              />
              <path
                d={avgCostPath}
                fill="none"
                stroke="#10b981"
                strokeWidth={3}
                strokeLinecap="round"
              />
            </>
          )}

          {/* Dots / Interactive Circles */}
          {tranches.map((t, i) => {
            const x = getX(i);
            const yPrice = getY(t.price);
            const yAvg = getY(t.cumulativeAverageCost);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Price Dot */}
                <circle
                  cx={x}
                  cy={yPrice}
                  r={isHovered ? 8 : 4}
                  fill={theme.palette.mode === 'light' ? '#ffffff' : '#0b0f19'}
                  stroke="#06b6d4"
                  strokeWidth={isHovered ? 3 : 2}
                  style={{ transition: 'all 0.15s' }}
                />

                {/* Avg Cost Dot */}
                <circle
                  cx={x}
                  cy={yAvg}
                  r={isHovered ? 8 : 5}
                  fill={theme.palette.mode === 'light' ? '#ffffff' : '#0b0f19'}
                  stroke="#10b981"
                  strokeWidth={isHovered ? 3 : 2}
                  style={{ transition: 'all 0.15s' }}
                />
              </g>
            );
          })}
        </svg>
      </Box>
    </Paper>
  );
};

export default AverageCostChart;
