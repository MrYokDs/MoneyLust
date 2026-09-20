import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StockPlanner from '../pages/StockPlanner';
import SavedPlans from '../pages/SavedPlans';
import InvestmentPlan from '../pages/InvestmentPlan';
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
      {/* หน้าคำนวณและวางแผนการซื้อหุ้น */}
      <Route path={PATHS.HOME} element={<StockPlanner />} />

      {/* หน้าสร้างแผนการลงทุนทบต้นรายวัน */}
      <Route path={PATHS.INVESTMENT_PLAN} element={<InvestmentPlan />} />

      {/* หน้ารายละเอียดพอร์ตและแผนการลงทุนที่บันทึกไว้ */}
      <Route path={PATHS.PORTFOLIO(':id')} element={<SavedPlans />} />

      {/* เส้นทาง Fallback สำหรับกรณีไม่พบหน้า (Redirect กลับหน้าแรก) */}
      <Route path="*" element={<Navigate to={PATHS.HOME} replace />} />
    </Routes>
  );
};

export default AppRoutes;
