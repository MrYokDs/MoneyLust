import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PATHS } from '../routes';
import { useAppSelector, useAppDispatch } from '../store';
import { reorderPortfolios } from '../store/stockPlannerSlice';
import { DataBackupModal } from './DataBackupModal';
import { TradingNoteHeaderWidget } from './TradingNoteHeaderWidget';
import { WebullTokenBadge } from './WebullTokenBadge';
import { APP_VERSION } from '../utils/version';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Avatar,
  Stack,
  Collapse,
  Menu,
  MenuItem,
  ButtonBase
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft,
  Sun,
  Moon,
  TrendingUp,
  FolderHeart,
  Briefcase,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Target,
  BarChart3,
  Activity,
  Database,
  Pin
} from 'lucide-react';

const drawerWidth = 260;

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

/**
 * คอมโพเนนต์เลย์เอาต์หลักของแอปพลิเคชัน (Master Layout)
 * ประกอบด้วยแถบ AppBar ด้านบน, แถบนำทาง Sidebar ด้านข้าง (รองรับการยุบ/ขยาย และการลากจัดลำดับพอร์ต Drag & Drop)
 * 
 * @param props - คุณสมบัติประกอบด้วย children และฟังก์ชันสลับธีม darkMode / setDarkMode
 * @returns JSX Element โครงสร้างเลย์เอาต์หลัก
 */
export const Layout: React.FC<LayoutProps> = ({ children, darkMode, setDarkMode }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [portfoliosOpen, setPortfoliosOpen] = useState(true);
  const [draggedPortfolioId, setDraggedPortfolioId] = useState<string | null>(null);

  // สมอและสถานะเมนูดรอปดาวน์โลโก้บนจอมือถือ
  const [logoMenuAnchor, setLogoMenuAnchor] = useState<null | HTMLElement>(null);

  /**
   * เปิดดรอปดาวน์เมนูจากโลโก้ MoneyLust บนมือถือ
   * 
   * @param event - React MouseEvent จากการกดปุ่มโลโก้
   */
  const handleOpenLogoMenu = (event: React.MouseEvent<HTMLElement>) => {
    setLogoMenuAnchor(event.currentTarget);
  };

  /**
   * ปิดดรอปดาวน์เมนูโลโก้บนมือถือ
   */
  const handleCloseLogoMenu = () => {
    setLogoMenuAnchor(null);
  };

  const dispatch = useAppDispatch();
  const portfolios = useAppSelector(state => state.stockPlanner.portfolios);

  /**
   * สลับสถานะการเปิด/ปิดแถบเมนูด้านข้างสำหรับหน้าจอมือถือ
   * 
   * @returns void
   */
  const handleDrawerToggle = (): void => {
    setMobileOpen(!mobileOpen);
  };

  const currentDrawerWidth = sidebarCollapsed ? 70 : drawerWidth;

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'col', justifyContent: 'space-between', flexFlow: 'column' }}>
      <Box>
        {/* Logo Section */}
        <Toolbar sx={{ display: 'flex', justifyContent: sidebarCollapsed ? 'center' : 'space-between', px: 2, py: 2 }}>
          {!sidebarCollapsed && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                }}
              >
                <TrendingUp size={20} color="#fff" />
              </Box>
              <Typography variant="h6" fontWeight="900" sx={{ background: 'linear-gradient(90deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                MoneyLust
              </Typography>
            </Stack>
          )}
          {sidebarCollapsed && (
            <Box
              sx={{
                p: 0.8,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)'
              }}
            >
              <TrendingUp size={16} color="#fff" />
            </Box>
          )}

          {!isMobile && (
            <IconButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)} size="small" sx={{ opacity: 0.7 }}>
              <ChevronLeft size={16} style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
            </IconButton>
          )}
        </Toolbar>

        <Divider sx={{ opacity: 0.08, my: 1 }} />

        {/* Navigation list */}
        <List sx={{ px: 1.5 }}>
          {/* Market Overview Menu (ตลาดหุ้น) */}
          <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                navigate(PATHS.MARKET);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                minHeight: 48,
                justifyContent: sidebarCollapsed ? 'center' : 'initial',
                px: 2.5,
                borderRadius: 3,
                transition: 'all 0.2s',
                ...(location.pathname === PATHS.MARKET ? {
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: theme.palette.mode === 'light' ? 'primary.dark' : 'primary.light',
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.mode === 'light' ? 'primary.dark' : 'primary.light',
                  },
                } : {
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.03)',
                    color: 'text.primary',
                    '& .MuiListItemIcon-root': {
                      color: 'text.primary',
                    }
                  }
                })
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: sidebarCollapsed ? 0 : 2,
                  justifyContent: 'center',
                  color: 'inherit',
                  transition: 'color 0.2s',
                }}
              >
                <BarChart3 size={20} />
              </ListItemIcon>
              {!sidebarCollapsed && (
                <ListItemText
                  primary="ตลาดหุ้น"
                  primaryTypographyProps={{
                    fontSize: '0.92rem',
                    fontWeight: location.pathname === PATHS.MARKET ? 600 : 500,
                    fontFamily: 'Prompt'
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>

          {/* Main Menu */}
          <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                navigate(PATHS.PLANNER);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                minHeight: 48,
                justifyContent: sidebarCollapsed ? 'center' : 'initial',
                px: 2.5,
                borderRadius: 3,
                transition: 'all 0.2s',
                ...(location.pathname === PATHS.PLANNER ? {
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: theme.palette.mode === 'light' ? 'primary.dark' : 'primary.light',
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.mode === 'light' ? 'primary.dark' : 'primary.light',
                  },
                } : {
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.03)',
                    color: 'text.primary',
                    '& .MuiListItemIcon-root': {
                      color: 'text.primary',
                    }
                  }
                })
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: sidebarCollapsed ? 0 : 2,
                  justifyContent: 'center',
                  color: 'inherit',
                  transition: 'color 0.2s',
                }}
              >
                <TrendingUp size={20} />
              </ListItemIcon>
              {!sidebarCollapsed && (
                <ListItemText
                  primary="สร้างแผนการเทรด"
                  primaryTypographyProps={{
                    fontSize: '0.92rem',
                    fontWeight: location.pathname === PATHS.PLANNER ? 600 : 500,
                    fontFamily: 'Prompt'
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>

          {/* Investment Plan Menu (สร้างแผนการลงทุน) */}
          <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                navigate(PATHS.INVESTMENT_PLAN);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                minHeight: 48,
                justifyContent: sidebarCollapsed ? 'center' : 'initial',
                px: 2.5,
                borderRadius: 3,
                transition: 'all 0.2s',
                ...(location.pathname === PATHS.INVESTMENT_PLAN ? {
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: theme.palette.mode === 'light' ? 'primary.dark' : 'primary.light',
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.mode === 'light' ? 'primary.dark' : 'primary.light',
                  },
                } : {
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.03)',
                    color: 'text.primary',
                    '& .MuiListItemIcon-root': {
                      color: 'text.primary',
                    }
                  }
                })
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: sidebarCollapsed ? 0 : 2,
                  justifyContent: 'center',
                  color: 'inherit',
                  transition: 'color 0.2s',
                }}
              >
                <Target size={20} />
              </ListItemIcon>
              {!sidebarCollapsed && (
                <ListItemText
                  primary="สร้างแผนการลงทุน"
                  primaryTypographyProps={{
                    fontSize: '0.92rem',
                    fontWeight: location.pathname === PATHS.INVESTMENT_PLAN ? 600 : 500,
                    fontFamily: 'Prompt'
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>

          {/* Portfolios Menu Dropdown */}
          <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                if (sidebarCollapsed) {
                  setSidebarCollapsed(false);
                  setPortfoliosOpen(true);
                } else {
                  setPortfoliosOpen(!portfoliosOpen);
                }
              }}
              sx={{
                minHeight: 48,
                justifyContent: sidebarCollapsed ? 'center' : 'initial',
                px: 2.5,
                borderRadius: 3,
                transition: 'all 0.2s',
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.03)',
                  color: 'text.primary',
                  '& .MuiListItemIcon-root': {
                    color: 'text.primary',
                  }
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: sidebarCollapsed ? 0 : 2,
                  justifyContent: 'center',
                  color: 'inherit',
                  transition: 'color 0.2s',
                }}
              >
                <Briefcase size={20} />
              </ListItemIcon>
              {!sidebarCollapsed && (
                <>
                  <ListItemText
                    primary="พอร์ตการลงทุน"
                    primaryTypographyProps={{
                      fontSize: '0.92rem',
                      fontWeight: 500,
                      fontFamily: 'Prompt'
                    }}
                  />
                  {portfoliosOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </>
              )}
            </ListItemButton>
          </ListItem>

          <Collapse in={portfoliosOpen && !sidebarCollapsed} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2 }}>
              {portfolios.map((portfolio) => {
                const pPath = PATHS.PORTFOLIO(portfolio.id);
                const isActive = location.pathname === pPath;

                /**
                 * เริ่มต้นการลากรายการพอร์ตโฟลิโอเพื่อสลับลำดับ
                 * 
                 * @param e - DragEvent ของ HTML5
                 * @returns void
                 */
                const handleDragStart = (e: React.DragEvent<HTMLElement>): void => {
                  setDraggedPortfolioId(portfolio.id);
                  e.dataTransfer.effectAllowed = 'move';
                  setTimeout(() => {
                    (e.target as HTMLElement).style.opacity = '0.5';
                  }, 0);
                };

                /**
                 * สิ้นสุดการลากรายการพอร์ตโฟลิโอ คืนค่าความโปร่งใสปกติ
                 * 
                 * @param e - DragEvent ของ HTML5
                 * @returns void
                 */
                const handleDragEnd = (e: React.DragEvent<HTMLElement>): void => {
                  (e.target as HTMLElement).style.opacity = '1';
                  setDraggedPortfolioId(null);
                };

                /**
                 * จัดการเหตุการณ์ลากผ่าน เพื่อเปิดให้สามารถ Drop ได้
                 * 
                 * @param e - DragEvent ของ HTML5
                 * @returns void
                 */
                const handleDragOver = (e: React.DragEvent<HTMLElement>): void => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                };

                /**
                 * ปล่อย (Drop) รายการพอร์ตเพื่อสลับลำดับและอัปเดตลง Redux Store
                 * 
                 * @param e - DragEvent ของ HTML5
                 * @returns void
                 */
                const handleDrop = (e: React.DragEvent<HTMLElement>): void => {
                  e.preventDefault();
                  if (draggedPortfolioId && draggedPortfolioId !== portfolio.id) {
                    const oldIndex = portfolios.findIndex((p) => p.id === draggedPortfolioId);
                    const newIndex = portfolios.findIndex((p) => p.id === portfolio.id);
                    const newOrder = [...portfolios];
                    const [movedItem] = newOrder.splice(oldIndex, 1);
                    newOrder.splice(newIndex, 0, movedItem);
                    dispatch(reorderPortfolios(newOrder));
                  }
                };

                return (
                  <ListItemButton
                    key={portfolio.id}
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => {
                      navigate(pPath);
                      if (isMobile) setMobileOpen(false);
                    }}
                    sx={{
                      minHeight: 40,
                      pl: 3,
                      borderRadius: 3,
                      mb: 0.5,
                      cursor: 'grab',
                      '&:active': { cursor: 'grabbing' },
                      ...(isActive ? {
                        backgroundColor: 'rgba(6, 182, 212, 0.12)',
                        color: theme.palette.mode === 'light' ? 'info.dark' : 'info.light',
                        borderLeft: '4px solid',
                        borderColor: 'info.main',
                      } : {
                        color: 'text.secondary',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.03)',
                          color: 'text.primary',
                        }
                      })
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '6px', opacity: 0.5 }}>
                      <GripVertical size={14} />
                    </div>
                    <ListItemIcon sx={{ minWidth: 0, mr: 1.5, color: isActive ? 'inherit' : 'text.secondary' }}>
                      <FolderHeart size={16} />
                    </ListItemIcon>
                    <ListItemText
                      primary={portfolio.name}
                      primaryTypographyProps={{
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 600 : 400,
                        fontFamily: 'Prompt'
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Collapse>
        </List>
      </Box>

      {/* Footer / User info */}
      {!sidebarCollapsed && (
        <Box sx={{ p: 2, mb: 1 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              background: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
              border: theme.palette.mode === 'light' ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontFamily: 'Prompt' }}>
              MoneyLust v{APP_VERSION}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'Prompt' }}>
              ระบบแบ่งไม้ซื้อถัวเฉลี่ยหุ้น
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Background decoration */}
      <Box className="ambient-bg" />

      {/* Header / AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: isMobile ? '100%' : `calc(100% - ${currentDrawerWidth}px)`,
          ml: isMobile ? 0 : `${currentDrawerWidth}px`,
          background: theme.palette.mode === 'light' ? 'rgba(248, 250, 252, 0.7)' : 'rgba(11, 15, 25, 0.45)',
          color: theme.palette.text.primary,
          backdropFilter: 'blur(12px) saturate(180%)',
          borderBottom: theme.palette.mode === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.05)',
          zIndex: theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1.25, sm: 3 }, minHeight: { xs: 56, sm: 64 } }}>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0, flex: 1, mr: { xs: 0.75, sm: 2 } }}>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: { xs: 0.25, sm: 0.5 }, p: { xs: 0.5, sm: 1 } }}
              >
                <MenuIcon size={20} />
              </IconButton>
            )}

            {/* ส่วนหัวฝั่งซ้าย: บนมือถือเป็นปุ่มโลโก้เปิดดรอปดาวน์ 4 เมนู, บนจอใหญ่เป็นชื่อหน้าปัจจุบัน */}
            {isMobile ? (
              <>
                <ButtonBase
                  onClick={handleOpenLogoMenu}
                  aria-label="เมนูเครื่องมือลัด MoneyLust"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.1,
                    py: 0.5,
                    borderRadius: '12px',
                    background: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                    border: theme.palette.mode === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      background: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      p: 0.45,
                      borderRadius: 1.5,
                      background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    <TrendingUp size={15} color="#fff" />
                  </Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight="900"
                    sx={{
                      background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontFamily: 'Prompt',
                      fontSize: '0.92rem',
                      lineHeight: 1,
                    }}
                  >
                    MoneyLust
                  </Typography>
                  <ChevronDown size={14} style={{ opacity: 0.7 }} />
                </ButtonBase>

                {/* เมนูดรอปดาวน์สำหรับมือถือ (รวม 4 รายการ: Webull Token, โน้ตเตือนสติ, สำรองข้อมูล, สลับธีม) */}
                <Menu
                  anchorEl={logoMenuAnchor}
                  open={Boolean(logoMenuAnchor)}
                  onClose={handleCloseLogoMenu}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      width: 290,
                      borderRadius: '16px',
                      background: theme.palette.mode === 'light'
                        ? 'rgba(255, 253, 240, 0.98)'
                        : 'rgba(15, 23, 42, 0.96)',
                      backdropFilter: 'blur(20px)',
                      border: theme.palette.mode === 'light'
                        ? '1px solid rgba(0,0,0,0.08)'
                        : '1px solid rgba(255,255,255,0.12)',
                      boxShadow: theme.palette.mode === 'light'
                        ? '0 12px 32px rgba(0,0,0,0.12)'
                        : '0 16px 40px rgba(0,0,0,0.6)',
                      p: 0.75,
                    },
                  }}
                >
                  <Box sx={{ px: 1.5, py: 0.75, mb: 0.25 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontSize: '0.7rem',
                      }}
                    >
                      เมนูเครื่องมือลัด
                    </Typography>
                  </Box>

                  {/* 1. Webull OpenAPI & Token */}
                  <MenuItem
                    onClick={() => {
                      handleCloseLogoMenu();
                      window.dispatchEvent(new CustomEvent('open-webull-token-modal'));
                    }}
                    sx={{ borderRadius: '10px', py: 1, mb: 0.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: '#10b981' }}>
                      <Activity size={18} />
                    </ListItemIcon>
                    <ListItemText
                      primary="สถานะ Webull OpenAPI"
                      secondary="ตรวจสอบ & ต่ออายุ Token"
                      primaryTypographyProps={{ fontSize: '0.86rem', fontWeight: 600, fontFamily: 'Prompt' }}
                      secondaryTypographyProps={{ fontSize: '0.72rem', fontFamily: 'Prompt' }}
                    />
                  </MenuItem>

                  {/* 2. โน้ตเตือนสติตลาดหุ้น (เลื่อนลงมาเต็มจอ 100dvh) */}
                  <MenuItem
                    onClick={() => {
                      handleCloseLogoMenu();
                      window.dispatchEvent(new CustomEvent('open-trading-note-modal'));
                    }}
                    sx={{ borderRadius: '10px', py: 1, mb: 0.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: '#f59e0b' }}>
                      <Pin size={18} />
                    </ListItemIcon>
                    <ListItemText
                      primary="โน้ตเตือนสติตลาดหุ้น"
                      secondary="ช่วงเวลาเข้าซื้อ & ปฏิทินวันหยุด (เต็มจอ)"
                      primaryTypographyProps={{ fontSize: '0.86rem', fontWeight: 600, fontFamily: 'Prompt' }}
                      secondaryTypographyProps={{ fontSize: '0.72rem', fontFamily: 'Prompt' }}
                    />
                  </MenuItem>

                  {/* 3. สำรอง & ซิงค์ข้อมูลคลาวด์ */}
                  <MenuItem
                    onClick={() => {
                      handleCloseLogoMenu();
                      window.dispatchEvent(new CustomEvent('open-data-backup-modal'));
                    }}
                    sx={{ borderRadius: '10px', py: 1, mb: 0.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: '#06b6d4' }}>
                      <Database size={18} />
                    </ListItemIcon>
                    <ListItemText
                      primary="สำรอง & ซิงค์ข้อมูล"
                      secondary="GitHub Gist & สำรองไฟล์ JSON"
                      primaryTypographyProps={{ fontSize: '0.86rem', fontWeight: 600, fontFamily: 'Prompt' }}
                      secondaryTypographyProps={{ fontSize: '0.72rem', fontFamily: 'Prompt' }}
                    />
                  </MenuItem>

                  <Divider sx={{ my: 0.75, opacity: 0.1 }} />

                  {/* 4. สลับโหมดแสง / มืด */}
                  <MenuItem
                    onClick={() => {
                      handleCloseLogoMenu();
                      setDarkMode(!darkMode);
                    }}
                    sx={{ borderRadius: '10px', py: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: darkMode ? '#f59e0b' : '#6366f1' }}>
                      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </ListItemIcon>
                    <ListItemText
                      primary={darkMode ? 'เปลี่ยนเป็นธีมสว่าง (Light)' : 'เปลี่ยนเป็นธีมมืด (Dark)'}
                      secondary={darkMode ? 'โหมดพื้นหลังสีสว่าง' : 'โหมดพื้นหลังสีเข้มสบายตา'}
                      primaryTypographyProps={{ fontSize: '0.86rem', fontWeight: 600, fontFamily: 'Prompt' }}
                      secondaryTypographyProps={{ fontSize: '0.72rem', fontFamily: 'Prompt' }}
                    />
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                  fontFamily: 'Prompt',
                  fontSize: { xs: '0.88rem', sm: '1.12rem', md: '1.25rem' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block',
                }}
              >
                {location.pathname === PATHS.MARKET
                  ? 'ภาพรวมตลาดหุ้นสหรัฐฯ'
                  : location.pathname === PATHS.PLANNER
                  ? 'เครื่องมือคำนวณแบ่งไม้ถัวหุ้น'
                  : location.pathname === PATHS.INVESTMENT_PLAN
                  ? 'สร้างแผนการลงทุนทบต้น'
                  : 'การจัดการพอร์ต'}
              </Typography>
            )}
          </Stack>

          {/* ฝั่งขวาของ Header: บน Desktop แสดง 4 ไอคอนครบถ้วน, บน Mobile ซ่อนปุ่มและคง Lifecycle ไว้ให้ CustomEvent ทำงาน */}
          <Stack direction="row" alignItems="center" spacing={{ xs: 0.25, sm: 1.5 }} sx={{ flexShrink: 0 }}>
            {/* กล่อง 4 เครื่องมือ (แสดงเฉพาะ Desktop ตั้งแต่ md ขึ้นไป) */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              <WebullTokenBadge />
              <TradingNoteHeaderWidget />
              <DataBackupModal />

              <IconButton
                onClick={() => setDarkMode(!darkMode)}
                color="inherit"
                sx={{ p: 1 }}
              >
                {darkMode ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
              </IconButton>
            </Box>

            {/* สำหรับ Mobile: ให้คง Component ไว้ใน DOM แบบซ่อน เพื่อให้ Modal และ Drawer ของแต่ละระบบยังคงรับ Event ได้สมบูรณ์ */}
            {isMobile && (
              <Box sx={{ display: 'none' }}>
                <WebullTokenBadge />
                <TradingNoteHeaderWidget />
                <DataBackupModal />
              </Box>
            )}

            <Divider orientation="vertical" flexItem sx={{ opacity: 0.1, my: 1.5, display: { xs: 'none', sm: 'block' } }} />

            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar
                sx={{
                  width: { xs: 28, sm: 36 },
                  height: { xs: 28, sm: 36 },
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  fontWeight: 'bold',
                  fontSize: { xs: '0.75rem', sm: '0.9rem' },
                }}
              >
                MM
              </Avatar>
              {!isMobile && (
                <Stack>
                  <Typography variant="subtitle2" fontWeight="bold" fontSize="0.875rem">
                    Money Master
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Investor Pro
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Side Navigation Drawers */}
      {/* Mobile view */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            background: theme.palette.mode === 'light' ? '#ffffff' : '#0b0f19',
            borderRight: theme.palette.mode === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop view */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: currentDrawerWidth,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            '& .MuiDrawer-paper': {
              width: currentDrawerWidth,
              boxSizing: 'border-box',
              background: theme.palette.mode === 'light' ? '#ffffff' : '#0b0f19',
              borderRight: theme.palette.mode === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
              overflowX: 'hidden',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main Page Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.25, sm: 2.5, md: 4 },
          width: { xs: '100%', md: `calc(100% - ${currentDrawerWidth}px)` },
          mt: { xs: '56px', sm: '64px' },
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          flexDirection: 'column',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
