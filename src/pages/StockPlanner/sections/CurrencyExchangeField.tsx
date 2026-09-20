/**
 * Route: /
 * Section: CurrencyExchangeField (ส่วนจัดการสกุลเงิน THB/USD และอัตราแลกเปลี่ยน พร้อมปุ่มแปลงค่าตัวเลข)
 */

import React from 'react';
import {
  FormControl,
  FormLabel,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  InputAdornment,
  Stack,
  Button,
} from '@mui/material';
import { Coins, ArrowLeftRight } from 'lucide-react';

interface CurrencyExchangeFieldProps {
  currency: 'THB' | 'USD';
  exchangeRate: string;
  onCurrencyChange: (currency: 'THB' | 'USD') => void;
  onExchangeRateChange: (rate: string) => void;
  onConvertCurrencyValues?: () => void;
}

/**
 * คอมโพเนนต์สำหรับเลือกสกุลเงิน ตั้งค่าอัตราแลกเปลี่ยน
 * และปุ่มแปลงค่าตัวเลขที่กรอกค้างไว้ตามอัตราแลกเปลี่ยน
 * 
 * @param props - พารามิเตอร์ของคอมโพเนนต์
 * @returns JSX Element สำหรับส่วนจัดการสกุลเงิน
 */
export const CurrencyExchangeField: React.FC<CurrencyExchangeFieldProps> = ({
  currency,
  exchangeRate,
  onCurrencyChange,
  onExchangeRateChange,
  onConvertCurrencyValues,
}) => {
  return (
    <>
      <FormControl fullWidth>
        <FormLabel
          sx={{
            mb: 1,
            fontSize: '0.85rem',
            color: 'text.secondary',
            fontFamily: 'Prompt',
            fontWeight: '500',
          }}
        >
          สกุลเงินที่ใช้งาน (Currency)
        </FormLabel>
        <ToggleButtonGroup
          value={currency}
          exclusive
          onChange={(_, val) => val && onCurrencyChange(val)}
          fullWidth
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              py: 0.75,
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'text.secondary',
              fontFamily: 'Prompt',
              fontSize: '0.825rem',
              fontWeight: 'bold',
              textTransform: 'none',
              '&.Mui-selected': {
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                borderColor: '#10b981',
                color: '#10b981',
                '&:hover': {
                  backgroundColor: 'rgba(16, 185, 129, 0.25)',
                },
              },
            },
          }}
        >
          <ToggleButton value="THB">🇹🇭 THB (บาท)</ToggleButton>
          <ToggleButton value="USD">🇺🇸 USD (ดอลลาร์)</ToggleButton>
        </ToggleButtonGroup>

        {/* ปุ่มแปลงค่าตัวเลขที่กรอกไว้ตามเรตแลกเปลี่ยน */}
        {onConvertCurrencyValues && (
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<ArrowLeftRight size={14} />}
            onClick={onConvertCurrencyValues}
            fullWidth
            sx={{
              mt: 1,
              fontFamily: 'Prompt',
              fontSize: '0.78rem',
              fontWeight: '600',
              borderRadius: 2,
              textTransform: 'none',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              '&:hover': {
                borderColor: '#10b981',
                bgcolor: 'rgba(16, 185, 129, 0.08)',
              },
            }}
          >
            แปลงค่าตัวเลขที่กรอกเป็น {currency === 'THB' ? 'USD (ดอลลาร์)' : 'THB (บาท)'} ตามเรต
          </Button>
        )}
      </FormControl>

      {currency === 'USD' ? (
        <TextField
          label="อัตราแลกเปลี่ยน (บาทต่อ 1 USD)"
          type="number"
          placeholder="36.50"
          value={exchangeRate}
          onChange={(e) => onExchangeRateChange(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Coins size={18} color="#10b981" />
              </InputAdornment>
            ),
          }}
          helperText={
            <Stack direction="row" spacing={1} alignItems="center">
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#10b981',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              />
              <span>เรตจริงเรียลไทม์ (อัปเดตอัตโนมัติทุก 5 วินาที)</span>
            </Stack>
          }
          sx={{
            '& .MuiFormHelperText-root': {
              fontFamily: 'Prompt',
              color: '#10b981',
              fontWeight: 'bold',
            },
          }}
        />
      ) : (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 0.5 }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'Prompt' }}>
            อัตราแลกเปลี่ยนอ้างอิง: 1 USD = {exchangeRate} THB
          </span>
        </Stack>
      )}
    </>
  );
};

export default CurrencyExchangeField;
