/**
 * Route: /portfolio/:id
 * Section: EmptyPlansAlert (กล่องแจ้งเตือนกรณีพอร์ตโฟลิโอนี้ยังไม่มีแผนการลงทุน)
 */

import React from 'react';
import { Box, Alert, Typography } from '@mui/material';

export const EmptyPlansAlert: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
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
            alignItems: 'center',
          },
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" mb={0.5} fontFamily="Prompt">
          ยังไม่มีการบันทึกแผนการลงทุน
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Prompt' }}>
          แผนการลงทุนแบ่งไม้ถัวซื้อที่คุณบันทึกจะแสดงรายชื่อตรงนี้
          สามารถบันทึกเพื่อนำกลับมาเปรียบเทียบหรือแก้ไขในภายหลังได้ตลอดเวลา!
        </Typography>
      </Alert>
    </Box>
  );
};

export default EmptyPlansAlert;
