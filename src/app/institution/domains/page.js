'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
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
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Domain as DomainIcon,
  Block as BlockIcon,
  Info as InfoIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

export default function InstitutionDomainsPage() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    domain: '',
    autoApproveUsers: true,
    notes: '',
  });

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/institution-admin/verified-domains');
      const data = await response.json();
      if (response.ok) {
        setDomains(data.domains || []);
      } else {
        setError(data.error || 'Failed to load domains');
      }
    } catch (err) {
      console.error('Error fetching domains:', err);
      setError('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (domain = null) => {
    setError('');
    setSuccess('');
    if (domain) {
      setEditingDomain(domain);
      setFormData({
        domain: domain.domain,
        autoApproveUsers: domain.autoApproveUsers,
        notes: domain.notes || '',
      });
    } else {
      setEditingDomain(null);
      setFormData({ domain: '', autoApproveUsers: true, notes: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDomain(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.domain.trim()) {
      setError('Domain is required');
      return;
    }

    try {
      const url = editingDomain
        ? `/api/institution-admin/verified-domains/${editingDomain.id}`
        : '/api/institution-admin/verified-domains';
      const method = editingDomain ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: editingDomain ? undefined : 'VERIFIED',
          verificationMethod: 'MANUAL',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(editingDomain ? 'Domain updated' : 'Domain added - researchers with this email domain will now link automatically');
        handleCloseDialog();
        fetchDomains();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.error || 'Failed to save domain');
      }
    } catch (err) {
      console.error('Error saving domain:', err);
      setError('Failed to save domain');
    }
  };

  const handleDelete = async (domainId) => {
    if (!confirm('Remove this domain? Researchers will no longer auto-link via this domain.')) return;

    try {
      const response = await fetch(`/api/institution-admin/verified-domains/${domainId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setSuccess('Domain removed');
        fetchDomains();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to remove domain');
      }
    } catch (err) {
      console.error('Error removing domain:', err);
      setError('Failed to remove domain');
    }
  };

  const handleVerify = async (domainId) => {
    try {
      const response = await fetch(`/api/institution-admin/verified-domains/${domainId}/verify`, {
        method: 'POST',
      });
      if (response.ok) {
        setSuccess('Domain verified');
        fetchDomains();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to verify domain');
      }
    } catch (err) {
      console.error('Error verifying domain:', err);
      setError('Failed to verify domain');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED': return 'success';
      case 'PENDING': return 'warning';
      case 'SUSPENDED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'VERIFIED': return <CheckCircleIcon fontSize="small" />;
      case 'PENDING': return <InfoIcon fontSize="small" />;
      case 'SUSPENDED': return <BlockIcon fontSize="small" />;
      default: return null;
    }
  };

  return (
    <>
      <PageHeader
        title="Verified Domains"
        description="Email domains that automatically link new researchers to your institution"
        icon={<DomainIcon sx={{ fontSize: 40 }} />}
        breadcrumbs={[
          { label: 'Home', path: '/institution', icon: <HomeIcon /> },
          { label: 'Verified Domains' },
        ]}
        actionButton={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: '#8b6cbc',
              '&:hover': { backgroundColor: '#7a5caa' },
            }}
          >
            Add Domain
          </Button>
        }
      />
      <Container maxWidth="xl" sx={{ py: 4 }}>
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

        <Alert severity="info" sx={{ mb: 3 }}>
          Anyone who registers with an email ending in one of these domains is automatically
          linked to your institution and can see your published trainings. You don't need to
          add your own domain manually - it was seeded automatically when your account was created.
        </Alert>

        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Domain</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Auto-link</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Added</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        Loading domains...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : domains.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Box sx={{ py: 4 }}>
                        <DomainIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                          No domains yet
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  domains.map((domain) => (
                    <TableRow key={domain.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DomainIcon sx={{ color: 'primary.main', fontSize: 18 }} />
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
                        <Typography variant="body2" color="text.secondary">
                          {new Date(domain.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          {domain.status === 'PENDING' && (
                            <Tooltip title="Verify domain">
                              <IconButton size="small" onClick={() => handleVerify(domain.id)} sx={{ color: 'success.main' }}>
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpenDialog(domain)} sx={{ color: 'primary.main' }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove">
                            <IconButton size="small" onClick={() => handleDelete(domain.id)} sx={{ color: 'error.main' }}>
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

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingDomain ? 'Edit Domain' : 'Add Domain'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="ascensiondynamics.co"
                fullWidth
                disabled={!!editingDomain}
                helperText="Researchers who register with an email ending in this domain link automatically"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.autoApproveUsers}
                    onChange={(e) => setFormData({ ...formData, autoApproveUsers: e.target.checked })}
                  />
                }
                label="Auto-link users with this domain"
              />
              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={2}
                fullWidth
                placeholder="Optional notes"
              />
              {error && <Alert severity="error">{error}</Alert>}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{ backgroundColor: '#8b6cbc', '&:hover': { backgroundColor: '#7a5caa' } }}
            >
              {editingDomain ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
