'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Storage as DatabaseIcon,
  ListAlt as LogsIcon,
  Verified as VerifiedIcon,
  Business as InstitutionIcon,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../AuthProvider';
import { InstitutionAdminProvider, useInstitutionAdmin } from './InstitutionAdminContext';

const drawerWidth = 260;

function InstitutionAdminDrawer({ children }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { institution, logoSrc } = useInstitutionAdmin();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const institutionName = institution?.name || user?.primaryInstitution || t('institution_admin.panel_title');

  const menuItems = [
    {
      text: t('institution_admin.dashboard', { defaultValue: 'Dashboard' }),
      icon: <DashboardIcon />,
      path: '/institution-admin',
      color: 'primary'
    },
    {
      text: t('institution_admin.institution_profile', { defaultValue: 'Institution Profile' }),
      icon: <InstitutionIcon />,
      path: '/institution-admin/profile',
      color: 'secondary'
    },
    {
      text: t('institution_admin.user_management', { defaultValue: 'User Management' }),
      icon: <UsersIcon />,
      path: '/institution-admin/users',
      color: 'info'
    },
    {
      text: t('institution_admin.account_types'),
      icon: <SecurityIcon />,
      path: '/institution-admin/account-types',
      color: 'secondary'
    },
    {
      text: t('institution_admin.verified_domains'),
      icon: <VerifiedIcon />,
      path: '/institution-admin/verified-domains',
      color: 'success'
    },
    {
      text: t('institution_admin.database'),
      icon: <DatabaseIcon />,
      path: '/institution-admin/database',
      color: 'warning'
    },
    {
      text: t('institution_admin.logs'),
      icon: <LogsIcon />,
      path: '/institution-admin/logs',
      color: 'primary'
    },
    {
      text: t('global_admin.security'),
      icon: <SecurityIcon />,
      path: '/institution-admin/security',
      color: 'error'
    },
    {
      text: t('global_admin.settings'),
      icon: <SettingsIcon />,
      path: '/institution-admin/settings',
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
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: 'primary.main',
          color: 'white',
        }}
      >
        <Avatar
          src={logoSrc}
          variant="rounded"
          alt={institutionName}
          imgProps={{ style: { objectFit: 'contain' } }}
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            width: 44,
            height: 44,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            p: logoSrc ? 0.5 : 0,
          }}
        >
          <InstitutionIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
          <Tooltip title={institutionName}>
            <Typography
              variant="subtitle1"
              noWrap
              sx={{ fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }}
            >
              {institutionName}
            </Typography>
          </Tooltip>
          <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 500 }}>
            {t('institution_admin.panel_title')}
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
                label="Institution Admin"
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
          const isActive = item.path === '/institution-admin'
            ? pathname === item.path
            : pathname === item.path || pathname?.startsWith(`${item.path}/`);
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
            <Avatar
              src={logoSrc}
              variant="rounded"
              alt={institutionName}
              sx={{ width: 32, height: 32, mr: 1.5, bgcolor: 'primary.main' }}
            >
              <InstitutionIcon fontSize="small" />
            </Avatar>
            <Typography variant="subtitle1" noWrap component="div" sx={{ fontWeight: 600 }}>
              {institutionName}
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

const InstitutionAdminLayout = ({ children }) => (
  <InstitutionAdminProvider>
    <InstitutionAdminDrawer>
      {children}
    </InstitutionAdminDrawer>
  </InstitutionAdminProvider>
);

export default InstitutionAdminLayout;
