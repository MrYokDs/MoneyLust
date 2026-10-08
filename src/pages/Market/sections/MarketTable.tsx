/** Route: /market */
/**
 * Component: MarketTable.tsx
 * ตารางแสดงรายการหุ้นจัดอันดับ Top Gainers / Top Losers สไตล์ Webull พร้อมกราฟ Sparkline
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Button,
  Box,
  useTheme,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Calculator,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { PATHS } from '../../../routes';
import { useAppDispatch } from '../../../store';
import { updateCurrentParams } from '../../../store/stockPlannerSlice';
import { formatNumber } from '../../../utils/stockMath';
import { formatMarketCap } from '../../../utils/stockApi';
import { MarketSparkline } from './MarketSparkline';
import { ScreenerStockItem, MarketPeriod } from '../types';

interface MarketTableProps {
  items: ScreenerStockItem[];
  isLoading: boolean;
  period: MarketPeriod;
  errorMessage?: string | null;
  onRetry?: () => void;
}

/**
 * จัดรูปแบบตัวเลข Volume ให้อ่านง่าย เช่น 4.22M, 747.71K
 * 
 * @param volume - จำนวนหุ้นที่ซื้อขาย
 * @returns สตริง Volume ที่จัดรูปแบบแล้ว
 */
const formatVolume = (volume: number): string => {
  if (!volume || volume <= 0) return '-';
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
  return volume.toLocaleString();
};

/**
 * คอมโพเนนต์ตารางแสดงรายชื่อหุ้นจัดอันดับในตลาด
 * 
 * @param props - พารามิเตอร์ items, isLoading, period
 * @returns JSX Element สำหรับ Table
 */
export const MarketTable: React.FC<MarketTableProps> = ({
  items,
  isLoading,
  period,
  errorMessage,
  onRetry,
}) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // ติดตามการเปลี่ยนแปลงราคาเพื่อแสดงเอฟเฟกต์กระพริบเขียว-แดง (Ticker Flashing Effect) เหมือนบนแอป Webull
  const prevPricesRef = React.useRef<Record<string, number>>({});
  const [flashStates, setFlashStates] = React.useState<Record<string, 'up' | 'down'>>({});

  React.useEffect(() => {
    const newFlashes: Record<string, 'up' | 'down'> = {};
    let hasChanges = false;

    items.forEach((item) => {
      const prev = prevPricesRef.current[item.symbol];
      if (prev !== undefined && prev !== item.price) {
        newFlashes[item.symbol] = item.price > prev ? 'up' : 'down';
        hasChanges = true;
      }
      prevPricesRef.current[item.symbol] = item.price;
    });

    if (hasChanges) {
      setFlashStates((prev) => ({ ...prev, ...newFlashes }));
      const timer = setTimeout(() => {
        setFlashStates({});
      }, 700);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [items]);

  /**
   * ส่งรหัสหุ้นและราคาล่าสุดไปเปิดในหน้าสร้างแผนการเทรด (Stock Grid Planner) ทันที
   * 
   * @param item - ข้อมูลหุ้นที่เลือก
   */
  const handlePlanStock = (item: ScreenerStockItem) => {
    dispatch(
      updateCurrentParams({
        stockSymbol: item.symbol,
        currentPrice: item.price.toString(),
      })
    );
    navigate(PATHS.PLANNER);
  };

  const priceHeaderLabel =
    period === 'preMarket' ? 'PM Price' : period === 'afterHours' ? 'AM Price' : 'Last Price';

  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: '12px',
        bgcolor: isLight ? '#ffffff' : '#111827',
        backgroundImage: 'none',
        border: '1px solid',
        borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
        boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.04)' : '0 8px 32px rgba(0,0,0,0.3)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        position: 'relative',
      }}
    >
      {isLoading && (
        <LinearProgress
          sx={{
            height: 3,
            bgcolor: isLight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.15)',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)',
            },
          }}
        />
      )}
      <Table sx={{ minWidth: 700 }}>
        <TableHead
          sx={{
            bgcolor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid',
            borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
          }}
        >
          <TableRow sx={{ '& th': { whiteSpace: 'nowrap' } }}>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.secondary', width: 48, py: 1.5 }}>
              #
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.secondary', py: 1.5 }}>
              Symbol
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.secondary', py: 1.5 }}>
              Name
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.secondary', py: 1.5 }}>
              {priceHeaderLabel}
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.secondary', py: 1.5, width: 120 }}>
              Sparkline
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.secondary', py: 1.5 }}>
              % Change
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.secondary', py: 1.5 }}>
              Volume
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.secondary', py: 1.5 }}>
              Market Cap
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.secondary', py: 1.5, width: 90 }}>
              Action
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading ? (
            Array.from({ length: 10 }).map((_, idx) => (
              <TableRow
                key={`skeleton-${idx}`}
                sx={{
                  bgcolor: idx % 2 === 1
                    ? (theme) => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.015)'
                    : 'transparent',
                }}
              >
                <TableCell sx={{ py: 1.8 }}><Skeleton width={20} /></TableCell>
                <TableCell sx={{ py: 1.8 }}><Skeleton variant="rounded" width={56} height={24} sx={{ borderRadius: 1.5 }} /></TableCell>
                <TableCell sx={{ py: 1.8 }}><Skeleton width={130 + (idx % 4) * 25} height={18} /></TableCell>
                <TableCell align="right" sx={{ py: 1.8 }}><Skeleton width={68} height={22} sx={{ ml: 'auto', borderRadius: 1 }} /></TableCell>
                <TableCell align="center" sx={{ py: 1.8 }}><Skeleton variant="rounded" width={80} height={24} sx={{ mx: 'auto', borderRadius: 1 }} /></TableCell>
                <TableCell align="right" sx={{ py: 1.8 }}><Skeleton variant="rounded" width={72} height={24} sx={{ ml: 'auto', borderRadius: 1.5 }} /></TableCell>
                <TableCell align="right" sx={{ py: 1.8 }}><Skeleton width={55} sx={{ ml: 'auto' }} /></TableCell>
                <TableCell align="right" sx={{ py: 1.8 }}><Skeleton width={65} sx={{ ml: 'auto' }} /></TableCell>
                <TableCell align="center" sx={{ py: 1.8 }}><Skeleton variant="circular" width={28} height={28} sx={{ mx: 'auto' }} /></TableCell>
              </TableRow>
            ))
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                  <AlertCircle size={38} color={isLight ? '#9ca3af' : '#6b7280'} />
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                    {errorMessage || 'ไม่สามารถเชื่อมต่อ Webull API เพื่อดึงข้อมูลได้ในขณะนี้'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460 }}>
                    โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต หรือเซิร์ฟเวอร์ตลาดอาจอยู่ในช่วงปิดปรับปรุงระบบ
                  </Typography>
                  {onRetry && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<RefreshCw size={14} />}
                      onClick={onRetry}
                      sx={{ mt: 1, borderRadius: '8px', textTransform: 'none' }}
                    >
                      ลองใหม่อีกครั้ง
                    </Button>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => {
              const isPositive = item.changePercent >= 0;
              const formattedPrice =
                item.price < 1 ? item.price.toFixed(4) : formatNumber(item.price, 2);

              return (
                <TableRow
                  key={item.symbol}
                  hover
                  sx={{
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                      bgcolor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                    },
                  }}
                >
                  {/* Index */}
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem', py: 1.5 }}>
                    {index + 1}
                  </TableCell>

                  {/* Symbol */}
                  <TableCell sx={{ py: 1.5 }}>
                    <Chip
                      label={item.symbol}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        letterSpacing: '0.02em',
                        fontFamily: 'monospace',
                        bgcolor: isLight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.18)',
                        color: isLight ? '#047857' : '#34d399',
                        borderRadius: 1.5,
                      }}
                    />
                  </TableCell>

                  {/* Name */}
                  <TableCell sx={{ py: 1.5, maxWidth: 220 }}>
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      noWrap
                      sx={{ color: isLight ? '#1e293b' : '#f1f5f9' }}
                    >
                      {item.name}
                    </Typography>
                  </TableCell>

                  {/* Price */}
                  <TableCell
                    align="right"
                    sx={{
                      py: 1.5,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      fontSize: '0.92rem',
                      transition: 'all 0.35s ease',
                      bgcolor:
                        flashStates[item.symbol] === 'up'
                          ? 'rgba(16, 185, 129, 0.25)'
                          : flashStates[item.symbol] === 'down'
                          ? 'rgba(239, 68, 68, 0.25)'
                          : 'transparent',
                      color:
                        flashStates[item.symbol] === 'up'
                          ? '#10b981'
                          : flashStates[item.symbol] === 'down'
                          ? '#ef4444'
                          : 'inherit',
                      borderRadius: '6px',
                    }}
                  >
                    ${formattedPrice}
                  </TableCell>

                  {/* Sparkline */}
                  <TableCell align="center" sx={{ py: 1.2 }}>
                    <MarketSparkline
                      data={item.sparkline}
                      isPositive={isPositive}
                      width={85}
                      height={26}
                    />
                  </TableCell>

                  {/* % Change */}
                  <TableCell align="right" sx={{ py: 1.5 }}>
                    <Chip
                      size="small"
                      icon={isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      label={`${isPositive ? '+' : ''}${item.changePercent.toFixed(2)}%`}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        fontFamily: 'monospace',
                        bgcolor: isPositive
                          ? isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.2)'
                          : isLight ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.2)',
                        color: isPositive
                          ? isLight ? '#059669' : '#10b981'
                          : isLight ? '#dc2626' : '#ef4444',
                        borderRadius: 1.5,
                        px: 0.5,
                      }}
                    />
                  </TableCell>

                  {/* Volume */}
                  <TableCell align="right" sx={{ py: 1.5, color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {formatVolume(item.volume)}
                  </TableCell>

                  {/* Market Cap */}
                  <TableCell align="right" sx={{ py: 1.5, color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {formatMarketCap(item.marketCap.toString())}
                  </TableCell>

                  {/* Action */}
                  <TableCell align="center" sx={{ py: 1.5 }}>
                    <Tooltip title="นำรหัสหุ้นนี้ไปวางแผนการเข้าซื้อในหน้า Stock Grid Planner" arrow>
                      <IconButton
                        size="small"
                        onClick={() => handlePlanStock(item)}
                        sx={{
                          color: '#10b981',
                          bgcolor: isLight ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.15)',
                          '&:hover': {
                            bgcolor: isLight ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.3)',
                          },
                        }}
                      >
                        <Calculator size={16} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MarketTable;
