/**
 * Component: DataBackupModal
 * หน้าต่างจัดการสำรองข้อมูล (Export) กู้คืนข้อมูล (Import) และซิงค์ข้อมูลผ่าน GitHub Gist (Cloud Sync)
 * ช่วยให้ผู้ใช้ย้ายแผนการลงทุนจาก Localhost ไปยังเว็บจริงบน Vercel และใช้งานข้ามอุปกรณ์ได้อย่างง่ายดาย
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  Typography,
  Stack,
  Box,
  Alert,
  Divider,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Database,
  Download,
  Upload,
  Copy,
  Check,
  FileJson,
  X,
  RefreshCw,
  Cloud,
  CloudUpload,
  CloudDownload,
  Key,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import {
  downloadBackupJson,
  copyBackupToClipboard,
  importBackupFromJson,
  getExportPayload,
} from '../utils/dataBackup';
import {
  getGistSyncStatus,
  initializeOrLinkGist,
  uploadDataToGist,
  downloadDataFromGist,
  disconnectGist,
  GistSyncStatus,
} from '../utils/githubGistSync';

/**
 * คอมโพเนนต์หน้าต่างสำรอง กู้คืน และซิงค์ข้อมูลคลาวด์ (Data Backup & GitHub Gist Sync Modal)
 * 
 * @returns JSX Element สำหรับปุ่มเปิดและ Dialog สำรองข้อมูล
 */
export const DataBackupModal: React.FC = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const [open, setOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>('');
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // สถานะ GitHub Gist
  const [tokenInput, setTokenInput] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<GistSyncStatus>(getGistSyncStatus());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // คำนวณจำนวนข้อมูลที่มีอยู่ในปัจจุบัน
  const currentPayload = open ? getExportPayload() : null;
  let plansCount = 0;
  let portfoliosCount = 0;
  if (currentPayload?.data) {
    try {
      if (currentPayload.data.wealthflow_saved_plans) {
        plansCount = JSON.parse(currentPayload.data.wealthflow_saved_plans).length || 0;
      }
      if (currentPayload.data.wealthflow_portfolios) {
        portfoliosCount = JSON.parse(currentPayload.data.wealthflow_portfolios).length || 0;
      }
    } catch {
      // ignore
    }
  }

  // อัปเดตสถานะ Gist เมื่อเปิดหน้าต่าง
  useEffect(() => {
    if (open) {
      setSyncStatus(getGistSyncStatus());
    }
  }, [open]);

  /**
   * เปิดหน้าต่าง Modal สำรองข้อมูล
   */
  const handleOpen = () => {
    setAlertInfo(null);
    setCopied(false);
    setPasteText('');
    setSyncStatus(getGistSyncStatus());
    setOpen(true);
  };

  /**
   * ปิดหน้าต่าง Modal
   */
  const handleClose = () => {
    setOpen(false);
  };

  /**
   * จัดการเปลี่ยนแท็บระหว่าง Cloud Sync และ File Backup
   * 
   * @param _e - React SyntheticEvent
   * @param newValue - ดัชนีแท็บใหม่
   */
  const handleTabChange = (_e: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setAlertInfo(null);
  };

  /**
   * บันทึกการเชื่อมต่อ GitHub Personal Access Token และสร้าง/เชื่อมต่อ Gist
   */
  const handleConnectGist = async () => {
    if (!tokenInput.trim()) {
      setAlertInfo({ type: 'error', message: 'กรุณากรอก GitHub Personal Access Token' });
      return;
    }
    setIsLoading(true);
    setAlertInfo(null);

    const res = await initializeOrLinkGist(tokenInput.trim());
    setIsLoading(false);

    if (res.success) {
      setTokenInput('');
      setSyncStatus(getGistSyncStatus());
      setAlertInfo({ type: 'success', message: res.message });
    } else {
      setAlertInfo({ type: 'error', message: res.message });
    }
  };

  /**
   * อัปโหลดข้อมูลแผนการลงทุนปัจจุบันขึ้นสู่ GitHub Gist
   */
  const handleUploadToGist = async () => {
    setIsLoading(true);
    setAlertInfo(null);

    const res = await uploadDataToGist();
    setIsLoading(false);

    if (res.success) {
      setSyncStatus(getGistSyncStatus());
      setAlertInfo({ type: 'success', message: res.message });
    } else {
      setAlertInfo({ type: 'error', message: res.message });
    }
  };

  /**
   * ดึงข้อมูลล่าสุดจาก GitHub Gist ลงมาเขียนทับในเครื่อง และรีโหลดหน้าเว็บ
   */
  const handleDownloadFromGist = async () => {
    if (!window.confirm('คำเตือน: การดึงข้อมูลจาก Cloud จะเขียนทับข้อมูลในเครื่องนี้ด้วยข้อมูลล่าสุดจาก GitHub คุณต้องการดำเนินการต่อหรือไม่?')) {
      return;
    }

    setIsLoading(true);
    setAlertInfo(null);

    const res = await downloadDataFromGist();
    setIsLoading(false);

    if (res.success) {
      setSyncStatus(getGistSyncStatus());
      setAlertInfo({ type: 'success', message: `${res.message} กำลังรีโหลดหน้าเว็บ...` });
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      setAlertInfo({ type: 'error', message: res.message });
    }
  };

  /**
   * ยกเลิกการเชื่อมต่อกับ GitHub Gist บนเครื่องนี้
   */
  const handleDisconnectGist = () => {
    if (window.confirm('คุณต้องการยกเลิกการเชื่อมต่อ GitHub Gist ในเครื่องนี้ใช่หรือไม่? (ไฟล์บน GitHub จะไม่ถูกลบ)')) {
      disconnectGist();
      setSyncStatus(getGistSyncStatus());
      setAlertInfo({ type: 'info', message: 'ยกเลิกการเชื่อมต่อเรียบร้อยแล้ว' });
    }
  };

  /**
   * ดาวน์โหลดไฟล์สำรองข้อมูลนามสกุล .json ลงเครื่อง
   */
  const handleDownload = () => {
    const filename = downloadBackupJson();
    setAlertInfo({ type: 'success', message: `ดาวน์โหลดไฟล์ ${filename} เรียบร้อยแล้ว` });
  };

  /**
   * คัดลอกข้อมูล JSON ทั้งหมดลงคลิปบอร์ด
   */
  const handleCopy = async () => {
    const ok = await copyBackupToClipboard();
    if (ok) {
      setCopied(true);
      setAlertInfo({ type: 'success', message: 'คัดลอกข้อมูลทั้งหมดลงในคลิปบอร์ดแล้ว! สามารถนำไปวางบน Vercel ได้ทันที' });
      setTimeout(() => setCopied(false), 3000);
    } else {
      setAlertInfo({ type: 'error', message: 'ไม่สามารถคัดลอกข้อมูลได้ กรุณาลองใช้การดาวน์โหลดไฟล์แทน' });
    }
  };

  /**
   * นำเข้าข้อมูลสำรองจากไฟล์ .json ที่ผู้ใช้อัปโหลด
   * 
   * @param e - Event เมื่อเลือกไฟล์
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importBackupFromJson(content);
        if (result.success) {
          setAlertInfo({ type: 'success', message: `${result.message} กำลังรีโหลดหน้าเว็บ...` });
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          setAlertInfo({ type: 'error', message: result.message });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  /**
   * กู้คืนข้อมูลจากข้อความ JSON ที่ผู้ใช้นำมาวาง
   */
  const handleRestoreFromPaste = () => {
    if (!pasteText.trim()) {
      setAlertInfo({ type: 'error', message: 'กรุณาวางโค้ด JSON ก่อนกู้คืนข้อมูล' });
      return;
    }

    const result = importBackupFromJson(pasteText.trim());
    if (result.success) {
      setAlertInfo({ type: 'success', message: `${result.message} กำลังรีโหลดหน้าเว็บ...` });
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      setAlertInfo({ type: 'error', message: result.message });
    }
  };

  return (
    <>
      <Tooltip title="สำรองและซิงค์ข้อมูล (Cloud Sync & Backup)" arrow>
        <IconButton
          onClick={handleOpen}
          color="inherit"
          sx={{
            p: 1,
            borderRadius: 2,
            transition: 'all 0.2s',
            position: 'relative',
            '&:hover': {
              backgroundColor: isLight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
            },
          }}
        >
          <Database size={19} />
          {syncStatus.isConnected && (
            <Box
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }}
            />
          )}
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: isLight ? '#ffffff' : '#0f172a',
            backgroundImage: 'none',
            border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                p: 0.8,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Database size={18} />
            </Box>
            <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Prompt', fontSize: '1.05rem' }}>
              จัดการข้อมูลและซิงค์คลาวด์ (Cloud Sync & Backup)
            </Typography>
          </Stack>
          <IconButton size="small" onClick={handleClose} sx={{ opacity: 0.7 }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>

        {/* แถบเลือกโหมด: Cloud Sync กับ File Backup */}
        <Box sx={{ borderBottom: 1, borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', px: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              minHeight: 42,
              '& .MuiTab-root': {
                minHeight: 42,
                fontSize: '0.85rem',
                textTransform: 'none',
                fontWeight: 600,
              },
            }}
          >
            <Tab icon={<Cloud size={16} />} iconPosition="start" label="Cloud Sync (GitHub Gist)" />
            <Tab icon={<FileJson size={16} />} iconPosition="start" label="ไฟล์สำรอง (JSON)" />
          </Tabs>
        </Box>

        <DialogContent sx={{ py: 2 }}>
          {alertInfo && (
            <Alert severity={alertInfo.type} sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setAlertInfo(null)}>
              {alertInfo.message}
            </Alert>
          )}

          {/* สรุปข้อมูลปัจจุบัน */}
          <Box
            sx={{
              mb: 2.5,
              p: 1.5,
              borderRadius: 2,
              background: isLight ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)',
              border: isLight ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.2 }}>
                ข้อมูลบนเครื่องนี้:
              </Typography>
              <Typography variant="body2" fontWeight="bold" sx={{ color: isLight ? '#065f46' : '#34d399' }}>
                📊 {plansCount} แผนการเทรด | 📁 {portfoliosCount} พอร์ตโฟลิโอ
              </Typography>
            </Box>
            {syncStatus.isConnected && (
              <Chip
                label="เชื่อมต่อ Cloud แล้ว"
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontSize: '0.72rem', height: 24 }}
              />
            )}
          </Box>

          {/* TAB 0: GitHub Gist Cloud Sync */}
          {activeTab === 0 && (
            <Box>
              {!syncStatus.isConnected ? (
                /* หน้าต่างตอนยังไม่ได้เชื่อมต่อ Token */
                <Stack spacing={2}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: isLight ? 'rgba(59, 130, 246, 0.06)' : 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#3b82f6', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Cloud size={16} /> ซิงค์ข้อมูลข้ามอุปกรณ์ฟรี 100%
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5, display: 'block' }}>
                      บันทึกแผนและพอร์ตของคุณขึ้น GitHub Secret Gist (ส่วนตัว ปลอดภัย ไม่มีใครมองเห็น) ทำให้เปิดใช้งานบน Vercel, มือถือ หรือคอมเครื่องอื่นได้ทันที
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600, display: 'block', mb: 1 }}>
                      ใส่ GitHub Personal Access Token (Classic):
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      InputProps={{
                        startAdornment: <Key size={16} style={{ marginRight: 8, opacity: 0.6 }} />,
                      }}
                      sx={{ mb: 1.5 }}
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleConnectGist}
                      disabled={isLoading || !tokenInput.trim()}
                      startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <Cloud size={16} />}
                      sx={{
                        py: 1.1,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        fontWeight: 600,
                      }}
                    >
                      {isLoading ? 'กำลังเชื่อมต่อกับ GitHub...' : 'เชื่อมต่อและเปิดใช้งาน Cloud Sync'}
                    </Button>
                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block', fontSize: '0.72rem' }}>
                      * Token ต้องมีสิทธิ์ (Scope) <b>gist</b> เท่านั้น ข้อมูลจะถูกเก็บเฉพาะในเครื่องของคุณ ไม่ผ่านเซิร์ฟเวอร์อื่น
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                /* หน้าต่างตอนเชื่อมต่อ Token เรียบร้อยแล้ว */
                <Stack spacing={2.5}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: isLight ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Cloud size={17} /> เชื่อมต่อกับ GitHub Secret Gist เรียบร้อย
                      </Typography>
                      {syncStatus.gistUrl && (
                        <Tooltip title="เปิดดูไฟล์บน GitHub Gist">
                          <IconButton
                            size="small"
                            component="a"
                            href={syncStatus.gistUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: '#10b981' }}
                          >
                            <ExternalLink size={16} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>

                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      รหัส Gist ID: <code>{syncStatus.gistId || 'กำลังค้นหา...'}</code>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      ซิงค์ล่าสุด: {syncStatus.lastSyncAt ? new Date(syncStatus.lastSyncAt).toLocaleString('th-TH') : 'ยังไม่มีการซิงค์'}
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    {/* ปุ่มอัปโหลด */}
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <CloudUpload size={17} />}
                      onClick={handleUploadToGist}
                      disabled={isLoading}
                      sx={{
                        py: 1.2,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                      }}
                    >
                      อัปโหลดขึ้น Cloud (Upload)
                    </Button>

                    {/* ปุ่มดาวน์โหลด */}
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <CloudDownload size={17} />}
                      onClick={handleDownloadFromGist}
                      disabled={isLoading}
                      sx={{
                        py: 1.2,
                        borderRadius: 2,
                        fontSize: '0.82rem',
                        fontWeight: 600,
                      }}
                    >
                      ดึงข้อมูลจาก Cloud (Download)
                    </Button>
                  </Stack>

                  <Divider sx={{ my: 1, opacity: 0.15 }} />

                  <Button
                    variant="text"
                    color="error"
                    size="small"
                    startIcon={<LogOut size={15} />}
                    onClick={handleDisconnectGist}
                    sx={{ alignSelf: 'flex-start', fontSize: '0.75rem', opacity: 0.8 }}
                  >
                    ยกเลิกการเชื่อมต่อกับ GitHub บนเครื่องนี้
                  </Button>
                </Stack>
              )}
            </Box>
          )}

          {/* TAB 1: File Backup & Manual Import (JSON) */}
          {activeTab === 1 && (
            <Box>
              {/* ส่วนที่ 1: ส่งออกข้อมูล (Export) */}
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Download size={16} color="#10b981" /> 1. ส่งออกข้อมูล (Export ไฟล์ JSON)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5, lineHeight: 1.4 }}>
                ใช้สำหรับดึงข้อมูลเพื่อนำไปเปิดบน Vercel หรือเซฟเก็บไว้เป็นไฟล์สำรองป้องกันข้อมูลหาย
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<FileJson size={16} />}
                  onClick={handleDownload}
                  sx={{ flex: 1, py: 1, fontSize: '0.8rem', borderRadius: 2 }}
                >
                  ดาวน์โหลดไฟล์ (.json)
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  onClick={handleCopy}
                  sx={{ flex: 1, py: 1, fontSize: '0.8rem', borderRadius: 2 }}
                >
                  {copied ? 'คัดลอกเรียบร้อยแล้ว!' : 'คัดลอกข้อมูล (Copy)'}
                </Button>
              </Stack>

              <Divider sx={{ my: 2.5, opacity: 0.1 }} />

              {/* ส่วนที่ 2: นำเข้าข้อมูล (Import) */}
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Upload size={16} color="#3b82f6" /> 2. นำเข้าข้อมูล (Import ไฟล์ JSON)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5, lineHeight: 1.4 }}>
                เลือกไฟล์สำรอง (.json) หรือวางข้อความ JSON ที่คัดลอกมาจาก Localhost เพื่อกู้คืนแผนทั้งหมด
              </Typography>

              <Stack spacing={1.5}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<Upload size={16} />}
                  sx={{
                    py: 1,
                    fontSize: '0.82rem',
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  }}
                >
                  เลือกไฟล์สำรองเพื่อกู้คืน (.json)
                  <input type="file" accept=".json" hidden onChange={handleFileUpload} />
                </Button>

                <Box sx={{ mt: 1 }}>
                  <TextField
                    placeholder="หรือวางข้อความ JSON ที่คัดลอกมาที่นี่..."
                    multiline
                    rows={2}
                    fullWidth
                    size="small"
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    sx={{
                      '& .MuiInputBase-root': { fontSize: '0.75rem', fontFamily: 'monospace' },
                    }}
                  />
                  {pasteText.trim() && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="info"
                      startIcon={<RefreshCw size={14} />}
                      onClick={handleRestoreFromPaste}
                      sx={{ mt: 1, fontSize: '0.75rem' }}
                    >
                      เริ่มกู้คืนจากข้อความที่วาง
                    </Button>
                  )}
                </Box>
              </Stack>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={handleClose} sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            ปิดหน้าต่าง
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DataBackupModal;
