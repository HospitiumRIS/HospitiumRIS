'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  ImageSearch as ImageIntegrityIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import PageHeader from '../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';

const STATUS_CONFIG = {
  UPLOADING: { label: 'Uploading', color: '#2196f3', bgColor: '#e3f2fd' },
  PROCESSING: { label: 'Processing', color: '#ff9800', bgColor: '#fff3e0' },
  COMPLETED: { label: 'Analysis Completed', color: '#4caf50', bgColor: '#e8f5e9' },
  FAILED: { label: 'Failed', color: '#f44336', bgColor: '#ffebee' },
};

const StatusChip = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.UPLOADING;
  return (
    <Chip
      label={config.label}
      size="small"
      sx={{ bgcolor: config.bgColor, color: config.color, fontWeight: 600, fontSize: '0.7rem', height: 24 }}
    />
  );
};

function SummaryCard({ label, value, color }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: color || 'text.primary' }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

export default function InstitutionImageIntegrityPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/institution/image-integrity?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setCases(data.cases || []);
        setSummary(data.summary || null);
        setConfigured(data.configured !== false);
      }
    } catch (error) {
      console.error('Failed to load submission reports:', error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchCases, 300); // debounce search
    return () => clearTimeout(timeout);
  }, [fetchCases]);

  return (
    <Box>
      <PageHeader
        title={t('institution.image_integrity', 'Image Integrity')}
        description={t(
          'institution_nav.integrity_reports_desc',
          'Read-only oversight of every researcher’s ImaChek image integrity submissions'
        )}
        icon={<ImageIntegrityIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[{ label: t('institution.portal_title', 'Institution Portal'), path: '/institution' }]}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {!configured && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {t(
              'institution_nav.integrity_not_configured',
              'ImaChek is not configured yet. Submissions will appear here once an administrator adds the ImaChek API key.'
            )}
          </Alert>
        )}

        {summary && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <SummaryCard label={t('institution_nav.integrity_total', 'Total Submissions')} value={summary.total} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard label={t('institution_nav.integrity_completed', 'Completed')} value={summary.completed} color="#4caf50" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard label={t('institution_nav.integrity_processing', 'Processing')} value={summary.processing} color="#ff9800" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard label={t('institution_nav.integrity_flagged', 'Flagged for Review')} value={summary.flagged} color="#f44336" />
            </Grid>
          </Grid>
        )}

        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t('institution_nav.integrity_reports', 'Submission Reports')}
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <TextField
                  size="small"
                  placeholder={t('institution_nav.integrity_search', 'Search title or researcher...')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                />
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>{t('common.status', 'Status')}</InputLabel>
                  <Select value={statusFilter} label={t('common.status', 'Status')} onChange={(e) => setStatusFilter(e.target.value)}>
                    <MenuItem value="ALL">{t('common.all', 'All')}</MenuItem>
                    <MenuItem value="COMPLETED">{t('researcher.integrity_status_completed', 'Completed')}</MenuItem>
                    <MenuItem value="PROCESSING">{t('researcher.integrity_status_processing', 'Processing')}</MenuItem>
                    <MenuItem value="FAILED">{t('researcher.integrity_status_failed', 'Failed')}</MenuItem>
                  </Select>
                </FormControl>
                <Tooltip title={t('common.refresh', 'Refresh')}>
                  <IconButton onClick={fetchCases}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('researcher.integrity_col_title', 'Title')}</TableCell>
                  <TableCell>{t('institution_nav.integrity_submitted_by', 'Submitted By')}</TableCell>
                  <TableCell>{t('researcher.integrity_col_result', 'Analysis Result')}</TableCell>
                  <TableCell>{t('researcher.integrity_col_status', 'Status')}</TableCell>
                  <TableCell>{t('researcher.integrity_col_submitted', 'Submitted')}</TableCell>
                  <TableCell align="right">{t('common.actions', 'Actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {t('institution_nav.integrity_empty', 'No image integrity submissions yet.')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.map((c) => {
                    const flagged = (c.manipulationCount || 0) > 0 || (c.similarityLevel?.high || 0) > 0;
                    return (
                      <TableRow key={c.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {flagged && (
                              <Tooltip title={t('institution_nav.integrity_flagged', 'Flagged for Review')}>
                                <WarningIcon fontSize="small" color="warning" />
                              </Tooltip>
                            )}
                            <span>{c.title}</span>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {c.submittedBy ? `${c.submittedBy.givenName} ${c.submittedBy.familyName}` : '—'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {c.submittedBy?.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {c.status === 'COMPLETED' ? (
                            <Typography variant="body2">
                              {t('researcher.integrity_manip_count', 'Manipulation')}: {c.manipulationCount ?? 0} ·{' '}
                              {t('researcher.integrity_similarity_count', 'Similarity')}: {c.similarityCount ?? 0}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              {c.status === 'FAILED' ? c.errorMessage : `${c.analysisProgress || 0}%`}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={c.status} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title={t('common.view_details', 'View Details')}>
                            <IconButton size="small" onClick={() => router.push(`/institution/image-integrity/${c.id}`)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
}
