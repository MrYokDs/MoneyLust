/**
 * Route: /portfolio/:id
 * Section: PlanTableView (แสดงรายการแผนการลงทุนในรูปแบบ Table ตารางละเอียด)
 */

import React from 'react';
import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Typography,
  Tooltip,
  IconButton,
  TablePagination,
  useTheme,
} from '@mui/material';
import { Calendar, ExternalLink, Trash2 } from 'lucide-react';
import { TimelineItem } from '../types';
import { CalculationResult, formatCurrency } from '../../../utils/stockMath';

interface PlanTableViewProps {
  items: TimelineItem[];
  totalCount: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  onLoadPlan: (plan: CalculationResult) => void;
  onDeletePlan: (id: string, symbol: string) => void;
  formatDate: (dateStr: string) => string;
  getRoundingModeName: (mode: string) => string;
}

export const PlanTableView: React.FC<PlanTableViewProps> = ({
  items,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onLoadPlan,
  onDeletePlan,
  formatDate,
  getRoundingModeName,
}) => {
  const theme = useTheme();

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 0,
          overflow: 'hidden',
          background:
            theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.7)'
              : 'rgba(17, 25, 40, 0.4)',
          backdropFilter: 'blur(16px)',
          border:
            theme.palette.mode === 'light'
              ? '1px solid rgba(0, 0, 0, 0.08)'
              : '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: 'none',
        }}
      >
        <Table>
          <TableHead
            sx={{
              backgroundColor:
                theme.palette.mode === 'light'
                  ? 'rgba(0, 0, 0, 0.02)'
                  : 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <TableRow>
              <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}>
                ชื่อหุ้น
              </TableCell>
              <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}>
                วันที่ซื้อหุ้น
              </TableCell>
              <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}>
                วันที่ขายหุ้น
              </TableCell>
              <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}>
                งบลงทุนจริงรวม
              </TableCell>
              <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}>
                รูปแบบการซื้อ
              </TableCell>
              <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}>
                ต้นทุนเฉลี่ย
              </TableCell>
              <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}>
                ราคาขาย
              </TableCell>
              <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}>
                สรุปกำไรขาดทุนจริง
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}
              >
                จัดการ
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              if (item.type === 'adjustment') {
                const adj = item.data;
                const isDeposit = adj.amountChange > 0;
                return (
                  <TableRow
                    key={`adj-${adj.id}`}
                    sx={{
                      backgroundColor: isDeposit
                        ? 'rgba(16, 185, 129, 0.05)'
                        : 'rgba(239, 68, 68, 0.05)',
                    }}
                  >
                    <TableCell colSpan={9} align="center" sx={{ fontFamily: 'Prompt', py: 1.5 }}>
                      <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
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
                    </TableCell>
                  </TableRow>
                );
              }

              const plan = item.data;
              return (
                <TableRow
                  key={`plan-${plan.id}`}
                  sx={{
                    '&:hover': {
                      backgroundColor:
                        theme.palette.mode === 'light'
                          ? 'rgba(0, 0, 0, 0.03)'
                          : 'rgba(255, 255, 255, 0.02)',
                    },
                    transition: 'background-color 0.2s',
                    borderBottom:
                      theme.palette.mode === 'light'
                        ? '1px solid rgba(0, 0, 0, 0.06)'
                        : '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <TableCell sx={{ fontWeight: '900', color: 'primary.light', fontSize: '1rem' }}>
                    {plan.stockSymbol}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Prompt' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Calendar size={14} color="#10b981" />
                      <Typography variant="body2" sx={{ fontFamily: 'Prompt', fontSize: '0.85rem' }}>
                        {formatDate(plan.createdAt)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Prompt' }}>
                    {plan.soldAt ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Calendar size={14} color="#ef4444" />
                        <Typography variant="body2" sx={{ fontFamily: 'Prompt', fontSize: '0.85rem' }}>
                          {formatDate(plan.soldAt)}
                        </Typography>
                      </Stack>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(
                      plan.actualSpent ?? plan.totalBudget,
                      plan.currency || 'THB',
                      (plan.currency || 'THB') === 'USD',
                      plan.exchangeRate || 36.5
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Prompt' }}>
                    {getRoundingModeName(plan.roundingMode)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(
                      plan.actualAverageCost ?? plan.finalAverageCost,
                      plan.currency || 'THB',
                      false,
                      plan.exchangeRate || 36.5
                    )}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {plan.actualSellPrice
                      ? formatCurrency(
                          plan.actualSellPrice,
                          plan.currency || 'THB',
                          false,
                          plan.exchangeRate || 36.5
                        )
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
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
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1.5} justifyContent="center">
                      <Tooltip title="โหลดแผนนี้เข้าสู่เครื่องมือ">
                        <IconButton
                          onClick={() => onLoadPlan(plan)}
                          size="small"
                          color="primary"
                          sx={{
                            backgroundColor: 'rgba(16, 185, 129, 0.06)',
                            border: '1px solid rgba(16, 185, 129, 0.1)',
                            '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                          }}
                        >
                          <ExternalLink size={15} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ลบแผนนี้">
                        <IconButton
                          onClick={() => onDeletePlan(plan.id, plan.stockSymbol)}
                          size="small"
                          color="error"
                          sx={{
                            backgroundColor: 'rgba(239, 68, 68, 0.06)',
                            border: '1px solid rgba(239, 68, 68, 0.1)',
                            '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                          }}
                        >
                          <Trash2 size={15} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[5, 10, 15, 20, 25]}
        labelRowsPerPage="แสดงรายการต่อหน้า:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
        sx={{
          mt: 2,
          borderTop: 'none',
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            fontFamily: 'Prompt',
          },
          '& .MuiTablePagination-select': {
            fontFamily: 'Prompt',
          },
        }}
      />
    </>
  );
};

export default PlanTableView;
