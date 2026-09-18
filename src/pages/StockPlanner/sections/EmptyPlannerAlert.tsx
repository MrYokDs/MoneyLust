/**
 * Route: /
 * Section: EmptyPlannerAlert (กล่องแจ้งเตือนเมื่อยังไม่ได้กรอกข้อมูลหรือคำนวณผลลัพธ์)
 */

import React from 'react';
import { Box, Alert, Typography } from '@mui/material';

export const EmptyPlannerAlert: React.FC = () => {
  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
      }}
    >
      <Alert
        severity="info"
        sx={{
          borderRadius: 4,
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.1)',
          maxWidth: 500,
          p: 3,
          '& .MuiAlert-icon': {
            alignItems: 'center',
            fontSize: '2rem',
          },
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" mb={1} fontFamily="Prompt">
          ยินดีต้อนรับสู่ WealthFlow Stock Grid Planner
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Prompt' }}>
          กรุณากรอก <strong>ราคาปัจจุบัน</strong>, <strong>งบลงทุนทั้งหมด</strong>, และ{' '}
          <strong>จำนวนไม้ที่ต้องการแบ่งซื้อ</strong> ทางแถบด้านซ้ายมือ
          เพื่อเปิดระบบคำนวณและแสดงแผนผังการถัวเฉลี่ยหุ้นแบบเรียลไทม์ทันทีครับ!
        </Typography>
      </Alert>
    </Box>
  );
};

export default EmptyPlannerAlert;
