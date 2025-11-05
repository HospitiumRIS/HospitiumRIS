'use client';

import React, { memo, useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Typography,
  Divider,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  Collapse,
  Badge
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  Campaign as CampaignIcon,
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  ExpandLess,
  ExpandMore,
  Insights as InsightsIcon,
  MonetizationOn as MonetizationOnIcon,
  Group as GroupIcon,
  Category as CategoryIcon
} from '@mui/icons-material';

const DRAWER_WIDTH = 280;

const menuSections = [
  {
    title: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: DashboardIcon,
        active: true,
        description: 'Main analytics overview'
      },
      {
        id: 'insights',
        label: 'Key Insights',
        icon: InsightsIcon,
        badge: 'New',
        description: 'AI-powered insights'
      }
    ]
  },
  {
    title: 'Performance Analysis',
    items: [
      {
        id: 'campaigns',
        label: 'Campaign Performance',
        icon: CampaignIcon,
        description: 'Campaign analytics & ROI'
      },
      {
        id: 'categories',
        label: 'Category Analysis',
        icon: CategoryIcon,
        description: 'Performance by category'
      },
      {
        id: 'trends',
        label: 'Donation Trends',
        icon: TimelineIcon,
        description: 'Time-based analysis'
      }
    ]
  },
  {
    title: 'Donor Intelligence',
    items: [
      {
        id: 'donors',
        label: 'Donor Insights',
        icon: PeopleIcon,
        description: 'Donor behavior & segmentation'
      },
      {
        id: 'retention',
        label: 'Retention Analysis',
        icon: AssessmentIcon,
        badge: '24%',
        badgeColor: 'success',
        description: 'Donor retention metrics'
      },
      {
        id: 'segmentation',
        label: 'Donor Segmentation',
        icon: GroupIcon,
        description: 'Advanced donor grouping'
      }
    ]
  },
  {
    title: 'Financial Metrics',
    items: [
      {
        id: 'revenue',
        label: 'Revenue Analytics',
        icon: MonetizationOnIcon,
        description: 'Revenue analysis & forecasting'
      },
      {
        id: 'performance',
        label: 'Performance Metrics',
        icon: BarChartIcon,
        description: 'KPI tracking & benchmarks'
      }
    ]
  }
];

const quickActions = [
  {
    id: 'export',
    label: 'Export Report',
    icon: DownloadIcon,
    color: '#4caf50'
  },
  {
    id: 'refresh',
    label: 'Refresh Data',
    icon: RefreshIcon,
    color: '#2196f3'
  },
  {
    id: 'filters',
    label: 'Advanced Filters',
    icon: FilterIcon,
    color: '#ff9800'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    color: '#9c27b0'
  }
];

const MenuItem = memo(({ item, onSelect, isActive }) => {
  const theme = useTheme();
  
  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton
        onClick={() => onSelect(item.id)}
        sx={{
          borderRadius: 2,
          mx: 1,
          py: 1.5,
          px: 2,
          backgroundColor: isActive ? alpha('#8b6cbc', 0.12) : 'transparent',
          border: isActive ? `1px solid ${alpha('#8b6cbc', 0.2)}` : '1px solid transparent',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha('#8b6cbc', 0.08),
            transform: 'translateX(4px)',
            boxShadow: `0 4px 12px ${alpha('#8b6cbc', 0.15)}`
          }
        }}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          <item.icon 
            sx={{ 
              fontSize: 22, 
              color: isActive ? '#8b6cbc' : theme.palette.text.secondary
            }} 
          />
        </ListItemIcon>
        <ListItemText 
          primary={
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#8b6cbc' : theme.palette.text.primary,
                fontSize: '0.95rem'
              }}
            >
              {item.label}
            </Typography>
          }
          secondary={
            <Typography 
              variant="caption" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
                mt: 0.5
              }}
            >
              {item.description}
            </Typography>
          }
        />
        {item.badge && (
          <Chip
            label={item.badge}
            size="small"
            color={item.badgeColor || 'primary'}
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 600
            }}
          />
        )}
      </ListItemButton>
    </ListItem>
  );
});

const MenuSection = memo(({ section, selectedItem, onSelect }) => {
  const [expanded, setExpanded] = useState(true);
  const theme = useTheme();

  return (
    <Box sx={{ mb: 2 }}>
      <ListItem 
        disablePadding
        onClick={() => setExpanded(!expanded)}
        sx={{ cursor: 'pointer' }}
      >
        <ListItemButton sx={{ py: 1, px: 2 }}>
          <ListItemText 
            primary={
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: theme.palette.text.secondary,
                  fontSize: '0.7rem'
                }}
              >
                {section.title}
              </Typography>
            }
          />
          {expanded ? 
            <ExpandLess sx={{ fontSize: 18, color: theme.palette.text.secondary }} /> : 
            <ExpandMore sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
          }
        </ListItemButton>
      </ListItem>
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List dense>
          {section.items.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              onSelect={onSelect}
              isActive={selectedItem === item.id}
            />
          ))}
        </List>
      </Collapse>
    </Box>
  );
});

const QuickActions = memo(({ onAction }) => {
  const theme = useTheme();

  return (
    <Box sx={{ p: 2 }}>
      <Typography 
        variant="caption" 
        sx={{ 
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: theme.palette.text.secondary,
          fontSize: '0.7rem',
          mb: 2,
          display: 'block'
        }}
      >
        Quick Actions
      </Typography>
      
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {quickActions.map((action) => (
          <Tooltip key={action.id} title={action.label}>
            <IconButton
              onClick={() => onAction(action.id)}
              sx={{
                width: 40,
                height: 40,
                backgroundColor: alpha(action.color, 0.1),
                border: `1px solid ${alpha(action.color, 0.2)}`,
                '&:hover': {
                  backgroundColor: alpha(action.color, 0.2),
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <action.icon sx={{ fontSize: 18, color: action.color }} />
            </IconButton>
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
});

const AnalyticsSidebar = memo(({ 
  open = true, 
  selectedItem = 'dashboard', 
  onSelect, 
  onQuickAction,
  variant = 'permanent' 
}) => {
  const theme = useTheme();

  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: `linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)`,
        color: 'white'
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AnalyticsIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Analytics Center
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
              Donations & Performance
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Menu Sections */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
        {menuSections.map((section) => (
          <MenuSection
            key={section.title}
            section={section}
            selectedItem={selectedItem}
            onSelect={onSelect}
          />
        ))}
      </Box>

      <Divider />
      
      {/* Quick Actions */}
      <QuickActions onAction={onQuickAction} />
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          border: 'none',
          boxShadow: '4px 0 24px rgba(139, 108, 188, 0.12)',
          zIndex: theme.zIndex.drawer - 1
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
});

MenuItem.displayName = 'MenuItem';
MenuSection.displayName = 'MenuSection';
QuickActions.displayName = 'QuickActions';
AnalyticsSidebar.displayName = 'AnalyticsSidebar';

export { DRAWER_WIDTH };
export default AnalyticsSidebar;
