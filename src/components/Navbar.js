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
  NoteAdd as InternalGrantIcon,
  Shield as EthicsIcon,
  Gavel as EthicsReviewIcon,
  Science as TrialIcon,
  AppRegistration as RegistrationIcon,
  VerifiedUser as ComplianceIcon,
  SupervisedUserCircle as TeamIcon,
  FolderShared as DocumentIcon,
  PeopleAlt as RecruitmentIcon,
  HealthAndSafety as SafetyIcon,
  CloudSync as RegistryIcon,
  Insights as ResultsIcon,
  Dashboard as IntelligenceIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
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
    isLoading: notificationsLoading,
    error: notificationsError 
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  // Determine if we're on a dashboard page and user is authenticated (only on client)
  const isDashboardPage = isClient && isAuthenticated && (currentPath.includes('/institution') || currentPath.includes('/researcher') || currentPath.includes('/foundation'));
  
  // Get dashboard type and configuration for horizontal navbar
  const getDashboardConfig = () => {
    // Check /institution first to avoid matching /institution/researchers as /researcher
    if (currentPath.includes('/institution')) {
      return {
        type: 'institution',
        title: 'Institution Portal',
        menuItems: [
          {
            label: 'Publications',
            categories: [
              {
                title: 'WRITING TRACKER',
                items: [
                  {
                    label: 'Manuscripts',
                    description: 'Track manuscripts from draft to published',
                    icon: <ArticleIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/publications/manuscripts'
                  },
                  {
                    label: 'Proposals',
                    description: 'Track proposals from drafting to approval',
                    icon: <SubmitIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/publications/proposals'
                  }
                ]
              }
            ]
          },
          {
            label: 'Projects',
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
                title: 'ETHICS REVIEW',
                items: [
                  {
                    label: 'Review Ethics Applications',
                    description: 'Review and approve ethics applications',
                    icon: <EthicsReviewIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/ethics/review'
                  },
                  
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
              }
            ]
          },
          {
            label: 'Clinical Trials',
            categories: [
              {
                title: 'PORTFOLIO OVERSIGHT',
                items: [
                  {
                    label: 'Trial Portfolio',
                    description: 'All institutional trials — pipeline view',
                    icon: <TrialIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/clinical-trials'
                  }
                ]
              },
              {
                title: 'GOVERNANCE & COMPLIANCE',
                items: [
                  {
                    label: 'Ethics Approvals',
                    description: 'Track IRB/ethics applications and routing',
                    icon: <EthicsReviewIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/clinical-trials/approvals'
                  },
                  {
                    label: 'Compliance Dashboard',
                    description: 'Live flags: ethics expiry, GCP certs, SAE deadlines',
                    icon: <ComplianceIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/clinical-trials/compliance'
                  },
                  {
                    label: 'Registry Oversight',
                    description: 'TRN tracking, submission deadlines, PACTR/CT.gov status',
                    icon: <RegistryIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/clinical-trials/registry'
                  }
                ]
              },
              {
                title: 'OPERATIONS OVERSIGHT',
                items: [
                  {
                    label: 'Recruitment Performance',
                    description: 'Cross-trial enrollment vs target, site benchmarks',
                    icon: <RecruitmentIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/clinical-trials/recruitment'
                  },
                  {
                    label: 'Safety & Deviations',
                    description: 'SAE flag tracker, protocol deviations, corrective actions',
                    icon: <SafetyIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/clinical-trials/safety'
                  },
                  {
                    label: 'Document Repository',
                    description: 'TMF review, version-controlled protocols, audit trail',
                    icon: <DocumentIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/clinical-trials/documents'
                  }
                ]
              },
              {
                title: 'REPORTING & OUTPUTS',
                items: [
                  {
                    label: 'Results & Reporting',
                    description: 'Results submission deadlines, output-to-publication linkage',
                    icon: <ResultsIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/clinical-trials/results'
                  },
                  {
                    label: 'Team & GCP Certification',
                    description: 'Institution-wide GCP certification status, delegation logs',
                    icon: <TeamIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/clinical-trials/team'
                  }
                ]
              }
            ]
          },
          {
            label: 'Training',
            categories: [
              {
                title: 'TRAINING MANAGEMENT',
                items: [
                  {
                    label: 'Manage Trainings',
                    description: 'Create and manage institutional trainings',
                    icon: <SchoolIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/training'
                  }
                ]
              }
            ]
          },
          {
            label: 'Administration',
            categories: [
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
                title: 'REVIEW AUTOMATION',
                items: [
                  {
                    label: 'Auto-Review Configuration',
                    description: 'Configure automated review workflows and parameters',
                    icon: <SettingsIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/administration/auto-review'
                  },
                  {
                    label: 'Review Pipeline Settings',
                    description: 'Configure proposal review stages and workflow',
                    icon: <StatusIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/institution/administration/proposal-review-pipeline'
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
                  }
                ]
              }
            ]
          },
          {
            label: 'Reports & Analytics',
            categories: [
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
                    description: 'Submit to bioRxiv, medRxiv or AfricArXiv',
                    icon: <SubmitIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/publications/submit'
                  },
                  {
                    label: 'Preprint Submissions',
                    description: 'Track your preprint submissions',
                    icon: <ArticleIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/publications/preprints'
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
                    label: 'Project Proposals',
                    description: 'Manage research proposals',
                    icon: <ProposalIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/projects/proposals/list'
                  },
                  {
                    label: 'Grant Lifecycle',
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
            label: 'Ethics',
            
            categories: [
              {
                title: 'ETHICS APPLICATIONS',
                items: [
                  {
                    label: 'My Applications',
                    description: 'Manage ethics applications',
                    icon: <EthicsIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/ethics/applications'
                  },
                  {
                    label: 'Create Application',
                    description: 'Submit new ethics application',
                    icon: <CreateIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/ethics/applications/create'
                  }
                ]
              }
            ]
          },
          {
            label: 'Clinical Trials',
            
            categories: [
              {
                title: 'TRIAL GOVERNANCE',
                items: [
                  {
                    label: 'Trial Intake & Registration',
                    description: 'Register study concepts and initiate trial setup',
                    icon: <RegistrationIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/clinical-trials/intake'
                  },
                  {
                    label: 'Ethics & Regulatory Clearance',
                    description: 'Track IRB/Ethics approvals and regulatory submissions',
                    icon: <EthicsReviewIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/clinical-trials/approvals'
                  },
                  {
                    label: 'Study Team & Site Setup',
                    description: 'Manage delegation of authority and verify GCP credentials',
                    icon: <TeamIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/clinical-trials/team'
                  },
                  {
                    label: 'Master Trial File (eTMF)',
                    description: 'Store version-controlled protocols and regulatory documents',
                    icon: <DocumentIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/clinical-trials/documents'
                  }
                ]
              },
              {
                title: 'OPERATIONS & MONITORING',
                items: [
                  {
                    label: 'Trial Progress & Recruitment',
                    description: 'Track enrollment metrics and site performance benchmarks',
                    icon: <RecruitmentIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/clinical-trials/recruitment'
                  },
                  {
                    label: 'Safety & Compliance Desk',
                    description: 'Monitor SAE reporting and document protocol deviations',
                    icon: <SafetyIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/clinical-trials/safety'
                  },
                  {
                    label: 'Regulatory Reporting',
                    description: 'Export metadata to public registries like PACTR and ClinicalTrials.gov',
                    icon: <RegistryIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/clinical-trials/registry'
                  }
                ]
              },
              {
                title: 'IMPACT & INSTITUTIONAL MEMORY',
                items: [
                  {
                    label: 'Dissemination & Outputs',
                    description: 'Link trials to publications, datasets, and funding sources',
                    icon: <ResultsIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/clinical-trials/results'
                  }
                ]
              }
            ]
          },
          {
            label: 'Training',
            categories: [
              {
                title: 'AVAILABLE TRAININGS',
                items: [
                  {
                    label: 'Browse Trainings',
                    description: 'Discover and register for trainings',
                    icon: <SearchIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/training#available'
                  }
                ]
              },
              {
                title: 'MY TRAINING',
                items: [
                  {
                    label: 'My Trainings',
                    description: 'View registered trainings and progress',
                    icon: <SchoolIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/training'
                  },
                  {
                    label: 'My Certificates',
                    description: 'Download earned certificates',
                    icon: <AwardIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />,
                    path: '/researcher/training/certificates'
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

            {
              title:"Internal Grants",
              items: [
                { label: 'Internal Grant Requests',
                  description:' Intake, review workflow & approval tracker for internal funding',
                  icon:  <InternalGrantIcon sx={{ color: '#8b6cbc', fontSize: '1.1rem' }} />,
                  path: '/foundation/grants/internal-requests' },
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
                Resources
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
                  News
                </MenuItem>
                <MenuItem
                  onClick={() => { setResourcesAnchor(null); router.push('/contact'); }}
                  sx={{ fontSize: '0.95rem', py: 1.2 }}
                >
                  Contact Us
                </MenuItem>
              </Menu>

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