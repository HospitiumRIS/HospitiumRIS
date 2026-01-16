'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
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
  Chip,
  Stack,
  Avatar,
  Alert,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Shield as ShieldIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import SuperAdminLayout from '../../../components/SuperAdmin/SuperAdminLayout';

const AccountTypesPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [accountTypes, setAccountTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });
  
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [],
    isActive: true
  });

  const [newPermission, setNewPermission] = useState('');

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

  useEffect(() => {
    if (user?.accountType === 'SUPER_ADMIN') {
      fetchAccountTypes();
    }
  }, [user]);

  const fetchAccountTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/account-types');
      const data = await response.json();

      if (data.success) {
        setAccountTypes(data.accountTypes);
      } else {
        showAlert(data.error || 'Failed to fetch account types', 'error');
      }
    } catch (error) {
      console.error('Error fetching account types:', error);
      showAlert('Failed to fetch account types', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, severity = 'info') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'info' }), 5000);
  };

  const handleCreateOpen = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      permissions: [],
      isActive: true
    });
    setCreateDialogOpen(true);
  };

  const handleEditOpen = (accountType) => {
    setSelectedType(accountType);
    setFormData({
      name: accountType.name,
      displayName: accountType.displayName,
      description: accountType.description || '',
      permissions: accountType.permissions || [],
      isActive: accountType.isActive
    });
    setEditDialogOpen(true);
  };

  const handleDeleteOpen = (accountType) => {
    setSelectedType(accountType);
    setDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/super-admin/account-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        showAlert('Account type created successfully', 'success');
        setCreateDialogOpen(false);
        fetchAccountTypes();
      } else {
        showAlert(data.error || 'Failed to create account type', 'error');
      }
    } catch (error) {
      console.error('Error creating account type:', error);
      showAlert('Failed to create account type', 'error');
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/super-admin/account-types/${selectedType.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName,
          description: formData.description,
          permissions: formData.permissions,
          isActive: formData.isActive
        })
      });

      const data = await response.json();

      if (data.success) {
        showAlert('Account type updated successfully', 'success');
        setEditDialogOpen(false);
        fetchAccountTypes();
      } else {
        showAlert(data.error || 'Failed to update account type', 'error');
      }
    } catch (error) {
      console.error('Error updating account type:', error);
      showAlert('Failed to update account type', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/super-admin/account-types/${selectedType.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        showAlert('Account type deleted successfully', 'success');
        setDeleteDialogOpen(false);
        fetchAccountTypes();
      } else {
        showAlert(data.error || 'Failed to delete account type', 'error');
      }
    } catch (error) {
      console.error('Error deleting account type:', error);
      showAlert('Failed to delete account type', 'error');
    }
  };

  const handleAddPermission = () => {
    if (newPermission.trim() && !formData.permissions.includes(newPermission.trim())) {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, newPermission.trim()]
      });
      setNewPermission('');
    }
  };

  const handleRemovePermission = (permission) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.filter(p => p !== permission)
    });
  };

  if (!user || user.accountType !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <SuperAdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ 
          mb: 4,
          pb: 3,
          borderBottom: '2px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#8b6cbc', width: 56, height: 56, boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)' }}>
                <SecurityIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: '-0.02em' }}>
                  Account Types Management
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Create and manage user account types and permissions
                </Typography>
              </Box>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchAccountTypes}
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
                startIcon={<AddIcon />}
                onClick={handleCreateOpen}
                sx={{
                  bgcolor: '#8b6cbc',
                  '&:hover': {
                    bgcolor: '#7a5caa'
                  },
                  boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)'
                }}
              >
                Create Account Type
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

        {/* Statistics */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Card sx={{ flex: '1 1 calc(33.333% - 12px)', minWidth: '200px', background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)', color: 'white' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 44, height: 44 }}>
                  <SecurityIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {accountTypes.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Account Types
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 calc(33.333% - 12px)', minWidth: '200px', background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)', color: 'white' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 44, height: 44 }}>
                  <ShieldIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {accountTypes.filter(t => t.isSystem).length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    System Roles
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 calc(33.333% - 12px)', minWidth: '200px', background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)', color: 'white' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 44, height: 44 }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {accountTypes.reduce((sum, t) => sum + (t.userCount || 0), 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Users
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Account Types Table */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Account Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Permissions</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Users</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accountTypes.map((type) => (
                    <TableRow key={type.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1" fontWeight="medium">
                            {type.displayName}
                          </Typography>
                          {type.isSystem && (
                            <Chip icon={<LockIcon />} label="System" size="small" color="primary" />
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {type.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {type.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={`${type.permissions.length} permissions`} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip icon={<PeopleIcon />} label={type.userCount || 0} size="small" />
                      </TableCell>
                      <TableCell>
                        {type.isActive ? (
                          <Chip icon={<CheckIcon />} label="Active" color="success" size="small" />
                        ) : (
                          <Chip icon={<CancelIcon />} label="Inactive" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEditOpen(type)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {!type.isSystem && (
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDeleteOpen(type)}>
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
          )}
        </Paper>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)', color: 'white' }}>
            Create New Account Type
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Name (Internal)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                helperText="Use uppercase with underscores (e.g., GLOBAL_ADMIN)"
              />
              <TextField
                fullWidth
                label="Display Name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                helperText="User-friendly name (e.g., Global Admin)"
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Permissions
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add permission (e.g., manage_users)"
                    value={newPermission}
                    onChange={(e) => setNewPermission(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPermission()}
                  />
                  <Button variant="outlined" onClick={handleAddPermission}>
                    Add
                  </Button>
                </Stack>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.permissions.map((permission, index) => (
                    <Chip
                      key={index}
                      label={permission}
                      onDelete={() => handleRemovePermission(permission)}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreate} sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7a5caa' } }}>
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)', color: 'white' }}>
            Edit Account Type
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Stack spacing={3}>
              {selectedType?.isSystem && (
                <Alert severity="info">
                  This is a system account type. Some fields cannot be modified.
                </Alert>
              )}
              <TextField
                fullWidth
                label="Display Name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Permissions
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add permission"
                    value={newPermission}
                    onChange={(e) => setNewPermission(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPermission()}
                  />
                  <Button variant="outlined" onClick={handleAddPermission}>
                    Add
                  </Button>
                </Stack>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.permissions.map((permission, index) => (
                    <Chip
                      key={index}
                      label={permission}
                      onDelete={() => handleRemovePermission(permission)}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdate} sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7a5caa' } }}>
              Update
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Account Type</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the account type "{selectedType?.displayName}"?
            </Typography>
            {selectedType?.userCount > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                This account type has {selectedType.userCount} user(s) assigned. You cannot delete it.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleDelete}
              disabled={selectedType?.userCount > 0}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </SuperAdminLayout>
  );
};

export default AccountTypesPage;
