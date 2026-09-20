/**
 * Route: /portfolio/:id
 * Section: PortfolioSummaryCards (การ์ดสรุปภาพรวมงบประมาณ เงินลงทุนที่ใช้ไป และเงินคงเหลือของพอร์ต)
 */

import React, { useState } from 'react';
import {
  Grid,
  Typography,
  Stack,
  Box,
  TextField,
  Button,
  IconButton,
  Chip,
} from '@mui/material';
import { Edit2, TrendingUp, TrendingDown } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { PortfolioSummary, formatCurrency } from '../../../utils/stockMath';

interface PortfolioSummaryCardsProps {
  summary: PortfolioSummary;
  exchangeRate: number;
  portfolioId: string;
  onUpdateCapital: (capital: number) => void;
}

export const PortfolioSummaryCards: React.FC<PortfolioSummaryCardsProps> = ({
  summary,
  exchangeRate,
  portfolioId,
  onUpdateCapital,
}) => {
  const [isEditingCapital, setIsEditingCapital] = useState(false);
  const [editedCapital, setEditedCapital] = useState('');

  if (portfolioId === 'unassigned') {
    return null;
  }

  const profitLossDiff = summary.currentPortfolioValue - summary.initialCapital;
  const isProfit = profitLossDiff >= 0;

  return (
    <Grid container spacing={3} mb={4}>
      {/* 1. Initial Capital */}
      <Grid size={{ xs: 12, md: 4 }}>
        <GlassCard
          sx={{
            p: 2.5,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary" fontFamily="Prompt" mb={1}>
            มูลค่าต้นทุนตั้งต้น
          </Typography>
          {isEditingCapital ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                value={editedCapital}
                onChange={(e) => setEditedCapital(e.target.value)}
                type="number"
                autoFocus
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="contained"
                color="primary"
                size="small"
                sx={{ minWidth: 0, p: 1, px: 2, fontFamily: 'Prompt' }}
                onClick={() => {
                  onUpdateCapital(Number(editedCapital));
                  setIsEditingCapital(false);
                }}
              >
                บันทึก
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Box>
                <Typography variant="h5" fontWeight="bold" fontFamily="Prompt">
                  {formatCurrency(summary.initialCapital, 'USD', false)}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', fontFamily: 'Prompt', opacity: 0.8 }}
                >
                  ≈ {formatCurrency(summary.initialCapital * exchangeRate, 'THB', false)}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => {
                  setEditedCapital(summary.initialCapital.toString());
                  setIsEditingCapital(true);
                }}
                sx={{ opacity: 0.6, '&:hover': { opacity: 1 }, mt: -0.5 }}
              >
                <Edit2 size={16} />
              </IconButton>
            </Stack>
          )}
        </GlassCard>
      </Grid>

      {/* 2. Current Value */}
      <Grid size={{ xs: 12, md: 4 }}>
        <GlassCard
          sx={{
            p: 2.5,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <Typography variant="body2" color="text.secondary" fontFamily="Prompt">
              มูลค่าพอร์ตปัจจุบัน
            </Typography>
            {summary.initialCapital > 0 && (
              <Chip
                size="small"
                icon={isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                label={`${isProfit ? '+' : ''}${((profitLossDiff / summary.initialCapital) * 100).toFixed(2)}%`}
                color={isProfit ? 'success' : 'error'}
                sx={{
                  height: 22,
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  fontFamily: 'Prompt',
                  '& .MuiChip-icon': { ml: 0.5 },
                }}
              />
            )}
          </Stack>
          <Typography
            variant="h5"
            fontWeight="bold"
            fontFamily="Prompt"
            color={isProfit ? 'success.main' : 'error.main'}
          >
            {formatCurrency(summary.currentPortfolioValue, 'USD', false)}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', fontFamily: 'Prompt', opacity: 0.8 }}
          >
            ≈ {formatCurrency(summary.currentPortfolioValue * exchangeRate, 'THB', false)}
          </Typography>
        </GlassCard>
      </Grid>

      {/* 3. Available Cash */}
      <Grid size={{ xs: 12, md: 4 }}>
        <GlassCard
          sx={{
            p: 2.5,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary" fontFamily="Prompt" mb={1}>
            มูลค่าเงินที่ลงทุนได้
          </Typography>
          <Typography variant="h5" fontWeight="bold" fontFamily="Prompt" color="info.main">
            {formatCurrency(summary.availableCash, 'USD', false)}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', fontFamily: 'Prompt', opacity: 0.8 }}
          >
            ≈ {formatCurrency(summary.availableCash * exchangeRate, 'THB', false)}
          </Typography>
        </GlassCard>
      </Grid>
    </Grid>
  );
};

export default PortfolioSummaryCards;
