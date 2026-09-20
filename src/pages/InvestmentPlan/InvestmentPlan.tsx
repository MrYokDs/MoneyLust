/**
 * Route: /investment-plan
 * Page: InvestmentPlan (หน้าหลักสำหรับจำลองและวางแผนการเติบโตของพอร์ตทบต้นรายวัน)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Grid, Stack, Typography, Alert } from '@mui/material';
import { Sparkles } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useAppSelector, useAppDispatch } from '../../store';
import { savePortfolioGrowthPlan } from '../../store/stockPlannerSlice';
import { calculatePortfolioSummary, convertCurrencyAmount } from '../../utils/stockMath';
import {
  calculateDailyGrowthPlan,
  findPortfolioBenchmarkPosition,
} from '../../utils/growthPlanMath';
import { GrowthPlanFormData } from './types';
import GrowthPlanForm from './sections/GrowthPlanForm';
import PortfolioBenchmarkCard from './sections/PortfolioBenchmarkCard';
import DailyGrowthTable from './sections/DailyGrowthTable';

const STORAGE_KEY = 'wealthflow_growth_plan_config';

/**
 * โหลดการตั้งค่าแผนการลงทุนจาก LocalStorage
 * 
 * @returns ค่าตั้งค่าเริ่มต้นของฟอร์ม (GrowthPlanFormData)
 */
const loadSavedConfig = (): GrowthPlanFormData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        exchangeRate: parsed.exchangeRate || '36.50',
      };
    }
  } catch (e) {
    console.error('Failed to load growth plan config from localStorage', e);
  }

  return {
    initialCapital: '100000',
    dailyReturnPercent: '1.0',
    targetAmount: '1000000',
    portfolioId: 'none',
    currency: 'THB',
    exchangeRate: '36.50',
  };
};

/**
 * คอมโพเนนต์หน้าจอหลักสำหรับวางแผนการลงทุนทบต้นรายวัน (Investment Growth Plan)
 * เชื่อมโยงกับพอร์ตจริง และเปรียบเทียบความคืบหน้าแบบ Milestone
 * 
 * @returns JSX Element สำหรับหน้าระบบแผนการลงทุน
 */
export const InvestmentPlan: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const portfolios = useAppSelector((state) => state.stockPlanner.portfolios);
  const savedPlans = useAppSelector((state) => state.stockPlanner.savedPlans);

  const [formData, setFormData] = useState<GrowthPlanFormData>(loadSavedConfig);

  // ตรวจสอบ Query Parameter จาก URL เช่น /investment-plan?portfolioId=xxx
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const pId = searchParams.get('portfolioId');
    if (pId) {
      const port = portfolios.find((p) => p.id === pId);
      if (port) {
        if (port.growthPlan) {
          setFormData({
            initialCapital: port.growthPlan.initialCapital.toString(),
            dailyReturnPercent: port.growthPlan.dailyReturnPercent.toString(),
            targetAmount: port.growthPlan.targetAmount.toString(),
            portfolioId: port.id,
            currency: port.growthPlan.currency,
            exchangeRate: (port.growthPlan.exchangeRate || 36.5).toString(),
          });
          enqueueSnackbar(`โหลดแผนการลงทุนของพอร์ต "${port.name}" เรียบร้อย`, { variant: 'info' });
        } else {
          setFormData((prev) => ({
            ...prev,
            portfolioId: port.id,
          }));
        }
      }
    }
  }, [location.search, portfolios, enqueueSnackbar]);

  // บันทึกการตั้งค่าลง LocalStorage ทุกครั้งที่มีการเปลี่ยนแปลง
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.error('Failed to save growth plan config to localStorage', e);
    }
  }, [formData]);

  /**
   * คำนวณมูลค่าของพอร์ตการลงทุนจริงปัจจุบันที่ถูกเลือก
   */
  const selectedPortfolio = useMemo(() => {
    if (formData.portfolioId === 'none') return undefined;
    return portfolios.find((p) => p.id === formData.portfolioId);
  }, [formData.portfolioId, portfolios]);

  const portfolioCurrentValue = useMemo(() => {
    if (!selectedPortfolio) return undefined;
    const summary = calculatePortfolioSummary(selectedPortfolio, savedPlans);
    return summary.currentPortfolioValue;
  }, [selectedPortfolio, savedPlans]);

  /**
   * ดึงมูลค่าปัจจุบันของพอร์ตที่เลือกมาเป็นเงินต้นเริ่มต้น
   * 
   * @returns void
   */
  const handleSyncPortfolioCapital = (): void => {
    if (portfolioCurrentValue !== undefined && portfolioCurrentValue > 0) {
      setFormData((prev) => ({
        ...prev,
        initialCapital: Math.round(portfolioCurrentValue).toString(),
      }));
      enqueueSnackbar(
        `ดึงยอดเงินจากพอร์ต ${selectedPortfolio?.name} มาเป็นเงินต้นสำเร็จ`,
        { variant: 'success' }
      );
    } else {
      enqueueSnackbar('ไม่พบยอดเงินในพอร์ตที่เลือก', { variant: 'warning' });
    }
  };

  /**
   * อัปเดตค่าในฟิลด์ต่างๆ ของฟอร์ม (หากเลือกพอร์ตที่มีแผนอยู่แล้ว จะโหลดแผนขึ้นมาอัตโนมัติ)
   * 
   * @param field - ชื่อฟิลด์
   * @param value - ค่าใหม่
   * @returns void
   */
  const handleFieldChange = (field: keyof GrowthPlanFormData, value: any): void => {
    if (field === 'portfolioId' && value !== 'none') {
      const port = portfolios.find((p) => p.id === value);
      if (port && port.growthPlan) {
        setFormData({
          initialCapital: port.growthPlan.initialCapital.toString(),
          dailyReturnPercent: port.growthPlan.dailyReturnPercent.toString(),
          targetAmount: port.growthPlan.targetAmount.toString(),
          portfolioId: port.id,
          currency: port.growthPlan.currency,
          exchangeRate: (port.growthPlan.exchangeRate || 36.5).toString(),
        });
        enqueueSnackbar(`โหลดแผนการลงทุนของพอร์ต "${port.name}" เรียบร้อย`, { variant: 'info' });
        return;
      }
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ดึงอัตราแลกเปลี่ยน USD/THB แบบเรียลไทม์
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data && data.rates && data.rates.THB) {
          const liveRate = data.rates.THB;
          setFormData((prev) => ({
            ...prev,
            exchangeRate: liveRate.toFixed(2),
          }));
        }
      } catch (err) {
        console.error('Failed to fetch real-time exchange rate in InvestmentPlan:', err);
      }
    };

    fetchRate();
    const interval = setInterval(fetchRate, 5000);
    return () => clearInterval(interval);
  }, []);

  /**
   * รีเซ็ตฟอร์มกลับเป็นค่าเริ่มต้นมาตรฐาน
   * 
   * @returns void
   */
  const handleReset = (): void => {
    setFormData({
      initialCapital: '100000',
      dailyReturnPercent: '1.0',
      targetAmount: '1000000',
      portfolioId: 'none',
      currency: 'THB',
      exchangeRate: '36.50',
    });
    enqueueSnackbar('รีเซ็ตการตั้งค่าแผนเรียบร้อยแล้ว', { variant: 'info' });
  };

  /**
   * แปลงค่าเงินต้นและเป้าหมายตามอัตราแลกเปลี่ยน พร้อมสลับสกุลเงินอัตโนมัติ
   * 
   * @returns void
   */
  const handleConvertCurrencyValues = (): void => {
    const targetCurrency = formData.currency === 'THB' ? 'USD' : 'THB';
    const rate = parseFloat(formData.exchangeRate) || 36.5;
    const initialCapitalNum = parseFloat(formData.initialCapital) || 0;
    const targetAmountNum = parseFloat(formData.targetAmount) || 0;

    const updates: Partial<GrowthPlanFormData> = {
      currency: targetCurrency,
    };

    if (initialCapitalNum > 0) {
      updates.initialCapital = Math.round(
        convertCurrencyAmount(initialCapitalNum, formData.currency, targetCurrency, rate)
      ).toString();
    }
    if (targetAmountNum > 0) {
      updates.targetAmount = Math.round(
        convertCurrencyAmount(targetAmountNum, formData.currency, targetCurrency, rate)
      ).toString();
    }

    setFormData((prev) => ({ ...prev, ...updates }));
    enqueueSnackbar(
      `แปลงค่าตัวเลขเป็น ${targetCurrency} เรียบร้อย (เรต ${rate.toFixed(2)})`,
      { variant: 'success' }
    );
  };

  /**
   * บันทึกแผนการลงทุนทบต้นลงในพอร์ตที่เลือก หรือบันทึกเป็นแบบร่าง
   * 
   * @returns void
   */
  const handleSavePlan = (): void => {
    if (initialCapital <= 0) {
      enqueueSnackbar('กรุณาระบุเงินต้นเริ่มต้นที่มากกว่า 0', { variant: 'warning' });
      return;
    }
    if (dailyReturnPercent <= 0) {
      enqueueSnackbar('กรุณาระบุ % ผลตอบแทนต่อวันที่มากกว่า 0', { variant: 'warning' });
      return;
    }
    if (targetAmount <= initialCapital) {
      enqueueSnackbar('เป้าหมายมูลค่าพอร์ตต้องมากกว่าเงินต้นเริ่มต้น', { variant: 'warning' });
      return;
    }

    if (formData.portfolioId !== 'none' && selectedPortfolio) {
      dispatch(
        savePortfolioGrowthPlan({
          id: selectedPortfolio.id,
          growthPlan: {
            initialCapital,
            dailyReturnPercent,
            targetAmount,
            portfolioId: selectedPortfolio.id,
            currency: formData.currency,
            exchangeRate: parseFloat(formData.exchangeRate) || 36.5,
            updatedAt: new Date().toISOString(),
          },
        })
      );
      enqueueSnackbar(
        `บันทึกแผนการลงทุนลงในพอร์ต "${selectedPortfolio.name}" สำเร็จ! สามารถดูแผนได้จากหน้ารายละเอียดพอร์ต`,
        { variant: 'success' }
      );
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      enqueueSnackbar('บันทึกแผนการลงทุน (แบบร่าง) สำเร็จ! แนะนำให้เลือกเชื่อมต่อกับพอร์ตเพื่อติดตามผล', {
        variant: 'info',
      });
    }
  };

  const initialCapital = parseFloat(formData.initialCapital) || 0;
  const dailyReturnPercent = parseFloat(formData.dailyReturnPercent) || 0;
  const targetAmount = parseFloat(formData.targetAmount) || 0;

  // คำนวณตารางรายวันแบบทบต้น
  const dailyItems = useMemo(() => {
    return calculateDailyGrowthPlan({
      initialCapital,
      dailyReturnPercent,
      targetAmount,
      portfolioId: formData.portfolioId,
      currency: formData.currency,
    });
  }, [initialCapital, dailyReturnPercent, targetAmount, formData.portfolioId, formData.currency]);

  // คำนวณ Benchmark กับพอร์ตจริง
  const benchmark = useMemo(() => {
    if (portfolioCurrentValue === undefined || formData.portfolioId === 'none') {
      return undefined;
    }
    return findPortfolioBenchmarkPosition(
      portfolioCurrentValue,
      initialCapital,
      targetAmount,
      dailyItems
    );
  }, [portfolioCurrentValue, formData.portfolioId, initialCapital, targetAmount, dailyItems]);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header Section */}
      <Stack spacing={1} mb={3.5}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Sparkles size={22} />
          </Box>
          <Typography variant="h5" fontWeight="900" fontFamily="Prompt">
            สร้างแผนการลงทุนทบต้น (Investment Growth Plan)
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" fontFamily="Prompt">
          จำลองการเติบโตแบบดอกเบี้ยทบต้นรายวัน (Daily Compound Interest) กำหนดเป้าหมาย และติดตามเทียบเคียงกับพอร์ตจริง
        </Typography>
      </Stack>

      {/* Main Grid */}
      <Grid container spacing={3}>
        {/* Left Column: Form */}
        <Grid size={{ xs: 12, lg: 4.5 }}>
          <GrowthPlanForm
            formData={formData}
            portfolios={portfolios}
            portfolioCurrentValue={portfolioCurrentValue}
            onFieldChange={handleFieldChange}
            onSyncPortfolioCapital={handleSyncPortfolioCapital}
            onReset={handleReset}
            onConvertCurrencyValues={handleConvertCurrencyValues}
            onSavePlan={handleSavePlan}
            isSavedToPortfolio={Boolean(selectedPortfolio?.growthPlan)}
          />
        </Grid>

        {/* Right Column: Benchmark & Daily Matrix Table */}
        <Grid size={{ xs: 12, lg: 7.5 }}>
          <Stack spacing={3}>
            {/* 1. Status / Benchmark Card */}
            <PortfolioBenchmarkCard
              benchmark={benchmark}
              items={dailyItems}
              currency={formData.currency}
              initialCapital={initialCapital}
              targetAmount={targetAmount}
              portfolioName={selectedPortfolio?.name}
            />

            {/* 2. Daily Growth Table */}
            {dailyItems.length > 0 ? (
              <DailyGrowthTable
                items={dailyItems}
                currency={formData.currency}
                benchmark={benchmark}
              />
            ) : (
              <Alert severity="info" sx={{ fontFamily: 'Prompt', borderRadius: 3 }}>
                กรุณาระบุเงินต้นเริ่มต้น, % ผลตอบแทนต่อวัน และเป้าหมายมูลค่าพอร์ตที่มากกว่าเงินต้นเพื่อคำนวณแผน
              </Alert>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InvestmentPlan;
