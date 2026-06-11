import React, { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Button,
  Stack,
  Divider,
  IconButton,
  Chip,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { Trash2, ExternalLink, Calendar, FolderHeart, LayoutGrid, List } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { deletePlan, updateCurrentParams, setActivePlanId, deletePortfolio } from '../store/stockPlannerSlice';
import { formatCurrency } from '../utils/stockMath';
import GlassCard from '../components/GlassCard';

export const SavedPlans: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const savedPlans = useAppSelector(state => state.stockPlanner.savedPlans);
  const portfolios = useAppSelector(state => state.stockPlanner.portfolios);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<{ id: string; symbol: string } | null>(null);
  const [openClearAllModal, setOpenClearAllModal] = useState(false);

  const { id } = useParams<{ id: string }>();
  const portfolioId = id || 'unassigned';
  const portfolio = portfolios.find(p => p.id === portfolioId) || { id: 'unassigned', name: 'ยังไม่ได้จัดพอร์ตการลงทุน' };
  
  const filteredPlans = savedPlans.filter(p => (p.portfolioId || 'unassigned') === portfolioId);

  const handleLoadPlan = (plan: typeof savedPlans[0]) => {
    dispatch(setActivePlanId(plan.id));
    dispatch(updateCurrentParams({
      stockSymbol: plan.stockSymbol,
      currentPrice: plan.currentPrice.toString(),
      totalBudget: plan.totalBudget.toString(),
      tranchesCount: plan.tranchesCount.toString(),
      dropPercentage: plan.dropPercentage.toString(),
      dropMode: plan.dropMode,
      roundingMode: plan.roundingMode,
      currency: plan.currency || 'THB',
      exchangeRate: (plan.exchangeRate || 36.5).toString(),
      targetProfitPercent: (plan.targetProfitPercent !== undefined ? plan.targetProfitPercent : 10).toString(),
      feePercent: (plan.feePercent !== undefined ? plan.feePercent : 0.5).toString(),
      actualSellPrice: plan.actualSellPrice ? plan.actualSellPrice.toString() : '',
      actualTranchesCount: plan.actualTranchesCount ? plan.actualTranchesCount.toString() : '',
      currentPriceIsFirstTranche: plan.currentPriceIsFirstTranche !== false,
      portfolioId: plan.portfolioId || 'unassigned',
    }));
    enqueueSnackbar(`โหลดแผนลงทุนหุ้น ${plan.stockSymbol} สำเร็จ`, { variant: 'success' });
    navigate('/');
  };

  const handleDelete = (id: string, symbol: string) => {
    setPlanToDelete({ id, symbol });
  };

  const executeDeletePlan = () => {
    if (planToDelete) {
      dispatch(deletePlan(planToDelete.id));
      enqueueSnackbar(`ลบแผนของ ${planToDelete.symbol} เรียบร้อยแล้ว`, { variant: 'info' });
      setPlanToDelete(null);
    }
  };

  const handleClearAll = () => {
    setOpenClearAllModal(true);
  };

  const executeClearAll = () => {
    filteredPlans.forEach(p => dispatch(deletePlan(p.id)));
    enqueueSnackbar('ลบแผนการลงทุนทั้งหมดในพอร์ตแล้ว', { variant: 'warning' });
    setOpenClearAllModal(false);
  };

  const handleDeletePortfolio = () => {
    dispatch(deletePortfolio(portfolioId));
    enqueueSnackbar(`ลบพอร์ต "${portfolio.name}" เรียบร้อยแล้ว`, { variant: 'info' });
    setOpenDeleteModal(false);
    navigate('/');
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getRoundingModeName = (mode: string) => {
    switch (mode) {
      case 'integer': return 'เต็ม 1 หุ้น';
      case 'boardlot': return 'บอร์ดล็อต (100 หุ้น)';
      case 'fractional': return 'เศษทศนิยม (4 ตำแหน่ง)';
      default: return mode;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, py: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <FolderHeart size={26} color="#10b981" />
          <Typography variant="h5" fontWeight="bold" fontFamily="Prompt">
            {portfolio.name} ({filteredPlans.length})
          </Typography>
        </Stack>
        
        <Stack direction="row" spacing={2} alignItems="center">
          {portfolioId !== 'unassigned' && (
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => setOpenDeleteModal(true)}
              startIcon={<Trash2 size={16} />}
              sx={{ borderRadius: 3, fontFamily: 'Prompt' }}
            >
              ลบพอร์ตนี้
            </Button>
          )}
          {filteredPlans.length > 0 && (
            <>
              {/* View Mode Toggle */}
              <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, val) => val && setViewMode(val)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.5,
                  py: 0.5,
                  border: theme.palette.mode === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                  color: 'text.secondary',
                  fontFamily: 'Prompt',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderColor: '#10b981',
                    color: '#10b981',
                  }
                }
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
                onClick={handleClearAll}
                startIcon={<Trash2 size={16} />}
                sx={{ borderRadius: 3 }}
              >
                ล้างแผนทั้งหมด
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {filteredPlans.length > 0 ? (
        viewMode === 'grid' ? (
          <Grid container spacing={3}>
            {filteredPlans.map((plan) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={plan.id}>
                <GlassCard 
                  hoverEffect 
                  sx={{ 
                    p: 3, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    background: theme.palette.mode === 'light' 
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)'
                      : 'linear-gradient(135deg, rgba(17, 25, 40, 0.6) 0%, rgba(10, 15, 25, 0.8) 100%)',
                    border: theme.palette.mode === 'light'
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
                        onClick={() => handleDelete(plan.id, plan.stockSymbol)} 
                        size="small"
                        color="error"
                        sx={{ 
                          opacity: 0.6, 
                          '&:hover': { opacity: 1, backgroundColor: 'rgba(239, 68, 68, 0.08)' } 
                        }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Stack>

                    <Divider sx={{ opacity: 0.05, my: 1.5 }} />

                    {/* Plan Specs */}
                    <Stack spacing={1.5} mb={3}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">วันที่ขายหุ้น:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {plan.soldAt ? formatDate(plan.soldAt) : '-'}
                        </Typography>
                      </Stack>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">งบลงทุนจริงรวม:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(plan.actualSpent ?? plan.totalBudget, plan.currency || 'THB', (plan.currency || 'THB') === 'USD', plan.exchangeRate || 36.5)}
                        </Typography>
                      </Stack>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">รูปแบบการซื้อ:</Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'Prompt' }}>
                          {getRoundingModeName(plan.roundingMode)}
                        </Typography>
                      </Stack>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">ต้นทุนเฉลี่ย:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(plan.actualAverageCost ?? plan.finalAverageCost, plan.currency || 'THB', false, plan.exchangeRate || 36.5)}
                        </Typography>
                      </Stack>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">ราคาขาย:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {plan.actualSellPrice ? formatCurrency(plan.actualSellPrice, plan.currency || 'THB', false, plan.exchangeRate || 36.5) : '-'}
                        </Typography>
                      </Stack>

                      <Divider sx={{ opacity: 0.05 }} />

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">กำไร/ขาดทุนจริง:</Typography>
                        <Typography 
                          variant="subtitle1" 
                          fontWeight="900" 
                          color={(plan.actualRealizedProfitLossAmount ?? plan.realizedProfitLossAmount ?? 0) >= 0 ? 'success.main' : 'error.main'}
                        >
                          {plan.actualSellPrice 
                            ? `${formatCurrency(plan.actualRealizedProfitLossAmount ?? plan.realizedProfitLossAmount ?? 0, plan.currency || 'THB', (plan.currency || 'THB') === 'USD', plan.exchangeRate || 36.5)} (${(plan.actualRealizedProfitLossPercent ?? plan.realizedProfitLossPercent ?? 0).toFixed(2)}%)`
                            : '-'
                          }
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>

                  <Box>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={() => handleLoadPlan(plan)}
                      startIcon={<ExternalLink size={16} />}
                      sx={{ 
                        borderRadius: 3,
                        fontFamily: 'Prompt',
                        fontWeight: 'bold',
                        py: 1
                      }}
                    >
                      โหลดแผนนี้เข้าสู่เครื่องมือ
                    </Button>
                  </Box>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        ) : (
          <TableContainer 
            component={Paper} 
            sx={{ 
              borderRadius: 0, 
              overflow: 'hidden', 
              background: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(17, 25, 40, 0.4)',
              backdropFilter: 'blur(16px)',
              border: theme.palette.mode === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)',
              boxShadow: 'none'
            }}
          >
            <Table>
              <TableHead sx={{ backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}>ชื่อหุ้น</TableCell>
                  <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}>วันที่ซื้อหุ้น</TableCell>
                  <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}>วันที่ขายหุ้น</TableCell>
                  <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}>งบลงทุนจริงรวม</TableCell>
                  <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}>รูปแบบการซื้อ</TableCell>
                  <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}>ต้นทุนเฉลี่ย</TableCell>
                  <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}>ราคาขาย</TableCell>
                  <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}>สรุปกำไรขาดทุนจริง</TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'Prompt', fontWeight: 'bold', color: 'text.secondary' }}>จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPlans.map((plan) => (
                  <TableRow 
                    key={plan.id}
                    sx={{ 
                      '&:hover': { backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.02)' },
                      transition: 'background-color 0.2s',
                      borderBottom: theme.palette.mode === 'light' ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.04)'
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
                      {formatCurrency(plan.actualSpent ?? plan.totalBudget, plan.currency || 'THB', (plan.currency || 'THB') === 'USD', plan.exchangeRate || 36.5)}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Prompt' }}>
                      {getRoundingModeName(plan.roundingMode)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(plan.actualAverageCost ?? plan.finalAverageCost, plan.currency || 'THB', false, plan.exchangeRate || 36.5)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {plan.actualSellPrice ? formatCurrency(plan.actualSellPrice, plan.currency || 'THB', false, plan.exchangeRate || 36.5) : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold" 
                        color={(plan.actualRealizedProfitLossAmount ?? plan.realizedProfitLossAmount ?? 0) >= 0 ? 'success.main' : 'error.main'}
                      >
                        {plan.actualSellPrice 
                          ? `${formatCurrency(plan.actualRealizedProfitLossAmount ?? plan.realizedProfitLossAmount ?? 0, plan.currency || 'THB', (plan.currency || 'THB') === 'USD', plan.exchangeRate || 36.5)} (${(plan.actualRealizedProfitLossPercent ?? plan.realizedProfitLossPercent ?? 0).toFixed(2)}%)`
                          : '-'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1.5} justifyContent="center">
                        <Tooltip title="โหลดแผนนี้เข้าสู่เครื่องมือ">
                          <IconButton 
                            onClick={() => handleLoadPlan(plan)} 
                            size="small" 
                            color="primary"
                            sx={{ 
                              backgroundColor: 'rgba(16, 185, 129, 0.06)', 
                              border: '1px solid rgba(16, 185, 129, 0.1)',
                              '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.15)' } 
                            }}
                          >
                            <ExternalLink size={15} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบแผนนี้">
                          <IconButton 
                            onClick={() => handleDelete(plan.id, plan.stockSymbol)} 
                            size="small" 
                            color="error"
                            sx={{ 
                              backgroundColor: 'rgba(239, 68, 68, 0.06)', 
                              border: '1px solid rgba(239, 68, 68, 0.1)',
                              '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.15)' } 
                            }}
                          >
                            <Trash2 size={15} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : (
        <Box 
          sx={{ 
            minHeight: 300, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            p: 4 
          }}
        >
          <Alert 
            severity="info" 
            sx={{ 
              borderRadius: 4, 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid rgba(255, 255, 255, 0.05)',
              maxWidth: 450,
              p: 3,
              '& .MuiAlert-icon': {
                alignItems: 'center'
              }
            }}
          >
            <Typography variant="subtitle2" fontWeight="bold" mb={0.5} fontFamily="Prompt">
              ยังไม่มีการบันทึกแผนการลงทุน
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Prompt' }}>
              แผนการลงทุนแบ่งไม้ถัวซื้อที่คุณบันทึกจะแสดงรายชื่อตรงนี้ สามารถบันทึกเพื่อนำกลับมาเปรียบเทียบหรือแก้ไขในภายหลังได้ตลอดเวลา!
            </Typography>
          </Alert>
        </Box>
      )}

      {/* Delete Portfolio Confirmation Modal */}
      <Dialog
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: { borderRadius: 3, background: theme.palette.mode === 'light' ? '#fff' : '#1e293b' }
        }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ fontFamily: 'Prompt', fontWeight: 'bold' }}>
          {"ยืนยันการลบพอร์ตการลงทุน?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" sx={{ fontFamily: 'Prompt' }}>
            คุณกำลังจะลบพอร์ต <strong>"{portfolio.name}"</strong> 
            การกระทำนี้จะลบแผนการลงทุนทั้งหมดที่อยู่ภายในพอร์ตนี้ด้วย และไม่สามารถกู้คืนได้ คุณแน่ใจหรือไม่?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenDeleteModal(false)} color="inherit" sx={{ fontFamily: 'Prompt' }}>
            ยกเลิก
          </Button>
          <Button onClick={handleDeletePortfolio} color="error" variant="contained" autoFocus sx={{ fontFamily: 'Prompt', borderRadius: 2 }}>
            ยืนยันการลบ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Plan Confirmation Modal */}
      <Dialog
        open={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        PaperProps={{
          sx: { borderRadius: 3, background: theme.palette.mode === 'light' ? '#fff' : '#1e293b' }
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Prompt', fontWeight: 'bold' }}>
          {"ยืนยันการลบแผนลงทุน?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: 'Prompt' }}>
            คุณกำลังจะลบแผนการลงทุนของ <strong>{planToDelete?.symbol}</strong> การกระทำนี้ไม่สามารถกู้คืนได้ คุณแน่ใจหรือไม่?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setPlanToDelete(null)} color="inherit" sx={{ fontFamily: 'Prompt' }}>
            ยกเลิก
          </Button>
          <Button onClick={executeDeletePlan} color="error" variant="contained" autoFocus sx={{ fontFamily: 'Prompt', borderRadius: 2 }}>
            ยืนยันการลบ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear All Plans Confirmation Modal */}
      <Dialog
        open={openClearAllModal}
        onClose={() => setOpenClearAllModal(false)}
        PaperProps={{
          sx: { borderRadius: 3, background: theme.palette.mode === 'light' ? '#fff' : '#1e293b' }
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Prompt', fontWeight: 'bold' }}>
          {"ยืนยันการล้างแผนทั้งหมด?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: 'Prompt' }}>
            คุณกำลังจะลบแผนการลงทุน <strong>ทั้งหมด</strong> ที่บันทึกไว้ในพอร์ต <strong>"{portfolio.name}"</strong> 
            การกระทำนี้ไม่สามารถกู้คืนได้ คุณแน่ใจหรือไม่?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenClearAllModal(false)} color="inherit" sx={{ fontFamily: 'Prompt' }}>
            ยกเลิก
          </Button>
          <Button onClick={executeClearAll} color="error" variant="contained" autoFocus sx={{ fontFamily: 'Prompt', borderRadius: 2 }}>
            ยืนยันการล้างแผน
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SavedPlans;
