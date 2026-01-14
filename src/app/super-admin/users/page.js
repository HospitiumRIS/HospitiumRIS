'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
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
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Menu
} from '@mui/material';
import {
  People as UsersIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  Block as BlockIcon,
  Science as ResearcherIcon,
  AdminPanelSettings as AdminIcon,
  AccountBalance as FoundationIcon,
  SupervisorAccount as SuperAdminIcon,
  Download as ExportIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import SuperAdminLayout from '../../../components/SuperAdmin/SuperAdminLayout';

const UserManagementPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUserId, setMenuUserId] = useState(null);
  
  // Filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Alert state
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    givenName: '',
    familyName: '',
    status: '',
    emailVerified: false
  });

  // Check Super Admin access
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.accountType !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

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

      const response = await fetch(`/api/super-admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setTotalUsers(data.pagination.total);
        setStats(data.stats);
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
    if (user?.accountType === 'SUPER_ADMIN') {
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
      givenName: userData.givenName,
      familyName: userData.familyName,
      status: userData.status,
      emailVerified: userData.emailVerified
    });
    setEditDialogOpen(true);
    handleMenuClose();
  };

  // Handle delete user
  const handleDeleteUser = (userData) => {
    setSelectedUser(userData);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  // Submit edit
  const handleSubmitEdit = async () => {
    try {
      const response = await fetch(`/api/super-admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
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
    }
  };

  // Submit delete
  const handleSubmitDelete = async () => {
    try {
      const response = await fetch(`/api/super-admin/users/${selectedUser.id}`, {
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
    }
  };

  // Handle menu
  const handleMenuOpen = (event, userId) => {
    setAnchorEl(event.currentTarget);
    setMenuUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUserId(null);
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
    const typeConfig = {
      RESEARCHER: { color: 'primary', icon: <ResearcherIcon />, label: 'Researcher' },
      RESEARCH_ADMIN: { color: 'info', icon: <AdminIcon />, label: 'Research Admin' },
      FOUNDATION_ADMIN: { color: 'secondary', icon: <FoundationIcon />, label: 'Foundation Admin' },
      SUPER_ADMIN: { color: 'error', icon: <SuperAdminIcon />, label: 'Super Admin' }
    };

    const config = typeConfig[accountType] || typeConfig.RESEARCHER;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  // Get initials for avatar
  const getInitials = (givenName, familyName) => {
    return `${givenName?.[0] || ''}${familyName?.[0] || ''}`.toUpperCase();
  };

  // Export users
  const handleExportUsers = async () => {
    try {
      const response = await fetch('/api/super-admin/database/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'users' })
      });

      const data = await response.json();
      
      if (data.success) {
        // Create downloadable JSON file
        const blob = new Blob([JSON.stringify(data.data.users, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showAlert('Users exported successfully', 'success');
      } else {
        showAlert(data.message || 'Failed to export users', 'error');
      }
    } catch (error) {
      console.error('Error exporting users:', error);
      showAlert('Failed to export users', 'error');
    }
  };

  if (!user || user.accountType !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <SuperAdminLayout>
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
                  variant="h3" 
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
                startIcon={<ExportIcon />}
                onClick={handleExportUsers}
                sx={{
                  borderColor: '#8b6cbc',
                  color: '#8b6cbc',
                  '&:hover': {
                    borderColor: '#7a5caa',
                    bgcolor: '#f3e5f5'
                  }
                }}
              >
                Export Users
              </Button>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={fetchUsers}
                sx={{
                  bgcolor: '#8b6cbc',
                  '&:hover': {
                    bgcolor: '#7a5caa'
                  },
                  boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)'
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Box>
        </Box>

      {/* Alert */}
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 3 }} onClose={() => setAlert({ ...alert, show: false })}>
          {alert.message}
        </Alert>
      )}

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
                  <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
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
                  <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
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
                  <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
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
                  <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
              onChange={(e) => setStatusFilter(e.target.value)}
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
              onChange={(e) => setAccountTypeFilter(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="RESEARCHER">Researcher</MenuItem>
              <MenuItem value="RESEARCH_ADMIN">Research Admin</MenuItem>
              <MenuItem value="FOUNDATION_ADMIN">Foundation Admin</MenuItem>
              <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            fullWidth
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('');
              setAccountTypeFilter('');
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
                  {users.map((userData) => (
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
                          {userData.accountType !== 'SUPER_ADMIN' && (
                            <Tooltip title="Delete User">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMenuOpen(e, userData.id);
                                }}
                                sx={{
                                  bgcolor: '#8b6cbc',
                                  color: 'white',
                                  '&:hover': {
                                    bgcolor: '#7a5caa'
                                  }
                                }}
                              >
                                <MoreVertIcon />
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
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
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
        <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, bgcolor: 'white' }}>
              <TextField
                fullWidth
                label="Given Name"
                value={editForm.givenName}
                onChange={(e) => setEditForm({ ...editForm, givenName: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc'
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#8b6cbc'
                  }
                }}
              />
            </Paper>
            
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, bgcolor: 'white' }}>
              <TextField
                fullWidth
                label="Family Name"
                value={editForm.familyName}
                onChange={(e) => setEditForm({ ...editForm, familyName: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc'
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#8b6cbc'
                  }
                }}
              />
            </Paper>
            
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, bgcolor: 'white' }}>
              <FormControl fullWidth>
                <InputLabel sx={{ '&.Mui-focused': { color: '#8b6cbc' } }}>Status</InputLabel>
                <Select
                  value={editForm.status}
                  label="Status"
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  sx={{
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc'
                    }
                  }}
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Paper>
            
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, bgcolor: 'white' }}>
              <FormControl fullWidth>
                <InputLabel sx={{ '&.Mui-focused': { color: '#8b6cbc' } }}>Email Verified</InputLabel>
                <Select
                  value={editForm.emailVerified}
                  label="Email Verified"
                  onChange={(e) => setEditForm({ ...editForm, emailVerified: e.target.value })}
                  sx={{
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc'
                    }
                  }}
                >
                  <MenuItem value={true}>Yes</MenuItem>
                  <MenuItem value={false}>No</MenuItem>
                </Select>
              </FormControl>
            </Paper>
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
          <Button variant="contained" color="error" onClick={handleSubmitDelete}>
            Delete User
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </SuperAdminLayout>
  );
};

export default UserManagementPage;

