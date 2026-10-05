/**
 * Component: GistSyncStartupModal.tsx
 * หน้าต่างตรวจสอบและแจ้งเตือนความแตกต่างของข้อมูลระหว่าง GitHub Gist กับเครื่อง Local อัตโนมัติเมื่อเปิดเว็บ
 * ป้องกันข้อมูลสูญหายและช่วยให้ผู้ใช้เลือกว่าจะซิงค์ข้อมูลล่าสุดจาก Cloud หรือไม่
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  Divider,
  Chip,
  useTheme,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Cloud,
  CloudDownload,
  Laptop,
  AlertTriangle,
} from 'lucide-react';
import dayjs from 'dayjs';
import {
  checkGistDifference,
  applyGistBackup,
  GistDiffResult,
} from '../utils/githubGistSync';

const SESSION_CHECKED_KEY = 'moneylust_startup_gist_checked';

/**
 * คอมโพเนนต์หน้าต่างตรวจสอบความแตกต่างของข้อมูลบน GitHub Gist ตอนเปิดเว็บ
 * 
 * @returns JSX Element สำหรับ Dialog ถามยืนยันการอัปเดตข้อมูล
 */
export const GistSyncStartupModal: React.FC = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const [open, setOpen] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [diffData, setDiffData] = useState<GistDiffResult | null>(null);

  /**
   * ตรวจสอบข้อมูลความแตกต่างระหว่าง GitHub Gist กับ LocalStorage เมื่อคอมโพเนนต์ถูกโหลด
   * 
   * @returns Promise<void>
   */
  const handleStartupCheck = async (): Promise<void> => {
    // หากตรวจสอบไปแล้วใน Session นี้จะไม่แสดงซ้ำจนกว่าจะเปิดแท็บ/หน้าต่างเว็บใหม่
    const alreadyChecked = sessionStorage.getItem(SESSION_CHECKED_KEY);
    if (alreadyChecked) return;

    try {
      const result = await checkGistDifference();
      if (result.hasDiff && result.cloudRawContent) {
        setDiffData(result);
        setOpen(true);
      } else {
        // หากไม่มีความแตกต่าง ให้มาร์กไว้ว่าตรวจสอบเรียบร้อยแล้ว
        sessionStorage.setItem(SESSION_CHECKED_KEY, 'true');
      }
    } catch {
      // ทำงานแบบ Non-blocking หาก Network ขัดข้องจะไม่รบกวนการเปิดหน้าเว็บ
    }
  };

  useEffect(() => {
    handleStartupCheck();
  }, []);

  /**
   * จัดการยืนยันการดึงข้อมูลจาก GitHub Gist มาเขียนทับลงเครื่องและรีโหลดหน้าเว็บ
   * 
   * @returns void
   */
  const handleConfirmUpdate = (): void => {
    if (!diffData?.cloudRawContent) return;

    setIsApplying(true);
    const res = applyGistBackup(diffData.cloudRawContent);

    if (res.success) {
      sessionStorage.setItem(SESSION_CHECKED_KEY, 'true');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } else {
      setIsApplying(false);
      alert(`ไม่สามารถอัปเดตข้อมูลได้: ${res.message}`);
    }
  };

  /**
   * จัดการเมื่อผู้ใช้เลือกไม่ดึงข้อมูล (คงข้อมูลในเครื่องนี้ไว้)
   * 
   * @returns void
   */
  const handleKeepLocal = (): void => {
    sessionStorage.setItem(SESSION_CHECKED_KEY, 'true');
    setOpen(false);
  };

  if (!open || !diffData) return null;

  const formattedCloudDate = diffData.cloudUpdatedAt
    ? dayjs(diffData.cloudUpdatedAt).format('DD/MM/YYYY HH:mm:ss')
    : 'ไม่ระบุเวลา';

  return (
    <Dialog
      open={open}
      onClose={(_e, reason) => {
        // บังคับให้ผู้ใช้กดเลือกปุ่ม ไม่ปิดเมื่อคลิกด้านนอกเพื่อความชัดเจน
        if (reason !== 'backdropClick') {
          handleKeepLocal();
        }
      }}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          width: '100%',
          maxWidth: 640,
          backgroundColor: isLight ? '#ffffff' : '#111827',
          backgroundImage: 'none',
          border: '1px solid',
          borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
          boxShadow: isLight
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header Banner */}
      <DialogTitle
        sx={{
          pb: 1.5,
          pt: 2.5,
          background: isLight
            ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(255,255,255,0) 100%)'
            : 'linear-gradient(180deg, rgba(16, 185, 129, 0.15) 0%, rgba(17, 24, 39, 0) 100%)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2,
              bgcolor: isLight ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.25)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Cloud size={24} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              ตรวจพบข้อมูลบน GitHub Cloud มีการอัปเดต
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ข้อมูลแผนการลงทุนบน Cloud ไม่ตรงกับข้อมูลในเครื่องนี้
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Alert
          severity="info"
          icon={<AlertTriangle size={20} color="#0284c7" />}
          sx={{
            mb: 2.5,
            borderRadius: 2,
            fontSize: '0.88rem',
            lineHeight: 1.6,
            backgroundColor: isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(2, 132, 199, 0.15)',
            border: '1px solid',
            borderColor: isLight ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.3)',
          }}
        >
          ตรวจพบความแตกต่างระหว่างข้อมูลล่าสุดบน GitHub Gist กับข้อมูลในเครื่องนี้
          <br />
          คุณต้องการดึงข้อมูลล่าสุดจาก Cloud มาอัปเดตลงเครื่องนี้หรือไม่?
        </Alert>

        {/* Comparison Grid */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="stretch"
          sx={{ mb: 2.5 }}
        >
          {/* Cloud Box */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              borderRadius: 2.5,
              border: '1.5px solid',
              borderColor: '#10b981',
              bgcolor: isLight ? 'rgba(16, 185, 129, 0.04)' : 'rgba(16, 185, 129, 0.08)',
              position: 'relative',
            }}
          >
            <Chip
              label="บน Cloud ล่าสุด"
              size="small"
              color="success"
              sx={{
                position: 'absolute',
                top: -12,
                right: 12,
                fontWeight: 'bold',
                fontSize: '0.72rem',
                height: 22,
              }}
            />
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <Cloud size={18} color="#10b981" />
              <Typography variant="subtitle2" fontWeight="bold" color="#10b981">
                GitHub Gist (Cloud)
              </Typography>
            </Stack>

            <Typography variant="body2" sx={{ mb: 0.5 }}>
              📊 <strong>{diffData.cloudPlansCount}</strong> แผนการเทรด
            </Typography>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              💼 <strong>{diffData.cloudPortfoliosCount}</strong> พอร์ตโฟลิโอ
            </Typography>

            <Divider sx={{ my: 1, borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }} />
            <Typography variant="caption" color="text.secondary" display="block">
              อัปเดต: {formattedCloudDate}
            </Typography>
          </Box>

          {/* Local Box */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
              bgcolor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <Laptop size={18} />
              <Typography variant="subtitle2" fontWeight="bold">
                เครื่องนี้ (Local Device)
              </Typography>
            </Stack>

            <Typography variant="body2" sx={{ mb: 0.5 }}>
              📊 <strong>{diffData.localPlansCount}</strong> แผนการเทรด
            </Typography>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              💼 <strong>{diffData.localPortfoliosCount}</strong> พอร์ตโฟลิโอ
            </Typography>

            <Divider sx={{ my: 1, borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }} />
            <Typography variant="caption" color="text.secondary" display="block">
              ข้อมูลปัจจุบันใน Browser นี้
            </Typography>
          </Box>
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 0.5, lineHeight: 1.5 }}>
          ⚠️ <em>หมายเหตุ: หากเลือก &quot;ดึงข้อมูลและอัปเดต&quot; ข้อมูลในเครื่องนี้จะถูกแทนที่ด้วยข้อมูลจาก Cloud และหน้าระบบจะรีโหลดอัตโนมัติ</em>
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1.5 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={handleKeepLocal}
          disabled={isApplying}
          sx={{
            flex: 1,
            py: 1.2,
            borderRadius: 2.5,
            textTransform: 'none',
            borderColor: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
            '&:hover': {
              borderColor: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
              bgcolor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
            },
          }}
        >
          <Stack alignItems="center" spacing={0.2}>
            <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
              คงข้อมูลในเครื่องนี้ไว้
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.75, whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
              (Keep Local)
            </Typography>
          </Stack>
        </Button>

        <Button
          variant="contained"
          onClick={handleConfirmUpdate}
          disabled={isApplying}
          startIcon={isApplying ? <CircularProgress size={18} color="inherit" /> : <CloudDownload size={20} />}
          sx={{
            flex: 1.15,
            py: 1.2,
            borderRadius: 2.5,
            textTransform: 'none',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              boxShadow: '0 6px 18px rgba(16, 185, 129, 0.45)',
            },
          }}
        >
          <Stack alignItems="center" spacing={0.2}>
            <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', color: '#ffffff' }}>
              {isApplying ? 'กำลังอัปเดตข้อมูล...' : 'ดึงข้อมูลและอัปเดต'}
            </Typography>
            {!isApplying && (
              <Typography variant="caption" sx={{ opacity: 0.9, whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#e6fffa' }}>
                (Pull &amp; Update)
              </Typography>
            )}
          </Stack>
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GistSyncStartupModal;
