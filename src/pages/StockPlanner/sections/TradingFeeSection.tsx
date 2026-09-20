/**
 * Route: /
 * Section: TradingFeeSection (ส่วนกำหนดค่าธรรมเนียมการซื้อขาย รองรับทั้งหุ้นทั่วไป และ Penny Stock)
 */

import React from 'react';
import {
  Typography,
  Divider,
  TextField,
  InputAdornment,
  Autocomplete,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Box,
  Alert,
} from '@mui/material';
import { Percent, DollarSign, Coins, AlertCircle } from 'lucide-react';
import { FeeMode, CurrencyMode } from '../../../types';

interface TradingFeeSectionProps {
  /** สกุลเงินที่ใช้ ('THB' หรือ 'USD') */
  currency: CurrencyMode;
  /** อัตราค่าธรรมเนียมคิดเป็น % */
  feePercent: string;
  /** รูปแบบการคิดค่าธรรมเนียม ('percent' หรือ 'per_share') */
  feeMode: FeeMode;
  /** ค่าธรรมเนียมต่อหุ้น (USD/หุ้น กรณี Penny Stock) */
  feePerShare: string;
  /** ค่าธรรมเนียมขั้นต่ำต่อไม้ */
  minFeePerTranche: string;
  /** ราคาหุ้นปัจจุบัน เพื่อใช้ตรวจจับ Penny Stock อัตโนมัติ */
  currentPrice: number;
  /** ฟังก์ชันส่งค่าการเปลี่ยนแปลงฟิลด์กลับ */
  onChange: (field: string, value: any) => void;
}

/**
 * คอมโพเนนต์สำหรับจัดการค่าธรรมเนียมการซื้อขาย รองรับโบรกเกอร์ยอดนิยม (Webull, InnovestX, Dime)
 * และรองรับการคิดค่าธรรมเนียมแบบต่อหุ้นสำหรับหุ้นราคาต่ำ (Penny Stock)
 * 
 * @param props - คุณสมบัติของคอมโพเนนต์
 * @returns JSX Element สำหรับตั้งค่าค่าธรรมเนียม
 */
export const TradingFeeSection: React.FC<TradingFeeSectionProps> = ({
  currency,
  feePercent,
  feeMode,
  feePerShare,
  minFeePerTranche,
  currentPrice,
  onChange,
}) => {
  const isPennyStock = currentPrice > 0 && currentPrice < 1.0;

  return (
    <Stack spacing={2}>
      <Divider sx={{ my: 1, opacity: 0.5 }} />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" alignItems="center" spacing={1}>
          <Coins size={18} color="#f59e0b" />
          <Typography variant="subtitle2" fontWeight="bold">
            ค่าธรรมเนียมการซื้อขาย (Trading Fees)
          </Typography>
        </Stack>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Prompt' }}>
        ระบบนำค่าธรรมเนียมไปคำนวณหักในแต่ละไม้ตอนซื้อ และคำนวณหักออกจากราคาขายเป้าหมายอัตโนมัติ
      </Typography>

      {/* แจ้งเตือนเมื่อตรวจพบหุ้นราคาต่ำ Penny Stock */}
      {isPennyStock && (
        <Alert
          severity="warning"
          icon={<AlertCircle size={18} />}
          sx={{
            py: 0.5,
            px: 1.5,
            borderRadius: 2,
            fontSize: '0.8rem',
            fontFamily: 'Prompt',
            '& .MuiAlert-message': { py: 0.5 },
          }}
        >
          ตรวจพบหุ้นราคาต่ำกว่า $1.00 (Penny Stock) โบรกเกอร์อาจมีเกณฑ์คิดค่าธรรมเนียมเป็นต่อหุ้น ($/share) หรือมีขั้นต่ำ
        </Alert>
      )}

      {/* สวิตช์เลือกรูปแบบค่าธรรมเนียม: % ของมูลค่า หรือ ต่อหุ้น */}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.8, display: 'block', fontFamily: 'Prompt' }}>
          รูปแบบการคิดค่าธรรมเนียม:
        </Typography>
        <ToggleButtonGroup
          value={feeMode}
          exclusive
          onChange={(_, newMode) => {
            if (newMode) onChange('feeMode', newMode);
          }}
          size="small"
          fullWidth
        >
          <ToggleButton value="percent" sx={{ fontFamily: 'Prompt', fontSize: '0.82rem' }}>
            คิดตามมูลค่า (%)
          </ToggleButton>
          <ToggleButton value="per_share" sx={{ fontFamily: 'Prompt', fontSize: '0.82rem' }}>
            ต่อหุ้น ($/Share) Penny Stock
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* กรณีคิดเป็น % (ค่าเริ่มต้น Webull 0.10%) */}
      {feeMode === 'percent' ? (
        <Autocomplete
          freeSolo
          options={['0.10', '0.15', '1.2', '0']}
          renderOption={(props, option) => {
            let label = option;
            if (option === '0.10') label = 'Webull (0.10%) - ค่าเริ่มต้น';
            if (option === '0.15') label = 'InnovestX / อื่นๆ (0.15%)';
            if (option === '1.2') label = 'Dime (เฉลี่ย ~1.2%)';
            if (option === '0') label = 'ฟรีค่าดำเนินการ (0%)';
            return (
              <li {...props}>
                <Typography variant="body2" sx={{ fontFamily: 'Prompt' }}>
                  {label}
                </Typography>
              </li>
            );
          }}
          value={feePercent}
          onChange={(_, newValue) => onChange('feePercent', newValue || '')}
          onInputChange={(_, newInputValue) => {
            onChange('feePercent', newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="อัตราค่าธรรมเนียม (%)"
              placeholder="เช่น 0.10 หรือ 0.15"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start" sx={{ pl: 1 }}>
                      <Percent size={18} color="#f59e0b" />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
              helperText="เลือกโบรกเกอร์ หรือพิมพ์กรอก % ค่าธรรมเนียมเอง"
              sx={{
                '& .MuiFormHelperText-root': { fontFamily: 'Prompt', color: 'text.secondary' },
              }}
            />
          )}
        />
      ) : (
        /* กรณีคิดต่อหุ้น Penny Stock */
        <TextField
          label="ค่าธรรมเนียมต่อหุ้น ($/หุ้น)"
          type="number"
          value={feePerShare}
          onChange={(e) => onChange('feePerShare', e.target.value)}
          placeholder="เช่น 0.005"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <DollarSign size={18} color="#f59e0b" />
              </InputAdornment>
            ),
          }}
          helperText="เช่น Webull/IBKR หุ้นราคาต่ำมักคิด ~$0.005 ต่อหุ้น"
          sx={{
            '& .MuiFormHelperText-root': { fontFamily: 'Prompt', color: 'text.secondary' },
          }}
        />
      )}

      {/* ค่าธรรมเนียมขั้นต่ำต่อคำสั่ง (Minimum Fee) */}
      <TextField
        label={`ค่าธรรมเนียมขั้นต่ำต่อไม้ (${currency})`}
        type="number"
        value={minFeePerTranche}
        onChange={(e) => onChange('minFeePerTranche', e.target.value)}
        placeholder="0 (หากไม่มีขั้นต่ำ)"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Coins size={18} color="rgba(255,255,255,0.4)" />
            </InputAdornment>
          ),
        }}
        helperText="หากไม่มีขั้นต่ำให้ใส่ 0 (เช่น Webull ช่วงโปรโมชั่นไม่มีขั้นต่ำ)"
        sx={{
          '& .MuiFormHelperText-root': { fontFamily: 'Prompt', color: 'text.secondary' },
        }}
      />
    </Stack>
  );
};

export default TradingFeeSection;
