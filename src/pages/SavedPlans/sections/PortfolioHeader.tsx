/**
 * Route: /portfolio/:id
 * Section: PortfolioHeader (ส่วนหัวพอร์ตโฟลิโอ ปุ่มสลับมุมมอง Grid/Table และปุ่มลบพอร์ต)
 */

import React from 'react';
import {
  Stack,
  Typography,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  useTheme,
} from '@mui/material';
import { FolderHeart, TrendingUp, Trash2, FolderX, LayoutGrid, List } from 'lucide-react';

interface PortfolioHeaderProps {
  portfolioName: string;
  plansCount: number;
  portfolioId: string;
  hasTimelineItems: boolean;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  onAddNewPlan: () => void;
  onDeletePortfolio: () => void;
  onClearAll: () => void;
}

export const PortfolioHeader: React.FC<PortfolioHeaderProps> = ({
  portfolioName,
  plansCount,
  portfolioId,
  hasTimelineItems,
  viewMode,
  onViewModeChange,
  onAddNewPlan,
  onDeletePortfolio,
  onClearAll,
}) => {
  const theme = useTheme();

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <FolderHeart size={26} color="#10b981" />
        <Typography variant="h5" fontWeight="bold" fontFamily="Prompt">
          {portfolioName} ({plansCount})
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
        {/* 1. ปุ่มสร้างแผนการเทรดใหม่ (Action หลัก) */}
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={onAddNewPlan}
          startIcon={<TrendingUp size={16} />}
          sx={{ borderRadius: '12px', fontFamily: 'Prompt', fontWeight: 'bold' }}
        >
          สร้างแผนการเทรดใหม่
        </Button>

        {/* 2. ปุ่มล้างแผนทั้งหมด (โทนส้มแอมเบอร์สไตล์เดียวกับปุ่มหลัก) */}
        {hasTimelineItems && (
          <Button
            variant="contained"
            size="small"
            onClick={onClearAll}
            startIcon={<Trash2 size={16} />}
            sx={{
              borderRadius: '12px',
              fontFamily: 'Prompt',
              fontWeight: 'bold',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              boxShadow: 'none',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
              },
            }}
          >
            ล้างแผนทั้งหมด
          </Button>
        )}

        {/* 3. ปุ่มลบพอร์ตนี้ (โทนแดง Gradient สไตล์เดียวกับปุ่มหลัก) */}
        {portfolioId !== 'unassigned' && (
          <Button
            variant="contained"
            size="small"
            onClick={onDeletePortfolio}
            startIcon={<FolderX size={16} />}
            sx={{
              borderRadius: '12px',
              fontFamily: 'Prompt',
              fontWeight: 'bold',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: 'none',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #f87171 0%, #b91c1c 100%)',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
              },
            }}
          >
            ลบพอร์ตนี้
          </Button>
        )}

        {/* 4. ส่วนสลับมุมมอง Grid / ตาราง (จัดวางไว้ทางขวาสุด) */}
        {hasTimelineItems && (
          <>
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                mx: 0.5,
                height: 24,
                alignSelf: 'center',
                borderColor:
                  theme.palette.mode === 'light'
                    ? 'rgba(0,0,0,0.1)'
                    : 'rgba(255,255,255,0.1)',
              }}
            />

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, val) => val && onViewModeChange(val)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '10px',
                  border:
                    theme.palette.mode === 'light'
                      ? '1px solid rgba(0,0,0,0.08)'
                      : '1px solid rgba(255,255,255,0.08)',
                  color: 'text.secondary',
                  fontFamily: 'Prompt',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderColor: '#10b981',
                    color: '#10b981',
                  },
                },
              }}
            >
              <ToggleButton value="grid" aria-label="grid view">
                <LayoutGrid size={16} style={{ marginRight: 6 }} />
                Grid
              </ToggleButton>
              <ToggleButton value="table" aria-label="table view">
                <List size={16} style={{ marginRight: 6 }} />
                ตาราง
              </ToggleButton>
            </ToggleButtonGroup>
          </>
        )}
      </Stack>
    </Stack>
  );
};

export default PortfolioHeader;
