'use client';

import React, { useState } from 'react';
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
  Avatar,
  Chip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Assessment as AnalyticsIcon,
  Storage as DatabaseIcon,
  ListAlt as LogsIcon,
  AdminPanelSettings as AdminIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../AuthProvider';

const drawerWidth = 260;

const SuperAdminLayout = ({ children }) => {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/super-admin',
      color: 'primary'
    },
    {
      text: 'User Management',
      icon: <UsersIcon />,
      path: '/super-admin/users',
      color: 'info'
    },
    {
      text: 'Account Types',
      icon: <SecurityIcon />,
      path: '/super-admin/account-types',
      color: 'secondary'
    },
    {
      text: 'Database',
      icon: <DatabaseIcon />,
      path: '/super-admin/database',
      color: 'warning'
    },
    {
      text: 'Activity Logs',
      icon: <LogsIcon />,
      path: '/logs',
      color: 'primary'
    },
    {
      text: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/super-admin/analytics',
      color: 'success'
    },
    {
      text: 'Security',
      icon: <SecurityIcon />,
      path: '/super-admin/security',
      color: 'error'
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/super-admin/settings',
      color: 'warning'
    }
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    router.push(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar Header */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(40%, -40%)'
          }
        }}
      >
        <Avatar sx={{ 
          bgcolor: 'rgba(255,255,255,0.2)', 
          width: 48, 
          height: 48,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <AdminIcon />
        </Avatar>
        <Box sx={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            Super Admin
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.95, fontWeight: 500 }}>
            Control Panel
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* User Info */}
      {user && (
        <Box sx={{ 
          p: 2.5, 
          bgcolor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ 
              width: 40, 
              height: 40, 
              bgcolor: 'secondary.main',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              fontWeight: 600
            }}>
              {user.givenName?.[0]}{user.familyName?.[0]}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, noWrap: true, mb: 0.5 }}>
                {user.givenName} {user.familyName}
              </Typography>
              <Chip
                label="Super Admin"
                size="small"
                sx={{ 
                  height: 22, 
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
                  color: 'white',
                  border: 'none'
                }}
              />
            </Box>
          </Box>
        </Box>
      )}

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ flex: 1, py: 2, px: 1.5 }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  px: 2,
                  bgcolor: isActive ? `${item.color}.main` : 'transparent',
                  color: isActive ? 'white' : 'text.primary',
                  boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                  '&:hover': {
                    bgcolor: isActive ? `${item.color}.dark` : 'action.hover',
                    transform: 'translateX(4px)',
                    boxShadow: isActive ? '0 6px 16px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.08)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'white' : `${item.color}.main`,
                    minWidth: 44
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: '-0.01em'
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* Footer */}
      <Box sx={{ 
        p: 2.5, 
        bgcolor: 'background.default',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography 
          variant="caption" 
          color="text.secondary" 
          align="center" 
          display="block"
          sx={{ fontWeight: 500 }}
        >
          HospitiumRIS v1.0
        </Typography>
        <Typography 
          variant="caption" 
          color="text.secondary" 
          align="center" 
          display="block"
          sx={{ fontSize: '0.65rem', mt: 0.5, opacity: 0.7 }}
        >
          © 2026 All rights reserved
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar for mobile */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            width: '100%',
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 1
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
              Super Admin Console
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true
            }}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth
              }
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: `1px solid ${theme.palette.divider}`
              }
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
          mt: { xs: 7, md: 0 }
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default SuperAdminLayout;
