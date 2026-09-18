import { CalculationResult, CapitalAdjustment } from '../../types';

export type TimelineItem =
  | { type: 'plan'; data: CalculationResult }
  | { type: 'adjustment'; data: CapitalAdjustment };

export interface PlanToDelete {
  id: string;
  symbol: string;
}
