/**
 * Component: src/components/WebullTokenBadge.tsx
 * ปุ่ม Badge บน AppBar แสดงสถานะ Webull Access Token และคลิกเพื่อเปิดหน้าต่างจัดการต่ออายุ Token
 */

import React, { useState, useEffect, useCallback } from 'react';
import { IconButton, Tooltip, Box, Typography, Stack, useTheme } from '@mui/material';
import { Activity, ShieldAlert } from 'lucide-react';
import { fetchWebullTokenStatus, WebullTokenInfo } from '../utils/webullTokenService';
import { WebullTokenModal } from './WebullTokenModal';

/**
 * คอมโพเนนต์ปุ่มไอคอนแสดงสถานะ Webull OpenAPI และอายุ Token บน AppBar
 * ออกแบบให้มีขนาด รูปทรง และไฟสถานะกลมกลืนเข้ากับปุ่มอื่นๆ (หมุด, ฐานข้อมูล, ธีม)
 * โดยแสดงรายละเอียดชื่อ Webull และอายุวันคงเหลือผ่าน Tooltip เมื่อเลื่อนเมาส์ชี้
 * 
 * @returns JSX.Element สำหรับปุ่มไอคอนและ Modal จัดการ Token
 */
export const WebullTokenBadge: React.FC = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [tokenInfo, setTokenInfo] = useState<WebullTokenInfo | null>(null);

  /**
   * ฟังก์ชันดึงสถานะ Token ล่าสุดจากเซิร์ฟเวอร์
   */
  const loadStatus = useCallback(async () => {
    const info = await fetchWebullTokenStatus();
    setTokenInfo(info);
  }, []);

  useEffect(() => {
    loadStatus();
    // อัปเดตสถานะทุกๆ 5 นาที
    const interval = setInterval(loadStatus, 300000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  // ดักฟังสัญญาณ Event เมื่อมีคำขอ API แจ้งเตือนว่า Token หมดอายุ เพื่อเปิด Modal ขึ้นมาอัตโนมัติ
  useEffect(() => {
    const handleTokenExpired = () => {
      setModalOpen(true);
      loadStatus();
    };

    window.addEventListener('webull-token-expired', handleTokenExpired);
    return () => window.removeEventListener('webull-token-expired', handleTokenExpired);
  }, [loadStatus]);

  // ดักฟังสัญญาณเปิดหน้าต่างจัดการ Token จากเมนูดรอปดาวน์บนมือถือ
  useEffect(() => {
    const handleOpenModal = () => {
      setModalOpen(true);
      loadStatus();
    };

    window.addEventListener('open-webull-token-modal', handleOpenModal);
    return () => window.removeEventListener('open-webull-token-modal', handleOpenModal);
  }, [loadStatus]);

  const isNormal = tokenInfo?.isNormal && !tokenInfo?.isExpired;
  const daysLeft = tokenInfo?.daysRemaining ?? 15;
  const isExpiringSoon = isNormal && daysLeft <= 2;
  const isExpired = tokenInfo?.isExpired || (!isNormal && tokenInfo?.status !== 'NORMAL');

  // กำหนดสีของจุดสถานะและไอคอน
  const statusColor = isExpired
    ? '#ef4444' // สีแดง (หมดอายุ)
    : isExpiringSoon
    ? '#f59e0b' // สีส้ม (ใกล้หมดอายุ)
    : '#10b981'; // สีเขียว (ปกติ)

  // ข้อความสถานะสำหรับแสดงใน Tooltip
  const statusLabel = isExpired
    ? 'Token หมดอายุแล้ว'
    : isExpiringSoon
    ? `ใกล้หมดอายุ (เหลือ ${daysLeft} วัน)`
    : `เชื่อมต่อปกติ (เหลือ ${daysLeft} วัน)`;

  const actionHint = isExpired
    ? 'คลิกเพื่อขอ Token ใหม่'
    : isExpiringSoon
    ? 'คลิกเพื่อต่ออายุทันที (Refresh)'
    : 'คลิกเพื่อดูรายละเอียด / ต่ออายุ Token';

  return (
    <>
      <Tooltip
        arrow
        placement="bottom"
        title={
          <Box sx={{ p: 0.5, minWidth: 170 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.6 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: statusColor,
                  boxShadow: `0 0 6px ${statusColor}`,
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem', fontFamily: 'Prompt' }}>
                Webull OpenAPI
              </Typography>
            </Stack>

            <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.85)', fontSize: '0.74rem', fontFamily: 'Prompt' }}>
              สถานะ: <b style={{ color: statusColor }}>{statusLabel}</b>
            </Typography>

            <Typography variant="caption" sx={{ display: 'block', mt: 0.2, color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontFamily: 'Prompt' }}>
              อายุคงเหลือ: <b>{daysLeft} วัน</b>
            </Typography>

            <Typography variant="caption" sx={{ display: 'block', mt: 0.8, color: '#38bdf8', fontSize: '0.7rem', fontWeight: 500, fontFamily: 'Prompt' }}>
              ({actionHint})
            </Typography>
          </Box>
        }
      >
        <IconButton
          onClick={() => setModalOpen(true)}
          color="inherit"
          aria-label="Webull OpenAPI Status"
          sx={{
            p: 1,
            borderRadius: 2,
            transition: 'all 0.2s',
            position: 'relative',
            '&:hover': {
              backgroundColor: isLight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.15)',
              color: statusColor,
            },
          }}
        >
          {isExpired ? (
            <ShieldAlert size={19} color="#ef4444" />
          ) : (
            <Activity size={19} />
          )}

          {/* จุดไฟสถานะตรงมุมขวาบน ขนาด 7px สไตล์เดียวกับปุ่มสำรองข้อมูลและหมุด */}
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: statusColor,
              boxShadow: `0 0 6px ${statusColor}`,
            }}
          />
        </IconButton>
      </Tooltip>

      <WebullTokenModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          loadStatus();
        }}
        onTokenUpdated={() => {
          loadStatus();
        }}
      />
    </>
  );
};

export default WebullTokenBadge;
