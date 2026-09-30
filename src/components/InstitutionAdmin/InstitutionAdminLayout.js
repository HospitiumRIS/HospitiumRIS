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
  useTheme,
  alpha,
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
  AdminPanelSettings as AccountTypesIcon,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../AuthProvider';
import { InstitutionAdminProvider, useInstitutionAdmin } from './InstitutionAdminContext';

const drawerWidth = 260;
const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7a5caa';

const NAV_SECTIONS = [
  {
    labelKey: 'institution_admin.nav_overview',
    labelDefault: 'Overview',
    items: [
      {
        textKey: 'institution_admin.dashboard',
        textDefault: 'Dashboard',
        icon: DashboardIcon,
        path: '/institution-admin',
      },
    ],
  },
  {
    labelKey: 'institution_admin.nav_institution',
    labelDefault: 'Institution',
    items: [
      {
        textKey: 'institution_admin.institution_profile',
        textDefault: 'Institution Profile',
        icon: InstitutionIcon,
        path: '/institution-admin/profile',
      },
      {
        textKey: 'institution_admin.user_management',
        textDefault: 'User Management',
        icon: UsersIcon,
        path: '/institution-admin/users',
      },
      {
        textKey: 'institution_admin.account_types',
        textDefault: 'Account Types',
        icon: AccountTypesIcon,
        path: '/institution-admin/account-types',
      },
      {
        textKey: 'institution_admin.verified_domains',
        textDefault: 'Verified Domains',
        icon: VerifiedIcon,
        path: '/institution-admin/verified-domains',
      },
    ],
  },
  {
    labelKey: 'institution_admin.nav_system',
    labelDefault: 'System',
    items: [
      {
        textKey: 'institution_admin.database',
        textDefault: 'Database',
        icon: DatabaseIcon,
        path: '/institution-admin/database',
      },
      {
        textKey: 'institution_admin.logs',
        textDefault: 'Logs',
        icon: LogsIcon,
        path: '/institution-admin/logs',
      },
      {
        textKey: 'global_admin.security',
        textDefault: 'Security',
        icon: SecurityIcon,
        path: '/institution-admin/security',
      },
      {
        textKey: 'global_admin.settings',
        textDefault: 'System Settings',
        icon: SettingsIcon,
        path: '/institution-admin/settings',
      },
    ],
  },
];

function isNavActive(pathname, path) {
  if (path === '/institution-admin') return pathname === path;
  return pathname === path || pathname?.startsWith(`${path}/`);
}

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
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: alpha(PURPLE, 0.02),
      }}
    >
      {/* Sidebar Header */}
      <Box
        sx={{
          px: 2,
          py: 2.25,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DARK} 100%)`,
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
            color: PURPLE,
            width: 44,
            height: 44,
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            p: logoSrc ? 0.5 : 0,
          }}
        >
          <InstitutionIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Tooltip title={institutionName}>
            <Typography
              variant="subtitle1"
              noWrap
              sx={{ fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }}
            >
              {institutionName}
            </Typography>
          </Tooltip>
          <Typography variant="caption" sx={{ opacity: 0.88, fontWeight: 500 }}>
            {t('institution_admin.panel_title')}
          </Typography>
        </Box>
      </Box>

      {/* User Info */}
      {user && (
        <Box
          sx={{
            px: 2,
            py: 1.75,
            borderBottom: '1px solid',
            borderColor: alpha(PURPLE, 0.1),
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: alpha(PURPLE, 0.14),
                color: PURPLE,
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              {user.givenName?.[0]}{user.familyName?.[0]}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                {user.givenName} {user.familyName}
              </Typography>
              <Chip
                label={t('institution_admin.panel_title')}
                size="small"
                sx={{
                  mt: 0.5,
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  bgcolor: alpha(PURPLE, 0.1),
                  color: PURPLE_DARK,
                  border: `1px solid ${alpha(PURPLE, 0.18)}`,
                }}
              />
            </Box>
          </Box>
        </Box>
      )}

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5, px: 1.25 }}>
        {NAV_SECTIONS.map((section, sectionIndex) => (
          <Box key={section.labelKey} sx={{ mb: sectionIndex < NAV_SECTIONS.length - 1 ? 1.5 : 0 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                px: 1.5,
                py: 0.75,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: alpha(PURPLE, 0.55),
                fontSize: '0.65rem',
              }}
            >
              {t(section.labelKey, { defaultValue: section.labelDefault })}
            </Typography>
            <List disablePadding>
              {section.items.map((item) => {
                const Icon = item.icon;
                const text = t(item.textKey, { defaultValue: item.textDefault });
                const isActive = isNavActive(pathname, item.path);

                return (
                  <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
                    <ListItemButton
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        borderRadius: 1.5,
                        py: 1,
                        px: 1.5,
                        minHeight: 40,
                        position: 'relative',
                        bgcolor: isActive ? alpha(PURPLE, 0.12) : 'transparent',
                        color: isActive ? PURPLE_DARK : 'text.secondary',
                        '&::before': isActive
                          ? {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              top: '20%',
                              bottom: '20%',
                              width: 3,
                              borderRadius: '0 2px 2px 0',
                              bgcolor: PURPLE,
                            }
                          : {},
                        '&:hover': {
                          bgcolor: isActive ? alpha(PURPLE, 0.16) : alpha(PURPLE, 0.06),
                          color: isActive ? PURPLE_DARK : 'text.primary',
                        },
                        transition: 'background-color 0.2s ease, color 0.2s ease',
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: isActive ? PURPLE : alpha(PURPLE, 0.45),
                          '& .MuiSvgIcon-root': { fontSize: 20 },
                        }}
                      >
                        <Icon />
                      </ListItemIcon>
                      <ListItemText
                        primary={text}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: isActive ? 600 : 500,
                          letterSpacing: '-0.01em',
                          color: 'inherit',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: alpha(PURPLE, 0.1) }} />

      {/* Footer */}
      <Box sx={{ px: 2, py: 1.75, bgcolor: 'background.paper' }}>
        <Typography
          variant="caption"
          align="center"
          display="block"
          sx={{ fontWeight: 600, color: alpha(PURPLE, 0.7) }}
        >
          HospitiumRIS v1.0
        </Typography>
        <Typography
          variant="caption"
          align="center"
          display="block"
          sx={{ fontSize: '0.65rem', mt: 0.25, color: 'text.disabled' }}
        >
          © 2026 All rights reserved
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: '100%',
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderBottom: `1px solid ${alpha(PURPLE, 0.12)}`,
          }}
        >
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 1.5 }}>
              <MenuIcon />
            </IconButton>
            <Avatar
              src={logoSrc}
              variant="rounded"
              alt={institutionName}
              sx={{ width: 32, height: 32, mr: 1.25, bgcolor: PURPLE }}
            >
              <InstitutionIcon fontSize="small" />
            </Avatar>
            <Typography variant="subtitle1" noWrap component="div" sx={{ fontWeight: 600 }}>
              {institutionName}
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: `1px solid ${alpha(PURPLE, 0.12)}`,
              },
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
                borderRight: `1px solid ${alpha(PURPLE, 0.12)}`,
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
          mt: { xs: 7, md: 0 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

const InstitutionAdminLayout = ({ children }) => (
  <InstitutionAdminProvider>
    <InstitutionAdminDrawer>{children}</InstitutionAdminDrawer>
  </InstitutionAdminProvider>
);

export default InstitutionAdminLayout;
