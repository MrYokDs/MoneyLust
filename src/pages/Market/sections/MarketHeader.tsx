/** Route: /market */
/**
 * Component: MarketHeader.tsx
 * แถบหัวข้อหน้าตลาดหุ้น ประกอบด้วยแท็บ Top Gainers / Top Losers, เมนูเลือกช่วงเวลา และปุ่มรีเฟรช
 */

import React from 'react';
import {
  Box,
  Stack,
  Typography,
  Tabs,
  Tab,
  Button,
  Menu,
  MenuItem,
  CircularProgress,
  Chip,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  RefreshCw,
  Clock,
  Radio,
} from 'lucide-react';
import {
  MarketDirection,
  MarketPeriod,
  MARKET_PERIOD_OPTIONS,
} from '../types';

interface MarketHeaderProps {
  direction: MarketDirection;
  onDirectionChange: (dir: MarketDirection) => void;
  period: MarketPeriod;
  onPeriodChange: (p: MarketPeriod) => void;
  isLoading: boolean;
  onRefresh: () => void;
  lastUpdated: string | null;
  source: string;
}

/**
 * คอมโพเนนต์ส่วนหัวของหน้าตลาดหุ้น สำหรับสลับแท็บและเลือกช่วงเวลา
 * 
 * @param props - พารามิเตอร์ควบคุมแท็บ ช่วงเวลา และสถานะการโหลด
 * @returns JSX Element สำหรับ Header
 */
export const MarketHeader: React.FC<MarketHeaderProps> = ({
  direction,
  onDirectionChange,
  period,
  onPeriodChange,
  isLoading,
  onRefresh,
  lastUpdated,
  source,
}) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const handleOpenPeriodMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePeriodMenu = () => {
    setAnchorEl(null);
  };

  const handleSelectPeriod = (newPeriod: MarketPeriod) => {
    onPeriodChange(newPeriod);
    handleClosePeriodMenu();
  };

  const currentPeriodOption = MARKET_PERIOD_OPTIONS.find((o) => o.value === period) || MARKET_PERIOD_OPTIONS[0];

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: '12px',
        bgcolor: isLight ? '#ffffff' : 'rgba(17, 24, 39, 0.7)',
        border: '1px solid',
        borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : '0 4px 20px rgba(0,0,0,0.2)',
        mb: 2.5,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
      >
        {/* Left Side: Tabs */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Tabs
            value={direction}
            onChange={(_e, val) => onDirectionChange(val)}
            sx={{
              minHeight: 44,
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                bgcolor: direction === 'gainers' ? '#10b981' : '#ef4444',
              },
            }}
          >
            <Tab
              value="gainers"
              icon={<TrendingUp size={18} color={direction === 'gainers' ? '#10b981' : undefined} />}
              iconPosition="start"
              label="Top Gainers (ขึ้นสูงสุด)"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                minHeight: 44,
                px: 2,
                color: direction === 'gainers' ? '#10b981 !important' : 'text.secondary',
              }}
            />
            <Tab
              value="losers"
              icon={<TrendingDown size={18} color={direction === 'losers' ? '#ef4444' : undefined} />}
              iconPosition="start"
              label="Top Losers (ลงต่ำสุด)"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                minHeight: 44,
                px: 2,
                color: direction === 'losers' ? '#ef4444 !important' : 'text.secondary',
              }}
            />
          </Tabs>

          <Chip
            size="small"
            icon={<Radio size={12} color="#10b981" />}
            label="Real-Time Webull Data"
            sx={{
              fontWeight: 600,
              fontSize: '0.72rem',
              bgcolor: isLight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: { xs: 'none', sm: 'inline-flex' },
            }}
          />
        </Stack>

        {/* Right Side: Period Dropdown + Refresh Button */}
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent={{ xs: 'space-between', md: 'flex-end' }}>
          {/* Period Selector Dropdown Button */}
          <Button
            variant="outlined"
            onClick={handleOpenPeriodMenu}
            endIcon={<ChevronDown size={16} />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 2,
              py: 0.8,
              fontWeight: 600,
              fontSize: '0.88rem',
              borderColor: isLight ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.15)',
              color: isLight ? 'text.primary' : '#f3f4f6',
              bgcolor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)',
              '&:hover': {
                borderColor: '#10b981',
                bgcolor: isLight ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.1)',
              },
            }}
          >
            {currentPeriodOption.label}
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleClosePeriodMenu}
            PaperProps={{
              sx: {
                borderRadius: 2.5,
                minWidth: 200,
                bgcolor: isLight ? '#ffffff' : '#1e293b',
                boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
                border: '1px solid',
                borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
              },
            }}
          >
            {MARKET_PERIOD_OPTIONS.map((opt) => (
              <MenuItem
                key={opt.value}
                selected={opt.value === period}
                onClick={() => handleSelectPeriod(opt.value)}
                sx={{
                  py: 1,
                  fontSize: '0.88rem',
                  fontWeight: opt.value === period ? 700 : 500,
                  color: opt.value === period ? '#10b981' : undefined,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{opt.label}</span>
                {opt.badge && (
                  <Chip
                    label={opt.badge}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      bgcolor: opt.value === 'preMarket' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                      color: opt.value === 'preMarket' ? '#38bdf8' : '#c084fc',
                    }}
                  />
                )}
              </MenuItem>
            ))}
          </Menu>

          {/* Refresh Button */}
          <Button
            variant="contained"
            onClick={onRefresh}
            disabled={isLoading}
            startIcon={
              isLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RefreshCw size={16} />
              )
            }
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              px: 2,
              py: 0.8,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              },
            }}
          >
            รีเฟรช
          </Button>
        </Stack>
      </Stack>

      {/* Sub-bar: Last update & Source */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mt: 1.5, pt: 1.2, borderTop: '1px solid', borderColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Clock size={14} color="#94a3b8" />
          <Typography variant="caption" color="text.secondary">
            อัปเดตล่าสุด: {lastUpdated || 'กำลังดึงข้อมูล...'}
          </Typography>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          แหล่งข้อมูล: <strong>{source.toUpperCase()}</strong> (Open API)
        </Typography>
      </Stack>
    </Box>
  );
};

export default MarketHeader;
