'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Domain as DomainIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import InstitutionAdminLayout from '../../../components/InstitutionAdmin/InstitutionAdminLayout';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '../../../components/GlobalAdmin/InstitutionModalShell';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7a5caa';

const STATUS_TONE = {
  VERIFIED: { bg: alpha(PURPLE, 0.12), color: PURPLE_DARK, label: 'Verified', icon: CheckCircleIcon },
  PENDING: { bg: '#fef3c7', color: '#b45309', label: 'Pending', icon: InfoIcon },
  SUSPENDED: { bg: '#fee2e2', color: '#b91c1c', label: 'Suspended', icon: BlockIcon },
};

const ALLOWED_ACCOUNT_TYPES = [
  { value: 'RESEARCHER', label: 'Researcher' },
  { value: 'RESEARCH_ADMIN', label: 'Research Admin' },
  { value: 'INSTITUTION_ADMIN', label: 'Institution Admin' },
];

const VERIFICATION_METHODS = ['MANUAL', 'DNS', 'EMAIL'];

const emptyForm = {
  domain: '',
  status: 'PENDING',
  autoApproveUsers: false,
  allowedAccountTypes: [],
  verificationMethod: 'MANUAL',
  notes: '',
};

const fieldSx = { '& .MuiInputBase-root': { borderRadius: 1.5 } };

function PageHeading({ title, subtitle, action }) {
  return (
    <Box
      sx={{
        mb: 3,
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        border: `1px solid ${alpha(PURPLE, 0.12)}`,
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Box>
          <Typography variant="overline" sx={{ color: alpha(PURPLE, 0.75), fontWeight: 700, letterSpacing: '0.08em' }}>
            Institution Admin
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mt: 0.25 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        </Box>
        {action}
      </Stack>
    </Box>
  );
}

function StatCard({ label, value, caption, icon: Icon, active = false, onClick }) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        px: 2,
        py: 1.25,
        borderRadius: 2,
        cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${alpha(PURPLE, active ? 0.28 : 0.12)}`,
        bgcolor: active ? alpha(PURPLE, 0.08) : 'background.paper',
        transition: 'border-color 0.2s ease, background-color 0.2s ease',
        '&:hover': onClick ? { bgcolor: alpha(PURPLE, 0.06), borderColor: alpha(PURPLE, 0.22) } : {},
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(PURPLE, 0.12),
            color: PURPLE,
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 18 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
            <Typography variant="caption" noWrap sx={{ color: alpha(PURPLE, 0.7), fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: PURPLE_DARK, lineHeight: 1 }}>
              {value}
            </Typography>
          </Stack>
          {caption ? (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: 0.25 }}>
              {caption}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Paper>
  );
}

function StatusChip({ status }) {
  const tone = STATUS_TONE[status] || STATUS_TONE.PENDING;
  const Icon = tone.icon;
  return (
    <Chip
      icon={<Icon sx={{ fontSize: '14px !important' }} />}
      label={tone.label}
      size="small"
      sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700, height: 24, '& .MuiChip-icon': { color: 'inherit' } }}
    />
  );
}

function normalizeDomain(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
}

const VerifiedDomainsPage = () => {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.accountType !== 'INSTITUTION_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    if (user?.accountType === 'INSTITUTION_ADMIN') {
      fetchDomains();
    }
  }, [user]);

  const showNotice = (message, severity = 'success') => {
    setNotice({ open: true, message, severity });
  };

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/institution-admin/verified-domains', { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) {
        showNotice(data.error || 'Failed to fetch domains', 'error');
        return;
      }
      setDomains(data.domains || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
      showNotice('Failed to load domains', 'error');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => ({
    total: domains.length,
    verified: domains.filter((d) => d.status === 'VERIFIED').length,
    pending: domains.filter((d) => d.status === 'PENDING').length,
    suspended: domains.filter((d) => d.status === 'SUSPENDED').length,
  }), [domains]);

  const filteredDomains = useMemo(() => {
    const query = search.trim().toLowerCase();
    return domains.filter((domain) => {
      if (statusFilter && domain.status !== statusFilter) return false;
      if (!query) return true;
      return (
        domain.domain?.toLowerCase().includes(query)
        || domain.notes?.toLowerCase().includes(query)
        || domain.verificationMethod?.toLowerCase().includes(query)
      );
    });
  }, [domains, search, statusFilter]);

  const handleOpenDialog = (domain = null) => {
    if (domain) {
      setEditingDomain(domain);
      setFormData({
        domain: domain.domain,
        status: domain.status,
        autoApproveUsers: domain.autoApproveUsers,
        allowedAccountTypes: domain.allowedAccountTypes || [],
        verificationMethod: domain.verificationMethod || 'MANUAL',
        notes: domain.notes || '',
      });
    } else {
      setEditingDomain(null);
      setFormData(emptyForm);
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const normalizedDomain = normalizeDomain(formData.domain);
    if (!normalizedDomain) {
      setFormError('Domain is required');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const url = editingDomain
        ? `/api/institution-admin/verified-domains/${editingDomain.id}`
        : '/api/institution-admin/verified-domains';
      const method = editingDomain ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, domain: normalizedDomain }),
      });
      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || 'Failed to save domain');
        return;
      }

      showNotice(editingDomain ? 'Domain updated' : 'Domain added');
      setDialogOpen(false);
      fetchDomains();
    } catch (error) {
      console.error('Error saving domain:', error);
      setFormError('Failed to save domain');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOpen = (domain) => {
    setSelectedDomain(domain);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedDomain) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/institution-admin/verified-domains/${selectedDomain.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        showNotice(data.error || 'Failed to delete domain', 'error');
        return;
      }
      showNotice('Domain deleted');
      setDeleteDialogOpen(false);
      fetchDomains();
    } catch (error) {
      console.error('Error deleting domain:', error);
      showNotice('Failed to delete domain', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (domainId) => {
    try {
      const response = await fetch(`/api/institution-admin/verified-domains/${domainId}/verify`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        showNotice(data.error || 'Failed to verify domain', 'error');
        return;
      }
      showNotice('Domain verified');
      fetchDomains();
    } catch (error) {
      console.error('Error verifying domain:', error);
      showNotice('Failed to verify domain', 'error');
    }
  };

  const applyStatusFilter = (status) => {
    setStatusFilter((current) => (current === status ? '' : status));
  };

  if (!user || user.accountType !== 'INSTITUTION_ADMIN') {
    return null;
  }

  return (
    <InstitutionAdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
        <PageHeading
          title={t('institution_admin.verified_domains', { defaultValue: 'Verified Domains' })}
          subtitle="Control which email domains can be linked to your institution."
          action={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchDomains}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: alpha(PURPLE, 0.35),
                  color: PURPLE_DARK,
                  '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) },
                }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{
                  bgcolor: PURPLE,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: PURPLE_DARK },
                }}
              >
                Add domain
              </Button>
            </Stack>
          )}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3 }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={68} sx={{ borderRadius: 2 }} />
            ))
          ) : (
            <>
              <StatCard label="Total domains" value={stats.total} caption="Registered for your institution" icon={DomainIcon} active={!statusFilter} onClick={() => setStatusFilter('')} />
              <StatCard label="Verified" value={stats.verified} caption="Ready for user matching" icon={VerifiedIcon} active={statusFilter === 'VERIFIED'} onClick={() => applyStatusFilter('VERIFIED')} />
              <StatCard label="Pending" value={stats.pending} caption="Awaiting verification" icon={InfoIcon} active={statusFilter === 'PENDING'} onClick={() => applyStatusFilter('PENDING')} />
              <StatCard label="Suspended" value={stats.suspended} caption="Blocked from use" icon={BlockIcon} active={statusFilter === 'SUSPENDED'} onClick={() => applyStatusFilter('SUSPENDED')} />
            </>
          )}
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}`, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(PURPLE, 0.1)}` }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search domains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={fieldSx}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
              {loading ? 'Loading...' : `${filteredDomains.length} domain${filteredDomains.length === 1 ? '' : 's'} shown`}
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ p: 2 }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} variant="rounded" height={52} sx={{ mb: 1, borderRadius: 1.5 }} />
              ))}
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(PURPLE, 0.04) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Domain</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Auto-approve</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Allowed types</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Verification</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDomains.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                        <Stack spacing={1.5} alignItems="center">
                          <DomainIcon sx={{ fontSize: 40, color: alpha(PURPLE, 0.45) }} />
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {search || statusFilter ? 'No matching domains' : 'No verified domains yet'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {search || statusFilter ? 'Try adjusting your search or filters.' : 'Add an email domain to link users to your institution.'}
                          </Typography>
                          {!search && !statusFilter ? (
                            <Button
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={() => handleOpenDialog()}
                              sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: PURPLE_DARK } }}
                            >
                              Add domain
                            </Button>
                          ) : null}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDomains.map((domain) => (
                      <TableRow key={domain.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <DomainIcon sx={{ color: PURPLE, fontSize: 18 }} />
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{domain.domain}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell><StatusChip status={domain.status} /></TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={domain.autoApproveUsers ? 'Yes' : 'No'}
                            sx={{
                              fontWeight: 600,
                              bgcolor: domain.autoApproveUsers ? alpha(PURPLE, 0.12) : '#f1f5f9',
                              color: domain.autoApproveUsers ? PURPLE_DARK : '#475569',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                            {(domain.allowedAccountTypes || []).length > 0 ? (
                              domain.allowedAccountTypes.map((type) => (
                                <Chip key={type} label={type.replaceAll('_', ' ')} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                              ))
                            ) : (
                              <Typography variant="caption" color="text.secondary">All types</Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{domain.verificationMethod || 'MANUAL'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(domain.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {domain.status === 'PENDING' ? (
                              <Tooltip title="Verify domain">
                                <IconButton
                                  size="small"
                                  onClick={() => handleVerify(domain.id)}
                                  sx={{ color: PURPLE, bgcolor: alpha(PURPLE, 0.1), '&:hover': { bgcolor: alpha(PURPLE, 0.16) } }}
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : null}
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(domain)}
                                sx={{ color: PURPLE_DARK, bgcolor: alpha(PURPLE, 0.08), '&:hover': { bgcolor: alpha(PURPLE, 0.14) } }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteOpen(domain)}
                                sx={{ color: '#b91c1c', bgcolor: alpha('#b91c1c', 0.08), '&:hover': { bgcolor: alpha('#b91c1c', 0.14) } }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      <InstitutionModal open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} disableClose={saving} maxWidth="sm">
        <InstitutionModalHeader
          icon={editingDomain ? EditIcon : AddIcon}
          title={editingDomain ? 'Edit domain' : 'Add domain'}
          subtitle={editingDomain ? editingDomain.domain : 'Register an email domain for your institution'}
          onClose={() => setDialogOpen(false)}
          disableClose={saving}
        />
        <InstitutionModalBody>
          {formError ? <Alert severity="error" sx={{ borderRadius: 1.5 }}>{formError}</Alert> : null}
          <InstitutionModalSection title="Domain details">
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="university.edu"
                disabled={Boolean(editingDomain)}
                helperText={editingDomain ? 'Domain name cannot be changed after creation' : 'Enter the email domain without @ (e.g. university.edu)'}
                sx={fieldSx}
              />
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel>Status</InputLabel>
                <Select value={formData.status} label="Status" onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="VERIFIED">Verified</MenuItem>
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel>Verification method</InputLabel>
                <Select
                  value={formData.verificationMethod}
                  label="Verification method"
                  onChange={(e) => setFormData({ ...formData, verificationMethod: e.target.value })}
                >
                  {VERIFICATION_METHODS.map((method) => (
                    <MenuItem key={method} value={method}>{method}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </InstitutionModalSection>
          <InstitutionModalSection title="Access rules">
            <Stack spacing={2}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel>Allowed account types</InputLabel>
                <Select
                  multiple
                  value={formData.allowedAccountTypes}
                  label="Allowed account types"
                  onChange={(e) => setFormData({ ...formData, allowedAccountTypes: e.target.value })}
                  renderValue={(selected) => (
                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                      {selected.map((value) => (
                        <Chip key={value} label={value.replaceAll('_', ' ')} size="small" />
                      ))}
                    </Stack>
                  )}
                >
                  {ALLOWED_ACCOUNT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={(
                  <Switch
                    checked={formData.autoApproveUsers}
                    onChange={(e) => setFormData({ ...formData, autoApproveUsers: e.target.checked })}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: PURPLE }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: PURPLE } }}
                  />
                )}
                label="Auto-approve users with this domain"
              />
              <TextField
                fullWidth
                size="small"
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                minRows={3}
                placeholder="Optional notes about this domain"
                sx={fieldSx}
              />
            </Stack>
          </InstitutionModalSection>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: PURPLE_DARK } }}
          >
            {saving ? 'Saving...' : editingDomain ? 'Save changes' : 'Add domain'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>

      <InstitutionModal open={deleteDialogOpen} onClose={() => !saving && setDeleteDialogOpen(false)} disableClose={saving}>
        <InstitutionModalHeader
          icon={DeleteIcon}
          title="Delete domain"
          subtitle="This action cannot be undone"
          tone="danger"
          onClose={() => setDeleteDialogOpen(false)}
          disableClose={saving}
        />
        <InstitutionModalBody>
          <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
            Remove <strong>{selectedDomain?.domain}</strong> from your institution?
          </Alert>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? 'Deleting...' : 'Delete domain'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>

      <Snackbar
        open={notice.open}
        autoHideDuration={5000}
        onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={notice.severity}
          onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: 2, width: '100%' }}
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </InstitutionAdminLayout>
  );
};

export default VerifiedDomainsPage;
