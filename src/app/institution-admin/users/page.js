'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Stack,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  CircularProgress,
  Tooltip,
  Snackbar,
  Skeleton,
  alpha,
} from '@mui/material';
import {
  People as UsersIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  Block as BlockIcon,
  Science as ResearcherIcon,
  AdminPanelSettings as AdminIcon,
  LockReset as LockResetIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import InstitutionAdminLayout from '../../../components/InstitutionAdmin/InstitutionAdminLayout';
import { PasswordFields } from '../../../components/GlobalAdmin/InstitutionManageDialogs';
import InstitutionAdminEmailField from '../../../components/GlobalAdmin/InstitutionAdminEmailField';
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
  ACTIVE: { bg: alpha(PURPLE, 0.12), color: PURPLE_DARK, label: 'Active', icon: CheckIcon },
  PENDING: { bg: '#fef3c7', color: '#b45309', label: 'Pending', icon: PendingIcon },
  INACTIVE: { bg: '#f1f5f9', color: '#475569', label: 'Inactive', icon: CancelIcon },
  SUSPENDED: { bg: '#fee2e2', color: '#b91c1c', label: 'Suspended', icon: BlockIcon },
};

const MANAGEABLE_ACCOUNT_TYPES = [
  { name: 'RESEARCHER', displayName: 'Researcher' },
  { name: 'RESEARCH_ADMIN', displayName: 'Research Admin' },
];

function formatUserName(userData) {
  return [userData?.givenName, userData?.familyName].filter(Boolean).join(' ');
}

function DetailField({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
        {value || '-'}
      </Typography>
    </Box>
  );
}

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

const emptyCreateForm = {
  givenName: '',
  familyName: '',
  email: '',
  accountType: 'RESEARCHER',
  orcidId: '',
  password: '',
  confirmPassword: '',
};

const UserManagementPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalUsers, setTotalUsers] = useState(0);
  
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });
  
  const [editForm, setEditForm] = useState({
    givenName: '',
    familyName: '',
    email: '',
    status: '',
    emailVerified: false,
    accountType: '',
    orcidId: '',
  });
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [institutionProfile, setInstitutionProfile] = useState(null);
  const [createError, setCreateError] = useState('');

  // Check Super Admin access
  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.accountType !== 'INSTITUTION_ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    if (user?.accountType !== 'INSTITUTION_ADMIN') return;

    fetch('/api/institution-admin/profile', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.institution) {
          setInstitutionProfile(data.institution);
        }
      })
      .catch((err) => console.error('Error loading institution profile:', err));
  }, [user]);

  const institutionForEmail = useMemo(() => {
    if (!institutionProfile) return null;
    return {
      contactEmail: institutionProfile.contactEmail,
      website: institutionProfile.website,
      domains: (institutionProfile.domains || []).filter((entry) => entry.status !== 'SUSPENDED'),
    };
  }, [institutionProfile]);

  const institutionTotal = useMemo(() => {
    const byStatus = stats.byStatus || {};
    return (byStatus.active || 0) + (byStatus.pending || 0) + (byStatus.inactive || 0) + (byStatus.suspended || 0);
  }, [stats.byStatus]);

  // Fetch users
  const fetchUsers = async (overrides = {}) => {
    try {
      setLoading(true);

      const effectiveSearch = overrides.search !== undefined ? overrides.search : searchQuery;
      const effectiveStatus = overrides.status !== undefined ? overrides.status : statusFilter;
      const effectiveAccountType = overrides.accountType !== undefined ? overrides.accountType : accountTypeFilter;
      const effectivePage = overrides.page !== undefined ? overrides.page : page;

      const params = new URLSearchParams({
        page: (effectivePage + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(effectiveSearch && { search: effectiveSearch }),
        ...(effectiveStatus && { status: effectiveStatus }),
        ...(effectiveAccountType && { accountType: effectiveAccountType }),
      });

      const response = await fetch(`/api/institution-admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users || []);
        setTotalUsers(data.pagination?.total || 0);
        setStats(data.stats || {});
      } else {
        showAlert(data.message || 'Failed to fetch users', 'error');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showAlert('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.accountType !== 'INSTITUTION_ADMIN') return;
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, user]);

  useEffect(() => {
    if (user?.accountType === 'INSTITUTION_ADMIN') {
      fetchUsers();
    }
  }, [user, page, rowsPerPage, searchQuery, statusFilter, accountTypeFilter]);

  // Alert helper
  const showAlert = (message, severity = 'info') => {
    setAlert({ show: true, message, severity });
  };

  // Handle view user details
  const handleViewUser = (userData) => {
    setSelectedUser(userData);
    setDialogOpen(true);
  };

  useEffect(() => {
    const userId = searchParams.get('id');
    if (!userId || deepLinkHandled || loading || users.length === 0) return;
    const match = users.find((entry) => entry.id === userId);
    if (match) {
      handleViewUser(match);
      setDeepLinkHandled(true);
    }
  }, [searchParams, users, loading, deepLinkHandled]);

  // Handle edit user
  const handleEditUser = (userData) => {
    setSelectedUser(userData);
    setEditForm({
      givenName: userData.givenName || '',
      familyName: userData.familyName || '',
      email: userData.email || '',
      status: userData.status || 'ACTIVE',
      emailVerified: Boolean(userData.emailVerified),
      accountType: userData.accountType,
      orcidId: userData.orcidId || '',
    });
    setEditDialogOpen(true);
  };

  const handleDeleteUser = (userData) => {
    setSelectedUser(userData);
    setDeleteDialogOpen(true);
  };

  const handlePasswordUser = (userData) => {
    setSelectedUser(userData);
    setPasswordForm({ password: '', confirmPassword: '' });
    setPasswordDialogOpen(true);
  };

  const handleSubmitEdit = async () => {
    if (!selectedUser) return;
    const isResearchAdmin = editForm.accountType === 'RESEARCH_ADMIN';
    if (!editForm.givenName.trim()) {
      showAlert(isResearchAdmin ? 'Name is required' : 'First and last name are required', 'error');
      return;
    }
    if (!isResearchAdmin && !editForm.familyName.trim()) {
      showAlert('First and last name are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/institution-admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          givenName: editForm.givenName.trim(),
          familyName: isResearchAdmin ? '' : editForm.familyName.trim(),
          email: editForm.email.trim(),
          status: editForm.status,
          emailVerified: editForm.emailVerified,
          accountType: editForm.accountType,
          orcidId: editForm.accountType === 'RESEARCHER' ? editForm.orcidId : '',
        })
      });

      const data = await response.json();

      if (data.success) {
        showAlert('User updated successfully', 'success');
        setEditDialogOpen(false);
        fetchUsers();
      } else {
        showAlert(data.message || 'Failed to update user', 'error');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showAlert('Failed to update user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/institution-admin/users/${selectedUser.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        showAlert('User deleted successfully', 'success');
        setDeleteDialogOpen(false);
        fetchUsers();
      } else {
        showAlert(data.message || 'Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showAlert('Failed to delete user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitCreate = async () => {
    setCreateError('');
    const isResearchAdmin = createForm.accountType === 'RESEARCH_ADMIN';
    if (!createForm.givenName.trim()) {
      const message = isResearchAdmin ? 'Name is required' : 'First and last name are required';
      setCreateError(message);
      showAlert(message, 'error');
      return;
    }
    if (!isResearchAdmin && !createForm.familyName.trim()) {
      const message = 'First and last name are required';
      setCreateError(message);
      showAlert(message, 'error');
      return;
    }
    if (!createForm.email.trim()) {
      const message = 'Email is required';
      setCreateError(message);
      showAlert(message, 'error');
      return;
    }
    if (!createForm.password || createForm.password.length < 8) {
      const message = 'Password must be at least 8 characters';
      setCreateError(message);
      showAlert(message, 'error');
      return;
    }
    if (createForm.password !== createForm.confirmPassword) {
      const message = 'Passwords do not match';
      setCreateError(message);
      showAlert(message, 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/institution-admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          givenName: createForm.givenName.trim(),
          familyName: isResearchAdmin ? '' : createForm.familyName.trim(),
          email: createForm.email.trim().toLowerCase(),
          accountType: createForm.accountType,
          password: createForm.password,
          orcidId: createForm.accountType === 'RESEARCHER' ? createForm.orcidId.trim() || undefined : undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        showAlert(data.message || 'User created', 'success');
        setCreateDialogOpen(false);
        setCreateForm(emptyCreateForm);
        setCreateError('');
        setSearchInput('');
        setSearchQuery('');
        setStatusFilter('');
        setAccountTypeFilter('');
        setPage(0);
        fetchUsers({ search: '', status: '', accountType: '', page: 0 });
      } else {
        const message = data.message || data.error || 'Failed to create user';
        setCreateError(message);
        showAlert(message, 'error');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      const message = 'Failed to create user';
      setCreateError(message);
      showAlert(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitPassword = async () => {
    if (!selectedUser) return;
    if (!passwordForm.password || passwordForm.password.length < 8) {
      showAlert('Password must be at least 8 characters', 'error');
      return;
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      showAlert('Passwords do not match', 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/institution-admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordForm.password }),
      });
      const data = await response.json();
      if (data.success) {
        showAlert('Password updated', 'success');
        setPasswordDialogOpen(false);
      } else {
        showAlert(data.message || 'Failed to update password', 'error');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      showAlert('Failed to update password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getStatusChip = (status) => {
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
  };

  const getAccountTypeChip = (accountType) => {
    const iconMap = {
      RESEARCHER: ResearcherIcon,
      RESEARCH_ADMIN: AdminIcon,
      INSTITUTION_ADMIN: AdminIcon,
    };
    const Icon = iconMap[accountType] || ResearcherIcon;
    const type = MANAGEABLE_ACCOUNT_TYPES.find((item) => item.name === accountType);
    const label = type?.displayName || accountType.replace(/_/g, ' ');

    return (
      <Chip
        icon={<Icon sx={{ fontSize: '14px !important' }} />}
        label={label}
        size="small"
        variant="outlined"
        sx={{
          fontWeight: 600,
          borderColor: alpha(PURPLE, 0.25),
          color: PURPLE_DARK,
          '& .MuiChip-icon': { color: PURPLE },
        }}
      />
    );
  };

  // Get initials for avatar
  const getInitials = (givenName, familyName) => {
    return `${givenName?.[0] || ''}${familyName?.[0] || ''}`.toUpperCase();
  };

  if (!user || user.accountType !== 'INSTITUTION_ADMIN') {
    return null;
  }

  const headCellSx = {
    fontWeight: 700,
    fontSize: '0.75rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: alpha(PURPLE, 0.7),
    bgcolor: alpha(PURPLE, 0.04),
    borderBottom: `1px solid ${alpha(PURPLE, 0.1)}`,
    py: 1.5,
  };

  const hasFilters = Boolean(searchInput || statusFilter || accountTypeFilter);

  const clearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setStatusFilter('');
    setAccountTypeFilter('');
    setPage(0);
  };

  const applyStatusFilter = (status) => {
    setStatusFilter((current) => (current === status ? '' : status));
    setPage(0);
  };

  return (
    <InstitutionAdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
        <PageHeading
          title="User Management"
          subtitle="Manage accounts, roles, and access for your institution."
          action={(
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => {
                setCreateForm(emptyCreateForm);
                setCreateError('');
                setCreateDialogOpen(true);
              }}
              sx={{
                bgcolor: PURPLE,
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
                '&:hover': { bgcolor: PURPLE_DARK },
              }}
            >
              Create user
            </Button>
          )}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3 }}>
          <StatCard
            label="Total users"
            value={institutionTotal}
            caption="All institution accounts"
            icon={UsersIcon}
            active={!statusFilter && !hasFilters}
            onClick={clearFilters}
          />
          <StatCard
            label="Active"
            value={stats.byStatus?.active || 0}
            caption="Can sign in now"
            icon={CheckIcon}
            active={statusFilter === 'ACTIVE'}
            onClick={() => applyStatusFilter('ACTIVE')}
          />
          <StatCard
            label="Pending"
            value={stats.byStatus?.pending || 0}
            caption="Awaiting approval"
            icon={PendingIcon}
            active={statusFilter === 'PENDING'}
            onClick={() => applyStatusFilter('PENDING')}
          />
          <StatCard
            label="Suspended"
            value={stats.byStatus?.suspended || 0}
            caption="Access blocked"
            icon={BlockIcon}
            active={statusFilter === 'SUSPENDED'}
            onClick={() => applyStatusFilter('SUSPENDED')}
          />
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha(PURPLE, 0.12)}` }}>
          <Box sx={{ px: { xs: 2, md: 2.5 }, py: 2, borderBottom: `1px solid ${alpha(PURPLE, 0.1)}` }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr auto' },
                gap: 1.5,
                alignItems: 'center',
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name, email, or ORCID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                name="institution-user-search"
                type="search"
                autoComplete="off"
                inputProps={{
                  autoComplete: 'off',
                  'data-1p-ignore': 'true',
                  'data-lpignore': 'true',
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: alpha(PURPLE, 0.5) }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchInput ? (
                    <InputAdornment position="end">
                      <IconButton size="small" aria-label="Clear search" onClick={() => setSearchInput('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                  sx: { borderRadius: 1.5, bgcolor: 'background.paper' },
                }}
              />
              <FormControl fullWidth size="small" sx={{ '& .MuiInputBase-root': { borderRadius: 1.5 } }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All statuses</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" sx={{ '& .MuiInputBase-root': { borderRadius: 1.5 } }}>
                <InputLabel>Account type</InputLabel>
                <Select
                  value={accountTypeFilter}
                  label="Account type"
                  onChange={(e) => {
                    setAccountTypeFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All types</MenuItem>
                  <MenuItem value="RESEARCHER">Researcher</MenuItem>
                  <MenuItem value="RESEARCH_ADMIN">Research Admin</MenuItem>
                  <MenuItem value="INSTITUTION_ADMIN">Institution Admin</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                disabled={!hasFilters}
                onClick={clearFilters}
                sx={{
                  borderRadius: 1.5,
                  whiteSpace: 'nowrap',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: alpha(PURPLE, 0.35),
                  color: PURPLE_DARK,
                  '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) },
                }}
              >
                Clear
              </Button>
            </Box>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.75 }} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {loading ? 'Loading...' : `${totalUsers} result${totalUsers === 1 ? '' : 's'}`}
              </Typography>
              {hasFilters ? (
                <Chip
                  size="small"
                  label="Filters applied"
                  onDelete={clearFilters}
                  sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE_DARK, fontWeight: 600 }}
                />
              ) : null}
            </Stack>
          </Box>

          {loading ? (
            <Box sx={{ p: 2 }}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} variant="rounded" height={52} sx={{ mb: 1, borderRadius: 1.5 }} />
              ))}
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headCellSx}>User</TableCell>
                      <TableCell sx={headCellSx}>Email</TableCell>
                      <TableCell sx={headCellSx}>Account type</TableCell>
                      <TableCell sx={headCellSx}>Status</TableCell>
                      <TableCell sx={headCellSx}>Verified</TableCell>
                      <TableCell sx={headCellSx}>Joined</TableCell>
                      <TableCell sx={headCellSx} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                          <Stack spacing={2} alignItems="center" sx={{ maxWidth: 360, mx: 'auto' }}>
                            <Box
                              sx={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: alpha(PURPLE, 0.1),
                                color: PURPLE,
                              }}
                            >
                              <UsersIcon sx={{ fontSize: 32 }} />
                            </Box>
                            <Typography variant="h6" fontWeight={600}>
                              {hasFilters ? 'No matching users' : 'No users yet'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" textAlign="center">
                              {hasFilters
                                ? 'Try adjusting your search or filters.'
                                : 'Create the first user account for your institution.'}
                            </Typography>
                            {hasFilters ? (
                              <Button
                                variant="outlined"
                                onClick={() => {
                                  setSearchInput('');
                                  setSearchQuery('');
                                  setStatusFilter('');
                                  setAccountTypeFilter('');
                                  setPage(0);
                                }}
                                sx={{ borderRadius: 2 }}
                              >
                                Clear filters
                              </Button>
                            ) : (
                              <Button
                                variant="contained"
                                startIcon={<PersonAddIcon />}
                                onClick={() => {
                                  setCreateForm(emptyCreateForm);
                                  setCreateError('');
                                  setCreateDialogOpen(true);
                                }}
                                sx={{ borderRadius: 2 }}
                              >
                                Create user
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ) : users.map((userData) => (
                      <TableRow
                        key={userData.id}
                        hover
                        sx={{
                          cursor: 'pointer',
                          '&:last-child td': { borderBottom: 0 },
                          '&:hover': { bgcolor: alpha(PURPLE, 0.04) },
                        }}
                        onClick={() => handleViewUser(userData)}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(PURPLE, 0.14), color: PURPLE, fontSize: 13, fontWeight: 700 }}>
                              {getInitials(userData.givenName, userData.familyName)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} noWrap>
                                {formatUserName(userData)}
                              </Typography>
                              {userData.orcidId && (
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  ORCID: {userData.orcidId}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 220 }}>
                            {userData.email}
                          </Typography>
                        </TableCell>
                        <TableCell>{getAccountTypeChip(userData.accountType)}</TableCell>
                        <TableCell>{getStatusChip(userData.status)}</TableCell>
                        <TableCell>
                          {userData.emailVerified ? (
                            <Chip
                              icon={<CheckIcon sx={{ fontSize: '14px !important' }} />}
                              label="Verified"
                              size="small"
                              sx={{ bgcolor: alpha(PURPLE, 0.12), color: PURPLE_DARK, fontWeight: 700, height: 24 }}
                            />
                          ) : (
                            <Chip icon={<CancelIcon sx={{ fontSize: '14px !important' }} />} label="Unverified" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(userData.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" onClick={(event) => event.stopPropagation()} sx={{ whiteSpace: 'nowrap' }}>
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="View details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewUser(userData)}
                                sx={{ color: PURPLE, bgcolor: alpha(PURPLE, 0.08), '&:hover': { bgcolor: alpha(PURPLE, 0.14) } }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit user">
                              <IconButton
                                size="small"
                                onClick={() => handleEditUser(userData)}
                                sx={{ color: PURPLE_DARK, bgcolor: alpha(PURPLE, 0.06), '&:hover': { bgcolor: alpha(PURPLE, 0.12) } }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Set password">
                              <IconButton
                                size="small"
                                onClick={() => handlePasswordUser(userData)}
                                sx={{ color: PURPLE_DARK, bgcolor: alpha(PURPLE, 0.06), '&:hover': { bgcolor: alpha(PURPLE, 0.12) } }}
                              >
                                <LockResetIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {userData.accountType !== 'INSTITUTION_ADMIN' && userData.id !== user.id && (
                              <Tooltip title="Delete user">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteUser(userData)}
                                  sx={{ color: '#b91c1c', bgcolor: alpha('#b91c1c', 0.08), '&:hover': { bgcolor: alpha('#b91c1c', 0.14) } }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalUsers}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </>
          )}
        </Paper>

      <InstitutionModal open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md">
        <InstitutionModalHeader
          icon={ViewIcon}
          title={selectedUser ? formatUserName(selectedUser) : 'User details'}
          subtitle={selectedUser?.email}
          onClose={() => setDialogOpen(false)}
        />
        <InstitutionModalBody>
          {selectedUser && (
            <>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {getAccountTypeChip(selectedUser.accountType)}
                {getStatusChip(selectedUser.status)}
                {selectedUser.emailVerified && (
                  <Chip icon={<CheckIcon />} label="Email verified" color="success" size="small" variant="outlined" />
                )}
              </Stack>

              <InstitutionModalSection title="Basic information">
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5 }}>
                  <DetailField label="User ID" value={selectedUser.id} />
                  <DetailField label="ORCID ID" value={selectedUser.orcidId} />
                  <DetailField label="Primary institution" value={selectedUser.primaryInstitution} />
                  <DetailField
                    label="Research start"
                    value={
                      selectedUser.startMonth && selectedUser.startYear
                        ? `${selectedUser.startMonth} ${selectedUser.startYear}`
                        : '-'
                    }
                  />
                </Box>
              </InstitutionModalSection>

              {selectedUser.institution && (
                <InstitutionModalSection title="Institution details">
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5 }}>
                    <DetailField label="Institution name" value={selectedUser.institution.name} />
                    <DetailField label="Institution type" value={selectedUser.institution.type} />
                    <DetailField label="Country" value={selectedUser.institution.country} />
                    <DetailField label="Website" value={selectedUser.institution.website} />
                  </Box>
                </InstitutionModalSection>
              )}

              {selectedUser.foundation && (
                <InstitutionModalSection title="Foundation details">
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5 }}>
                    <DetailField label="Foundation name" value={selectedUser.foundation.foundationName} />
                    <DetailField label="Institution name" value={selectedUser.foundation.institutionName} />
                    <DetailField label="Type" value={selectedUser.foundation.type} />
                    <DetailField label="Country" value={selectedUser.foundation.country} />
                  </Box>
                </InstitutionModalSection>
              )}

              <InstitutionModalSection title="Activity stats">
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {[
                    { label: 'Manuscripts', value: selectedUser._count?.manuscripts || 0 },
                    { label: 'Publications', value: selectedUser._count?.publications || 0 },
                    { label: 'Notifications', value: selectedUser._count?.notifications || 0 },
                  ].map((stat) => (
                    <Box
                      key={stat.label}
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      }}
                    >
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                        {stat.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </InstitutionModalSection>

              <InstitutionModalSection title="Account timeline">
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5 }}>
                  <DetailField label="Account created" value={new Date(selectedUser.createdAt).toLocaleString()} />
                  <DetailField label="Last updated" value={new Date(selectedUser.updatedAt).toLocaleString()} />
                </Box>
              </InstitutionModalSection>
            </>
          )}
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              setDialogOpen(false);
              handleEditUser(selectedUser);
            }}
          >
            Edit user
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>

      <InstitutionModal open={editDialogOpen} onClose={() => !saving && setEditDialogOpen(false)} disableClose={saving}>
        <InstitutionModalHeader
          icon={EditIcon}
          title="Edit user"
          subtitle={selectedUser ? formatUserName(selectedUser) : 'Update user information and settings'}
          onClose={() => setEditDialogOpen(false)}
          disableClose={saving}
        />
        <InstitutionModalBody>
          <InstitutionModalSection title="Profile">
            <Stack spacing={2.5}>
              {editForm.accountType === 'RESEARCH_ADMIN' ? (
                <TextField
                  fullWidth
                  label="Name"
                  value={editForm.givenName}
                  onChange={(e) => setEditForm({ ...editForm, givenName: e.target.value, familyName: '' })}
                />
              ) : (
                <>
                  <TextField
                    fullWidth
                    label="Given name"
                    value={editForm.givenName}
                    onChange={(e) => setEditForm({ ...editForm, givenName: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    label="Family name"
                    value={editForm.familyName}
                    onChange={(e) => setEditForm({ ...editForm, familyName: e.target.value })}
                  />
                </>
              )}
              <InstitutionAdminEmailField
                label="Email"
                value={editForm.email}
                institution={institutionForEmail}
                onChange={(email) => setEditForm((prev) => ({ ...prev, email }))}
              />
              {editForm.accountType === 'RESEARCHER' && (
                <TextField
                  fullWidth
                  label="ORCID iD"
                  placeholder="0000-0001-2345-6789"
                  value={editForm.orcidId}
                  onChange={(e) => setEditForm({ ...editForm, orcidId: e.target.value })}
                  helperText="Optional. Format: 0000-0001-2345-6789"
                />
              )}
            </Stack>
          </InstitutionModalSection>
          <InstitutionModalSection title="Account settings">
            <Stack spacing={2.5}>
              <FormControl fullWidth>
                <InputLabel>Account type</InputLabel>
                <Select
                  value={editForm.accountType}
                  label="Account type"
                  disabled={selectedUser?.accountType === 'INSTITUTION_ADMIN' || selectedUser?.id === user.id}
                  onChange={(e) => setEditForm({ ...editForm, accountType: e.target.value })}
                >
                  {selectedUser?.accountType === 'INSTITUTION_ADMIN' && (
                    <MenuItem value="INSTITUTION_ADMIN">Institution Admin</MenuItem>
                  )}
                  {MANAGEABLE_ACCOUNT_TYPES.map((type) => (
                    <MenuItem key={type.name} value={type.name}>
                      {type.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status}
                  label="Status"
                  disabled={selectedUser?.id === user.id}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Email verified</InputLabel>
                <Select
                  value={editForm.emailVerified}
                  label="Email verified"
                  onChange={(e) => setEditForm({ ...editForm, emailVerified: e.target.value === true || e.target.value === 'true' })}
                >
                  <MenuItem value={true}>Yes</MenuItem>
                  <MenuItem value={false}>No</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </InstitutionModalSection>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setEditDialogOpen(false)} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmitEdit} disabled={saving} startIcon={<CheckIcon />}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>

      <InstitutionModal open={createDialogOpen} onClose={() => !saving && setCreateDialogOpen(false)} disableClose={saving}>
        <InstitutionModalHeader
          icon={PersonAddIcon}
          title="Create user"
          subtitle="Add a new user account to your institution"
          onClose={() => setCreateDialogOpen(false)}
          disableClose={saving}
        />
        <InstitutionModalBody>
          <InstitutionModalSection title="Account type">
            <FormControl fullWidth>
              <InputLabel>Account type</InputLabel>
              <Select
                value={createForm.accountType}
                label="Account type"
                onChange={(e) => {
                  const nextType = e.target.value;
                  setCreateForm((prev) => ({
                    ...prev,
                    accountType: nextType,
                    familyName: nextType === 'RESEARCH_ADMIN' ? '' : prev.familyName,
                    orcidId: nextType === 'RESEARCHER' ? prev.orcidId : '',
                  }));
                }}
              >
                {MANAGEABLE_ACCOUNT_TYPES.map((type) => (
                  <MenuItem key={type.name} value={type.name}>
                    {type.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </InstitutionModalSection>
          <InstitutionModalSection title="Profile">
            <Stack spacing={2.5}>
              {createForm.accountType === 'RESEARCH_ADMIN' ? (
                <TextField
                  fullWidth
                  required
                  label="Name"
                  value={createForm.givenName}
                  onChange={(e) => setCreateForm({ ...createForm, givenName: e.target.value, familyName: '' })}
                />
              ) : (
                <>
                  <TextField
                    fullWidth
                    required
                    label="First name"
                    value={createForm.givenName}
                    onChange={(e) => setCreateForm({ ...createForm, givenName: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    required
                    label="Last name"
                    value={createForm.familyName}
                    onChange={(e) => setCreateForm({ ...createForm, familyName: e.target.value })}
                  />
                </>
              )}
              <InstitutionAdminEmailField
                label="Email"
                name="create-user-email"
                autoComplete="off"
                value={createForm.email}
                institution={institutionForEmail}
                onChange={(email) => setCreateForm((prev) => ({ ...prev, email }))}
              />
              {createForm.accountType === 'RESEARCHER' && (
                <TextField
                  fullWidth
                  label="ORCID iD"
                  placeholder="0000-0001-2345-6789"
                  value={createForm.orcidId}
                  onChange={(e) => setCreateForm({ ...createForm, orcidId: e.target.value })}
                  helperText="Optional for researcher accounts"
                />
              )}
            </Stack>
          </InstitutionModalSection>
          <InstitutionModalSection title="Credentials">
            <PasswordFields
              required
              password={createForm.password}
              confirmPassword={createForm.confirmPassword}
              onPasswordChange={(value) => setCreateForm((prev) => ({ ...prev, password: value }))}
              onConfirmChange={(value) => setCreateForm((prev) => ({ ...prev, confirmPassword: value }))}
              helperText="Minimum 8 characters"
            />
          </InstitutionModalSection>
        </InstitutionModalBody>
        {createError ? (
          <Box sx={{ px: 3, pb: 1 }}>
            <Alert severity="error" onClose={() => setCreateError('')} sx={{ borderRadius: 2 }}>
              {createError}
            </Alert>
          </Box>
        ) : null}
        <InstitutionModalFooter>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitCreate}
            disabled={saving}
            sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: PURPLE_DARK } }}
          >
            {saving ? 'Creating...' : 'Create user'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>

      <InstitutionModal open={passwordDialogOpen} onClose={() => !saving && setPasswordDialogOpen(false)} disableClose={saving}>
        <InstitutionModalHeader
          icon={LockResetIcon}
          title="Set password"
          subtitle={selectedUser ? `${formatUserName(selectedUser)} (${selectedUser.email})` : 'Set a new password'}
          onClose={() => setPasswordDialogOpen(false)}
          disableClose={saving}
        />
        <InstitutionModalBody>
          <InstitutionModalSection title="New credentials">
            <PasswordFields
              required
              password={passwordForm.password}
              confirmPassword={passwordForm.confirmPassword}
              onPasswordChange={(value) => setPasswordForm((prev) => ({ ...prev, password: value }))}
              onConfirmChange={(value) => setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))}
              helperText="Minimum 8 characters"
            />
          </InstitutionModalSection>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setPasswordDialogOpen(false)} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmitPassword} disabled={saving}>
            {saving ? 'Saving...' : 'Save password'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>

      <InstitutionModal open={deleteDialogOpen} onClose={() => !saving && setDeleteDialogOpen(false)} disableClose={saving}>
        <InstitutionModalHeader
          icon={DeleteIcon}
          title="Delete user"
          subtitle="This action cannot be undone"
          tone="danger"
          onClose={() => setDeleteDialogOpen(false)}
          disableClose={saving}
        />
        <InstitutionModalBody>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            This permanently deletes all user data and related records for{' '}
            <strong>{selectedUser ? formatUserName(selectedUser) : 'this user'}</strong>.
          </Alert>
          <InstitutionModalSection title="Confirm deletion">
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to delete{' '}
              <strong>{selectedUser ? formatUserName(selectedUser) : 'this user'}</strong>
              {selectedUser?.email ? ` (${selectedUser.email})` : ''}?
            </Typography>
          </InstitutionModalSection>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleSubmitDelete} disabled={saving}>
            {saving ? 'Deleting...' : 'Delete user'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>

      <Snackbar
        open={alert.show}
        autoHideDuration={6000}
        onClose={() => setAlert((prev) => ({ ...prev, show: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={alert.severity}
          onClose={() => setAlert((prev) => ({ ...prev, show: false }))}
          sx={{ borderRadius: 2, width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
      </Box>
    </InstitutionAdminLayout>
  );
};

export default UserManagementPage;

