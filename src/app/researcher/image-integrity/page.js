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
  Stack,
  Avatar,
  Divider,
  InputAdornment,
  TablePagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
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
  BrokenImage as BrokenImageIcon,
  AutoAwesome as AutoFillIcon,
  Link as LinkIcon,
  Replay as ResubmitIcon,
  Search as SearchIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material';
import PageHeader from '../../../components/common/PageHeader';
import { useAuth } from '../../../components/AuthProvider';
import { useTranslation } from 'react-i18next';
import { normalizeDoi } from '../../../utils/extractPdfMetadata';
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

/** Clickable thumbnail / file icon for a stored submission. */
function SubmissionThumbnail({ caseItem, onOpen }) {
  const [broken, setBroken] = useState(false);
  const extension = (caseItem.fileFormat || getExtension(caseItem.fileName)).toLowerCase();
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
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
        '&:hover': {
          borderColor: 'primary.main',
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
        <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        px: 1.25,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        bgcolor: 'background.paper',
      }}
    >
      {isImage && previewUrl ? (
        <Box
          component="img"
          src={previewUrl}
          alt={file.name}
          sx={{
            width: 40,
            height: 40,
            objectFit: 'cover',
            borderRadius: 1.25,
            border: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}
        />
      ) : (
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.25,
            bgcolor: 'rgba(139, 108, 188, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FileTypeIcon extension={extension} sx={{ fontSize: 20, color: '#8b6cbc' }} />
        </Box>
      )}
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all', lineHeight: 1.3 }}>
          {file.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {extension ? `.${extension.toUpperCase()} · ` : ''}
          {formatBytes(file.size)}
        </Typography>
      </Box>
      <IconButton size="small" onClick={onRemove} aria-label="Remove file">
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

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

function SectionLabel({ children, action }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          letterSpacing: 0.2,
          color: 'text.primary',
        }}
      >
        {children}
      </Typography>
      {action}
    </Stack>
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
    <Stack spacing={1.25}>
      <Box
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        sx={{
          border: '1.5px dashed',
          borderColor: error ? 'error.main' : isDragging ? '#8b6cbc' : 'rgba(139, 108, 188, 0.35)',
          borderRadius: 2.5,
          px: 2.5,
          py: files.length > 0 ? 2 : 3.5,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragging ? 'rgba(139, 108, 188, 0.08)' : 'rgba(139, 108, 188, 0.03)',
          transition: 'border-color 0.15s ease, background-color 0.15s ease',
          '&:hover': { borderColor: '#8b6cbc', bgcolor: 'rgba(139, 108, 188, 0.06)' },
        }}
      >
        <CloudUploadIcon sx={{ fontSize: files.length > 0 ? 26 : 34, color: '#8b6cbc', mb: 0.75 }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {files.length > 0
            ? t('researcher.integrity_dropzone_add_more', 'Add more files')
            : t('researcher.integrity_dropzone_title', 'Drop files here or click to browse')}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {t(
            'researcher.integrity_file_requirements_short',
            'PNG, TIFF, JPG, ZIP, or PDF · up to 25MB each · multiple files supported'
          )}
        </Typography>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          accept=".png,.tif,.tiff,.jpg,.jpeg,.zip,.pdf"
          onChange={(e) => {
            onFilesAdded(e.target.files);
            e.target.value = '';
          }}
        />
      </Box>

      {files.length > 0 && (
        <Stack spacing={0.75}>
          {files.map((file, index) => (
            <FilePreviewRow key={`${file.name}-${file.size}-${index}`} file={file} onRemove={() => onRemove(index)} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

const emptyForm = {
  title: '',
  doi: '',
  description: '',
  authors: [''],
  compareGlobal: true,
  files: [],
};

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
  const [previewCase, setPreviewCase] = useState(null);
  const [metaHint, setMetaHint] = useState('');
  const [metaLoading, setMetaLoading] = useState(false);
  const [resubmittingId, setResubmittingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [findingsFilter, setFindingsFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareSubmitting, setCompareSubmitting] = useState(false);
  const [compareError, setCompareError] = useState('');
  const pollRef = useRef(null);

  const isBatch = form.files.length > 1;

  const statusCounts = useMemo(() => {
    return cases.reduce(
      (acc, c) => {
        acc.total += 1;
        acc[c.status] = (acc[c.status] || 0) + 1;
        if (c.status === 'COMPLETED') {
          const flagged = (c.manipulationCount ?? 0) > 0 || (c.similarityCount ?? 0) > 0;
          if (flagged) acc.flagged += 1;
          else acc.clean += 1;
        }
        return acc;
      },
      { total: 0, COMPLETED: 0, PROCESSING: 0, UPLOADING: 0, FAILED: 0, clean: 0, flagged: 0 }
    );
  }, [cases]);

  const filteredCases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cases.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;

      if (typeFilter === 'IMAGE' && !['png', 'jpg', 'jpeg', 'tif', 'tiff'].includes((c.fileFormat || '').toLowerCase())) {
        return false;
      }
      if (typeFilter === 'PDF' && (c.fileFormat || '').toLowerCase() !== 'pdf') return false;
      if (typeFilter === 'ZIP' && (c.fileFormat || '').toLowerCase() !== 'zip') return false;

      const flagged = (c.manipulationCount ?? 0) > 0 || (c.similarityCount ?? 0) > 0;
      if (findingsFilter === 'FLAGGED' && !(c.status === 'COMPLETED' && flagged)) return false;
      if (findingsFilter === 'CLEAN' && !(c.status === 'COMPLETED' && !flagged)) return false;

      if (!q) return true;
      const haystack = [c.title, c.fileName, c.doi, c.description, c.errorMessage]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [cases, searchQuery, statusFilter, typeFilter, findingsFilter]);

  const pagedCases = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredCases.slice(start, start + rowsPerPage);
  }, [filteredCases, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, typeFilter, findingsFilter]);

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
    setMetaHint('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (submitting) return;
    setDialogOpen(false);
  };

  const authorList = form.authors?.length ? form.authors : [''];

  const updateAuthor = (index, value) => {
    setForm((f) => {
      const next = [...(f.authors?.length ? f.authors : [''])];
      next[index] = value;
      return { ...f, authors: next };
    });
  };

  const addAuthorRow = () => {
    setForm((f) => ({ ...f, authors: [...(f.authors?.length ? f.authors : ['']), ''] }));
  };

  const handleAuthorKeyDown = (event, index) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (index === authorList.length - 1) addAuthorRow();
    }
  };

  const removeAuthorRow = (index) => {
    setForm((f) => {
      const next = (f.authors?.length ? f.authors : ['']).filter((_, i) => i !== index);
      return { ...f, authors: next.length ? next : [''] };
    });
  };

  const applyMetadata = useCallback((meta, { preferFillEmpty = true } = {}) => {
    if (!meta) return;
    setForm((f) => {
      const existingAuthors = (f.authors || []).map((a) => a.trim()).filter(Boolean);
      const incomingAuthors = (meta.authors || []).map((a) => String(a).trim()).filter(Boolean);
      const useAuthors = preferFillEmpty
        ? existingAuthors.length
          ? existingAuthors
          : incomingAuthors
        : incomingAuthors.length
        ? incomingAuthors
        : existingAuthors;

      return {
        ...f,
        title: preferFillEmpty ? f.title || meta.title || '' : meta.title || f.title || '',
        doi: preferFillEmpty ? f.doi || meta.doi || '' : meta.doi || f.doi || '',
        description: preferFillEmpty
          ? f.description || meta.description || ''
          : meta.description || f.description || '',
        authors: useAuthors.length ? useAuthors : [''],
      };
    });
  }, []);

  const enrichFromCrossref = useCallback(
    async (doi, { preferFillEmpty = true } = {}) => {
      const cleaned = normalizeDoi(doi);
      if (!cleaned) return null;
      try {
        const res = await fetch(`/api/researcher/image-integrity/lookup-doi?doi=${encodeURIComponent(cleaned)}`);
        const data = await res.json();
        if (!res.ok) return null;
        applyMetadata(
          {
            doi: data.doi,
            title: data.title,
            authors: data.authors,
            description: data.description,
          },
          { preferFillEmpty }
        );
        return data;
      } catch (error) {
        console.error('Crossref DOI lookup failed:', error);
        return null;
      }
    },
    [applyMetadata]
  );

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

  const handleDoiBlur = async () => {
    const doi = normalizeDoi(form.doi);
    if (!doi) return;

    setMetaLoading(true);
    setMetaHint('');
    try {
      const data = await enrichFromCrossref(doi, { preferFillEmpty: true });
      if (data) {
        setMetaHint(
          t('researcher.integrity_autofill_crossref', 'Filled missing fields from Crossref for this DOI.')
        );
      } else {
        setMetaHint(
          t('researcher.integrity_autofill_crossref_none', 'No Crossref match found for this DOI.')
        );
      }
    } finally {
      setMetaLoading(false);
    }
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
      if (form.doi.trim()) body.append('doi', normalizeDoi(form.doi));
      if (form.description.trim()) body.append('description', form.description.trim());
      const authors = (form.authors || []).map((a) => a.trim()).filter(Boolean);
      if (authors.length) body.append('authors', JSON.stringify(authors));
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

  const handleResubmit = async (id) => {
    if (!window.confirm(t('researcher.integrity_resubmit_confirm', 'Resubmit this failed check to ImaChek?'))) {
      return;
    }
    setResubmittingId(id);
    try {
      const res = await fetch(`/api/researcher/image-integrity/${id}/resubmit`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok && res.status !== 202) {
        alert(data.error || t('researcher.integrity_resubmit_failed', 'Resubmission failed.'));
        return;
      }
      setNotice({
        severity: data.success ? 'success' : 'warning',
        message: data.success
          ? t('researcher.integrity_resubmit_started', 'Analysis restarted successfully.')
          : data.error || t('researcher.integrity_resubmit_partial', 'Resubmission attempted but analysis did not start.'),
      });
      fetchCases();
    } catch (error) {
      console.error('Resubmit failed:', error);
      alert(t('researcher.integrity_resubmit_failed', 'Resubmission failed.'));
    } finally {
      setResubmittingId(null);
    }
  };

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
      const res = await fetch('/api/researcher/image-integrity/compare', {
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
          'researcher.integrity_compare_started',
          'Cross-case comparison started on {{count}} submissions. Results will appear on the anchor case.',
          { count: data.comparedCount || caseIds.length }
        ),
      });
      fetchCases();
      if (data.case?.id) {
        router.push(`/researcher/image-integrity/${data.case.id}`);
      }
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
                'researcher.integrity_selected_hint',
                '{{count}} selected — compare to look for the same image used in more than one paper.',
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

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ mb: 2.5 }}
        >
          <SummaryCard label={t('researcher.integrity_stat_total', 'Total')} value={statusCounts.total} />
          <SummaryCard
            label={t('researcher.integrity_stat_completed', 'Completed')}
            value={statusCounts.COMPLETED || 0}
            color="#2e7d32"
          />
          <SummaryCard
            label={t('researcher.integrity_stat_in_progress', 'In progress')}
            value={(statusCounts.PROCESSING || 0) + (statusCounts.UPLOADING || 0)}
            color="#ed6c02"
          />
          <SummaryCard
            label={t('researcher.integrity_stat_failed', 'Failed')}
            value={statusCounts.FAILED || 0}
            color="#d32f2f"
          />
          <SummaryCard
            label={t('researcher.integrity_stat_flagged', 'With findings')}
            value={statusCounts.flagged || 0}
            color="#ed6c02"
          />
        </Stack>

        <Paper sx={{ borderRadius: 2.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <Box
            sx={{
              px: 2.5,
              py: 2,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 1.5,
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', md: 'center' },
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: '#faf8fc',
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('researcher.integrity_submissions', 'My Submissions')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {t(
                  'researcher.integrity_list_help',
                  'Tick two or more completed checks to compare images across papers. Open a row for the full report.'
                )}
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('researcher.integrity_search_placeholder', 'Search title, file, DOI…')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: { sm: 220 }, bgcolor: 'background.paper' }}
              />
              <FormControl size="small" sx={{ minWidth: 140, bgcolor: 'background.paper' }}>
                <InputLabel>{t('researcher.integrity_filter_status', 'Status')}</InputLabel>
                <Select
                  label={t('researcher.integrity_filter_status', 'Status')}
                  value={statusFilter}
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
                  label={t('researcher.integrity_filter_type', 'File type')}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="ALL">{t('common.all', 'All')}</MenuItem>
                  <MenuItem value="IMAGE">{t('researcher.integrity_type_image', 'Images')}</MenuItem>
                  <MenuItem value="PDF">PDF</MenuItem>
                  <MenuItem value="ZIP">ZIP</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 130, bgcolor: 'background.paper' }}>
                <InputLabel>{t('researcher.integrity_filter_findings', 'Findings')}</InputLabel>
                <Select
                  label={t('researcher.integrity_filter_findings', 'Findings')}
                  value={findingsFilter}
                  onChange={(e) => setFindingsFilter(e.target.value)}
                >
                  <MenuItem value="ALL">{t('common.all', 'All')}</MenuItem>
                  <MenuItem value="FLAGGED">{t('researcher.integrity_stat_flagged', 'With findings')}</MenuItem>
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
            <Table size="medium">
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
                  <TableCell>{t('researcher.integrity_col_findings', 'Findings')}</TableCell>
                  <TableCell>{t('researcher.integrity_col_status', 'Status')}</TableCell>
                  <TableCell>{t('researcher.integrity_col_submitted', 'Submitted')}</TableCell>
                  <TableCell align="right">{t('common.actions', 'Actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : filteredCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Stack alignItems="center" spacing={1}>
                        <ScienceIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                        <Typography color="text.secondary">
                          {cases.length === 0
                            ? t('researcher.integrity_empty', 'No image integrity checks yet.')
                            : t('researcher.integrity_empty_filtered', 'No submissions match your filters.')}
                        </Typography>
                        {cases.length === 0 ? (
                          <Button size="small" startIcon={<AddIcon />} onClick={handleOpenDialog}>
                            {t('researcher.integrity_new_check', 'New Integrity Check')}
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            onClick={() => {
                              setSearchQuery('');
                              setStatusFilter('ALL');
                              setTypeFilter('ALL');
                              setFindingsFilter('ALL');
                            }}
                          >
                            {t('researcher.integrity_clear_filters', 'Clear filters')}
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedCases.map((c) => (
                    <TableRow
                      key={c.id}
                      hover
                      sx={{ cursor: 'pointer', '& td': { verticalAlign: 'middle' } }}
                      onClick={() => router.push(`/researcher/image-integrity/${c.id}`)}
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
                        <Typography variant="body2" sx={{ fontWeight: 600, maxWidth: 280 }} noWrap title={c.title}>
                          {c.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap title={c.fileName} sx={{ display: 'block' }}>
                          {c.fileName}
                          {(c.fileFormat || c.fileSizeBytes)
                            ? ` · ${(c.fileFormat || '').toUpperCase()}${c.fileSizeBytes ? ` · ${formatBytes(c.fileSizeBytes)}` : ''}`
                            : ''}
                        </Typography>
                        {c.doi ? (
                          <Typography variant="caption" color="text.disabled" noWrap title={c.doi} sx={{ display: 'block' }}>
                            DOI: {c.doi}
                          </Typography>
                        ) : null}
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
                        <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                          <Tooltip title={t('common.view_details', 'View Details')}>
                            <IconButton
                              size="small"
                              onClick={() => router.push(`/researcher/image-integrity/${c.id}`)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {c.status === 'FAILED' && (
                            <Tooltip title={t('researcher.integrity_resubmit', 'Resubmit')}>
                              <span>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  disabled={resubmittingId === c.id}
                                  onClick={() => handleResubmit(c.id)}
                                >
                                  {resubmittingId === c.id ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <ResubmitIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          <Tooltip title={t('common.delete', 'Delete')}>
                            <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
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

      {/* Upload Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            maxHeight: '92vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            bgcolor: '#faf8fc',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
              {t('researcher.integrity_new_check', 'New Integrity Check')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t(
                'researcher.integrity_new_check_subtitle',
                'Upload manuscript images or a PDF, then add details. Enter a DOI to auto-fill authors from Crossref.'
              )}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} disabled={submitting} size="small" sx={{ mt: -0.5 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={2.75}>
            {formError && (
              <Alert severity="error" onClose={() => setFormError('')}>
                {formError}
              </Alert>
            )}

            {/* 1. Files first — primary action + autofill trigger */}
            <Box>
              <SectionLabel
                action={
                  form.files.length > 0 ? (
                    <Chip
                      size="small"
                      label={t('researcher.integrity_batch_count', '{{count}} file(s)', {
                        count: form.files.length,
                      })}
                      sx={{ height: 22, fontWeight: 600, bgcolor: 'rgba(139, 108, 188, 0.1)', color: '#6f4fa0' }}
                    />
                  ) : null
                }
              >
                {t('researcher.integrity_section_files', '1. Upload files')}
              </SectionLabel>
              <FileDropzone
                files={form.files}
                error={fileError}
                onFilesAdded={handleFilesAdded}
                onRemove={handleRemoveFile}
              />
              {fileError && (
                <Typography variant="caption" color="error" sx={{ mt: 0.75, display: 'block' }}>
                  {fileError}
                </Typography>
              )}
            </Box>

            <Divider />

            {/* 2. Manuscript details */}
            <Box>
              <SectionLabel>{t('researcher.integrity_section_details', '2. Article / image details')}</SectionLabel>
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1.4fr 1fr' },
                    gap: 2,
                  }}
                >
                  <TextField
                    label={
                      isBatch
                        ? t('researcher.integrity_field_title_prefix', 'Article/Image title prefix (optional)')
                        : t('researcher.integrity_field_title', 'Article/Image Title')
                    }
                    required={!isBatch}
                    fullWidth
                    size="small"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder={t('researcher.integrity_title_placeholder', 'e.g. Article draft — Figure panel')}
                  />
                  <TextField
                    label={t('researcher.integrity_field_doi', 'DOI')}
                    fullWidth
                    size="small"
                    value={form.doi}
                    onChange={(e) => setForm((f) => ({ ...f, doi: e.target.value }))}
                    onBlur={handleDoiBlur}
                    placeholder="10.xxxx/xxxxx"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {(metaLoading || metaHint) && (
                  <Alert
                    severity={metaLoading ? 'info' : /no crossref match/i.test(metaHint) ? 'warning' : 'success'}
                    icon={metaLoading ? <CircularProgress size={16} /> : <AutoFillIcon fontSize="inherit" />}
                    sx={{ py: 0.25 }}
                    onClose={metaLoading ? undefined : () => setMetaHint('')}
                  >
                    {metaLoading
                      ? t('researcher.integrity_autofill_loading', 'Looking up DOI in Crossref…')
                      : metaHint}
                  </Alert>
                )}

                <TextField
                  label={t('researcher.integrity_field_description', 'Description')}
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  maxRows={4}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder={t(
                    'researcher.integrity_description_placeholder',
                    'Optional short note about this check'
                  )}
                />

                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('researcher.integrity_field_authors', 'Authors')}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={addAuthorRow}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {t('researcher.integrity_add_author', 'Add author')}
                    </Button>
                  </Stack>
                  <Stack spacing={0.85}>
                    {authorList.map((author, index) => (
                      <Stack key={`author-${index}`} direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={index + 1}
                          size="small"
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '8px',
                            fontWeight: 700,
                            bgcolor: 'grey.100',
                            '& .MuiChip-label': { px: 0 },
                          }}
                        />
                        <TextField
                          size="small"
                          fullWidth
                          placeholder={t('researcher.integrity_author_placeholder', 'Author full name')}
                          value={author}
                          onChange={(e) => updateAuthor(index, e.target.value)}
                          onKeyDown={(e) => handleAuthorKeyDown(e, index)}
                        />
                        <IconButton
                          size="small"
                          onClick={() => removeAuthorRow(index)}
                          disabled={authorList.length === 1 && !author.trim()}
                          aria-label={t('common.remove', 'Remove')}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                    {t(
                      'researcher.integrity_authors_doi_hint',
                      'Add authors manually, or enter a DOI above to fill them from Crossref'
                    )}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* 3. Attribution + options */}
            <Box>
              <SectionLabel>{t('researcher.integrity_section_options', '3. Submission options')}</SectionLabel>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent="space-between"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: '#8b6cbc' }}>
                    <PersonIcon fontSize="small" />
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('researcher.integrity_field_submitted_by', 'Submitted by')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {contributorName || t('researcher.integrity_no_profile', 'Your profile name is not set')}
                    </Typography>
                    {user?.orcidId ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <OrcidIcon sx={{ fontSize: 13, color: '#A6CE39' }} />
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {user.orcidId}
                        </Typography>
                      </Stack>
                    ) : null}
                  </Box>
                </Stack>

                <FormControlLabel
                  sx={{ m: 0, ml: { sm: 1 }, alignItems: 'flex-start' }}
                  control={
                    <Switch
                      checked={form.compareGlobal}
                      onChange={(e) => setForm((f) => ({ ...f, compareGlobal: e.target.checked }))}
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {t('researcher.integrity_compare_short', 'Compare to global repository')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t(
                          'researcher.integrity_compare_hint',
                          'Checks against ImaChek’s published image library'
                        )}
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: '#faf8fc',
            gap: 1,
          }}
        >
          <Button onClick={handleCloseDialog} disabled={submitting} sx={{ textTransform: 'none' }}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || form.files.length === 0}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <ImageIntegrityIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5,
              bgcolor: '#8b6cbc',
              '&:hover': { bgcolor: '#7a5aad' },
            }}
          >
            {isBatch
              ? t('researcher.integrity_submit_batch', 'Start analysis · {{count}} files', {
                  count: form.files.length,
                })
              : t('researcher.integrity_submit', 'Start analysis')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full-size preview for clickable thumbnails */}
      <Dialog open={Boolean(previewCase)} onClose={() => setPreviewCase(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="h6" component="span" noWrap sx={{ fontWeight: 600 }}>
            {previewCase?.fileName || t('researcher.integrity_col_preview', 'Preview')}
          </Typography>
          <IconButton onClick={() => setPreviewCase(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {previewCase &&
            (() => {
              const ext = (previewCase.fileFormat || getExtension(previewCase.fileName)).toLowerCase();
              const showImage =
                previewCase.isImagePreview === true || IMAGE_EXTENSIONS.includes(ext);

              if (showImage) {
                return (
                  <Box
                    component="img"
                    src={previewCase.previewUrl}
                    alt={previewCase.fileName}
                    sx={{
                      display: 'block',
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      mx: 'auto',
                      objectFit: 'contain',
                      borderRadius: 1,
                    }}
                  />
                );
              }

              return (
                <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
                  <FileTypeIcon extension={ext} sx={{ fontSize: 56, color: 'text.secondary' }} />
                  <Typography color="text.secondary">{previewCase.fileName}</Typography>
                  <Button
                    variant="outlined"
                    href={`${previewCase.previewUrl}?download=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('common.download', 'Download')}
                  </Button>
                </Stack>
              );
            })()}
        </DialogContent>
      </Dialog>

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
