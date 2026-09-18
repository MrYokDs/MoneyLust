/**
 * Route: /portfolio/:id
 * Section: PlanGridView (แสดงรายการแผนการลงทุนในรูปแบบ Grid Cards)
 */

import React from 'react';
import {
  Grid,
  Box,
  Stack,
  Typography,
  Chip,
  IconButton,
  Divider,
  Button,
  useTheme,
} from '@mui/material';
import { Calendar, Trash2, ExternalLink } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { TimelineItem } from '../types';
import { CalculationResult, formatCurrency } from '../../../utils/stockMath';

interface PlanGridViewProps {
  items: TimelineItem[];
  onLoadPlan: (plan: CalculationResult) => void;
  onDeletePlan: (id: string, symbol: string) => void;
  formatDate: (dateStr: string) => string;
  getRoundingModeName: (mode: string) => string;
}

export const PlanGridView: React.FC<PlanGridViewProps> = ({
  items,
  onLoadPlan,
  onDeletePlan,
  formatDate,
  getRoundingModeName,
}) => {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      {items.map((item) => {
        if (item.type === 'adjustment') {
          const adj = item.data;
          const isDeposit = adj.amountChange > 0;
          return (
            <Grid size={{ xs: 12 }} key={`adj-${adj.id}`}>
              <GlassCard
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDeposit
                    ? 'rgba(16, 185, 129, 0.05)'
                    : 'rgba(239, 68, 68, 0.05)',
                  borderRadius: 2,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Calendar size={14} color={isDeposit ? '#10b981' : '#ef4444'} />
                    <Typography variant="body2" color="text.secondary" fontSize="0.85rem">
                      {formatDate(adj.date)}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color={isDeposit ? 'success.main' : 'error.main'}
                  >
                    {isDeposit ? 'เติมเงินเข้าพอร์ต' : 'ถอนเงินออกจากพอร์ต'} จำนวน{' '}
                    {formatCurrency(Math.abs(adj.amountChange), 'USD', false)}
                  </Typography>
                </Stack>
              </GlassCard>
            </Grid>
          );
        }

        const plan = item.data;
        return (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={`plan-${plan.id}`}>
            <GlassCard
              hoverEffect
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background:
                  theme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)'
                    : 'linear-gradient(135deg, rgba(17, 25, 40, 0.6) 0%, rgba(10, 15, 25, 0.8) 100%)',
                border:
                  theme.palette.mode === 'light'
                    ? '1px solid rgba(0, 0, 0, 0.08)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <Box>
                {/* Card Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="h5" fontWeight="900" color="primary.light">
                        {plan.stockSymbol}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${plan.tranchesCount} ไม้`}
                        color="secondary"
                        variant="outlined"
                        sx={{ fontWeight: 'bold', height: 20, fontSize: '0.75rem' }}
                      />
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center" mt={0.5} color="text.secondary">
                      <Calendar size={12} />
                      <Typography variant="caption" sx={{ fontFamily: 'Prompt' }}>
                        {formatDate(plan.createdAt)}
                      </Typography>
                    </Stack>
                  </Stack>

                  <IconButton
                    onClick={() => onDeletePlan(plan.id, plan.stockSymbol)}
                    size="small"
                    color="error"
                    sx={{
                      opacity: 0.6,
                      '&:hover': {
                        opacity: 1,
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      },
                    }}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Stack>

                <Divider sx={{ opacity: 0.05, my: 1.5 }} />

                {/* Plan Specs */}
                <Stack spacing={1.5} mb={3}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      วันที่ขายหุ้น:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {plan.soldAt ? formatDate(plan.soldAt) : '-'}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      งบลงทุนจริงรวม:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(
                        plan.actualSpent ?? plan.totalBudget,
                        plan.currency || 'THB',
                        (plan.currency || 'THB') === 'USD',
                        plan.exchangeRate || 36.5
                      )}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      รูปแบบการซื้อ:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'Prompt' }}>
                      {getRoundingModeName(plan.roundingMode)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      ต้นทุนเฉลี่ย:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(
                        plan.actualAverageCost ?? plan.finalAverageCost,
                        plan.currency || 'THB',
                        false,
                        plan.exchangeRate || 36.5
                      )}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      ราคาขาย:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {plan.actualSellPrice
                        ? formatCurrency(
                            plan.actualSellPrice,
                            plan.currency || 'THB',
                            false,
                            plan.exchangeRate || 36.5
                          )
                        : '-'}
                    </Typography>
                  </Stack>

                  <Divider sx={{ opacity: 0.05 }} />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      กำไร/ขาดทุนจริง:
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      fontWeight="900"
                      color={
                        (plan.actualRealizedProfitLossAmount ?? plan.realizedProfitLossAmount ?? 0) >= 0
                          ? 'success.main'
                          : 'error.main'
                      }
                    >
                      {plan.actualSellPrice
                        ? `${formatCurrency(
                            plan.actualRealizedProfitLossAmount ?? plan.realizedProfitLossAmount ?? 0,
                            plan.currency || 'THB',
                            (plan.currency || 'THB') === 'USD',
                            plan.exchangeRate || 36.5
                          )} (${(
                            plan.actualRealizedProfitLossPercent ??
                            plan.realizedProfitLossPercent ??
                            0
                          ).toFixed(2)}%)`
                        : '-'}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>

              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => onLoadPlan(plan)}
                  startIcon={<ExternalLink size={16} />}
                  sx={{
                    borderRadius: 3,
                    fontFamily: 'Prompt',
                    fontWeight: 'bold',
                    py: 1,
                  }}
                >
                  โหลดแผนนี้เข้าสู่เครื่องมือ
                </Button>
              </Box>
            </GlassCard>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default PlanGridView;
