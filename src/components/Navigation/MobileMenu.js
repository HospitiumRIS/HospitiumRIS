'use client';

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  ListAlt as LogsIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthProvider';

const MobileMenu = ({ isOpen, onClose, dashboardConfig = null }) => {
  const theme = useTheme();
  const router = useRouter();
  const { user, isAuthenticated, logout, getDashboardRoute, getUserRole } = useAuth();

  const handleMenuItemClick = (event, path) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    onClose(null);
    router.push(path);
  };

  const handleMobileMenuItemClick = (action) => {
    onClose(false);
    if (action === 'login') {
      router.push('/login');
    } else if (action === 'register') {
      router.push('/register');
    } else if (action === 'dashboard') {
      router.push(getDashboardRoute());
    } else if (action === 'logout') {
      handleLogout();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if logout fails
      router.push('/');
    }
  };

  const handleCloseMenu = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    onClose(null);
  };

  // Dashboard mobile menu (when on dashboard pages)
  if (dashboardConfig && dashboardConfig.menuItems) {
    return (
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={onClose}
        disableScrollLock
        sx={{
          '& .MuiDrawer-paper': {
            width: 300,
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              Menu
            </Typography>
            <IconButton onClick={handleCloseMenu} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Mobile Menu Items */}
          {dashboardConfig?.menuItems?.map((menuItem, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#8b6cbc' }}>
                {menuItem.label}
              </Typography>
              {/* Handle both new categorized format and old flat format */}
              {menuItem.categories ? (
                // New categorized format
                menuItem.categories.map((category, categoryIndex) => (
                  <Box key={categoryIndex}>
                    {category.items?.map((item, itemIndex) => (
                      <Button
                        key={itemIndex}
                        fullWidth
                        onClick={(event) => {
                          handleMenuItemClick(event, item.path);
                        }}
                        sx={{
                          justifyContent: 'flex-start',
                          textTransform: 'none',
                          color: theme.palette.text.secondary,
                          fontSize: '0.9rem',
                          pl: 2,
                          '&:hover': {
                            backgroundColor: 'rgba(139, 108, 188, 0.1)',
                          },
                        }}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </Box>
                ))
              ) : (
                // Old flat format (backward compatibility)
                menuItem.items?.map((item, itemIndex) => (
                  <Button
                    key={itemIndex}
                    fullWidth
                    onClick={(event) => {
                      handleMenuItemClick(event, item.path);
                    }}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        backgroundColor: 'rgba(139, 108, 188, 0.1)',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))
              )}
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />

          {/* User Info */}
          <Box sx={{ p: 2, backgroundColor: theme.palette.background.default, borderRadius: 1, mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#8b6cbc' }}>
              {user?.givenName && user?.familyName 
                ? `${user.givenName} ${user.familyName}`
                : user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email
              }
            </Typography>
            {user?.orcidId && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {user.orcidId}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              {user?.primaryInstitution || getUserRole()}
            </Typography>
          </Box>

          {/* Mobile Menu Actions */}
          <Button
            fullWidth
            startIcon={<DashboardIcon />}
            onClick={(event) => {
              handleMenuItemClick(event, getDashboardRoute());
            }}
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              mb: 1,
              color: theme.palette.text.secondary,
              '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.1)' },
            }}
          >
            Dashboard
          </Button>

          <Button
            fullWidth
            startIcon={<AccountCircleIcon />}
            onClick={(event) => {
              handleMenuItemClick(event, '/profile');
            }}
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              mb: 1,
              color: theme.palette.text.secondary,
              '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.1)' },
            }}
          >
            {getUserRole() === 'researcher' ? 'Researcher Profile' : 
             getUserRole() === 'research_admin' ? 'Institution Profile' : 
             getUserRole() === 'foundation_admin' ? 'Foundation Profile' : 
             'Profile'}
          </Button>

          <Button
            fullWidth
            startIcon={<SettingsIcon />}
            onClick={(event) => {
              handleMenuItemClick(event, '/settings');
            }}
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              mb: 1,
              color: theme.palette.text.secondary,
              '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.1)' },
            }}
          >
            Settings
          </Button>

          {/* Logout */}
          <Button
            fullWidth
            startIcon={<LoginIcon />}
            onClick={handleLogout}
            sx={{
              mt: 2,
              justifyContent: 'flex-start',
              color: theme.palette.error.main,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: theme.palette.error.main + '10',
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Drawer>
    );
  }

  // Regular mobile menu (when on home/other pages)
  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      disableScrollLock
      sx={{
        display: { xs: 'block', sm: 'none' },
        '& .MuiDrawer-paper': {
          width: 280,
          backgroundColor: theme.palette.background.paper,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            Menu
          </Typography>
          <IconButton onClick={handleCloseMenu} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <List sx={{ p: 0 }}>
          {isAuthenticated ? (
            <>
              {/* User Info */}
              <ListItem>
                <ListItemText 
                  primary={`Welcome, ${user?.givenName || user?.firstName || user?.email}`}
                  secondary={[
                    `Role: ${getUserRole() || 'User'}`,
                    user?.primaryInstitution && `Institution: ${user.primaryInstitution}`,
                    user?.orcidId && `ORCID: ${user.orcidId}`
                  ].filter(Boolean).join(' • ')}
                />
              </ListItem>
              
              {/* Dashboard */}
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleMobileMenuItemClick('dashboard')} sx={{ borderRadius: 1 }}>
                  <ListItemIcon>
                    <DashboardIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItemButton>
              </ListItem>

              {/* Admin-only Activity Logs */}
              {(user?.accountType === 'RESEARCH_ADMIN' || user?.accountType === 'FOUNDATION_ADMIN' || user?.accountType === 'SUPER_ADMIN') && (
                <ListItem disablePadding>
                  <ListItemButton onClick={(event) => handleMenuItemClick(event, '/logs')} sx={{ borderRadius: 1 }}>
                    <ListItemIcon>
                      <LogsIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Activity Logs" />
                  </ListItemButton>
                </ListItem>
              )}

              {/* Logout */}
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleMobileMenuItemClick('logout')} sx={{ borderRadius: 1 }}>
                  <ListItemIcon>
                    <LoginIcon color="error" />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </ListItem>
            </>
          ) : (
            <>
              {/* Login */}
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleMobileMenuItemClick('login')} sx={{ borderRadius: 1 }}>
                  <ListItemIcon>
                    <LoginIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Login" />
                </ListItemButton>
              </ListItem>

              {/* Register */}
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleMobileMenuItemClick('register')} sx={{ borderRadius: 1 }}>
                  <ListItemIcon>
                    <PersonAddIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Register" />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );
};

export default MobileMenu;
