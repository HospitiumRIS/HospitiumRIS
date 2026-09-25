'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert,
  Avatar,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Business as InstitutionIcon,
  Email as EmailIcon,
  ChevronRight as ChevronRightIcon,
  Domain as DomainIcon,
  Apps as AppsIcon,
  CheckCircle as CheckCircleIcon,
  Groups as GroupsIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import GlobalAdminLayout from '../../../components/GlobalAdmin/GlobalAdminLayout';
import CreateInstitutionWizard from '../../../components/GlobalAdmin/CreateInstitutionWizard';
import {
  InstitutionActionButtons,
  EditInstitutionDialog,
  ReassignAdminDialog,
  ResetAdminPasswordDialog,
  DeleteInstitutionDialog,
} from '../../../components/GlobalAdmin/InstitutionManageDialogs';

function formatAdminName(admin) {
  return [admin?.givenName, admin?.familyName].filter(Boolean).join(' ');
}

function adminInitials(admin) {
  const name = formatAdminName(admin);
  if (name) return name.slice(0, 2).toUpperCase();
  return admin?.email?.slice(0, 2).toUpperCase() || '?';
}

function StatCard({ icon: Icon, label, value }) {
  const theme = useTheme();
  const purple = theme.palette.primary;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(purple.main, 0.22),
        background: `linear-gradient(145deg, ${alpha(purple.main, 0.16)} 0%, ${alpha(purple.main, 0.06)} 55%, ${alpha(purple.light, 0.04)} 100%)`,
      }}
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
            bgcolor: alpha(purple.main, 0.2),
            color: purple.main,
            boxShadow: `0 6px 16px ${alpha(purple.main, 0.16)}`,
          }}
        >
          <Icon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1, color: purple.dark }}>
            {value}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.25, color: alpha(purple.dark, 0.72) }}>
            {label}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

const InstitutionsPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchReady, setSearchReady] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeInstitution, setActiveInstitution] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.accountType !== 'GLOBAL_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    if (user?.accountType === 'GLOBAL_ADMIN') {
      fetchInstitutions();
    }
  }, [user]);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/global-admin/institutions');
      if (response.ok) {
        const data = await response.json();
        setInstitutions(data.institutions || []);
      }
    } catch (error) {
      console.error('Error fetching institutions:', error);
      showAlert('Failed to fetch institutions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, severity = 'info') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'info' }), 5000);
  };

  const openDialog = (nextDialog, institution) => {
    setActiveInstitution(institution);
    setDialog(nextDialog);
  };

  const closeDialog = () => {
    setDialog(null);
    setActiveInstitution(null);
  };

  const handleDialogSaved = (_payload, message) => {
    showAlert(message || 'Updated', 'success');
    fetchInstitutions();
  };

  const handleInstitutionDeleted = (_payload, message) => {
    showAlert(message || 'Institution deleted', 'success');
    fetchInstitutions();
  };

  const filteredInstitutions = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return institutions;
    return institutions.filter((inst) =>
      inst.name?.toLowerCase().includes(term) ||
      inst.slug?.toLowerCase().includes(term) ||
      inst.contactEmail?.toLowerCase().includes(term) ||
      inst.admin?.email?.toLowerCase().includes(term) ||
      `${inst.admin?.givenName || ''} ${inst.admin?.familyName || ''}`.toLowerCase().includes(term)
    );
  }, [institutions, searchTerm]);

  const stats = useMemo(() => ({
    total: institutions.length,
    withAdmin: institutions.filter((inst) => inst.admin).length,
    active: institutions.filter((inst) => inst.admin?.status === 'ACTIVE').length,
    domains: institutions.reduce((sum, inst) => sum + (inst.domains?.length || 0), 0),
  }), [institutions]);

  if (!user || user.accountType !== 'GLOBAL_ADMIN') {
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

  return (
    <GlobalAdminLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Page header */}
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
                <InstitutionIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                  {t('global_admin.manage_institutions')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {t('global_admin.institution_admins')} - onboard tenants, domains, and system admins
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setWizardOpen(true)}
              sx={{ borderRadius: 2, px: 2.5, boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.28)}` }}
            >
              {t('global_admin.add_institution')}
            </Button>
          </Stack>
        </Paper>

        {alert.show && (
          <Alert severity={alert.severity} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setAlert({ ...alert, show: false })}>
            {alert.message}
          </Alert>
        )}

        {/* Summary stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={InstitutionIcon} label="Total institutions" value={stats.total} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={GroupsIcon} label="With system admin" value={stats.withAdmin} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={CheckCircleIcon} label="Active admins" value={stats.active} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={DomainIcon} label="Verified domains" value={stats.domains} />
          </Grid>
        </Grid>

        {/* Search + table */}
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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
              <Box sx={{ position: 'relative', flex: 1, maxWidth: { sm: 480 } }}>
                <Box
                  aria-hidden
                  sx={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}
                >
                  <input type="text" name="username" autoComplete="username" tabIndex={-1} readOnly />
                  <input type="password" name="password" autoComplete="current-password" tabIndex={-1} readOnly />
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  type="text"
                  name="institution-filter"
                  role="search"
                  autoComplete="off"
                  placeholder="Search by name, slug, email, or admin..."
                  value={searchTerm}
                  onFocus={() => setSearchReady(true)}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  inputProps={{
                    autoComplete: 'off',
                    autoCorrect: 'off',
                    spellCheck: 'false',
                    readOnly: !searchReady,
                    'data-lpignore': 'true',
                    'data-1p-ignore': 'true',
                    'data-form-type': 'search',
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm ? (
                      <InputAdornment position="end">
                        <IconButton size="small" aria-label="Clear search" onClick={() => setSearchTerm('')}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                    sx: { borderRadius: 2, bgcolor: 'background.paper' },
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                {loading
                  ? 'Loading...'
                  : `${filteredInstitutions.length} of ${institutions.length} institution${institutions.length === 1 ? '' : 's'}`}
              </Typography>
            </Stack>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={headCellSx}>{t('global_admin.institution_name')}</TableCell>
                  <TableCell sx={headCellSx}>{t('global_admin.institution_slug', { defaultValue: 'Slug' })}</TableCell>
                  <TableCell sx={headCellSx}>{t('global_admin.contact_email', { defaultValue: 'Contact' })}</TableCell>
                  <TableCell sx={headCellSx}>System admin</TableCell>
                  <TableCell sx={headCellSx} align="center">{t('global_admin.verified_domains', { defaultValue: 'Domains' })}</TableCell>
                  <TableCell sx={headCellSx} align="center">{t('global_admin.modules', { defaultValue: 'Modules' })}</TableCell>
                  <TableCell sx={headCellSx}>{t('common.status')}</TableCell>
                  <TableCell sx={headCellSx} align="right">{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                      <Stack spacing={2} alignItems="center">
                        <CircularProgress size={36} />
                        <Typography variant="body2" color="text.secondary">
                          Loading institutions...
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : filteredInstitutions.length > 0 ? (
                  filteredInstitutions.map((institution) => (
                    <TableRow
                      key={institution.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:last-child td': { borderBottom: 0 },
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                      }}
                      onClick={() => router.push(`/global-admin/institutions/${institution.id}`)}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: alpha(theme.palette.primary.main, 0.12),
                              color: 'primary.main',
                              fontSize: 14,
                            }}
                          >
                            <InstitutionIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>
                            {institution.name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={institution.slug}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            borderColor: alpha(theme.palette.divider, 0.9),
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <EmailIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>
                            {institution.contactEmail || '-'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {institution.admin ? (
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 12 }}>
                              {adminInitials(institution.admin)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>
                                {formatAdminName(institution.admin)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 180, display: 'block' }}>
                                {institution.admin.email}
                                {(institution.admins?.length || 0) > 1
                                  ? ` · +${institution.admins.length - 1} more`
                                  : ''}
                              </Typography>
                            </Box>
                          </Stack>
                        ) : (
                          <Chip label="No admin" size="small" variant="outlined" color="warning" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<DomainIcon sx={{ fontSize: '14px !important' }} />}
                          label={institution.domains?.length || 0}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<AppsIcon sx={{ fontSize: '14px !important' }} />}
                          label={institution.enabledModules?.length || 0}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={institution.admin?.status || 'PENDING'}
                          color={institution.admin?.status === 'ACTIVE' ? 'success' : 'default'}
                          size="small"
                          variant={institution.admin?.status === 'ACTIVE' ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 600, minWidth: 72 }}
                        />
                      </TableCell>
                      <TableCell
                        align="right"
                        onClick={(event) => event.stopPropagation()}
                        sx={{ whiteSpace: 'nowrap', py: 1.5 }}
                      >
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
                          <InstitutionActionButtons
                            institution={institution}
                            onEdit={() => openDialog('edit', institution)}
                            onReassign={() => openDialog('reassign', institution)}
                            onReset={() => openDialog('reset', institution)}
                            onDelete={() => openDialog('delete', institution)}
                          />
                          <Tooltip title="Open institution">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(event) => {
                                event.stopPropagation();
                                router.push(`/global-admin/institutions/${institution.id}`);
                              }}
                            >
                              <ChevronRightIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
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
                          <InstitutionIcon sx={{ fontSize: 32 }} />
                        </Box>
                        <Typography variant="h6" fontWeight={600}>
                          {searchTerm ? 'No matching institutions' : 'No institutions yet'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                          {searchTerm
                            ? 'Try a different search term or clear the filter to see all institutions.'
                            : 'Create your first institution to assign domains and a system admin.'}
                        </Typography>
                        {searchTerm ? (
                          <Button variant="outlined" onClick={() => setSearchTerm('')} sx={{ borderRadius: 2 }}>
                            Clear search
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setWizardOpen(true)}
                            sx={{ borderRadius: 2 }}
                          >
                            {t('global_admin.add_institution')}
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <CreateInstitutionWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onComplete={() => {
            showAlert('Institution created successfully', 'success');
            fetchInstitutions();
          }}
        />
        <EditInstitutionDialog
          open={dialog === 'edit'}
          institution={activeInstitution}
          onClose={closeDialog}
          onSaved={handleDialogSaved}
        />
        <ReassignAdminDialog
          open={dialog === 'reassign'}
          institution={activeInstitution}
          onClose={closeDialog}
          onSaved={handleDialogSaved}
        />
        <ResetAdminPasswordDialog
          open={dialog === 'reset'}
          institution={activeInstitution}
          onClose={closeDialog}
          onSaved={handleDialogSaved}
        />
        <DeleteInstitutionDialog
          open={dialog === 'delete'}
          institution={activeInstitution}
          onClose={closeDialog}
          onDeleted={handleInstitutionDeleted}
        />
      </Container>
    </GlobalAdminLayout>
  );
};

export default InstitutionsPage;
