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
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push('/super-admin')}
          sx={{ mb: 2 }}
        >
          Back to Super Admin Dashboard
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
              <UsersIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom>
                User Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage user accounts, permissions, and settings
              </Typography>
            </Box>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExportUsers}
            >
              Export Users
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={fetchUsers}
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
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)'
        },
        gap: 3,
        mb: 4
      }}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                <CheckIcon sx={{ color: 'white' }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {stats.byStatus?.active || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  Active Users
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        
        <Card sx={{ 
          background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
          color: 'white'
        }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                <PendingIcon sx={{ color: 'white' }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {stats.byStatus?.pending || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  Pending Users
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        
        <Card sx={{ 
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white'
        }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                <BlockIcon sx={{ color: 'white' }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {stats.byStatus?.suspended || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  Suspended
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        
        <Card sx={{ 
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: 'white'
        }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                <UsersIcon sx={{ color: 'white' }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {totalUsers}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  Total Users
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
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
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Account Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Verified</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((userData) => (
                    <TableRow key={userData.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar>
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
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar>
              {selectedUser && getInitials(selectedUser.givenName, selectedUser.familyName)}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {selectedUser?.givenName} {selectedUser?.familyName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedUser?.email}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Stack direction="row" spacing={1}>
                {getAccountTypeChip(selectedUser.accountType)}
                {getStatusChip(selectedUser.status)}
                {selectedUser.emailVerified && (
                  <Chip icon={<CheckIcon />} label="Email Verified" color="success" size="small" />
                )}
              </Stack>

              <Divider />

              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 3
              }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">User ID</Typography>
                  <Typography variant="body1">{selectedUser.id}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">ORCID ID</Typography>
                  <Typography variant="body1">{selectedUser.orcidId || 'N/A'}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">Primary Institution</Typography>
                  <Typography variant="body1">{selectedUser.primaryInstitution || 'N/A'}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">Research Start</Typography>
                  <Typography variant="body1">
                    {selectedUser.startMonth && selectedUser.startYear
                      ? `${selectedUser.startMonth} ${selectedUser.startYear}`
                      : 'N/A'}
                  </Typography>
                </Box>
              </Box>

              {selectedUser.institution && (
                <>
                  <Divider><Chip label="Institution Details" size="small" /></Divider>
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: 3
                  }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Institution Name</Typography>
                      <Typography variant="body1">{selectedUser.institution.name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Institution Type</Typography>
                      <Typography variant="body1">{selectedUser.institution.type}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Country</Typography>
                      <Typography variant="body1">{selectedUser.institution.country}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Website</Typography>
                      <Typography variant="body1">{selectedUser.institution.website || 'N/A'}</Typography>
                    </Box>
                  </Box>
                </>
              )}

              {selectedUser.foundation && (
                <>
                  <Divider><Chip label="Foundation Details" size="small" /></Divider>
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: 3
                  }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Foundation Name</Typography>
                      <Typography variant="body1">{selectedUser.foundation.foundationName}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Institution Name</Typography>
                      <Typography variant="body1">{selectedUser.foundation.institutionName}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Type</Typography>
                      <Typography variant="body1">{selectedUser.foundation.type}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Country</Typography>
                      <Typography variant="body1">{selectedUser.foundation.country}</Typography>
                    </Box>
                  </Box>
                </>
              )}

              <Divider><Chip label="Activity Stats" size="small" /></Divider>

              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                gap: 3
              }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Manuscripts</Typography>
                  <Typography variant="h6">{selectedUser._count?.manuscripts || 0}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">Publications</Typography>
                  <Typography variant="h6">{selectedUser._count?.publications || 0}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">Notifications</Typography>
                  <Typography variant="h6">{selectedUser._count?.notifications || 0}</Typography>
                </Box>
              </Box>

              <Divider />

              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 3
              }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Account Created</Typography>
                  <Typography variant="body1">
                    {new Date(selectedUser.createdAt).toLocaleString()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                  <Typography variant="body1">
                    {new Date(selectedUser.updatedAt).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => {
              setDialogOpen(false);
              handleEditUser(selectedUser);
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
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
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
            
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editForm.status}
                label="Status"
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
                onChange={(e) => setEditForm({ ...editForm, emailVerified: e.target.value })}
              >
                <MenuItem value={true}>Yes</MenuItem>
                <MenuItem value={false}>No</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitEdit}>Save Changes</Button>
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
    </Container>
  );
};

export default UserManagementPage;

