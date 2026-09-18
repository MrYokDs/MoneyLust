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
  useTheme,
} from '@mui/material';
import { FolderHeart, TrendingUp, Trash2, LayoutGrid, List } from 'lucide-react';

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
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <FolderHeart size={26} color="#10b981" />
        <Typography variant="h5" fontWeight="bold" fontFamily="Prompt">
          {portfolioName} ({plansCount})
        </Typography>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center">
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={onAddNewPlan}
          startIcon={<TrendingUp size={16} />}
          sx={{ borderRadius: 3, fontFamily: 'Prompt', fontWeight: 'bold' }}
        >
          สร้างแผนลงทุนใหม่
        </Button>

        {portfolioId !== 'unassigned' && (
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={onDeletePortfolio}
            startIcon={<Trash2 size={16} />}
            sx={{ borderRadius: 3, fontFamily: 'Prompt' }}
          >
            ลบพอร์ตนี้
          </Button>
        )}

        {hasTimelineItems && (
          <>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, val) => val && onViewModeChange(val)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.5,
                  py: 0.5,
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

            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={onClearAll}
              startIcon={<Trash2 size={16} />}
              sx={{ borderRadius: 3 }}
            >
              ล้างแผนทั้งหมด
            </Button>
          </>
        )}
      </Stack>
    </Stack>
  );
};

export default PortfolioHeader;
