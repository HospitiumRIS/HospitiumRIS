'use client';

import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Typography,
  Box,
  ListItemIcon,
  Button,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Login as LoginIcon,
  ListAlt as LogsIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthProvider';

const UserDropdown = () => {
  const theme = useTheme();
  const router = useRouter();
  const { user, logout, getDashboardRoute, getUserRole } = useAuth();
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  const handleUserMenuClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleUserMenuItemClick = (event, action, path = null) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setUserMenuAnchor(null);
    if (action === 'logout') {
      handleLogout();
    } else if (path) {
      router.push(path);
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

  return (
    <>
      {/* User Avatar */}
      <Tooltip title={`${user?.givenName || user?.firstName || user?.email}`}>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            backgroundColor: '#8b6cbc',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: '2px solid rgba(139, 108, 188, 0.2)',
            '&:hover': {
              backgroundColor: '#7a5ba8',
              transform: 'scale(1.05)',
              borderColor: 'rgba(139, 108, 188, 0.3)',
            },
            transition: 'all 0.2s ease',
          }}
          onClick={handleUserMenuClick}
        >
          {(user?.givenName || user?.firstName || user?.email)?.charAt(0)?.toUpperCase()}
        </Avatar>
      </Tooltip>

      {/* User Dropdown Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        disableAutoFocusItem
        disableScrollLock
        sx={{
          '& .MuiPaper-root': {
            minWidth: 320,
            maxWidth: 360,
            mt: 1,
            borderRadius: 3,
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
                      {/* User Profile Card */}
        <Box 
          sx={{ 
            background: 'linear-gradient(135deg, #8b6cbc 0%, #a855c7 100%)',
            color: 'white',
            p: 3,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              transform: 'translate(30px, -30px)',
            }
          }}
        >
          {/* Avatar and Basic Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, position: 'relative', zIndex: 1 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontSize: '1.25rem',
                fontWeight: 600,
                mr: 2,
                border: '2px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              {(user?.givenName || user?.firstName || user?.email)?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.1rem' }}>
                {user?.givenName && user?.familyName 
                  ? `${user.givenName} ${user.familyName}`
                  : user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email?.split('@')[0]
                }
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
                {user?.email}
              </Typography>
            </Box>
          </Box>

          {/* Manage Account Button */}
          <Button
            fullWidth
            onClick={(event) => {
              const profileRoute = user?.accountType === 'RESEARCHER'
                ? '/researcher/profile'
                : user?.accountType === 'RESEARCH_ADMIN'
                ? '/institution/profile'
                : user?.accountType === 'FOUNDATION_ADMIN'
                ? '/foundation/profile'
                : '/profile';
              handleUserMenuItemClick(event, 'profile', profileRoute);
            }}
            sx={{
              backgroundColor: '#e91e63',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.5px',
              py: 1.2,
              mb: 2,
              borderRadius: 2,
              textTransform: 'uppercase',
              '&:hover': {
                backgroundColor: '#d81b60',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(233, 30, 99, 0.4)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Manage My Account
          </Button>
        </Box>

        {/* User Details Section */}
        <Box sx={{ px: 3, py: 2, backgroundColor: theme.palette.grey[50] }}>
          {/* Role/Education Info */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                {getUserRole() === 'researcher' ? 'Researcher' : 
                 getUserRole() === 'research_admin' ? 'Research Administrator' : 
                 getUserRole() === 'foundation_admin' ? 'Foundation Administrator' : 
                 'User'}
              </Typography>
              {user?.primaryInstitution && (
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  {user.primaryInstitution}
                </Typography>
              )}
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  backgroundColor: '#4caf50', 
                  color: 'white', 
                  px: 1, 
                  py: 0.25, 
                  borderRadius: 1,
                  fontWeight: 500,
                  fontSize: '0.7rem'
                }}
              >
                Active
              </Typography>
            </Box>
          </Box>

          {/* ORCID ID if available */}
          {user?.orcidId && (
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
              ORCID: {user.orcidId}
            </Typography>
          )}
        </Box>

        {/* Quick Actions */}
        <Box sx={{ px: 2, py: 1 }}>
          <MenuItem 
            onClick={(event) => {
              const dashboardRoute = getDashboardRoute();
              console.log('🚀 Dashboard Route:', dashboardRoute, 'User Role:', getUserRole(), 'Account Type:', user?.accountType);
              handleUserMenuItemClick(event, 'dashboard', dashboardRoute);
            }}
            sx={{
              borderRadius: 1,
              mx: 1,
              '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.08)' }
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <DashboardIcon sx={{ fontSize: 18, color: '#8b6cbc' }} />
            </ListItemIcon>
            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>Dashboard</Typography>
          </MenuItem>

          <MenuItem 
            onClick={(event) => {
              const profileRoute = user?.accountType === 'RESEARCHER'
                ? '/researcher/profile'
                : user?.accountType === 'RESEARCH_ADMIN'
                ? '/institution/profile'
                : user?.accountType === 'FOUNDATION_ADMIN'
                ? '/foundation/profile'
                : '/profile';
              handleUserMenuItemClick(event, 'profile', profileRoute);
            }}
            sx={{
              borderRadius: 1,
              mx: 1,
              '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.08)' }
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <AccountCircleIcon sx={{ fontSize: 18, color: '#8b6cbc' }} />
            </ListItemIcon>
            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>Profile</Typography>
          </MenuItem>

          <MenuItem 
            onClick={(event) => handleUserMenuItemClick(event, 'settings', '/settings')}
            sx={{
              borderRadius: 1,
              mx: 1,
              '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.08)' }
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <SettingsIcon sx={{ fontSize: 18, color: '#8b6cbc' }} />
            </ListItemIcon>
            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>Settings</Typography>
          </MenuItem>

          {/* Admin-only Logs menu item */}
          {(user?.accountType === 'RESEARCH_ADMIN' || user?.accountType === 'FOUNDATION_ADMIN' || user?.accountType === 'SUPER_ADMIN') && (
            <MenuItem 
              onClick={(event) => handleUserMenuItemClick(event, 'logs', '/logs')}
              sx={{
                borderRadius: 1,
                mx: 1,
                '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.08)' }
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <LogsIcon sx={{ fontSize: 18, color: '#8b6cbc' }} />
              </ListItemIcon>
              <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>Activity Logs</Typography>
            </MenuItem>
          )}
        </Box>

        {/* Divider */}
        <Box sx={{ mx: 2, borderBottom: `1px solid ${theme.palette.divider}`, my: 1 }} />

        {/* Sign Out */}
        <Box sx={{ px: 2, pb: 1 }}>
          <MenuItem 
            onClick={(event) => handleUserMenuItemClick(event, 'logout')}
            sx={{
              borderRadius: 1,
              mx: 1,
              '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.08)' }
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <LoginIcon sx={{ fontSize: 18, color: '#ff9800' }} />
            </ListItemIcon>
            <Typography variant="body2" sx={{ fontSize: '0.9rem', color: '#ff9800' }}>
              Sign Out
            </Typography>
          </MenuItem>
        </Box>
      </Menu>
    </>
  );
};

export default UserDropdown;
