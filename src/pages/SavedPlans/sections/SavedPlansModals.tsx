/**
 * Route: /portfolio/:id
 * Section: SavedPlansModals (Modals สำหรับยืนยันการลบแผน / ลบพอร์ตโฟลิโอ)
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useTheme,
} from '@mui/material';
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
}) => {
  const theme = useTheme();

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
    </>
  );
};

export default SavedPlansModals;
