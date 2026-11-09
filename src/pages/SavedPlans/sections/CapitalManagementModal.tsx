/**
 * Route: /portfolio/:id
 * Section: CapitalManagementModal (หน้าต่างสำหรับจัดการเงินทุนของพอร์ต: เติมเงิน / ถอนเงิน / ปรับฐานเงินต้น)
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Stack,
  Box,
  Tabs,
  Tab,
  Alert,
  FormControlLabel,
  Checkbox,
  IconButton,
  Divider,
  useTheme,
} from '@mui/material';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import CurrencyTextField from '../../../components/CurrencyTextField';
import { formatCurrency } from '../../../utils/stockMath';

export interface CapitalManagementModalProps {
  /** สถานะการเปิด/ปิดหน้าต่าง */
  open: boolean;
  /** ฟังก์ชันปิดหน้าต่าง */
  onClose: () => void;
  /** ชื่อพอร์ตการลงทุน */
  portfolioName: string;
  /** มูลค่าเงินต้นทุนปัจจุบัน */
  initialCapital: number;
  /** เงินสดคงเหลือที่ลงทุนได้ */
  availableCash: number;
  /** อัตราแลกเปลี่ยน THB/USD */
  exchangeRate: number;
  /** ฟังก์ชันดำเนินการเติมเงิน */
  onDeposit: (amount: number, date: string, note?: string) => void;
  /** ฟังก์ชันดำเนินการถอนเงิน */
  onWithdraw: (amount: number, date: string, note?: string) => void;
  /** ฟังก์ชันดำเนินการปรับฐานเงินต้น */
  onAdjustBase: (newBase: number, clearAdjustments: boolean) => void;
}

/**
 * หน้าต่าง Modal จัดการเงินทุนของพอร์ต (เติมเงิน / ถอนเงิน / ปรับฐานเงินต้น)
 * 
 * @param props - คุณสมบัติที่ส่งเข้ามาควบคุมการทำงานของ Modal
 * @returns JSX Element สำหรับแสดง Modal จัดการเงินทุน
 */
export const CapitalManagementModal: React.FC<CapitalManagementModalProps> = ({
  open,
  onClose,
  portfolioName,
  initialCapital,
  availableCash,
  exchangeRate,
  onDeposit,
  onWithdraw,
  onAdjustBase,
}) => {
  const theme = useTheme();

  // 0: เติมเงินเพิ่ม (Deposit), 1: ถอนเงิน (Withdraw), 2: ปรับฐานเงินต้น (Correct Base)
  const [activeTab, setActiveTab] = useState<number>(0);

  // ข้อมูลฟอร์ม
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [baseCapitalAmount, setBaseCapitalAmount] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [clearAdjustments, setClearAdjustments] = useState<boolean>(false);

  // รีเซ็ตค่าเริ่มต้นเมื่อเปิด Modal
  useEffect(() => {
    if (open) {
      setDepositAmount('');
      setWithdrawAmount('');
      setBaseCapitalAmount(initialCapital > 0 ? initialCapital.toString() : '');
      setSelectedDate(new Date().toISOString().slice(0, 10));
      setNote('');
      setClearAdjustments(false);
    }
  }, [open, initialCapital]);

  // ตัวเลขที่แปลงแล้ว
  const depositNum = Number(depositAmount) || 0;
  const withdrawNum = Number(withdrawAmount) || 0;
  const baseCapitalNum = Number(baseCapitalAmount) || 0;

  /**
   * ตรวจสอบความถูกต้องและส่งคำสั่งบันทึกข้อมูลตามแท็บที่เลือก
   * 
   * @returns void
   */
  const handleConfirm = (): void => {
    const formattedDate = selectedDate
      ? new Date(`${selectedDate}T12:00:00.000Z`).toISOString()
      : new Date().toISOString();

    if (activeTab === 0) {
      // เติมเงินเพิ่ม
      if (depositNum <= 0) return;
      onDeposit(depositNum, formattedDate, note.trim() || undefined);
    } else if (activeTab === 1) {
      // ถอนเงิน
      if (withdrawNum <= 0) return;
      onWithdraw(withdrawNum, formattedDate, note.trim() || undefined);
    } else {
      // ปรับฐานเงินต้น
      if (baseCapitalNum < 0) return;
      onAdjustBase(baseCapitalNum, clearAdjustments);
    }
    onClose();
  };

  const isWithdrawExceedAvailable = activeTab === 1 && withdrawNum > availableCash;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: theme.palette.mode === 'light' ? '#ffffff' : '#1e293b',
          backgroundImage: 'none',
          boxShadow: theme.shadows[10],
          overflow: 'hidden',
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          p: 2.5,
          pb: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'Prompt',
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold" fontFamily="Prompt">
            จัดการเงินทุนพอร์ต
          </Typography>
          <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
            พอร์ต: <strong>{portfolioName}</strong> • เงินต้นปัจจุบัน:{' '}
            {formatCurrency(initialCapital, 'USD', false)}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      {/* Tabs เลือกโหมด */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2.5 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="fullWidth"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              fontFamily: 'Prompt',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              textTransform: 'none',
              minHeight: 48,
            },
          }}
        >
          <Tab
            icon={<ArrowDownLeft size={16} />}
            iconPosition="start"
            label="เติมเงินเพิ่ม"
            sx={{
              color: activeTab === 0 ? 'success.main' : 'text.secondary',
              '&.Mui-selected': { color: 'success.main' },
            }}
          />
          <Tab
            icon={<ArrowUpRight size={16} />}
            iconPosition="start"
            label="ถอนเงิน"
            sx={{
              color: activeTab === 1 ? 'error.main' : 'text.secondary',
              '&.Mui-selected': { color: 'error.main' },
            }}
          />
          <Tab
            icon={<SlidersHorizontal size={16} />}
            iconPosition="start"
            label="ปรับฐานเงินต้น"
            sx={{
              color: activeTab === 2 ? 'primary.main' : 'text.secondary',
              '&.Mui-selected': { color: 'primary.main' },
            }}
          />
        </Tabs>
      </Box>

      {/* Dialog Content */}
      <DialogContent sx={{ p: 2.5, pt: 3 }}>
        {/* ==================== TAB 0: เติมเงินเพิ่ม (Deposit) ==================== */}
        {activeTab === 0 && (
          <Stack spacing={2.5}>
            <Alert
              severity="success"
              icon={<CheckCircle2 size={18} />}
              sx={{ fontFamily: 'Prompt', py: 0.5, fontSize: '0.85rem' }}
            >
              บันทึกการเติมเงินเข้าพอร์ตจริง ระบบจะเพิ่มเงินต้นและสร้างแถบรายการในไทม์ไลน์
            </Alert>

            <Box>
              <Typography variant="body2" fontWeight="bold" fontFamily="Prompt" mb={1}>
                จำนวนเงินที่เติม (USD) *
              </Typography>
              <CurrencyTextField
                fullWidth
                size="medium"
                placeholder="0.00"
                value={depositAmount}
                onChange={(val) => setDepositAmount(val)}
                autoFocus
                InputProps={{
                  startAdornment: (
                    <Typography color="text.secondary" mr={1} fontWeight="bold">
                      $
                    </Typography>
                  ),
                }}
              />
              {depositNum > 0 && (
                <Typography variant="caption" color="text.secondary" fontFamily="Prompt" mt={0.5} display="block">
                  ≈ {formatCurrency(depositNum * exchangeRate, 'THB', false)} (อัตราแลกเปลี่ยน ฿{exchangeRate.toFixed(2)})
                </Typography>
              )}
            </Box>

            {/* แสดงสรุปผลลัพธ์ล่วงหน้า */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'light' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="body2" fontFamily="Prompt" color="text.secondary">
                  เงินต้นเดิม:
                </Typography>
                <Typography variant="body2" fontFamily="Prompt" fontWeight="bold">
                  {formatCurrency(initialCapital, 'USD', false)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="body2" fontFamily="Prompt" color="success.main" fontWeight="bold">
                  + เงินที่เติม:
                </Typography>
                <Typography variant="body2" fontFamily="Prompt" color="success.main" fontWeight="bold">
                  +{formatCurrency(depositNum, 'USD', false)}
                </Typography>
              </Stack>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontFamily="Prompt" fontWeight="bold">
                  เงินต้นใหม่รวม:
                </Typography>
                <Typography variant="body1" fontFamily="Prompt" fontWeight="bold" color="success.main">
                  {formatCurrency(initialCapital + depositNum, 'USD', false)}
                </Typography>
              </Stack>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                type="date"
                label="วันที่เติมเงิน"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ style: { fontFamily: 'Prompt' } }}
              />
              <TextField
                label="หมายเหตุ (ถ้ามี)"
                placeholder="เช่น เงินเดือนประจำเดือน"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                fullWidth
                inputProps={{ style: { fontFamily: 'Prompt' } }}
              />
            </Stack>
          </Stack>
        )}

        {/* ==================== TAB 1: ถอนเงิน (Withdraw) ==================== */}
        {activeTab === 1 && (
          <Stack spacing={2.5}>
            <Alert
              severity="info"
              icon={<Calendar size={18} />}
              sx={{ fontFamily: 'Prompt', py: 0.5, fontSize: '0.85rem' }}
            >
              เงินสดที่ลงทุนได้ปัจจุบัน (Available Cash):{' '}
              <strong>{formatCurrency(availableCash, 'USD', false)}</strong>
            </Alert>

            <Box>
              <Typography variant="body2" fontWeight="bold" fontFamily="Prompt" mb={1}>
                จำนวนเงินที่ต้องการถอน (USD) *
              </Typography>
              <CurrencyTextField
                fullWidth
                size="medium"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(val) => setWithdrawAmount(val)}
                autoFocus
                error={isWithdrawExceedAvailable}
                InputProps={{
                  startAdornment: (
                    <Typography color="text.secondary" mr={1} fontWeight="bold">
                      $
                    </Typography>
                  ),
                }}
              />
              {withdrawNum > 0 && (
                <Typography variant="caption" color="text.secondary" fontFamily="Prompt" mt={0.5} display="block">
                  ≈ {formatCurrency(withdrawNum * exchangeRate, 'THB', false)}
                </Typography>
              )}
            </Box>

            {isWithdrawExceedAvailable && (
              <Alert severity="warning" icon={<AlertCircle size={18} />} sx={{ fontFamily: 'Prompt', py: 0.5 }}>
                ยอดถอนมากกว่าเงินสดที่ลงทุนได้คงเหลือ ({formatCurrency(availableCash, 'USD', false)})
              </Alert>
            )}

            {/* แสดงสรุปผลลัพธ์ล่วงหน้า */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'light' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="body2" fontFamily="Prompt" color="text.secondary">
                  เงินต้นเดิม:
                </Typography>
                <Typography variant="body2" fontFamily="Prompt" fontWeight="bold">
                  {formatCurrency(initialCapital, 'USD', false)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="body2" fontFamily="Prompt" color="error.main" fontWeight="bold">
                  - เงินที่ถอนออก:
                </Typography>
                <Typography variant="body2" fontFamily="Prompt" color="error.main" fontWeight="bold">
                  -{formatCurrency(withdrawNum, 'USD', false)}
                </Typography>
              </Stack>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontFamily="Prompt" fontWeight="bold">
                  เงินต้นใหม่รวม:
                </Typography>
                <Typography variant="body1" fontFamily="Prompt" fontWeight="bold" color="error.main">
                  {formatCurrency(Math.max(0, initialCapital - withdrawNum), 'USD', false)}
                </Typography>
              </Stack>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                type="date"
                label="วันที่ถอนเงิน"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ style: { fontFamily: 'Prompt' } }}
              />
              <TextField
                label="หมายเหตุ (ถ้ามี)"
                placeholder="เช่น ถอนกำไรออกใช้จ่าย"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                fullWidth
                inputProps={{ style: { fontFamily: 'Prompt' } }}
              />
            </Stack>
          </Stack>
        )}

        {/* ==================== TAB 2: ปรับฐานเงินต้น (Correct Base) ==================== */}
        {activeTab === 2 && (
          <Stack spacing={2.5}>
            <Alert
              severity="info"
              icon={<SlidersHorizontal size={18} />}
              sx={{ fontFamily: 'Prompt', py: 1, fontSize: '0.85rem' }}
            >
              <strong>โหมดปรับฐานเงินต้น (กรณีเคยกรอกผิด):</strong>
              <br />
              ระบบจะแก้ไขตัวเลขเงินต้นตั้งต้นโดยตรง และ<strong>จะไม่สร้างรายการเติมเงินหรือถอนเงินในไทม์ไลน์</strong>{' '}
              เพื่อไม่ให้ประวัติพอร์ตผิดเพี้ยน
            </Alert>

            <Box>
              <Typography variant="body2" fontWeight="bold" fontFamily="Prompt" mb={1}>
                มูลค่าต้นทุนตั้งต้นที่ถูกต้อง (USD) *
              </Typography>
              <CurrencyTextField
                fullWidth
                size="medium"
                placeholder="0.00"
                value={baseCapitalAmount}
                onChange={(val) => setBaseCapitalAmount(val)}
                autoFocus
                InputProps={{
                  startAdornment: (
                    <Typography color="text.secondary" mr={1} fontWeight="bold">
                      $
                    </Typography>
                  ),
                }}
              />
              {baseCapitalNum > 0 && (
                <Typography variant="caption" color="text.secondary" fontFamily="Prompt" mt={0.5} display="block">
                  ≈ {formatCurrency(baseCapitalNum * exchangeRate, 'THB', false)}
                </Typography>
              )}
            </Box>

            {/* แสดงการเปรียบเทียบ */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'light' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="body2" fontFamily="Prompt" color="text.secondary">
                  เงินต้นเดิม:
                </Typography>
                <Typography variant="body2" fontFamily="Prompt" fontWeight="bold">
                  {formatCurrency(initialCapital, 'USD', false)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontFamily="Prompt" color="primary.main" fontWeight="bold">
                  เงินต้นใหม่ที่ปรับแก้:
                </Typography>
                <Typography variant="body1" fontFamily="Prompt" color="primary.main" fontWeight="bold">
                  {formatCurrency(baseCapitalNum, 'USD', false)}
                </Typography>
              </Stack>
            </Box>

            {/* ตัวเลือกล้างประวัติเก่าที่อาจเคยบันทึกผิด */}
            <Box sx={{ pl: 0.5 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={clearAdjustments}
                    onChange={(e) => setClearAdjustments(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" fontFamily="Prompt" color="text.secondary">
                    ล้างประวัติการเติมเงิน/ถอนเงินเดิมทั้งหมดในพอร์ตนี้ออกด้วย (หากมีรายการเก่าที่เคยพิมพ์ผิดค้างอยู่)
                  </Typography>
                }
              />
            </Box>
          </Stack>
        )}
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions sx={{ p: 2.5, pt: 1.5, gap: 1 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontFamily: 'Prompt', borderRadius: 2 }}>
          ยกเลิก
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={activeTab === 0 ? 'success' : activeTab === 1 ? 'error' : 'primary'}
          disabled={
            (activeTab === 0 && depositNum <= 0) ||
            (activeTab === 1 && withdrawNum <= 0) ||
            (activeTab === 2 && baseCapitalNum < 0)
          }
          sx={{
            fontFamily: 'Prompt',
            borderRadius: 2,
            px: 3,
            fontWeight: 'bold',
          }}
        >
          {activeTab === 0
            ? 'ยืนยันการเติมเงิน'
            : activeTab === 1
            ? 'ยืนยันการถอนเงิน'
            : 'บันทึกการปรับฐานเงินต้น'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CapitalManagementModal;

