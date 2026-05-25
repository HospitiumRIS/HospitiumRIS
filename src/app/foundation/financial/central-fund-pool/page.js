'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Chip,
  Tooltip,
  Stack,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  alpha,
  LinearProgress,
  Tabs,
  Tab,
  useTheme,
  Divider,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  FileDownload as ExportIcon,
  Assessment as FundOverviewIcon,
  SwapHoriz as FundManagementIcon,
  Receipt as TransactionsIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  EmojiEvents as TrophyIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const CentralFundPoolPage = () => {
  const theme = useTheme();
  
  // State management
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [selectedFund, setSelectedFund] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Data state
  const [fundData, setFundData] = useState({
    totalPool: 0,
    available: 0,
    allocated: 0,
    reserved: 0,
    monthlyInflow: 0,
    monthlyOutflow: 0,
    fundraisingFunds: {
      total: 0,
      available: 0,
      reserved: 0,
      allocated: 0
    },
    grantFunds: {
      total: 0,
      available: 0,
      reserved: 0,
      allocated: 0
    }
  });

  const [fundSources, setFundSources] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [statistics, setStatistics] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalDonors: 0,
    totalDonations: 0
  });

  // Load data from API
  useEffect(() => {
    loadFundData();
  }, []);

  const loadFundData = async () => {
    try {
      setLoading(true);
      console.log('Fetching fund data from API...');
      
      const response = await fetch('/api/foundation/financial/central-fund-pool');
      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('API Response:', result);

      if (result.success) {
        console.log('Setting fund data:', result.data);
        setFundData(result.data.fundData);
        setFundSources(result.data.fundSources);
        setRecentTransactions(result.data.transactions);
        setStatistics(result.data.statistics);
      } else {
        console.error('API Error:', result.error);
        showSnackbar(result.error || 'Failed to load fund data', 'error');
      }
    } catch (error) {
      console.error('Error loading fund data:', error);
      showSnackbar(`Error loading fund data: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Filter logic
  const filteredFunds = useMemo(() => {
    console.log('Filtering funds. Total fundSources:', fundSources.length);
    const filtered = fundSources.filter(fund => {
      const searchLower = searchTerm.toLowerCase();
      return !searchTerm || 
        fund.name?.toLowerCase().includes(searchLower) ||
        fund.type?.toLowerCase().includes(searchLower) ||
        fund.category?.toLowerCase().includes(searchLower) ||
        fund.source?.toLowerCase().includes(searchLower);
    });
    console.log('Filtered funds:', filtered.length);
    return filtered;
  }, [fundSources, searchTerm]);

  // Pagination
  const paginatedFunds = useMemo(() => {
    const start = page * rowsPerPage;
    const paginated = filteredFunds.slice(start, start + rowsPerPage);
    console.log('Paginated funds:', paginated.length, 'Page:', page, 'RowsPerPage:', rowsPerPage);
    return paginated;
  }, [filteredFunds, page, rowsPerPage]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewFund = (fund) => {
    setSelectedFund(fund);
    setViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialog(false);
    setSelectedFund(null);
  };

  const getUtilizationPercentage = (fund) => {
    if (fund.amount === 0) return 0;
    return ((fund.allocated + fund.reserved) / fund.amount) * 100;
  };

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Central Fund Pool"
          description="Consolidated fund management, allocation tracking, and financial oversight"
          icon={<AccountBalanceIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Financial', path: '/foundation/financial' },
            { label: 'Central Fund Pool' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress size={60} sx={{ color: '#8b6cbc' }} />
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <>
      {/* Full-width PageHeader */}
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Central Fund Pool"
          description="Consolidated fund management, allocation tracking, and financial oversight"
          icon={<AccountBalanceIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Financial', path: '/foundation/financial' },
            { label: 'Central Fund Pool' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          actionButton={
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={loadFundData}
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
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Export
              </Button>
            </Stack>
          }
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Stats Cards */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2.5, 
          mb: 4,
          flexWrap: 'wrap',
          '& > *': {
            flex: '1 1 140px',
            minWidth: 0
          }
        }}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`,
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Total Pool
              </Typography>
              <AccountBalanceIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {formatCurrency(fundData.totalPool)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Consolidated funds
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`,
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Available
              </Typography>
              <MoneyIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {formatCurrency(fundData.available)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Ready for allocation
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`,
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Monthly Inflow
              </Typography>
              <TrendingUpIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {formatCurrency(fundData.monthlyInflow)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              New funds received
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`,
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Monthly Outflow
              </Typography>
              <TrendingDownIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {formatCurrency(fundData.monthlyOutflow)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Funds disbursed
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.primary.main, boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`, border: 'none', position: 'relative', overflow: 'hidden', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Active Campaigns
              </Typography>
              <FundOverviewIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {statistics.activeCampaigns}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              of {statistics.totalCampaigns} total
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.primary.main, boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`, border: 'none', position: 'relative', overflow: 'hidden', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Total Donors
              </Typography>
              <BusinessIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {statistics.totalDonors.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              {statistics.totalDonations.toLocaleString()} donations
            </Typography>
          </Paper>
        </Box>

        {/* Fund Categories Summary */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>

          {/* Fundraising Funds */}
          <Paper elevation={0} sx={{ flex: '1 1 0', minWidth: 0, borderRadius: 3, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid #8b6cbc', p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
              <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: alpha('#8b6cbc', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrophyIcon sx={{ color: '#8b6cbc', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Fundraising Funds</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Campaigns &amp; donations</Typography>
              </Box>
            </Stack>
            <Typography sx={{ fontWeight: 800, color: '#8b6cbc', fontSize: '1.9rem', lineHeight: 1.1, mb: 2.5 }}>
              {formatCurrency(fundData.fundraisingFunds.total)}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
              {[
                { label: 'Available', value: formatCurrency(fundData.fundraisingFunds.available), color: '#22c55e', bg: alpha('#22c55e', 0.06), border: alpha('#22c55e', 0.18) },
                { label: 'Allocated', value: formatCurrency(fundData.fundraisingFunds.allocated), color: '#8b6cbc', bg: alpha('#8b6cbc', 0.06), border: alpha('#8b6cbc', 0.15) },
                { label: 'Reserved', value: formatCurrency(fundData.fundraisingFunds.reserved), color: '#f59e0b', bg: alpha('#f59e0b', 0.06), border: alpha('#f59e0b', 0.18) },
              ].map(({ label, value, color, bg, border }) => (
                <Box key={label} sx={{ flex: 1, p: 1.25, borderRadius: 2, bgcolor: bg, border: `1px solid ${border}` }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>{label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color, fontSize: '0.85rem' }}>{value}</Typography>
                </Box>
              ))}
            </Box>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Utilization</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#8b6cbc', fontSize: '0.75rem' }}>
                  {fundData.fundraisingFunds.total > 0 ? ((fundData.fundraisingFunds.allocated / fundData.fundraisingFunds.total) * 100).toFixed(1) : '0.0'}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate"
                value={fundData.fundraisingFunds.total > 0 ? (fundData.fundraisingFunds.allocated / fundData.fundraisingFunds.total) * 100 : 0}
                sx={{ height: 7, borderRadius: 4, bgcolor: alpha('#8b6cbc', 0.1), '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc', borderRadius: 4 } }}
              />
            </Box>
          </Paper>

          {/* Grant Funds */}
          <Paper elevation={0} sx={{ flex: '1 1 0', minWidth: 0, borderRadius: 3, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid #1d4ed8', p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
              <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: alpha('#1d4ed8', 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BusinessIcon sx={{ color: '#1d4ed8', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Grant Funds</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>External grants &amp; awards</Typography>
              </Box>
            </Stack>
            <Typography sx={{ fontWeight: 800, color: '#1d4ed8', fontSize: '1.9rem', lineHeight: 1.1, mb: 2.5 }}>
              {formatCurrency(fundData.grantFunds.total)}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
              {[
                { label: 'Available', value: formatCurrency(fundData.grantFunds.available), color: '#22c55e', bg: alpha('#22c55e', 0.06), border: alpha('#22c55e', 0.18) },
                { label: 'Allocated', value: formatCurrency(fundData.grantFunds.allocated), color: '#1d4ed8', bg: alpha('#1d4ed8', 0.06), border: alpha('#1d4ed8', 0.15) },
                { label: 'Reserved', value: formatCurrency(fundData.grantFunds.reserved), color: '#f59e0b', bg: alpha('#f59e0b', 0.06), border: alpha('#f59e0b', 0.18) },
              ].map(({ label, value, color, bg, border }) => (
                <Box key={label} sx={{ flex: 1, p: 1.25, borderRadius: 2, bgcolor: bg, border: `1px solid ${border}` }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>{label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color, fontSize: '0.85rem' }}>{value}</Typography>
                </Box>
              ))}
            </Box>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Utilization</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1d4ed8', fontSize: '0.75rem' }}>
                  {fundData.grantFunds.total > 0 ? ((fundData.grantFunds.allocated / fundData.grantFunds.total) * 100).toFixed(1) : '0.0'}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate"
                value={fundData.grantFunds.total > 0 ? (fundData.grantFunds.allocated / fundData.grantFunds.total) * 100 : 0}
                sx={{ height: 7, borderRadius: 4, bgcolor: alpha('#1d4ed8', 0.1), '& .MuiLinearProgress-bar': { bgcolor: '#1d4ed8', borderRadius: 4 } }}
              />
            </Box>
          </Paper>
        </Box>

        {/* Tabs + Search unified panel */}
        <Paper elevation={0} sx={{ borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              sx={{
                flex: 1,
                '& .MuiTab-root': { fontWeight: 600, fontSize: '0.875rem', '&.Mui-selected': { color: '#8b6cbc' } },
                '& .MuiTabs-indicator': { bgcolor: '#8b6cbc', height: 3 },
              }}
            >
              <Tab label="Fund Sources" icon={<FundOverviewIcon />} iconPosition="start" />
              <Tab label="Transactions" icon={<TransactionsIcon />} iconPosition="start" />
              <Tab label="Allocations" icon={<FundManagementIcon />} iconPosition="start" />
            </Tabs>
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
            <Box sx={{ px: 2, py: 1.25, minWidth: { md: 300 }, width: { xs: '100%', md: 'auto' } }}>
              <TextField
                size="small" fullWidth
                placeholder="Search funds, sources, categories…"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Tab Content */}
        {selectedTab === 0 && (
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'primary.main' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Fund Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Total Amount</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Available</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Utilization</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedFunds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <Typography variant="body1" color="text.secondary">
                          No funds found matching your search
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedFunds.map((fund, index) => (
                      <TableRow 
                        key={fund.id}
                        hover
                        sx={{ 
                          '&:nth-of-type(odd)': { bgcolor: alpha('#8b6cbc', 0.02) },
                          '&:hover': { bgcolor: alpha('#8b6cbc', 0.05) }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                            {fund.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Received: {formatDate(fund.dateReceived)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{fund.type}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(fund.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                            {formatCurrency(fund.available)}
                          </Typography>
                          {fund.allocated > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(fund.allocated)} allocated
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ width: '100%', mb: 0.5 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={getUtilizationPercentage(fund)}
                              sx={{ 
                                height: 6, 
                                borderRadius: 3,
                                bgcolor: alpha('#e0e0e0', 0.3),
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: '#8b6cbc',
                                  borderRadius: 3
                                }
                              }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {getUtilizationPercentage(fund).toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={fund.status}
                            color={fund.status === 'unrestricted' ? 'success' : 'info'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={fund.category}
                            size="small"
                            sx={{
                              bgcolor: alpha('#8b6cbc', 0.1),
                              color: '#8b6cbc',
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewFund(fund)}
                              sx={{ 
                                color: '#8b6cbc',
                                '&:hover': { bgcolor: alpha('#8b6cbc', 0.1) }
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredFunds.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 20, 50]}
              sx={{
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: alpha('#8b6cbc', 0.02)
              }}
            />
          </Paper>
        )}

        {selectedTab === 1 && (
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'primary.main' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Reference</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Source</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Amount</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTransactions.map((txn) => (
                    <TableRow 
                      key={txn.id}
                      hover
                      sx={{ 
                        '&:nth-of-type(odd)': { bgcolor: alpha('#8b6cbc', 0.02) },
                        '&:hover': { bgcolor: alpha('#8b6cbc', 0.05) }
                      }}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2">{formatDate(txn.date)}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {txn.reference}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={txn.type}
                          color={txn.type === 'Inflow' ? 'success' : 'error'}
                          size="small"
                          icon={txn.type === 'Inflow' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{txn.source}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: txn.type === 'Inflow' ? '#4caf50' : '#f44336'
                          }}
                        >
                          {txn.type === 'Inflow' ? '+' : '-'}{formatCurrency(txn.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={txn.category}
                          size="small"
                          sx={{
                            bgcolor: alpha('#8b6cbc', 0.1),
                            color: '#8b6cbc'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={txn.status}
                          color="success"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {selectedTab === 2 && (
          <Paper sx={{ borderRadius: 2, p: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No Allocations Yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fund allocations will appear here once funds are assigned to specific projects or purposes.
            </Typography>
          </Paper>
        )}
      </Container>

      {/* View Fund Dialog */}
      <Dialog
        open={viewDialog}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
        disableScrollLock
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {selectedFund && (
          <>
            {/* Gradient hero header */}
            <Box sx={{ background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 60%, #b794f4 100%)', p: 3, color: 'white', position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, bgcolor: 'rgba(255,255,255,0.07)', borderRadius: '50%' }} />
              <Box sx={{ position: 'absolute', bottom: -30, right: 70, width: 60, height: 60, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pr: 5 }}>
                <Box sx={{ flex: 1, pr: 2 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.75 }}>
                    <Chip label={selectedFund.status} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '0.72rem', backdropFilter: 'blur(4px)' }} />
                    <Chip label={selectedFund.category} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, fontSize: '0.72rem', backdropFilter: 'blur(4px)' }} />
                    {selectedFund.campaignStatus && (
                      <Chip label={selectedFund.campaignStatus} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'white', fontWeight: 600, fontSize: '0.72rem' }} />
                    )}
                  </Stack>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, lineHeight: 1.2 }}>{selectedFund.name}</Typography>
                  <Typography sx={{ opacity: 0.82, fontSize: '0.88rem' }}>{selectedFund.type} · Received {formatDate(selectedFund.dateReceived)}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography sx={{ opacity: 0.75, fontSize: '0.70rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Total Amount</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>{formatCurrency(selectedFund.amount)}</Typography>
                </Box>
              </Box>

              {/* Metrics strip */}
              <Box sx={{ display: 'flex', gap: 0, mt: 2.5, pt: 2.5, borderTop: '1px solid rgba(255,255,255,0.2)', flexWrap: 'wrap' }}>
                {[
                  { label: 'Available', value: formatCurrency(selectedFund.available), color: '#bbf7d0' },
                  { label: 'Allocated', value: formatCurrency(selectedFund.allocated), color: '#fde68a' },
                  { label: 'Reserved', value: formatCurrency(selectedFund.reserved), color: '#bfdbfe' },
                  { label: 'Donors', value: selectedFund.donorCount != null ? selectedFund.donorCount.toLocaleString() : '—', color: 'rgba(255,255,255,0.95)' },
                  { label: 'Donations', value: selectedFund.donationCount != null ? selectedFund.donationCount.toLocaleString() : '—', color: 'rgba(255,255,255,0.95)' },
                ].map(({ label, value, color }, i, arr) => (
                  <Box key={label} sx={{ flex: '1 0 80px', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none', px: 1 }}>
                    <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', opacity: 0.72, letterSpacing: '0.05em', display: 'block' }}>{label}</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.97rem', color }}>{value}</Typography>
                  </Box>
                ))}
              </Box>

              <IconButton onClick={handleCloseViewDialog} size="small"
                sx={{ position: 'absolute', top: 12, right: 12, color: 'white', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
              {/* Utilization bar */}
              <Box sx={{ mb: 3, p: 2.5, borderRadius: 2, bgcolor: alpha('#8b6cbc', 0.04), border: `1px solid ${alpha('#8b6cbc', 0.12)}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Fund Utilization</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#8b6cbc' }}>{getUtilizationPercentage(selectedFund).toFixed(1)}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={getUtilizationPercentage(selectedFund)}
                  sx={{ height: 10, borderRadius: 5, bgcolor: alpha('#8b6cbc', 0.1), '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc', borderRadius: 5 } }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                  {formatCurrency(selectedFund.allocated + selectedFund.reserved)} of {formatCurrency(selectedFund.amount)} committed
                </Typography>
              </Box>

              {/* Two-column layout */}
              <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                {/* Left column: fund details */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.70rem', display: 'block', mb: 1.5 }}>
                    Fund Details
                  </Typography>
                  <Stack spacing={0}>
                    {[
                      { label: 'Fund Type',       value: selectedFund.type },
                      { label: 'Source',          value: selectedFund.source },
                      { label: 'Category',        value: selectedFund.category },
                      { label: 'Campaign Status', value: selectedFund.campaignStatus },
                      ...(selectedFund.startDate   ? [{ label: 'Start Date',       value: formatDate(selectedFund.startDate) }]   : []),
                      ...(selectedFund.endDate     ? [{ label: 'End Date / Expiry', value: formatDate(selectedFund.endDate) }]     : []),
                    ].map(({ label, value }) => (
                      <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 0.9, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0, mr: 2 }}>{label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>{value || 'N/A'}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />

                {/* Right column: purpose + restrictions */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.70rem', display: 'block', mb: 1.5 }}>
                    Purpose &amp; Restrictions
                  </Typography>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#8b6cbc', 0.04), border: `1px solid ${alpha('#8b6cbc', 0.1)}`, mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.70rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 0.75 }}>Purpose</Typography>
                    <Typography variant="body2">{selectedFund.purpose}</Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#f59e0b', 0.04), border: `1px solid ${alpha('#f59e0b', 0.14)}`, mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.70rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 0.75 }}>Restrictions</Typography>
                    <Typography variant="body2">{selectedFund.restrictions}</Typography>
                  </Box>
                  {selectedFund.notes && (
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.70rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 0.75 }}>Notes</Typography>
                      <Typography variant="body2" color="text.secondary">{selectedFund.notes}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: alpha('#8b6cbc', 0.02) }}>
              <Button onClick={handleCloseViewDialog} variant="outlined"
                sx={{ borderColor: alpha('#8b6cbc', 0.4), color: '#8b6cbc', borderRadius: 2 }}>
                Close
              </Button>
              <Button variant="contained" startIcon={<ExportIcon />}
                sx={{ bgcolor: '#8b6cbc', borderRadius: 2, '&:hover': { bgcolor: '#7a5caa' } }}>
                Export Details
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CentralFundPoolPage;
