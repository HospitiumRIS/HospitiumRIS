'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Tooltip,
  Avatar,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Verified as VerifiedIcon,
  Domain as DomainIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  Block as BlockIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import InstitutionAdminLayout from '../../../components/InstitutionAdmin/InstitutionAdminLayout';

const VerifiedDomainsPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    suspended: 0
  });

  const [formData, setFormData] = useState({
    domain: '',
    status: 'PENDING',
    autoApproveUsers: false,
    allowedAccountTypes: [],
    verificationMethod: 'MANUAL',
    notes: ''
  });

  const accountTypes = ['RESEARCHER', 'INSTITUTION', 'FOUNDATION', 'INSTITUTION_ADMIN'];
  const verificationMethods = ['MANUAL', 'DNS', 'EMAIL'];

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.accountType !== 'INSTITUTION_ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchDomains();
  }, [user, router, authLoading]);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/institution-admin/verified-domains');
      if (response.ok) {
        const data = await response.json();
        setDomains(data.domains || []);
        calculateStats(data.domains || []);
      } else {
        setError('Failed to fetch domains');
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
      setError('Error loading domains');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (domainsList) => {
    const stats = {
      total: domainsList.length,
      verified: domainsList.filter(d => d.status === 'VERIFIED').length,
      pending: domainsList.filter(d => d.status === 'PENDING').length,
      suspended: domainsList.filter(d => d.status === 'SUSPENDED').length
    };
    setStats(stats);
  };

  const handleOpenDialog = (domain = null) => {
    if (domain) {
      setEditingDomain(domain);
      setFormData({
        domain: domain.domain,
        status: domain.status,
        autoApproveUsers: domain.autoApproveUsers,
        allowedAccountTypes: domain.allowedAccountTypes || [],
        verificationMethod: domain.verificationMethod || 'MANUAL',
        notes: domain.notes || ''
      });
    } else {
      setEditingDomain(null);
      setFormData({
        domain: '',
        status: 'PENDING',
        autoApproveUsers: false,
        allowedAccountTypes: [],
        verificationMethod: 'MANUAL',
        notes: ''
      });
    }
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDomain(null);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      if (!formData.domain.trim()) {
        setError('Domain is required');
        return;
      }

      const url = editingDomain 
        ? `/api/institution-admin/verified-domains/${editingDomain.id}`
        : '/api/institution-admin/verified-domains';
      
      const method = editingDomain ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(editingDomain ? 'Domain updated successfully' : 'Domain added successfully');
        handleCloseDialog();
        fetchDomains();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to save domain');
      }
    } catch (error) {
      console.error('Error saving domain:', error);
      setError('Error saving domain');
    }
  };

  const handleDelete = async (domainId) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;

    try {
      const response = await fetch(`/api/institution-admin/verified-domains/${domainId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Domain deleted successfully');
        fetchDomains();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete domain');
      }
    } catch (error) {
      console.error('Error deleting domain:', error);
      setError('Error deleting domain');
    }
  };

  const handleVerify = async (domainId) => {
    try {
      const response = await fetch(`/api/institution-admin/verified-domains/${domainId}/verify`, {
        method: 'POST'
      });

      if (response.ok) {
        setSuccess('Domain verified successfully');
        fetchDomains();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to verify domain');
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      setError('Error verifying domain');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'SUSPENDED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircleIcon fontSize="small" />;
      case 'PENDING':
        return <InfoIcon fontSize="small" />;
      case 'SUSPENDED':
        return <BlockIcon fontSize="small" />;
      default:
        return null;
    }
  };

  if (!user || user.accountType !== 'INSTITUTION_ADMIN') {
    return null;
  }

  return (
    <InstitutionAdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ 
          mb: 4,
          pb: 3,
          borderBottom: '2px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 1,
                  background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em'
                }}
              >
                Verified Domains
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Manage email domains linked to your institution
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              Add Domain
            </Button>
          </Box>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.total}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Domains</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                    <DomainIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.verified}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Verified</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                    <VerifiedIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.pending}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Pending</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                    <InfoIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.suspended}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Suspended</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                    <BlockIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Domains Table */}
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Domain</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Auto-Approve</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Allowed Types</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Verification</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        Loading domains...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : domains.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box sx={{ py: 4 }}>
                        <DomainIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                          No verified domains yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Add your first domain to get started
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  domains.map((domain) => (
                    <TableRow 
                      key={domain.id}
                      sx={{ 
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DomainIcon sx={{ color: 'primary.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {domain.domain}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(domain.status)}
                          label={domain.status}
                          color={getStatusColor(domain.status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={domain.autoApproveUsers ? 'Yes' : 'No'}
                          color={domain.autoApproveUsers ? 'success' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {domain.allowedAccountTypes?.length > 0 ? (
                            domain.allowedAccountTypes.map((type) => (
                              <Chip
                                key={type}
                                label={type}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              None
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {domain.verificationMethod || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(domain.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          {domain.status === 'PENDING' && (
                            <Tooltip title="Verify domain">
                              <IconButton
                                size="small"
                                onClick={() => handleVerify(domain.id)}
                                sx={{ color: 'success.main' }}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(domain)}
                              sx={{ color: 'primary.main' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(domain.id)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Add/Edit Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingDomain ? 'Edit Domain' : 'Add New Domain'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="example.edu"
                fullWidth
                disabled={!!editingDomain}
                helperText="Enter the email domain (e.g., university.edu)"
              />

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="VERIFIED">Verified</MenuItem>
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Verification Method</InputLabel>
                <Select
                  value={formData.verificationMethod}
                  onChange={(e) => setFormData({ ...formData, verificationMethod: e.target.value })}
                  label="Verification Method"
                >
                  {verificationMethods.map((method) => (
                    <MenuItem key={method} value={method}>{method}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Allowed Account Types</InputLabel>
                <Select
                  multiple
                  value={formData.allowedAccountTypes}
                  onChange={(e) => setFormData({ ...formData, allowedAccountTypes: e.target.value })}
                  label="Allowed Account Types"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {accountTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.autoApproveUsers}
                    onChange={(e) => setFormData({ ...formData, autoApproveUsers: e.target.checked })}
                  />
                }
                label="Auto-approve users with this domain"
              />

              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={3}
                fullWidth
                placeholder="Optional notes about this domain"
              />

              {error && (
                <Alert severity="error">{error}</Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)'
              }}
            >
              {editingDomain ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </InstitutionAdminLayout>
  );
};

export default VerifiedDomainsPage;
