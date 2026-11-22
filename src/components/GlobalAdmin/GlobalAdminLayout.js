'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Drawer,
  Button,
  Typography,
  ListItemButton,
  Avatar,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  SpaceDashboardOutlined as DashboardIcon,
  MonitorHeartOutlined as OperationsIcon,
  ApartmentOutlined as InstitutionsIcon,
  HealthAndSafetyOutlined as HealthIcon,
  ReceiptLongOutlined as LogsIcon,
  HistoryOutlined as AuditIcon,
  InsightsOutlined as AnalyticsIcon,
  StorageOutlined as DatabaseIcon,
  ShieldOutlined as SecurityIcon,
  SettingsOutlined as SettingsIcon,
  AdminPanelSettingsOutlined as BrandIcon
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../AuthProvider';
import { TOPBAR_HEIGHT } from '../TopBar';

const drawerWidth = 264;

const GlobalAdminLayout = ({ children }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Navigation grouped by purpose so admins can scan it quickly.
  const navSections = [
    {
      label: t('global_admin.nav_overview', 'Overview'),
      items: [
        { text: t('global_admin.system_dashboard'), icon: DashboardIcon, path: '/global-admin' },
        { text: t('global_admin.operations', 'Operations'), icon: OperationsIcon, path: '/global-admin/operations' }
      ]
    },
    {
      label: t('global_admin.nav_institutions', 'Institutions'),
      items: [
        { text: t('global_admin.institution_admins'), icon: InstitutionsIcon, path: '/global-admin/institutions' }
      ]
    },
    {
      label: t('global_admin.nav_monitoring', 'Monitoring'),
      items: [
        { text: t('global_admin.system_health'), icon: HealthIcon, path: '/global-admin/health' },
        { text: t('global_admin.analytics'), icon: AnalyticsIcon, path: '/global-admin/analytics' },
        { text: t('global_admin.audit_log', 'Audit log'), icon: AuditIcon, path: '/global-admin/audit' },
        { text: t('global_admin.system_logs'), icon: LogsIcon, path: '/global-admin/logs' }
      ]
    },
    {
      label: t('global_admin.nav_platform', 'Platform'),
      items: [
        { text: t('global_admin.database_management'), icon: DatabaseIcon, path: '/global-admin/database' },
        { text: t('global_admin.security'), icon: SecurityIcon, path: '/global-admin/security' },
        { text: t('global_admin.settings'), icon: SettingsIcon, path: '/global-admin/settings' }
      ]
    }
  ];

  const isActivePath = (path) =>
    path === '/global-admin'
      ? pathname === path
      : pathname === path || pathname?.startsWith(`${path}/`);

  const currentItem = navSections
    .flatMap((section) => section.items)
    .find((item) => isActivePath(item.path));

  const handleNavigation = (path) => {
    router.push(path);
    if (isMobile) setMobileOpen(false);
  };

  const initials = `${user?.givenName?.[0] || ''}${user?.familyName?.[0] || ''}`.toUpperCase() || 'A';
  const fullName = [user?.givenName, user?.familyName].filter(Boolean).join(' ');

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper'
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          height: 72,
          flexShrink: 0,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            flexShrink: 0
          }}
        >
          <BrandIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }} noWrap>
            HospitiumRIS
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }} noWrap display="block">
            {t('global_admin.global_admin_panel')}
          </Typography>
        </Box>
      </Box>

      {/* Navigation */}
      <Box
        component="nav"
        aria-label={t('global_admin.global_admin_panel')}
        sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 2 }}
      >
        {navSections.map((section, sectionIndex) => (
          <Box key={section.label} sx={{ mt: sectionIndex === 0 ? 0 : 2.5 }}>
            <Typography
              component="div"
              sx={{
                px: 1.5,
                mb: 0.75,
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'text.disabled'
              }}
            >
              {section.label}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              {section.items.map((item) => {
                const active = isActivePath(item.path);
                const Icon = item.icon;
                return (
                  <ListItemButton
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    selected={active}
                    aria-current={active ? 'page' : undefined}
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      borderRadius: 1.5,
                      px: 1.5,
                      py: 0.875,
                      minHeight: 40,
                      color: active ? 'primary.main' : 'text.secondary',
                      transition: 'background-color 0.15s ease, color 0.15s ease',
                      '&:hover': {
                        bgcolor: active
                          ? alpha(theme.palette.primary.main, 0.12)
                          : 'action.hover',
                        color: active ? 'primary.main' : 'text.primary'
                      },
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                      },
                      '&.Mui-selected:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.14)
                      },
                      '&::before': active
                        ? {
                            content: '""',
                            position: 'absolute',
                            left: -12,
                            top: 8,
                            bottom: 8,
                            width: 3,
                            borderRadius: '0 3px 3px 0',
                            bgcolor: 'primary.main'
                          }
                        : {}
                    }}
                  >
                    <Icon sx={{ fontSize: 20, flexShrink: 0 }} />
                    <Typography
                      noWrap
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: active ? 600 : 500,
                        color: 'inherit'
                      }}
                    >
                      {item.text}
                    </Typography>
                  </ListItemButton>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Signed-in admin + version */}
      <Box sx={{ flexShrink: 0, borderTop: '1px solid', borderColor: 'divider', p: 1.5 }}>
        {user && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              p: 1,
              borderRadius: 1.5,
              bgcolor: 'action.hover'
            }}
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                fontSize: '0.8rem',
                fontWeight: 600,
                bgcolor: 'primary.main'
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Tooltip title={user.email || ''} placement="top">
                <Typography sx={{ fontSize: '0.825rem', fontWeight: 600, lineHeight: 1.3 }} noWrap>
                  {fullName || user.email}
                </Typography>
              </Tooltip>
              <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ lineHeight: 1.3 }}>
                {t('global_admin.role_global_admin', 'Global administrator')}
              </Typography>
            </Box>
          </Box>
        )}
        <Typography
          variant="caption"
          color="text.disabled"
          display="block"
          align="center"
          sx={{ mt: 1.25, fontSize: '0.68rem' }}
        >
          HospitiumRIS v1.0 · {t('footer.copyright', { year: new Date().getFullYear() })}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            open
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: '1px solid',
                borderColor: 'divider'
              }
            }}
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        {/*
          On phones/tablets the site header (TopBar + Navbar) is already fixed at
          the top, so the admin menu button lives in this sticky strip just below
          it instead of in a second fixed AppBar that the site header would cover.
        */}
        {isMobile && (
          <Box
            sx={{
              position: 'sticky',
              top: { xs: TOPBAR_HEIGHT + 56, sm: TOPBAR_HEIGHT + 64 },
              zIndex: theme.zIndex.appBar - 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1,
              py: 0.5,
              bgcolor: 'background.paper',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Button
              onClick={() => setMobileOpen(true)}
              startIcon={<MenuIcon />}
              aria-label={t('global_admin.open_menu', 'Open menu')}
              sx={{ textTransform: 'none', fontWeight: 600, color: 'text.primary', minWidth: 0 }}
            >
              {t('global_admin.admin_menu', 'Admin menu')}
            </Button>
            {currentItem && (
              <>
                <Typography color="text.disabled" sx={{ fontSize: '0.875rem' }}>
                  /
                </Typography>
                <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'primary.main', minWidth: 0 }}>
                  {currentItem.text}
                </Typography>
              </>
            )}
          </Box>
        )}
        {children}
      </Box>
    </Box>
  );
};

export default GlobalAdminLayout;
