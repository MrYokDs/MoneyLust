/**
 * Route: /
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
  useTheme,
} from '@mui/material';
import { TrendingDown } from 'lucide-react';
import { StockOption, StockDetail } from '../types';

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
  const [open, setOpen] = React.useState(false);

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
        <Box
          mt={1.5}
          p={1.5}
          sx={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
          }}
        >
          <Typography
            variant="body2"
            fontWeight="bold"
            color="#10b981"
            sx={{ fontFamily: 'Prompt', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            🏢 {stockDetail.name}
          </Typography>
          <Grid container spacing={1} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                มูลค่าตลาด (Market Cap)
              </Typography>
              <Typography variant="body2" fontWeight="bold" sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
                {stockDetail.marketCap}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                ปันผล / อัตราค่าดำเนินการ
              </Typography>
              <Typography variant="body2" fontWeight="bold" sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
                {stockDetail.yield}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                ราคาปิดวันก่อนหน้า
              </Typography>
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{
                  color: '#10b981',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
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
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                ราคารอบ 52 สัปดาห์
              </Typography>
              <Typography variant="body2" fontWeight="bold" sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
                {stockDetail.fiftyTwoWeekRange}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}
    </>
  );
};

export default StockSearchSection;
