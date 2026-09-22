/**
 * Route: /
 * Section: CompanyInsightsCard (แผงแสดงข้อมูลภาพรวมบริษัท รายละเอียดธุรกิจ และงบการเงินล่าสุด)
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Collapse,
  Button,
  Grid,
  Chip,
  Stack,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  ChevronDown,
  ChevronUp,
  Building2,
  TrendingUp,
  PieChart,
  FileText,
  Activity,
} from 'lucide-react';
import { StockDetail } from '../types';
import { translateToThai } from '../../../utils/stockApi';
import FinancialMetricCard from './FinancialMetricCard';

interface CompanyInsightsCardProps {
  stockDetail: StockDetail;
}

/**
 * คอมโพเนนต์แสดงข้อมูลเชิงลึกของบริษัท (ภาพรวมธุรกิจ, อุตสาหกรรม, งบการเงินไตรมาสล่าสุด)
 * ออกแบบในสไตล์ Glassmorphism พับเก็บได้เพื่อความกระชับของหน้าจอ
 * 
 * @param props - ข้อมูล stockDetail ที่ประกอบด้วย description และ financials
 * @returns JSX Element สำหรับแสดงข้อมูลเชิงลึก
 */
export const CompanyInsightsCard: React.FC<CompanyInsightsCardProps> = ({ stockDetail }) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [expanded, setExpanded] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isThai, setIsThai] = useState(true);
  const [translatedDesc, setTranslatedDesc] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  const { description, sector, industry, financials } = stockDetail;
  const formattedPeriod = financials?.period || '';
  const hasInsights = Boolean(description || financials || (sector && sector !== '-') || (industry && industry !== '-'));

  // แปลข้อความอัตโนมัติเมื่อ description มีการเปลี่ยนแปลง
  useEffect(() => {
    if (!description) {
      setTranslatedDesc('');
      return;
    }
    let active = true;
    setIsTranslating(true);
    translateToThai(description)
      .then((thaiText) => {
        if (active) {
          setTranslatedDesc(thaiText);
          setIsTranslating(false);
        }
      })
      .catch(() => {
        if (active) setIsTranslating(false);
      });
    return () => {
      active = false;
    };
  }, [description]);

  const activeDescription = isThai
    ? (translatedDesc || (isTranslating ? 'กำลังแปลข้อมูลเป็นภาษาไทย...' : description))
    : description;

  if (!hasInsights) return null;


  return (
    <Box
      sx={{
        mt: 1.5,
        borderRadius: '12px',
        background: isLight
          ? 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(243,244,246,0.6) 100%)'
          : 'linear-gradient(135deg, rgba(17, 24, 39, 0.7) 0%, rgba(15, 23, 42, 0.6) 100%)',
        backdropFilter: 'blur(12px)',
        border: isLight
          ? '1px solid rgba(16, 185, 129, 0.2)'
          : '1px solid rgba(16, 185, 129, 0.18)',
        boxShadow: isLight
          ? '0 4px 20px rgba(0, 0, 0, 0.04)'
          : '0 4px 20px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header bar with toggle */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          background: isLight ? 'rgba(16, 185, 129, 0.04)' : 'rgba(16, 185, 129, 0.07)',
          '&:hover': {
            background: isLight ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)',
          },
          transition: 'background 0.2s ease',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Building2 size={16} color="#10b981" />
          <Typography
            variant="body2"
            fontWeight="bold"
            sx={{
              fontFamily: 'Prompt',
              color: isLight ? '#065f46' : '#34d399',
              fontSize: '0.85rem',
            }}
          >
            🏢 ข้อมูลธุรกิจและงบการเงินล่าสุด
          </Typography>
          {financials && (
            <Chip
              label={`งบ Q: ${formattedPeriod}`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.68rem',
                fontWeight: '600',
                backgroundColor: isLight ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.25)',
                color: isLight ? '#0891b2' : '#22d3ee',
                border: '1px solid rgba(6, 182, 212, 0.3)',
              }}
            />
          )}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
            {expanded ? 'ย่อข้อมูล' : 'ดูรายละเอียด'}
          </Typography>
          {expanded ? <ChevronUp size={16} color="#10b981" /> : <ChevronDown size={16} color="#10b981" />}
        </Stack>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ p: 2, pt: 1.5 }}>
          {/* Sector & Industry Badges */}
          {((sector && sector !== '-') || (industry && industry !== '-')) && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
              {sector && sector !== '-' && (
                <Chip
                  icon={<PieChart size={12} />}
                  label={`กลุ่ม: ${sector}`}
                  size="small"
                  sx={{
                    fontSize: '0.72rem',
                    backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                    color: 'text.primary',
                  }}
                />
              )}
              {industry && industry !== '-' && (
                <Chip
                  icon={<Activity size={12} />}
                  label={`อุตสาหกรรม: ${industry}`}
                  size="small"
                  sx={{
                    fontSize: '0.72rem',
                    backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                    color: 'text.primary',
                  }}
                />
              )}
            </Stack>
          )}

          {/* Business Profile / Description */}
          {description && (
            <Box
              sx={{
                mb: financials ? 2 : 0.5,
                p: 1.25,
                borderRadius: '8px',
                background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.2)',
                border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.75} flexWrap="wrap" gap={0.5}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <FileText size={14} color="#10b981" />
                  <Typography variant="caption" fontWeight="bold" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    เกี่ยวกับบริษัท (Company Description)
                  </Typography>
                </Stack>

                {/* Language Switch Toggle */}
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {isTranslating && isThai && (
                    <CircularProgress size={12} sx={{ color: '#10b981', mr: 0.5 }} />
                  )}
                  <Chip
                    label="🇹🇭 แปลไทย"
                    size="small"
                    clickable
                    onClick={() => setIsThai(true)}
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: isThai ? 700 : 500,
                      backgroundColor: isThai
                        ? isLight ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.25)'
                        : 'transparent',
                      color: isThai ? (isLight ? '#065f46' : '#34d399') : 'text.secondary',
                      border: isThai
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      '&:hover': {
                        backgroundColor: isLight ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.35)',
                      },
                    }}
                  />
                  <Chip
                    label="🇬🇧 EN"
                    size="small"
                    clickable
                    onClick={() => setIsThai(false)}
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: !isThai ? 700 : 500,
                      backgroundColor: !isThai
                        ? isLight ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.25)'
                        : 'transparent',
                      color: !isThai ? (isLight ? '#0e7490' : '#22d3ee') : 'text.secondary',
                      border: !isThai
                        ? '1px solid rgba(6, 182, 212, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      '&:hover': {
                        backgroundColor: isLight ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.35)',
                      },
                    }}
                  />
                </Stack>
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  color: isTranslating && isThai && !translatedDesc ? 'text.secondary' : 'text.primary',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: showFullDesc ? 'unset' : 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: showFullDesc ? 'visible' : 'hidden',
                  fontStyle: isTranslating && isThai && !translatedDesc ? 'italic' : 'normal',
                }}
              >
                {activeDescription}
              </Typography>
              {activeDescription && activeDescription.length > 200 && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  sx={{
                    p: 0,
                    mt: 0.5,
                    minWidth: 0,
                    fontSize: '0.72rem',
                    color: '#10b981',
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  {showFullDesc ? 'ย่อข้อความ' : '...อ่านเพิ่มเติม'}
                </Button>
              )}
            </Box>
          )}

          {/* Quarterly Financials */}
          {financials && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={0.5}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <TrendingUp size={14} color="#06b6d4" />
                  <Typography variant="caption" fontWeight="bold" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    งบการเงินไตรมาสล่าสุด ({formattedPeriod})
                  </Typography>
                  {financials.prevPeriod && (
                    <Chip
                      label={`เทียบงวด: ${financials.prevPeriod}`}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 600,
                        backgroundColor: isLight ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.18)',
                        color: isLight ? '#0891b2' : '#22d3ee',
                        border: isLight ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid rgba(6, 182, 212, 0.35)',
                      }}
                    />
                  )}
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', fontStyle: 'italic' }}>
                  *หน่วย: พันดอลลาร์ ($ in Thousands)
                </Typography>
              </Stack>

              <Grid container spacing={1}>
                {/* Total Revenue */}
                <Grid size={{ xs: 6, sm: 4 }}>
                  <FinancialMetricCard
                    label="รายได้รวม (Revenue)"
                    tooltip="ยอดขายหรือรายได้รวมทั้งหมดที่บริษัททำได้ในไตรมาสนี้ ก่อนหักต้นทุนและค่าใช้จ่ายใดๆ"
                    currentVal={financials.totalRevenue}
                    prevVal={financials.prevTotalRevenue}
                    prevPeriod={financials.prevPeriod}
                  />
                </Grid>

                {/* Gross Profit */}
                <Grid size={{ xs: 6, sm: 4 }}>
                  <FinancialMetricCard
                    label="กำไรขั้นต้น (Gross)"
                    tooltip="รายได้รวมหักด้วยต้นทุนขาย/บริการ (Cost of Goods Sold) สะท้อนประสิทธิภาพการผลิตและการตั้งราคาขายสินค้าโดยตรง"
                    currentVal={financials.grossProfit}
                    prevVal={financials.prevGrossProfit}
                    prevPeriod={financials.prevPeriod}
                  />
                </Grid>

                {/* Operating Income */}
                <Grid size={{ xs: 6, sm: 4 }}>
                  <FinancialMetricCard
                    label="กำไรดำเนินงาน (Op Inc)"
                    tooltip="กำไรจากการดำเนินงานหลักของธุรกิจ (EBIT) หลังหักค่าใช้จ่ายบริหารและการตลาดแล้ว สะท้อนความสามารถในการทำกำไรจากธุรกิจที่แท้จริง"
                    currentVal={financials.operatingIncome}
                    prevVal={financials.prevOperatingIncome}
                    prevPeriod={financials.prevPeriod}
                  />
                </Grid>

                {/* Net Income */}
                <Grid size={{ xs: 6, sm: 4 }}>
                  <FinancialMetricCard
                    label="กำไรสุทธิ (Net Income)"
                    tooltip="ผลกำไรสุทธิบรรทัดสุดท้าย (Bottom Line) หลังหักค่าใช้จ่าย ดอกเบี้ย และภาษีทั้งหมดแล้ว ค่าบวกคือมีกำไร ค่าลบคือขาดทุน"
                    currentVal={financials.netIncome}
                    prevVal={financials.prevNetIncome}
                    prevPeriod={financials.prevPeriod}
                  />
                </Grid>

                {/* Net Income to Common Shareholders */}
                {financials.netIncomeCommon && (
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <FinancialMetricCard
                      label="กำไรผู้ถือหุ้นสามัญ (Common)"
                      tooltip="กำไรสุทธิส่วนที่เป็นของผู้ถือหุ้นสามัญโดยเฉพาะ (Net Income Applicable to Common Shareholders / Attributable to Common Stockholders) หลังหักเงินปันผลหุ้นบุริมสิทธิแล้ว"
                      currentVal={financials.netIncomeCommon}
                      prevVal={financials.prevNetIncomeCommon}
                      prevPeriod={financials.prevPeriod}
                    />
                  </Grid>
                )}

                {/* Total Liabilities (ภาระหนี้สินรวม) */}
                {financials.totalLiabilities && (
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <FinancialMetricCard
                      label="หนี้สินรวม (Liabilities)"
                      tooltip={`ภาระหนี้สินและพันธะผูกพันทั้งหมดของบริษัท (Total Liabilities) จากงบดุลไตรมาสล่าสุด${
                        financials.longTermDebt && financials.longTermDebt !== '--'
                          ? ` (ในนี้เป็นหนี้สินระยะยาว ${financials.longTermDebt})`
                          : ''
                      }`}
                      currentVal={financials.totalLiabilities}
                      prevVal={financials.prevTotalLiabilities}
                      prevPeriod={financials.prevPeriod}
                      isLiability={true}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default CompanyInsightsCard;
