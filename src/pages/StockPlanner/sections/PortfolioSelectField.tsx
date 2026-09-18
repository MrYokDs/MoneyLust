/**
 * Route: /
 * Section: PortfolioSelectField (ช่องเลือกพอร์ตโฟลิโอสำหรับบันทึกแผน)
 */

import React from 'react';
import { FormControl, FormLabel, Autocomplete, TextField } from '@mui/material';
import { Portfolio } from '../../../store/stockPlannerSlice';

interface PortfolioSelectFieldProps {
  portfolios: Portfolio[];
  portfolioId: string;
  portfolioInputValue: string;
  setPortfolioInputValue: (val: string) => void;
  onSelectPortfolio: (portfolio: Portfolio | null, textValue?: string) => void;
}

export const PortfolioSelectField: React.FC<PortfolioSelectFieldProps> = ({
  portfolios,
  portfolioId,
  portfolioInputValue,
  setPortfolioInputValue,
  onSelectPortfolio,
}) => {
  return (
    <FormControl fullWidth>
      <FormLabel
        sx={{
          mb: 1,
          fontSize: '0.85rem',
          color: 'text.secondary',
          fontFamily: 'Prompt',
          fontWeight: '500',
        }}
      >
        พอร์ตการลงทุน
      </FormLabel>
      <Autocomplete
        freeSolo
        options={portfolios}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
        value={portfolios.find((p) => p.id === portfolioId) || null}
        inputValue={portfolioInputValue}
        onInputChange={(_, newInputValue) => {
          setPortfolioInputValue(newInputValue);
        }}
        onChange={(_, newValue) => {
          if (typeof newValue === 'string') {
            onSelectPortfolio(null, newValue);
          } else if (newValue && typeof newValue === 'object') {
            onSelectPortfolio(newValue);
          } else {
            onSelectPortfolio(null, '');
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="เลือกพอร์ต หรือ พิมพ์เพื่อสร้างใหม่"
            size="small"
            InputProps={{
              ...params.InputProps,
              style: { fontFamily: 'Prompt' },
            }}
          />
        )}
        sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
      />
    </FormControl>
  );
};

export default PortfolioSelectField;
