/**
 * Route: /
 * Section: InvestmentParamsSection (ส่วนระบุพารามิเตอร์การลงทุน งบประมาณ จำนวนไม้ และการกระจายราคา)
 */

import React from 'react';
import {
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  InputAdornment,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Tooltip,
  Select,
  MenuItem,
} from '@mui/material';
import { DollarSign, Coins, Percent, Layers } from 'lucide-react';
import { formatCurrency } from '../../../utils/stockMath';

interface InvestmentParamsSectionProps {
  currency: 'THB' | 'USD';
  exchangeRate: number;
  currentPrice: string;
  currentPriceIsFirstTranche: boolean;
  totalBudget: string;
  maxAvailableBudgetClamped: number | null;
  maxAvailableBudget: number | null;
  isAtMaxLimit: boolean;
  dropPercentage: string;
  tranchesCount: string;
  maxPossibleTranches: number;
  dropMode: 'progressive' | 'fixed';
  roundingMode: 'fractional' | 'integer' | 'boardlot';
  onChange: (field: string, value: any) => void;
}

export const InvestmentParamsSection: React.FC<InvestmentParamsSectionProps> = ({
  currency,
  exchangeRate,
  currentPrice,
  currentPriceIsFirstTranche,
  totalBudget,
  maxAvailableBudgetClamped,
  maxAvailableBudget,
  isAtMaxLimit,
  dropPercentage,
  tranchesCount,
  maxPossibleTranches,
  dropMode,
  roundingMode,
  onChange,
}) => {
  return (
    <>
      {/* Current Price */}
      <TextField
        label={currency === 'USD' ? 'ราคาปัจจุบัน (USD)' : 'ราคาปัจจุบัน (บาท)'}
        type="number"
        placeholder="0.00"
        value={currentPrice}
        onChange={(e) => onChange('currentPrice', e.target.value)}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <DollarSign size={18} color="#9ca3af" />
            </InputAdornment>
          ),
        }}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={currentPriceIsFirstTranche}
            onChange={(e) => onChange('currentPriceIsFirstTranche', e.target.checked)}
            sx={{
              color: 'rgba(16, 185, 129, 0.5)',
              '&.Mui-checked': {
                color: '#10b981',
              },
            }}
          />
        }
        label={
          <Typography
            variant="body2"
            sx={{ fontFamily: 'Prompt', color: 'text.secondary', userSelect: 'none' }}
          >
            ใช้ราคาปัจจุบันซื้อเป็นไม้แรก (Tranche 1)
          </Typography>
        }
        sx={{ mt: -0.5, mb: 1, ml: 0 }}
      />

      {/* Investment Budget */}
      <TextField
        label={currency === 'USD' ? 'งบลงทุนทั้งหมด (USD)' : 'งบลงทุนทั้งหมด (บาท)'}
        type="number"
        placeholder="0.00"
        value={totalBudget}
        onChange={(e) => {
          let val = e.target.value;
          if (maxAvailableBudgetClamped !== null && parseFloat(val) > maxAvailableBudgetClamped) {
            val = maxAvailableBudgetClamped.toString();
          }
          onChange('totalBudget', val);
        }}
        fullWidth
        error={isAtMaxLimit}
        helperText={
          isAtMaxLimit
            ? `ถึงขีดจำกัดแล้ว! พอร์ตนี้ลงทุนได้สูงสุด: ${formatCurrency(maxAvailableBudget || 0, currency, false, exchangeRate)}`
            : maxAvailableBudget !== null
              ? `พอร์ตนี้จำกัดงบลงทุนได้สูงสุด: ${formatCurrency(maxAvailableBudget, currency, false, exchangeRate)}`
              : undefined
        }
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Coins size={18} color="#9ca3af" />
            </InputAdornment>
          ),
        }}
      />

      {/* Drop percentage */}
      <TextField
        label="ราคาที่จะถัวเฉลี่ยลดลงต่อไม้ (%)"
        type="number"
        placeholder="เช่น 3 หรือ 5"
        value={dropPercentage}
        onChange={(e) => onChange('dropPercentage', e.target.value)}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Percent size={18} color="#9ca3af" />
            </InputAdornment>
          ),
        }}
      />

      {/* Tranches count */}
      <TextField
        label="จำนวนไม้ที่ต้องการแบ่งซื้อ"
        type="number"
        placeholder="เช่น 3 หรือ 4 ไม้"
        value={tranchesCount}
        onChange={(e) => {
          let val = parseInt(e.target.value);
          if (!isNaN(val) && (roundingMode === 'integer' || roundingMode === 'boardlot')) {
            if (val > maxPossibleTranches) val = maxPossibleTranches;
          }
          onChange('tranchesCount', isNaN(val) ? e.target.value : val.toString());
        }}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Layers size={18} color="#9ca3af" />
            </InputAdornment>
          ),
        }}
        helperText={
          roundingMode === 'integer' || roundingMode === 'boardlot'
            ? `สามารถแบ่งได้สูงสุด ${maxPossibleTranches} ไม้ (เพื่อให้ซื้อได้อย่างน้อยไม้ละ ${roundingMode === 'boardlot' ? '100' : '1'} หุ้น)`
            : undefined
        }
        sx={{
          '& .MuiFormHelperText-root': { fontFamily: 'Prompt', color: 'info.main' },
        }}
      />

      {/* Drop Calculation Mode */}
      <FormControl component="fieldset">
        <FormLabel
          component="legend"
          sx={{ mb: 1, fontSize: '0.875rem', color: 'text.secondary', fontFamily: 'Prompt' }}
        >
          วิธีการคำนวณราคาหักลด
        </FormLabel>
        <RadioGroup
          row
          value={dropMode}
          onChange={(e) => onChange('dropMode', e.target.value)}
        >
          <FormControlLabel
            value="progressive"
            control={<Radio size="small" />}
            label={
              <Tooltip title="คำนวณหัก % จากราคาของไม้ก่อนหน้าลดหลั่นลงไป">
                <Typography variant="body2" sx={{ fontFamily: 'Prompt' }}>
                  ถัวสะสม (-% จากไม้ก่อนหน้า)
                </Typography>
              </Tooltip>
            }
          />
          <FormControlLabel
            value="fixed"
            control={<Radio size="small" />}
            label={
              <Tooltip title="คำนวณหัก % จากราคาเริ่มต้นของไม้แรกคงที่">
                <Typography variant="body2" sx={{ fontFamily: 'Prompt' }}>
                  ถัวคงที่ (-% จากไม้แรก)
                </Typography>
              </Tooltip>
            }
          />
        </RadioGroup>
      </FormControl>

      {/* Rounding Mode Option */}
      <FormControl fullWidth>
        <FormLabel
          sx={{ mb: 1, fontSize: '0.875rem', color: 'text.secondary', fontFamily: 'Prompt' }}
        >
          รูปแบบการปัดเศษหุ้น
        </FormLabel>
        <Select
          value={roundingMode}
          onChange={(e) => onChange('roundingMode', e.target.value as string)}
          sx={{ borderRadius: 3 }}
        >
          <MenuItem value="integer" style={{ fontFamily: 'Prompt' }}>
            เต็มหน่วย 1 หุ้น (ตลาดหุ้นทั่วไป)
          </MenuItem>
          <MenuItem value="boardlot" style={{ fontFamily: 'Prompt' }}>
            บอร์ดล็อต 100 หุ้น (สำหรับกระดานหลักไทย / SET)
          </MenuItem>
          <MenuItem value="fractional" style={{ fontFamily: 'Prompt' }}>
            ทศนิยม 4 ตำแหน่ง (สำหรับคริปโต / หุ้นสหรัฐฯ)
          </MenuItem>
        </Select>
      </FormControl>
    </>
  );
};

export default InvestmentParamsSection;
