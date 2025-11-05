'use client';

import React, { memo, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  InputBase,
  Chip,
  Stack,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Tooltip,
  Breadcrumbs,
  Link,
  Button,
  alpha,
  useTheme,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import {
  Search as SearchIcon,
  NotificationsOutlined as NotificationsIcon,
  SettingsOutlined as SettingsIcon,
  AccountCircle as AccountIcon,
  MenuOpen as MenuOpenIcon,
  Home as HomeIcon,
  AccountBalance as FoundationIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as ReportIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

const ProfessionalFoundationHeader = memo(({ 
  title = "Foundation Dashboard",
  subtitle = "Comprehensive overview of foundation activities, funding, and impact",
  onMenuClick,
  onSearch,
  onRefresh,
  onExport,
  onShare,
  onCreateCampaign,
  lastUpdated,
  isLoading = false,
  stats = {}
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleSearch = (event) => {
    if (event.key === 'Enter') {
      onSearch?.(searchValue);
    }
  };

  const breadcrumbs = [
    {
      label: 'Home',
      icon: HomeIcon,
      path: '/'
    },
    {
      label: 'Foundation',
      icon: FoundationIcon,
      current: true
    }
  ];

  const notifications = [
    {
      id: 1,
      title: 'New Donation Received',
      message: 'Major gift of $25,000 from Johnson Foundation',
      time: '5 minutes ago',
      type: 'success',
      urgent: true
    },
    {
      id: 2,
      title: 'Campaign Milestone',
      message: 'Medical Research campaign reached 80% of goal',
      time: '1 hour ago',
      type: 'info',
      urgent: false
    },
    {
      id: 3,
      title: 'Grant Application Due',
      message: 'NSF Research Grant deadline in 3 days',
      time: '2 hours ago',
      type: 'warning',
      urgent: true
    },
    {
      id: 4,
      title: 'New Volunteer Registration',
      message: 'Dr. Emily Chen registered as a volunteer reviewer',
      time: '3 hours ago',
      type: 'info',
      urgent: false
    }
  ];

  const urgentNotifications = notifications.filter(n => n.urgent).length;

  return (
    <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, #8b6cbc 0%, #a084d1 30%, #b794f4 70%, #c9a6f7 100%)`,
          borderBottom: `1px solid ${alpha('#fff', 0.1)}`,
          backdropFilter: 'blur(20px)',
        }}
      >
        <Toolbar sx={{ px: { xs: 3, sm: 4, md: 6 }, py: 3, minHeight: 100 }}>
          {/* Left Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {/* Menu Toggle */}
            <IconButton
              edge="start"
              color="inherit"
              onClick={onMenuClick}
              sx={{ 
                mr: 3,
                backgroundColor: 'rgba(255,255,255,0.15)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' },
                display: { xs: 'flex', lg: 'none' }
              }}
            >
              <MenuOpenIcon />
            </IconButton>

            {/* Title and Breadcrumbs */}
            <Box sx={{ flex: 1 }}>
              {/* Breadcrumbs */}
              <Breadcrumbs 
                separator="›" 
                sx={{ 
                  mb: 1,
                  '& .MuiBreadcrumbs-separator': {
                    color: 'rgba(255,255,255,0.6)',
                    mx: 1
                  }
                }}
              >
                {breadcrumbs.map((crumb, index) => (
                  <Link
                    key={index}
                    underline="hover"
                    color={crumb.current ? "inherit" : "rgba(255,255,255,0.8)"}
                    href={crumb.path}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: '0.9rem',
                      fontWeight: crumb.current ? 600 : 400,
                      '&:hover': {
                        color: 'rgba(255,255,255,1)'
                      }
                    }}
                  >
                    <crumb.icon sx={{ fontSize: 18 }} />
                    {crumb.label}
                  </Link>
                ))}
              </Breadcrumbs>

              {/* Title and Stats */}
              <Stack direction="row" alignItems="center" spacing={3}>
                <Box>
                  <Typography 
                    variant="h3" 
                    component="h1" 
                    sx={{ 
                      fontWeight: 900,
                      fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                      color: 'white',
                      mb: 0.5,
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {title}
                  </Typography>
                  
                  {/* Subtitle */}
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: { xs: '0.9rem', md: '1rem' },
                      maxWidth: 500
                    }}
                  >
                    {subtitle}
                  </Typography>
                </Box>

                {/* Quick Stats */}
                <Stack direction="row" spacing={2} sx={{ display: { xs: 'none', lg: 'flex' } }}>
                  <Card sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.12)', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <TrendingUpIcon sx={{ fontSize: 20, color: '#4caf50' }} />
                        <Box>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                            $2,000
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }}>
                            Raised Today
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.12)', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <FoundationIcon sx={{ fontSize: 20, color: '#ff9800' }} />
                        <Box>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                            3
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }}>
                            Active Campaigns
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </Stack>
            </Box>
          </Box>

          {/* Center Section - Search */}
          <Box sx={{ 
            display: { xs: 'none', md: 'flex' }, 
            mx: 4,
            minWidth: 350
          }}>
            <Box
              sx={{
                position: 'relative',
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                },
                width: '100%'
              }}
            >
              <Box sx={{
                padding: theme.spacing(0, 2),
                height: '100%',
                position: 'absolute',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
              </Box>
              <InputBase
                placeholder="Search campaigns, donors, reports..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={handleSearch}
                sx={{
                  color: 'white',
                  width: '100%',
                  '& .MuiInputBase-input': {
                    padding: theme.spacing(1.5, 1, 1.5, 0),
                    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
                    width: '100%',
                    fontSize: '0.95rem',
                    '&::placeholder': {
                      color: 'rgba(255,255,255,0.6)',
                      opacity: 1
                    }
                  },
                }}
              />
            </Box>
          </Box>

          {/* Right Section */}
          <Stack direction="row" alignItems="center" spacing={1}>
            {/* Last Updated */}
            {lastUpdated && (
              <Chip
                icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                label={`Updated ${lastUpdated}`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  fontSize: '0.75rem',
                  height: 32,
                  display: { xs: 'none', sm: 'flex' },
                  '& .MuiChip-icon': { color: 'rgba(255,255,255,0.8)' }
                }}
              />
            )}

            {/* Action Buttons */}
            <Stack direction="row" spacing={1}>
              <Tooltip title="Create Campaign">
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={onCreateCampaign}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    borderRadius: 3,
                    px: 3,
                    '&:hover': { 
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease',
                    display: { xs: 'none', md: 'flex' }
                  }}
                >
                  New Campaign
                </Button>
              </Tooltip>

              <Tooltip title="Generate Report">
                <IconButton
                  onClick={onExport}
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  <ReportIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Refresh Data">
                <IconButton
                  onClick={onRefresh}
                  disabled={isLoading}
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
                    '&:disabled': { opacity: 0.5 }
                  }}
                >
                  <RefreshIcon sx={{ 
                    animation: isLoading ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }} />
                </IconButton>
              </Tooltip>
            </Stack>

            <Divider orientation="vertical" flexItem sx={{ 
              borderColor: 'rgba(255,255,255,0.2)', 
              mx: 1 
            }} />

            {/* Notifications */}
            <Tooltip title={`${urgentNotifications} urgent notifications`}>
              <IconButton
                onClick={handleNotificationClick}
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <Badge badgeContent={urgentNotifications} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Settings */}
            <Tooltip title="Settings">
              <IconButton
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            {/* Profile */}
            <Tooltip title="Foundation Admin">
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <Avatar sx={{ 
                  width: 36, 
                  height: 36, 
                  fontSize: '1rem',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white'
                }}>
                  FA
                </Avatar>
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 220,
                borderRadius: 3,
                boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
                overflow: 'hidden'
              }
            }}
          >
            <MenuItem onClick={handleProfileMenuClose} sx={{ py: 1.5 }}>
              <AccountIcon sx={{ mr: 2 }} />
              Foundation Profile
            </MenuItem>
            <MenuItem onClick={handleProfileMenuClose} sx={{ py: 1.5 }}>
              <SettingsIcon sx={{ mr: 2 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleProfileMenuClose} sx={{ py: 1.5 }}>
              <ReportIcon sx={{ mr: 2 }} />
              Reports
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleProfileMenuClose} sx={{ py: 1.5 }}>
              Logout
            </MenuItem>
          </Menu>

          {/* Notifications Menu */}
          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={handleNotificationClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 400,
                maxHeight: 500,
                borderRadius: 3,
                boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
                overflow: 'hidden'
              }
            }}
          >
            <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Notifications
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {urgentNotifications} urgent, {notifications.length - urgentNotifications} others
              </Typography>
            </Box>
            {notifications.map((notification) => (
              <MenuItem 
                key={notification.id} 
                onClick={handleNotificationClose}
                sx={{ 
                  py: 2,
                  borderLeft: notification.urgent ? `4px solid ${theme.palette.error.main}` : 'none',
                  backgroundColor: notification.urgent ? alpha(theme.palette.error.main, 0.02) : 'inherit'
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {notification.title}
                    </Typography>
                    {notification.urgent && (
                      <Chip label="Urgent" size="small" color="error" sx={{ height: 20, fontSize: '0.65rem' }} />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notification.time}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>
        </Toolbar>
      </AppBar>
    </Box>
  );
});

ProfessionalFoundationHeader.displayName = 'ProfessionalFoundationHeader';

export default ProfessionalFoundationHeader;
