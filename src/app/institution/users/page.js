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
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Button,
  Card,
  CardContent,
  alpha,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  ManageAccounts as UserManagerIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  SupervisorAccount as SuperAdminIcon,
  Verified as VerifiedIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const UserManagement = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [accountTypeFilter, setAccountTypeFilter] = useState('all');
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ status: '', accountType: '' });
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, statusFilter, accountTypeFilter, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/institution/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => {
        const fullName = `${user.givenName || ''} ${user.familyName || ''}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        return fullName.includes(term) || email.includes(term);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    if (accountTypeFilter !== 'all') {
      filtered = filtered.filter(user => user.accountType === accountTypeFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleEditClick = () => {
    if (selectedUser) {
      setEditForm({
        status: selectedUser.status,
        accountType: selectedUser.accountType
      });
      setEditDialogOpen(true);
      handleMenuClose();
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/institution/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          status: editForm.status,
          accountType: editForm.accountType
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      await fetchUsers();
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user: ' + err.message);
    }
  };

  const getInitials = (user) => {
    const first = user.givenName?.[0] || '';
    const last = user.familyName?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'INACTIVE': return 'default';
      case 'SUSPENDED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircleIcon fontSize="small" />;
      case 'PENDING': return <PendingIcon fontSize="small" />;
      case 'INACTIVE': return <CancelIcon fontSize="small" />;
      case 'SUSPENDED': return <BlockIcon fontSize="small" />;
      default: return null;
    }
  };

  const getAccountTypeIcon = (accountType) => {
    switch (accountType) {
      case 'RESEARCHER': return <PersonIcon sx={{ fontSize: 18 }} />;
      case 'RESEARCH_ADMIN': return <SchoolIcon sx={{ fontSize: 18 }} />;
      case 'FOUNDATION_ADMIN': return <BusinessIcon sx={{ fontSize: 18 }} />;
      case 'SUPER_ADMIN': return <SuperAdminIcon sx={{ fontSize: 18 }} />;
      default: return <PersonIcon sx={{ fontSize: 18 }} />;
    }
  };

  const getAccountTypeLabel = (accountType) => {
    switch (accountType) {
      case 'RESEARCHER': return 'Researcher';
      case 'RESEARCH_ADMIN': return 'Research Admin';
      case 'FOUNDATION_ADMIN': return 'Foundation Admin';
      case 'SUPER_ADMIN': return 'Super Admin';
      default: return accountType;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="User Accounts"
          description="Manage user accounts and access"
          icon={<UserManagerIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Administration', path: '/institution' },
            { label: 'User Accounts' }
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

  if (error) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="User Accounts"
          description="Manage user accounts and access"
          icon={<UserManagerIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Administration', path: '/institution' },
            { label: 'User Accounts' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="error" gutterBottom>
              Error Loading Users
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={fetchUsers}
              sx={{
                bgcolor: '#8b6cbc',
                '&:hover': { bgcolor: '#7a5caa' }
              }}
            >
              Retry
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
      <PageHeader
        title="User Accounts"
        description="Manage user accounts and access"
        icon={<UserManagerIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Institution', path: '/institution' },
          { label: 'Administration', path: '/institution' },
          { label: 'User Accounts' }
        ]}
        gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669', mb: 0.5 }}>
                        {stats.byStatus.active}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Active Users
                      </Typography>
                    </Box>
                    <CheckCircleIcon sx={{ fontSize: 40, color: alpha('#059669', 0.2) }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#d97706', mb: 0.5 }}>
                        {stats.byStatus.pending}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Pending Approval
                      </Typography>
                    </Box>
                    <PendingIcon sx={{ fontSize: 40, color: alpha('#d97706', 0.2) }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 0.5 }}>
                        {stats.byAccountType.researcher}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Researchers
                      </Typography>
                    </Box>
                    <PersonIcon sx={{ fontSize: 40, color: alpha('#8b6cbc', 0.2) }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563eb', mb: 0.5 }}>
                        {stats.byAccountType.researchAdmin}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Research Admins
                      </Typography>
                    </Box>
                    <SchoolIcon sx={{ fontSize: 40, color: alpha('#2563eb', 0.2) }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Account Type</InputLabel>
                <Select
                  value={accountTypeFilter}
                  label="Account Type"
                  onChange={(e) => setAccountTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="RESEARCHER">Researcher</MenuItem>
                  <MenuItem value="RESEARCH_ADMIN">Research Admin</MenuItem>
                  <MenuItem value="FOUNDATION_ADMIN">Foundation Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ExportIcon />}
                sx={{
                  borderColor: '#e5e7eb',
                  color: '#6b7280',
                  height: 56,
                  '&:hover': {
                    borderColor: '#8b6cbc',
                    backgroundColor: alpha('#8b6cbc', 0.05)
                  }
                }}
              >
                Export
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Users Table */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {filteredUsers.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <UserManagerIcon sx={{ fontSize: 64, color: '#e5e7eb', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#6b7280', mb: 1 }}>
                {searchTerm || statusFilter !== 'all' || accountTypeFilter !== 'all' 
                  ? 'No users found' 
                  : 'No users yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || statusFilter !== 'all' || accountTypeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Users will appear here once they register'
                }
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>
                      User
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>
                      Account Type
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>
                      Institution
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2, textAlign: 'center' }}>
                      Activity
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>
                      Joined
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2, textAlign: 'center' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      sx={{
                        '&:hover': { backgroundColor: '#f9fafb' },
                        '& td': { borderBottom: '1px solid #f3f4f6' }
                      }}
                    >
                      <TableCell sx={{ py: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: '#8b6cbc',
                              fontSize: '0.875rem',
                              fontWeight: 600
                            }}
                          >
                            {getInitials(user)}
                          </Avatar>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                                {user.fullName}
                              </Typography>
                              {user.orcidId && (
                                <Tooltip title="ORCID Verified">
                                  <VerifiedIcon sx={{ fontSize: 16, color: '#a6ce39' }} />
                                </Tooltip>
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2.5 }}>
                        <Chip
                          icon={getAccountTypeIcon(user.accountType)}
                          label={getAccountTypeLabel(user.accountType)}
                          size="small"
                          sx={{
                            backgroundColor: alpha('#8b6cbc', 0.1),
                            color: '#8b6cbc',
                            fontWeight: 500,
                            '& .MuiChip-icon': {
                              color: '#8b6cbc'
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2.5 }}>
                        <Chip
                          icon={getStatusIcon(user.status)}
                          label={user.status}
                          size="small"
                          color={getStatusColor(user.status)}
                          sx={{ 
                            fontWeight: 500,
                            textTransform: 'capitalize'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2.5 }}>
                        <Typography variant="body2" sx={{ color: '#374151' }}>
                          {user.primaryInstitution || user.institution?.name || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2.5, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#6b7280' }}>
                          {user._count.manuscripts + user._count.publications}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2.5 }}>
                        <Typography variant="body2" sx={{ color: '#6b7280' }}>
                          {formatDate(user.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2.5, textAlign: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, user)}
                          sx={{ color: '#6b7280' }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Results Count */}
        {filteredUsers.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredUsers.length} of {users.length} users
            </Typography>
          </Box>
        )}
      </Container>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleEditClick}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItem>
      </Menu>

      {/* Edit User Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit User Account
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedUser && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Editing: <strong>{selectedUser.fullName}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedUser.email}
                </Typography>
              </Box>
            )}
            
            <FormControl fullWidth sx={{ mb: 3 }}>
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
              <InputLabel>Account Type</InputLabel>
              <Select
                value={editForm.accountType}
                label="Account Type"
                onChange={(e) => setEditForm({ ...editForm, accountType: e.target.value })}
              >
                <MenuItem value="RESEARCHER">Researcher</MenuItem>
                <MenuItem value="RESEARCH_ADMIN">Research Admin</MenuItem>
                <MenuItem value="FOUNDATION_ADMIN">Foundation Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleEditSubmit}
            variant="contained"
            sx={{
              bgcolor: '#8b6cbc',
              '&:hover': { bgcolor: '#7a5caa' }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
