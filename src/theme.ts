import { createTheme } from '@mui/material/styles';

/**
 * สร้างและกำหนดค่าธีมหลักของระบบ (Material-UI Theme) ทั้งโหมดสว่างและโหมดมืด
 * 
 * @param mode - โหมดการแสดงผลของธีม ('light' หรือ 'dark')
 * @returns ออบเจกต์ Theme ที่ผ่านการปรับแต่งพร้อมใช้งาน
 */
export const getTheme = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#10b981', // Emerald
        light: '#34d399',
        dark: '#059669',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#06b6d4', // Cyan
        light: '#22d3ee',
        dark: '#0891b2',
      },
      background: {
        default: isDark ? '#080c14' : '#f8fafc',
        paper: isDark ? '#111827' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f3f4f6' : '#0f172a',
        secondary: isDark ? '#9ca3af' : '#475569',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
      fontFamily: [
        'Inter',
        'Prompt',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: { fontWeight: 800, letterSpacing: '-0.025em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontWeight: 700, letterSpacing: '-0.015em' },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 500, textTransform: 'none' },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '10px 24px',
            fontSize: '0.95rem',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'none',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
            },
          },
          containedPrimary: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #34d399 0%, #047857 100%)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            backgroundImage: 'none',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              transition: 'all 0.2s',
              backgroundColor: isDark ? 'rgba(31, 41, 55, 0.2)' : 'rgba(241, 245, 249, 0.4)',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(31, 41, 55, 0.4)' : 'rgba(241, 245, 249, 0.6)',
              },
            },
          },
        },
      },
    },
  });
};
