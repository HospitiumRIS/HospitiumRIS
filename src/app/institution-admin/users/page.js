'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Snackbar
} from '@mui/material';
import {
  People as UsersIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  VisibilityOff,
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
} from '@mui/icons-material';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import InstitutionAdminLayout from '../../../components/InstitutionAdmin/InstitutionAdminLayout';

const MANAGEABLE_ACCOUNT_TYPES = [
  { name: 'RESEARCHER', displayName: 'Researcher' },
  { name: 'RESEARCH_ADMIN', displayName: 'Research Admin' },
];

function generatePassword(length = 14) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join('');
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
  const [showPassword, setShowPassword] = useState(false);
  
  const [searchInput, setSearchInput] = useState('');
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
    setShowPassword(false);
    setPasswordDialogOpen(true);
  };

  const handleSubmitEdit = async () => {
    if (!selectedUser) return;
    if (!editForm.givenName.trim() || !editForm.familyName.trim()) {
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
          familyName: editForm.familyName.trim(),
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
    if (!createForm.givenName.trim() || !createForm.familyName.trim()) {
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
          familyName: createForm.familyName.trim(),
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

  return (
    <InstitutionAdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Professional Header */}
        <Box sx={{ 
          mb: 4,
          pb: 3,
          borderBottom: '2px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#8b6cbc', width: 56, height: 56, boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)' }}>
                <UsersIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    mb: 0.5,
                    letterSpacing: '-0.02em'
                  }}
                >
                  User Management
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Manage user accounts, permissions, and settings
                </Typography>
              </Box>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchUsers}
                sx={{
                  borderColor: '#8b6cbc',
                  color: '#8b6cbc',
                  '&:hover': {
                    borderColor: '#7a5caa',
                    bgcolor: '#f3e5f5'
                  }
                }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => {
                  setCreateForm(emptyCreateForm);
                  setShowPassword(false);
                  setCreateDialogOpen(true);
                }}
                sx={{
                  bgcolor: '#8b6cbc',
                  '&:hover': {
                    bgcolor: '#7a5caa'
                  },
                  boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)'
                }}
              >
                Create user
              </Button>
            </Stack>
          </Box>
        </Box>

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

      {/* Statistics Cards */}
      <Box sx={{ 
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        mb: 3
      }}>
        <Box sx={{ flex: '1 1 calc(25% - 12px)', minWidth: '200px' }}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(139, 108, 188, 0.3)'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              transform: 'translate(40%, -40%)'
            }
          }}>
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 2.5 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 44, height: 44 }}>
                  <CheckIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {stats.byStatus?.active || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, fontSize: '0.875rem' }}>
                    Active Users
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 calc(25% - 12px)', minWidth: '200px' }}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(139, 108, 188, 0.3)'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              transform: 'translate(40%, -40%)'
            }
          }}>
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 2.5 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 44, height: 44 }}>
                  <PendingIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {stats.byStatus?.pending || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, fontSize: '0.875rem' }}>
                    Pending Users
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 calc(25% - 12px)', minWidth: '200px' }}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(139, 108, 188, 0.3)'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              transform: 'translate(40%, -40%)'
            }
          }}>
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 2.5 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 44, height: 44 }}>
                  <BlockIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {stats.byStatus?.suspended || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, fontSize: '0.875rem' }}>
                    Suspended
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 calc(25% - 12px)', minWidth: '200px' }}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(139, 108, 188, 0.3)'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              transform: 'translate(40%, -40%)'
            }
          }}>
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 2.5 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 44, height: 44 }}>
                  <UsersIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {totalUsers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, fontSize: '0.875rem' }}>
                    Total Users
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Filters and Search */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(249,250,251,1) 100%)'
        }}
      >
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: '2fr 1.5fr 1.5fr 1fr'
          },
          gap: 2,
          alignItems: 'center'
        }}>
          <TextField
            fullWidth
            placeholder="Search by name, email, or ORCID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          
          <FormControl fullWidth>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Status Filter"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
              <MenuItem value="SUSPENDED">Suspended</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>Account Type Filter</InputLabel>
            <Select
              value={accountTypeFilter}
              label="Account Type Filter"
              onChange={(e) => {
                setAccountTypeFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="RESEARCHER">Researcher</MenuItem>
              <MenuItem value="RESEARCH_ADMIN">Research Admin</MenuItem>
              <MenuItem value="INSTITUTION_ADMIN">Institution Admin</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            fullWidth
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => {
              setSearchInput('');
              setSearchQuery('');
              setStatusFilter('');
              setAccountTypeFilter('');
              setPage(0);
            }}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* Users Table */}
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(249,250,251,1) 100%)',
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>Account Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>Verified</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>Joined</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                        <Typography variant="body2" color="text.secondary">
                          No users found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : users.map((userData) => (
                    <TableRow 
                      key={userData.id} 
                      sx={{ 
                        '&:hover': { 
                          bgcolor: 'action.hover',
                          cursor: 'pointer'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ 
                            bgcolor: '#8b6cbc',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)'
                          }}>
                            {getInitials(userData.givenName, userData.familyName)}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {userData.givenName} {userData.familyName}
                            </Typography>
                            {userData.orcidId && (
                              <Typography variant="caption" color="text.secondary">
                                ORCID: {userData.orcidId}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{userData.email}</TableCell>
                      <TableCell>{getAccountTypeChip(userData.accountType)}</TableCell>
                      <TableCell>{getStatusChip(userData.status)}</TableCell>
                      <TableCell>
                        {userData.emailVerified ? (
                          <Chip icon={<CheckIcon />} label="Verified" color="success" size="small" />
                        ) : (
                          <Chip icon={<CancelIcon />} label="Unverified" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(userData.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewUser(userData)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit User">
                            <IconButton
                              size="small"
                              onClick={() => handleEditUser(userData)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Set password">
                            <IconButton
                              size="small"
                              onClick={() => handlePasswordUser(userData)}
                            >
                              <LockResetIcon />
                            </IconButton>
                          </Tooltip>
                          {userData.accountType !== 'INSTITUTION_ADMIN' && userData.id !== user.id && (
                            <Tooltip title="Delete User">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteUser(userData)}
                              >
                                <DeleteIcon />
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

      {/* View User Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        disableScrollLock
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
          color: 'white',
          pb: 3
        }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ 
              width: 56, 
              height: 56,
              bgcolor: 'rgba(255,255,255,0.2)',
              fontSize: '1.5rem',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {selectedUser && getInitials(selectedUser.givenName, selectedUser.familyName)}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                {selectedUser?.givenName} {selectedUser?.familyName}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.95 }}>
                {selectedUser?.email}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
          {selectedUser && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {getAccountTypeChip(selectedUser.accountType)}
                {getStatusChip(selectedUser.status)}
                {selectedUser.emailVerified && (
                  <Chip 
                    icon={<CheckIcon />} 
                    label="Email Verified" 
                    sx={{ 
                      bgcolor: '#f3e5f5',
                      color: '#8b6cbc',
                      border: '1px solid #e1bee7',
                      fontWeight: 600
                    }}
                    size="small" 
                  />
                )}
              </Stack>

              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: 'white' }}>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2 }}>
                  Basic Information
                </Typography>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 2.5
                }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>User ID</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>{selectedUser.id}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>ORCID ID</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>{selectedUser.orcidId || 'N/A'}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Primary Institution</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>{selectedUser.primaryInstitution || 'N/A'}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Research Start</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                      {selectedUser.startMonth && selectedUser.startYear
                        ? `${selectedUser.startMonth} ${selectedUser.startYear}`
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {selectedUser.institution && (
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: 'white' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2 }}>
                    Institution Details
                  </Typography>
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: 2.5
                  }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Institution Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>{selectedUser.institution.name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Institution Type</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>{selectedUser.institution.type}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Country</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>{selectedUser.institution.country}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Website</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>{selectedUser.institution.website || 'N/A'}</Typography>
                    </Box>
                  </Box>
                </Paper>
              )}

              {selectedUser.foundation && (
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: 'white' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2 }}>
                    Foundation Details
                  </Typography>
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: 2.5
                  }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Foundation Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>{selectedUser.foundation.foundationName}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Institution Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>{selectedUser.foundation.institutionName}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Type</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>{selectedUser.foundation.type}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Country</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>{selectedUser.foundation.country}</Typography>
                    </Box>
                  </Box>
                </Paper>
              )}

              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: 'white' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2 }}>
                  Activity Stats
                </Typography>

                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                  gap: 3
                }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f3e5f5', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 0.5 }}>{selectedUser._count?.manuscripts || 0}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>Manuscripts</Typography>
                  </Box>

                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f3e5f5', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 0.5 }}>{selectedUser._count?.publications || 0}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>Publications</Typography>
                  </Box>

                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f3e5f5', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 0.5 }}>{selectedUser._count?.notifications || 0}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>Notifications</Typography>
                  </Box>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: 'white' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2 }}>
                  Account Timeline
                </Typography>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 2.5
                }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Account Created</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                      {new Date(selectedUser.createdAt).toLocaleString()}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Last Updated</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                      {new Date(selectedUser.updatedAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#fafafa', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={() => setDialogOpen(false)}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              setDialogOpen(false);
              handleEditUser(selectedUser);
            }}
            sx={{
              bgcolor: '#8b6cbc',
              '&:hover': { bgcolor: '#7a5caa' },
              boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)'
            }}
          >
            Edit User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        disableScrollLock
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
          color: 'white',
          pb: 2
        }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              <EditIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Edit User
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.95 }}>
                Update user information and settings
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Given Name"
              value={editForm.givenName}
              onChange={(e) => setEditForm({ ...editForm, givenName: e.target.value })}
            />
            <TextField
              fullWidth
              label="Family Name"
              value={editForm.familyName}
              onChange={(e) => setEditForm({ ...editForm, familyName: e.target.value })}
            />
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={editForm.accountType}
                label="Account Type"
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
              <InputLabel>Email Verified</InputLabel>
              <Select
                value={editForm.emailVerified}
                label="Email Verified"
                onChange={(e) => setEditForm({ ...editForm, emailVerified: e.target.value === true || e.target.value === 'true' })}
              >
                <MenuItem value={true}>Yes</MenuItem>
                <MenuItem value={false}>No</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#fafafa', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitEdit}
            disabled={saving}
            startIcon={<CheckIcon />}
            sx={{
              bgcolor: '#8b6cbc',
              '&:hover': { bgcolor: '#7a5caa' },
              boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)'
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={createDialogOpen}
        onClose={saving ? undefined : () => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        disableScrollLock
      >
        <DialogTitle>Create user</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '12px !important' }}>
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
          <TextField
            fullWidth
            required
            type="email"
            label="Email"
            autoComplete="off"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
          />
          <FormControl fullWidth>
            <InputLabel>Account type</InputLabel>
            <Select
              value={createForm.accountType}
              label="Account type"
              onChange={(e) => setCreateForm({ ...createForm, accountType: e.target.value })}
            >
              {MANAGEABLE_ACCOUNT_TYPES.map((type) => (
                <MenuItem key={type.name} value={type.name}>
                  {type.displayName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
          <TextField
            fullWidth
            required
            type={showPassword ? 'text' : 'password'}
            label="Password"
            autoComplete="new-password"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            helperText="Minimum 8 characters"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="button" onClick={() => setShowPassword((prev) => !prev)} edge="end">
                    {showPassword ? <VisibilityOff /> : <ViewIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            required
            type={showPassword ? 'text' : 'password'}
            label="Confirm password"
            autoComplete="new-password"
            value={createForm.confirmPassword}
            onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              size="small"
              onClick={() => {
                const next = generatePassword();
                setCreateForm((prev) => ({ ...prev, password: next, confirmPassword: next }));
                setShowPassword(true);
              }}
            >
              Generate password
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitCreate} disabled={saving} sx={{ bgcolor: '#8b6cbc' }}>
            {saving ? 'Creating...' : 'Create user'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={passwordDialogOpen}
        onClose={saving ? undefined : () => setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        disableScrollLock
      >
        <DialogTitle>Set password</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '12px !important' }}>
          <Typography variant="body2" color="text.secondary">
            Set a new password for {selectedUser?.givenName} {selectedUser?.familyName} ({selectedUser?.email}).
          </Typography>
          <TextField
            fullWidth
            required
            type={showPassword ? 'text' : 'password'}
            label="New password"
            autoComplete="new-password"
            value={passwordForm.password}
            onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
            helperText="Minimum 8 characters"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="button" onClick={() => setShowPassword((prev) => !prev)} edge="end">
                    {showPassword ? <VisibilityOff /> : <ViewIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            required
            type={showPassword ? 'text' : 'password'}
            label="Confirm password"
            autoComplete="new-password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              size="small"
              onClick={() => {
                const next = generatePassword();
                setPasswordForm({ password: next, confirmPassword: next });
                setShowPassword(true);
              }}
            >
              Generate password
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPasswordDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitPassword} disabled={saving} sx={{ bgcolor: '#8b6cbc' }}>
            {saving ? 'Saving...' : 'Save password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
      >
        <DialogTitle>Confirm Delete User</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. All user data and related records will be permanently deleted.
          </Alert>
          <Typography>
            Are you sure you want to delete user <strong>{selectedUser?.givenName} {selectedUser?.familyName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleSubmitDelete} disabled={saving}>
            Delete User
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </InstitutionAdminLayout>
  );
};

export default UserManagementPage;

