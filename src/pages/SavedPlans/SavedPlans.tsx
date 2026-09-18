/**
 * Route: /portfolio/:id
 * หน้าแสดงรายละเอียดพอร์ตการลงทุน แผนการแบ่งไม้ที่บันทึกไว้ และการปรับปรุงเงินต้นทุน
 */

import React, { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useParams, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { PATHS } from '../../routes';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  deletePlan,
  updateCurrentParams,
  setActivePlanId,
  deletePortfolio,
  updatePortfolioCapital,
  clearPortfolioAdjustments,
} from '../../store/stockPlannerSlice';
import { calculatePortfolioSummary, CalculationResult } from '../../utils/stockMath';
import { TimelineItem, PlanToDelete } from './types';
import PortfolioHeader from './sections/PortfolioHeader';
import PortfolioSummaryCards from './sections/PortfolioSummaryCards';
import TimelineFilter from './sections/TimelineFilter';
import PlanGridView from './sections/PlanGridView';
import PlanTableView from './sections/PlanTableView';
import SavedPlansModals from './sections/SavedPlansModals';
import EmptyPlansAlert from './sections/EmptyPlansAlert';

export const SavedPlans: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const savedPlans = useAppSelector((state) => state.stockPlanner.savedPlans);
  const portfolios = useAppSelector((state) => state.stockPlanner.portfolios);
  const currentParams = useAppSelector((state) => state.stockPlanner.currentParams);
  const exchangeRate = parseFloat(currentParams.exchangeRate) || 36.5;

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<PlanToDelete | null>(null);
  const [openClearAllModal, setOpenClearAllModal] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterType, setFilterType] = useState<'all' | 'plan' | 'adjustment'>('all');

  const { id } = useParams<{ id: string }>();
  const portfolioId = id || 'unassigned';
  const portfolio =
    portfolios.find((p) => p.id === portfolioId) || {
      id: 'unassigned',
      name: 'ยังไม่ได้จัดพอร์ตการลงทุน',
      createdAt: new Date().toISOString(),
      adjustments: [],
    };

  const filteredPlans = savedPlans.filter((p) => (p.portfolioId || 'unassigned') === portfolioId);

  const timelineItems: TimelineItem[] = [
    ...filteredPlans.map((p) => ({ type: 'plan' as const, data: p })),
    ...(portfolio.adjustments || []).map((a) => ({ type: 'adjustment' as const, data: a })),
  ].sort((a, b) => {
    const dateA = new Date(a.type === 'plan' ? a.data.createdAt : a.data.date).getTime();
    const dateB = new Date(b.type === 'plan' ? b.data.createdAt : b.data.date).getTime();
    return dateB - dateA;
  });

  const summary = calculatePortfolioSummary(portfolio, savedPlans, exchangeRate);

  const filteredTimelineItems = timelineItems.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const paginatedItems = filteredTimelineItems.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  /**
   * ดึงข้อมูลแผนการลงทุนที่บันทึกไว้กลับมาตั้งค่าในฟอร์มของหน้าแรกเพื่อคำนวณหรือปรับปรุงต่อ
   * 
   * @param plan - ข้อมูลแผนการลงทุนที่เลือก (CalculationResult)
   * @returns void
   */
  const handleLoadPlan = (plan: CalculationResult): void => {
    dispatch(setActivePlanId(plan.id));
    dispatch(
      updateCurrentParams({
        stockSymbol: plan.stockSymbol,
        currentPrice: plan.currentPrice.toString(),
        totalBudget: plan.totalBudget.toString(),
        tranchesCount: plan.tranchesCount.toString(),
        dropPercentage: plan.dropPercentage.toString(),
        dropMode: plan.dropMode,
        roundingMode: plan.roundingMode,
        currency: plan.currency || 'THB',
        exchangeRate: (plan.exchangeRate || 36.5).toString(),
        targetProfitPercent: (plan.targetProfitPercent !== undefined
          ? plan.targetProfitPercent
          : 10
        ).toString(),
        feePercent: (plan.feePercent !== undefined ? plan.feePercent : 0.5).toString(),
        actualSellPrice: plan.actualSellPrice ? plan.actualSellPrice.toString() : '',
        actualTranchesCount: plan.actualTranchesCount ? plan.actualTranchesCount.toString() : '',
        currentPriceIsFirstTranche: plan.currentPriceIsFirstTranche !== false,
        portfolioId: plan.portfolioId || 'unassigned',
      })
    );
    enqueueSnackbar(`โหลดแผนลงทุนหุ้น ${plan.stockSymbol} สำเร็จ`, { variant: 'success' });
    navigate(PATHS.HOME);
  };

  /**
   * ยืนยันการลบแผนการลงทุนออกจาก Redux Store และ LocalStorage
   * 
   * @returns void
   */
  const executeDeletePlan = (): void => {
    if (planToDelete) {
      dispatch(deletePlan(planToDelete.id));
      enqueueSnackbar(`ลบแผนของ ${planToDelete.symbol} เรียบร้อยแล้ว`, { variant: 'info' });
      setPlanToDelete(null);
    }
  };

  /**
   * ล้างแผนการลงทุนและประวัติการปรับปรุงเงินต้นทุนทั้งหมดในพอร์ตนี้
   * 
   * @returns void
   */
  const executeClearAll = (): void => {
    filteredPlans.forEach((p) => dispatch(deletePlan(p.id)));
    dispatch(clearPortfolioAdjustments(portfolioId));
    enqueueSnackbar('ลบแผนการลงทุนทั้งหมดในพอร์ตแล้ว', { variant: 'warning' });
    setOpenClearAllModal(false);
  };

  /**
   * ดำเนินการลบพอร์ตการลงทุนปัจจุบันออกจากระบบ และเปลี่ยนเส้นทางกลับหน้าแรก
   * 
   * @returns void
   */
  const handleDeletePortfolio = (): void => {
    dispatch(deletePortfolio(portfolioId));
    enqueueSnackbar(`ลบพอร์ต "${portfolio.name}" เรียบร้อยแล้ว`, { variant: 'info' });
    setOpenDeleteModal(false);
    navigate(PATHS.HOME);
  };

  /**
   * แปลงข้อความ ISO Date เป็นรูปแบบวันที่ภาษาไทย
   * 
   * @param dateStr - ข้อความวันที่ ISO String
   * @returns ข้อความวันที่ภาษาไทย เช่น "18 ก.ย. 2026"
   */
  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  /**
   * แปลงรหัสโหมดการปัดเศษหุ้นเป็นชื่อภาษาไทยที่เข้าใจง่าย
   * 
   * @param mode - รหัสโหมด เช่น 'integer', 'boardlot', 'fractional'
   * @returns ชื่อโหมดภาษาไทย
   */
  const getRoundingModeName = (mode: string): string => {
    switch (mode) {
      case 'integer':
        return 'เต็ม 1 หุ้น';
      case 'boardlot':
        return 'บอร์ดล็อต (100 หุ้น)';
      case 'fractional':
        return 'เศษทศนิยม (4 ตำแหน่ง)';
      default:
        return mode;
    }
  };

  /**
   * เริ่มต้นสร้างแผนใหม่ในพอร์ตนี้ โดยส่งเงินคงเหลือในพอร์ตไปเป็นงบเริ่มต้น
   * 
   * @returns void
   */
  const handleAddNewPlan = (): void => {
    dispatch(setActivePlanId(null));
    const newParams: any = { portfolioId };
    if (summary.availableCash > 0) {
      newParams.totalBudget = summary.availableCash.toString();
    }
    dispatch(updateCurrentParams(newParams));
    navigate(PATHS.HOME);
  };

  return (
    <Box sx={{ flexGrow: 1, py: 1 }}>
      {/* 1. Portfolio Header */}
      <PortfolioHeader
        portfolioName={portfolio.name}
        plansCount={filteredPlans.length}
        portfolioId={portfolioId}
        hasTimelineItems={timelineItems.length > 0}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddNewPlan={handleAddNewPlan}
        onDeletePortfolio={() => setOpenDeleteModal(true)}
        onClearAll={() => setOpenClearAllModal(true)}
      />

      {/* 2. Portfolio Summary Cards */}
      <PortfolioSummaryCards
        summary={summary}
        exchangeRate={exchangeRate}
        portfolioId={portfolioId}
        onUpdateCapital={(capital) => {
          dispatch(updatePortfolioCapital({ id: portfolioId, capital }));
        }}
      />

      {/* 3. Timeline Filter */}
      <TimelineFilter
        hasTimelineItems={timelineItems.length > 0}
        filterType={filterType}
        onFilterChange={(val) => {
          setFilterType(val);
          setPage(0);
        }}
      />

      {/* 4. Plan Items Display */}
      {timelineItems.length > 0 ? (
        viewMode === 'grid' ? (
          <PlanGridView
            items={paginatedItems}
            onLoadPlan={handleLoadPlan}
            onDeletePlan={(id, symbol) => setPlanToDelete({ id, symbol })}
            formatDate={formatDate}
            getRoundingModeName={getRoundingModeName}
          />
        ) : (
          <PlanTableView
            items={paginatedItems}
            totalCount={filteredTimelineItems.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows);
              setPage(0);
            }}
            onLoadPlan={handleLoadPlan}
            onDeletePlan={(id, symbol) => setPlanToDelete({ id, symbol })}
            formatDate={formatDate}
            getRoundingModeName={getRoundingModeName}
          />
        )
      ) : (
        <EmptyPlansAlert />
      )}

      {/* 5. Modals */}
      <SavedPlansModals
        portfolioName={portfolio.name}
        openDeletePortfolioModal={openDeleteModal}
        onCloseDeletePortfolioModal={() => setOpenDeleteModal(false)}
        onConfirmDeletePortfolio={handleDeletePortfolio}
        planToDelete={planToDelete}
        onCloseDeletePlanModal={() => setPlanToDelete(null)}
        onConfirmDeletePlan={executeDeletePlan}
        openClearAllModal={openClearAllModal}
        onCloseClearAllModal={() => setOpenClearAllModal(false)}
        onConfirmClearAll={executeClearAll}
      />
    </Box>
  );
};

export default SavedPlans;
