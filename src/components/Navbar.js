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
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Article as ArticleIcon,
  Work as WorkIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  MonetizationOn as FundingIcon,
  Assignment as GrantIcon,
  Notifications as NotificationsIcon,
  ManageAccounts as UserManagerIcon,
  ManageSearch as OpportunityIcon,
  Assessment as ReportsIcon,
  Handshake as CollaborationsIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  Savings as FundraisingIcon,
  AccountBalanceWallet as FinancialPoolIcon,
  AttachMoney as DisbursementIcon,
  // New icons for enhanced dropdowns
  Foundation as FoundationIcon,
  Groups as GroupsIcon,
  CloudUpload as SubmitIcon,
  Search as SearchIcon,
  CloudDownload as ImportIcon,
  Edit as ManageIcon,
  FolderOpen as ActiveIcon,
  Add as CreateIcon,
  Archive as ArchiveIcon,
  FindInPage as FindIcon,
  Hub as NetworkIcon,
  TrendingUp as ImpactIcon,
  BarChart as ChartIcon,
  Timeline as ProgressIcon,
  // Additional icons for Projects menu
  Description as ProposalIcon,
  Update as FollowUpIcon,
  Timeline as StatusIcon,
  AccountBalance as BudgetIcon,
  Assignment as AwardIcon,
  People as DonorManagementIcon,
  RateReview as ReviewIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useThemeMode } from './ThemeProvider';
import { useAuth } from './AuthProvider';
import { UserDropdown, MobileMenu, SettingsDrawer, DashboardNav } from './Navigation';
import NotificationDropdown from './Notifications/NotificationDropdown';
import { useNotifications } from '../hooks/useNotifications';

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
  const { isDarkMode } = useThemeMode();
  const { isAuthenticated } = useAuth();
  // Always call hooks unconditionally - handle errors within the hook itself
  const notificationState = useNotifications();
  const unreadCount = notificationState?.unreadCount || 0;
  const notificationsLoading = notificationState?.isLoading || false;
  const notificationsError = notificationState?.error || null;
  
  // Debug notifications
  console.log('🔔 Navbar notifications state (UNREAD ONLY):', { 
    unreadCount, 
    notificationsLoading, 
    notificationsError,
    isAuthenticated,
    notificationsCount: notificationState?.notifications?.length || 0
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [isClient, setIsClient] = useState(false);
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Handle client-side mounting
  useEffect(() => {
    setIsClient(true);
    setCurrentPath(window.location.pathname);
  }, []);

  // Update current path on route changes (only on client)
  useEffect(() => {
    if (isClient) {
      setCurrentPath(window.location.pathname);
    }
  }, [router, isClient]);

  // Determine if we're on a dashboard page and user is authenticated (only on client)
  const isDashboardPage = isClient && isAuthenticated && (currentPath.includes('/researcher') || currentPath.includes('/institution') || currentPath.includes('/foundation'));
  
  // Get dashboard type and configuration for horizontal navbar
  const getDashboardConfig = () => {
    if (currentPath.includes('/researcher')) {
      return {
        type: 'researcher',
        title: 'Researcher Portal',
        menuItems: [
          {
            label: 'Publications',
           
            categories: [
              {
                title: 'WRITING PHASE',
                items: [
                  {
                    label: 'Collaborative Writing',
                    description: 'Write and collaborate with others',
                    icon: <GroupsIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/publications/collaborate'
                  },
                  {
                    label: 'Submit to Preprint',
                    description: 'Submit to bioRxiv or medRxiv',
                    icon: <SubmitIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/publications/submit'
                  }
                ]
              },
              {
                title: 'RESEARCH DISCOVERY',
                items: [
                  {
                    label: 'Import Publications',
                    description: 'Import from external sources',
                    icon: <ImportIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/publications/import'
                  },
                  {
                    label: 'Manage Publications',
                    description: 'View and edit your publications',
                    icon: <ManageIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/publications/manage'
                  }
                ]
              }
            ]
          },
          {
            label: 'Projects',
            
            categories: [
              {
                title: 'PROPOSALS',
                items: [
                  {
                    label: 'Create Proposal',
                    description: 'Manage research proposals',
                    icon: <ProposalIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/projects/proposals/list'
                  },
                  {
                    label: 'Follow-ups',
                    description: 'Grant application follow-ups',
                    icon: <FollowUpIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/projects/proposals/liason'
                  }
                ]
              },
              {
                title: 'TRACKING',
                items: [
                  {
                    label: 'Project Status',
                    description: 'Track milestones & progress',
                    icon: <StatusIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/projects/tracking/status'
                  }
                ]
              },
              {
                title: 'BUDGET',
                items: [
                  {
                    label: 'Budget Management',
                    description: 'Monitor budgets and track expenses',
                    icon: <BudgetIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/projects/budget/view'
                  }
                ]
              }
            ]
          },
          {
            label: 'Reports & Analytics',
            
            categories: [
              {
                title: 'RESEARCH METRICS',
                items: [
                  {
                    label: 'Research Impact',
                    description: 'Track your research influence',
                    icon: <ImpactIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/analytics/impact'
                  },
                  {
                    label: 'Publication Reports',
                    description: 'Analyze publication performance',
                    icon: <ChartIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/analytics/publications'
                  },
                  {
                    label: 'Project Progress',
                    description: 'Monitor project milestones',
                    icon: <ProgressIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/analytics/progress'
                  }
                ]
              }
            ]
          }
        ]
      };
    }
    if (currentPath.includes('/institution')) {
      return {
        type: 'institution',
        title: 'Institution Portal',
        menuItems: [
          {
            label: 'Publications',
            categories: [
              {
                title: 'WRITING PHASE',
                items: [
                  {
                    label: 'Collaborative Writing',
                    description: 'Monitor institutional collaborative writings',
                    icon: <GroupsIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/publications/collaborate'
                  },
                  {
                    label: 'Submit to Preprint',
                    description: 'Institutional preprint submissions',
                    icon: <SubmitIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/publications/submit'
                  }
                ]
              },
              {
                title: 'RESEARCH DISCOVERY',
                items: [
                  {
                    label: 'Import Publications',
                    description: 'Import institutional publications',
                    icon: <ImportIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/publications/import'
                  },
                  {
                    label: 'Manage Publications',
                    description: 'View and edit institutional publications',
                    icon: <ManageIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/publications/manage'
                  }
                ]
              }
            ]
          },
          {
            label: 'Projects',
            categories: [
              {
                title: 'PROPOSALS',
                items: [
                  {
                    label: 'View Proposals',
                    description: 'Monitor institutional research proposals',
                    icon: <ProposalIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/projects/proposals/list'
                  },
                  {
                    label: 'Grant Follow-ups',
                    description: 'Institutional grant application follow-ups',
                    icon: <FollowUpIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/projects/proposals/liason'
                  }
                ]
              },
              {
                title: 'TRACKING',
                items: [
                  {
                    label: 'Project Status',
                    description: 'Track institutional project milestones',
                    icon: <StatusIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/projects/tracking/status'
                  }
                ]
              },
              {
                title: 'BUDGET',
                items: [
                  {
                    label: 'Budget Management',
                    description: 'Monitor institutional budgets and expenses',
                    icon: <BudgetIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/projects/budget/view'
                  }
                ]
              }
            ]
          },
          {
            label: 'Administration',
            categories: [
              {
                title: 'PROPOSAL REVIEW',
                items: [
                  {
                    label: 'Review Proposals',
                    description: 'Review and approve project proposals',
                    icon: <ReviewIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/proposals/review'
                  }
                ]
              },
              {
                title: 'PROJECT TRACKING',
                items: [
                  {
                    label: 'Track Projects',
                    description: 'Monitor all ongoing projects and their progress',
                    icon: <AssessmentIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/projects'
                  }
                ]
              },
              {
                title: 'RESEARCHER MANAGEMENT',
                items: [
                  {
                    label: 'Manage Researchers',
                    description: 'Add, edit, and manage researchers',
                    icon: <GroupIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/researchers'
                  },
                  {
                    label: 'Performance Review',
                    description: 'Review researcher performance',
                    icon: <AssessmentIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/researchers/review'
                  }
                ]
              },
              {
                title: 'USER MANAGEMENT',
                items: [
                  {
                    label: 'User Accounts',
                    description: 'Manage user accounts and access',
                    icon: <UserManagerIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/users'
                  },
                  {
                    label: 'Role Management',
                    description: 'Assign and manage user roles',
                    icon: <ManageIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/users/roles'
                  }
                ]
              }
            ]
          },
          {
            label: 'Reports & Analytics',
            categories: [
              {
                title: 'RESEARCH METRICS',
                items: [
                  {
                    label: 'Research Impact',
                    description: 'Track institutional research influence',
                    icon: <ImpactIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/analytics/impact'
                  },
                  {
                    label: 'Publication Reports',
                    description: 'Analyze institutional publication performance',
                    icon: <ChartIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/analytics/publications'
                  },
                  {
                    label: 'Project Progress',
                    description: 'Monitor institutional project milestones',
                    icon: <ProgressIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/analytics/progress'
                  }
                ]
              },
              {
                title: 'INSTITUTIONAL ANALYTICS',
                items: [
                  {
                    label: 'Institution Metrics',
                    description: 'Overall institutional performance',
                    icon: <ReportsIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/analytics'
                  },
                  {
                    label: 'Funding Reports',
                    description: 'Track funding and grant performance',
                    icon: <FundingIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/analytics/funding'
                  },
                  {
                    label: 'Compliance Reports',
                    description: 'Monitor regulatory compliance',
                    icon: <AssignmentIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/analytics/compliance'
                  }
                ]
              }
            ]
          }
        ]
      };
    }
    if (currentPath.includes('/foundation')) {
      return {
        type: 'foundation',
        title: 'Foundation Portal',
        menuItems: [
          {
            label: 'Fundraising',

            categories:[
              {
                title:"CAMPAIGN MANAGEMENT",
                
            items: [
              { label: 'Campaign Management',
                description:'Initiatives & activity tracking',
                icon: <FundraisingIcon sx={{ color: '#8b6cbc', fontSize: '1.1rem' }} />,
                 path: '/foundation/campaigns' },
              
            ]
              },
              {
                title:"DONORS AND DONATIONS MANAGEMENT",
                
            items: [
              { label: 'Donations',
                description:'Profiles, donations & relationships',
                icon:<DonorManagementIcon sx={{ color: '#8b6cbc', fontSize: '1.1rem' }} />,
                 path: '/foundation/donations' },
              
            ]
              }
            ]

          },
          {
            label: 'Grants',

            categories:[
              {
              title:"Pre-award Activities",
              items: [
                { label: 'Grant Opportunities', 
                  description:' Grantor database & opportunity pipeline',
                  icon:  <OpportunityIcon sx={{ color: '#8b6cbc', fontSize: '1.1rem' }}/>,
                  path: '/foundation/grants/opportunities' },

                  { label: 'Grant Writing', 
                    description:' Grant Proposal development',
                    icon:  <DescriptionIcon sx={{ color: '#8b6cbc', fontSize: '1.1rem' }}/>,
                    path: '/foundation/grants/writing-portal' },

                    { label: 'Liason Activies', 
                      description:' Maintain ongoing communication with granting organizations',
                      icon:  <EmailIcon sx={{ color: '#8b6cbc', fontSize: '1.1rem' }}/>,
                      path: '/foundation/grants/tracking' },
               
              ]
            },

            {
              title:"Post-award Activities",
              items: [
                { label: 'Grant Award Tracker',
                  description:' Maintain ongoing communication with granting organizations',
                  icon:  <AwardIcon sx={{ color: '#8b6cbc', fontSize: '1.1rem' }} />,
                  path: '/foundation/grants/won' },
               
              ]
            },
          
          ]
           
          },
          {
            label: 'Finance & Budgeting',
            categories:[
              {
                title:"FUND MANAGEMENT",
                items: [
                  { label: 'Fund Pools',
                    description:' Consolidated fund management',
                    icon: <FoundationIcon sx={{ color: '#8b6cbc', fontSize: '1.1rem' }} />,
                    path: '/foundation/financial/central-fund-pool' },

                    { label: 'Fund Allocations',
                      description:' To integrate with existing finance system',
                      icon:  <FinancialPoolIcon sx={{ color: '#bdbdbd', fontSize: '1.1rem' }} />,
                      path: '#',
                      disabled: true },
                  
                ]
              },
              {
                title:"TRANSACTION PROCESSING",
                items: [
                  { label: 'Disbursement Processing',
                    description:' To integrate with existing finance system',
                    icon:  <DisbursementIcon sx={{ color: '#bdbdbd', fontSize: '1.1rem' }} />,
                    path: '#',
                    disabled: true },

                  
                ]
              }
            ]
          },
        
          //{
           // label: 'Reports & Analytics',
           // items: [
           //   { label: 'Funding Impact', path: '/foundation/analytics' },
           //  { label: 'Grant Reports', path: '/foundation/analytics/grants' },
           //   { label: 'Portfolio Analysis', path: '/foundation/analytics/portfolio' },
           //   { label: 'ROI Analysis', path: '/foundation/analytics/roi' }
           // ]
          //},
          // {
          //   label: 'User Manager',
          //   icon: <UserManagerIcon />,
          //   items: [
          //     { label: 'Foundation Users', path: '/foundation/users' },
          //     { label: 'Reviewer Network', path: '/foundation/users/reviewers' },
          //     { label: 'Access Management', path: '/foundation/users/access' },
          //     { label: 'User Permissions', path: '/foundation/users/permissions' }
          //   ]
          // }
        ]
      };
    }
    return null;
  };

  const dashboardConfig = getDashboardConfig();

  const handleSettingsToggle = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setSettingsOpen(!settingsOpen);
  };

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
              <Tooltip title="Notifications">
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

              {/* Settings */}
              <Tooltip title="Settings">
                <IconButton
                  onClick={(event) => handleSettingsToggle(event)}
                  sx={{
                    color: theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: 'rgba(139, 108, 188, 0.1)',
                    },
                  }}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>

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

        {/* Mobile Menu Drawer */}
        <MobileMenu 
          isOpen={mobileMenuOpen} 
          onClose={setMobileMenuOpen}
          dashboardConfig={dashboardConfig}
        />

        {/* Settings Drawer */}
        <SettingsDrawer 
          isOpen={settingsOpen} 
          onClose={setSettingsOpen} 
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
                Home
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
                About HospitiumRIS
              </Button>

              {/* Settings Button */}
              <IconButton
                onClick={(event) => handleSettingsToggle(event)}
                sx={{
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}08`,
                  },
                }}
              >
                <SettingsIcon />
              </IconButton>

              {/* Show different buttons based on auth status */}
              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <Tooltip title="Notifications">
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
                Login
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
                Register
              </Button>
                </>
              )}
            </Stack>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Settings Button */}
              <IconButton
                onClick={(event) => handleSettingsToggle(event)}
                size="small"
                sx={{
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}08`,
                  },
                }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>

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

      {/* Spacer to push content below fixed navbar */}
      <Toolbar />

      {/* Mobile Menu Drawer */}
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={setMobileMenuOpen}
      />

      {/* Settings Drawer */}
      <SettingsDrawer 
        isOpen={settingsOpen} 
        onClose={setSettingsOpen} 
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