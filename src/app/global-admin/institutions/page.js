'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  TextField,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Business as InstitutionIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  ChevronRight as ChevronRightIcon,
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
} from '../../../components/GlobalAdmin/InstitutionManageDialogs';

const InstitutionsPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredInstitutions = institutions.filter((inst) => {
    const term = searchTerm.toLowerCase();
    return (
      inst.name?.toLowerCase().includes(term) ||
      inst.slug?.toLowerCase().includes(term) ||
      inst.contactEmail?.toLowerCase().includes(term) ||
      inst.admin?.email?.toLowerCase().includes(term) ||
      `${inst.admin?.givenName || ''} ${inst.admin?.familyName || ''}`.toLowerCase().includes(term)
    );
  });

  if (!user || user.accountType !== 'GLOBAL_ADMIN') {
    return null;
  }

  return (
    <GlobalAdminLayout>
      <Container maxWidth="xl" sx={{ pt: { xs: 6, sm: 7, md: 8 } }}>
        <Box sx={{ mb: 4, pb: 3, borderBottom: '2px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: '-0.02em', color: theme.palette.text.primary }}>
                {t('global_admin.manage_institutions')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('global_admin.institution_admins')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchInstitutions} color="primary">
                {t('common.refresh')}
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setWizardOpen(true)} color="primary">
                {t('global_admin.add_institution')}
              </Button>
            </Box>
          </Box>
        </Box>

        {alert.show && (
          <Alert severity={alert.severity} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setAlert({ ...alert, show: false })}>
            {alert.message}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            type="search"
            name="institutionSearch"
            autoComplete="off"
            placeholder="Search institutions by name, slug, or email..."
            value={searchTerm}
            onChange={(e) => {
              if (dialog) return;
              setSearchTerm(e.target.value);
            }}
            inputProps={{
              autoComplete: 'off',
              autoCorrect: 'off',
              spellCheck: 'false',
              'data-lpignore': 'true',
              'data-1p-ignore': 'true',
              'data-form-type': 'other',
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>{t('global_admin.institution_name')}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>{t('global_admin.institution_slug', { defaultValue: 'Slug' })}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>{t('global_admin.contact_email', { defaultValue: 'Contact email' })}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>{t('admin.users')}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>{t('global_admin.verified_domains', { defaultValue: 'Domains' })}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>{t('global_admin.modules', { defaultValue: 'Modules' })}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>{t('common.status')}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">
                        Loading institutions...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredInstitutions.length > 0 ? (
                  filteredInstitutions.map((institution) => (
                    <TableRow
                      key={institution.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/global-admin/institutions/${institution.id}`)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <InstitutionIcon fontSize="small" color="primary" />
                          <Typography variant="body2" fontWeight={600}>
                            {institution.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {institution.slug}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2">{institution.contactEmail || '—'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {institution.admin ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                              <PersonIcon fontSize="small" />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {institution.admin.givenName} {institution.admin.familyName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {institution.admin.email}
                              </Typography>
                            </Box>
                          </Box>
                        ) : (
                          <Chip label="No admin" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {institution.domains?.length || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {institution.enabledModules?.length || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={institution.admin?.status || 'PENDING'}
                          color={institution.admin?.status === 'ACTIVE' ? 'success' : 'default'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="right" onClick={(event) => event.stopPropagation()} sx={{ whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <InstitutionActionButtons
                            institution={institution}
                            onEdit={() => openDialog('edit', institution)}
                            onReassign={() => openDialog('reassign', institution)}
                            onReset={() => openDialog('reset', institution)}
                          />
                          <Tooltip title="Open institution">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => router.push(`/global-admin/institutions/${institution.id}`)}
                            >
                              <ChevronRightIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">
                        No institutions found
                      </Typography>
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
      </Container>
    </GlobalAdminLayout>
  );
};

export default InstitutionsPage;
