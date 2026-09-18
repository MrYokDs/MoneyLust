/**
 * Route: /
 * Section: TrancheDetailsTable (ตารางแสดงรายละเอียดการแบ่งไม้ ราคา จำนวนหุ้น และงบประมาณในแต่ละไม้)
 */

import React from 'react';
import {
  Paper,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  useTheme,
} from '@mui/material';
import { CalculationResult, formatCurrency, formatNumber } from '../../../utils/stockMath';

interface TrancheDetailsTableProps {
  calcResult: CalculationResult;
  currency: 'THB' | 'USD';
  exchangeRate: number;
  roundingMode: 'fractional' | 'integer' | 'boardlot';
}

export const TrancheDetailsTable: React.FC<TrancheDetailsTableProps> = ({
  calcResult,
  currency,
  exchangeRate,
  roundingMode,
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        border:
          theme.palette.mode === 'light'
            ? '1px solid rgba(0, 0, 0, 0.08)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        background:
          theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.7)'
            : 'rgba(17, 25, 40, 0.65)',
        backdropFilter: 'blur(16px) saturate(180%)',
        boxShadow:
          theme.palette.mode === 'light'
            ? '0 8px 32px 0 rgba(31, 38, 135, 0.05)'
            : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
      }}
    >
      <Typography variant="h6" fontWeight="bold" mb={2.5} fontFamily="Prompt">
        ตารางแสดงรายละเอียดรายไม้ (Tranche Details)
      </Typography>

      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow
              sx={{
                borderBottom:
                  theme.palette.mode === 'light'
                    ? '2px solid rgba(0,0,0,0.08)'
                    : '2px solid rgba(255,255,255,0.1)',
              }}
            >
              <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontFamily: 'Prompt' }}>
                ไม้ที่
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', color: 'text.secondary', fontFamily: 'Prompt' }}
                align="right"
              >
                ราคาซื้อเป้าหมาย
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', color: 'text.secondary', fontFamily: 'Prompt' }}
                align="right"
              >
                งบประมาณรายไม้
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', color: 'text.secondary', fontFamily: 'Prompt' }}
                align="right"
              >
                จำนวนหุ้นที่ได้
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', color: 'text.secondary', fontFamily: 'Prompt' }}
                align="right"
              >
                เงินใช้จริงรายไม้
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', color: 'primary.light', fontFamily: 'Prompt' }}
                align="right"
              >
                ต้นทุนเฉลี่ยของพอร์ต
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', color: 'primary.light', fontFamily: 'Prompt' }}
                align="right"
              >
                ลดต้นทุนได้ (%)
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {calcResult.tranches.map((t) => {
              const isLast = t.trancheNumber === calcResult.tranchesCount;
              return (
                <TableRow
                  key={t.trancheNumber}
                  sx={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.02)',
                    },
                    ...(isLast && {
                      backgroundColor: 'rgba(6, 182, 212, 0.02)',
                    }),
                  }}
                >
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" fontWeight="bold">
                      ไม้ {t.trancheNumber} {isLast && '(ไม้สุดท้าย)'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(t.price, currency, false, exchangeRate)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(t.budgetAllocated, currency, false, exchangeRate)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatNumber(t.sharesBought, roundingMode === 'fractional' ? 4 : 0)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(t.actualSpent, currency, false, exchangeRate)}
                  </TableCell>

                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.light' }}>
                    {formatCurrency(t.cumulativeAverageCost, currency, false, exchangeRate)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.light' }}>
                    {t.averageCostDiscountPercent > 0 ? `${t.averageCostDiscountPercent}%` : '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TrancheDetailsTable;
