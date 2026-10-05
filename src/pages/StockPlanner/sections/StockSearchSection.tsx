/**
 * Route: /planner
 * Section: StockSearchSection (ส่วนค้นหาและแสดงรายละเอียดราคา/สถานะของหุ้น)
 */

import React from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Autocomplete,
  Stack,
  Chip,
  useTheme,
} from '@mui/material';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { StockOption, StockDetail } from '../types';
import CompanyInsightsCard from './CompanyInsightsCard';
import InfoTooltipLabel from '../../../components/InfoTooltipLabel';

interface StockSearchSectionProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  options: StockOption[];
  loading: boolean;
  stockDetail: StockDetail | null;
  loadingDetail: boolean;
  onSelectStock: (symbol: string) => void;
  onApplyPrice: (price: string) => void;
}

export const StockSearchSection: React.FC<StockSearchSectionProps> = ({
  inputValue,
  setInputValue,
  options,
  loading,
  stockDetail,
  loadingDetail,
  onSelectStock,
  onApplyPrice,
}) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [open, setOpen] = React.useState(false);

  // เอฟเฟกต์กระพริบไฟ (Ticker Flash) เมื่อราคา Real-Time ขยับขึ้นหรือลง
  const prevPriceRef = React.useRef<number | undefined>(undefined);
  const [flash, setFlash] = React.useState<'up' | 'down' | null>(null);

  React.useEffect(() => {
    const livePrice = stockDetail?.realTimeQuote?.currentPrice;
    if (livePrice !== undefined && prevPriceRef.current !== undefined && prevPriceRef.current !== livePrice) {
      setFlash(livePrice > prevPriceRef.current ? 'up' : 'down');
      const timer = setTimeout(() => setFlash(null), 700);
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = livePrice;
    return undefined;
  }, [stockDetail?.realTimeQuote?.currentPrice]);

  const quote = stockDetail?.realTimeQuote;
  const isPositive = quote ? quote.change > 0 : false;
  const isNegative = quote ? quote.change < 0 : false;

  return (
    <>
      <Autocomplete
        freeSolo
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => {
          setInputValue(newInputValue);
          onSelectStock(newInputValue.toUpperCase());
        }}
        onChange={(_, newValue) => {
          if (typeof newValue === 'string') {
            onSelectStock(newValue.toUpperCase());
          } else if (newValue && typeof newValue === 'object') {
            onSelectStock(newValue.symbol);
          }
        }}
        options={options}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option.symbol;
        }}
        renderOption={(props, option) => {
          const { key, ...otherProps } = props as any;
          return (
            <Box
              component="li"
              key={key || option.symbol}
              {...otherProps}
              sx={{
                p: '8px 16px !important',
                borderBottom:
                  theme.palette.mode === 'light'
                    ? '1px solid rgba(0,0,0,0.04)'
                    : '1px solid rgba(255,255,255,0.04)',
                '&:hover': {
                  backgroundColor:
                    theme.palette.mode === 'light'
                      ? 'rgba(16, 185, 129, 0.08) !important'
                      : 'rgba(16, 185, 129, 0.15) !important',
                },
              }}
            >
              <Grid container alignItems="center" spacing={1}>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="body2" fontWeight="bold" color="#10b981">
                    {option.symbol}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 9 }}>
                  <Typography variant="body2" color="text.primary" fontWeight="500" noWrap>
                    {option.name}
                  </Typography>
                  <Stack direction="row" spacing={1} mt={0.5}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      🏢 {option.exchange}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      🏷️ {option.type}
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="ชื่อหุ้น / สินทรัพย์"
            placeholder="ระบุสัญลักษณ์หุ้น เช่น AAPL, NVDA, TSLA"
            fullWidth
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <TrendingDown size={18} color="#9ca3af" />
                </InputAdornment>
              ),
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
      />

      {/* Dynamic company details badge */}
      {loadingDetail && (
        <Box display="flex" alignItems="center" gap={1} mt={1} pl={1}>
          <CircularProgress size={16} sx={{ color: '#10b981' }} />
          <Typography variant="caption" sx={{ fontFamily: 'Prompt', color: 'text.secondary' }}>
            กำลังดึงข้อมูลบริษัทและมูลค่าตลาดล่าสุด...
          </Typography>
        </Box>
      )}

      {!loadingDetail && stockDetail && (
        <>
          <Box
            mt={1.5}
            p={1.5}
            sx={{
              background: isLight ? 'rgba(16, 185, 129, 0.04)' : 'rgba(16, 185, 129, 0.06)',
              border: '1px solid',
              borderColor: isLight ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
            }}
          >
            {/* Header: Company Name & Webull Live Badge */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} flexWrap="wrap" gap={1}>
              <Typography
                variant="body2"
                fontWeight="bold"
                color="#10b981"
                sx={{ fontFamily: 'Prompt', display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                🏢 {stockDetail.name}
              </Typography>
              {quote && (
                <Chip
                  size="small"
                  label="Webull OpenAPI Live"
                  sx={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    height: 20,
                    bgcolor: isLight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                />
              )}
            </Box>

            {/* Webull Real-Time Quote Banner (ราคา ณ เวลานั้น + % การเปลี่ยนแปลงจากวันก่อนหน้า) */}
            {quote && (
              <Box
                sx={{
                  mb: 1.5,
                  p: 1.5,
                  borderRadius: '8px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  border: '1px solid',
                  borderColor:
                    flash === 'up'
                      ? 'rgba(16, 185, 129, 0.8)'
                      : flash === 'down'
                      ? 'rgba(239, 68, 68, 0.8)'
                      : isLight
                      ? 'rgba(0, 0, 0, 0.08)'
                      : 'rgba(255, 255, 255, 0.08)',
                  background:
                    flash === 'up'
                      ? 'rgba(16, 185, 129, 0.16)'
                      : flash === 'down'
                      ? 'rgba(239, 68, 68, 0.16)'
                      : isLight
                      ? '#ffffff'
                      : 'rgba(17, 24, 39, 0.7)',
                  boxShadow: flash
                    ? flash === 'up'
                      ? '0 0 16px rgba(16, 185, 129, 0.3)'
                      : '0 0 16px rgba(239, 68, 68, 0.3)'
                    : isLight
                    ? '0 2px 8px rgba(0,0,0,0.03)'
                    : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                {/* ฝั่งซ้าย: ราคา ณ เวลานั้น + สถานะตลาด */}
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <Chip
                      size="small"
                      label={quote.sessionLabel}
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        height: 22,
                        bgcolor:
                          quote.tradeStatus === 'PRE'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : quote.tradeStatus === 'POST'
                            ? 'rgba(139, 92, 246, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                        color:
                          quote.tradeStatus === 'PRE'
                            ? '#f59e0b'
                            : quote.tradeStatus === 'POST'
                            ? '#a78bfa'
                            : '#10b981',
                        border: '1px solid',
                        borderColor:
                          quote.tradeStatus === 'PRE'
                            ? 'rgba(245, 158, 11, 0.3)'
                            : quote.tradeStatus === 'POST'
                            ? 'rgba(139, 92, 246, 0.3)'
                            : 'rgba(16, 185, 129, 0.3)',
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.72rem',
                        color: 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          bgcolor: '#10b981',
                          boxShadow: '0 0 8px #10b981',
                          display: 'inline-block',
                        }}
                      />
                      Live ({quote.lastUpdated})
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 1,
                      cursor: 'pointer',
                      '&:hover .apply-price-hint': {
                        textDecoration: 'underline',
                        color: '#34d399',
                      },
                    }}
                    onClick={() => {
                      onApplyPrice(quote.currentPrice.toString());
                    }}
                  >
                    <Typography
                      variant="h5"
                      fontWeight="800"
                      sx={{
                        fontSize: { xs: '1.4rem', sm: '1.65rem' },
                        color: isPositive ? '#10b981' : isNegative ? '#ef4444' : 'text.primary',
                        letterSpacing: '-0.5px',
                      }}
                    >
                      ${quote.currentPrice.toFixed(quote.currentPrice > 10 ? 2 : 4)}
                    </Typography>
                    <Typography
                      className="apply-price-hint"
                      variant="caption"
                      sx={{
                        fontSize: '0.72rem',
                        color: '#10b981',
                        fontWeight: 600,
                      }}
                    >
                      (คลิกเพื่อใช้ราคานี้)
                    </Typography>
                  </Box>
                </Box>

                {/* ฝั่งขวา: % เปลี่ยนแปลงจากวันก่อนหน้า ณ เวลานั้น */}
                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary', display: 'block', mb: 0.25 }}>
                    เปลี่ยนแปลงจากวันก่อนหน้า ณ เวลานั้น
                  </Typography>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
                  >
                    {isPositive ? (
                      <TrendingUp size={18} color="#10b981" />
                    ) : isNegative ? (
                      <TrendingDown size={18} color="#ef4444" />
                    ) : null}
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{
                        color: isPositive ? '#10b981' : isNegative ? '#ef4444' : 'text.secondary',
                        fontSize: '1.05rem',
                      }}
                    >
                      {isPositive ? '+' : ''}
                      {quote.change.toFixed(Math.abs(quote.change) > 1 ? 2 : 4)}{' '}
                      ({isPositive ? '+' : ''}
                      {quote.changePercent.toFixed(2)}%)
                    </Typography>
                  </Stack>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    ราคาปิดก่อนหน้า: ${quote.preClose.toFixed(quote.preClose > 10 ? 2 : 4)}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* ตารางข้อมูลพื้นฐาน 6 ช่อง */}
            <Grid container spacing={1} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6, sm: 4 }}>
                <InfoTooltipLabel
                  label="มูลค่าตลาด (Market Cap)"
                  tooltip="มูลค่ารวมของบริษัทตามราคาตลาด (Market Capitalization) คำนวณจาก ราคาหุ้น × จำนวนหุ้นทั้งหมด บ่งบอกขนาดและความมั่นคงของกิจการ"
                />
                <Typography variant="body2" fontWeight="bold" sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
                  {stockDetail.marketCap}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <InfoTooltipLabel
                  label="ปันผล / อัตราค่าดำเนินการ"
                  tooltip="อัตราเงินปันผลตอบแทนต่อปี (Dividend Yield) หรืออัตราค่าธรรมเนียมบริหารจัดการกองทุน (Expense Ratio สำหรับ ETF) เทียบกับราคาหุ้นปัจจุบัน"
                />
                <Typography variant="body2" fontWeight="bold" sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
                  {stockDetail.yield}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <InfoTooltipLabel
                  label="อัตราส่วน P/E (PER)"
                  tooltip="ราคาหุ้นเทียบกับกำไรต่อหุ้น (Price to Earnings) บ่งบอกว่าผู้ลงทุนยอมจ่ายกี่เท่าของกำไร ยิ่งต่ำอาจหมายถึงหุ้นราคาไม่แพง (หากบริษัทขาดทุนจะไม่มีค่า P/E)"
                />
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  sx={{
                    color: stockDetail.peRatio && stockDetail.peRatio !== '-' ? '#10b981' : 'text.primary',
                    fontSize: '0.85rem',
                  }}
                >
                  {stockDetail.peRatio || '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <InfoTooltipLabel
                  label="อัตราส่วน P/B (PBR)"
                  tooltip="ราคาหุ้นเทียบกับมูลค่าทางบัญชี (Price to Book Value) หาก P/B ต่ำกว่า 1 หมายถึงซื้อหุ้นได้ต่ำกว่ามูลค่าทรัพย์สินสุทธิทางบัญชีของบริษัท"
                />
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  sx={{
                    color: stockDetail.pbRatio && stockDetail.pbRatio !== '-' ? '#10b981' : 'text.primary',
                    fontSize: '0.85rem',
                  }}
                >
                  {stockDetail.pbRatio || '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <InfoTooltipLabel
                  label="ราคาปิดวันก่อนหน้า"
                  tooltip="ราคาซื้อขายล่าสุด ณ เวลาปิดตลาดของวันทำการก่อนหน้า ใช้เป็นราคาอ้างอิงเริ่มต้นสำหรับคำนวณและวางแผน (คลิกที่ราคาเพื่อนำไปกรอกได้ทันที)"
                />
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  sx={{
                    color: '#10b981',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    '&:hover': { textDecoration: 'underline', color: '#34d399' },
                  }}
                  onClick={() => {
                    const cleanPrice = stockDetail.previousClose.replace(/[^0-9.]/g, '');
                    if (cleanPrice) {
                      onApplyPrice(cleanPrice);
                    }
                  }}
                >
                  {stockDetail.previousClose}{' '}
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                    (คลิกเพื่อกรอก)
                  </Typography>
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <InfoTooltipLabel
                  label="ราคารอบ 52 สัปดาห์"
                  tooltip="กรอบราคาสูงสุดและต่ำสุดในรอบ 1 ปีที่ผ่านมา ช่วยประเมินว่าระดับราคาปัจจุบันอยู่ในช่วงต่ำ กลาง หรือสูง เมื่อเทียบกับสถิติรอบปี"
                />
                <Typography variant="body2" fontWeight="bold" sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
                  {stockDetail.fiftyTwoWeekRange}
                </Typography>
              </Grid>
            </Grid>
          </Box>
          <CompanyInsightsCard stockDetail={stockDetail} />
        </>
      )}
    </>
  );
};

export default StockSearchSection;
