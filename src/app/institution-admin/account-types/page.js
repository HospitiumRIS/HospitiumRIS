'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  AdminPanelSettings as AccountTypesIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/AuthProvider';
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
const HIDDEN_ACCOUNT_TYPES = ['GLOBAL_ADMIN'];

const emptyForm = {
  name: '',
  displayName: '',
  description: '',
  permissions: [],
  isActive: true,
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

function StatCard({ label, value, caption, icon: Icon }) {
  return (
    <Paper
      elevation={0}
      sx={{
        px: 2,
        py: 1.25,
        borderRadius: 2,
        border: `1px solid ${alpha(PURPLE, 0.12)}`,
        bgcolor: 'background.paper',
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

function PermissionsEditor({ permissions, newPermission, onNewPermissionChange, onAdd, onRemove }) {
  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Add permission (e.g. manage_users)"
          value={newPermission}
          onChange={(e) => onNewPermissionChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          sx={fieldSx}
        />
        <Button
          variant="outlined"
          onClick={onAdd}
          sx={{
            whiteSpace: 'nowrap',
            textTransform: 'none',
            fontWeight: 600,
            borderColor: alpha(PURPLE, 0.35),
            color: PURPLE_DARK,
            '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) },
          }}
        >
          Add
        </Button>
      </Stack>
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
        {permissions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No permissions added yet.</Typography>
        ) : (
          permissions.map((permission) => (
            <Chip
              key={permission}
              label={permission}
              size="small"
              onDelete={() => onRemove(permission)}
              sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE_DARK, fontWeight: 600 }}
            />
          ))
        )}
      </Stack>
    </Box>
  );
}

function AccountTypeCard({ type, onEdit, onDelete }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        borderRadius: 2,
        border: `1px solid ${alpha(PURPLE, type.isActive ? 0.12 : 0.08)}`,
        bgcolor: type.isActive ? 'background.paper' : alpha(PURPLE, 0.02),
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {type.displayName}
            </Typography>
            {type.isSystem ? (
              <Chip
                icon={<LockIcon sx={{ fontSize: '14px !important' }} />}
                label="System"
                size="small"
                sx={{ bgcolor: alpha(PURPLE, 0.12), color: PURPLE_DARK, fontWeight: 700, height: 22 }}
              />
            ) : null}
          </Stack>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {type.name}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => onEdit(type)}
              sx={{ color: PURPLE, bgcolor: alpha(PURPLE, 0.08), '&:hover': { bgcolor: alpha(PURPLE, 0.14) } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {!type.isSystem ? (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => onDelete(type)}
                sx={{ color: '#b91c1c', bgcolor: alpha('#b91c1c', 0.08), '&:hover': { bgcolor: alpha('#b91c1c', 0.14) } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minHeight: 40 }}>
        {type.description || 'No description provided.'}
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip
          size="small"
          icon={<ShieldIcon sx={{ fontSize: '14px !important' }} />}
          label={`${type.permissions?.length || 0} permissions`}
          sx={{ bgcolor: alpha(PURPLE, 0.08), color: PURPLE_DARK, fontWeight: 600 }}
        />
        <Chip
          size="small"
          icon={<PeopleIcon sx={{ fontSize: '14px !important' }} />}
          label={`${type.userCount || 0} users`}
          sx={{ bgcolor: alpha(PURPLE, 0.08), color: PURPLE_DARK, fontWeight: 600 }}
        />
        {type.isActive ? (
          <Chip
            size="small"
            icon={<CheckIcon sx={{ fontSize: '14px !important' }} />}
            label="Active"
            sx={{ bgcolor: alpha(PURPLE, 0.12), color: PURPLE_DARK, fontWeight: 700, height: 24 }}
          />
        ) : (
          <Chip
            size="small"
            icon={<CancelIcon sx={{ fontSize: '14px !important' }} />}
            label="Inactive"
            sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700, height: 24 }}
          />
        )}
      </Stack>

      {(type.permissions || []).length > 0 ? (
        <Box sx={{ pt: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Permissions
          </Typography>
          <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
            {type.permissions.slice(0, 4).map((permission) => (
              <Chip key={permission} label={permission} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
            ))}
            {type.permissions.length > 4 ? (
              <Chip label={`+${type.permissions.length - 4} more`} size="small" sx={{ fontSize: '0.7rem', height: 22 }} />
            ) : null}
          </Stack>
        </Box>
      ) : null}
    </Paper>
  );
}

const AccountTypesPage = () => {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [accountTypes, setAccountTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [newPermission, setNewPermission] = useState('');
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
      fetchAccountTypes();
    }
  }, [user]);

  const showNotice = (message, severity = 'success') => {
    setNotice({ open: true, message, severity });
  };

  const fetchAccountTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/institution-admin/account-types', { credentials: 'include' });
      const data = await response.json();

      if (data.success) {
        setAccountTypes(
          (data.accountTypes || []).filter((type) => !HIDDEN_ACCOUNT_TYPES.includes(type.name))
        );
      } else {
        showNotice(data.error || 'Failed to fetch account types', 'error');
      }
    } catch (error) {
      console.error('Error fetching account types:', error);
      showNotice('Failed to fetch account types', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOpen = () => {
    setFormData(emptyForm);
    setNewPermission('');
    setCreateDialogOpen(true);
  };

  const handleEditOpen = (accountType) => {
    setSelectedType(accountType);
    setFormData({
      name: accountType.name,
      displayName: accountType.displayName,
      description: accountType.description || '',
      permissions: accountType.permissions || [],
      isActive: accountType.isActive,
    });
    setNewPermission('');
    setEditDialogOpen(true);
  };

  const handleDeleteOpen = (accountType) => {
    setSelectedType(accountType);
    setDeleteDialogOpen(true);
  };

  const handleAddPermission = () => {
    const trimmed = newPermission.trim();
    if (!trimmed || formData.permissions.includes(trimmed)) return;
    setFormData((prev) => ({ ...prev, permissions: [...prev.permissions, trimmed] }));
    setNewPermission('');
  };

  const handleRemovePermission = (permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.filter((item) => item !== permission),
    }));
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.displayName.trim()) {
      showNotice('Name and display name are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/institution-admin/account-types', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        showNotice('Account type created');
        setCreateDialogOpen(false);
        fetchAccountTypes();
      } else {
        showNotice(data.error || 'Failed to create account type', 'error');
      }
    } catch (error) {
      console.error('Error creating account type:', error);
      showNotice('Failed to create account type', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedType) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/institution-admin/account-types/${selectedType.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName,
          description: formData.description,
          permissions: formData.permissions,
          isActive: formData.isActive,
        }),
      });
      const data = await response.json();

      if (data.success) {
        showNotice('Account type updated');
        setEditDialogOpen(false);
        fetchAccountTypes();
      } else {
        showNotice(data.error || 'Failed to update account type', 'error');
      }
    } catch (error) {
      console.error('Error updating account type:', error);
      showNotice('Failed to update account type', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedType) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/institution-admin/account-types/${selectedType.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        showNotice('Account type deleted');
        setDeleteDialogOpen(false);
        fetchAccountTypes();
      } else {
        showNotice(data.error || 'Failed to delete account type', 'error');
      }
    } catch (error) {
      console.error('Error deleting account type:', error);
      showNotice('Failed to delete account type', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredTypes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return accountTypes;
    return accountTypes.filter((type) => (
      type.displayName?.toLowerCase().includes(query)
      || type.name?.toLowerCase().includes(query)
      || type.description?.toLowerCase().includes(query)
    ));
  }, [accountTypes, search]);

  const stats = useMemo(() => ({
    total: accountTypes.length,
    system: accountTypes.filter((type) => type.isSystem).length,
    users: accountTypes.reduce((sum, type) => sum + (type.userCount || 0), 0),
    active: accountTypes.filter((type) => type.isActive).length,
  }), [accountTypes]);

  if (!user || user.accountType !== 'INSTITUTION_ADMIN') {
    return null;
  }

  return (
    <InstitutionAdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
        <PageHeading
          title={t('institution_admin.account_types', { defaultValue: 'Account Types' })}
          subtitle="Define roles and permissions available to users in your institution."
          action={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchAccountTypes}
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
                onClick={handleCreateOpen}
                sx={{
                  bgcolor: PURPLE,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: PURPLE_DARK },
                }}
              >
                Create account type
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
              <StatCard label="Total types" value={stats.total} caption="Configured account roles" icon={SecurityIcon} />
              <StatCard label="System roles" value={stats.system} caption="Built-in and protected" icon={ShieldIcon} />
              <StatCard label="Active types" value={stats.active} caption="Available for assignment" icon={CheckIcon} />
              <StatCard label="Assigned users" value={stats.users} caption="Across all account types" icon={PeopleIcon} />
            </>
          )}
        </Box>

        <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}` }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search account types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={fieldSx}
          />
        </Paper>

        {loading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={220} sx={{ borderRadius: 2 }} />
            ))}
          </Box>
        ) : filteredTypes.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 5,
              borderRadius: 2,
              border: `1px solid ${alpha(PURPLE, 0.12)}`,
              textAlign: 'center',
            }}
          >
            <AccountTypesIcon sx={{ fontSize: 40, color: alpha(PURPLE, 0.45), mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              {search ? 'No matching account types' : 'No account types yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {search ? 'Try a different search term.' : 'Create a custom role to get started.'}
            </Typography>
            {!search ? (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateOpen}
                sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: PURPLE_DARK } }}
              >
                Create account type
              </Button>
            ) : null}
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
            {filteredTypes.map((type) => (
              <AccountTypeCard
                key={type.id}
                type={type}
                onEdit={handleEditOpen}
                onDelete={handleDeleteOpen}
              />
            ))}
          </Box>
        )}
      </Box>

      <InstitutionModal open={createDialogOpen} onClose={() => !saving && setCreateDialogOpen(false)} disableClose={saving} maxWidth="md">
        <InstitutionModalHeader
          icon={AddIcon}
          title="Create account type"
          subtitle="Add a custom role with its own permissions."
          onClose={() => setCreateDialogOpen(false)}
          disableClose={saving}
        />
        <InstitutionModalBody>
          <InstitutionModalSection title="Role details">
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Name (internal)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                helperText="Use uppercase with underscores (e.g. RESEARCH_COORDINATOR)"
                sx={fieldSx}
              />
              <TextField
                fullWidth
                size="small"
                label="Display name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                helperText="User-friendly label shown in the UI"
                sx={fieldSx}
              />
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                sx={fieldSx}
              />
            </Stack>
          </InstitutionModalSection>
          <InstitutionModalSection title="Permissions">
            <PermissionsEditor
              permissions={formData.permissions}
              newPermission={newPermission}
              onNewPermissionChange={setNewPermission}
              onAdd={handleAddPermission}
              onRemove={handleRemovePermission}
            />
          </InstitutionModalSection>
          <FormControlLabel
            control={(
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: PURPLE }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: PURPLE } }}
              />
            )}
            label="Active"
          />
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={saving} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: PURPLE_DARK } }}
          >
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>

      <InstitutionModal open={editDialogOpen} onClose={() => !saving && setEditDialogOpen(false)} disableClose={saving} maxWidth="md">
        <InstitutionModalHeader
          icon={EditIcon}
          title="Edit account type"
          subtitle={selectedType?.displayName}
          onClose={() => setEditDialogOpen(false)}
          disableClose={saving}
        />
        <InstitutionModalBody>
          {selectedType?.isSystem ? (
            <Alert severity="info" sx={{ borderRadius: 1.5, mb: 0 }}>
              This is a system role. Its internal name cannot be changed.
            </Alert>
          ) : null}
          <InstitutionModalSection title="Role details">
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Display name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                sx={fieldSx}
              />
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                sx={fieldSx}
              />
            </Stack>
          </InstitutionModalSection>
          <InstitutionModalSection title="Permissions">
            <PermissionsEditor
              permissions={formData.permissions}
              newPermission={newPermission}
              onNewPermissionChange={setNewPermission}
              onAdd={handleAddPermission}
              onRemove={handleRemovePermission}
            />
          </InstitutionModalSection>
          <FormControlLabel
            control={(
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: PURPLE }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: PURPLE } }}
              />
            )}
            label="Active"
          />
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setEditDialogOpen(false)} disabled={saving} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: PURPLE_DARK } }}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>

      <InstitutionModal open={deleteDialogOpen} onClose={() => !saving && setDeleteDialogOpen(false)} disableClose={saving}>
        <InstitutionModalHeader
          icon={DeleteIcon}
          title="Delete account type"
          subtitle="This action cannot be undone"
          tone="danger"
          onClose={() => setDeleteDialogOpen(false)}
          disableClose={saving}
        />
        <InstitutionModalBody>
          <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
            Delete <strong>{selectedType?.displayName}</strong>?
          </Alert>
          {selectedType?.userCount > 0 ? (
            <Alert severity="error" sx={{ borderRadius: 1.5 }}>
              This role is assigned to {selectedType.userCount} user(s) and cannot be deleted.
            </Alert>
          ) : null}
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={saving || selectedType?.userCount > 0}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? 'Deleting...' : 'Delete'}
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

export default AccountTypesPage;
