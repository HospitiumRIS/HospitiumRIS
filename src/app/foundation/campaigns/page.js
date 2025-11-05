'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy, memo } from 'react';
import { useThemeMode } from '../../../components/ThemeProvider';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Snackbar,
  LinearProgress,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  Tooltip,
  Fade,
  alpha,
  useTheme,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Timeline as TimelineIcon,
  Search as SearchIcon,
  Category as CategoryIcon,
  CalendarToday as CalendarIcon,
  Analytics as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon,
  VisibilityOff as VisibilityOffIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import PageHeader from '@/components/common/PageHeader';

// Lazy load components for better performance
const LazySearchFilters = lazy(() => import('./components/SearchFilters'));
const LazyCampaignDialogs = lazy(() => import('./components/CampaignDialogs'));
const LazyStatisticsCards = lazy(() => import('./components/StatisticsCards'));
const LazyCampaignCalendar = lazy(() => import('./components/CampaignCalendar'));

// Activity types and their corresponding icons
const activityTypes = [
  { value: 'Meeting', label: 'Meeting', icon: 'MeetingRoom', color: '#8b6cbc' },
  { value: 'Event', label: 'Event', icon: 'Event', color: '#4caf50' },
  { value: 'Mailing', label: 'Mailing', icon: 'Email', color: '#ff9800' },
  { value: 'Call', label: 'Phone Call', icon: 'Phone', color: '#2196f3' },
  { value: 'Presentation', label: 'Presentation', icon: 'Presentation', color: '#9c27b0' },
  { value: 'Site Visit', label: 'Site Visit', icon: 'LocationOn', color: '#795548' },
  { value: 'Follow-up', label: 'Follow-up', icon: 'FollowTheSigns', color: '#607d8b' },
  { value: 'Planning', label: 'Planning', icon: 'Schedule', color: '#e91e63' },
  { value: 'Analysis', label: 'Analysis', icon: 'Assessment', color: '#3f51b5' }
];

// Category icons mapping
// Category icons are now letter-based, generated from category name

// Debounce hook for search/filter operations
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function CampaignManagement() {
  const theme = useTheme();
  const { isClient, isHydrated } = useThemeMode();
  
  // Dashboard colors
  const DASHBOARD_COLORS = useMemo(() => ({
    primary: theme.palette.primary.main,
    primaryLight: theme.palette.primary.light,
    primaryDark: theme.palette.primary.dark,
    gradient: {
      primary: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
      background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, #e2e8f0 100%)`
    },
    shadow: {
      light: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
      medium: `0 4px 20px ${alpha(theme.palette.primary.main, 0.12)}`,
      heavy: `0 8px 32px ${alpha(theme.palette.primary.main, 0.16)}`
    }
  }), [theme.palette]);

  // State management
  const [categories, setCategories] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [activities, setActivities] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedCampaigns, setExpandedCampaigns] = useState({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Modal states
  const [calendarModal, setCalendarModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedCategoryFilter = useDebounce(categoryFilter, 200);
  const debouncedStatusFilter = useDebounce(statusFilter, 200);

  // Dialog states
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [campaignDialog, setCampaignDialog] = useState(false);
  const [activityDialog, setActivityDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#8b6cbc'
  });

  const [campaignForm, setCampaignForm] = useState({
    categoryId: '',
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    targetAmount: '',
    status: 'Planning'
  });

  const [activityForm, setActivityForm] = useState({
    campaignId: '',
    type: '',
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    attendees: '',
    status: 'Planned',
    phase: 'Pre-Campaign',
    notes: ''
  });

  // Data loading with caching and performance optimization
  const loadData = useCallback(async (useCache = true) => {
    const cacheKey = 'campaigns_data_v2';
    const cacheTimestamp = 'campaigns_data_timestamp_v2';
    
    try {
      setLoading(true);
      
      // Enhanced caching strategy
      if (typeof window !== 'undefined' && useCache) {
        const cacheAge = Date.now() - (parseInt(localStorage.getItem(cacheTimestamp)) || 0);
        if (cacheAge < 2 * 60 * 1000) { // 2 minutes cache
          try {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
              const parsedData = JSON.parse(cachedData);
              if (parsedData.categories && parsedData.campaigns && parsedData.activities) {
                setCategories(parsedData.categories);
                setCampaigns(parsedData.campaigns);
                setActivities(parsedData.activities);
                setLoading(false);
                return;
              }
            }
          } catch (cacheError) {
            console.warn('Cache parsing failed, fetching fresh data:', cacheError);
            localStorage.removeItem(cacheKey);
            localStorage.removeItem(cacheTimestamp);
          }
        }
      }
      
      // Parallel data fetching with timeout
      const timeout = 30000; // 30 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const [categoriesRes, campaignsRes, activitiesRes] = await Promise.all([
          fetch('/api/foundation/categories', { signal: controller.signal }),
          fetch('/api/foundation/campaigns', { signal: controller.signal }), 
          fetch('/api/foundation/activities', { signal: controller.signal })
        ]);

        clearTimeout(timeoutId);

        if (!categoriesRes.ok || !campaignsRes.ok || !activitiesRes.ok) {
          throw new Error('One or more API calls failed');
        }

        const [categoriesData, campaignsData, activitiesData] = await Promise.all([
          categoriesRes.json(),
          campaignsRes.json(),
          activitiesRes.json()
        ]);

        // Process and set data
        if (categoriesData.success) setCategories(categoriesData.data || []);
        if (campaignsData.success) setCampaigns(campaignsData.data || []);
        if (activitiesData.success) setActivities(activitiesData.data || []);
        
        // Enhanced caching with compression
        if (typeof window !== 'undefined') {
          try {
            const cacheData = {
              categories: categoriesData.data || [],
              campaigns: campaignsData.data || [],
              activities: activitiesData.data || [],
              version: '2.0'
            };
            const dataString = JSON.stringify(cacheData);
            if (dataString.length < 5 * 1024 * 1024) { // Max 5MB cache
              localStorage.setItem(cacheKey, dataString);
              localStorage.setItem(cacheTimestamp, Date.now().toString());
            }
          } catch (cacheError) {
            console.warn('Failed to cache data:', cacheError);
          }
        }

      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }

    } catch (error) {
      console.error('Error loading campaign data:', error);
      
      // Try to use cached data as fallback
      if (typeof window !== 'undefined') {
        try {
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            setCategories(parsedData.categories || []);
            setCampaigns(parsedData.campaigns || []);
            setActivities(parsedData.activities || []);
            setSnackbar({ 
              open: true, 
              message: 'Using cached data - some information may be outdated', 
              severity: 'warning' 
            });
            return;
          }
        } catch (cacheError) {
          console.error('Failed to use cached data:', cacheError);
        }
      }
      
      setSnackbar({ 
        open: true, 
        message: 'Failed to load campaign data. Please try refreshing.', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount with retry logic
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const loadWithRetry = async () => {
      try {
        await loadData();
        setMounted(true);
      } catch (error) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.warn(`Retrying data load (attempt ${retryCount}/${maxRetries})`);
          setTimeout(loadWithRetry, 1000 * retryCount); // Exponential backoff
        } else {
          console.error('Max retries reached for data loading');
          setLoading(false);
          setMounted(true);
        }
      }
    };

    loadWithRetry();
  }, [loadData]);

  // Optimized filtered data with memoization
  const filteredCategories = useMemo(() => {
    let filtered = categories;
    
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(category => 
        category.name.toLowerCase().includes(searchLower) ||
        (category.description && category.description.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, debouncedSearchTerm]);

  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;
    
    if (debouncedCategoryFilter) {
      filtered = filtered.filter(campaign => campaign.categoryId === debouncedCategoryFilter);
    }
    
    if (debouncedStatusFilter) {
      filtered = filtered.filter(campaign => campaign.status === debouncedStatusFilter);
    }
    
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(campaign =>
        campaign.name.toLowerCase().includes(searchLower) ||
        (campaign.description && campaign.description.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  }, [campaigns, debouncedCategoryFilter, debouncedStatusFilter, debouncedSearchTerm]);

  // Enhanced statistics with comprehensive metrics
  const statistics = useMemo(() => {
    const totalRaised = filteredCampaigns.reduce((sum, c) => sum + (Number(c.raisedAmount) || 0), 0);
    const totalTarget = filteredCampaigns.reduce((sum, c) => sum + (Number(c.targetAmount) || 0), 0);
    const completedActivities = activities.filter(a => a.status === 'Completed').length;
    
    return {
      totalCategories: filteredCategories.length,
      totalCampaigns: filteredCampaigns.length,
      activeCampaigns: filteredCampaigns.filter(c => c.status === 'Active').length,
      totalActivities: activities.length,
      completedActivities,
      totalRaised,
      totalTarget,
      totalDonors: filteredCampaigns.reduce((sum, c) => sum + (c.donorCount || 0), 0),
      averageCampaignValue: filteredCampaigns.length > 0 ? totalRaised / filteredCampaigns.length : 0,
      completionRate: activities.length > 0 ? (completedActivities / activities.length) * 100 : 0
    };
  }, [filteredCategories, filteredCampaigns, activities]);

  // Optimized utility functions with memoization
  const getStatusColor = useCallback((status) => {
    const statusColors = {
      'Active': 'success',
      'Completed': 'primary',
      'Paused': 'warning',
      'Planning': 'default',
      'Scheduled': 'info',
      'In Progress': 'warning',
      'Cancelled': 'error',
      'Planned': 'default'
    };
    return statusColors[status] || 'default';
  }, []);

  const getActivityIcon = useCallback((type) => {
    const activityType = activityTypes.find(t => t.value === type);
    const emoji = activityType ? '📋' : '📅';
    return <span>{emoji}</span>;
  }, []);

  // Category icons are now letter-based initials

  // Optimized event handlers
  const handleCategoryToggle = useCallback((categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }, []);

  const handleCampaignToggle = useCallback((campaignId) => {
    setExpandedCampaigns(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
  }, []);

  // Enhanced CRUD handlers with validation and error handling
  const handleAddCategory = useCallback(() => {
    setSelectedCategory(null);
    setCategoryForm({ name: '', description: '', icon: 'General', color: '#8b6cbc' });
    setCategoryDialog(true);
  }, []);

  const handleEditCategory = useCallback((category) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'General',
      color: category.color || '#8b6cbc'
    });
    setCategoryDialog(true);
  }, []);

  const handleAddCampaign = useCallback((categoryId) => {
    setSelectedCampaign(null);
    setCampaignForm({ 
      categoryId, 
      name: '', 
      description: '', 
      startDate: '', 
      endDate: '', 
      targetAmount: '', 
      status: 'Planning' 
    });
    setCampaignDialog(true);
  }, []);

  const handleEditCampaign = useCallback((campaign) => {
    setSelectedCampaign(campaign);
    setCampaignForm({
      categoryId: campaign.categoryId,
      name: campaign.name,
      description: campaign.description || '',
      startDate: campaign.startDate ? campaign.startDate.split('T')[0] : '',
      endDate: campaign.endDate ? campaign.endDate.split('T')[0] : '',
      targetAmount: campaign.targetAmount?.toString() || '',
      status: campaign.status
    });
    setCampaignDialog(true);
  }, []);

  const handleAddActivity = useCallback((campaignId) => {
    setSelectedActivity(null);
    setActivityForm({ 
      campaignId, 
      type: '', 
      title: '', 
      description: '', 
      date: '', 
      time: '', 
      location: '', 
      attendees: '', 
      status: 'Planned', 
      phase: 'Pre-Campaign',
      notes: '' 
    });
    setActivityDialog(true);
  }, []);

  const handleEditActivity = useCallback((activity) => {
    setSelectedActivity(activity);
    setActivityForm({
      campaignId: activity.campaignId,
      type: activity.type,
      title: activity.title,
      description: activity.description || '',
      date: activity.date ? activity.date.split('T')[0] : '',
      time: activity.time || '',
      location: activity.location || '',
      attendees: activity.attendees || '',
      status: activity.status,
      phase: activity.phase || 'Pre-Campaign',
      notes: activity.notes || ''
    });
    setActivityDialog(true);
  }, []);

  // Enhanced submit handlers with optimistic updates and rollback
  const handleCategorySubmit = useCallback(async () => {
    if (!categoryForm.name.trim()) {
      setSnackbar({ open: true, message: 'Category name is required', severity: 'error' });
      return;
    }
    
    setLoading(true);
    const optimisticCategory = {
      id: selectedCategory?.id || `temp-${Date.now()}`,
      ...categoryForm,
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim() || null,
      campaignCount: selectedCategory?.campaignCount || 0,
      createdAt: selectedCategory?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Optimistic update
    if (selectedCategory) {
      setCategories(prev => prev.map(cat => 
        cat.id === selectedCategory.id ? optimisticCategory : cat
      ));
    } else {
      setCategories(prev => [optimisticCategory, ...prev]);
    }
    
    try {
      const url = selectedCategory 
        ? `/api/foundation/categories/${selectedCategory.id}`
        : '/api/foundation/categories';

      const response = await fetch(url, {
        method: selectedCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      });

      const result = await response.json();

      if (result.success) {
        setCategoryDialog(false);
        // Replace optimistic update with real data
        if (selectedCategory) {
          setCategories(prev => prev.map(cat => 
            cat.id === selectedCategory.id ? result.data : cat
          ));
        } else {
          setCategories(prev => prev.map(cat => 
            cat.id === optimisticCategory.id ? result.data : cat
          ));
        }
        setSnackbar({ 
          open: true, 
          message: `Category ${selectedCategory ? 'updated' : 'created'} successfully!`, 
          severity: 'success' 
        });
        
        // Clear cache
        if (typeof window !== 'undefined') {
          localStorage.removeItem('campaigns_data_v2');
          localStorage.removeItem('campaigns_data_timestamp_v2');
        }
      } else {
        throw new Error(result.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      
      // Rollback optimistic update
      if (selectedCategory) {
        setCategories(prev => prev.map(cat => 
          cat.id === selectedCategory.id ? selectedCategory : cat
        ));
      } else {
        setCategories(prev => prev.filter(cat => cat.id !== optimisticCategory.id));
      }
      
      setSnackbar({ 
        open: true, 
        message: error.message || 'Failed to save category', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }, [categoryForm, selectedCategory]);

  const handleCampaignSubmit = useCallback(async () => {
    if (!campaignForm.name.trim() || !campaignForm.categoryId) {
      setSnackbar({ 
        open: true, 
        message: 'Campaign name and category are required', 
        severity: 'error' 
      });
      return;
    }
    
    // Date validation
    if (campaignForm.startDate && campaignForm.endDate && 
        new Date(campaignForm.startDate) >= new Date(campaignForm.endDate)) {
      setSnackbar({ 
        open: true, 
        message: 'Start date must be before end date', 
        severity: 'error' 
      });
      return;
    }

    setLoading(true);
    const optimisticCampaign = {
      id: selectedCampaign?.id || `temp-${Date.now()}`,
      ...campaignForm,
      name: campaignForm.name.trim(),
      description: campaignForm.description.trim() || null,
      targetAmount: campaignForm.targetAmount ? parseFloat(campaignForm.targetAmount) : null,
      raisedAmount: selectedCampaign?.raisedAmount || 0,
      donorCount: selectedCampaign?.donorCount || 0,
      donationCount: selectedCampaign?.donationCount || 0,
      createdAt: selectedCampaign?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: categories.find(c => c.id === campaignForm.categoryId)
    };

    // Optimistic update
    if (selectedCampaign) {
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === selectedCampaign.id ? optimisticCampaign : campaign
      ));
    } else {
      setCampaigns(prev => [optimisticCampaign, ...prev]);
    }
    
    try {
      const url = selectedCampaign 
        ? `/api/foundation/campaigns/${selectedCampaign.id}`
        : '/api/foundation/campaigns';

      const response = await fetch(url, {
        method: selectedCampaign ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignForm)
      });

      const result = await response.json();

      if (result.success) {
        setCampaignDialog(false);
        // Replace optimistic update with real data
        if (selectedCampaign) {
          setCampaigns(prev => prev.map(campaign => 
            campaign.id === selectedCampaign.id ? result.data : campaign
          ));
        } else {
          setCampaigns(prev => prev.map(campaign => 
            campaign.id === optimisticCampaign.id ? result.data : campaign
          ));
        }
        setSnackbar({ 
          open: true, 
          message: `Campaign ${selectedCampaign ? 'updated' : 'created'} successfully!`, 
          severity: 'success' 
        });
        
        // Clear cache
        if (typeof window !== 'undefined') {
          localStorage.removeItem('campaigns_data_v2');
          localStorage.removeItem('campaigns_data_timestamp_v2');
        }
      } else {
        throw new Error(result.error || 'Failed to save campaign');
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      
      // Rollback optimistic update
      if (selectedCampaign) {
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === selectedCampaign.id ? selectedCampaign : campaign
        ));
      } else {
        setCampaigns(prev => prev.filter(campaign => campaign.id !== optimisticCampaign.id));
      }
      
      setSnackbar({ 
        open: true, 
        message: error.message || 'Failed to save campaign', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }, [campaignForm, selectedCampaign, categories]);

  const handleActivitySubmit = useCallback(async () => {
    if (!activityForm.title.trim() || !activityForm.type || !activityForm.campaignId || !activityForm.date) {
      setSnackbar({ 
        open: true, 
        message: 'Title, type, campaign, and date are required', 
        severity: 'error' 
      });
      return;
    }
    
    setLoading(true);
    const optimisticActivity = {
      id: selectedActivity?.id || `temp-${Date.now()}`,
      ...activityForm,
      title: activityForm.title.trim(),
      description: activityForm.description.trim() || null,
      location: activityForm.location.trim() || null,
      attendees: activityForm.attendees.trim() || null,
      notes: activityForm.notes.trim() || null,
      createdAt: selectedActivity?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      campaign: campaigns.find(c => c.id === activityForm.campaignId)
    };

    // Optimistic update
    if (selectedActivity) {
      setActivities(prev => prev.map(activity => 
        activity.id === selectedActivity.id ? optimisticActivity : activity
      ));
    } else {
      setActivities(prev => [optimisticActivity, ...prev]);
    }
    
    try {
      const url = selectedActivity 
        ? `/api/foundation/activities/${selectedActivity.id}`
        : '/api/foundation/activities';

      const response = await fetch(url, {
        method: selectedActivity ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityForm)
      });

      const result = await response.json();

      if (result.success) {
        setActivityDialog(false);
        // Replace optimistic update with real data
        if (selectedActivity) {
          setActivities(prev => prev.map(activity => 
            activity.id === selectedActivity.id ? result.data : activity
          ));
        } else {
          setActivities(prev => prev.map(activity => 
            activity.id === optimisticActivity.id ? result.data : activity
          ));
        }
        setSnackbar({ 
          open: true, 
          message: `Activity ${selectedActivity ? 'updated' : 'created'} successfully!`, 
          severity: 'success' 
        });
        
        // Clear cache
        if (typeof window !== 'undefined') {
          localStorage.removeItem('campaigns_data_v2');
          localStorage.removeItem('campaigns_data_timestamp_v2');
        }
      } else {
        throw new Error(result.error || 'Failed to save activity');
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      
      // Rollback optimistic update
      if (selectedActivity) {
        setActivities(prev => prev.map(activity => 
          activity.id === selectedActivity.id ? selectedActivity : activity
        ));
      } else {
        setActivities(prev => prev.filter(activity => activity.id !== optimisticActivity.id));
      }
      
      setSnackbar({ 
        open: true, 
        message: error.message || 'Failed to save activity', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }, [activityForm, selectedActivity, campaigns]);

  // Activity List Component
  const ActivityList = memo(({ activities, phase, color, DASHBOARD_COLORS, getActivityIcon, getStatusColor }) => (
    <Card sx={{ 
      borderRadius: 3,
      overflow: 'hidden',
      background: 'linear-gradient(145deg, #ffffff 0%, #fafbfc 100%)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: `1px solid ${alpha(color, 0.15)}`,
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`,
      }
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2.5, 
        pb: 1.5,
        background: `linear-gradient(135deg, ${alpha(color, 0.05)} 0%, ${alpha(color, 0.02)} 100%)`,
        borderBottom: `1px solid ${alpha(color, 0.1)}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${alpha(color, 0.3)}`
          }}>
            <Typography variant="caption" sx={{ 
              color: 'white', 
              fontWeight: 700, 
              fontSize: '0.6rem',
              letterSpacing: '0.5px'
            }}>
              ACTIVITIES
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              color: '#2c3e50',
              fontSize: '1rem',
              lineHeight: 1.2
            }}>
              {phase} Activities
            </Typography>
            <Typography variant="caption" sx={{ 
              color: 'text.secondary',
              fontWeight: 500
            }}>
              {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
            </Typography>
          </Box>
          <Chip 
            label={activities.length}
            size="small" 
            sx={{ 
              backgroundColor: color,
              color: 'white',
              fontWeight: 600,
              minWidth: 32,
              height: 24
            }}
          />
        </Box>
      </Box>
      
      {/* Content */}
      <Box sx={{ p: 0 }}>
        {activities.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4,
            px: 3,
            background: `linear-gradient(135deg, ${alpha(color, 0.02)} 0%, transparent 100%)`,
          }}>
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: alpha(color, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              border: `2px dashed ${alpha(color, 0.3)}`
            }}>
              <Typography sx={{ fontSize: '1.5rem', opacity: 0.5 }}>📋</Typography>
            </Box>
            <Typography variant="body2" sx={{ 
              color: 'text.secondary', 
              fontWeight: 500,
              mb: 0.5
            }}>
              No {phase.toLowerCase()} activities
            </Typography>
            <Typography variant="caption" sx={{ 
              color: 'text.disabled',
              fontSize: '0.75rem'
            }}>
              Activities will appear here once created
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 0 }}>
            {activities.map((activity, index) => (
              <Box
                key={activity.id}
                sx={{
                  p: 2.5,
                  borderBottom: index < activities.length - 1 ? `1px solid ${alpha('#000', 0.06)}` : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: alpha(color, 0.04),
                    transform: 'translateX(4px)',
                    '&::before': {
                      opacity: 1,
                    }
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: '60%',
                    backgroundColor: color,
                    borderRadius: '0 2px 2px 0',
                    opacity: 0,
                    transition: 'opacity 0.2s ease'
                  }
                }}
                onClick={() => handleEditActivity(activity)}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  {/* Activity Icon */}
                  <Box sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2.5,
                    background: `linear-gradient(135deg, ${alpha(color, 0.15)} 0%, ${alpha(color, 0.08)} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${alpha(color, 0.2)}`,
                    flexShrink: 0
                  }}>
                    {getActivityIcon(activity.type)}
                  </Box>

                  {/* Activity Details */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 600, 
                        color: '#2c3e50',
                        fontSize: '0.9rem',
                        lineHeight: 1.3
                      }}>
                        {activity.title}
                      </Typography>
                      <Chip 
                        label={activity.status}
                        size="small"
                        sx={{ 
                          fontSize: '0.7rem', 
                          height: 22,
                          fontWeight: 600,
                          backgroundColor: getStatusColor(activity.status) === 'success' ? '#e8f5e8' : 
                                          getStatusColor(activity.status) === 'warning' ? '#fff3e0' :
                                          getStatusColor(activity.status) === 'error' ? '#ffebee' : '#e3f2fd',
                          color: getStatusColor(activity.status) === 'success' ? '#2e7d32' : 
                                 getStatusColor(activity.status) === 'warning' ? '#f57c00' :
                                 getStatusColor(activity.status) === 'error' ? '#d32f2f' : '#1976d2',
                          border: `1px solid ${getStatusColor(activity.status) === 'success' ? '#c8e6c9' : 
                                                getStatusColor(activity.status) === 'warning' ? '#ffcc02' :
                                                getStatusColor(activity.status) === 'error' ? '#ffcdd2' : '#bbdefb'}`
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: alpha(color, 0.6)
                        }} />
                        <Typography variant="caption" sx={{ 
                          fontSize: '0.75rem', 
                          color: 'text.secondary',
                          fontWeight: 500
                        }}>
                          {activity.type}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: alpha('#666', 0.4)
                        }} />
                        <Typography variant="caption" sx={{ 
                          fontSize: '0.75rem', 
                          color: 'text.secondary',
                          fontWeight: 500
                        }}>
                          {new Date(activity.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: '2-digit'
                          })}
                        </Typography>
                      </Box>
                    </Box>

                    {activity.description && (
                      <Typography variant="caption" sx={{ 
                        color: 'text.disabled',
                        fontSize: '0.75rem',
                        display: 'block',
                        mt: 0.5,
                        lineHeight: 1.4
                      }}>
                        {activity.description.length > 80 
                          ? `${activity.description.substring(0, 80)}...` 
                          : activity.description
                        }
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Card>
  ));

  // Campaign Card Component
  const CampaignCard = memo(({ 
    campaign, 
    activities, 
    isExpanded, 
    onToggle, 
    onEdit, 
    onAddActivity, 
    DASHBOARD_COLORS, 
    getStatusColor, 
    getActivityIcon
  }) => {
    const preActivities = useMemo(() => 
      activities.filter(a => a.phase === 'Pre-Campaign'), [activities]
    );
    const postActivities = useMemo(() => 
      activities.filter(a => a.phase === 'Post-Campaign'), [activities]
    );

    return (
      <Card
        sx={{
          mb: 3,
          mx: 3,
          borderRadius: 3,
          background: isExpanded 
            ? 'linear-gradient(145deg, #ffffff 0%, #fafbfd 100%)'
            : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: isExpanded 
            ? '0 8px 24px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)'
            : '0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
          border: `1px solid ${alpha(DASHBOARD_COLORS.primary, 0.12)}`,
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'visible',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            background: `linear-gradient(180deg, ${DASHBOARD_COLORS.primary} 0%, ${alpha(DASHBOARD_COLORS.primary, 0.6)} 100%)`,
            borderRadius: '0 12px 12px 0'
          },
          '&:hover': {
            boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
            transform: 'translateY(-1px)'
          }
        }}
      >
        <Accordion
          expanded={Boolean(isExpanded)}
          onChange={onToggle}
          sx={{ 
            boxShadow: 'none',
            background: 'transparent',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary
            expandIcon={
              <Box sx={{
                background: `linear-gradient(135deg, ${alpha(DASHBOARD_COLORS.primary, 0.1)} 0%, ${alpha(DASHBOARD_COLORS.primary, 0.2)} 100%)`,
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: DASHBOARD_COLORS.primary,
                transition: 'all 0.3s ease',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                border: `1px solid ${alpha(DASHBOARD_COLORS.primary, 0.3)}`
              }}>
                <ExpandMoreIcon sx={{ fontSize: 18 }} />
              </Box>
            }
            sx={{ 
              px: 4,
              py: 3,
              minHeight: 80,
              backgroundColor: 'transparent',
              '&:hover': { 
                backgroundColor: alpha(DASHBOARD_COLORS.primary, 0.02)
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
              <Tooltip title={`${campaign.name} campaign`} arrow>
                <Avatar sx={{ 
                  background: `linear-gradient(135deg, ${alpha(DASHBOARD_COLORS.primary, 0.9)} 0%, ${DASHBOARD_COLORS.primary} 100%)`,
                  width: 48,
                  height: 48,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  border: `3px solid white`,
                  boxShadow: `0 4px 12px ${alpha(DASHBOARD_COLORS.primary, 0.25)}`
                }}>
                  {campaign.name.charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700, 
                  color: '#1e293b', 
                  mb: 0.5,
                  fontSize: '1.1rem',
                  letterSpacing: '-0.3px'
                }}>
                  {campaign.name}
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontSize: '0.9rem', 
                  color: '#64748b',
                  lineHeight: 1.4,
                  mb: 1
                }}>
                  {campaign.description || 'No description provided'}
                </Typography>
                
                {/* Enhanced Funding Progress */}
                {campaign.targetAmount && Number(campaign.targetAmount) > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.primary' }}>
                        Funding Progress
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        color: (campaign.raisedAmount || 0) > 0 ? 'success.main' : 'text.secondary'
                      }}>
                        {Math.round(((campaign.raisedAmount || 0) / Number(campaign.targetAmount)) * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(((campaign.raisedAmount || 0) / Number(campaign.targetAmount)) * 100, 100)}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: alpha('#e0e0e0', 0.3),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: (campaign.raisedAmount || 0) > 0 ? '#4caf50' : '#e0e0e0',
                          borderRadius: 4,
                          transition: 'all 0.3s ease'
                        }
                      }} 
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'success.main', fontWeight: 600 }}>
                        ${(campaign.raisedAmount || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        ${Number(campaign.targetAmount).toLocaleString()} goal
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Campaign dates */}
                {(campaign.startDate || campaign.endDate) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <CalendarIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {campaign.startDate && campaign.endDate ? (
                        `${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()}`
                      ) : campaign.startDate ? (
                        `Starts: ${new Date(campaign.startDate).toLocaleDateString()}`
                      ) : (
                        `Ends: ${new Date(campaign.endDate).toLocaleDateString()}`
                      )}
                    </Typography>
                  </Box>
                )}

                {/* Activity progress */}
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  {activities.length > 0 && (
                    <Tooltip title={`Activity Progress: ${activities.filter(a => a.status === 'Completed').length}/${activities.length} completed`} arrow>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimelineIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {Math.round((activities.filter(a => a.status === 'Completed').length / activities.length) * 100)}% activities complete
                        </Typography>
                      </Box>
                    </Tooltip>
                  )}
                  
                  {(campaign.donorCount || 0) > 0 && (
                    <Tooltip title={`${campaign.donorCount} donors have contributed`} arrow>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PeopleIcon sx={{ fontSize: 12, color: '#2196f3' }} />
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#2196f3', fontWeight: 600 }}>
                          {campaign.donorCount} donor{campaign.donorCount !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </Tooltip>
                  )}

                  {(campaign.donationCount || 0) > 0 && (
                    <Tooltip title={`${campaign.donationCount} donations received`} arrow>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <MoneyIcon sx={{ fontSize: 12, color: '#4caf50' }} />
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#4caf50', fontWeight: 600 }}>
                          {campaign.donationCount} donation{campaign.donationCount !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
              
              <Stack direction="row" spacing={2} alignItems="center">
                <Tooltip title={`Status: ${campaign.status}`} arrow>
                  <Chip 
                    label={campaign.status}
                    color={getStatusColor(campaign.status)}
                    size="medium"
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: '0.75rem', 
                      height: 32,
                      px: 1.5,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                </Tooltip>
                <Tooltip title={`${activities.length} activities tracked`} arrow>
                  <Chip 
                    label={`${activities.length} activities`}
                    size="small"
                    variant="outlined"
                    icon={<TimelineIcon sx={{ fontSize: 14 }} />}
                    sx={{ fontSize: '0.7rem', height: 24 }}
                  />
                </Tooltip>
                
                <Tooltip title="Edit campaign details" arrow>
                  <Box
                    component="div"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(campaign);
                    }}
                    sx={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      color: DASHBOARD_COLORS.primary,
                      background: `linear-gradient(135deg, ${alpha(DASHBOARD_COLORS.primary, 0.08)} 0%, ${alpha(DASHBOARD_COLORS.primary, 0.12)} 100%)`,
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: `1px solid ${alpha(DASHBOARD_COLORS.primary, 0.2)}`,
                      '&:hover': { 
                        background: `linear-gradient(135deg, ${DASHBOARD_COLORS.primary} 0%, ${alpha(DASHBOARD_COLORS.primary, 0.8)} 100%)`,
                        color: 'white',
                        transform: 'translateY(-2px) scale(1.1)',
                        boxShadow: `0 6px 16px ${alpha(DASHBOARD_COLORS.primary, 0.3)}`
                      }
                    }}
                  >
                    <EditIcon sx={{ fontSize: 18 }} />
                  </Box>
                </Tooltip>
                
                <Tooltip title="Add new activity" arrow>
                  <Box
                    component="div"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddActivity(campaign.id);
                    }}
                    sx={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      color: '#10b981',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.12) 100%)',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      '&:hover': { 
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        transform: 'translateY(-2px) scale(1.1)',
                        boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)'
                      }
                    }}
                  >
                    <AddIcon sx={{ fontSize: 18 }} />
                  </Box>
                </Tooltip>
              </Stack>
            </Stack>
          </AccordionSummary>
          
          <AccordionDetails sx={{ 
            p: 0, 
            background: 'linear-gradient(145deg, #fafbfc 0%, #f1f5f9 100%)',
            borderTop: '1px solid rgba(0,0,0,0.05)'
          }}>
            {activities.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, px: 4 }}>
                <Box sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${alpha(DASHBOARD_COLORS.primary, 0.1)} 0%, ${alpha(DASHBOARD_COLORS.primary, 0.2)} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  border: `2px solid ${alpha(DASHBOARD_COLORS.primary, 0.2)}`
                }}>
                  <TimelineIcon sx={{ 
                    fontSize: 28, 
                    color: DASHBOARD_COLORS.primary,
                    opacity: 0.7 
                  }} />
                </Box>
                <Typography variant="h6" sx={{ 
                  color: '#475569',
                  mb: 1,
                  fontWeight: 600,
                  fontSize: '1rem'
                }}>
                  Track Activities & Progress
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  mb: 3, 
                  maxWidth: 280, 
                  mx: 'auto',
                  lineHeight: 1.5
                }}>
                  Start tracking campaign activities to monitor progress and success.
                </Typography>
                <Box
                  component="div"
                  onClick={() => onAddActivity(campaign.id)}
                  sx={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                    px: 3,
                    py: 1.8,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${DASHBOARD_COLORS.primary} 0%, ${alpha(DASHBOARD_COLORS.primary, 0.8)} 100%)`,
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    boxShadow: `0 4px 12px ${alpha(DASHBOARD_COLORS.primary, 0.3)}`,
                    '&:hover': { 
                      transform: 'translateY(-2px) scale(1.05)',
                      boxShadow: `0 6px 20px ${alpha(DASHBOARD_COLORS.primary, 0.4)}`,
                      background: `linear-gradient(135deg, ${alpha(DASHBOARD_COLORS.primary, 0.9)} 0%, ${DASHBOARD_COLORS.primary} 100%)`
                    }
                  }}
                >
                  <AddIcon sx={{ fontSize: 20 }} />
                  <Typography variant="button" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Add First Activity
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ p: 4 }}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 3,
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: 'stretch'
                }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <ActivityList
                      activities={preActivities}
                      phase="Pre-Campaign"
                      color="#e91e63"
                      DASHBOARD_COLORS={DASHBOARD_COLORS}
                      getActivityIcon={getActivityIcon}
                      getStatusColor={getStatusColor}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <ActivityList
                      activities={postActivities}
                      phase="Post-Campaign"
                      color="#3f51b5"
                      DASHBOARD_COLORS={DASHBOARD_COLORS}
                      getActivityIcon={getActivityIcon}
                      getStatusColor={getStatusColor}
                    />
                  </Box>
                </Box>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Card>
    );
  });

  // Skeleton loading component
  const CategorySkeleton = memo(() => (
    <Box sx={{ p: 2 }}>
      {[1, 2, 3].map((index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Skeleton variant="circular" width={48} height={48} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="40%" height={28} />
                <Skeleton variant="text" width="70%" height={20} />
              </Box>
              <Skeleton variant="rectangular" width={80} height={24} />
            </Stack>
          </Box>
        </Card>
      ))}
    </Box>
  ));

  // Show loading skeleton during hydration
  if (!isHydrated || !isClient) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            backgroundColor: '#e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            📊
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: '600', marginBottom: '4px' }}>
              Campaign Manager
            </div>
            <div style={{ fontSize: '16px', color: '#666' }}>
              Create and manage fundraising campaigns with activities tracking
            </div>
          </div>
        </div>
        <div style={{ 
          padding: '32px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '8px',
          textAlign: 'center' 
        }}>
          <div style={{ marginBottom: '16px' }}>Loading campaigns...</div>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #e0e0e0',
            borderTop: '4px solid #8b6cbc',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      </Container>
    );
  }

  return (
    <>
      {/* Page Header */}
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Campaign Manager"
          description="Create and manage fundraising campaigns with activities tracking"
          icon={<CampaignIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Campaigns' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          actionButton={
            <Stack direction="row" spacing={2} alignItems="center">
              <Tooltip title="Open Calendar View" arrow>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CalendarIcon />}
                  onClick={() => setCalendarModal(true)}
                  sx={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    fontSize: '0.75rem',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.25)',
                    },
                  }}
                >
                  Calendar
                </Button>
              </Tooltip>

              <Tooltip title={showFilters ? "Hide Filters" : "Show Filters"} arrow>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={showFilters ? <VisibilityOffIcon /> : <FilterListIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    fontSize: '0.75rem',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.25)',
                    },
                  }}
                >
                  Filters
                </Button>
              </Tooltip>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddCategory}
                sx={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                New Category
              </Button>
            </Stack>
          }
        />
      </Box>

      {/* Main content */}
      <Container maxWidth="xl" sx={{ py: 4, minHeight: '50vh' }}>
    

        {/* Calendar Modal */}
        <Dialog
          open={calendarModal}
          onClose={() => setCalendarModal(false)}
          maxWidth="xl"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              minHeight: '80vh',
              maxHeight: '90vh'
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)',
            color: 'white',
            p: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarIcon />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Campaign Calendar
              </Typography>
            </Box>
            <IconButton 
              onClick={() => setCalendarModal(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
            <Suspense fallback={
              <Box sx={{ 
                height: '600px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <CircularProgress />
              </Box>
            }>
              <LazyCampaignCalendar
                campaigns={filteredCampaigns}
                activities={activities}
                loading={loading}
                onSelectCampaign={(campaign) => console.log('Select campaign:', campaign)}
                height={600}
                DASHBOARD_COLORS={DASHBOARD_COLORS}
                hideHeader={true}
              />
            </Suspense>
          </DialogContent>
        </Dialog>

        {/* Search and Filters - Collapsible */}
        <Collapse 
          in={showFilters} 
          timeout={{ enter: 400, exit: 300 }}
          easing={{
            enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
            exit: 'cubic-bezier(0.4, 0, 0.6, 1)'
          }}
        >
          <Box sx={{ mb: 3, overflow: 'hidden' }}>
            <Suspense fallback={<Skeleton height={200} />}>
              <LazySearchFilters
                categories={categories}
                loading={loading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                loadData={loadData}
              />
            </Suspense>
          </Box>
        </Collapse>

        {/* Categories and Campaigns */}
        <Card sx={{ 
          borderRadius: 4, 
          overflow: 'visible',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          border: '1px solid rgba(139, 108, 188, 0.08)'
        }}>
          <Box sx={{ 
            p: 4, 
            background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background pattern overlay */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                               radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)`,
              pointerEvents: 'none'
            }} />
            
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
              <Box>
                <Typography variant="h5" sx={{ 
                  fontWeight: 700, 
                  mb: 1,
                  letterSpacing: '-0.5px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  Campaign Categories & Initiatives
                </Typography>
                <Typography variant="body2" sx={{ 
                  opacity: 0.9, 
                  fontSize: '0.95rem',
                  fontWeight: 400
                }}>
                  Organize and track your fundraising efforts with comprehensive campaign management
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ 
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  p: 2,
                  minWidth: 80,
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 800, 
                    lineHeight: 1,
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    {statistics.totalCategories}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 600, 
                    fontSize: '0.7rem',
                    opacity: 0.9
                  }}>
                    CATEGORIES
                  </Typography>
                </Box>
                <Box sx={{ 
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  p: 2,
                  minWidth: 80,
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 800, 
                    lineHeight: 1,
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    {statistics.totalCampaigns}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 600, 
                    fontSize: '0.7rem',
                    opacity: 0.9
                  }}>
                    CAMPAIGNS
                  </Typography>
                </Box>
                <Box sx={{ 
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  p: 2,
                  minWidth: 80,
                  border: '2px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 800, 
                    lineHeight: 1,
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    {statistics.activeCampaigns}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 600, 
                    fontSize: '0.7rem',
                    opacity: 0.9
                  }}>
                    ACTIVE
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>

          {!mounted || loading ? (
            <CategorySkeleton />
          ) : filteredCategories.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CategoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {categories.length === 0 ? 'No categories found' : 'No matching categories'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {categories.length === 0 
                  ? 'Create your first campaign category to get started.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </Typography>
              {categories.length === 0 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddCategory}
                  sx={{
                    background: DASHBOARD_COLORS.gradient.primary,
                    boxShadow: DASHBOARD_COLORS.shadow.medium,
                    '&:hover': {
                      boxShadow: DASHBOARD_COLORS.shadow.heavy,
                    }
                  }}
                >
                  Create First Category
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ p: 4 }}>
              {filteredCategories.map((category) => {
                const categoryCampaigns = filteredCampaigns.filter(c => c.categoryId === category.id);
                const isExpanded = Boolean(expandedCategories[category.id]);

                return (
                  <Card 
                    key={category.id}
                    sx={{
                      mb: 4, 
                      borderRadius: 4,
                      background: isExpanded 
                        ? 'linear-gradient(145deg, #ffffff 0%, #fafbfd 100%)'
                        : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                      boxShadow: isExpanded 
                        ? '0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)'
                        : '0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
                      border: `1px solid ${alpha(category.color || DASHBOARD_COLORS.primary, 0.12)}`,
                      overflow: 'visible',
                      position: 'relative',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isExpanded ? 'translateY(-2px)' : 'translateY(0)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: `linear-gradient(90deg, ${category.color || DASHBOARD_COLORS.primary} 0%, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.6)} 100%)`,
                        borderRadius: '16px 16px 0 0'
                      }
                    }}
                  >
                    <Accordion 
                      expanded={isExpanded}
                      onChange={() => handleCategoryToggle(category.id)}
                      TransitionProps={{
                        timeout: { enter: 400, exit: 300 },
                        easing: {
                          enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
                          exit: 'cubic-bezier(0.4, 0, 0.6, 1)'
                        }
                      }}
                      sx={{
                        boxShadow: 'none',
                        background: 'transparent',
                        overflow: 'hidden',
                        '&:before': { display: 'none' },
                        '& .MuiAccordionSummary-root': {
                          borderRadius: '16px 16px 0 0',
                          minHeight: 'auto',
                          '&.Mui-expanded': {
                            minHeight: 'auto'
                          }
                        },
                        '& .MuiAccordionDetails-root': {
                          overflow: 'hidden'
                        }
                      }}
                    >
                      <AccordionSummary
                        expandIcon={
                          <Box sx={{
                            background: `linear-gradient(135deg, ${category.color || DASHBOARD_COLORS.primary} 0%, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.8)} 100%)`,
                            borderRadius: '50%',
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            transition: 'all 0.3s ease',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            boxShadow: `0 2px 8px ${alpha(category.color || DASHBOARD_COLORS.primary, 0.3)}`
                          }}>
                            <ExpandMoreIcon sx={{ fontSize: 22 }} />
                          </Box>
                        }
                        sx={{ 
                          background: `linear-gradient(135deg, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.03)} 0%, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.08)} 100%)`,
                          borderRadius: isExpanded ? '12px 12px 0 0' : '12px',
                          minHeight: 88,
                          px: 4,
                          py: 3,
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `linear-gradient(135deg, transparent 0%, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.02)} 100%)`,
                            pointerEvents: 'none'
                          },
                          '&:hover': { 
                            background: `linear-gradient(135deg, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.08)} 0%, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.12)} 100%)`
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={3} sx={{ width: '100%' }}>
                          <Tooltip title={`${category.name} category`} arrow>
                            <Box sx={{ position: 'relative' }}>
                              <Avatar sx={{ 
                                background: `linear-gradient(135deg, ${category.color || DASHBOARD_COLORS.primary} 0%, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.8)} 100%)`,
                                width: 64,
                                height: 64,
                                fontSize: '1.4rem',
                                fontWeight: 700,
                                border: `4px solid white`,
                                boxShadow: `0 8px 24px ${alpha(category.color || DASHBOARD_COLORS.primary, 0.3)}, 0 4px 8px rgba(0,0,0,0.1)`,
                                position: 'relative',
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: -2,
                                  left: -2,
                                  right: -2,
                                  bottom: -2,
                                  background: `linear-gradient(135deg, ${category.color || DASHBOARD_COLORS.primary} 0%, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.6)} 100%)`,
                                  borderRadius: '50%',
                                  zIndex: -1,
                                  opacity: 0.3
                                }
                              }}>
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                                  {category.name ? category.name.charAt(0).toUpperCase() : 'C'}
                                </Typography>
                              </Avatar>
                              <Chip 
                                label="CATEGORY"
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: -6,
                                  right: -10,
                                  fontSize: '0.6rem',
                                  fontWeight: 800,
                                  height: 20,
                                  background: `linear-gradient(135deg, ${category.color || DASHBOARD_COLORS.primary} 0%, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.8)} 100%)`,
                                  color: 'white',
                                  boxShadow: `0 2px 8px ${alpha(category.color || DASHBOARD_COLORS.primary, 0.4)}`,
                                  border: '2px solid white',
                                  '& .MuiChip-label': { px: 1.2 }
                                }}
                              />
                            </Box>
                          </Tooltip>
                          
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" sx={{ 
                              fontWeight: 800, 
                              color: '#1a1a1a',
                              mb: 1,
                              letterSpacing: '-0.8px',
                              lineHeight: 1.2
                            }}>
                              {category.name}
                            </Typography>
                            <Typography variant="body1" sx={{ 
                              fontSize: '1rem',
                              color: '#64748b',
                              lineHeight: 1.5,
                              fontWeight: 400
                            }}>
                              {category.description || 'No description provided'}
                            </Typography>
                          </Box>
                          
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Tooltip title={`${categoryCampaigns.length} campaigns in this category`} arrow>
                              <Chip 
                                label={`${categoryCampaigns.length} campaigns`}
                                size="medium"
                                variant="filled"
                                icon={<CampaignIcon sx={{ fontSize: '1rem' }} />}
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                  height: 36,
                                  px: 2,
                                  background: `linear-gradient(135deg, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.1)} 0%, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.2)} 100%)`,
                                  color: category.color || DASHBOARD_COLORS.primary,
                                  border: `2px solid ${alpha(category.color || DASHBOARD_COLORS.primary, 0.3)}`,
                                  '&:hover': {
                                    background: `linear-gradient(135deg, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.2)} 0%, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.3)} 100%)`,
                                    transform: 'translateY(-1px)',
                                    boxShadow: `0 4px 12px ${alpha(category.color || DASHBOARD_COLORS.primary, 0.25)}`
                                  }
                                }}
                              />
                            </Tooltip>
                            
                            <Tooltip title="Edit category details" arrow>
                              <Box
                                component="div"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditCategory(category);
                                }}
                                sx={{ 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 44,
                                  height: 44,
                                  borderRadius: '12px',
                                  color: category.color || DASHBOARD_COLORS.primary,
                                  background: `linear-gradient(135deg, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.1)} 0%, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.15)} 100%)`,
                                  cursor: 'pointer',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  border: `2px solid ${alpha(category.color || DASHBOARD_COLORS.primary, 0.2)}`,
                                  '&:hover': {
                                    background: `linear-gradient(135deg, ${category.color || DASHBOARD_COLORS.primary} 0%, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.8)} 100%)`,
                                    color: 'white',
                                    transform: 'translateY(-2px) scale(1.05)',
                                    boxShadow: `0 8px 24px ${alpha(category.color || DASHBOARD_COLORS.primary, 0.3)}`,
                                    borderColor: category.color || DASHBOARD_COLORS.primary
                                  }
                                }}
                              >
                                <EditIcon sx={{ fontSize: 20 }} />
                              </Box>
                            </Tooltip>
                            
                            <Tooltip title="Add new campaign to this category" arrow>
                              <Box
                                component="div"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddCampaign(category.id);
                                }}
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 44,
                                  height: 44,
                                  borderRadius: '12px',
                                  color: '#10b981',
                                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.15) 100%)',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  border: '2px solid rgba(16, 185, 129, 0.2)',
                                  '&:hover': { 
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    transform: 'translateY(-2px) scale(1.05)',
                                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                                    borderColor: '#10b981'
                                  }
                                }}
                              >
                                <AddIcon sx={{ fontSize: 20 }} />
                              </Box>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </AccordionSummary>
                      
                      <AccordionDetails sx={{ p: 0, background: 'linear-gradient(145deg, #fafbfc 0%, #f1f5f9 100%)' }}>
                        {categoryCampaigns.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 6, px: 4 }}>
                            <Box sx={{
                              width: 80,
                              height: 80,
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.1)} 0%, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.2)} 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 24px',
                              border: `3px solid ${alpha(category.color || DASHBOARD_COLORS.primary, 0.2)}`
                            }}>
                              <CampaignIcon sx={{ 
                                fontSize: 36, 
                                color: category.color || DASHBOARD_COLORS.primary,
                                opacity: 0.7
                              }} />
                            </Box>
                            <Typography variant="h6" sx={{ 
                              color: '#475569',
                              mb: 1,
                              fontWeight: 600
                            }}>
                              Ready to Launch Campaigns
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 300, mx: 'auto' }}>
                              This category is ready for action. Create your first campaign to start organizing fundraising activities.
                            </Typography>
                            <Box
                              component="div"
                              onClick={() => handleAddCampaign(category.id)}
                              sx={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1.5,
                                px: 4,
                                py: 2,
                                borderRadius: 3,
                                background: `linear-gradient(135deg, ${category.color || DASHBOARD_COLORS.primary} 0%, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.8)} 100%)`,
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                boxShadow: `0 4px 16px ${alpha(category.color || DASHBOARD_COLORS.primary, 0.3)}`,
                                border: 'none',
                                '&:hover': {
                                  transform: 'translateY(-2px) scale(1.05)',
                                  boxShadow: `0 8px 24px ${alpha(category.color || DASHBOARD_COLORS.primary, 0.4)}`,
                                  background: `linear-gradient(135deg, ${alpha(category.color || DASHBOARD_COLORS.primary, 0.9)} 0%, ${category.color || DASHBOARD_COLORS.primary} 100%)`
                                }
                              }}
                            >
                              <AddIcon sx={{ fontSize: 22 }} />
                              <Typography variant="button" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                Create First Campaign
                              </Typography>
                            </Box>
                          </Box>
                        ) : (
                          categoryCampaigns.map((campaign) => {
                            const campaignActivities = activities.filter(a => a.campaignId === campaign.id);
                            const isCampaignExpanded = Boolean(expandedCampaigns[campaign.id]);

                            return (
                              <CampaignCard
                                key={campaign.id}
                                campaign={campaign}
                                activities={campaignActivities}
                                isExpanded={isCampaignExpanded}
                                onToggle={() => handleCampaignToggle(campaign.id)}
                                onEdit={handleEditCampaign}
                                onAddActivity={handleAddActivity}
                                DASHBOARD_COLORS={DASHBOARD_COLORS}
                                getStatusColor={getStatusColor}
                                getActivityIcon={getActivityIcon}
                              />
                            );
                          })
                        )}
                      </AccordionDetails>
                    </Accordion>
                  </Card>
                );
              })}
            </Box>
          )}
        </Card>

        {/* Lazy-loaded Dialogs */}
        <Suspense fallback={<CircularProgress />}>
          <LazyCampaignDialogs
            categoryDialog={categoryDialog}
            setCategoryDialog={setCategoryDialog}
            campaignDialog={campaignDialog}
            setCampaignDialog={setCampaignDialog}
            activityDialog={activityDialog}
            setActivityDialog={setActivityDialog}
            selectedCategory={selectedCategory}
            selectedCampaign={selectedCampaign}
            selectedActivity={selectedActivity}
            categoryForm={categoryForm}
            setCategoryForm={setCategoryForm}
            campaignForm={campaignForm}
            setCampaignForm={setCampaignForm}
            activityForm={activityForm}
            setActivityForm={setActivityForm}
            categories={categories}
            campaigns={campaigns}
            activityTypes={activityTypes}
            loading={loading}
            DASHBOARD_COLORS={DASHBOARD_COLORS}
            handleCategorySubmit={handleCategorySubmit}
            handleCampaignSubmit={handleCampaignSubmit}
            handleActivitySubmit={handleActivitySubmit}
          />
        </Suspense>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}
