import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StockPlanner from '../pages/StockPlanner';
import SavedPlans from '../pages/SavedPlans';
import InvestmentPlan from '../pages/InvestmentPlan';
import Market from '../pages/Market';
import { PATHS } from './paths';

/**
 * คอมโพเนนต์หลักในการจัดการเส้นทางหน้าจอ (Routing) ทั้งหมดของระบบ
 * เชื่อมโยง URL Path กับ Page Components ที่เกี่ยวข้อง
 * 
 * @returns JSX Element สำหรับระบบ Routing ของ React Router
 */
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* เมื่อเข้าสู่เว็บครั้งแรกที่ Root URL (/) ให้ Redirect เข้าสู่หน้าตลาดหุ้นทันที */}
      <Route path="/" element={<Navigate to={PATHS.MARKET} replace />} />

      {/* หน้าภาพรวมตลาดหุ้นสหรัฐฯ สไตล์ Webull (Top Gainers / Losers) */}
      <Route path={PATHS.MARKET} element={<Market />} />

      {/* หน้าคำนวณและวางแผนการซื้อหุ้น */}
      <Route path={PATHS.PLANNER} element={<StockPlanner />} />

      {/* หน้าสร้างแผนการลงทุนทบต้นรายวัน */}
      <Route path={PATHS.INVESTMENT_PLAN} element={<InvestmentPlan />} />

      {/* หน้ารายละเอียดพอร์ตและแผนการลงทุนที่บันทึกไว้ */}
      <Route path={PATHS.PORTFOLIO(':id')} element={<SavedPlans />} />

      {/* เส้นทาง Fallback สำหรับกรณีไม่พบหน้า (Redirect กลับหน้าตลาดหุ้น) */}
      <Route path="*" element={<Navigate to={PATHS.MARKET} replace />} />
    </Routes>
  );
};

export default AppRoutes;
