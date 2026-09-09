'use client';

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Stack,
  useTheme,
  IconButton,
  Typography,
  useMediaQuery,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useThemeMode } from './ThemeProvider';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthProvider';
import { UserDropdown, MobileMenu, DashboardNav } from './Navigation';
import { TOPBAR_HEIGHT } from './TopBar';
import NotificationDropdown from './Notifications/NotificationDropdown';
import { useNotifications } from '../hooks/useNotifications';
import { useDashboardConfig } from '../hooks/useDashboardConfig';

// NoSSR wrapper component to prevent hydration mismatch
const NoSSR = ({ children, fallback = null }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback;
  }

  return children;
};

const Navbar = () => {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { isDarkMode } = useThemeMode();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  // Always call hooks unconditionally - handle errors within the hook itself
  const notificationState = useNotifications();
  const unreadCount = notificationState?.unreadCount || 0;
  const notificationsLoading = notificationState?.isLoading || false;
  const notificationsError = notificationState?.error || null;
  
  // Debug notifications
  console.log('🔔 Navbar notifications state (UNREAD ONLY):', { 
    unreadCount, 
    isLoading: notificationsLoading,
    error: notificationsError 
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [resourcesAnchor, setResourcesAnchor] = useState(null);
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Handle client-side mounting
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use pathname from usePathname hook which updates on route changes
  const currentPath = pathname || '';

  const isGlobalAdminRoute = currentPath.startsWith('/global-admin');

  // Dashboard menus (Publications, Projects, ...) must not appear on global-admin
  // routes. Use path prefixes so `/global-admin/institutions` is not treated as
  // an institution dashboard.
  const isDashboardPage = isClient && isAuthenticated && !isGlobalAdminRoute && (
    currentPath === '/institution' || currentPath.startsWith('/institution/') ||
    currentPath === '/researcher' || currentPath.startsWith('/researcher/') ||
    currentPath === '/foundation' || currentPath.startsWith('/foundation/')
  );
  
  const dashboardConfig = useDashboardConfig();

  const handleMobileMenuToggle = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogoClick = () => {
    router.push('/');
  };

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleRegisterClick = () => {
    router.push('/register');
  };

  // Handle notifications
  const handleNotificationClick = (event) => {
    console.log('🔔 Notification bell clicked', { 
      hasAnchor: !!event.currentTarget,
      unreadCount,
      isAuthenticated 
    });
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    console.log('🔔 Notification dropdown closed');
    setNotificationAnchor(null);
  };

  // Determine which navbar to render
  const renderDashboardNavbar = isDashboardPage && dashboardConfig;
  
  // If we're on a dashboard page, render horizontal navbar
  if (renderDashboardNavbar) {
    return (
      <>
        {/* Horizontal Dashboard Navbar */}
        <AppBar
          position="fixed"
          sx={{
            top: TOPBAR_HEIGHT,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark' ? '0 2px 10px rgba(0,0,0,0.5)' : '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: theme.zIndex.appBar,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NoSSR
                fallback={
                  <Image
                    src="/hospitium-logo.png"
                    alt="Hospitium RIS"
                    width={isMobile ? 140 : 200}
                    height={isMobile ? 32 : 50}
                    style={{ cursor: 'pointer', objectFit: 'contain' }}
                    onClick={handleLogoClick}
                    priority
                  />
                }
              >
                <Image
                  src={isDarkMode ? "/hospitium-logo-dark.png" : "/hospitium-logo.png"}
                  alt="Hospitium RIS"
                  width={isMobile ? 140 : 200}
                    height={isMobile ? 32 : 50}
                  style={{ cursor: 'pointer', objectFit: 'contain' }}
                  onClick={handleLogoClick}
                  priority
                />
              </NoSSR>
            </Box>

            {/* Desktop Navigation Menu */}
            {!isMobile && <DashboardNav dashboardConfig={dashboardConfig} />}

            {/* Right Side - Notifications, User, Settings */}
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Notifications */}
              <Tooltip title={t('nav.notifications')}>
                <IconButton
                  onClick={handleNotificationClick}
                  sx={{
                    color: theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: 'rgba(139, 108, 188, 0.1)',
                    },
                  }}
                >
                  <Badge badgeContent={unreadCount > 0 ? unreadCount : null} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* User Dropdown */}
              <UserDropdown />

              {/* Mobile Menu Button */}
              {isMobile && (
                <IconButton
                  onClick={(event) => handleMobileMenuToggle(event)}
                  sx={{
                    color: theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: 'rgba(139, 108, 188, 0.1)',
                    },
                  }}
                >
                  <MenuIcon />
                </IconButton>
              )}
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Spacer to push content below topbar + fixed navbar */}
        <Box sx={{ height: TOPBAR_HEIGHT }} />
        <Toolbar />

        {/* Mobile Menu Drawer */}
        <MobileMenu 
          isOpen={mobileMenuOpen} 
          onClose={setMobileMenuOpen}
          dashboardConfig={dashboardConfig}
        />

        {/* Notification Dropdown */}
        <NotificationDropdown
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
        />
      </>
    );
  }

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          top: TOPBAR_HEIGHT,
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark' ? '0 2px 10px rgba(0,0,0,0.5)' : '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: theme.zIndex.appBar,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          {/* Logo */}
          <Box sx={{ flexGrow: 1 }}>
            <NoSSR
              fallback={
              <Image
                src="/hospitium-logo.png"
                alt="Hospitium RIS"
                width={isMobile ? 135 : 170}
                height={isMobile ? 31 : 38}
                style={{
                  cursor: 'pointer',
                  objectFit: 'contain',
                }}
                onClick={handleLogoClick}
                priority
              />
              }
            >
              <Image
                src={isDarkMode ? "/hospitium-logo-dark.png" : "/hospitium-logo.png"}
                alt="Hospitium RIS"
                width={isMobile ? 135 : 170}
                height={isMobile ? 31 : 38}
                style={{
                  cursor: 'pointer',
                  objectFit: 'contain',
                }}
                onClick={handleLogoClick}
                priority
              />
            </NoSSR>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Stack direction="row" spacing={2} alignItems="center">
              {!isGlobalAdminRoute && (
                <>
              {/* Navigation Links */}
              <Button
                onClick={() => router.push('/')}
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: theme.palette.primary.main,
                  },
                }}
              >
                {t('nav.home')}
              </Button>
              
              <Button
                onClick={() => router.push('/about')}
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: theme.palette.primary.main,
                  },
                }}
              >
                {t('nav.about')}
              </Button>

              <Button
                onClick={(e) => setResourcesAnchor(e.currentTarget)}
                endIcon={<ArrowDownIcon sx={{ fontSize: 18 }} />}
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: theme.palette.primary.main,
                  },
                }}
              >
                {t('nav.resources')}
              </Button>
              <Menu
                anchorEl={resourcesAnchor}
                open={Boolean(resourcesAnchor)}
                onClose={() => setResourcesAnchor(null)}
                disableScrollLock
                PaperProps={{
                  elevation: 3,
                  sx: {
                    mt: 1,
                    minWidth: 180,
                    borderRadius: 2,
                  },
                }}
              >
                <MenuItem
                  onClick={() => { setResourcesAnchor(null); router.push('/news'); }}
                  sx={{ fontSize: '0.95rem', py: 1.2 }}
                >
                  {t('nav.news')}
                </MenuItem>
                <MenuItem
                  onClick={() => { setResourcesAnchor(null); router.push('/faq'); }}
                  sx={{ fontSize: '0.95rem', py: 1.2 }}
                >
                  {t('nav.faq')}
                </MenuItem>
                <MenuItem
                  onClick={() => { setResourcesAnchor(null); window.open('/handbook/hospitiumris-brandbook.pdf', '_blank'); }}
                  sx={{ fontSize: '0.95rem', py: 1.2 }}
                >
                  {t('nav.brandbook')}
                </MenuItem>
                <MenuItem
                  onClick={() => { setResourcesAnchor(null); router.push('/contact'); }}
                  sx={{ fontSize: '0.95rem', py: 1.2 }}
                >
                  {t('nav.contact')}
                </MenuItem>
              </Menu>
                </>
              )}

              {/* Show different buttons based on auth status */}
              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <Tooltip title={t('nav.notifications')}>
                    <IconButton
                      onClick={handleNotificationClick}
                      sx={{
                        color: theme.palette.text.primary,
                        '&:hover': {
                          backgroundColor: 'rgba(139, 108, 188, 0.1)',
                        },
                      }}
                    >
                      <Badge badgeContent={unreadCount > 0 ? unreadCount : null} color="error">
                        <NotificationsIcon />
                      </Badge>
                    </IconButton>
                  </Tooltip>

                  {/* User Dropdown */}
                  <UserDropdown />
                </>
              ) : (
                <>
              {/* Login Button */}
              <Button
                variant="outlined"
                size={isTablet ? "small" : "medium"}
                onClick={handleLoginClick}
                sx={{
                  color: theme.palette.primary.main,
                  borderColor: theme.palette.primary.main,
                  fontWeight: 600,
                  px: isTablet ? 2 : 3,
                  py: 1,
                  fontSize: isTablet ? '0.875rem' : '1rem',
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    backgroundColor: `${theme.palette.primary.main}08`,
                  },
                }}
              >
                {t('nav.login')}
              </Button>
              
              {/* Register Button */}
              <Button
                variant="contained"
                size={isTablet ? "small" : "medium"}
                onClick={handleRegisterClick}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  fontWeight: 600,
                  px: isTablet ? 2 : 3,
                  py: 1,
                  fontSize: isTablet ? '0.875rem' : '1rem',
                  boxShadow: `0 4px 12px ${theme.palette.primary.main}50`,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                    boxShadow: `0 6px 16px ${theme.palette.primary.main}60`,
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {t('nav.register')}
              </Button>
                </>
              )}
            </Stack>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Mobile Menu Button */}
              <IconButton
                onClick={(event) => handleMobileMenuToggle(event)}
                size="small"
                sx={{
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}08`,
                  },
                }}
              >
                <MenuIcon fontSize="small" />
              </IconButton>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      {/* Spacer to push content below topbar + fixed navbar */}
      <Box sx={{ height: TOPBAR_HEIGHT }} />
      <Toolbar />

      {/* Mobile Menu Drawer */}
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={setMobileMenuOpen}
      />

      {/* Notification Dropdown */}
      <NotificationDropdown
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
      />
    </>
  );
};

export default Navbar; 