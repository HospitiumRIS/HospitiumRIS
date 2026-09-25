'use client';

import React, { useState, useEffect } from 'react';
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
  Grid,
  alpha,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
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
import { useRouter } from 'next/navigation';
import InstitutionAdminLayout from '../../../components/InstitutionAdmin/InstitutionAdminLayout';
import { PasswordFields } from '../../../components/GlobalAdmin/InstitutionManageDialogs';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
  StatCard,
} from '../../../components/GlobalAdmin/InstitutionModalShell';

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
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // State management
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
  const [searchReady, setSearchReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
        ...(accountTypeFilter && { accountType: accountTypeFilter })
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
    setTimeout(() => setAlert({ show: false, message: '', severity: 'info' }), 5000);
  };

  // Handle view user details
  const handleViewUser = (userData) => {
    setSelectedUser(userData);
    setDialogOpen(true);
  };

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
    const isResearchAdmin = createForm.accountType === 'RESEARCH_ADMIN';
    if (!createForm.givenName.trim()) {
      showAlert(isResearchAdmin ? 'Name is required' : 'First and last name are required', 'error');
      return;
    }
    if (!isResearchAdmin && !createForm.familyName.trim()) {
      showAlert('First and last name are required', 'error');
      return;
    }
    if (!createForm.email.trim()) {
      showAlert('Email is required', 'error');
      return;
    }
    if (!createForm.password || createForm.password.length < 8) {
      showAlert('Password must be at least 8 characters', 'error');
      return;
    }
    if (createForm.password !== createForm.confirmPassword) {
      showAlert('Passwords do not match', 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/institution-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          givenName: createForm.givenName.trim(),
          familyName: isResearchAdmin ? '' : createForm.familyName.trim(),
          email: createForm.email.trim(),
          accountType: createForm.accountType,
          password: createForm.password,
          orcidId: createForm.accountType === 'RESEARCHER' ? createForm.orcidId : undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        showAlert('User created', 'success');
        setCreateDialogOpen(false);
        setCreateForm(emptyCreateForm);
        fetchUsers();
      } else {
        showAlert(data.message || 'Failed to create user', 'error');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showAlert('Failed to create user', 'error');
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

  // Get status chip
  const getStatusChip = (status) => {
    const statusConfig = {
      ACTIVE: { color: 'success', icon: <CheckIcon />, label: 'Active' },
      PENDING: { color: 'warning', icon: <PendingIcon />, label: 'Pending' },
      INACTIVE: { color: 'default', icon: <CancelIcon />, label: 'Inactive' },
      SUSPENDED: { color: 'error', icon: <BlockIcon />, label: 'Suspended' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
      />
    );
  };

  // Get account type chip
  const getAccountTypeChip = (accountType) => {
    const iconMap = {
      RESEARCHER: <ResearcherIcon />,
      RESEARCH_ADMIN: <AdminIcon />,
      INSTITUTION_ADMIN: <AdminIcon />,
    };

    const colorMap = {
      RESEARCHER: 'primary',
      RESEARCH_ADMIN: 'info',
      INSTITUTION_ADMIN: 'secondary',
    };

    const type = MANAGEABLE_ACCOUNT_TYPES.find((item) => item.name === accountType);
    const label = type?.displayName || accountType.replace(/_/g, ' ');
    const icon = iconMap[accountType] || <ResearcherIcon />;
    const color = colorMap[accountType] || 'default';

    return (
      <Chip
        icon={icon}
        label={label}
        color={color}
        size="small"
        variant="outlined"
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

  const tablePaperSx = {
    borderRadius: 3,
    overflow: 'hidden',
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
  };

  const headCellSx = {
    fontWeight: 700,
    fontSize: '0.75rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'text.secondary',
    bgcolor: alpha(theme.palette.primary.main, 0.04),
    borderBottom: '1px solid',
    borderColor: 'divider',
    py: 1.75,
  };

  const hasFilters = Boolean(searchInput || statusFilter || accountTypeFilter);

  return (
    <InstitutionAdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: { xs: 2.5, md: 3 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.16),
                  color: 'primary.main',
                  boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.16)}`,
                }}
              >
                <UsersIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                  User Management
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Manage user accounts, permissions, and settings
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => {
                setCreateForm(emptyCreateForm);
                setCreateDialogOpen(true);
              }}
              sx={{
                borderRadius: 2,
                px: 2.5,
                boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.28)}`,
              }}
            >
              Create user
            </Button>
          </Stack>
        </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={alert.show}
        autoHideDuration={4000}
        onClose={() => setAlert({ ...alert, show: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setAlert({ ...alert, show: false })} 
          severity={alert.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {alert.message}
        </Alert>
      </Snackbar>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={CheckIcon} label="Active users" value={stats.byStatus?.active || 0} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={PendingIcon} label="Pending users" value={stats.byStatus?.pending || 0} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={BlockIcon} label="Suspended" value={stats.byStatus?.suspended || 0} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={UsersIcon} label="Total users" value={totalUsers} />
          </Grid>
        </Grid>

        <Paper elevation={0} sx={tablePaperSx}>
          <Box
            sx={{
              px: { xs: 2, md: 2.5 },
              py: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.background.default, 0.6),
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr auto' },
                gap: 2,
                alignItems: 'center',
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name, email, or ORCID..."
                value={searchInput}
                onFocus={() => setSearchReady(true)}
                onChange={(e) => setSearchInput(e.target.value)}
                inputProps={{ readOnly: !searchReady }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchInput ? (
                    <InputAdornment position="end">
                      <IconButton size="small" aria-label="Clear search" onClick={() => setSearchInput('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                  sx: { borderRadius: 2, bgcolor: 'background.paper' },
                }}
              />
              <FormControl fullWidth size="small">
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
              <FormControl fullWidth size="small">
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
                onClick={() => {
                  setSearchInput('');
                  setSearchQuery('');
                  setStatusFilter('');
                  setAccountTypeFilter('');
                  setPage(0);
                }}
                sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
              >
                Clear
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {loading ? 'Loading...' : `${totalUsers} user${totalUsers === 1 ? '' : 's'} total`}
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <Stack spacing={2} alignItems="center">
                <CircularProgress size={36} />
                <Typography variant="body2" color="text.secondary">Loading users...</Typography>
              </Stack>
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
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main',
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
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                        }}
                        onClick={() => handleViewUser(userData)}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 13, fontWeight: 600 }}>
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
                            <Chip icon={<CheckIcon />} label="Verified" color="success" size="small" variant="filled" />
                          ) : (
                            <Chip icon={<CancelIcon />} label="Unverified" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(userData.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" onClick={(event) => event.stopPropagation()} sx={{ whiteSpace: 'nowrap' }}>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.paper',
                              px: 0.5,
                            }}
                          >
                            <Tooltip title="View details">
                              <IconButton size="small" onClick={() => handleViewUser(userData)}>
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit user">
                              <IconButton size="small" onClick={() => handleEditUser(userData)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Set password">
                              <IconButton size="small" onClick={() => handlePasswordUser(userData)}>
                                <LockResetIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {userData.accountType !== 'INSTITUTION_ADMIN' && userData.id !== user.id && (
                              <Tooltip title="Delete user">
                                <IconButton size="small" color="error" onClick={() => handleDeleteUser(userData)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
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
              <TextField
                fullWidth
                type="email"
                label="Email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
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
              <TextField
                fullWidth
                required
                type="email"
                label="Email"
                autoComplete="off"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
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
        <InstitutionModalFooter>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmitCreate} disabled={saving}>
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
      </Box>
    </InstitutionAdminLayout>
  );
};

export default UserManagementPage;

