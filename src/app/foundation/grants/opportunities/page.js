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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Public as CountryIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Link as LinkIcon,
  Close as CloseIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const GrantOpportunitiesPage = () => {
  const theme = useTheme();
  
  // State management
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load opportunities from Excel
  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/foundation/grant-opportunities/import');
      const data = await response.json();

      if (data.success) {
        setOpportunities(data.data || []);
        showSnackbar(`Loaded ${data.total} opportunities from Excel`, 'success');
      } else {
        showSnackbar(data.error || 'Failed to load opportunities', 'error');
        setOpportunities([]);
      }
    } catch (error) {
      console.error('Error loading opportunities:', error);
      showSnackbar('Error loading opportunities', 'error');
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Filter and search logic
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        opp.title?.toLowerCase().includes(searchLower) ||
        opp.grantor?.toLowerCase().includes(searchLower) ||
        opp.category?.toLowerCase().includes(searchLower) ||
        opp.description?.toLowerCase().includes(searchLower) ||
        opp.focusArea?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = filterStatus === 'all' || opp.status === filterStatus;

      // Category filter
      const matchesCategory = filterCategory === 'all' || opp.category === filterCategory;

      // Country filter
      const matchesCountry = filterCountry === 'all' || opp.country === filterCountry;

      return matchesSearch && matchesStatus && matchesCategory && matchesCountry;
    });
  }, [opportunities, searchTerm, filterStatus, filterCategory, filterCountry]);

  // Pagination
  const paginatedOpportunities = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredOpportunities.slice(start, start + rowsPerPage);
  }, [filteredOpportunities, page, rowsPerPage]);

  // Get unique values for filters
  const categories = useMemo(() => 
    [...new Set(opportunities.map(o => o.category).filter(Boolean))].sort(),
    [opportunities]
  );

  const countries = useMemo(() => 
    [...new Set(opportunities.map(o => o.country).filter(Boolean))].sort(),
    [opportunities]
  );

  // Statistics
  const stats = useMemo(() => ({
    total: opportunities.length,
    open: opportunities.filter(o => o.status === 'open').length,
    closed: opportunities.filter(o => o.status === 'closed').length,
    totalFunding: opportunities
      .filter(o => o.status === 'open')
      .reduce((sum, o) => sum + (o.maxAmount || o.amount || 0), 0),
    closingSoon: opportunities.filter(o => {
      if (o.status !== 'open' || !o.deadline) return false;
      const d = Math.ceil((new Date(o.deadline) - new Date()) / 86400000);
      return d >= 0 && d <= 30;
    }).length,
  }), [opportunities]);

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    return Math.ceil((new Date(deadline) - new Date()) / 86400000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'success';
      case 'closed': return 'error';
      case 'closing-today': return 'warning';
      default: return 'default';
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewOpportunity = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialog(false);
    setSelectedOpportunity(null);
  };

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Grant Opportunities"
          description="Browse and search grant opportunities from Kenya medical research database"
          icon={<WorkIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Grants', path: '/foundation/grants' },
            { label: 'Opportunities' }
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
          title="Grant Opportunities"
          description="Browse and search grant opportunities from Kenya medical research database"
          icon={<WorkIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Grants', path: '/foundation/grants' },
            { label: 'Opportunities' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          actionButton={
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={loadOpportunities}
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
              Refresh Data
            </Button>
          }
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Closing soon alert */}
        {!loading && stats.closingSoon > 0 && (
          <Alert
            severity="warning"
            sx={{ mb: 3, borderRadius: 2, border: '1px solid rgba(237,108,2,0.3)' }}
            action={
              <Button color="inherit" size="small" onClick={() => { setFilterStatus('open'); setPage(0); }}>
                View Open
              </Button>
            }
          >
            <strong>{stats.closingSoon}</strong> open grant{stats.closingSoon !== 1 ? 's are' : ' is'} closing within the next 30 days — review and prioritise applications.
          </Alert>
        )}

        {/* Search, Filters + Inline Summary */}
        <Paper sx={{ borderRadius: 2, mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>

          {/* Compact stats summary bar */}
          <Box sx={{
            px: 3, py: 1.5,
            background: `linear-gradient(135deg, ${alpha('#8b6cbc', 0.06)} 0%, ${alpha('#8b6cbc', 0.03)} 100%)`,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            flexWrap: 'wrap',
            rowGap: 0.5
          }}>
            {[
              { label: 'Total',             value: stats.total,                        icon: <AssignmentIcon sx={{ fontSize: 15 }} />, color: '#8b6cbc' },
              { label: 'Open',              value: stats.open,                         icon: <CheckCircleIcon sx={{ fontSize: 15 }} />, color: '#16a34a' },
              { label: 'Closed',            value: stats.closed,                       icon: <CancelIcon sx={{ fontSize: 15 }} />,      color: '#ef4444' },
              { label: 'Closing \u226430d', value: stats.closingSoon,                  icon: <CalendarIcon sx={{ fontSize: 15 }} />,    color: '#d97706' },
              { label: 'Available Funding', value: formatCurrency(stats.totalFunding), icon: <MoneyIcon sx={{ fontSize: 15 }} />,       color: '#0369a1' },
            ].map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Divider orientation="vertical" flexItem sx={{ mx: 2.5, my: 0.5 }} />}
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ color: item.color, display: 'flex', opacity: 0.9 }}>{item.icon}</Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>{item.label}:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.8rem' }}>{item.value}</Typography>
                </Stack>
              </React.Fragment>
            ))}
          </Box>

          {/* Filter controls */}
          <Box sx={{ p: 2.5 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
              <TextField
                placeholder="Search by title, grantor, category, focus area..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                size="small"
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
                  displayEmpty
                  sx={{ borderRadius: 2 }}
                  MenuProps={{ disableScrollLock: true }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                  <MenuItem value="closing-today">Closing Today</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select
                  value={filterCategory}
                  onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }}
                  displayEmpty
                  sx={{ borderRadius: 2 }}
                  MenuProps={{ disableScrollLock: true, PaperProps: { sx: { maxHeight: 260 } } }}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={filterCountry}
                  onChange={(e) => { setFilterCountry(e.target.value); setPage(0); }}
                  displayEmpty
                  sx={{ borderRadius: 2 }}
                  MenuProps={{ disableScrollLock: true, PaperProps: { sx: { maxHeight: 260 } } }}
                >
                  <MenuItem value="all">All Countries</MenuItem>
                  {countries.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              {(searchTerm || filterStatus !== 'all' || filterCategory !== 'all' || filterCountry !== 'all') && (
                <Tooltip title="Clear all filters">
                  <IconButton size="small" onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterCategory('all'); setFilterCountry('all'); setPage(0); }} sx={{ color: '#8b6cbc', border: '1px solid', borderColor: alpha('#8b6cbc', 0.3) }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
              <FilterListIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Showing <strong>{filteredOpportunities.length}</strong> of <strong>{opportunities.length}</strong> opportunities
                {filteredOpportunities.length !== opportunities.length && ` — filtered`}
              </Typography>
            </Stack>
          </Box>
        </Paper>

        {/* Opportunities Table */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Grant Title</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Grantor</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Deadline</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Country</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedOpportunities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Typography variant="body1" color="text.secondary">
                        No opportunities found matching your filters
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOpportunities.map((opp, index) => (
                    <TableRow 
                      key={opp.id || index}
                      hover
                      onClick={() => handleViewOpportunity(opp)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:nth-of-type(odd)': { bgcolor: alpha('#8b6cbc', 0.02) },
                        '&:hover': { bgcolor: alpha('#8b6cbc', 0.06) }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                          {opp.title}
                        </Typography>
                        {opp.focusArea && (
                          <Typography variant="caption" color="text.secondary">
                            {opp.focusArea}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{opp.grantor}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(opp.maxAmount || opp.amount)}
                        </Typography>
                        {opp.minAmount && opp.minAmount !== opp.maxAmount && (
                          <Typography variant="caption" color="text.secondary">
                            Min: {formatCurrency(opp.minAmount)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body2">{formatDate(opp.deadline)}</Typography>
                          </Stack>
                          {(() => {
                            const days = getDaysLeft(opp.deadline);
                            if (days === null || opp.status === 'closed') return null;
                            if (days < 0)  return <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600, fontSize: '0.7rem' }}>Expired</Typography>;
                            if (days === 0) return <Chip label="Closes Today" size="small" color="error" sx={{ height: 18, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 } }} />;
                            if (days <= 7)  return <Chip label={`${days}d left`} size="small" color="error"   sx={{ height: 18, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 } }} />;
                            if (days <= 30) return <Chip label={`${days}d left`} size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 } }} />;
                            return null;
                          })()}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={opp.category} 
                          size="small"
                          sx={{
                            bgcolor: alpha('#8b6cbc', 0.1),
                            color: '#8b6cbc',
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <CountryIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2">{opp.country}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={opp.status}
                          color={getStatusColor(opp.status)}
                          size="small"
                          icon={opp.status === 'open' ? <CheckCircleIcon /> : <CancelIcon />}
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="View full details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewOpportunity(opp)}
                            sx={{ color: '#8b6cbc', '&:hover': { bgcolor: alpha('#8b6cbc', 0.1) } }}
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
            count={filteredOpportunities.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50, 100]}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha('#8b6cbc', 0.02)
            }}
          />
        </Paper>
      </Container>

      {/* View Opportunity Dialog */}
      <Dialog
        open={viewDialog}
        onClose={handleCloseViewDialog}
        maxWidth="lg"
        fullWidth
        disableScrollLock
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', maxHeight: '92vh' } }}
      >
        {selectedOpportunity && (() => {
          const opp = selectedOpportunity;
          const days = getDaysLeft(opp.deadline);
          const urgentColor = days !== null && days <= 7 ? '#ef4444' : days !== null && days <= 30 ? '#d97706' : null;

          return (
            <>
              {/* ── Hero Header ── */}
              <Box sx={{ background: 'linear-gradient(135deg, #6d4fa0 0%, #8b6cbc 60%, #a084d1 100%)', p: 3, pb: 2.5, position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                <Box sx={{ position: 'absolute', bottom: -30, left: 80, width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                  <Box sx={{ flex: 1, mr: 2 }}>
                    {/* Grantor badge */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                      <BusinessIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: '0.85rem' }}>
                        {opp.grantor}
                        {opp.country ? ` · ${opp.country}` : ''}
                        {opp.region ? ` · ${opp.region}` : ''}
                      </Typography>
                    </Stack>

                    {/* Title */}
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.3, mb: 1.5, letterSpacing: '-0.02em' }}>
                      {opp.title}
                    </Typography>

                    {/* Chips row */}
                    <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={0.75}>
                      <Chip
                        label={opp.status === 'open' ? 'Open' : opp.status === 'closed' ? 'Closed' : opp.status}
                        size="small"
                        icon={opp.status === 'open' ? <CheckCircleIcon sx={{ '&&': { color: opp.status === 'open' ? '#16a34a' : '#ef4444' } }} /> : <CancelIcon />}
                        sx={{
                          bgcolor: opp.status === 'open' ? 'rgba(220,252,231,0.95)' : 'rgba(254,226,226,0.95)',
                          color: opp.status === 'open' ? '#15803d' : '#b91c1c',
                          fontWeight: 700, fontSize: '0.75rem',
                          '& .MuiChip-icon': { color: opp.status === 'open' ? '#15803d' : '#b91c1c' }
                        }}
                      />
                      {opp.category && (
                        <Chip
                          label={opp.category}
                          size="small"
                          sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', fontWeight: 600, fontSize: '0.75rem', backdropFilter: 'blur(4px)' }}
                        />
                      )}
                      {opp.focusArea && (
                        <Chip
                          label={opp.focusArea}
                          size="small"
                          sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', fontSize: '0.72rem' }}
                        />
                      )}
                      {days !== null && opp.status !== 'closed' && urgentColor && (
                        <Chip
                          label={days === 0 ? 'Closes Today' : `${days} days left`}
                          size="small"
                          sx={{ bgcolor: urgentColor === '#ef4444' ? 'rgba(254,226,226,0.95)' : 'rgba(254,243,199,0.95)', color: urgentColor, fontWeight: 700, fontSize: '0.72rem' }}
                        />
                      )}
                    </Stack>
                  </Box>
                  <IconButton onClick={handleCloseViewDialog} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: 'white' }, mt: -0.5 }}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* ── 4 Key Metrics Strip ── */}
              <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider' }}>
                {[
                  {
                    icon: <MoneyIcon sx={{ fontSize: 18 }} />,
                    label: 'Award Amount',
                    value: formatCurrency(opp.maxAmount || opp.amount),
                    sub: opp.minAmount && opp.minAmount !== opp.maxAmount ? `Min ${formatCurrency(opp.minAmount)}` : null,
                    color: '#059669',
                  },
                  {
                    icon: <CalendarIcon sx={{ fontSize: 18 }} />,
                    label: 'Application Deadline',
                    value: formatDate(opp.deadline),
                    sub: days === null ? null : days < 0 ? 'Expired' : days === 0 ? 'Closes today' : `${days} days remaining`,
                    subColor: urgentColor || (days !== null && days > 0 ? '#64748b' : undefined),
                    color: urgentColor || '#8b6cbc',
                  },
                  {
                    icon: <TimelineIcon sx={{ fontSize: 18 }} />,
                    label: 'Project Duration',
                    value: opp.duration ? `${opp.duration} months` : 'Not specified',
                    color: '#7c3aed',
                  },
                  {
                    icon: <CountryIcon sx={{ fontSize: 18 }} />,
                    label: 'Country / Region',
                    value: opp.country || 'N/A',
                    sub: opp.region || null,
                    color: '#0369a1',
                  },
                ].map((m, i, arr) => (
                  <Box key={i} sx={{ flex: 1, px: 2.5, py: 2, borderRight: i < arr.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
                      <Box sx={{ color: m.color, display: 'flex', opacity: 0.85 }}>{m.icon}</Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>
                        {m.label}
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: m.color, lineHeight: 1.2, fontSize: '1rem' }}>
                      {m.value}
                    </Typography>
                    {m.sub && (
                      <Typography variant="caption" sx={{ color: m.subColor || '#64748b', fontSize: '0.72rem', fontWeight: m.subColor ? 600 : 400 }}>
                        {m.sub}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>

              {/* ── Two-column body ── */}
              <DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden' }}>

                {/* Left — main narrative content */}
                <Box sx={{ flex: 2, p: 3, overflowY: 'auto', borderRight: '1px solid', borderColor: 'divider' }}>
                  {[
                    { title: 'Description',          text: opp.description },
                    { title: 'Eligibility Criteria', text: opp.eligibility },
                    { title: 'Target Applicants',    text: opp.targetGroups },
                    { title: 'Requirements',         text: opp.requirements },
                    { title: 'Application Process',  text: opp.applicationProcess },
                  ].filter(s => s.text).map((section, i) => (
                    <Box key={i} sx={{ mb: 3 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                        <Box sx={{ width: 3, height: 18, bgcolor: '#8b6cbc', borderRadius: 4, flexShrink: 0 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
                          {section.title}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.75, pl: 1.5 }}>
                        {section.text}
                      </Typography>
                    </Box>
                  ))}

                  {/* Notes */}
                  {opp.notes && (
                    <Box sx={{ bgcolor: alpha('#8b6cbc', 0.04), border: `1px solid ${alpha('#8b6cbc', 0.15)}`, borderRadius: 2, p: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#8b6cbc', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.68rem' }}>
                        Notes
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569', mt: 0.75, lineHeight: 1.7 }}>
                        {opp.notes}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Right sidebar — dates + contact */}
                <Box sx={{ flex: 1, p: 3, overflowY: 'auto', bgcolor: alpha('#f8fafc', 0.6) }}>

                  {/* Key Dates */}
                  <Box sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <Box sx={{ width: 3, height: 18, bgcolor: '#8b6cbc', borderRadius: 4 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                        Key Dates
                      </Typography>
                    </Stack>
                    {[
                      { label: 'Application Opens',   date: opp.applicationOpenDate, accent: '#059669' },
                      { label: 'Deadline',             date: opp.deadline,            accent: urgentColor || '#8b6cbc', bold: true },
                      { label: 'Award Announcement',   date: opp.awardAnnouncement,   accent: '#0369a1' },
                      { label: 'Project Start',        date: opp.projectStartDate,    accent: '#7c3aed' },
                      { label: 'Project End',          date: opp.projectEndDate,      accent: '#d97706' },
                    ].filter(d => d.date).map((d, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.75, alignItems: 'flex-start' }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.accent, mt: 0.6, flexShrink: 0, boxShadow: `0 0 0 2px ${alpha(d.accent, 0.2)}` }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block' }}>
                            {d.label}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: d.bold ? 700 : 600, color: d.bold && urgentColor ? urgentColor : '#1e293b', fontSize: '0.85rem' }}>
                            {formatDate(d.date)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  {/* Contact */}
                  {(opp.website || opp.contactEmail || opp.contactPhone) && (
                    <Box sx={{ pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <Box sx={{ width: 3, height: 18, bgcolor: '#8b6cbc', borderRadius: 4 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                          Contact
                        </Typography>
                      </Stack>
                      <Stack spacing={1.25}>
                        {opp.contactEmail && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <EmailIcon sx={{ fontSize: 15, color: '#8b6cbc', flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#334155', wordBreak: 'break-all' }}>
                              {opp.contactEmail}
                            </Typography>
                          </Stack>
                        )}
                        {opp.contactPhone && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <PhoneIcon sx={{ fontSize: 15, color: '#8b6cbc', flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#334155' }}>
                              {opp.contactPhone}
                            </Typography>
                          </Stack>
                        )}
                        {opp.website && (
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            startIcon={<LinkIcon />}
                            onClick={() => window.open(opp.website, '_blank')}
                            sx={{ mt: 0.5, borderColor: alpha('#8b6cbc', 0.4), color: '#8b6cbc', textTransform: 'none', borderRadius: 2, fontSize: '0.8rem', justifyContent: 'flex-start', '&:hover': { bgcolor: alpha('#8b6cbc', 0.05), borderColor: '#8b6cbc' } }}
                          >
                            Visit Website
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  )}

                  {/* Source footer */}
                  {(opp.source || opp.importedAt) && (
                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block', lineHeight: 1.6 }}>
                        {opp.source && <><strong style={{ color: '#64748b' }}>Source:</strong> {opp.source}<br /></>}
                        {opp.importedAt && <><strong style={{ color: '#64748b' }}>Imported:</strong> {formatDate(opp.importedAt)}</>}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </DialogContent>

              {/* ── Footer ── */}
              <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: alpha('#8b6cbc', 0.02), gap: 1 }}>
                <Button onClick={handleCloseViewDialog} variant="outlined" sx={{ borderColor: alpha('#8b6cbc', 0.4), color: '#8b6cbc', '&:hover': { borderColor: '#8b6cbc', bgcolor: alpha('#8b6cbc', 0.04) } }}>
                  Close
                </Button>
                {opp.website && (
                  <Button
                    variant="contained"
                    startIcon={<LinkIcon />}
                    onClick={() => window.open(opp.website, '_blank')}
                    sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7a5caa' }, boxShadow: `0 4px 12px ${alpha('#8b6cbc', 0.35)}` }}
                  >
                    Apply / Visit Website
                  </Button>
                )}
              </DialogActions>
            </>
          );
        })()}
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

export default GrantOpportunitiesPage;
