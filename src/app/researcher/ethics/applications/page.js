'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SubmitIcon,
  Shield as EthicsIcon,
  Groups as GroupsIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
  Article as ArticleIcon,
  Home as HomeIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';
import { useTranslation } from 'react-i18next';
import UploadCertificateDialog from '../../../../components/Ethics/UploadCertificateDialog';
import RowActions from '../../../../components/common/RowActions';
import StatusPill, { humanizeStatus } from '../../../../components/common/StatusPill';
import {
  FilterBar, PurpleTableHead, StatCards, TablePaper, filterFieldSx, paginationSx, zebraRowSx,
} from '../../../../components/common/ListPage';

const ETHICS_STATUS_TONE = {
  DRAFT: 'neutral',
  SUBMITTED: 'info',
  UNDER_REVIEW: 'progress',
  APPROVED: 'success',
  CONDITIONAL_APPROVAL: 'success',
  REJECTED: 'danger',
  REVISION_REQUESTED: 'warning',
  WITHDRAWN: 'neutral',
  EXPIRED: 'warning',
};

export default function EthicsApplicationsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('upload') === '1') {
      setUploadOpen(true);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (user?.id) {
      fetchApplications();
    } else {
      setLoading(false);
    }
  }, [user?.id, authLoading]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const query = user?.id ? `?userId=${encodeURIComponent(user.id)}` : '';
      const response = await fetch(`/api/ethics/applications${query}`);
      const data = await response.json();
      
      if (data.success) {
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Error fetching ethics applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const isExternalCertificate = (application) =>
    application?.source === 'EXTERNAL_CERTIFICATE' ||
    (Array.isArray(application?.documents) &&
      application.documents.some(
        (doc) => doc?.type === 'Ethics Clearance Certificate' || doc?.source === 'EXTERNAL_CERTIFICATE'
      ));

  const certificateUrl = (application) => {
    const docs = Array.isArray(application?.documents) ? application.documents : [];
    const cert = docs.find((doc) => doc.type === 'Ethics Clearance Certificate') || docs[0];
    return cert?.url || null;
  };

  const handleView = (application) => {
    router.push(`/researcher/ethics/applications/view/${application.id}`);
  };

  const handleEdit = (application) => {
    router.push(`/researcher/ethics/applications/edit/${application.id}`);
  };

  const handleDelete = async (application) => {
    const external = isExternalCertificate(application);
    const message = external
      ? 'Remove this uploaded ethics clearance certificate from your records?'
      : 'Are you sure you want to delete this ethics application?';
    if (confirm(message)) {
      try {
        const response = await fetch(`/api/ethics/applications/${application.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchApplications();
        }
      } catch (error) {
        console.error('Error deleting application:', error);
      }
    }
  };

  const handleDownloadCertificate = (application) => {
    const url = certificateUrl(application);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleCertificateUploaded = () => {
    setNotice(t('researcher.ethics_cert_upload_success', 'Ethics clearance certificate uploaded.'));
    fetchApplications();
  };

  const handleSubmit = async (application) => {
    if (confirm('Are you sure you want to submit this ethics application for review?')) {
      try {
        const response = await fetch(`/api/ethics/applications/${application.id}/submit`, {
          method: 'POST',
        });

        if (response.ok) {
          fetchApplications();
        }
      } catch (error) {
        console.error('Error submitting application:', error);
      }
    }
  };

  const filteredApplications = applications.filter(app => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      (app.title || '').toLowerCase().includes(q) ||
      (app.principalInvestigator || '').toLowerCase().includes(q) ||
      (app.referenceNumber || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: applications.length,
    draft: applications.filter(a => a.status === 'DRAFT').length,
    submitted: applications.filter(a => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length,
    approved: applications.filter(a => a.status === 'APPROVED' || a.status === 'CONDITIONAL_APPROVAL').length,
  };

  const statusOptions = [...new Set(applications.map((a) => a.status).filter(Boolean))];
  const lastPage = Math.max(0, Math.ceil(filteredApplications.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, lastPage);
  const pagedApplications = filteredApplications.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage);

  const rowActions = (application) => {
    const external = isExternalCertificate(application);
    const editable = ['DRAFT', 'REVISION_REQUESTED'].includes(application.status) && !external;
    const actions = [
      { key: 'view', label: t('common.view'), icon: <ViewIcon fontSize="small" />, onClick: () => handleView(application) },
    ];
    if (editable) {
      actions.push({ key: 'edit', label: t('common.edit'), icon: <EditIcon fontSize="small" />, onClick: () => handleEdit(application) });
    }
    const menuItems = [];
    if (external && certificateUrl(application)) {
      menuItems.push({ key: 'download', label: t('researcher.ethics_download_certificate', 'Download Certificate'), icon: <DownloadIcon fontSize="small" />, onClick: () => handleDownloadCertificate(application) });
    }
    if (application.status === 'DRAFT' && !external) {
      menuItems.push({ key: 'submit', label: t('common.submit'), icon: <SubmitIcon fontSize="small" />, onClick: () => handleSubmit(application) });
    }
    if (external || application.status === 'DRAFT') {
      menuItems.push({ key: 'delete', label: t('common.delete'), icon: <DeleteIcon fontSize="small" />, onClick: () => handleDelete(application), danger: true });
    }
    return { actions, menuItems };
  };

  return (
    <Box>
      {/* Page Header */}
      <PageHeader
        title={t('researcher.ethics_applications')}
        description={t('researcher.ethics_applications_desc')}
        icon={<EthicsIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' },
          { label: 'Ethics', path: '/researcher/ethics' }
        ]}
        actionButton={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setUploadOpen(true)}
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.12)',
                },
              }}
            >
              {t('researcher.ethics_upload_certificate', 'Upload Existing Certificate')}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/researcher/ethics/applications/create')}
              sx={{ 
                bgcolor: 'white',
                color: '#8b6cbc',
                boxShadow: '0 4px 12px rgba(255, 255, 255, 0.3)',
                '&:hover': { 
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 6px 16px rgba(255, 255, 255, 0.4)',
                }
              }}
            >
              {t('researcher.ethics_create')}
            </Button>
          </Box>
        }
      />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {notice && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setNotice('')}>
            {notice}
          </Alert>
        )}

        <StatCards cards={[
          { label: 'Total Applications', value: stats.total, sub: 'All ethics applications', icon: <GroupsIcon /> },
          { label: 'Draft Applications', value: stats.draft, sub: 'Work in progress', icon: <DescriptionIcon /> },
          { label: 'Under Review', value: stats.submitted, sub: 'Submitted for review', icon: <AssessmentIcon /> },
          { label: 'Approved', value: stats.approved, sub: 'Approved applications', icon: <ArticleIcon /> },
        ]} />

        <FilterBar
          search={searchQuery}
          onSearchChange={(value) => { setSearchQuery(value); setPage(0); }}
          searchPlaceholder="Search by title, investigator or reference..."
          onClear={() => { setSearchQuery(''); setStatusFilter('All'); setPage(0); }}
        >
          <TextField
            select
            className="filter-control"
            label={t('common.status')}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            sx={filterFieldSx}
          >
            <MenuItem value="All">All statuses</MenuItem>
            {statusOptions.map((status) => (
              <MenuItem key={status} value={status}>{humanizeStatus(status)}</MenuItem>
            ))}
          </TextField>
        </FilterBar>

      {loading ? (
        <TablePaper sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress sx={{ color: '#8b6cbc' }} />
          <Typography sx={{ mt: 2, color: '#718096' }}>{t('common.loading')}</Typography>
        </TablePaper>
      ) : filteredApplications.length === 0 ? (
        <Paper sx={{
          p: 6,
          textAlign: 'center',
          bgcolor: 'rgba(139, 108, 188, 0.02)',
          border: '2px dashed rgba(139, 108, 188, 0.3)',
          borderRadius: 3
        }}>
          <EthicsIcon sx={{ fontSize: 64, color: '#8b6cbc', opacity: 0.5, mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#2D3748', mb: 1, fontWeight: 600 }}>
            {applications.length ? t('common.no_results') : t('common.no_data')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#718096', mb: 3 }}>
            {applications.length
              ? 'Try adjusting your search or status filter.'
              : t(
                  'researcher.ethics_empty_desc',
                  'Create a new ethics application, or upload a clearance certificate you already have.'
                )}
          </Typography>
          {!applications.length && (
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => setUploadOpen(true)}
                sx={{
                  borderColor: '#8b6cbc',
                  color: '#8b6cbc',
                  '&:hover': { borderColor: '#7a5caa', bgcolor: 'rgba(139, 108, 188, 0.04)' },
                }}
              >
                {t('researcher.ethics_upload_certificate', 'Upload Existing Certificate')}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => router.push('/researcher/ethics/applications/create')}
                sx={{
                  background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
                  boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)',
                }}
              >
                {t('researcher.ethics_create')}
              </Button>
            </Box>
          )}
        </Paper>
      ) : (
        <TablePaper>
          <TableContainer>
            <Table>
              <PurpleTableHead columns={[
                t('common.name'),
                t('common.status'),
                'Reference',
                'Submitted',
                { label: t('common.actions'), align: 'center' },
              ]} />
              <TableBody>
                {pagedApplications.map((application, index) => {
                  const external = isExternalCertificate(application);
                  const { actions, menuItems } = rowActions(application);
                  return (
                    <TableRow key={application.id} sx={zebraRowSx(index)}>
                      <TableCell sx={{ maxWidth: 440 }}>
                        <Typography
                          variant="subtitle1"
                          onClick={() => handleView(application)}
                          sx={{
                            fontWeight: 600, color: '#2D3748', fontSize: '0.95rem', lineHeight: 1.3, mb: 0.5,
                            display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden',
                            cursor: 'pointer', '&:hover': { color: '#8b6cbc', textDecoration: 'underline' },
                          }}
                        >
                          {application.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          {external && (
                            <Chip
                              label={t('researcher.ethics_cert_badge', 'Certificate')}
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: 'rgba(139, 108, 188, 0.1)', color: '#8b6cbc', borderRadius: 1 }}
                            />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {[application.principalInvestigator, application.researchType].filter(Boolean).join(' · ')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <StatusPill label={humanizeStatus(application.status)} tone={ETHICS_STATUS_TONE[application.status] || 'neutral'} />
                      </TableCell>
                      <TableCell sx={{ color: '#4A5568', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {application.referenceNumber || '—'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {application.submittedDate
                            ? format(new Date(application.submittedDate), 'MMM dd, yyyy')
                            : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <RowActions actions={actions} menuItems={menuItems} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredApplications.length}
            page={currentPage}
            onPageChange={(_, next) => setPage(next)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
            sx={paginationSx}
          />
        </TablePaper>
      )}

      <UploadCertificateDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleCertificateUploaded}
        user={user}
      />
      </Container>
    </Box>
  );
}
