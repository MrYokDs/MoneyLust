/**
 * Route: /
 * Component: GridVisualizer (คอมโพเนนต์หลักแสดงภาพรวมผลลัพธ์การคำนวณ กราฟ และการจำลองผลกำไร)
 */

import React from 'react';
import { Box, Grid } from '@mui/material';
import { CalculationResult } from '../../utils/stockMath';
import FundSplitDiagram from './FundSplitDiagram';
import AverageCostChart from './AverageCostChart';
import CostReductionSummary from './CostReductionSummary';
import ExecutionAndProfitSimulator from './ExecutionAndProfitSimulator';

export interface GridVisualizerProps {
  /** ข้อมูลผลการคำนวณการแบ่งไม้และสถิติสะสมทั้งหมด */
  result: CalculationResult;
}

/**
 * คอมโพเนนต์ประสานงานหลัก (Orchestrator) สำหรับแสดงผลการวิเคราะห์และภาพจำลองแผนการลงทุน
 * รวมแผนภาพการแบ่งเงิน (FundSplitDiagram), กราฟ SVG (AverageCostChart), 
 * สรุปส่วนลดต้นทุน (CostReductionSummary) และการประเมินผลกำไร (ExecutionAndProfitSimulator)
 * 
 * @param props - คุณสมบัติของคอมโพเนนต์ ประกอบด้วยผลการคำนวณ result
 * @returns JSX Element โครงข่าย Visualizer ครบวงจร
 */
export const GridVisualizer: React.FC<GridVisualizerProps> = ({ result }) => {
  return (
    <Box>
      <Grid container spacing={4}>
        {/* 1. แผนภาพสัดส่วนการแบ่งเงินลงทุนรายไม้ */}
        <Grid size={{ xs: 12 }}>
          <FundSplitDiagram result={result} />
        </Grid>

        {/* 2. กราฟ SVG เส้นราคาหุ้นเทียบกับต้นทุนเฉลี่ยสะสม */}
        <Grid size={{ xs: 12, lg: 8 }} sx={{ display: 'flex' }}>
          <AverageCostChart result={result} />
        </Grid>

        {/* 3. การ์ดสรุปส่วนลดต้นทุนเฉลี่ย และสถิติยอดรวมงบประมาณ */}
        <Grid size={{ xs: 12, lg: 4 }} sx={{ display: 'flex' }}>
          <CostReductionSummary result={result} />
        </Grid>

        {/* 4. รายงานผลลัพธ์จากการเข้าซื้อจริง และแบบจำลองราคาขาย Exit Simulator */}
        <Grid size={{ xs: 12 }}>
          <ExecutionAndProfitSimulator result={result} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default GridVisualizer;
