'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Avatar,
  Chip,
  Button,
  TextField,
  InputAdornment,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  FormControlLabel,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ManageAccounts as ManageIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  SupervisorAccount as SuperAdminIcon,
  Shield as ShieldIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const RoleManagement = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleForm, setRoleForm] = useState({
    accountType: '',
    permissions: {
      canManageUsers: false,
      canManageResearchers: false,
      canViewAnalytics: false,
      canManageProposals: false,
      canExportData: false,
    }
  });

  const roleDefinitions = [
    {
      type: 'RESEARCHER',
      label: 'Researcher',
      icon: <PersonIcon />,
      color: '#8b6cbc',
      description: 'Can create manuscripts, publications, and collaborate with others',
      permissions: [
        'Create and manage manuscripts',
        'Import and manage publications',
        'Collaborate with other researchers',
        'Submit proposals',
        'View personal analytics'
      ]
    },
    {
      type: 'RESEARCH_ADMIN',
      label: 'Research Admin',
      icon: <SchoolIcon />,
      color: '#2563eb',
      description: 'Institutional administrator with full research management capabilities',
      permissions: [
        'All researcher permissions',
        'Manage institutional users',
        'Review and approve proposals',
        'Access institutional analytics',
        'Manage researcher performance',
        'Export institutional data'
      ]
    },
    {
      type: 'FOUNDATION_ADMIN',
      label: 'Foundation Admin',
      icon: <BusinessIcon />,
      color: '#059669',
      description: 'Foundation administrator managing grants and funding',
      permissions: [
        'Manage foundation profile',
        'Create and manage grants',
        'Review grant applications',
        'Track funding distribution',
        'Access donation analytics',
        'Manage campaigns'
      ]
    },
    {
      type: 'SUPER_ADMIN',
      label: 'Super Admin',
      icon: <SuperAdminIcon />,
      color: '#dc2626',
      description: 'System administrator with full platform access',
      permissions: [
        'All system permissions',
        'Manage all users and institutions',
        'Access system-wide analytics',
        'Database management',
        'System configuration',
        'Security settings'
      ]
    }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, selectedRole, users]);

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

    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.accountType === selectedRole);
    }

    setFilteredUsers(filtered);
  };

  const handleEditRole = (user) => {
    setSelectedUser(user);
    setRoleForm({
      accountType: user.accountType,
      permissions: {
        canManageUsers: user.accountType === 'RESEARCH_ADMIN' || user.accountType === 'SUPER_ADMIN',
        canManageResearchers: user.accountType === 'RESEARCH_ADMIN' || user.accountType === 'SUPER_ADMIN',
        canViewAnalytics: user.accountType !== 'RESEARCHER',
        canManageProposals: user.accountType === 'RESEARCH_ADMIN' || user.accountType === 'SUPER_ADMIN',
        canExportData: user.accountType === 'RESEARCH_ADMIN' || user.accountType === 'SUPER_ADMIN',
      }
    });
    setEditDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/institution/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          accountType: roleForm.accountType
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      await fetchUsers();
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Failed to update role: ' + err.message);
    }
  };

  const getRoleInfo = (accountType) => {
    return roleDefinitions.find(r => r.type === accountType) || roleDefinitions[0];
  };

  const getInitials = (user) => {
    const first = user.givenName?.[0] || '';
    const last = user.familyName?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

  const getRoleStats = () => {
    return {
      researcher: users.filter(u => u.accountType === 'RESEARCHER').length,
      researchAdmin: users.filter(u => u.accountType === 'RESEARCH_ADMIN').length,
      foundationAdmin: users.filter(u => u.accountType === 'FOUNDATION_ADMIN').length,
      superAdmin: users.filter(u => u.accountType === 'SUPER_ADMIN').length,
    };
  };

  const stats = getRoleStats();

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Role Management"
          description="Assign and manage user roles"
          icon={<ManageIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'User Management', path: '/institution/users' },
            { label: 'Role Management' }
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
          title="Role Management"
          description="Assign and manage user roles"
          icon={<ManageIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'User Management', path: '/institution/users' },
            { label: 'Role Management' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="error" gutterBottom>
              Error Loading Role Data
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
        title="Role Management"
        description="Assign and manage user roles"
        icon={<ManageIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Institution', path: '/institution' },
          { label: 'User Management', path: '/institution/users' },
          { label: 'Role Management' }
        ]}
        gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Role Definitions */}
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Role Definitions
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {roleDefinitions.map((role) => (
            <Grid item xs={12} md={6} key={role.type}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: alpha(role.color, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: role.color
                      }}
                    >
                      {role.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {role.label}
                        </Typography>
                        <Chip
                          label={role.type === 'RESEARCHER' ? stats.researcher :
                                role.type === 'RESEARCH_ADMIN' ? stats.researchAdmin :
                                role.type === 'FOUNDATION_ADMIN' ? stats.foundationAdmin :
                                stats.superAdmin}
                          size="small"
                          sx={{
                            bgcolor: alpha(role.color, 0.1),
                            color: role.color,
                            fontWeight: 600
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {role.description}
                      </Typography>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Permissions
                      </Typography>
                      <List dense sx={{ mt: 1 }}>
                        {role.permissions.map((permission, index) => (
                          <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 28 }}>
                              <CheckCircleIcon sx={{ fontSize: 16, color: role.color }} />
                            </ListItemIcon>
                            <ListItemText 
                              primary={permission}
                              primaryTypographyProps={{
                                variant: 'body2',
                                sx: { fontSize: '0.875rem' }
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* User Role Assignments */}
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          User Role Assignments
        </Typography>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search users by name or email..."
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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Filter by Role</InputLabel>
                <Select
                  value={selectedRole}
                  label="Filter by Role"
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="RESEARCHER">Researcher</MenuItem>
                  <MenuItem value="RESEARCH_ADMIN">Research Admin</MenuItem>
                  <MenuItem value="FOUNDATION_ADMIN">Foundation Admin</MenuItem>
                  <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Users Table */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {filteredUsers.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <GroupIcon sx={{ fontSize: 64, color: '#e5e7eb', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#6b7280', mb: 1 }}>
                No users found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filters
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
                      Current Role
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>
                      Institution
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2, textAlign: 'center' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const roleInfo = getRoleInfo(user.accountType);
                    return (
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
                                bgcolor: roleInfo.color,
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
                            icon={roleInfo.icon}
                            label={roleInfo.label}
                            sx={{
                              backgroundColor: alpha(roleInfo.color, 0.1),
                              color: roleInfo.color,
                              fontWeight: 500,
                              '& .MuiChip-icon': {
                                color: roleInfo.color
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Typography variant="body2" sx={{ color: '#374151' }}>
                            {user.primaryInstitution || user.institution?.name || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Chip
                            label={user.status}
                            size="small"
                            color={user.status === 'ACTIVE' ? 'success' : 'default'}
                            sx={{ 
                              fontWeight: 500,
                              textTransform: 'capitalize'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 2.5, textAlign: 'center' }}>
                          <Tooltip title="Edit Role">
                            <IconButton
                              size="small"
                              onClick={() => handleEditRole(user)}
                              sx={{ color: '#8b6cbc' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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

      {/* Edit Role Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShieldIcon sx={{ color: '#8b6cbc' }} />
            <Typography variant="h6">Edit User Role</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedUser && (
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  User
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedUser.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedUser.email}
                </Typography>
              </Box>
            )}
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Account Role</InputLabel>
              <Select
                value={roleForm.accountType}
                label="Account Role"
                onChange={(e) => setRoleForm({ ...roleForm, accountType: e.target.value })}
              >
                {roleDefinitions.map((role) => (
                  <MenuItem key={role.type} value={role.type}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color: role.color }}>{role.icon}</Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {role.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {role.description}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {roleForm.accountType && (
              <Paper sx={{ p: 3, bgcolor: '#f9fafb' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Role Permissions
                </Typography>
                <List dense>
                  {getRoleInfo(roleForm.accountType).permissions.map((permission, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleIcon sx={{ fontSize: 18, color: getRoleInfo(roleForm.accountType).color }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={permission}
                        primaryTypographyProps={{
                          variant: 'body2'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveRole}
            variant="contained"
            startIcon={<ShieldIcon />}
            sx={{
              bgcolor: '#8b6cbc',
              '&:hover': { bgcolor: '#7a5caa' }
            }}
          >
            Update Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleManagement;
