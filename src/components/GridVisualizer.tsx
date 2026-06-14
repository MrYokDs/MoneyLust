import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, Stack, Chip, Divider, useTheme } from '@mui/material';
import { CalculationResult, formatNumber, formatCurrency } from '../utils/stockMath';
import { DollarSign, PieChart, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react';

interface GridVisualizerProps {
  result: CalculationResult;
}

export const GridVisualizer: React.FC<GridVisualizerProps> = ({ result }) => {
  const theme = useTheme();
  const { tranches, currentPrice, stockSymbol, roundingMode, currency = 'THB', exchangeRate = 36.5 } = result;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate base budget for comparison
  const baseBudget = Math.floor(result.totalBudget / result.tranchesCount);

  // SVG dimensions
  const width = 600;
  const height = 300;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Math for SVG plotting
  const maxVal = Math.max(...tranches.map(t => Math.max(t.price, t.cumulativeAverageCost))) * 1.05;
  const minVal = Math.min(...tranches.map(t => Math.min(t.price, t.cumulativeAverageCost))) * 0.95;
  const priceRange = maxVal - minVal;

  const getX = (index: number) => {
    if (tranches.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (tranches.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    if (priceRange === 0) return paddingTop + chartHeight / 2;
    return paddingTop + chartHeight - ((val - minVal) / priceRange) * chartHeight;
  };

  // Generate paths
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

  // Grid lines
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount + 1 }).map((_, i) => {
    const val = minVal + (priceRange * i) / gridCount;
    return {
      value: val,
      y: getY(val),
    };
  });

  return (
    <Box>
      <Grid container spacing={4}>
        {/* 1. Fund Split Diagram */}
        <Grid size={{ xs: 12 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: theme.palette.mode === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
              background: theme.palette.mode === 'light' 
                ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)' 
                : 'linear-gradient(180deg, rgba(17, 25, 40, 0.5) 0%, rgba(10, 15, 30, 0.7) 100%)',
              backdropFilter: 'blur(16px) saturate(180%)',
              boxShadow: theme.palette.mode === 'light' ? '0 8px 32px 0 rgba(31, 38, 135, 0.05)' : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
              <PieChart size={20} color={theme.palette.primary.main} />
              <Typography variant="h6" fontWeight="bold">
                การแบ่งสัดส่วนเงินลงทุน ({tranches.length} ไม้)
              </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary" mb={2}>
              เงินทุนจะถูกหารเท่า ๆ กัน และเศษที่เหลือจากการหารทั้งหมดจะถูกทบไปลงที่
              <Box component="span" sx={{ color: 'secondary.main', fontWeight: 'bold', mx: 0.5 }}>
                ไม้สุดท้าย (ไม้ที่ {tranches.length})
              </Box> 
              โดยอัตโนมัติ เพื่อไม่ให้เงินลงทุนขาดตกบกพร่อง
            </Typography>

            {/* Visual Bar Split - Horizontal Scroll Slider */}
            <Stack
              direction="row"
              spacing={2}
              sx={{
                width: '100%',
                overflowX: 'auto',
                pb: 2,
                pt: 1,
                // Elegant customized scrollbar
                '&::-webkit-scrollbar': {
                  height: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(16, 185, 129, 0.3)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '4px',
                }
              }}
            >
              {tranches.map((t, index) => {
                const isLast = index === tranches.length - 1;
                const percent = (t.budgetAllocated / result.totalBudget) * 100;
                
                return (
                  <Box
                    key={index}
                    sx={{
                      minWidth: { xs: 220, sm: 240, md: 260 }, // Fixed min-width for horizontal flow
                      flexShrink: 0,
                      position: 'relative',
                      p: 2,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'light'
                        ? (isLast ? 'rgba(6, 182, 212, 0.4)' : 'rgba(0, 0, 0, 0.08)')
                        : (isLast ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)'),
                      background: theme.palette.mode === 'light'
                        ? (isLast 
                            ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(255, 255, 255, 0.95) 100%)'
                            : 'linear-gradient(135deg, rgba(0, 0, 0, 0.01) 0%, rgba(255, 255, 255, 0.8) 100%)')
                        : (isLast 
                            ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(10, 20, 40, 0.4) 100%)'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(10, 15, 25, 0.4) 100%)'),
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.palette.mode === 'light' 
                          ? (isLast ? '0 6px 20px rgba(6, 182, 212, 0.15)' : '0 6px 15px rgba(31, 38, 135, 0.05)')
                          : (isLast ? '0 6px 20px rgba(6, 182, 212, 0.2)' : '0 6px 15px rgba(0, 0, 0, 0.3)'),
                        borderColor: isLast ? 'secondary.main' : 'primary.main',
                      }
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                      <Chip
                        size="small"
                        label={`ไม้ที่ ${t.trancheNumber}`}
                        color={isLast ? 'secondary' : 'primary'}
                        variant={isLast ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 'bold' }}
                      />
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">
                        {percent.toFixed(2)}%
                      </Typography>
                    </Stack>

                    <Typography variant="h5" fontWeight="800" color={isLast ? 'secondary.light' : 'text.primary'}>
                      {formatCurrency(t.sharesBought * t.price, currency, false, exchangeRate)}
                    </Typography>

                    {isLast && t.budgetAllocated > baseBudget && (
                      <Typography variant="caption" color="secondary.light" sx={{ display: 'block', mt: 0.5 }}>
                        💡 มีการรวมเศษทศนิยม (+{formatCurrency(t.budgetAllocated - baseBudget, currency, false, exchangeRate)})
                      </Typography>
                    )}

                    <Divider sx={{ my: 1, opacity: 0.3 }} />

                    <Stack spacing={0.5}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">ราคาซื้อเป้าหมาย:</Typography>
                        <Typography variant="caption" fontWeight="bold" color="success.main">
                          {formatCurrency(t.price, currency, false, exchangeRate)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">จำนวนหุ้นที่จะได้:</Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {formatNumber(t.sharesBought, roundingMode === 'fractional' ? 4 : 0)} หุ้น
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Grid>

        {/* 2. Sleek Custom SVG Line Chart */}
        <Grid size={{ xs: 12, lg: 8 }} sx={{ display: 'flex' }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: theme.palette.mode === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
              background: theme.palette.mode === 'light' 
                ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)' 
                : 'linear-gradient(180deg, rgba(17, 25, 40, 0.5) 0%, rgba(10, 15, 30, 0.7) 100%)',
              backdropFilter: 'blur(16px) saturate(180%)',
              boxShadow: theme.palette.mode === 'light' ? '0 8px 32px 0 rgba(31, 38, 135, 0.05)' : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
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
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'secondary.main' }} />
                  <Typography variant="caption" color="text.secondary">ราคาหุ้นรายไม้</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'primary.main' }} />
                  <Typography variant="caption" color="text.secondary">ต้นทุนเฉลี่ยสะสม</Typography>
                </Stack>
              </Stack>
            </Stack>

            {/* SVG Visual Canvas */}
            <Box sx={{ width: '100%', overflowX: 'auto', position: 'relative', flexGrow: 1, display: 'flex', alignItems: 'center' }}>
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
                      stroke={theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)'}
                      strokeWidth={1}
                      strokeDasharray={i === gridCount || i === 0 ? '0' : '4 4'}
                    />
                    <text
                      x={paddingLeft - 8}
                      y={line.y + 4}
                      fill={theme.palette.mode === 'light' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(243, 244, 246, 0.4)'}
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
                        stroke={theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)'}
                        strokeWidth={1}
                      />
                      <text
                        x={x}
                        y={height - paddingBottom + 20}
                        fill={theme.palette.mode === 'light' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(243, 244, 246, 0.5)'}
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
        </Grid>

        {/* 3. Cost reduction Summary */}
        <Grid size={{ xs: 12, lg: 4 }} sx={{ display: 'flex' }}>
          <Stack spacing={3}>
            {/* Quick KPI: Total discount */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                border: theme.palette.mode === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
                background: theme.palette.mode === 'light'
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(255, 255, 255, 0.85) 100%)'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(10, 15, 25, 0.6) 100%)',
                backdropFilter: 'blur(16px) saturate(180%)',
                boxShadow: theme.palette.mode === 'light' ? '0 8px 32px 0 rgba(31, 38, 135, 0.05)' : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  right: -10,
                  bottom: -10,
                  opacity: 0.05,
                  transform: 'rotate(-10deg)'
                }}
              >
                <TrendingDown size={140} />
              </Box>

              <Stack spacing={1}>
                <Typography variant="subtitle2" color="primary.light" fontWeight="bold" letterSpacing="0.05em">
                  ส่วนลดต้นทุนเฉลี่ยของพอร์ต
                </Typography>
                <Typography variant="h3" fontWeight="900" className="glow-text-emerald" sx={{ my: 1 }}>
                  {formatNumber(result.overallDiscountPercent, 2)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  หากหุ้น {stockSymbol} ตกจาก {formatCurrency(currentPrice, currency, false, exchangeRate)} ลงไปถึงเป้าหมายไม้สุดท้าย การแบ่งซื้อวิธีนี้จะลดราคาต้นทุนซื้อเฉลี่ยลงไปได้ถึง{' '}
                  <span style={{ fontWeight: 'bold', color: '#10b981' }}>{result.overallDiscountPercent}%</span> เมื่อเทียบกับการซื้อไม้แรกทีเดียวทั้งหมด!
                </Typography>
              </Stack>
            </Paper>

            {/* Detailed Stats */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                border: theme.palette.mode === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
                background: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(17, 25, 40, 0.65)',
                backdropFilter: 'blur(16px) saturate(180%)',
                boxShadow: theme.palette.mode === 'light' ? '0 8px 32px 0 rgba(31, 38, 135, 0.05)' : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
              }}
            >
              <Typography variant="h6" fontWeight="bold" mb={2}>
                สรุปยอดรวมทั้งสิ้น
              </Typography>

              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DollarSign size={16} color={theme.palette.text.secondary} />
                    <Typography variant="body2" color="text.secondary">งบลงทุนทั้งหมด</Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(result.totalBudget, currency, currency === 'USD', exchangeRate)}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DollarSign size={16} color={theme.palette.text.secondary} />
                    <Typography variant="body2" color="text.secondary">เงินใช้ซื้อจริงสะสม</Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(result.totalActualSpent, currency, false, exchangeRate)}
                  </Typography>
                </Stack>


                <Divider sx={{ opacity: 0.3 }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">จำนวนหุ้นรวมที่ได้</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatNumber(result.totalSharesBought, roundingMode === 'fractional' ? 4 : 0)} หุ้น
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">ราคาต้นทุนเฉลี่ยของพอร์ต</Typography>
                  <Typography variant="body1" fontWeight="bold" color="secondary.light">
                    {formatCurrency(result.finalAverageCost, currency, false, exchangeRate)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* 4. Side-by-side actual execution reports spanning full remaining width */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
          {/* 3.5 Actual Execution Stats Summary Card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              width: '100%',
              border: theme.palette.mode === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
              background: theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.06) 0%, rgba(255, 255, 255, 0.85) 100%)'
                : 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(10, 15, 25, 0.6) 100%)',
              backdropFilter: 'blur(16px) saturate(180%)',
              boxShadow: theme.palette.mode === 'light' ? '0 8px 32px 0 rgba(31, 38, 135, 0.05)' : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant="h6" fontWeight="bold" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📈 ผลลัพธ์จากการซื้อจริง (Actual Execution)
            </Typography>

            <Stack spacing={2} sx={{ flexGrow: 1, justifyContent: 'center' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">ไม้ที่เข้าซื้อได้จริง</Typography>
                <Chip
                  size="small"
                  label={`${result.actualTranchesCount} จาก ${result.tranchesCount} ไม้`}
                  color={(result.actualTranchesCount || 0) < (result.tranchesCount || 0) ? 'warning' : 'success'}
                  sx={{ fontWeight: 'bold' }}
                />
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">เงินที่ใช้ซื้อจริงสะสม</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatCurrency(result.actualSpent || 0, currency, currency === 'USD', exchangeRate)}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">จำนวนหุ้นรวมที่ได้จริง</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatNumber(result.actualShares || 0, roundingMode === 'fractional' ? 4 : 0)} หุ้น
                </Typography>
              </Stack>

              {/* If sell price is NOT entered, show the average cost here */}
              {(!result.actualSellPrice || result.actualSellPrice <= 0) && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">ราคาต้นทุนเฉลี่ยจริง</Typography>
                  <Typography variant="body1" fontWeight="bold" color="secondary.light">
                    {formatCurrency(result.actualAverageCost || 0, currency, false, exchangeRate)}
                  </Typography>
                </Stack>
              )}

              {!!result.actualSellPrice && result.actualSellPrice > 0 && (
                <>
                  <Divider sx={{ opacity: 0.1 }} />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">ราคาที่ขายจริง</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(result.actualSellPrice, currency, false, exchangeRate)}
                    </Typography>
                  </Stack>

                  {/* If sell price IS entered, show the average cost here, below the sell price! */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1.5}>
                    <Typography variant="body2" color="text.secondary">ราคาต้นทุนเฉลี่ยจริง</Typography>
                    <Typography variant="body1" fontWeight="bold" color="secondary.light">
                      {formatCurrency(result.actualAverageCost || 0, currency, false, exchangeRate)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1.5}>
                    <Typography variant="body2" color="text.secondary">กำไร / ขาดทุนจริงสุทธิ</Typography>
                    <Stack alignItems="end">
                      <Typography 
                        variant="body1" 
                        fontWeight="bold" 
                        color={(result.actualRealizedProfitLossAmount || 0) >= 0 ? 'success.light' : 'error.light'}
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        {(result.actualRealizedProfitLossAmount || 0) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {formatCurrency(result.actualRealizedProfitLossAmount || 0, currency, false, exchangeRate)}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        fontWeight="bold" 
                        color={(result.actualRealizedProfitLossAmount || 0) >= 0 ? 'success.light' : 'error.light'}
                      >
                        {(result.actualRealizedProfitLossAmount || 0) >= 0 ? '+' : ''}
                        {result.actualRealizedProfitLossPercent}% (ROI)
                      </Typography>
                      {result.actualTranchesCount !== result.tranchesCount && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ fontSize: '0.72rem', mt: 0.3 }}
                        >
                          เทียบแผนเต็ม: {(result.actualRealizedProfitLossAmount || 0) >= 0 ? '+' : ''}{result.actualRealizedProfitLossPercentOfFullPlan}% ROI
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
          {/* 4. Exit & Profit Simulator Card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              width: '100%',
              position: 'relative',
              overflow: 'hidden',
              background: theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(255, 255, 255, 0.85) 100%)'
                : 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(10, 15, 25, 0.7) 100%)',
              border: theme.palette.mode === 'light'
                ? '1px solid rgba(6, 182, 212, 0.3)'
                : '1px solid rgba(6, 182, 212, 0.15)',
              backdropFilter: 'blur(16px) saturate(180%)',
              boxShadow: theme.palette.mode === 'light' ? '0 8px 32px 0 rgba(31, 38, 135, 0.05)' : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant="h6" fontWeight="bold" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🎯 Exit & Profit Simulator
            </Typography>

            <Stack spacing={2} sx={{ flexGrow: 1, justifyContent: 'center' }}>
              {/* Planned target sell price (Full plan) */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="bold">ราคาขาย : เป้าหมายเมื่อซื้อครบแผน ({result.tranchesCount} ไม้)</Typography>
                  <Typography variant="caption" color="text.secondary">
                    เพื่อให้ได้กำไร {result.targetProfitPercent}% จากทุนเต็มแผน {formatCurrency(result.totalActualSpent, currency, false, exchangeRate)}
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight="bold" color="text.secondary">
                  {formatCurrency(result.targetSellPrice || 0, currency, false, exchangeRate)}
                </Typography>
              </Stack>

              <Divider sx={{ opacity: 0.1 }} />

              {/* Actual target sell price (Based on actual executed tranches) */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    ราคาขาย : เป้าหมายจริง ณ ตอนนี้ ({result.actualTranchesCount} ไม้)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    เพื่อให้ได้กำไรสุทธิ {result.targetProfitPercent}% จากเงินลงทุนจริงสะสม {formatCurrency(result.actualSpent || 0, currency, false, exchangeRate)}
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="950" color="success.main">
                  {formatCurrency(result.actualTargetSellPrice || 0, currency, false, exchangeRate)}
                </Typography>
              </Stack>

              {result.actualTranchesCount !== result.tranchesCount && (
                <>
                  <Divider sx={{ opacity: 0.1 }} />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" color="primary.light" fontWeight="bold">
                        ราคาขาย : เป้าหมายเทียบเท่าเพื่อให้ได้เงินกำไรเท่าแผนเต็ม
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        เพื่อให้ได้เม็ดเงินกำไรเท่ากับตอนซื้อครบทุกไม้ (≈ {formatCurrency((result.totalActualSpent * (1 + (result.feePercent || 0) / 100)) * (result.targetProfitPercent || 0) / 100, currency, false, exchangeRate)}) แม้จะเข้าซื้อเพียง {result.actualTranchesCount} ไม้
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="950" color="primary.light" className="glow-text-cyan">
                      {formatCurrency(result.actualEquivalentTargetSellPrice || 0, currency, false, exchangeRate)}
                    </Typography>
                  </Stack>
                </>
              )}

              <Divider sx={{ opacity: 0.1 }} />

              {!!result.actualSellPrice && result.actualSellPrice > 0 ? (
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">ราคาที่ขายจริง</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(result.actualSellPrice, currency, false, exchangeRate)}
                    </Typography>
                  </Stack>

                  {/* Actual Executed Tranches Profit/Loss */}
                  <Stack 
                    sx={{ 
                      p: 1.5, 
                      borderRadius: 3, 
                      border: '1px solid',
                      borderColor: (result.actualRealizedProfitLossAmount || 0) >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      backgroundColor: (result.actualRealizedProfitLossAmount || 0) >= 0 ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)' 
                    }}
                    spacing={1}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        กำไร/ขาดทุน จากยอดซื้อจริง ({result.actualTranchesCount} ไม้)
                      </Typography>
                      <Stack alignItems="end">
                        <Typography 
                          variant="body1" 
                          fontWeight="bold" 
                          color={(result.actualRealizedProfitLossAmount || 0) >= 0 ? 'success.main' : 'error.light'}
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                          {(result.actualRealizedProfitLossAmount || 0) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          {formatCurrency(result.actualRealizedProfitLossAmount || 0, currency, false, exchangeRate)}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          fontWeight="bold" 
                          color={(result.actualRealizedProfitLossAmount || 0) >= 0 ? 'success.main' : 'error.light'}
                        >
                          {(result.actualRealizedProfitLossAmount || 0) >= 0 ? '+' : ''}
                          {result.actualRealizedProfitLossPercent}% (Net ROI)
                        </Typography>
                        {result.actualTranchesCount !== result.tranchesCount && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ fontSize: '0.72rem', mt: 0.3 }}
                          >
                            เทียบแผนเต็ม: {(result.actualRealizedProfitLossAmount || 0) >= 0 ? '+' : ''}{result.actualRealizedProfitLossPercentOfFullPlan}% ROI
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  </Stack>


                  <Box 
                    sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      border: '1px solid',
                      borderColor: (result.actualRealizedProfitLossAmount || 0) >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      backgroundColor: (result.actualRealizedProfitLossAmount || 0) >= 0 ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <CheckCircle2 size={16} color={(result.actualRealizedProfitLossAmount || 0) >= 0 ? '#10b981' : '#ef4444'} />
                    <Typography variant="caption" sx={{ fontFamily: 'Prompt' }} color={(result.actualRealizedProfitLossAmount || 0) >= 0 ? 'success.light' : 'error.light'}>
                      {(result.actualRealizedProfitLossAmount || 0) >= 0 
                        ? `ยอดเยี่ยม! คุณทำกำไรได้สำเร็จหลังหักค่าดำเนินการเรียบร้อย` 
                        : `แผนการขายนี้ขาดทุนสุทธิหลังหักค่าดำเนินการทั้งหมด`}
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 3, 
                    backgroundColor: 'rgba(255,255,255,0.02)', 
                    border: '1px dashed rgba(255,255,255,0.1)',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Prompt' }}>
                    💡 ระบุ "ราคาที่ขายจริง" ที่เมนูตั้งค่าฝั่งซ้าย เพื่อประเมินยอดกำไร/ขาดทุนสุทธิทันที!
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GridVisualizer;
