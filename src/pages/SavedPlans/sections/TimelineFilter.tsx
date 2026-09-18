/**
 * Route: /portfolio/:id
 * Section: TimelineFilter (ตัวเลือกกรองช่วงเวลาของแผนการลงทุน)
 */

import React from 'react';
import {
  Stack,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';

interface TimelineFilterProps {
  hasTimelineItems: boolean;
  filterType: 'all' | 'plan' | 'adjustment';
  onFilterChange: (val: 'all' | 'plan' | 'adjustment') => void;
}

export const TimelineFilter: React.FC<TimelineFilterProps> = ({
  hasTimelineItems,
  filterType,
  onFilterChange,
}) => {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
      <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Prompt', color: 'text.secondary' }}>
        ประวัติแผนการเทรดที่บันทึกไว้
      </Typography>

      {hasTimelineItems && (
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value as 'all' | 'plan' | 'adjustment')}
            sx={{ borderRadius: 3, fontFamily: 'Prompt', fontSize: '0.85rem' }}
          >
            <MenuItem value="all" sx={{ fontFamily: 'Prompt' }}>
              ทั้งหมด
            </MenuItem>
            <MenuItem value="plan" sx={{ fontFamily: 'Prompt' }}>
              เฉพาะหุ้น
            </MenuItem>
            <MenuItem value="adjustment" sx={{ fontFamily: 'Prompt' }}>
              เฉพาะวันที่เติมเงิน/ถอนเงิน
            </MenuItem>
          </Select>
        </FormControl>
      )}
    </Stack>
  );
};

export default TimelineFilter;
