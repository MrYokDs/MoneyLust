import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface GlassCardProps extends BoxProps {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  hoverEffect = false, 
  sx, 
  ...props 
}) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  return (
    <Box
      className={isLight ? 'glass-panel-light' : 'glass-panel'}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 4,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(hoverEffect && {
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: isLight 
              ? '0 12px 40px rgba(31, 38, 135, 0.1) !important' 
              : '0 12px 40px rgba(0, 0, 0, 0.55) !important',
            borderColor: isLight
              ? 'rgba(16, 185, 129, 0.4) !important'
              : 'rgba(16, 185, 129, 0.25) !important',
          },
        }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default GlassCard;
