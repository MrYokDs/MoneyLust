/**
 * Component: src/components/WebullTokenModal.tsx
 * หน้าต่าง Modal จัดการ Webull Access Token: ตรวจสอบสถานะ, ต่ออายุ (Refresh), และขอ Token ใหม่พร้อมอัปเดตไฟล์อัตโนมัติ
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  useTheme,
} from '@mui/material';
import {
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  fetchWebullTokenStatus,
  refreshWebullToken,
  createWebullToken,
  verifyWebullToken,
  WebullTokenInfo,
} from '../utils/webullTokenService';

interface WebullTokenModalProps {
  open: boolean;
  onClose: () => void;
  onTokenUpdated?: (newToken: string) => void;
}

/**
 * คอมโพเนนต์หน้าต่างจัดการและต่ออายุ Webull Access Token
 * 
 * @param props - พารามิเตอร์ open, onClose, onTokenUpdated
 * @returns JSX Element สำหรับ Dialog
 */
export const WebullTokenModal: React.FC<WebullTokenModalProps> = ({
  open,
  onClose,
  onTokenUpdated,
}) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const [tokenInfo, setTokenInfo] = useState<WebullTokenInfo | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isPollingVerification, setIsPollingVerification] = useState<boolean>(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const pollIntervalRef = useRef<any>(null);

  /**
   * ดึงข้อมูลสถานะล่าสุดของ Token จาก API
   */
  const loadStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    const info = await fetchWebullTokenStatus();
    setTokenInfo(info);
    setIsLoadingStatus(false);
  }, []);

  // โหลดสถานะเมื่อเปิด Modal
  useEffect(() => {
    if (open) {
      loadStatus();
      setAlertMessage(null);
      setIsPollingVerification(false);
      setPendingToken(null);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
  }, [open, loadStatus]);

  // ล้าง Interval เมื่อ Unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  /**
   * คัดลอก Token ลงใน Clipboard
   */
  const handleCopyToken = () => {
    const tokenToCopy = pendingToken || tokenInfo?.token;
    if (tokenToCopy) {
      navigator.clipboard.writeText(tokenToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /**
   * ดำเนินการต่ออายุ Token ปัจจุบัน (Refresh)
   */
  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    setAlertMessage(null);
    try {
      const res = await refreshWebullToken();
      if (res.success && res.token) {
        setTokenInfo(res);
        setAlertMessage({ type: 'success', text: 'ต่ออายุ Token และบันทึกลง .env.local สำเร็จเรียบร้อย!' });
        if (onTokenUpdated) onTokenUpdated(res.token);
      } else {
        setAlertMessage({ type: 'error', text: res.message || 'ไม่สามารถต่ออายุ Token ได้ กรุณากดขอ Token ใหม่' });
      }
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการต่ออายุ' });
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * เริ่มต้นการขอ Token ใหม่ผ่านแอป Webull (Create Token)
   */
  const handleCreateNewToken = async () => {
    setIsCreating(true);
    setAlertMessage(null);
    try {
      const res = await createWebullToken();
      if (res.success && res.token) {
        setPendingToken(res.token);
        setIsPollingVerification(true);
        setAlertMessage({
          type: 'info',
          text: 'ระบบส่งคำขอแล้ว! กรุณาเปิดแอป Webull บนมือถือ แล้วแตะ "อนุมัติ" (Authorize)',
        });

        // เริ่มต้นการ Poll เช็คสถานะการอนุมัติทุกๆ 2 วินาที
        const targetToken = res.token;
        let attempts = 0;
        const maxAttempts = 60; // 120 วินาที

        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = setInterval(async () => {
          attempts += 1;
          if (attempts > maxAttempts) {
            clearInterval(pollIntervalRef.current);
            setIsPollingVerification(false);
            setAlertMessage({ type: 'error', text: 'หมดเวลารอการอนุมัติ กรุณากดขอ Token ใหม่อีกครั้ง' });
            return;
          }

          const verifyRes = await verifyWebullToken(targetToken);
          if (verifyRes.success && verifyRes.isVerified) {
            clearInterval(pollIntervalRef.current);
            setIsPollingVerification(false);
            setTokenInfo(verifyRes);
            setAlertMessage({
              type: 'success',
              text: 'อนุมัติสำเร็จ! บันทึก Access Token ใหม่ลง .env.local เรียบร้อย ข้อมูลพร้อมใช้งานทันที',
            });
            if (onTokenUpdated) onTokenUpdated(targetToken);
          }
        }, 2000);
      } else {
        setAlertMessage({ type: 'error', text: res.message || 'ไม่สามารถส่งคำขอสร้าง Token ได้' });
      }
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setIsCreating(false);
    }
  };

  const isNormal = tokenInfo?.isNormal && !tokenInfo?.isExpired;
  const isExpiringSoon = isNormal && (tokenInfo?.daysRemaining ?? 15) <= 2;
  const isExpired = tokenInfo?.isExpired || (!isNormal && tokenInfo?.status !== 'NORMAL');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          bgcolor: isLight ? '#ffffff' : '#111827',
          backgroundImage: 'none',
          border: '1px solid',
          borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
          boxShadow: isLight ? '0 10px 40px rgba(0,0,0,0.1)' : '0 20px 60px rgba(0,0,0,0.5)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              p: 1,
              borderRadius: '10px',
              bgcolor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <KeyRound size={22} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Prompt', fontSize: '1.1rem' }}>
              จัดการ Webull Access Token
            </Typography>
            <Typography variant="caption" color="text.secondary">
              เชื่อมต่อ Webull OpenAPI สด ปลอดภัย ไร้กังวลเรื่อง Token หมดอายุ
            </Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 2.5 }}>
        {/* Status Alert Banner */}
        {alertMessage && (
          <Alert
            severity={alertMessage.type}
            sx={{
              mb: 2.5,
              borderRadius: '10px',
              fontSize: '0.85rem',
              alignItems: 'center',
            }}
            onClose={() => setAlertMessage(null)}
          >
            {alertMessage.text}
          </Alert>
        )}

        {isExpired && !alertMessage && (
          <Alert
            severity="error"
            sx={{
              mb: 2.5,
              borderRadius: '10px',
              fontSize: '0.85rem',
              alignItems: 'center',
            }}
          >
            Webull Access Token หมดอายุแล้ว กรุณากดปุ่ม <strong>"ขอ Token ใหม่"</strong> ด้านล่างเพื่อส่งคำขออนุมัติไปยังแอปมือถือ
          </Alert>
        )}

        {/* Current Token Card */}
        <Paper
          sx={{
            p: 2.5,
            mb: 2.5,
            borderRadius: '12px',
            bgcolor: isLight ? '#f9fafb' : 'rgba(255,255,255,0.03)',
            border: '1px solid',
            borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5} flexWrap="wrap" gap={1}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'text.secondary' }}>
              สถานะการเชื่อมต่อ OpenAPI
            </Typography>
            {isLoadingStatus ? (
              <CircularProgress size={18} sx={{ color: '#10b981' }} />
            ) : isNormal ? (
              <Chip
                icon={<ShieldCheck size={16} />}
                label={isExpiringSoon ? 'ใกล้หมดอายุ' : 'พร้อมใช้งาน (NORMAL)'}
                color={isExpiringSoon ? 'warning' : 'success'}
                size="small"
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
              />
            ) : (
              <Chip
                icon={<AlertTriangle size={16} />}
                label="หมดอายุ / ไม่ถูกต้อง"
                color="error"
                size="small"
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
              />
            )}
          </Box>

          <Stack spacing={1.2}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                อายุการใช้งานคงเหลือ:
              </Typography>
              <Typography variant="body2" fontWeight="bold" sx={{ color: isNormal ? '#10b981' : '#ef4444' }}>
                {tokenInfo?.daysRemaining !== undefined
                  ? `${tokenInfo.daysRemaining} วัน (~${tokenInfo.hoursRemaining || 0} ชม.)`
                  : '-'}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                วันและเวลาที่หมดอายุ:
              </Typography>
              <Typography variant="body2" fontWeight="500">
                {tokenInfo?.expiresDate || '-'}
              </Typography>
            </Box>

            <Divider sx={{ my: 0.5, opacity: 0.5 }} />

            {/* Token String & Copy button */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Access Token ปัจจุบัน (บันทึกใน .env.local):
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.2,
                  borderRadius: '8px',
                  bgcolor: isLight ? '#ffffff' : '#0b0f19',
                  border: '1px solid',
                  borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    letterSpacing: '0.5px',
                    color: 'text.primary',
                    wordBreak: 'break-all',
                  }}
                >
                  {pendingToken || tokenInfo?.token || 'ยังไม่มี Token'}
                </Typography>
                <Tooltip title={copied ? 'คัดลอกเรียบร้อย!' : 'คัดลอก Token'}>
                  <IconButton size="small" onClick={handleCopyToken} sx={{ ml: 1, color: copied ? '#10b981' : 'text.secondary' }}>
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Stack>
        </Paper>

        {/* Polling Step-by-Step Interactive Guide */}
        {isPollingVerification && (
          <Paper
            sx={{
              p: 2.5,
              mb: 2,
              borderRadius: '12px',
              bgcolor: 'rgba(16, 185, 129, 0.08)',
              border: '1.5px solid #10b981',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
              <CircularProgress size={22} sx={{ color: '#10b981' }} />
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#10b981', fontFamily: 'Prompt' }}>
                กำลังรอคุณกดอนุมัติในแอป Webull...
              </Typography>
            </Stack>

            <Stack spacing={1} pl={0.5}>
              <Box display="flex" alignItems="center" gap={1}>
                <Smartphone size={18} color="#10b981" />
                <Typography variant="body2">
                  1. เปิดแอปพลิเคชัน <strong>Webull</strong> บนโทรศัพท์มือถือของคุณ
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <ShieldCheck size={18} color="#10b981" />
                <Typography variant="body2">
                  2. แตะที่การแจ้งเตือน (Push Notification) หรือเมนูแจ้งเตือนระบบ
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Check size={18} color="#10b981" />
                <Typography variant="body2">
                  3. กดปุ่ม <strong>"อนุมัติ" (Authorize / Confirm)</strong>
                </Typography>
              </Box>
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              * เมื่อคุณกดอนุมัติแล้ว ระบบจะบันทึก Token ใหม่ลงใน .env.local และเปิดใช้งานให้อัตโนมัติทันที
            </Typography>
          </Paper>
        )}

        {/* Actions Guide */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 0.5 }}>
          💡 <strong>เคล็ดลับ</strong>: หาก Token ยังไม่หมดอายุ คุณสามารถกด <strong>"ต่ออายุทันที (Refresh)"</strong> เพื่อขยายวันใช้งานได้โดยไม่ต้องเปิดแอปมือถือ แต่หาก Token หมดอายุแล้ว ให้กด <strong>"ขอ Token ใหม่"</strong>
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid',
          borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
          justifyContent: 'space-between',
        }}
      >
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 500 }}>
          ปิดหน้าต่าง
        </Button>

        <Stack direction="row" spacing={1.5}>
          {/* Refresh Token Button */}
          <Button
            variant="outlined"
            color="primary"
            startIcon={isRefreshing ? <CircularProgress size={16} /> : <RefreshCw size={16} />}
            onClick={handleRefreshToken}
            disabled={isRefreshing || isCreating || isPollingVerification}
            sx={{ fontWeight: 600, borderRadius: '8px' }}
          >
            ต่ออายุทันที (Refresh)
          </Button>

          {/* Create New Token Button */}
          <Button
            variant="contained"
            color="success"
            startIcon={isCreating ? <CircularProgress size={16} color="inherit" /> : <Smartphone size={16} />}
            onClick={handleCreateNewToken}
            disabled={isRefreshing || isCreating || isPollingVerification}
            sx={{
              fontWeight: 600,
              borderRadius: '8px',
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669' },
            }}
          >
            ขอ Token ใหม่
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default WebullTokenModal;
