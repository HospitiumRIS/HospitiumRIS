'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  IconButton,
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
  Avatar,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AccountBalance as AccountBalanceIcon,
  Foundation as FoundationIcon,
  TrendingUp as TrendingUpIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Public as CountryIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const GrantOpportunityTracking = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [addGrantorDialog, setAddGrantorDialog] = useState(false);
  const [addOpportunityDialog, setAddOpportunityDialog] = useState(false);
  const [viewOpportunityDialog, setViewOpportunityDialog] = useState(false);
  const [selectedGrantor, setSelectedGrantor] = useState(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [expandedGrantors, setExpandedGrantors] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [grantors, setGrantors] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form states
  const [grantorForm, setGrantorForm] = useState({
    name: '',
    type: '',
    focus: [], // Changed to array for multiple selection
    contactPerson: '',
    email: '',
    phone: '',
    country: '',
    notes: ''
  });

  const [opportunityForm, setOpportunityForm] = useState({
    title: '',
    amount: '',
    deadline: '',
    category: [], // Changed to array for multiple selection
    eligibility: [], // Changed to array for multiple selection  
    notes: '',
    grantorId: ''
  });

  // Load grantors from database
  useEffect(() => {
    loadGrantors();
  }, []);

  const loadGrantors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/foundation/grantors?search=${searchTerm}&status=${filterStatus}`);
      
      // Check if response is ok and contains JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API returned non-JSON response:', await response.text());
        throw new Error('API returned non-JSON response');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Sort opportunities within each grantor: open first, then closed
        const grantorsWithSortedOpportunities = data.grantors.map(grantor => ({
          ...grantor,
          opportunities: (grantor.opportunities || []).sort((a, b) => {
            const statusA = getActualStatus(a);
            const statusB = getActualStatus(b);
            
            // Open status comes first (0), closed status comes second (1)
            const priorityA = statusA === 'open' ? 0 : 1;
            const priorityB = statusB === 'open' ? 0 : 1;
            
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }
            
            // If same status, sort by deadline (earliest first)
            return new Date(a.deadline) - new Date(b.deadline);
          })
        }));
        
        // Sort grantors by number of opportunities (most opportunities first)
        const sortedGrantors = grantorsWithSortedOpportunities.sort((a, b) => {
          // Primary sort: by total number of opportunities (descending)
          const opportunitiesCountA = a.opportunities.length;
          const opportunitiesCountB = b.opportunities.length;
          
          if (opportunitiesCountA !== opportunitiesCountB) {
            return opportunitiesCountB - opportunitiesCountA; // Descending order
          }
          
          // Secondary sort: by number of open opportunities (descending)
          const openOpportunitiesA = a.opportunities.filter(op => getActualStatus(op) === 'open').length;
          const openOpportunitiesB = b.opportunities.filter(op => getActualStatus(op) === 'open').length;
          
          if (openOpportunitiesA !== openOpportunitiesB) {
            return openOpportunitiesB - openOpportunitiesA; // Descending order
          }
          
          // Tertiary sort: alphabetically by grantor name (ascending)
          return a.name.localeCompare(b.name);
        });
        
        setGrantors(sortedGrantors);
      } else {
        console.error('Failed to load grantors:', data.error);
        showSnackbar('Failed to load grantors', 'error');
        // Set empty array as fallback
        setGrantors([]);
      }
    } catch (error) {
      console.error('Error loading grantors:', error);
      showSnackbar('Error loading grantors. Using mock data for now.', 'warning');
      // Set mock data for development
      setGrantors([
        {
          id: '1',
          name: 'National Science Foundation',
          type: 'federal',
          focus: ['Basic Research', 'Innovation & Technology'],
          contactPerson: 'Dr. Jane Smith',
          email: 'jane.smith@nsf.gov',
          phone: '(703) 292-5111',
          country: 'United States',
          status: 'active',
          opportunities: [
            {
              id: '1',
              title: 'Research Grant Program',
              amount: 500000,
              deadline: '2024-12-31',
              category: ['Research Grant'],
              eligibility: ['Early Stage Investigator', 'Assistant Professor'],
              status: 'open',
              notes: 'Supports innovative research projects'
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Reload data when search or filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadGrantors();
    }, 300); // Debounce search
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStatus]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Function to determine the actual status based on deadline
  const getActualStatus = (opportunity) => {
    const currentDate = new Date();
    const deadlineDate = new Date(opportunity.deadline);
    
    // Remove time component for accurate date comparison
    currentDate.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    
    // If deadline has passed, mark as closed regardless of stored status
    if (deadlineDate < currentDate) {
      return 'closed';
    }
    
    // If deadline is today or in the future, use the original status
    return opportunity.status?.toLowerCase() || 'open';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'open':
        return 'success';
      case 'closed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'open':
        return <CheckCircleIcon fontSize="small" />;
      case 'closed':
        return <WarningIcon fontSize="small" />;
      case 'pending':
        return <InfoIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  const handleAddGrantor = () => {
    setSelectedGrantor(null);
    setGrantorForm({
      name: '',
      type: '',
      focus: [],
      contactPerson: '',
      email: '',
      phone: '',
      country: '',
      notes: ''
    });
    setAddGrantorDialog(true);
  };

  const handleSaveGrantor = async () => {
    try {
      setSaving(true);
      
      // Basic validation
      if (!grantorForm.name || !grantorForm.type || !grantorForm.country) {
        showSnackbar('Please fill in all required fields (Name, Type, Country)', 'error');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/foundation/grantors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(grantorForm),
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar('Grantor created successfully!', 'success');
        setAddGrantorDialog(false);
        setGrantorForm({
          name: '',
          type: '',
          focus: [],
          contactPerson: '',
          email: '',
          phone: '',
          country: '',
          notes: ''
        });
        loadGrantors(); // Reload the list
      } else {
        showSnackbar(data.error || 'Failed to create grantor', 'error');
      }
    } catch (error) {
      console.error('Error creating grantor:', error);
      showSnackbar('Error creating grantor', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddOpportunity = (grantorId = null) => {
    setSelectedOpportunity(null);
    setOpportunityForm({
      title: '',
      amount: '',
      deadline: '',
      category: [],
      eligibility: [],
      notes: '',
      grantorId: grantorId || ''
    });
    setAddOpportunityDialog(true);
  };

  const handleSaveOpportunity = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/foundation/grant-opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(opportunityForm),
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar('Grant opportunity created successfully!', 'success');
        setAddOpportunityDialog(false);
        setOpportunityForm({
          title: '',
          amount: '',
          deadline: '',
          category: [],
          eligibility: [],
          notes: '',
          grantorId: ''
        });
        loadGrantors(); // Reload the list to show updated opportunities
      } else {
        showSnackbar(data.error || 'Failed to create opportunity', 'error');
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
      showSnackbar('Error creating opportunity', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseGrantorDialog = () => {
    if (!saving) {
      setAddGrantorDialog(false);
      setSelectedGrantor(null);
    }
  };

  const handleCloseOpportunityDialog = () => {
    if (!saving) {
      setAddOpportunityDialog(false);
      setSelectedOpportunity(null);
    }
  };

  const handleViewOpportunity = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setViewOpportunityDialog(true);
  };

  const handleCloseViewDialog = () => {
    setViewOpportunityDialog(false);
    setSelectedOpportunity(null);
  };

  const handleGrantorAccordion = (grantorId) => {
    setExpandedGrantors(prev => ({
      ...prev,
      [grantorId]: !prev[grantorId]
    }));
  };

  // Calculate statistics
  const totalOpportunities = grantors.reduce((sum, grantor) => sum + grantor.opportunities.length, 0);
  const totalFunding = grantors.reduce((sum, grantor) => 
    sum + grantor.opportunities.reduce((opSum, op) => opSum + op.amount, 0), 0);

  // Calculate open and closed opportunities based on actual status
  const allOpportunities = grantors.flatMap(grantor => grantor.opportunities);
  const openOpportunities = allOpportunities.filter(op => getActualStatus(op) === 'open').length;
  const closedOpportunities = allOpportunities.filter(op => getActualStatus(op) === 'closed').length;
  const availableFunding = allOpportunities
    .filter(op => getActualStatus(op) === 'open')
    .reduce((sum, op) => sum + op.amount, 0);

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Grant Opportunities"
          description="Manage grantor database and track potential grant opportunities • Sorted by most opportunities"
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
          description="Manage grantor database and track potential grant opportunities • Sorted by most opportunities"
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
              startIcon={<AddIcon />}
              onClick={handleAddGrantor}
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
              Add Grantor
            </Button>
          }
        />
      </Box>

      <Box sx={{ minHeight: 'calc(100vh - 200px)', backgroundColor: '#f8f9fa' }}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Stats Cards */}
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: 2,
            mb: 3,
            background: grantors.length > 0 ? 'linear-gradient(135deg, rgba(139, 108, 188, 0.08) 0%, rgba(255, 255, 255, 1) 100%)' : 'white'
          }}>
            <CardContent sx={{ py: 3 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 0.5 }}>
                      <TrendingUpIcon sx={{ fontSize: 24, color: '#8b6cbc' }} />
                      <Typography variant="h3" fontWeight="bold" color="primary">
                        {grantors.length}
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: '1rem', fontWeight: 500 }}>
                      Active Grantors (Ranked)
                    </Typography>
                    {grantors.length > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        Top: {grantors[0]?.name} ({grantors[0]?.opportunities.length} opportunities)
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold" color="success.main" sx={{ mb: 0.5 }}>
                      {openOpportunities}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: '1rem', fontWeight: 500 }}>
                      Open Opportunities
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold" color="error.main" sx={{ mb: 0.5 }}>
                      {closedOpportunities}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: '1rem', fontWeight: 500 }}>
                      Closed Opportunities
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold" color="primary" sx={{ mb: 0.5 }}>
                      {totalOpportunities}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: '1rem', fontWeight: 500 }}>
                      Total Opportunities
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Search and Filters */}
          <Paper sx={{ borderRadius: 3, p: 3, mb: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="stretch">
              <Box sx={{ flex: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Search grantors, opportunities, or focus areas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <FormControl fullWidth>
                  <InputLabel>Filter by Status</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label="Filter by Status"
                    sx={{
                      borderRadius: 2,
                    }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="open">Open</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </Paper>

          {/* Sorting Information Alert */}
          {grantors.length > 0 && (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3,
                borderRadius: 3,
                backgroundColor: alpha('#8b6cbc', 0.05),
                border: `1px solid ${alpha('#8b6cbc', 0.2)}`,
                '& .MuiAlert-icon': {
                  color: '#8b6cbc'
                },
                '& .MuiAlert-message': {
                  color: '#2c3e50'
                }
              }}
              icon={<TrendingUpIcon />}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Grantors are ranked by total number of opportunities.
                </Typography>
                <Chip 
                  label={`Top performer: ${grantors[0]?.name} with ${grantors[0]?.opportunities.length} opportunities`}
                  size="small"
                  sx={{
                    backgroundColor: alpha('#8b6cbc', 0.1),
                    color: '#8b6cbc',
                    fontWeight: 500,
                    fontSize: '0.75rem'
                  }}
                />
              </Stack>
            </Alert>
          )}

          {/* Grantor Accordions */}
          <Box>
            {grantors.map((grantor, index) => (
              <Accordion
                key={grantor.id}
                expanded={expandedGrantors[grantor.id] || false}
                onChange={() => handleGrantorAccordion(grantor.id)}
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: `2px solid ${alpha('#8b6cbc', 0.2)}`,
                  '&:before': { display: 'none' },
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 28, color: '#8b6cbc' }} />}
                  sx={{ 
                    backgroundColor: alpha('#8b6cbc', 0.08),
                    minHeight: 80,
                    px: 3,
                    py: 2,
                    '&:hover': { 
                      backgroundColor: alpha('#8b6cbc', 0.15),
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={3} sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Tooltip 
                        title={`Ranked #${index + 1} by total opportunities (${grantor.opportunities.length} total, ${grantor.opportunities.filter(op => getActualStatus(op) === 'open').length} open)`}
                        arrow
                        placement="top"
                      >
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 32,
                          height: 32,
                          borderRadius: 2,
                          backgroundColor: index < 3 ? '#FFD700' : alpha('#8b6cbc', 0.15),
                          color: index < 3 ? '#B8860B' : '#8b6cbc',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          boxShadow: index < 3 ? '0 2px 8px rgba(255, 215, 0, 0.3)' : '0 2px 8px rgba(139, 108, 188, 0.2)',
                          border: index < 3 ? '2px solid #FFD700' : '2px solid rgba(139, 108, 188, 0.2)',
                          cursor: 'help'
                        }}>
                          #{index + 1}
                        </Box>
                      </Tooltip>
                      <Avatar sx={{ 
                        bgcolor: '#8b6cbc',
                        width: 56,
                        height: 56,
                        fontSize: '1.2rem',
                        boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
                        border: '3px solid white'
                      }}>
                        {grantor.name.charAt(0)}
                      </Avatar>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" sx={{ 
                        fontWeight: 700, 
                        color: '#1a1a1a',
                        mb: 0.5,
                        letterSpacing: '-0.5px'
                      }}>
                        {grantor.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ 
                        fontSize: '0.95rem',
                        opacity: 0.8,
                        mb: 1
                      }}>
                        {grantor.focus?.join(', ')} • {grantor.country}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip 
                          label={grantor.type}
                          size="small"
                          sx={{
                            backgroundColor: alpha('#8b6cbc', 0.1),
                            color: '#8b6cbc',
                            fontWeight: 500
                          }}
                        />
                        <Chip
                          icon={getStatusIcon(grantor.status)}
                          label={grantor.status}
                          color={getStatusColor(grantor.status)}
                          size="small"
                        />
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ textAlign: 'center', px: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                          {grantor.opportunities.filter(op => getActualStatus(op) === 'open').length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Open
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', px: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                          {grantor.opportunities.filter(op => getActualStatus(op) === 'closed').length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Closed
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', px: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {formatCurrency(grantor.opportunities.filter(op => getActualStatus(op) === 'open').reduce((sum, op) => sum + op.amount, 0))}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Available Funding
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <Box sx={{ p: 3, backgroundColor: '#fafafa' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                        Grant Opportunities from {grantor.name}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddOpportunity(grantor.id)}
                        sx={{ 
                          background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
                          boxShadow: '0 4px 20px rgba(139, 108, 188, 0.3)',
                          borderRadius: 2,
                          '&:hover': {
                            boxShadow: '0 8px 32px rgba(139, 108, 188, 0.4)',
                          }
                        }}
                      >
                        Add Opportunity
                      </Button>
                    </Stack>
                    
                    {grantor.opportunities.length === 0 ? (
                      <Box sx={{ 
                        textAlign: 'center', 
                        py: 6,
                        backgroundColor: 'white',
                        borderRadius: 2,
                        border: '1px solid #e0e0e0'
                      }}>
                        <WorkIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No Opportunities Yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Start adding grant opportunities for this grantor
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddOpportunity(grantor.id)}
                          sx={{ 
                            background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
                            boxShadow: '0 4px 20px rgba(139, 108, 188, 0.3)',
                            borderRadius: 2
                          }}
                        >
                          Add First Opportunity
                        </Button>
                      </Box>
                    ) : (
                      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: alpha('#8b6cbc', 0.05) }}>
                              <TableCell sx={{ fontWeight: 600, color: '#8b6cbc' }}>Opportunity</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#8b6cbc' }}>Amount</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#8b6cbc' }}>Deadline</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#8b6cbc' }}>Category</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#8b6cbc' }}>Eligibility</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#8b6cbc' }}>Status</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 600, color: '#8b6cbc' }}>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {grantor.opportunities.map((opportunity) => (
                              <TableRow 
                                key={opportunity.id}
                                hover
                                sx={{ 
                                  '&:hover': { backgroundColor: alpha('#8b6cbc', 0.02) }
                                }}
                              >
                                <TableCell>
                                  <Box>
                                    <Typography variant="subtitle2" fontWeight={600}>
                                      {opportunity.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {opportunity.notes}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="subtitle2" fontWeight={600} color="success.main">
                                    {formatCurrency(opportunity.amount)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalendarIcon sx={{ 
                                      fontSize: 16, 
                                      color: getActualStatus(opportunity) === 'closed' ? 'error.main' : 'text.secondary' 
                                    }} />
                                    <Typography 
                                      variant="body2" 
                                      sx={{
                                        color: getActualStatus(opportunity) === 'closed' ? 'error.main' : 'text.primary',
                                        fontWeight: getActualStatus(opportunity) === 'closed' ? 600 : 400,
                                        textDecoration: getActualStatus(opportunity) === 'closed' ? 'line-through' : 'none'
                                      }}
                                    >
                                      {formatDate(opportunity.deadline)}
                                    </Typography>
                                    {getActualStatus(opportunity) === 'closed' && (
                                      <Chip 
                                        label="EXPIRED" 
                                        size="small" 
                                        color="error" 
                                        sx={{ 
                                          fontSize: '0.6rem', 
                                          height: 18,
                                          fontWeight: 600
                                        }} 
                                      />
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                                    {Array.isArray(opportunity.category) ? 
                                      opportunity.category.map((cat, index) => (
                                        <Chip 
                                          key={index}
                                          label={cat} 
                                          size="small" 
                                          variant="outlined"
                                          color="primary"
                                        />
                                      )) : (
                                        <Chip 
                                          label={opportunity.category} 
                                          size="small" 
                                          variant="outlined"
                                          color="primary"
                                        />
                                      )
                                    }
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Stack direction="column" spacing={0.5}>
                                    {Array.isArray(opportunity.eligibility) ? 
                                      opportunity.eligibility.map((elig, index) => (
                                        <Typography key={index} variant="body2" sx={{ fontSize: '0.85rem' }}>
                                          • {elig}
                                        </Typography>
                                      )) : (
                                        <Typography variant="body2">
                                          {opportunity.eligibility}
                                        </Typography>
                                      )
                                    }
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    icon={getStatusIcon(getActualStatus(opportunity))}
                                    label={getActualStatus(opportunity)}
                                    color={getStatusColor(getActualStatus(opportunity))}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Stack direction="row" spacing={1} justifyContent="center">
                                    <Tooltip title="View details">
                                      <IconButton 
                                        size="small" 
                                        sx={{ color: '#8b6cbc' }}
                                        onClick={() => handleViewOpportunity(opportunity)}
                                      >
                                        <ViewIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Edit opportunity">
                                      <IconButton 
                                        size="small" 
                                        sx={{ color: '#4caf50' }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete opportunity">
                                      <IconButton 
                                        size="small" 
                                        sx={{ color: '#f44336' }}
                                      >
                                        <DeleteIcon fontSize="small" />
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
            ))}
          </Box>

          {grantors.length === 0 && !loading && (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              backgroundColor: 'white',
              borderRadius: 3,
              border: '2px dashed #e0e0e0'
            }}>
              <AccountBalanceIcon sx={{ fontSize: 64, color: '#8b6cbc', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
                No grantors found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start by adding your first grantor organization
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddGrantor}
                sx={{
                  backgroundColor: '#8b6cbc',
                  '&:hover': { backgroundColor: '#7a5ba8' }
                }}
              >
                Add First Grantor
              </Button>
            </Box>
          )}
        </Container>
      </Box>

      {/* View Opportunity Details Dialog */}
      <Dialog 
        open={viewOpportunityDialog} 
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(139, 108, 188, 0.2)',
            border: '1px solid rgba(139, 108, 188, 0.1)',
            overflow: 'hidden',
          }
        }}
      >
        <Box sx={{ 
          background: selectedOpportunity && getActualStatus(selectedOpportunity) === 'closed' 
            ? 'linear-gradient(135deg, #f44336 0%, #e57373 100%)'
            : 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
          color: 'white',
          p: 3,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
          }} />
          <Box sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
          }} />
          <DialogTitle sx={{ 
            color: 'white', 
            fontWeight: 700, 
            fontSize: '1.5rem',
            p: 0,
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ViewIcon sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                  {selectedOpportunity?.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Grant Opportunity Details
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={getStatusIcon(selectedOpportunity ? getActualStatus(selectedOpportunity) : 'open')}
                label={selectedOpportunity ? getActualStatus(selectedOpportunity) : 'open'}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: 'white'
                  }
                }}
              />
              <IconButton 
                onClick={handleCloseViewDialog}
                sx={{ 
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
        </Box>
        
        <DialogContent sx={{ p: 4 }}>
          {selectedOpportunity && (
            <Grid container spacing={4}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2c3e50' }}>
                  Basic Information
                </Typography>
                <Paper sx={{ p: 3, borderRadius: 2, backgroundColor: '#f8f9fa' }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                        Grant Amount
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {formatCurrency(selectedOpportunity.amount)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                        Application Deadline
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon sx={{ 
                          fontSize: 16, 
                          color: getActualStatus(selectedOpportunity) === 'closed' ? 'error.main' : 'text.secondary' 
                        }} />
                        <Typography 
                          variant="h6" 
                          sx={{
                            fontWeight: 600,
                            color: getActualStatus(selectedOpportunity) === 'closed' ? 'error.main' : 'text.primary',
                            textDecoration: getActualStatus(selectedOpportunity) === 'closed' ? 'line-through' : 'none'
                          }}
                        >
                          {formatDate(selectedOpportunity.deadline)}
                        </Typography>
                        {getActualStatus(selectedOpportunity) === 'closed' && (
                          <Chip 
                            label="EXPIRED" 
                            size="small" 
                            color="error" 
                            sx={{ 
                              fontSize: '0.6rem', 
                              height: 18,
                              fontWeight: 600
                            }} 
                          />
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Categories and Eligibility */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2c3e50' }}>
                  Categories
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                  {Array.isArray(selectedOpportunity.category) ? 
                    selectedOpportunity.category.map((cat, index) => (
                      <Chip 
                        key={index}
                        label={cat} 
                        variant="outlined"
                        color="primary"
                        sx={{ borderRadius: 2 }}
                      />
                    )) : (
                      <Chip 
                        label={selectedOpportunity.category} 
                        variant="outlined"
                        color="primary"
                        sx={{ borderRadius: 2 }}
                      />
                    )
                  }
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2c3e50' }}>
                  Eligibility Criteria
                </Typography>
                <Stack spacing={1}>
                  {Array.isArray(selectedOpportunity.eligibility) ? 
                    selectedOpportunity.eligibility.map((elig, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography variant="body2">
                          {elig}
                        </Typography>
                      </Box>
                    )) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography variant="body2">
                          {selectedOpportunity.eligibility}
                        </Typography>
                      </Box>
                    )
                  }
                </Stack>
              </Grid>

              {/* Notes/Description */}
              {selectedOpportunity.notes && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2c3e50' }}>
                    Notes & Description
                  </Typography>
                  <Paper sx={{ p: 3, borderRadius: 2, backgroundColor: '#f8f9fa' }}>
                    <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                      {selectedOpportunity.notes}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {/* Grantor Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2c3e50' }}>
                  Grantor Information
                </Typography>
                <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                  {grantors.map(grantor => 
                    grantor.opportunities.some(op => op.id === selectedOpportunity.id) ? (
                      <Box key={grantor.id}>
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: '#8b6cbc',
                            width: 48,
                            height: 48,
                            fontSize: '1.1rem'
                          }}>
                            {grantor.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {grantor.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {grantor.type} • {grantor.country}
                            </Typography>
                          </Box>
                        </Stack>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                              Focus Areas
                            </Typography>
                            <Typography variant="body2">
                              {grantor.focus?.join(', ')}
                            </Typography>
                          </Grid>
                          {grantor.contactPerson && (
                            <Grid item xs={12} md={6}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                                Contact Person
                              </Typography>
                              <Typography variant="body2">
                                {grantor.contactPerson}
                              </Typography>
                              {grantor.email && (
                                <Typography variant="body2" color="primary.main">
                                  {grantor.email}
                                </Typography>
                              )}
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    ) : null
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2, backgroundColor: '#f8f9fa' }}>
          <Button 
            onClick={handleCloseViewDialog}
            variant="outlined"
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              borderColor: '#8b6cbc',
              color: '#8b6cbc',
              '&:hover': {
                borderColor: '#7a5ba8',
                backgroundColor: 'rgba(139, 108, 188, 0.08)',
              }
            }}
          >
            Close
          </Button>
          <Button 
            variant="contained"
            startIcon={<EditIcon />}
            sx={{ 
              backgroundColor: '#8b6cbc',
              borderRadius: 2,
              px: 3,
              py: 1.5,
              '&:hover': { 
                backgroundColor: '#7a5ba8',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Edit Opportunity
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Grantor Dialog */}
      <Dialog 
        open={addGrantorDialog} 
        onClose={handleCloseGrantorDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(139, 108, 188, 0.2)',
            border: '1px solid rgba(139, 108, 188, 0.1)',
            overflow: 'hidden',
          }
        }}
      >
        <Box sx={{ 
          background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
          color: 'white',
          p: 3,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
          }} />
          <Box sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
          }} />
          <DialogTitle sx={{ 
            color: 'white', 
            fontWeight: 700, 
            fontSize: '1.5rem',
            p: 0,
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <BusinessIcon sx={{ fontSize: 28 }} />
            {selectedGrantor ? 'Edit Grantor Details' : 'Add New Grantor'}
          </DialogTitle>
          <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
            {selectedGrantor ? 'Update the details below' : 'Fill in the details below to get started'}
          </Typography>
        </Box>
        
        <DialogContent sx={{ p: 4, pt: 3 }}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label="Name"
                placeholder="Enter grantor name"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f8f9fa',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#8b6cbc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc',
                    },
                  },
                }}
                value={grantorForm.name}
                onChange={(e) => setGrantorForm(prev => ({ ...prev, name: e.target.value }))}
              />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select 
                  label="Type"
                  sx={{
                    borderRadius: 2,
                    backgroundColor: '#f8f9fa',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                  }}
                  value={grantorForm.type}
                  onChange={(e) => setGrantorForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="federal">Federal Agency</MenuItem>
                  <MenuItem value="private">Private Foundation</MenuItem>
                  <MenuItem value="nonprofit">Non-Profit</MenuItem>
                  <MenuItem value="corporate">Corporate</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <FormControl fullWidth>
              <InputLabel>Focus Areas</InputLabel>
              <Select
                multiple
                label="Focus Areas"
                value={grantorForm.focus}
                onChange={(e) => setGrantorForm(prev => ({ ...prev, focus: e.target.value }))}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={value} 
                        size="small"
                        sx={{
                          backgroundColor: alpha('#8b6cbc', 0.1),
                          color: '#8b6cbc',
                          fontWeight: 500,
                        }}
                      />
                    ))}
                  </Box>
                )}
                sx={{
                  borderRadius: 2,
                  backgroundColor: '#f8f9fa',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#8b6cbc',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#8b6cbc',
                  },
                }}
              >
                <MenuItem value="Biomedical Research">Biomedical Research</MenuItem>
                <MenuItem value="Basic Research">Basic Research</MenuItem>
                <MenuItem value="Innovation & Technology">Innovation & Technology</MenuItem>
                <MenuItem value="Healthcare">Healthcare</MenuItem>
                <MenuItem value="Education">Education</MenuItem>
                <MenuItem value="Environmental Science">Environmental Science</MenuItem>
                <MenuItem value="Social Sciences">Social Sciences</MenuItem>
                <MenuItem value="Engineering">Engineering</MenuItem>
                <MenuItem value="Computer Science">Computer Science</MenuItem>
                <MenuItem value="Agriculture">Agriculture</MenuItem>
                <MenuItem value="Public Health">Public Health</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label="Contact Person"
                placeholder="Enter primary contact name"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f8f9fa',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#8b6cbc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc',
                    },
                  },
                }}
                value={grantorForm.contactPerson}
                onChange={(e) => setGrantorForm(prev => ({ ...prev, contactPerson: e.target.value }))}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                placeholder="contact@organization.com"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f8f9fa',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#8b6cbc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc',
                    },
                  },
                }}
                value={grantorForm.email}
                onChange={(e) => setGrantorForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label="Phone"
                placeholder="(555) 123-4567"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f8f9fa',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#8b6cbc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc',
                    },
                  },
                }}
                value={grantorForm.phone}
                onChange={(e) => setGrantorForm(prev => ({ ...prev, phone: e.target.value }))}
              />
              <FormControl fullWidth>
                <InputLabel>Country</InputLabel>
                <Select 
                  label="Country"
                  sx={{
                    borderRadius: 2,
                    backgroundColor: '#f8f9fa',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                  }}
                  value={grantorForm.country}
                  onChange={(e) => setGrantorForm(prev => ({ ...prev, country: e.target.value }))}
                >
                  <MenuItem value="United States">United States</MenuItem>
                  <MenuItem value="United Kingdom">United Kingdom</MenuItem>
                  <MenuItem value="Canada">Canada</MenuItem>
                  <MenuItem value="Australia">Australia</MenuItem>
                  <MenuItem value="Germany">Germany</MenuItem>
                  <MenuItem value="France">France</MenuItem>
                  <MenuItem value="Japan">Japan</MenuItem>
                  <MenuItem value="China">China</MenuItem>
                  <MenuItem value="India">India</MenuItem>
                  <MenuItem value="Brazil">Brazil</MenuItem>
                  <MenuItem value="Kenya">Kenya</MenuItem>
                  <MenuItem value="South Africa">South Africa</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes"
              placeholder="Enter additional notes or description"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#f8f9fa',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#8b6cbc',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b6cbc',
                  },
                },
              }}
              value={grantorForm.notes}
              onChange={(e) => setGrantorForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 4, 
          pt: 3,
          gap: 2, 
          justifyContent: 'flex-end',
          backgroundColor: '#fafafa',
          borderTop: '1px solid #e0e0e0'
        }}>
          <Button 
            onClick={handleCloseGrantorDialog}
            disabled={saving}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              color: '#666',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#f0f0f0',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveGrantor}
            disabled={saving || !grantorForm.name || !grantorForm.type || !grantorForm.country}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            sx={{ 
              backgroundColor: '#8b6cbc',
              borderRadius: 2,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.3)',
              '&:hover': { 
                backgroundColor: '#7a5ba8',
                boxShadow: '0 4px 12px rgba(139, 108, 188, 0.4)',
              },
              '&:disabled': {
                backgroundColor: '#ccc',
                boxShadow: 'none',
              }
            }}
          >
            {saving ? 'Saving...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Opportunity Dialog */}
      <Dialog 
        open={addOpportunityDialog} 
        onClose={handleCloseOpportunityDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(139, 108, 188, 0.2)',
            border: '1px solid rgba(139, 108, 188, 0.1)',
            overflow: 'hidden',
          }
        }}
      >
        <Box sx={{ 
          background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
          color: 'white',
          p: 3,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
          }} />
          <Box sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
          }} />
          <DialogTitle sx={{ 
            color: 'white', 
            fontWeight: 700, 
            fontSize: '1.5rem',
            p: 0,
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <WorkIcon sx={{ fontSize: 28 }} />
            {selectedOpportunity ? 'Edit Opportunity Details' : `Add New Opportunity for ${selectedGrantor ? selectedGrantor.name : ''}`}
          </DialogTitle>
          <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
            {selectedOpportunity ? 'Update the details below' : 'Fill in the details below to get started'}
          </Typography>
        </Box>
        
        <DialogContent sx={{ p: 4, pt: 3 }}>
          <Stack spacing={3}>
            {!opportunityForm.grantorId && (
              <FormControl fullWidth>
                <InputLabel>Select Grantor</InputLabel>
                <Select 
                  label="Select Grantor"
                  value={opportunityForm.grantorId}
                  onChange={(e) => setOpportunityForm(prev => ({ ...prev, grantorId: e.target.value }))}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: '#f8f9fa',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                  }}
                >
                  {grantors.map((grantor) => (
                    <MenuItem key={grantor.id} value={grantor.id}>
                      {grantor.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label="Title"
                placeholder="Enter opportunity title"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f8f9fa',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#8b6cbc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc',
                    },
                  },
                }}
                value={opportunityForm.title}
                onChange={(e) => setOpportunityForm(prev => ({ ...prev, title: e.target.value }))}
              />
              <TextField
                fullWidth
                label="Grant Amount"
                placeholder="Enter grant amount"
                variant="outlined"
                type="number"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f8f9fa',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#8b6cbc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc',
                    },
                  },
                }}
                value={opportunityForm.amount}
                onChange={(e) => setOpportunityForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label="Deadline"
                type="date"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f8f9fa',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#8b6cbc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc',
                    },
                  },
                }}
                value={opportunityForm.deadline}
                onChange={(e) => setOpportunityForm(prev => ({ ...prev, deadline: e.target.value }))}
              />
              <FormControl fullWidth>
                <InputLabel>Categories</InputLabel>
                <Select 
                  label="Categories"
                  multiple
                  value={opportunityForm.category}
                  onChange={(e) => setOpportunityForm(prev => ({ ...prev, category: e.target.value }))}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={value} 
                          size="small"
                          sx={{
                            backgroundColor: alpha('#8b6cbc', 0.1),
                            color: '#8b6cbc',
                            fontWeight: 500,
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: '#f8f9fa',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                  }}
                >
                  <MenuItem value="Research Project">Research Project</MenuItem>
                  <MenuItem value="Career Development">Career Development</MenuItem>
                  <MenuItem value="Exploratory Research">Exploratory Research</MenuItem>
                  <MenuItem value="Innovation">Innovation</MenuItem>
                  <MenuItem value="Investigator Award">Investigator Award</MenuItem>
                  <MenuItem value="Research Grant">Research Grant</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <FormControl fullWidth>
              <InputLabel>Eligibility Criteria</InputLabel>
              <Select 
                label="Eligibility Criteria"
                multiple
                value={opportunityForm.eligibility}
                onChange={(e) => setOpportunityForm(prev => ({ ...prev, eligibility: e.target.value }))}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={value} 
                        size="small"
                        sx={{
                          backgroundColor: alpha('#8b6cbc', 0.1),
                          color: '#8b6cbc',
                          fontWeight: 500,
                        }}
                      />
                    ))}
                  </Box>
                )}
                sx={{
                  borderRadius: 2,
                  backgroundColor: '#f8f9fa',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#8b6cbc',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#8b6cbc',
                  },
                }}
              >
                <MenuItem value="Early Stage Investigator">Early Stage Investigator</MenuItem>
                <MenuItem value="Assistant Professor">Assistant Professor</MenuItem>
                <MenuItem value="Established Researcher">Established Researcher</MenuItem>
                <MenuItem value="Postdoctoral Fellow">Postdoctoral Fellow</MenuItem>
                <MenuItem value="Healthcare Innovators">Healthcare Innovators</MenuItem>
                <MenuItem value="All Career Levels">All Career Levels</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes"
              placeholder="Enter additional notes or description"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#f8f9fa',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#8b6cbc',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b6cbc',
                  },
                },
              }}
              value={opportunityForm.notes}
              onChange={(e) => setOpportunityForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 4, 
          pt: 3,
          gap: 2, 
          justifyContent: 'flex-end',
          backgroundColor: '#fafafa',
          borderTop: '1px solid #e0e0e0'
        }}>
          <Button 
            onClick={handleCloseOpportunityDialog}
            disabled={saving}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              color: '#666',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#f0f0f0',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveOpportunity}
            disabled={saving || !opportunityForm.title || !opportunityForm.amount || !opportunityForm.deadline || !opportunityForm.grantorId}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            sx={{ 
              backgroundColor: '#8b6cbc',
              borderRadius: 2,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.3)',
              '&:hover': { 
                backgroundColor: '#7a5ba8',
                boxShadow: '0 4px 12px rgba(139, 108, 188, 0.4)',
              },
              '&:disabled': {
                backgroundColor: '#ccc',
                boxShadow: 'none',
              }
            }}
          >
            {saving ? 'Saving...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GrantOpportunityTracking;