/**
 * Route: /
 * Section: ExitStrategySection (ส่วนกำหนดกลยุทธ์การขายทำกำไร Exit Strategy / Take Profit)
 */

import React from 'react';
import {
  Typography,
  Divider,
  TextField,
  InputAdornment,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { Percent, DollarSign } from 'lucide-react';

interface ExitStrategySectionProps {
  /** สกุลเงิน ('THB' หรือ 'USD') */
  currency: 'THB' | 'USD';
  /** อัตราแลกเปลี่ยน */
  exchangeRate?: number;
  /** ราคาต้นทุนเฉลี่ยต่อหุ้น */
  averageCost?: number;
  /** จำนวนไม้ทั้งหมดในแผน */
  tranchesCount: number;
  /** เปอร์เซ็นต์กำไรเป้าหมายที่ต้องการ */
  targetProfitPercent: string;
  /** ราคาขายจริงที่ระบุ */
  actualSellPrice: string;
  /** จำนวนไม้ที่ซื้อได้จริง */
  actualTranchesCount: string;
  /** ฟังก์ชันส่งค่าการเปลี่ยนแปลงฟิลด์กลับ */
  onChange: (field: string, value: string) => void;
}

/**
 * คอมโพเนนต์สำหรับกำหนดเป้าหมายการขายทำกำไร และจำลองราคาขายจริง
 * 
 * @param props - คุณสมบัติของคอมโพเนนต์
 * @returns JSX Element สำหรับส่วน Exit Strategy
 */
export const ExitStrategySection: React.FC<ExitStrategySectionProps> = ({
  currency,
  tranchesCount,
  targetProfitPercent,
  actualSellPrice,
  actualTranchesCount,
  onChange,
}) => {
  return (
    <>
      <Divider sx={{ my: 1.5, opacity: 0.1 }} />

      <Typography
        variant="subtitle2"
        color="primary.light"
        fontWeight="bold"
        sx={{ fontFamily: 'Prompt', display: 'flex', alignItems: 'center', gap: 1 }}
      >
        🎯 กลยุทธ์การขายทำกำไร (Exit Strategy)
      </Typography>

      {/* Target Profit % */}
      <TextField
        label="เปอร์เซ็นต์กำไรที่ต้องการ (%)"
        type="number"
        placeholder="เช่น 10 หรือ 15"
        value={targetProfitPercent}
        onChange={(e) => onChange('targetProfitPercent', e.target.value)}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Percent size={18} color="#10b981" />
            </InputAdornment>
          ),
        }}
        helperText="คำนวณราคาขายเป้าหมายที่หักค่าธรรมเนียมแล้ว"
        sx={{
          '& .MuiFormHelperText-root': { fontFamily: 'Prompt', color: 'text.secondary' },
        }}
      />

      {/* Actual Selling Price */}
      <TextField
        label={currency === 'USD' ? 'ราคาที่ขายจริง (USD)' : 'ราคาที่ขายจริง (บาท)'}
        type="number"
        placeholder="0.00"
        value={actualSellPrice}
        onChange={(e) => onChange('actualSellPrice', e.target.value)}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <DollarSign size={18} color="#3b82f6" />
            </InputAdornment>
          ),
        }}
        helperText="ระบุเพื่อคำนวณผลกำไร/ขาดทุนสุทธิหลังขายจริง"
        sx={{
          '& .MuiFormHelperText-root': { fontFamily: 'Prompt', color: 'text.secondary' },
        }}
      />

      {/* Actual Tranches Count */}
      <FormControl fullWidth>
        <FormLabel sx={{ mb: 1, fontSize: '0.875rem', color: 'text.secondary', fontFamily: 'Prompt' }}>
          จำนวนไม้ที่ได้ซื้อจริง (Actual Tranches Bought)
        </FormLabel>
        <Select
          value={
            (parseInt(actualTranchesCount) <= tranchesCount ? actualTranchesCount : '') ||
            tranchesCount.toString()
          }
          onChange={(e) => onChange('actualTranchesCount', e.target.value as string)}
          sx={{ borderRadius: '12px' }}
        >
          {Array.from({ length: tranchesCount }, (_, i) => i + 1).map((val) => (
            <MenuItem key={val} value={val.toString()} style={{ fontFamily: 'Prompt' }}>
              {val} ไม้ (จากทั้งหมด {tranchesCount} ไม้)
            </MenuItem>
          ))}
        </Select>
        <FormHelperText sx={{ fontFamily: 'Prompt', mt: 0.5, color: 'text.secondary' }}>
          เลือกจำนวนไม้ที่ร่วงลงมาและซื้อได้จริง เพื่อวิเคราะห์ผลการลงทุนจริงสะสม
        </FormHelperText>
      </FormControl>
    </>
  );
};

export default ExitStrategySection;
