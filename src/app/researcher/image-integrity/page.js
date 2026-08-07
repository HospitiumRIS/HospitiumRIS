'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Button,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  LinearProgress,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ImageSearch as ImageIntegrityIcon,
  CloudUpload as CloudUploadIcon,
  Science as ScienceIcon,
  PictureAsPdf as PdfIcon,
  FolderZip as ZipIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  VerifiedUser as OrcidIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import PageHeader from '../../../components/common/PageHeader';
import { useAuth } from '../../../components/AuthProvider';
import { useTranslation } from 'react-i18next';

const STATUS_CONFIG = {
  UPLOADING: { label: 'Uploading', color: '#2196f3', bgColor: '#e3f2fd' },
  PROCESSING: { label: 'Processing', color: '#ff9800', bgColor: '#fff3e0' },
  COMPLETED: { label: 'Analysis Completed', color: '#4caf50', bgColor: '#e8f5e9' },
  FAILED: { label: 'Failed', color: '#f44336', bgColor: '#ffebee' },
};

const SUPPORTED_EXTENSIONS = ['png', 'tif', 'tiff', 'jpg', 'jpeg', 'zip', 'pdf'];
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg'];
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_BATCH_FILES = 20;

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

function getExtension(fileName = '') {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
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

/** A single selected-file preview row: thumbnail for images, icon for PDF/ZIP. */
function FilePreviewRow({ file, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const extension = getExtension(file.name);
  const isImage = IMAGE_EXTENSIONS.includes(extension);

  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file, isImage]);

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        bgcolor: 'background.paper',
      }}
    >
      {isImage && previewUrl ? (
        <Box
          component="img"
          src={previewUrl}
          alt={file.name}
          sx={{
            width: 48,
            height: 48,
            objectFit: 'cover',
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}
        />
      ) : (
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1.5,
            bgcolor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FileTypeIcon extension={extension} sx={{ fontSize: 24, color: '#8b6cbc' }} />
        </Box>
      )}
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all' }}>
          {file.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {extension ? `.${extension} · ` : ''}
          {formatBytes(file.size)}
        </Typography>
      </Box>
      <IconButton size="small" onClick={onRemove}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

/**
 * Drag-and-drop upload zone supporting a batch of files at once. Shows the
 * dropzone (compact once files are selected, so more can be added) plus a
 * preview list: an image thumbnail for image files, or a file-type icon +
 * name/size for PDF/ZIP.
 */
function FileDropzone({ files, onFilesAdded, onRemove, error }) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    onFilesAdded(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <Stack spacing={1.5}>
      <Box
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        sx={{
          border: '2px dashed',
          borderColor: error ? 'error.main' : isDragging ? '#8b6cbc' : 'divider',
          borderRadius: 2,
          p: files.length > 0 ? 2 : 4,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragging ? 'rgba(139, 108, 188, 0.06)' : 'transparent',
          transition: 'all 0.15s ease',
          '&:hover': { borderColor: '#8b6cbc', bgcolor: 'rgba(139, 108, 188, 0.04)' },
        }}
      >
        <CloudUploadIcon sx={{ fontSize: files.length > 0 ? 24 : 36, color: '#8b6cbc', mb: 0.5 }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {files.length > 0
            ? t('researcher.integrity_dropzone_add_more', 'Drag & drop more files, or click to add')
            : t('researcher.integrity_dropzone_title', 'Drag & drop files here, or click to browse')}
        </Typography>
        {files.length === 0 && (
          <Typography variant="caption" color="text.secondary">
            {t(
              'researcher.integrity_file_requirements',
              'Supported formats: PNG, TIF/TIFF, JPG/JPEG, ZIP, PDF. Max 25MB per file — select multiple to batch upload.'
            )}
          </Typography>
        )}
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          accept=".png,.tif,.tiff,.jpg,.jpeg,.zip,.pdf"
          onChange={(e) => {
            onFilesAdded(e.target.files);
            e.target.value = ''; // allow re-selecting the same file later
          }}
        />
      </Box>

      {files.length > 0 && (
        <Stack spacing={1}>
          {files.map((file, index) => (
            <FilePreviewRow key={`${file.name}-${file.size}-${index}`} file={file} onRemove={() => onRemove(index)} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

const emptyForm = { title: '', doi: '', compareGlobal: true, files: [] };

export default function ResearcherImageIntegrityPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fileError, setFileError] = useState('');
  const [notice, setNotice] = useState(null);
  const pollRef = useRef(null);

  const isBatch = form.files.length > 1;

  // Contributor is derived from the logged-in researcher's profile (name +
  // ORCID iD), not free text, so submissions are always correctly attributed.
  const contributorName = useMemo(() => {
    if (!user) return '';
    return `${user.givenName || ''} ${user.familyName || ''}`.trim();
  }, [user]);

  const contributorString = useMemo(() => {
    if (!contributorName) return '';
    return user?.orcidId ? `${contributorName} (ORCID: ${user.orcidId})` : contributorName;
  }, [contributorName, user]);

  const fetchCases = useCallback(async () => {
    try {
      const res = await fetch('/api/researcher/image-integrity');
      const data = await res.json();
      if (res.ok) {
        setCases(data.cases || []);
        setConfigured(data.configured !== false);
      }
    } catch (error) {
      console.error('Failed to load image integrity submissions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Poll while anything is still processing, matching ImaChek's guidance
  // to poll status every 5-10 seconds.
  useEffect(() => {
    const hasActive = cases.some((c) => c.status === 'UPLOADING' || c.status === 'PROCESSING');
    if (hasActive) {
      pollRef.current = setInterval(fetchCases, 8000);
    }
    return () => clearInterval(pollRef.current);
  }, [cases, fetchCases]);

  const handleOpenDialog = () => {
    setForm(emptyForm);
    setFormError('');
    setFileError('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (submitting) return;
    setDialogOpen(false);
  };

  const handleFilesAdded = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    setFileError('');
    setForm((f) => {
      const existingKeys = new Set(f.files.map((file) => `${file.name}-${file.size}`));
      const errors = [];
      const accepted = [];

      for (const file of incoming) {
        const key = `${file.name}-${file.size}`;
        if (existingKeys.has(key)) continue; // skip duplicates

        const extension = getExtension(file.name);
        if (!SUPPORTED_EXTENSIONS.includes(extension)) {
          errors.push(t('researcher.integrity_error_format_named', '"{{name}}": unsupported format', { name: file.name }));
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          errors.push(t('researcher.integrity_error_size_named', '"{{name}}" exceeds 25MB', { name: file.name }));
          continue;
        }
        existingKeys.add(key);
        accepted.push(file);
      }

      const combined = [...f.files, ...accepted];
      if (combined.length > MAX_BATCH_FILES) {
        errors.push(
          t('researcher.integrity_error_batch_limit', 'You can upload at most {{max}} files at once.', {
            max: MAX_BATCH_FILES,
          })
        );
        combined.length = MAX_BATCH_FILES;
      }

      if (errors.length > 0) setFileError(errors.join(' · '));
      return { ...f, files: combined };
    });
  };

  const handleRemoveFile = (index) => {
    setForm((f) => ({ ...f, files: f.files.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    setFormError('');
    if (form.files.length === 0) {
      setFormError(t('researcher.integrity_error_no_file', 'Please choose at least one file to upload.'));
      return;
    }
    if (form.files.length === 1 && !form.title.trim()) {
      setFormError(t('researcher.integrity_error_no_title', 'Title is required.'));
      return;
    }

    setSubmitting(true);
    setNotice(null);
    try {
      const body = new FormData();
      body.append('title', form.title.trim());
      if (contributorString) body.append('contributor', contributorString);
      if (form.doi.trim()) body.append('doi', form.doi.trim());
      body.append('compareGlobal', form.compareGlobal ? 'true' : 'false');
      form.files.forEach((file) => body.append('files', file));

      const res = await fetch('/api/researcher/image-integrity', { method: 'POST', body });
      const data = await res.json();

      if (!res.ok && res.status !== 202 && res.status !== 207) {
        setFormError(data.error || 'Failed to submit file(s) for analysis.');
        setSubmitting(false);
        return;
      }

      if (data.summary) {
        const { total, succeeded, failed } = data.summary;
        setNotice({
          severity: failed > 0 ? 'warning' : 'success',
          message:
            failed > 0
              ? t(
                  'researcher.integrity_batch_partial',
                  '{{succeeded}} of {{total}} files started successfully. {{failed}} failed — check the status column below.',
                  { succeeded, total, failed }
                )
              : t('researcher.integrity_batch_success', 'All {{total}} files were submitted for analysis.', { total }),
        });
      }

      setDialogOpen(false);
      fetchCases();
    } catch (error) {
      console.error('Upload failed:', error);
      setFormError('Failed to submit file(s) for analysis.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this submission? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/researcher/image-integrity/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete submission.');
        return;
      }
      fetchCases();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <Box>
      <PageHeader
        title={t('researcher.image_integrity', 'Image Integrity')}
        description={t(
          'researcher.image_integrity_subtitle',
          'Screen images for duplication and manipulation before submission.'
        )}
        icon={<ImageIntegrityIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[{ label: t('researcher.portal_title', 'Researcher Portal'), path: '/researcher' }]}
        actionButton={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{ bgcolor: 'white', color: '#8b6cbc', '&:hover': { bgcolor: '#f5f5f5' } }}
          >
            {t('researcher.integrity_new_check', 'New Integrity Check')}
          </Button>
        }
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {!configured && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {t(
              'researcher.integrity_not_configured',
              'ImaChek is not configured yet. Submissions will be recorded but analysis cannot run until an administrator adds the ImaChek API key.'
            )}
          </Alert>
        )}

        {notice && (
          <Alert severity={notice.severity} sx={{ mb: 3 }} onClose={() => setNotice(null)}>
            {notice.message}
          </Alert>
        )}

        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box
            sx={{
              px: 3,
              py: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('researcher.integrity_submissions', 'My Submissions')}
            </Typography>
            <Tooltip title={t('common.refresh', 'Refresh')}>
              <IconButton onClick={fetchCases}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('researcher.integrity_col_title', 'Title')}</TableCell>
                  <TableCell>{t('researcher.integrity_col_file', 'File')}</TableCell>
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
                      <Stack alignItems="center" spacing={1}>
                        <ScienceIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                        <Typography color="text.secondary">
                          {t('researcher.integrity_empty', 'No image integrity checks yet.')}
                        </Typography>
                        <Button size="small" startIcon={<AddIcon />} onClick={handleOpenDialog}>
                          {t('researcher.integrity_new_check', 'New Integrity Check')}
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{c.title}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {c.fileName} {c.fileFormat ? `(.${c.fileFormat})` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {c.status === 'COMPLETED' ? (
                          <Typography variant="body2">
                            {t('researcher.integrity_manip_count', 'Manipulation')}: {c.manipulationCount ?? 0} ·{' '}
                            {t('researcher.integrity_similarity_count', 'Similarity')}: {c.similarityCount ?? 0}
                          </Typography>
                        ) : c.status === 'PROCESSING' || c.status === 'UPLOADING' ? (
                          <Box sx={{ width: 140 }}>
                            <LinearProgress variant="determinate" value={c.analysisProgress || 0} />
                            <Typography variant="caption" color="text.secondary">
                              {c.analysisProgress || 0}%
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="error">
                            {c.errorMessage || t('researcher.integrity_failed', 'Failed')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={c.status} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(c.createdAt).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={t('common.view_details', 'View Details')}>
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/researcher/image-integrity/${c.id}`)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete', 'Delete')}>
                          <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      {/* Upload Dialog - mirrors ImaChek Getting Started Guide, Section 3.1/3.2 (single record & batch) */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('researcher.integrity_new_check', 'New Integrity Check')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label={
                isBatch
                  ? t('researcher.integrity_field_title_prefix', 'Title prefix (optional)')
                  : t('researcher.integrity_field_title', 'Title')
              }
              required={!isBatch}
              fullWidth
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              helperText={
                isBatch
                  ? t(
                      'researcher.integrity_field_title_prefix_hint',
                      'Added before each file’s name (e.g. "{{prefix}} — filename"). Leave blank to use each file’s name as its title.',
                      { prefix: form.title || 'Prefix' }
                    )
                  : t('researcher.integrity_field_title_hint', 'Used to identify this record in the dashboard')
              }
            />

            {/* Contributor: read-only, sourced from the logged-in researcher's profile */}
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.75, display: 'block' }}>
                {t('researcher.integrity_field_contributor', 'Contributor')}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  px: 2,
                  py: 1.25,
                  bgcolor: 'grey.50',
                }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#8b6cbc' }}>
                  <PersonIcon fontSize="small" />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {contributorName || t('researcher.integrity_no_profile', 'Your profile name is not set')}
                  </Typography>
                  {user?.orcidId ? (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <OrcidIcon sx={{ fontSize: 14, color: '#A6CE39' }} />
                      <Typography variant="caption" color="text.secondary">
                        ORCID: {user.orcidId}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {t('researcher.integrity_no_orcid', 'No ORCID iD linked to your account')}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {t('researcher.integrity_field_contributor_hint', 'Automatically filled from your account — link your ORCID iD in Settings to include it here')}
              </Typography>
            </Box>

            <TextField
              label={t('researcher.integrity_field_doi', 'DOI (optional)')}
              fullWidth
              value={form.doi}
              onChange={(e) => setForm((f) => ({ ...f, doi: e.target.value }))}
            />

            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {t('researcher.integrity_field_file', 'File(s)')}
                </Typography>
                {form.files.length > 0 && (
                  <Chip
                    size="small"
                    label={t('researcher.integrity_batch_count', '{{count}} file(s) selected', { count: form.files.length })}
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Stack>
              <FileDropzone
                files={form.files}
                error={fileError}
                onFilesAdded={handleFilesAdded}
                onRemove={handleRemoveFile}
              />
              {fileError && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {fileError}
                </Typography>
              )}
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={form.compareGlobal}
                  onChange={(e) => setForm((f) => ({ ...f, compareGlobal: e.target.checked }))}
                />
              }
              label={t('researcher.integrity_compare_repository', 'Compare against ImaChek global repository')}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <CircularProgress size={20} />
            ) : isBatch ? (
              t('researcher.integrity_submit_batch', 'Submit {{count}} Files', { count: form.files.length })
            ) : (
              t('common.create', 'Create')
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
