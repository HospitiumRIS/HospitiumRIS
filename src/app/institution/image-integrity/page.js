'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Alert,
  Stack,
  TablePagination,
  Button,
  Checkbox,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  ImageSearch as ImageIntegrityIcon,
  PictureAsPdf as PdfIcon,
  FolderZip as ZipIcon,
  InsertDriveFile as FileIcon,
  BrokenImage as BrokenImageIcon,
  Science as ScienceIcon,
  Close as CloseIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material';
import PageHeader from '../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';
import CompareCasesDialog from '../../../components/ImageIntegrity/CompareCasesDialog';
import IntegrityResultSummary, {
  SimilarityLegend,
} from '../../../components/ImageIntegrity/IntegrityResultSummary';

const STATUS_CONFIG = {
  UPLOADING: { label: 'Uploading', color: '#2196f3', bgColor: '#e3f2fd' },
  PROCESSING: { label: 'Analyzing', color: '#ff9800', bgColor: '#fff3e0' },
  COMPLETED: { label: 'Completed', color: '#4caf50', bgColor: '#e8f5e9' },
  FAILED: { label: 'Failed', color: '#f44336', bgColor: '#ffebee' },
};

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg'];

const StatusChip = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.UPLOADING;
  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        bgcolor: config.bgColor,
        color: config.color,
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 24,
        border: `1px solid ${config.color}30`,
      }}
    />
  );
};

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ extension, sx }) {
  if (extension === 'pdf') return <PdfIcon sx={sx} />;
  if (extension === 'zip') return <ZipIcon sx={sx} />;
  return <FileIcon sx={sx} />;
}

function SummaryCard({ label, value, color }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 2,
        minWidth: 120,
        flex: 1,
        borderColor: 'divider',
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 700, color: color || 'text.primary', lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
    </Paper>
  );
}

function SubmissionThumbnail({ caseItem, onOpen }) {
  const [broken, setBroken] = useState(false);
  const extension = (caseItem.fileFormat || '').toLowerCase();
  const isImage = caseItem.isImagePreview ?? IMAGE_EXTENSIONS.includes(extension);
  const previewUrl = caseItem.previewUrl;

  return (
    <Box
      component="button"
      type="button"
      onClick={() => onOpen(caseItem)}
      title={caseItem.fileName}
      sx={{
        width: 56,
        height: 56,
        p: 0,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        bgcolor: 'grey.50',
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&:hover': {
          borderColor: '#8b6cbc',
          boxShadow: '0 0 0 2px rgba(139, 108, 188, 0.2)',
        },
      }}
    >
      {isImage && previewUrl && !broken ? (
        <Box
          component="img"
          src={previewUrl}
          alt={caseItem.fileName}
          onError={() => setBroken(true)}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <Box sx={{ color: 'text.secondary' }}>
          {broken ? (
            <BrokenImageIcon fontSize="small" />
          ) : (
            <FileTypeIcon extension={extension} sx={{ fontSize: 22 }} />
          )}
        </Box>
      )}
    </Box>
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
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [findingsFilter, setFindingsFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [previewCase, setPreviewCase] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareSubmitting, setCompareSubmitting] = useState(false);
  const [compareError, setCompareError] = useState('');
  const [notice, setNotice] = useState(null);
  const pollRef = useRef(null);

  const fetchCases = useCallback(async ({ silent } = {}) => {
    if (!silent) setLoading(true);
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
      if (!silent) setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchCases(), 300);
    return () => clearTimeout(timeout);
  }, [fetchCases]);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (typeFilter === 'IMAGE' && !['png', 'jpg', 'jpeg', 'tif', 'tiff'].includes((c.fileFormat || '').toLowerCase())) {
        return false;
      }
      if (typeFilter === 'PDF' && (c.fileFormat || '').toLowerCase() !== 'pdf') return false;
      if (typeFilter === 'ZIP' && (c.fileFormat || '').toLowerCase() !== 'zip') return false;
      const flagged = (c.manipulationCount || 0) > 0 || (c.similarityCount || 0) > 0;
      if (findingsFilter === 'FLAGGED' && !(c.status === 'COMPLETED' && flagged)) return false;
      if (findingsFilter === 'CLEAN' && !(c.status === 'COMPLETED' && !flagged)) return false;
      return true;
    });
  }, [cases, typeFilter, findingsFilter]);

  const pagedCases = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredCases.slice(start, start + rowsPerPage);
  }, [filteredCases, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [search, statusFilter, typeFilter, findingsFilter]);

  useEffect(() => {
    const hasActive = cases.some((c) => c.status === 'UPLOADING' || c.status === 'PROCESSING');
    if (hasActive) {
      pollRef.current = setInterval(() => fetchCases({ silent: true }), 8000);
    }
    return () => clearInterval(pollRef.current);
  }, [cases, fetchCases]);

  const selectedCases = useMemo(
    () => selectedIds.map((id) => cases.find((c) => c.id === id)).filter(Boolean),
    [selectedIds, cases]
  );

  const toggleSelected = (id, checked) => {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(id) || prev.length >= 10) return prev;
        return [...prev, id];
      }
      return prev.filter((x) => x !== id);
    });
  };

  const toggleSelectAllVisible = (checked) => {
    const visibleComparable = pagedCases.filter((c) => c.status === 'COMPLETED' && c.externalCaseId);
    setSelectedIds((prev) => {
      if (!checked) {
        const visible = new Set(visibleComparable.map((c) => c.id));
        return prev.filter((id) => !visible.has(id));
      }
      const next = [...prev];
      for (const item of visibleComparable) {
        if (!next.includes(item.id) && next.length < 10) next.push(item.id);
      }
      return next;
    });
  };

  const handleCompare = async ({ compareGlobal, caseIds }) => {
    setCompareError('');
    setCompareSubmitting(true);
    try {
      const res = await fetch('/api/institution/image-integrity/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseIds, compareGlobal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCompareError(data.error || t('researcher.integrity_compare_failed', 'Failed to start comparison.'));
        return;
      }
      setCompareOpen(false);
      setSelectedIds([]);
      setNotice({
        severity: 'success',
        message: t(
          'institution_nav.integrity_compare_started',
          'Cross-case comparison started. Results will appear on the anchor submission.'
        ),
      });
      fetchCases();
      if (data.case?.id) router.push(`/institution/image-integrity/${data.case.id}`);
    } catch (error) {
      console.error('Compare failed:', error);
      setCompareError(t('researcher.integrity_compare_failed', 'Failed to start comparison.'));
    } finally {
      setCompareSubmitting(false);
    }
  };

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
        actionButton={
          <Button
            variant="contained"
            onClick={() => router.push('/institution/image-integrity/usage')}
            sx={{ bgcolor: 'white', color: '#8b6cbc', '&:hover': { bgcolor: '#f5f5f5' }, textTransform: 'none', fontWeight: 700 }}
          >
            {t('institution_nav.integrity_usage_report', 'Usage Report')}
          </Button>
        }
      />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {!configured && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {t(
              'institution_nav.integrity_not_configured',
              'ImaChek is not configured yet. Submissions will appear here once an administrator adds the ImaChek API key.'
            )}
          </Alert>
        )}

        {notice && (
          <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>
            {notice.message}
          </Alert>
        )}

        {selectedIds.length > 0 && (
          <Paper
            sx={{
              mb: 2,
              px: 2,
              py: 1.25,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'rgba(139,108,188,0.25)',
              bgcolor: 'rgba(139,108,188,0.06)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.25,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t(
                'institution_nav.integrity_selected_hint',
                '{{count}} selected — compare to look for the same image used across researchers or papers.',
                { count: selectedIds.length }
              )}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={() => setSelectedIds([])} sx={{ textTransform: 'none' }}>
                {t('common.clear', 'Clear')}
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<CompareIcon />}
                disabled={selectedIds.length < 2}
                onClick={() => {
                  setCompareError('');
                  setCompareOpen(true);
                }}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  bgcolor: '#8b6cbc',
                  '&:hover': { bgcolor: '#7a5aad' },
                }}
              >
                {t('researcher.integrity_compare_cases', 'Compare selected')}
              </Button>
            </Stack>
          </Paper>
        )}

        {summary && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
            <SummaryCard label={t('institution_nav.integrity_total', 'Total')} value={summary.total} />
            <SummaryCard
              label={t('institution_nav.integrity_completed', 'Completed')}
              value={summary.completed}
              color="#2e7d32"
            />
            <SummaryCard
              label={t('institution_nav.integrity_processing', 'In progress')}
              value={summary.processing}
              color="#ed6c02"
            />
            <SummaryCard
              label={t('institution_nav.integrity_failed', 'Failed')}
              value={summary.failed || 0}
              color="#d32f2f"
            />
            <SummaryCard
              label={t('institution_nav.integrity_flagged', 'With findings')}
              value={summary.flagged}
              color="#ed6c02"
            />
          </Stack>
        )}

        <Paper
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <Box
            sx={{
              px: 2.5,
              py: 2,
              borderBottom: '1px solid rgba(0,0,0,0.08)',
              bgcolor: 'rgba(139,108,188,0.02)',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 1.5,
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', md: 'center' },
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D3748' }}>
                {t('institution_nav.integrity_reports', 'Submission Reports')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {t(
                  'institution_nav.integrity_list_help',
                  'Tick two or more completed checks to compare images across papers. Open a row for the full report.'
                )}
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                placeholder={t('institution_nav.integrity_search', 'Search title or researcher...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: { sm: 220 }, bgcolor: 'background.paper' }}
              />
              <FormControl size="small" sx={{ minWidth: 140, bgcolor: 'background.paper' }}>
                <InputLabel>{t('common.status', 'Status')}</InputLabel>
                <Select
                  value={statusFilter}
                  label={t('common.status', 'Status')}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="ALL">{t('common.all', 'All')}</MenuItem>
                  <MenuItem value="COMPLETED">{t('researcher.integrity_status_completed', 'Completed')}</MenuItem>
                  <MenuItem value="PROCESSING">{t('researcher.integrity_status_processing', 'Processing')}</MenuItem>
                  <MenuItem value="UPLOADING">{t('researcher.integrity_status_uploading', 'Uploading')}</MenuItem>
                  <MenuItem value="FAILED">{t('researcher.integrity_status_failed', 'Failed')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 130, bgcolor: 'background.paper' }}>
                <InputLabel>{t('researcher.integrity_filter_type', 'File type')}</InputLabel>
                <Select
                  value={typeFilter}
                  label={t('researcher.integrity_filter_type', 'File type')}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="ALL">{t('common.all', 'All')}</MenuItem>
                  <MenuItem value="IMAGE">{t('researcher.integrity_type_image', 'Images')}</MenuItem>
                  <MenuItem value="PDF">PDF</MenuItem>
                  <MenuItem value="ZIP">ZIP</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140, bgcolor: 'background.paper' }}>
                <InputLabel>{t('researcher.integrity_filter_findings', 'Findings')}</InputLabel>
                <Select
                  value={findingsFilter}
                  label={t('researcher.integrity_filter_findings', 'Findings')}
                  onChange={(e) => setFindingsFilter(e.target.value)}
                >
                  <MenuItem value="ALL">{t('common.all', 'All')}</MenuItem>
                  <MenuItem value="FLAGGED">{t('institution_nav.integrity_flagged', 'With findings')}</MenuItem>
                  <MenuItem value="CLEAN">{t('researcher.integrity_stat_clean', 'No findings')}</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title={t('common.refresh', 'Refresh')}>
                <IconButton onClick={fetchCases} sx={{ bgcolor: 'background.paper' }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', whiteSpace: 'nowrap' } }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      indeterminate={
                        pagedCases.some((c) => selectedIds.includes(c.id)) &&
                        !pagedCases
                          .filter((c) => c.status === 'COMPLETED' && c.externalCaseId)
                          .every((c) => selectedIds.includes(c.id))
                      }
                      checked={
                        pagedCases.filter((c) => c.status === 'COMPLETED' && c.externalCaseId).length > 0 &&
                        pagedCases
                          .filter((c) => c.status === 'COMPLETED' && c.externalCaseId)
                          .every((c) => selectedIds.includes(c.id))
                      }
                      onChange={(e) => toggleSelectAllVisible(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell sx={{ width: 72 }}>{t('researcher.integrity_col_preview', 'Preview')}</TableCell>
                  <TableCell>{t('researcher.integrity_col_submission', 'Submission')}</TableCell>
                  <TableCell>{t('institution_nav.integrity_submitted_by', 'Submitted by')}</TableCell>
                  <TableCell>{t('researcher.integrity_col_findings', 'Findings')}</TableCell>
                  <TableCell>{t('researcher.integrity_col_status', 'Status')}</TableCell>
                  <TableCell>{t('researcher.integrity_col_submitted', 'Submitted')}</TableCell>
                  <TableCell align="right">{t('common.actions', 'Actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} sx={{ color: '#8b6cbc' }} />
                    </TableCell>
                  </TableRow>
                ) : filteredCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Stack alignItems="center" spacing={1}>
                        <ScienceIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                        <Typography color="text.secondary">
                          {cases.length === 0
                            ? t('institution_nav.integrity_empty', 'No image integrity submissions yet.')
                            : t('researcher.integrity_empty_filtered', 'No submissions match your filters.')}
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedCases.map((c) => {
                    const submitterName = c.submittedBy
                      ? `${c.submittedBy.givenName || ''} ${c.submittedBy.familyName || ''}`.trim()
                      : '—';
                    return (
                      <TableRow
                        key={c.id}
                        hover
                        sx={{ cursor: 'pointer', '& td': { verticalAlign: 'middle' } }}
                        onClick={() => router.push(`/institution/image-integrity/${c.id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()} padding="checkbox">
                          <Checkbox
                            size="small"
                            disabled={c.status !== 'COMPLETED' || !c.externalCaseId}
                            checked={selectedIds.includes(c.id)}
                            onChange={(e) => toggleSelected(c.id, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <SubmissionThumbnail caseItem={c} onOpen={setPreviewCase} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, maxWidth: 260 }} noWrap title={c.title}>
                            {c.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap title={c.fileName} sx={{ display: 'block' }}>
                            {c.fileName}
                            {(c.fileFormat || c.fileSizeBytes)
                              ? ` · ${(c.fileFormat || '').toUpperCase()}${c.fileSizeBytes ? ` · ${formatBytes(c.fileSizeBytes)}` : ''}`
                              : ''}
                          </Typography>
                          {c.doi ? (
                            <Typography variant="caption" color="text.disabled" noWrap sx={{ display: 'block' }}>
                              DOI: {c.doi}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {submitterName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {c.submittedBy?.email || ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IntegrityResultSummary caseItem={c} />
                        </TableCell>
                        <TableCell>
                          <StatusChip status={c.status} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                            {formatDateTime(c.createdAt)}
                          </Typography>
                          {c.status === 'COMPLETED' && (
                            <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                              {t('researcher.integrity_results_ready', 'Results')} {formatDateTime(c.analysisCompletedAt || c.updatedAt)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title={t('common.view_details', 'View Details')}>
                            <IconButton
                              size="small"
                              onClick={() => router.push(`/institution/image-integrity/${c.id}`)}
                            >
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

          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: '#faf8fc',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.5,
              alignItems: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {t('researcher.integrity_legend_title', 'Similarity confidence')}
            </Typography>
            <SimilarityLegend />
            <Typography variant="caption" color="text.secondary">
              {t(
                'researcher.integrity_legend_help',
                'High / Medium / Low = how sure ImaChek is that two images are the same. Hover a chip for details. Possible edits are suspected manipulation in a figure.'
              )}
            </Typography>
          </Box>

          <TablePagination
            component="div"
            count={filteredCases.length}
            page={page}
            onPageChange={(_, next) => setPage(next)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage={t('common.rows_per_page', 'Rows per page')}
          />
        </Paper>
      </Container>

      {/* Preview dialog */}
      {previewCase && (
        <Box
          onClick={() => setPreviewCase(null)}
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.55)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
        >
          <Paper
            onClick={(e) => e.stopPropagation()}
            sx={{ maxWidth: 800, width: '100%', borderRadius: 2, overflow: 'hidden' }}
          >
            <Box sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                {previewCase.fileName}
              </Typography>
              <IconButton size="small" onClick={() => setPreviewCase(null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ px: 2.5, pb: 2.5, textAlign: 'center' }}>
              {previewCase.isImagePreview ? (
                <Box
                  component="img"
                  src={previewCase.previewUrl}
                  alt={previewCase.fileName}
                  sx={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
              ) : (
                <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
                  <FileTypeIcon
                    extension={(previewCase.fileFormat || '').toLowerCase()}
                    sx={{ fontSize: 48, color: '#8b6cbc' }}
                  />
                  <Button
                    href={`${previewCase.previewUrl}?download=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: '#8b6cbc', textTransform: 'none', fontWeight: 600 }}
                  >
                    {t('common.download', 'Download')}
                  </Button>
                </Stack>
              )}
            </Box>
          </Paper>
        </Box>
      )}

      <CompareCasesDialog
        open={compareOpen}
        onClose={() => !compareSubmitting && setCompareOpen(false)}
        cases={selectedCases}
        submitting={compareSubmitting}
        error={compareError}
        onConfirm={handleCompare}
      />
    </Box>
  );
}
