/**
 * Route: /investment-plan
 * Section: DailyGrowthTable (ตารางแจกแจงการเติบโตรายวันแบบทบต้น พร้อม Pagination และปักหมุดตำแหน่งพอร์ตปัจจุบัน)
 */

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Stack,
  Box,
  Chip,
  Button,
  LinearProgress,
} from '@mui/material';
import { MapPin, Calendar, ArrowUpRight, Target } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { DailyGrowthItem, CurrencyMode, PortfolioBenchmark } from '../../../types';

interface DailyGrowthTableProps {
  items: DailyGrowthItem[];
  currency: CurrencyMode;
  benchmark?: PortfolioBenchmark;
}

/**
 * คอมโพเนนต์ตารางแสดงผลลัพธ์การเติบโตแบบทบต้นรายวัน (Daily Compound Growth Table)
 * รองรับการแบ่งหน้า (Pagination) และปักหมุดแถวที่ตรงกับตำแหน่งมูลค่าของพอร์ตจริง
 * 
 * @param props - คุณสมบัติของตาราง
 * @returns JSX Element สำหรับตารางแจกแจงรายวัน
 */
export const DailyGrowthTable: React.FC<DailyGrowthTableProps> = ({
  items,
  currency,
  benchmark,
}) => {
  const currencySymbol = currency === 'USD' ? '$' : '฿';
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const matchedDay = benchmark?.matchedDay;
  const expectedDay = benchmark?.expectedDay;

  // ฟังก์ชันจัดรูปแบบตัวเลขเงิน
  const formatMoney = (val: number): string => {
    return `${currencySymbol}${val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  /**
   * นำทางไปยังหน้าที่ประกอบด้วยตำแหน่งวันที่ของพอร์ตปัจจุบัน
   * 
   * @returns void
   */
  const handleJumpToMatchedDay = (): void => {
    if (matchedDay && matchedDay > 0) {
      const targetPage = Math.floor((matchedDay - 1) / rowsPerPage);
      setPage(targetPage);
    }
  };

  /**
   * นำทางไปยังหน้าที่ควรจะอยู่ตามแผนคำนวณจากวันเริ่มเทรด (Expected Day)
   * 
   * @returns void
   */
  const handleJumpToExpectedDay = (): void => {
    if (expectedDay && expectedDay > 0) {
      const targetPage = Math.floor((expectedDay - 1) / rowsPerPage);
      setPage(targetPage);
    }
  };

  const handleChangePage = (_: unknown, newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Slice ข้อมูลสำหรับแสดงผลตามหน้า
  const paginatedItems = items.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <GlassCard sx={{ p: 3 }}>
      <Stack spacing={2.5}>
        {/* หัวข้อตารางและการจัดการ Pagination */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1.5}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: 'info.main',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Calendar size={18} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" fontFamily="Prompt">
                ตารางแผนการเติบโตรายวัน (Daily Compound Matrix)
              </Typography>
              <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                รวมทั้งหมด {items.length} วัน เพื่อบรรลุเป้าหมาย
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {matchedDay && matchedDay > 0 && (
              <Button
                size="small"
                variant="outlined"
                color="success"
                startIcon={<MapPin size={14} />}
                onClick={handleJumpToMatchedDay}
                sx={{ fontFamily: 'Prompt', fontSize: '0.78rem', borderRadius: 2 }}
              >
                พอร์ตคุณ (Day {matchedDay})
              </Button>
            )}

            {expectedDay && expectedDay > 0 && expectedDay !== matchedDay && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<Target size={14} />}
                onClick={handleJumpToExpectedDay}
                sx={{ fontFamily: 'Prompt', fontSize: '0.78rem', borderRadius: 2 }}
              >
                ตามแผนวันนี้ (Day {expectedDay})
              </Button>
            )}
          </Stack>
        </Stack>

        {/* ตารางแสดงผล */}
        <TableContainer sx={{ borderRadius: 2, border: (theme) => theme.palette.mode === 'light' ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)' }}>
                <TableCell sx={{ fontWeight: 'bold', fontFamily: 'Prompt', width: '130px' }}>วันที่</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontFamily: 'Prompt' }}>เงินต้นต้นวัน</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontFamily: 'Prompt' }}>กำไรประจำวัน</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontFamily: 'Prompt' }}>ยอดสิ้นวัน</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontFamily: 'Prompt' }}>กำไรสะสม</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontFamily: 'Prompt' }}>% สะสม</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', fontFamily: 'Prompt', width: '130px' }}>ความคืบหน้า</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedItems.map((item) => {
                const isCurrentPosition = matchedDay === item.day;
                const isExpectedPosition = expectedDay === item.day;
                const isBothSame = isCurrentPosition && isExpectedPosition;

                let rowBgColor: any = undefined;
                let rowBorderLeft: any = undefined;

                if (isBothSame) {
                  rowBgColor = (theme: any) =>
                    theme.palette.mode === 'light'
                      ? 'rgba(16, 185, 129, 0.18)'
                      : 'rgba(16, 185, 129, 0.25)';
                  rowBorderLeft = '4px solid #10b981';
                } else if (isCurrentPosition) {
                  rowBgColor = (theme: any) =>
                    theme.palette.mode === 'light'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(16, 185, 129, 0.22)';
                  rowBorderLeft = '4px solid #10b981';
                } else if (isExpectedPosition) {
                  rowBgColor = (theme: any) =>
                    theme.palette.mode === 'light'
                      ? 'rgba(245, 158, 11, 0.12)'
                      : 'rgba(245, 158, 11, 0.18)';
                  rowBorderLeft = '4px solid #f59e0b';
                }

                return (
                  <TableRow
                    key={item.day}
                    sx={{
                      transition: 'background-color 0.2s',
                      ...(rowBgColor ? {
                        bgcolor: rowBgColor,
                        borderLeft: rowBorderLeft,
                      } : {
                        '&:hover': {
                          bgcolor: (theme) =>
                            theme.palette.mode === 'light'
                              ? 'rgba(0,0,0,0.02)'
                              : 'rgba(255,255,255,0.02)',
                        },
                      }),
                    }}
                  >
                    {/* วันที่ */}
                    <TableCell sx={{ fontFamily: 'Prompt', fontWeight: (isCurrentPosition || isExpectedPosition) ? 'bold' : 'normal' }}>
                      <Stack direction="row" alignItems="center" spacing={0.8} flexWrap="wrap">
                        <span>Day {item.day}</span>
                        {isBothSame ? (
                          <Chip
                            icon={<MapPin size={12} />}
                            label="พอร์ตคุณ (ตรงตามแผน)"
                            size="small"
                            color="success"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold', fontFamily: 'Prompt' }}
                          />
                        ) : (
                          <>
                            {isCurrentPosition && (
                              <Chip
                                icon={<MapPin size={12} />}
                                label="พอร์ตคุณ"
                                size="small"
                                color="success"
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold', fontFamily: 'Prompt' }}
                              />
                            )}
                            {isExpectedPosition && (
                              <Chip
                                icon={<Target size={12} />}
                                label="ตามแผนวันนี้"
                                size="small"
                                color="warning"
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold', fontFamily: 'Prompt' }}
                              />
                            )}
                          </>
                        )}
                      </Stack>
                    </TableCell>

                    {/* เงินต้นต้นวัน */}
                    <TableCell align="right" sx={{ fontFamily: 'Prompt' }}>
                      {formatMoney(item.startingBalance)}
                    </TableCell>

                    {/* กำไรประจำวัน */}
                    <TableCell align="right" sx={{ fontFamily: 'Prompt', color: 'success.main', fontWeight: 'bold' }}>
                      +{formatMoney(item.dailyProfit)}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                        +{item.dailyReturnPercent}%
                      </Typography>
                    </TableCell>

                    {/* ยอดสิ้นวัน */}
                    <TableCell align="right" sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'primary.main' }}>
                      {formatMoney(item.endingBalance)}
                    </TableCell>

                    {/* กำไรสะสม */}
                    <TableCell align="right" sx={{ fontFamily: 'Prompt', color: 'success.main' }}>
                      +{formatMoney(item.cumulativeProfit)}
                    </TableCell>

                    {/* % สะสม */}
                    <TableCell align="right" sx={{ fontFamily: 'Prompt', fontWeight: '600' }}>
                      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.3}>
                        <ArrowUpRight size={14} color="#10b981" />
                        <span>+{item.cumulativeReturnPercent.toFixed(1)}%</span>
                      </Stack>
                    </TableCell>

                    {/* ความคืบหน้า */}
                    <TableCell align="center" sx={{ fontFamily: 'Prompt' }}>
                      <Stack spacing={0.5} alignItems="center">
                        <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.7rem' }}>
                          {item.progressPercent.toFixed(1)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={item.progressPercent}
                          sx={{
                            width: '100%',
                            height: 6,
                            borderRadius: 3,
                            bgcolor: (theme) =>
                              theme.palette.mode === 'light'
                                ? 'rgba(0,0,0,0.06)'
                                : 'rgba(255,255,255,0.08)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              bgcolor: 'primary.main',
                            },
                          }}
                        />
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ตัวเลือกแบ่งหน้า (Pagination / perPage) */}
        <TablePagination
          component="div"
          count={items.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="จำนวนแถวต่อหน้า:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`} วัน`}
          sx={{
            fontFamily: 'Prompt',
            borderTop: 'none',
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontFamily: 'Prompt',
              fontSize: '0.85rem',
            },
          }}
        />
      </Stack>
    </GlassCard>
  );
};

export default DailyGrowthTable;
