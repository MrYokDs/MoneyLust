/**
 * Route: /investment-plan
 * Section: GrowthPlanForm (ฟอร์มกำหนดพารามิเตอร์การเติบโตของพอร์ตและการเชื่อมโยงพอร์ตจริง)
 */

import React from 'react';
import {
  Typography,
  TextField,
  InputAdornment,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Percent,
  RefreshCw,
  FolderHeart,
  Target,
  Sparkles,
  Link as LinkIcon,
  Coins,
  ArrowLeftRight,
  Save,
} from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { Portfolio } from '../../../types';
import { GrowthPlanFormData, DAILY_RETURN_PRESETS } from '../types';

interface GrowthPlanFormProps {
  formData: GrowthPlanFormData;
  portfolios: Portfolio[];
  portfolioCurrentValue?: number;
  onFieldChange: (field: keyof GrowthPlanFormData, value: any) => void;
  onSyncPortfolioCapital: () => void;
  onReset: () => void;
  onConvertCurrencyValues?: () => void;
  onSavePlan: () => void;
  isSavedToPortfolio?: boolean;
}

/**
 * คอมโพเนนต์ฟอร์มสำหรับระบุข้อมูลแผนการลงทุนทบต้นรายวัน
 * และเชื่อมโยงกับพอร์ตโฟลิโอที่มีอยู่จริงในระบบ
 * 
 * @param props - พารามิเตอร์ของคอมโพเนนต์ฟอร์ม
 * @returns JSX Element สำหรับฟอร์มตั้งค่าแผนการลงทุน
 */
export const GrowthPlanForm: React.FC<GrowthPlanFormProps> = ({
  formData,
  portfolios,
  portfolioCurrentValue,
  onFieldChange,
  onSyncPortfolioCapital,
  onReset,
  onConvertCurrencyValues,
  onSavePlan,
  isSavedToPortfolio,
}) => {
  const currencySymbol = formData.currency === 'USD' ? '$' : '฿';
  const hasSelectedPortfolio = formData.portfolioId !== 'none';
  const capitalNum = parseFloat(formData.initialCapital) || 0;

  /**
   * กำหนดเป้าหมายอย่างรวดเร็วเป็นเท่าของเงินต้น
   * 
   * @param multiplier - ตัวคูณ เช่น 2 เท่า, 5 เท่า, 10 เท่า
   * @returns void
   */
  const handleApplyMultiplier = (multiplier: number): void => {
    if (capitalNum > 0) {
      const target = Math.round(capitalNum * multiplier);
      onFieldChange('targetAmount', target.toString());
    }
  };

  return (
    <GlassCard sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* หัวข้อฟอร์ม */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                p: 1,
                borderRadius: '10px',
                bgcolor: 'primary.main',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Target size={20} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" fontFamily="Prompt">
                ตั้งค่าแผนการลงทุน
              </Typography>
              <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                กำหนดเงินต้น อัตราผลตอบแทนต่อวัน และเป้าหมายปลายทาง
              </Typography>
            </Box>
          </Stack>

          <Button
            size="small"
            variant="text"
            color="inherit"
            startIcon={<RefreshCw size={14} />}
            onClick={onReset}
            sx={{ opacity: 0.7, fontFamily: 'Prompt', fontSize: '0.8rem' }}
          >
            รีเซ็ต
          </Button>
        </Stack>

        {/* 1. ส่วนเชื่อมโยงพอร์ตการลงทุน */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: (theme) =>
              theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
            border: (theme) =>
              theme.palette.mode === 'light'
                ? '1px solid rgba(0,0,0,0.06)'
                : '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <LinkIcon size={16} color="#10b981" />
              <Typography variant="subtitle2" fontWeight="600" fontFamily="Prompt">
                เชื่อมต่อกับพอร์ตการลงทุนจริง
              </Typography>
            </Stack>

            <FormControl fullWidth size="small">
              <InputLabel id="portfolio-select-label" sx={{ fontFamily: 'Prompt' }}>
                เลือกพอร์ตที่ต้องการติดตาม
              </InputLabel>
              <Select
                labelId="portfolio-select-label"
                value={formData.portfolioId}
                label="เลือกพอร์ตที่ต้องการติดตาม"
                onChange={(e) => onFieldChange('portfolioId', e.target.value)}
                sx={{ fontFamily: 'Prompt' }}
              >
                <MenuItem value="none" sx={{ fontFamily: 'Prompt' }}>
                  <em>ไม่เชื่อมโยง (แผนจำลองอิสระ)</em>
                </MenuItem>
                {portfolios.map((p) => (
                  <MenuItem key={p.id} value={p.id} sx={{ fontFamily: 'Prompt' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FolderHeart size={16} />
                      <span>{p.name}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {hasSelectedPortfolio && (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent="space-between"
                spacing={1}
                sx={{ pt: 0.5 }}
              >
                <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
                  มูลค่าพอร์ตจริงปัจจุบัน: <strong>{portfolioCurrentValue !== undefined ? `${currencySymbol}${portfolioCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</strong>
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={onSyncPortfolioCapital}
                  sx={{ fontFamily: 'Prompt', fontSize: '0.75rem', py: 0.2 }}
                >
                  ใช้มูลค่านี้เป็นเงินต้น
                </Button>
              </Stack>
            )}
          </Stack>
        </Box>

        {/* 2. สกุลเงินและเงินต้น */}
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" fontWeight="600" fontFamily="Prompt">
              เงินต้นเริ่มต้น (Starting Capital)
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={formData.currency}
              exclusive
              onChange={(_, val) => val && onFieldChange('currency', val)}
              sx={{ height: 28 }}
            >
              <ToggleButton value="THB" sx={{ px: 1.5, fontSize: '0.75rem', fontWeight: 'bold' }}>
                THB (฿)
              </ToggleButton>
              <ToggleButton value="USD" sx={{ px: 1.5, fontSize: '0.75rem', fontWeight: 'bold' }}>
                USD ($)
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {/* ส่วนแสดงและกำหนดอัตราแลกเปลี่ยน พร้อมปุ่มแปลงค่า */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: (theme) =>
                theme.palette.mode === 'light' ? 'rgba(16, 185, 129, 0.04)' : 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
            }}
          >
            <Stack spacing={1.2}>
              <TextField
                size="small"
                label="อัตราแลกเปลี่ยนปัจจุบัน (บาทต่อ 1 USD)"
                type="number"
                value={formData.exchangeRate || '36.50'}
                onChange={(e) => onFieldChange('exchangeRate', e.target.value)}
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Coins size={16} color="#10b981" />
                      </InputAdornment>
                    ),
                  },
                }}
                helperText={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'pulse 1.5s infinite ease-in-out',
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', fontFamily: 'Prompt' }}>
                      เรตจริงเรียลไทม์ (อัปเดตอัตโนมัติ)
                    </span>
                  </Stack>
                }
              />

              {onConvertCurrencyValues && (
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<ArrowLeftRight size={14} />}
                  onClick={onConvertCurrencyValues}
                  fullWidth
                  sx={{
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
                  แปลงค่าเงินต้นและเป้าหมายเป็น {formData.currency === 'THB' ? 'USD (ดอลลาร์)' : 'THB (บาท)'} ตามเรต
                </Button>
              )}
            </Stack>
          </Box>

          <TextField
            fullWidth
            size="small"
            type="number"
            value={formData.initialCapital}
            onChange={(e) => onFieldChange('initialCapital', e.target.value)}
            placeholder="เช่น 100,000"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <span style={{ fontWeight: 'bold' }}>{currencySymbol}</span>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>

        {/* 3. % ผลตอบแทนต่อวัน */}
        <Stack spacing={1}>
          <Typography variant="subtitle2" fontWeight="600" fontFamily="Prompt">
            % ผลตอบแทนคาดหวังต่อวัน (Daily Return)
          </Typography>

          <TextField
            fullWidth
            size="small"
            type="number"
            value={formData.dailyReturnPercent}
            onChange={(e) => onFieldChange('dailyReturnPercent', e.target.value)}
            placeholder="เช่น 1.0"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Percent size={16} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="caption" color="text.secondary">
                      %/วัน
                    </Typography>
                  </InputAdornment>
                ),
              },
            }}
          />

          {/* Preset Buttons */}
          <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ gap: 0.8, pt: 0.5 }}>
            {DAILY_RETURN_PRESETS.map((preset) => (
              <Chip
                key={preset.value}
                label={preset.label}
                size="small"
                variant={formData.dailyReturnPercent === preset.value ? 'filled' : 'outlined'}
                color={formData.dailyReturnPercent === preset.value ? 'primary' : 'default'}
                onClick={() => onFieldChange('dailyReturnPercent', preset.value)}
                sx={{ fontFamily: 'Prompt', fontSize: '0.75rem', cursor: 'pointer' }}
              />
            ))}
          </Stack>
        </Stack>

        {/* 4. มูลค่าเป้าหมายของพอร์ต */}
        <Stack spacing={1}>
          <Typography variant="subtitle2" fontWeight="600" fontFamily="Prompt">
            เป้าหมายมูลค่าพอร์ต (Target Portfolio Value)
          </Typography>

          <TextField
            fullWidth
            size="small"
            type="number"
            value={formData.targetAmount}
            onChange={(e) => onFieldChange('targetAmount', e.target.value)}
            placeholder="เช่น 1,000,000"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <span style={{ fontWeight: 'bold' }}>{currencySymbol}</span>
                  </InputAdornment>
                ),
              },
            }}
          />

          {/* Quick Multipliers */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 0.5 }}>
            <Sparkles size={14} color="#f59e0b" />
            <Typography variant="caption" color="text.secondary" fontFamily="Prompt">
              ตั้งเป้าหมายด่วน:
            </Typography>
            {[2, 3, 5, 10].map((m) => (
              <Chip
                key={m}
                label={`${m}x เงินต้น`}
                size="small"
                variant="outlined"
                onClick={() => handleApplyMultiplier(m)}
                disabled={capitalNum <= 0}
                sx={{ fontFamily: 'Prompt', fontSize: '0.75rem', cursor: 'pointer' }}
              />
            ))}
          </Stack>
        </Stack>

        {/* ปุ่มบันทึกแผนการลงทุน */}
        <Button
          fullWidth
          variant="contained"
          color="primary"
          size="medium"
          startIcon={<Save size={18} />}
          onClick={onSavePlan}
          sx={{
            py: 1.2,
            mt: 1,
            fontFamily: 'Prompt',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            borderRadius: 2.5,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
          }}
        >
          {hasSelectedPortfolio
            ? isSavedToPortfolio
              ? 'อัปเดตแผนการลงทุนในพอร์ตนี้'
              : 'บันทึกแผนการลงทุนลงในพอร์ตนี้'
            : 'บันทึกแผนการลงทุน (แบบร่าง)'}
        </Button>
      </Stack>
    </GlassCard>
  );
};

export default GrowthPlanForm;
