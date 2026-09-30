/**
 * Route: /portfolio/:id
 * Section: SavedPlansModals (Modals สำหรับยืนยันการลบแผน / ลบพอร์ตโฟลิโอ)
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Typography,
  Stack,
  useTheme,
} from '@mui/material';
import { Calendar, RotateCcw } from 'lucide-react';
import { PlanToDelete } from '../types';

interface SavedPlansModalsProps {
  portfolioName: string;
  openDeletePortfolioModal: boolean;
  onCloseDeletePortfolioModal: () => void;
  onConfirmDeletePortfolio: () => void;
  planToDelete: PlanToDelete | null;
  onCloseDeletePlanModal: () => void;
  onConfirmDeletePlan: () => void;
  openClearAllModal: boolean;
  onCloseClearAllModal: () => void;
  onConfirmClearAll: () => void;
  openEditDateModal?: boolean;
  onCloseEditDateModal?: () => void;
  onSaveFirstTradeDate?: (dateStr?: string) => void;
  currentFirstTradeDate?: string;
  calculatedDefaultDate?: string;
}

export const SavedPlansModals: React.FC<SavedPlansModalsProps> = ({
  portfolioName,
  openDeletePortfolioModal,
  onCloseDeletePortfolioModal,
  onConfirmDeletePortfolio,
  planToDelete,
  onCloseDeletePlanModal,
  onConfirmDeletePlan,
  openClearAllModal,
  onCloseClearAllModal,
  onConfirmClearAll,
  openEditDateModal = false,
  onCloseEditDateModal,
  onSaveFirstTradeDate,
  currentFirstTradeDate,
  calculatedDefaultDate,
}) => {
  const theme = useTheme();

  // จัดการ state วันที่เริ่มต้นเทรดสำหรับ Modal
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    if (openEditDateModal) {
      if (currentFirstTradeDate) {
        setSelectedDate(currentFirstTradeDate.slice(0, 10));
      } else if (calculatedDefaultDate) {
        setSelectedDate(calculatedDefaultDate.slice(0, 10));
      } else {
        setSelectedDate(new Date().toISOString().slice(0, 10));
      }
    }
  }, [openEditDateModal, currentFirstTradeDate, calculatedDefaultDate]);

  return (
    <>
      {/* 1. Delete Portfolio Confirmation Modal */}
      <Dialog
        open={openDeletePortfolioModal}
        onClose={onCloseDeletePortfolioModal}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'light' ? '#fff' : '#1e293b',
          },
        }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ fontFamily: 'Prompt', fontWeight: 'bold' }}>
          {'ยืนยันการลบพอร์ตการลงทุน?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" sx={{ fontFamily: 'Prompt' }}>
            คุณกำลังจะลบพอร์ต <strong>"{portfolioName}"</strong>{' '}
            การกระทำนี้จะลบแผนการลงทุนทั้งหมดที่อยู่ภายในพอร์ตนี้ด้วย และไม่สามารถกู้คืนได้
            คุณแน่ใจหรือไม่?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={onCloseDeletePortfolioModal} color="inherit" sx={{ fontFamily: 'Prompt' }}>
            ยกเลิก
          </Button>
          <Button
            onClick={onConfirmDeletePortfolio}
            color="error"
            variant="contained"
            autoFocus
            sx={{ fontFamily: 'Prompt', borderRadius: 2 }}
          >
            ยืนยันการลบ
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. Delete Plan Confirmation Modal */}
      <Dialog
        open={!!planToDelete}
        onClose={onCloseDeletePlanModal}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'light' ? '#fff' : '#1e293b',
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Prompt', fontWeight: 'bold' }}>
          {'ยืนยันการลบแผนลงทุน?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: 'Prompt' }}>
            คุณกำลังจะลบแผนการลงทุนของ <strong>{planToDelete?.symbol}</strong>{' '}
            การกระทำนี้ไม่สามารถกู้คืนได้ คุณแน่ใจหรือไม่?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={onCloseDeletePlanModal} color="inherit" sx={{ fontFamily: 'Prompt' }}>
            ยกเลิก
          </Button>
          <Button
            onClick={onConfirmDeletePlan}
            color="error"
            variant="contained"
            autoFocus
            sx={{ fontFamily: 'Prompt', borderRadius: 2 }}
          >
            ยืนยันการลบ
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3. Clear All Plans Confirmation Modal */}
      <Dialog
        open={openClearAllModal}
        onClose={onCloseClearAllModal}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'light' ? '#fff' : '#1e293b',
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Prompt', fontWeight: 'bold' }}>
          {'ยืนยันการล้างแผนทั้งหมด?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: 'Prompt' }}>
            คุณกำลังจะลบแผนการลงทุน <strong>ทั้งหมด</strong> ที่บันทึกไว้ในพอร์ต{' '}
            <strong>"{portfolioName}"</strong> การกระทำนี้ไม่สามารถกู้คืนได้ คุณแน่ใจหรือไม่?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={onCloseClearAllModal} color="inherit" sx={{ fontFamily: 'Prompt' }}>
            ยกเลิก
          </Button>
          <Button
            onClick={onConfirmClearAll}
            color="error"
            variant="contained"
            autoFocus
            sx={{ fontFamily: 'Prompt', borderRadius: 2 }}
          >
            ยืนยันการล้างแผน
          </Button>
        </DialogActions>
      </Dialog>

      {/* 4. Edit Custom First Trade Date Modal */}
      <Dialog
        open={openEditDateModal}
        onClose={onCloseEditDateModal}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            width: '100%',
            maxWidth: 420,
            background: theme.palette.mode === 'light' ? '#fff' : '#1e293b',
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Prompt', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Calendar size={20} color="#10b981" />
          กำหนดวันที่เริ่มเทรดวันแรก
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: 'Prompt', mb: 2, fontSize: '0.85rem' }}>
            ระบบจะนับวันทำการ (Expected Day) เทียบกับแผนการเติบโต โดยเริ่มนับก้าวแรกจากวันที่คุณระบุนี้
          </DialogContentText>

          <Stack spacing={2}>
            <TextField
              type="date"
              label="วันเริ่มต้นเทรดจริง"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ style: { fontFamily: 'Prompt' } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            {currentFirstTradeDate && (
              <Button
                variant="outlined"
                color="warning"
                size="small"
                startIcon={<RotateCcw size={14} />}
                onClick={() => {
                  if (onSaveFirstTradeDate) {
                    onSaveFirstTradeDate(undefined);
                  }
                  if (onCloseEditDateModal) {
                    onCloseEditDateModal();
                  }
                }}
                sx={{ fontFamily: 'Prompt', borderRadius: 2, textTransform: 'none' }}
              >
                รีเซ็ตกลับเป็นอัตโนมัติ (ดึงจากแผนแรก)
              </Button>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Prompt' }}>
              💡 หากรีเซ็ตเป็นอัตโนมัติ ระบบจะค้นหาวันที่สร้างแผนเทรดแรกสุดในพอร์ต หรือใช้วันที่สร้างพอร์ต
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={onCloseEditDateModal} color="inherit" sx={{ fontFamily: 'Prompt' }}>
            ยกเลิก
          </Button>
          <Button
            onClick={() => {
              if (onSaveFirstTradeDate && selectedDate) {
                // เซฟเป็นเวลาเที่ยงวันเพื่อป้องกันปัญหา Timezone ขยับวัน
                const d = new Date(`${selectedDate}T12:00:00.000Z`);
                onSaveFirstTradeDate(d.toISOString());
              }
              if (onCloseEditDateModal) {
                onCloseEditDateModal();
              }
            }}
            color="primary"
            variant="contained"
            sx={{ fontFamily: 'Prompt', borderRadius: 2, px: 2.5 }}
          >
            บันทึกวันที่
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SavedPlansModals;
