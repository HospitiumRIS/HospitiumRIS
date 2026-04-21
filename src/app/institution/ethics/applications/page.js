'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Button,
  Stack,
  Avatar,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Assignment as ApplicationIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Schedule as PendingIcon,
  RateReview as ReviewIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/components/AuthProvider';

const EthicsApplicationsPage = () => {
  const router = useRouter();
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading) {
      loadApplications();
    }
  }, [mounted, authLoading]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/institution/ethics/applications');
      
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      } else {
        showAlert('Failed to load ethics applications', 'error');
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      showAlert('Error loading ethics applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, severity = 'info') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'info' }), 5000);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleMenuOpen = (event, application) => {
    setAnchorEl(event.currentTarget);
    setSelectedApplication(application);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedApplication(null);
  };

  const handleView = (application) => {
    router.push(`/institution/ethics/review/${application.id}`);
    handleMenuClose();
  };

  const handleEdit = (application) => {
    router.push(`/institution/ethics/applications/${application.id}/edit`);
    handleMenuClose();
  };

  const handleDelete = async (application) => {
    if (confirm(`Are you sure you want to delete the application "${application.title}"?`)) {
      try {
        const response = await fetch(`/api/institution/ethics/applications/${application.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          showAlert('Application deleted successfully', 'success');
          loadApplications();
        } else {
          showAlert('Failed to delete application', 'error');
        }
      } catch (error) {
        console.error('Error deleting application:', error);
        showAlert('Error deleting application', 'error');
      }
    }
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'UNDER_REVIEW':
        return 'warning';
      case 'PENDING':
        return 'default';
      case 'REVISION_REQUIRED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return <ApprovedIcon fontSize="small" />;
      case 'REJECTED':
        return <RejectedIcon fontSize="small" />;
      case 'UNDER_REVIEW':
        return <ReviewIcon fontSize="small" />;
      case 'PENDING':
        return <PendingIcon fontSize="small" />;
      default:
        return <ApplicationIcon fontSize="small" />;
    }
  };

  const formatDate = (dateString) => {
    if (!mounted || !dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filterApplications = () => {
    let filtered = applications;

    // Filter by tab
    if (selectedTab === 1) {
      filtered = filtered.filter(app => app.status === 'PENDING');
    } else if (selectedTab === 2) {
      filtered = filtered.filter(app => app.status === 'UNDER_REVIEW');
    } else if (selectedTab === 3) {
      filtered = filtered.filter(app => app.status === 'APPROVED');
    } else if (selectedTab === 4) {
      filtered = filtered.filter(app => app.status === 'REJECTED' || app.status === 'REVISION_REQUIRED');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.principalInvestigator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getTabCounts = () => {
    return {
      all: applications.length,
      pending: applications.filter(app => app.status === 'PENDING').length,
      underReview: applications.filter(app => app.status === 'UNDER_REVIEW').length,
      approved: applications.filter(app => app.status === 'APPROVED').length,
      other: applications.filter(app => app.status === 'REJECTED' || app.status === 'REVISION_REQUIRED').length
    };
  };

  const filteredApplications = filterApplications();
  const tabCounts = getTabCounts();

  if (!mounted || authLoading) {
    return null;
  }

  return (
    <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
      <PageHeader
        title="Ethics Applications"
        description="Review and manage research ethics applications"
        gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Alert */}
        {alert.show && (
          <Alert severity={alert.severity} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setAlert({ ...alert, show: false })}>
            {alert.message}
          </Alert>
        )}

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <Paper sx={{ flex: '1 1 200px', p: 2.5, borderRadius: 2, bgcolor: '#667eea', color: 'white' }}>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>Total Applications</Typography>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>{applications.length}</Typography>
          </Paper>
          <Paper sx={{ flex: '1 1 200px', p: 2.5, borderRadius: 2, bgcolor: '#f59e0b', color: 'white' }}>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>Under Review</Typography>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>{tabCounts.underReview}</Typography>
          </Paper>
          <Paper sx={{ flex: '1 1 200px', p: 2.5, borderRadius: 2, bgcolor: '#10b981', color: 'white' }}>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>Approved</Typography>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>{tabCounts.approved}</Typography>
          </Paper>
          <Paper sx={{ flex: '1 1 200px', p: 2.5, borderRadius: 2, bgcolor: '#6b7280', color: 'white' }}>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>Pending</Typography>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>{tabCounts.pending}</Typography>
          </Paper>
        </Box>

        {/* Actions Bar */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flex: '1 1 300px' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadApplications}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/researcher/ethics/new')}
            >
              New Application
            </Button>
          </Stack>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label={
              <Badge badgeContent={tabCounts.all} color="primary">
                <span style={{ marginRight: 8 }}>All</span>
              </Badge>
            } />
            <Tab label={
              <Badge badgeContent={tabCounts.pending} color="default">
                <span style={{ marginRight: 8 }}>Pending</span>
              </Badge>
            } />
            <Tab label={
              <Badge badgeContent={tabCounts.underReview} color="warning">
                <span style={{ marginRight: 8 }}>Under Review</span>
              </Badge>
            } />
            <Tab label={
              <Badge badgeContent={tabCounts.approved} color="success">
                <span style={{ marginRight: 8 }}>Approved</span>
              </Badge>
            } />
            <Tab label={
              <Badge badgeContent={tabCounts.other} color="error">
                <span style={{ marginRight: 8 }}>Other</span>
              </Badge>
            } />
          </Tabs>
        </Paper>

        {/* Applications Table */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {loading && <LinearProgress />}
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#8b6cbc' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Application #</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Principal Investigator</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Submitted</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">
                        No applications found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((application) => (
                    <TableRow key={application.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="primary">
                          {application.applicationNumber || application.id.slice(0, 8).toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {application.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body2">
                            {application.principalInvestigator || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(application.submittedDate || application.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(application.status)}
                          label={application.status?.replace(/_/g, ' ')}
                          color={getStatusColor(application.status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleView(application)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, application)}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleView(selectedApplication)}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleEdit(selectedApplication)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleDelete(selectedApplication)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </Container>
    </Box>
  );
};

export default EthicsApplicationsPage;
