'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy, memo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  Alert,
  Snackbar,
  Stack,
  Divider,
  Tab,
  Tabs,
  InputAdornment,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  alpha,
  useTheme,
  FormControlLabel,
  Switch,
  Autocomplete,
  TablePagination,
  TableSortLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Foundation as FoundationIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Home as HomeIcon,
  Savings as FundraisingIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Analytics as AnalyticsIcon,
  CardGiftcard as DonationIcon,
  CorporateFare as CorporateIcon,
  AccountBalance as GovernmentIcon,
  VisibilityOff as AnonymousIcon,
  MoreVert as MoreVertIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  Campaign as CampaignIcon,
  Category as CategoryIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  PictureAsPdf as PdfIcon,
  GetApp as DownloadIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  DateRange as DateRangeIcon,
  TableChart as TableChartIcon,
  Info as InfoIcon,
  Help as HelpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  Lightbulb as LightbulbIcon,
  Speed as SpeedIcon,
  Launch as LaunchIcon,
  FilterList as FilterListIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';

// Lazy load dialogs for better performance
const LazyDialogs = lazy(() => import('./components/DonationDialogs'));

// Constants
const DONOR_TYPES = ['INDIVIDUAL', 'CORPORATE', 'FOUNDATION', 'GOVERNMENT', 'ANONYMOUS'];
const DONATION_TYPES = ['ONE_TIME', 'PLEDGE', 'IN_KIND'];
const PAYMENT_METHODS = ['CREDIT_CARD', 'BANK_TRANSFER', 'CHECK', 'CASH', 'ONLINE', 'WIRE_TRANSFER', 'PAYPAL', 'MPESA'];
const DONATION_STATUS = ['PENDING', 'COMPLETED'];

// Utility functions
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getDonorTypeIcon = (donorType) => {
  const iconMap = {
    individual: <PersonIcon />,
    corporate: <CorporateIcon />,
    foundation: <FoundationIcon />,
    government: <GovernmentIcon />,
    anonymous: <AnonymousIcon />,
  };
  return iconMap[donorType?.toLowerCase()] || <PersonIcon />;
};

const getStatusColor = (status) => {
  if (!status || typeof status !== 'string') return 'default';

  switch (status) {
    case 'Active': return 'success';
    case 'Completed': return 'primary';
    case 'Paused': return 'warning';
    case 'Planned': return 'default';
    case 'Scheduled': return 'info';
    case 'In Progress': return 'warning';
    case 'Cancelled': return 'error';
    default: return 'default';
  }
};

const getDonationStatusColor = (status) => {
  if (!status || typeof status !== 'string') return 'default';

  switch (status) {
    case 'PENDING': return 'warning';
    case 'COMPLETED': return 'success';
    default: return 'default';
  }
};

// Skeleton components for loading states
const CampaignsSkeleton = memo(() => (
  <Box sx={{ mb: 4 }}>
    {[1, 2, 3, 4].map((index) => (
      <Card key={index} sx={{ mb: 2, borderRadius: 3 }}>
        <Box sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Skeleton variant="circular" width={56} height={56} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="40%" height={32} />
              <Skeleton variant="text" width="70%" height={24} />
              <Skeleton variant="text" width="50%" height={20} />
            </Box>
            <Skeleton variant="rectangular" width={120} height={32} />
          </Stack>
        </Box>
      </Card>
    ))}
  </Box>
));

const StatsSkeleton = memo(() => (
  <Grid container spacing={3} sx={{ mb: 4 }}>
    {[1, 2, 3, 4, 5].map((index) => (
      <Grid item xs={12} sm={6} md={2.4} key={index}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
            <Skeleton variant="text" width="40%" height={32} sx={{ mx: 'auto', mb: 0.5 }} />
            <Skeleton variant="text" width="60%" height={20} sx={{ mx: 'auto', mb: 0.25 }} />
            <Skeleton variant="text" width="50%" height={16} sx={{ mx: 'auto' }} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
));

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

export default function DonationManagement() {
  const theme = useTheme();
  const router = useRouter();

  // Dashboard colors matching the main dashboard theme
  const DASHBOARD_COLORS = useMemo(() => ({
    primary: theme.palette.primary.main,
    primaryLight: theme.palette.primary.light,
    primaryDark: theme.palette.primary.dark,
    gradient: {
      primary: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
      background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, #e2e8f0 100%)`
    }
  }), [theme.palette]);

  // State management
  const [categories, setCategories] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [donorTypeFilter, setDonorTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Accordion states
  const [expandedCampaigns, setExpandedCampaigns] = useState({});

  // Dialog states
  const [donationDialog, setDonationDialog] = useState(false);
  const [donorDialog, setDonorDialog] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [selectedReportItem, setSelectedReportItem] = useState(null);
  const [reportType, setReportType] = useState('campaign');

  // Form states
  const [donationForm, setDonationForm] = useState({
    donorName: '',
    donorEmail: '',
    donorPhone: '',
    donorAddress: '',
    donorType: 'INDIVIDUAL',
    amount: '',
    currency: 'USD',
    donationType: 'ONE_TIME',
    paymentMethod: 'CREDIT_CARD',
    transactionId: '',
    campaignId: '',
    status: 'PENDING',
    donationDate: new Date().toISOString().split('T')[0],
    isAnonymous: false,
    notes: ''
  });

  // Loading state for donation saving
  const [savingDonation, setSavingDonation] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedCategoryFilter = useDebounce(categoryFilter, 200);
  const debouncedStatusFilter = useDebounce(statusFilter, 200);
  const debouncedDonorTypeFilter = useDebounce(donorTypeFilter, 200);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [categoriesRes, campaignsRes, donationsRes] = await Promise.all([
        fetch('/api/foundation/categories'),
        fetch('/api/foundation/campaigns'),
        fetch('/api/foundation/donations')
      ]);

      const [categoriesData, campaignsData, donationsData] = await Promise.all([
        categoriesRes.json(),
        campaignsRes.json(),
        donationsRes.json()
      ]);

      if (categoriesData.success) setCategories(categoriesData.data || []);
      if (campaignsData.success) setCampaigns(campaignsData.data || []);
      if (donationsData) {
        console.log('Donations API response:', donationsData);
        // Handle different API response formats
        if (Array.isArray(donationsData)) {
          setDonations(donationsData);
        } else if (donationsData.success && Array.isArray(donationsData.donations)) {
          console.log('Setting donations:', donationsData.donations);
          setDonations(donationsData.donations); // Fixed: use 'donations' field instead of 'data'
        } else if (donationsData.success && Array.isArray(donationsData.data)) {
          setDonations(donationsData.data);
        } else {
          console.warn('Unexpected donations API response format:', donationsData);
          setDonations([]);
        }
      } else {
        console.warn('No donations data received');
        setDonations([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Ensure arrays are set even on error to prevent runtime errors
      setCategories([]);
      setCampaigns([]);
      setDonations([]);
      setSnackbar({
        open: true,
        message: 'Failed to load data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate statistics
  const stats = useMemo(() => {
    // Ensure both arrays exist
    const donationsArray = Array.isArray(donations) ? donations : [];
    const campaignsArray = Array.isArray(campaigns) ? campaigns : [];
    const categoriesArray = Array.isArray(categories) ? categories : [];

    const totalDonations = donationsArray.length;
    const totalAmount = donationsArray.reduce((sum, d) => sum + (d.amount || 0), 0);
    const completedDonations = donationsArray.filter(d => d.status === 'COMPLETED');
    const completedAmount = completedDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const pendingDonations = donationsArray.filter(d => d.status === 'PENDING');
    const averageDonation = totalDonations > 0 ? totalAmount / totalDonations : 0;

    // Get unique donors
    const uniqueDonors = new Set();
    donationsArray.forEach(donation => {
      if (!donation.isAnonymous && donation.donorEmail) {
        uniqueDonors.add(donation.donorEmail);
      } else if (!donation.isAnonymous && donation.donorName) {
        uniqueDonors.add(donation.donorName);
      } else if (donation.isAnonymous) {
        uniqueDonors.add(`anonymous_${donation.id}`);
      }
    });

    return {
      totalCategories: categoriesArray.length,
      totalInitiatives: campaignsArray.length,
      totalDonations,
      totalAmount,
      uniqueDonors: uniqueDonors.size,
      completedDonations: completedDonations.length,
      completedAmount,
      pendingDonations: pendingDonations.length,
      averageDonation
    };
  }, [donations, campaigns, categories]);

  // Filter donations
  const filteredCampaigns = useMemo(() => {
    const campaignsArray = Array.isArray(campaigns) ? campaigns : [];
    let filtered = [...campaignsArray];

    if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
      filtered = filtered.filter(campaign => {
        const searchLower = debouncedSearchTerm.toLowerCase();
        return campaign.name?.toLowerCase().includes(searchLower) ||
          campaign.description?.toLowerCase().includes(searchLower);
      });
    }

    if (debouncedCategoryFilter && debouncedCategoryFilter.trim()) {
      filtered = filtered.filter(campaign => campaign.categoryId === debouncedCategoryFilter);
    }

    if (debouncedStatusFilter && debouncedStatusFilter.trim()) {
      filtered = filtered.filter(campaign => campaign.status === debouncedStatusFilter);
    }

    return filtered;
  }, [campaigns, debouncedSearchTerm, debouncedCategoryFilter, debouncedStatusFilter]);

  const filteredDonations = useMemo(() => {
    // Ensure both donations and campaigns are arrays to prevent runtime errors
    const donationsArray = Array.isArray(donations) ? donations : [];
    let filtered = [...donationsArray]; // Create a copy to avoid mutations

    if (debouncedDonorTypeFilter && debouncedDonorTypeFilter.trim()) {
      filtered = filtered.filter(donation => donation.donorType === debouncedDonorTypeFilter);
    }

    // Ensure filtered is still an array before sorting
    if (!Array.isArray(filtered)) {
      filtered = [];
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.donationDate);
      const dateB = new Date(b.donationDate);
      return dateB - dateA;
    });
  }, [donations, debouncedDonorTypeFilter]);

  const getCampaignName = useCallback((campaignId) => {
    const campaignsArray = Array.isArray(campaigns) ? campaigns : [];
    const campaign = campaignsArray.find(c => c.id === campaignId);
    return campaign?.name || 'Unknown Campaign';
  }, [campaigns]);

  // Accordion toggle handler
  const handleCampaignToggle = useCallback((campaignId) => {
    setExpandedCampaigns(prev => ({
      ...prev,
      [campaignId]: prev.hasOwnProperty(campaignId) ? !prev[campaignId] : true
    }));
  }, []);

  // Donation CRUD handlers
  const handleAddDonation = useCallback((campaignId = '') => {
    setSelectedDonation(null);
    setDonationForm({
      donorName: '',
      donorEmail: '',
      donorPhone: '',
      donorAddress: '',
      donorType: 'INDIVIDUAL',
      amount: '',
      currency: 'USD',
      donationType: 'ONE_TIME',
      paymentMethod: 'CREDIT_CARD',
      transactionId: '',
      campaignId,
      status: 'PENDING',
      donationDate: new Date().toISOString().split('T')[0],
      isAnonymous: false,
      notes: ''
    });
    setDonationDialog(true);
  }, []);

  const handleEditDonation = useCallback((donation) => {
    setSelectedDonation(donation);
    setDonationForm({
      donorName: donation.donorName || '',
      donorEmail: donation.donorEmail || '',
      donorPhone: donation.donorPhone || '',
      donorAddress: donation.donorAddress || '',
      donorType: donation.donorType || 'INDIVIDUAL',
      amount: donation.amount || '',
      currency: donation.currency || 'USD',
      donationType: donation.donationType || 'ONE_TIME',
      paymentMethod: donation.paymentMethod || 'CREDIT_CARD',
      transactionId: donation.transactionId || '',
      campaignId: donation.campaignId || '',
      status: donation.status || 'PENDING',
      donationDate: donation.donationDate ? donation.donationDate.split('T')[0] : new Date().toISOString().split('T')[0],
      isAnonymous: donation.isAnonymous || false,
      notes: donation.notes || ''
    });
    setDonationDialog(true);
  }, []);

  // Save donation handler
  const handleSaveDonation = useCallback(async () => {
    try {
      setSavingDonation(true);

      // Validate required fields
      if (!donationForm.donorName || !donationForm.amount || !donationForm.donorType) {
        setSnackbar({
          open: true,
          message: 'Please fill in all required fields (Donor Name, Amount, Donor Type)',
          severity: 'error'
        });
        return;
      }

      // Validate amount is positive
      if (parseFloat(donationForm.amount) <= 0) {
        setSnackbar({
          open: true,
          message: 'Donation amount must be greater than 0',
          severity: 'error'
        });
        return;
      }

      // Validate email format if provided
      if (donationForm.donorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donationForm.donorEmail)) {
        setSnackbar({
          open: true,
          message: 'Please enter a valid email address',
          severity: 'error'
        });
        return;
      }

      // Prepare donation data
      const donationData = {
        campaignId: donationForm.campaignId || null,
        donorName: donationForm.donorName,
        donorEmail: donationForm.donorEmail,
        donorPhone: donationForm.donorPhone,
        donorType: donationForm.donorType,
        amount: parseFloat(donationForm.amount),
        donationDate: new Date(donationForm.donationDate).toISOString(),
        paymentMethod: donationForm.paymentMethod,
        transactionId: donationForm.transactionId,
        status: donationForm.status,
        message: donationForm.notes, // Map 'notes' to 'message' for backend
        isAnonymous: donationForm.isAnonymous,
        taxDeductible: true // Default to true
      };

      console.log('Sending donation data:', donationData);
      console.log('Campaign ID being sent:', donationData.campaignId);

      let response;

      if (selectedDonation) {
        // Update existing donation
        response = await fetch(`/api/foundation/donations/${selectedDonation.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(donationData),
        });
      } else {
        // Create new donation
        response = await fetch('/api/foundation/donations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(donationData),
        });
      }

      console.log('API Response status:', response.status);
      console.log('API Response headers:', response.headers);

      const result = await response.json();
      console.log('API Response result:', result);

      if (response.ok) {
        setSnackbar({
          open: true,
          message: selectedDonation ? 'Donation updated successfully!' : 'Donation recorded successfully!',
          severity: 'success'
        });

        // Close dialog and refresh data
        setDonationDialog(false);
        setSelectedDonation(null);

        // Refresh the donations data
        await loadData();

      } else {
        throw new Error(result.error || 'Failed to save donation');
      }

    } catch (error) {
      console.error('Error saving donation:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save donation. Please try again.',
        severity: 'error'
      });
    } finally {
      setSavingDonation(false);
    }
  }, [donationForm, selectedDonation, loadData]);

  const handleViewDonation = useCallback((donation) => {
    setSelectedDonation(donation);
    setDonorDialog(true);
  }, []);

  // Remove the mounted check to prevent hydration issues
  // The loading state will handle the initial render

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {/* Full-width PageHeader */}
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', mt: 8, mb: 4 }} >
        <PageHeader
          title="Donation Management"
          description="Track donations by campaign initiatives and manage donor relationships"
          icon={<PeopleIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Fundraising', path: '/foundation/fundraising' },
            { label: 'Donors', path: '/foundation/fundraising/donors' },
            { label: 'Donation Management' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          actionButton={
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<AssessmentIcon />}
                onClick={() => router.push('/foundation/donations-analytics')}
                sx={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.25)',
                  },
                }}
              >
                Donations Analytics
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleAddDonation('')}
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
                Record Donation
              </Button>
            </Stack>
          }
        />
      </Box>

      {/* Main content within container */}
      <Container maxWidth="xl" sx={{ py: 4 }}>

        {/* Statistics Cards */}
        {loading ? (
          <StatsSkeleton />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, justifyContent: 'space-between', mb:2 }}>
            <Box sx={{ width: '25%' }}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #8b6cbc 0%, #a389cc 100%)' }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <CategoryIcon sx={{ fontSize: 24, color: 'white', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                    {stats.totalCategories || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                    Categories
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    campaign categories
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ width: '25%' }}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)' }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <CampaignIcon sx={{ fontSize: 24, color: 'white', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                    {stats.totalInitiatives || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                    Initiatives
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    fundraising initiatives
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ width: '25%' }}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)' }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <ReceiptIcon sx={{ fontSize: 24, color: 'white', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                    {stats.totalDonations || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                    Total Donations
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    donation records
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ width: '25%' }}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)' }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <TrendingUpIcon sx={{ fontSize: 24, color: 'white', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                    {formatCurrency(stats.totalAmount || 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                    Total Raised
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    funds raised
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ width: '25%' }}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)' }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <PeopleIcon sx={{ fontSize: 24, color: 'white', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                    {stats.uniqueDonors || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                    Unique Donors
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    individual donors
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {/* Search and Filters */}
        <Card sx={{ mb: 4, borderRadius: 3, background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SearchIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                Search & Filter
              </Typography>
              <Tooltip title="Filter campaigns and donations to find specific data" arrow>
                <InfoIcon sx={{ color: '#8b6cbc', fontSize: 16, cursor: 'help' }} />
              </Tooltip>
            </Box>

            {/* Filter Controls */}
            <Box sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              {/* Search Input */}
              <TextField
                placeholder="Search initiatives and donations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{
                  flex: '1 1 300px',
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white',
                    '&:hover fieldset': { borderColor: '#8b6cbc' },
                    '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#8b6cbc' }} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Category Filter */}
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'white',
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8b6cbc' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8b6cbc' }
                  }}
                  MenuProps={{
                    disableScrollLock: true,
                    PaperProps: {
                      sx: { maxHeight: 200 }
                    }
                  }}
                >
                  <MenuItem value="">Category</MenuItem>
                  {categories.filter(category => category && category.id).map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{
                          bgcolor: category.color || '#8b6cbc',
                          width: 20,
                          height: 20,
                          fontSize: '0.7rem'
                        }}>
                          {(category.name || 'Category').charAt(0).toUpperCase()}
                        </Avatar>
                        {category.name || 'Unnamed Category'}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Status Filter */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'white',
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8b6cbc' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8b6cbc' }
                  }}
                  MenuProps={{
                    disableScrollLock: true,
                    PaperProps: {
                      sx: { maxHeight: 200 }
                    }
                  }}
                >
                  <MenuItem value="">Status</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Planning">Planning</MenuItem>
                  <MenuItem value="Paused">Paused</MenuItem>
                </Select>
              </FormControl>

              {/* Donor Type Filter */}
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={donorTypeFilter}
                  onChange={(e) => setDonorTypeFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'white',
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8b6cbc' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8b6cbc' }
                  }}
                  MenuProps={{
                    disableScrollLock: true,
                    PaperProps: {
                      sx: { maxHeight: 200 }
                    }
                  }}
                >
                  <MenuItem value="">Donor Type</MenuItem>
                  <MenuItem value="INDIVIDUAL">Individual</MenuItem>
                  <MenuItem value="CORPORATE">Corporate</MenuItem>
                  <MenuItem value="FOUNDATION">Foundation</MenuItem>
                  <MenuItem value="GOVERNMENT">Government</MenuItem>
                  <MenuItem value="ANONYMOUS">Anonymous</MenuItem>
                </Select>
              </FormControl>

              {/* Reset Button */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                  setStatusFilter('');
                  setDonorTypeFilter('');
                }}
                sx={{
                  borderRadius: 2,
                  borderColor: '#8b6cbc',
                  color: '#8b6cbc',
                  '&:hover': {
                    borderColor: '#7a5aa8',
                    backgroundColor: 'rgba(139, 108, 188, 0.04)'
                  }
                }}
              >
                Reset
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Campaign Cards */}
        {loading ? (
          <CampaignsSkeleton />
        ) : (
          <Box>
            {filteredCampaigns.length === 0 ? (
              <Card sx={{ textAlign: 'center', py: 8, borderRadius: 3 }}>
                <CampaignIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No campaigns found
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  {searchTerm || statusFilter
                    ? 'Try adjusting your search filters'
                    : 'Start by creating your first campaign'
                  }
                </Typography>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredCampaigns.filter(campaign => campaign && campaign.id).map((campaign) => {
                  const campaignDonations = donations.filter(d => d && d.campaignId === campaign.id);
                  console.log(`Campaign ${campaign.name} (${campaign.id}):`, {
                    totalDonations: donations.length,
                    campaignDonations: campaignDonations.length,
                    campaignDonationsData: campaignDonations
                  });
                  const totalRaised = campaignDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
                  const uniqueDonorsForCampaign = new Set();
                  campaignDonations.forEach(donation => {
                    if (!donation.isAnonymous && donation.donorEmail) {
                      uniqueDonorsForCampaign.add(donation.donorEmail);
                    } else if (!donation.isAnonymous && donation.donorName) {
                      uniqueDonorsForCampaign.add(donation.donorName);
                    } else if (donation.isAnonymous) {
                      uniqueDonorsForCampaign.add(`anonymous_${donation.id}`);
                    }
                  });
                  const categoryName = categories.find(c => c && c.id === campaign.categoryId)?.name || '';
                  const isExpanded = expandedCampaigns.hasOwnProperty(campaign.id) ? expandedCampaigns[campaign.id] : false;

                  return (
                    <Accordion
                      key={campaign.id}
                      expanded={Boolean(isExpanded)}
                      onChange={() => handleCampaignToggle(campaign.id)}
                      sx={{
                        mb: 2,
                        borderRadius: 3,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        border: `2px solid ${alpha('#8b6cbc', 0.2)}`,
                        '&:before': { display: 'none' },
                        overflow: 'hidden',
                        '&.Mui-expanded': {
                          margin: '0 0 16px 0',
                        }
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ fontSize: 28, color: '#8b6cbc' }} />}
                        sx={{
                          backgroundColor: alpha('#8b6cbc', 0.06),
                          borderRadius: Boolean(isExpanded) ? '12px 12px 0 0' : 3,
                          minHeight: 90,
                          px: 3,
                          py: 2.5,
                          '&:hover': {
                            backgroundColor: alpha('#8b6cbc', 0.12),
                            transform: 'translateY(-1px)',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.12)'
                          },
                          transition: 'all 0.3s ease',
                          border: `1px solid ${alpha('#8b6cbc', 0.1)}`
                        }}
                      >
                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          alignItems={{ xs: 'flex-start', md: 'center' }}
                          spacing={{ xs: 2, md: 3 }}
                          sx={{ width: '100%' }}
                        >
                          {/* Avatar and Title Section */}
                          <Stack direction="row" alignItems="center" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
                            <Box sx={{ position: 'relative', flexShrink: 0 }}>
                              <Avatar sx={{
                                bgcolor: '#8b6cbc',
                                width: { xs: 56, md: 64 },
                                height: { xs: 56, md: 64 },
                                fontSize: '1.4rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                border: '3px solid white',
                                fontWeight: 700
                              }}>
                                {(campaign.name || 'Campaign').charAt(0).toUpperCase()}
                              </Avatar>
                              <Chip
                                label="INITIA..."
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: -6,
                                  right: -6,
                                  fontSize: '0.55rem',
                                  fontWeight: 700,
                                  height: 20,
                                  backgroundColor: '#8b6cbc',
                                  color: 'white',
                                  '& .MuiChip-label': { px: 0.75 },
                                  display: { xs: 'none', sm: 'flex' }
                                }}
                              />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="h5" sx={{
                                fontWeight: 700,
                                color: '#1a1a1a',
                                mb: 0.5,
                                letterSpacing: '-0.5px',
                                lineHeight: 1.2,
                                fontSize: '1.5rem'
                              }}>
                                {campaign.name || 'Unnamed Campaign'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{
                                fontSize: '0.9rem',
                                opacity: 0.85,
                                mb: 1,
                                lineHeight: 1.3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: { xs: 'none', sm: 'block' }
                              }}>
                                {campaign.description || 'No description provided'}
                              </Typography>
                              {categoryName && (
                                <Chip
                                  label={categoryName || 'Category'}
                                  size="small"
                                  sx={{
                                    backgroundColor: alpha('#8b6cbc', 0.12),
                                    color: '#8b6cbc',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    height: 24
                                  }}
                                />
                              )}
                            </Box>
                          </Stack>

                          {/* Statistics and Actions Section */}
                          <Stack
                            direction={{ xs: 'row', md: 'row' }}
                            spacing={{ xs: 1.5, md: 3 }}
                            alignItems="center"
                            sx={{
                              flexShrink: 0,
                              width: { xs: '100%', md: 'auto' },
                              justifyContent: { xs: 'space-between', md: 'flex-end' },
                              flexWrap: { xs: 'wrap', md: 'nowrap' }
                            }}
                          >
                            <Box sx={{ textAlign: 'center', minWidth: { xs: 70, md: 80 } }}>
                              <Typography variant="h5" sx={{
                                fontWeight: 700,
                                color: 'success.main',
                                lineHeight: 1.2,
                                mb: 0.25,
                                fontSize: '1.5rem'
                              }}>
                                {formatCurrency(totalRaised || 0)}
                              </Typography>
                              <Typography variant="caption" sx={{
                                color: 'text.secondary',
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Total Raised
                              </Typography>
                            </Box>

                            <Box sx={{ textAlign: 'center', minWidth: { xs: 50, md: 60 } }}>
                              <Typography variant="h5" sx={{
                                fontWeight: 700,
                                color: 'primary.main',
                                lineHeight: 1.2,
                                mb: 0.25,
                                fontSize: '1.5rem'
                              }}>
                                {campaignDonations.length || 0}
                              </Typography>
                              <Typography variant="caption" sx={{
                                color: 'text.secondary',
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Donations
                              </Typography>
                            </Box>

                            <Box sx={{ textAlign: 'center', minWidth: { xs: 45, md: 50 } }}>
                              <Typography variant="h5" sx={{
                                fontWeight: 700,
                                color: '#ff9800',
                                lineHeight: 1.2,
                                mb: 0.25,
                                fontSize: '1.5rem'
                              }}>
                                {uniqueDonorsForCampaign.size || 0}
                              </Typography>
                              <Typography variant="caption" sx={{
                                color: 'text.secondary',
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Donors
                              </Typography>
                            </Box>

                            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                              <Chip
                                label={campaign.status || 'Active'}
                                color={getStatusColor(campaign.status || 'Active')}
                                size="medium"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  height: 32,
                                  minWidth: 80
                                }}
                              />

                              <Box
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle menu actions here
                                }}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  color: '#9c27b0',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    backgroundColor: alpha('#9c27b0', 0.1)
                                  }
                                }}
                              >
                                <MoreVertIcon fontSize="medium" />
                              </Box>
                            </Stack>
                          </Stack>
                        </Stack>
                      </AccordionSummary>

                      <AccordionDetails sx={{ p: 0 }}>
                        <Box sx={{
                          p: { xs: 2, md: 3 },
                          backgroundColor: alpha('#f8f9fa', 0.8),
                          borderTop: `1px solid ${alpha('#8b6cbc', 0.1)}`
                        }}>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between"
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                            spacing={2}
                            sx={{ mb: 3 }}
                          >
                            <Box>
                              <Typography variant="h6" sx={{
                                fontWeight: 700,
                                color: '#2c3e50',
                                mb: 0.5
                              }}>
                                Donations for {campaign.name || 'Campaign'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                                {campaignDonations.length} donation{campaignDonations.length !== 1 ? 's' : ''} •
                                {uniqueDonorsForCampaign.size} unique donor{uniqueDonorsForCampaign.size !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                            <Button
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={() => handleAddDonation(campaign.id)}
                              sx={{
                                background: 'linear-gradient(135deg, #8b6cbc 0%, #a389cc 100%)',
                                boxShadow: '0 4px 20px rgba(139, 108, 188, 0.3)',
                                borderRadius: 2,
                                minWidth: { xs: '100%', sm: 'auto' },
                                py: 1.5,
                                px: 3,
                                fontWeight: 600,
                                '&:hover': {
                                  boxShadow: '0 8px 32px rgba(139, 108, 188, 0.4)',
                                  transform: 'translateY(-1px)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              Add Donation
                            </Button>
                          </Stack>

                          {campaignDonations.length === 0 ? (
                            <Box sx={{
                              textAlign: 'center',
                              py: 6,
                              backgroundColor: 'white',
                              borderRadius: 2,
                              border: '1px solid #e0e0e0'
                            }}>
                              <DonationIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                              <Typography variant="h6" color="text.secondary" gutterBottom>
                                No Donations Yet
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Start tracking donations for this campaign
                              </Typography>
                              <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleAddDonation(campaign.id)}
                                sx={{
                                  background: 'linear-gradient(135deg, #8b6cbc 0%, #a389cc 100%)',
                                  boxShadow: '0 4px 20px rgba(139, 108, 188, 0.3)',
                                  borderRadius: 2,
                                  '&:hover': {
                                    boxShadow: '0 8px 32px rgba(139, 108, 188, 0.4)',
                                  }
                                }}
                              >
                                Add First Donation
                              </Button>
                            </Box>
                          ) : (
                            <TableContainer
                              component={Paper}
                              sx={{
                                borderRadius: 3,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                border: '1px solid rgba(0,0,0,0.06)',
                                overflow: 'hidden',
                                overflowX: 'auto'
                              }}
                            >
                              <Table sx={{ minWidth: { xs: 650, md: 750 } }}>
                                <TableHead>
                                  <TableRow sx={{
                                    backgroundColor: alpha('#8b6cbc', 0.08),
                                    '& .MuiTableCell-head': {
                                      borderBottom: `2px solid ${alpha('#8b6cbc', 0.1)}`,
                                      py: 2
                                    }
                                  }}>
                                    <TableCell sx={{
                                      fontWeight: 700,
                                      color: '#8b6cbc',
                                      fontSize: '0.9rem',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px'
                                    }}>
                                      Donor
                                    </TableCell>
                                    <TableCell sx={{
                                      fontWeight: 700,
                                      color: '#8b6cbc',
                                      fontSize: '0.9rem',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px'
                                    }}>
                                      Amount
                                    </TableCell>
                                    <TableCell sx={{
                                      fontWeight: 700,
                                      color: '#8b6cbc',
                                      fontSize: '0.9rem',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px'
                                    }}>
                                      Type
                                    </TableCell>
                                    <TableCell sx={{
                                      fontWeight: 700,
                                      color: '#8b6cbc',
                                      fontSize: '0.9rem',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px'
                                    }}>
                                      Payment Method
                                    </TableCell>
                                    <TableCell sx={{
                                      fontWeight: 700,
                                      color: '#8b6cbc',
                                      fontSize: '0.9rem',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px'
                                    }}>
                                      Date
                                    </TableCell>
                                    <TableCell sx={{
                                      fontWeight: 700,
                                      color: '#8b6cbc',
                                      fontSize: '0.9rem',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px'
                                    }}>
                                      Status
                                    </TableCell>
                                    <TableCell align="center" sx={{
                                      fontWeight: 700,
                                      color: '#8b6cbc',
                                      fontSize: '0.9rem',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px'
                                    }}>
                                      Actions
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {campaignDonations.filter(donation => donation && donation.id).map((donation, index) => (
                                    <TableRow
                                      key={donation.id}
                                      hover
                                      sx={{
                                        '&:hover': {
                                          backgroundColor: alpha('#8b6cbc', 0.03),
                                          transform: 'translateY(-1px)',
                                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                        },
                                        '& .MuiTableCell-root': {
                                          borderBottom: `1px solid ${alpha('#8b6cbc', 0.08)}`,
                                          py: 2
                                        },
                                        backgroundColor: index % 2 === 0 ? 'transparent' : alpha('#f5f5f5', 0.3),
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                          <Avatar sx={{
                                            backgroundColor: alpha('#8b6cbc', 0.12),
                                            color: '#8b6cbc',
                                            width: 40,
                                            height: 40,
                                            fontSize: '1rem',
                                            fontWeight: 600
                                          }}>
                                            {getDonorTypeIcon(donation.donorType || 'INDIVIDUAL')}
                                          </Avatar>
                                          <Box>
                                            <Typography variant="subtitle2" sx={{
                                              fontWeight: 600,
                                              color: '#1a1a1a',
                                              lineHeight: 1.3
                                            }}>
                                              {donation.isAnonymous ? 'Anonymous Donor' : (donation.donorName || 'Unknown Donor')}
                                            </Typography>
                                            <Typography variant="body2" sx={{
                                              color: 'text.secondary',
                                              fontSize: '0.85rem'
                                            }}>
                                              {donation.donorEmail || 'No email'}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="h6" sx={{
                                          fontWeight: 700,
                                          color: 'success.main',
                                          fontSize: '1.1rem'
                                        }}>
                                          {formatCurrency(donation.amount || 0, donation.currency || 'USD')}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={donation.donationType || 'ONE_TIME'}
                                          size="small"
                                          variant="outlined"
                                          sx={{
                                            borderColor: alpha('#8b6cbc', 0.3),
                                            color: '#8b6cbc',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            backgroundColor: alpha('#8b6cbc', 0.05)
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2" sx={{
                                          fontWeight: 500,
                                          color: '#2c3e50'
                                        }}>
                                          {donation.paymentMethod || 'N/A'}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2" sx={{
                                          fontWeight: 500,
                                          color: '#2c3e50'
                                        }}>
                                          {donation.donationDate ? dayjs(donation.donationDate).format('MMM DD, YYYY') : 'N/A'}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={donation.status || 'PENDING'}
                                          size="small"
                                          color={getDonationStatusColor(donation.status || 'PENDING')}
                                          sx={{
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            fontSize: '0.7rem',
                                            letterSpacing: '0.5px'
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                          <Tooltip title="View donation details" arrow>
                                            <IconButton
                                              size="small"
                                              onClick={() => handleViewDonation(donation)}
                                              sx={{
                                                color: '#8b6cbc',
                                                '&:hover': {
                                                  backgroundColor: alpha('#8b6cbc', 0.1),
                                                  transform: 'scale(1.1)'
                                                }
                                              }}
                                            >
                                              <ViewIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Edit donation" arrow>
                                            <IconButton
                                              size="small"
                                              onClick={() => handleEditDonation(donation)}
                                              sx={{
                                                color: '#4caf50',
                                                '&:hover': {
                                                  backgroundColor: alpha('#4caf50', 0.1),
                                                  transform: 'scale(1.1)'
                                                }
                                              }}
                                            >
                                              <EditIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        </Stack>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        {/* Lazy-loaded Dialogs */}
        <Suspense fallback={<CircularProgress />}>
          <LazyDialogs
            donationDialog={donationDialog}
            setDonationDialog={setDonationDialog}
            donorDialog={donorDialog}
            setDonorDialog={setDonorDialog}
            reportDialog={reportDialog}
            setReportDialog={setReportDialog}
            selectedDonation={selectedDonation}
            selectedDonor={selectedDonor}
            selectedReportItem={selectedReportItem}
            reportType={reportType}
            setReportType={setReportType}
            donationForm={donationForm}
            setDonationForm={setDonationForm}
            loading={savingDonation}
            DASHBOARD_COLORS={{
              primary: '#8b6cbc',
              gradient: {
                primary: 'linear-gradient(135deg, #8b6cbc 0%, #a389cc 100%)'
              },
              shadow: {
                medium: '0 4px 20px rgba(139, 108, 188, 0.3)',
                heavy: '0 8px 32px rgba(139, 108, 188, 0.4)'
              }
            }}
            campaigns={campaigns}
            DONOR_TYPES={DONOR_TYPES}
            DONATION_TYPES={DONATION_TYPES}
            PAYMENT_METHODS={PAYMENT_METHODS}
            DONATION_STATUS={DONATION_STATUS}
            formatCurrency={formatCurrency}
            getDonorTypeIcon={getDonorTypeIcon}
            handleSaveDonation={handleSaveDonation}
            generateReportData={() => null}
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
    </LocalizationProvider>
  );
}
