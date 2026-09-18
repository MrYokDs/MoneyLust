import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from './theme';
import Layout from './components/Layout';
import AppRoutes from './routes';

/**
 * คอมโพเนนต์หลักของแอปพลิเคชัน (Root Application Component)
 * ทำหน้าที่กำหนด Theme Provider, Dark/Light Mode และโครงสร้าง Routing ส่วนกลาง
 * 
 * @returns JSX Element โครงสร้างหลักของแอปพลิเคชัน
 */
export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('wealthflow_theme');
    return saved ? saved === 'dark' : true; // ค่าเริ่มต้นคือ Dark Mode
  });

  useEffect(() => {
    localStorage.setItem('wealthflow_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.body.style.backgroundColor = '#0b0f19';
      document.body.style.color = '#f3f4f6';
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [darkMode]);

  const theme = getTheme(darkMode ? 'dark' : 'light');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
          <AppRoutes />
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
