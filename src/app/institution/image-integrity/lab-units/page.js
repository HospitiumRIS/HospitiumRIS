'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as ChecksIcon,
  CheckCircleOutline as ActiveIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Inbox as UnfiledIcon,
  Link as LinkIcon,
  Search as SearchIcon,
  Science as LabIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../../components/common/PageHeader';
import IntegrityResultSummary from '../../../../components/ImageIntegrity/IntegrityResultSummary';

const PURPLE = '#8b6cbc';
const fieldFocusSx = {
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PURPLE },
  '& .MuiInputLabel-root.Mui-focused': { color: PURPLE },
};
const thSx = { fontWeight: 600, color: 'white', borderBottom: 'none', py: 2, whiteSpace: 'nowrap' };
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg'];

const STATUS_CONFIG = {
  UPLOADING: { label: 'Uploading', color: '#2196f3', bgColor: '#e3f2fd' },
  PROCESSING: { label: 'Analyzing', color: '#ff9800', bgColor: '#fff3e0' },
  COMPLETED: { label: 'Completed', color: '#4caf50', bgColor: '#e8f5e9' },
  FAILED: { label: 'Failed', color: '#f44336', bgColor: '#ffebee' },
};

function StatusChip({ status }) {
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
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatAuthors(authors) {
  if (!Array.isArray(authors)) return '';
  return authors.map((name) => String(name || '').trim()).filter(Boolean).join(', ');
}

function formatSubmitter(person) {
  if (!person) return '';
  return `${person.givenName || ''} ${person.familyName || ''}`.trim() || person.email || '';
}

function getExtension(fileName = '') {
  const parts = String(fileName).split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function StatCard({ label, value, hint, icon }) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
      <Paper
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: PURPLE,
          boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
          border: 'none',
          position: 'relative',
          overflow: 'hidden',
          height: 100,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            right: -10,
            width: 40,
            height: 40,
            bgcolor: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
            {label}
          </Typography>
          {icon}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
          {hint}
        </Typography>
      </Paper>
    </Grid>
  );
}

function CheckPreview({ caseItem }) {
  const extension = (caseItem.fileFormat || getExtension(caseItem.fileName)).toLowerCase();
  const isImage = caseItem.isImagePreview ?? IMAGE_EXTENSIONS.includes(extension);
  if (isImage && caseItem.previewUrl) {
    return (
      <Box
        component="img"
        src={caseItem.previewUrl}
        alt=""
        sx={{
          width: 40,
          height: 40,
          objectFit: 'cover',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: '#f8fafc',
        }}
      />
    );
  }
  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: 1,
        bgcolor: alpha(PURPLE, 0.08),
        color: PURPLE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 800,
        textTransform: 'uppercase',
      }}
    >
      {extension || 'FILE'}
    </Box>
  );
}

export default function InstitutionLabUnitsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [labUnits, setLabUnits] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [labVisibility, setLabVisibility] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [libraryFilter, setLibraryFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', isActive: true });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, unit: null });
  const [removing, setRemoving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [labsRes, casesRes] = await Promise.all([
        fetch('/api/institution/image-integrity/lab-units'),
        fetch('/api/institution/image-integrity'),
      ]);
      const labsData = await labsRes.json();
      const casesData = await casesRes.json();
      if (!labsRes.ok) {
        setError(labsData.error || t('institution_nav.integrity_lab_units_load_failed', 'Failed to load labs and units.'));
        return;
      }
      if (!casesRes.ok) {
        setError(casesData.error || t('institution_nav.integrity_load_failed', 'Failed to load integrity checks.'));
        return;
      }
      setLabUnits(labsData.labUnits || []);
      setCases(casesData.cases || []);
    } catch (err) {
      console.error(err);
      setError(t('institution_nav.integrity_lab_units_load_failed', 'Failed to load labs and units.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const labById = useMemo(
    () => Object.fromEntries(labUnits.map((unit) => [unit.id, unit])),
    [labUnits]
  );

  const counts = useMemo(() => {
    const byLab = {};
    let tagged = 0;
    cases.forEach((item) => {
      if (item.labUnitId) {
        tagged += 1;
        byLab[item.labUnitId] = (byLab[item.labUnitId] || 0) + 1;
      }
    });
    return {
      all: cases.length,
      tagged,
      untagged: cases.length - tagged,
      byLab,
      active: labUnits.filter((unit) => unit.isActive).length,
      hidden: labUnits.filter((unit) => !unit.isActive).length,
    };
  }, [cases, labUnits]);

  const visibleLabs = useMemo(() => {
    return labUnits.filter((unit) => {
      if (labVisibility === 'active' && !unit.isActive) return false;
      if (labVisibility === 'hidden' && unit.isActive) return false;
      return true;
    });
  }, [labUnits, labVisibility]);

  const filteredCases = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = cases.filter((item) => {
      if (libraryFilter === 'untagged' && item.labUnitId) return false;
      if (libraryFilter !== 'all' && libraryFilter !== 'untagged' && item.labUnitId !== libraryFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;
      const labName = item.labUnit?.name || labById[item.labUnitId]?.name || '';
      const collectionName = item.collection?.name || '';
      const authors = formatAuthors(item.authors);
      const submitter = formatSubmitter(item.submittedBy);
      return [item.title, item.fileName, item.doi, item.description, authors, submitter, item.submittedBy?.email, labName, collectionName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === 'title') return String(a.title || '').localeCompare(String(b.title || ''));
      const aTime = new Date(a.createdAt).getTime() || 0;
      const bTime = new Date(b.createdAt).getTime() || 0;
      return sortBy === 'date-asc' ? aTime - bTime : bTime - aTime;
    });
    return sorted;
  }, [cases, labById, libraryFilter, query, sortBy, statusFilter]);

  const pagedCases = useMemo(
    () => filteredCases.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredCases, page, rowsPerPage]
  );

  const activeLab = libraryFilter !== 'all' && libraryFilter !== 'untagged' ? labById[libraryFilter] : null;
  const confirmHasSubmissions = Boolean(confirm.unit && (counts.byLab[confirm.unit.id] || confirm.unit.submissionCount || 0) > 0);

  const openDialog = (unit = null) => {
    setFormError('');
    if (unit) {
      setEditing(unit);
      setForm({ name: unit.name, description: unit.description || '', isActive: unit.isActive });
    } else {
      setEditing(null);
      setForm({ name: '', description: '', isActive: true });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError(t('institution_nav.integrity_lab_unit_name_required', 'Name is required.'));
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        isActive: form.isActive,
        sortOrder: editing
          ? editing.sortOrder || 0
          : labUnits.reduce((max, unit) => Math.max(max, unit.sortOrder || 0), 0) + 1,
      };
      const url = editing
        ? `/api/institution/image-integrity/lab-units/${editing.id}`
        : '/api/institution/image-integrity/lab-units';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || t('institution_nav.integrity_lab_unit_save_failed', 'Failed to save lab or unit.'));
        return;
      }
      setDialogOpen(false);
      setSnackbar({
        open: true,
        severity: 'success',
        message: editing
          ? t('institution_nav.integrity_lab_unit_updated', 'Lab or unit updated.')
          : t('institution_nav.integrity_lab_unit_created', 'Lab or unit created.'),
      });
      if (!editing && data.labUnit?.id) setLibraryFilter(data.labUnit.id);
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError(t('institution_nav.integrity_lab_unit_save_failed', 'Failed to save lab or unit.'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    const unit = confirm.unit;
    if (!unit) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/institution/image-integrity/lab-units/${unit.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setSnackbar({
          open: true,
          severity: 'error',
          message: data.error || t('institution_nav.integrity_lab_unit_delete_failed', 'Failed to remove lab or unit.'),
        });
        return;
      }
      setConfirm({ open: false, unit: null });
      if (data.deleted && libraryFilter === unit.id) setLibraryFilter('all');
      setSnackbar({
        open: true,
        severity: 'success',
        message:
          data.message ||
          (data.deactivated
            ? 'Hidden from researchers because checks are still linked to it.'
            : t('institution_nav.integrity_lab_unit_removed', 'Lab or unit removed.')),
      });
      fetchData();
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        severity: 'error',
        message: t('institution_nav.integrity_lab_unit_delete_failed', 'Failed to remove lab or unit.'),
      });
    } finally {
      setRemoving(false);
    }
  };

  const selectFilter = (id) => {
    setLibraryFilter(id);
    setPage(0);
  };

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('all');
    setLabVisibility('all');
    setSortBy('date-desc');
    setPage(0);
  };

  const sidebarItemSx = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    px: 2,
    py: 1,
    cursor: 'pointer',
    bgcolor: active ? alpha(PURPLE, 0.1) : 'transparent',
    borderLeft: active ? `3px solid ${PURPLE}` : '3px solid transparent',
    '&:hover': { bgcolor: alpha(PURPLE, 0.06) },
  });

  return (
    <Box>
      <PageHeader
        title={t('institution_nav.integrity_lab_units', 'Labs / Units')}
        description={t(
          'institution_nav.integrity_lab_units_desc',
          'Create the labs researchers can tag on integrity checks. Inactive labs stay on past submissions but are hidden from new ones.'
        )}
        icon={<LabIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: t('institution.portal_title', 'Institution Portal'), path: '/institution' },
          { label: t('institution.image_integrity', 'Image Integrity'), path: '/institution/image-integrity' },
        ]}
        actionButton={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openDialog()}
            sx={{ bgcolor: 'white', color: PURPLE, '&:hover': { bgcolor: '#f5f5f5' }, textTransform: 'none', fontWeight: 700 }}
          >
            {t('institution_nav.integrity_lab_unit_add', 'Add lab or unit')}
          </Button>
        }
      />

      <Container maxWidth={false} sx={{ py: 4, mt: 5, maxWidth: '1600px', mx: 'auto' }}>
        <Grid container spacing={2.5} sx={{ mb: 4, mt: -6 }}>
          <StatCard
            label="Labs and units"
            value={labUnits.length}
            hint="Catalog entries"
            icon={<LabIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />}
          />
          <StatCard
            label="Shown to researchers"
            value={counts.active}
            hint={`${counts.hidden} hidden`}
            icon={<ActiveIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />}
          />
          <StatCard
            label="Integrity checks"
            value={counts.all}
            hint="Institution submissions"
            icon={<ChecksIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />}
          />
          <StatCard
            label="Tagged with a lab"
            value={counts.tagged}
            hint={counts.all ? `${Math.round((counts.tagged / counts.all) * 100)}% tagged` : 'None tagged yet'}
            icon={<LabIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />}
          />
        </Grid>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 1.5,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            placeholder="Search checks, researchers, DOI, labs..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            sx={{ flex: '1 1 280px', minWidth: 240 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: PURPLE, fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="PROCESSING">Analyzing</MenuItem>
              <MenuItem value="UPLOADING">Uploading</MenuItem>
              <MenuItem value="FAILED">Failed</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Lab visibility</InputLabel>
            <Select
              value={labVisibility}
              label="Lab visibility"
              onChange={(e) => setLabVisibility(e.target.value)}
            >
              <MenuItem value="all">All labs</MenuItem>
              <MenuItem value="active">Shown to researchers</MenuItem>
              <MenuItem value="hidden">Hidden</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort by</InputLabel>
            <Select value={sortBy} label="Sort by" onChange={(e) => setSortBy(e.target.value)}>
              <MenuItem value="date-desc">Newest first</MenuItem>
              <MenuItem value="date-asc">Oldest first</MenuItem>
              <MenuItem value="title">Title A-Z</MenuItem>
            </Select>
          </FormControl>
          <Button startIcon={<ClearIcon />} onClick={clearFilters} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 600 }}>
            Clear all
          </Button>
        </Paper>

        {error ? (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        ) : null}

        <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'stretch', flexDirection: { xs: 'column', md: 'row' } }}>
          <Paper
            sx={{
              width: { xs: '100%', md: 280 },
              flexShrink: 0,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: { md: 'calc(100vh - 220px)' },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Labs / Units</Typography>
                <Typography variant="caption" color="text.secondary">
                  {labUnits.length} lab{labUnits.length === 1 ? '' : 's'}
                </Typography>
              </Box>
              <Tooltip title="Add lab or unit">
                <IconButton size="small" onClick={() => openDialog()} sx={{ color: PURPLE }}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
              {[
                { id: 'all', label: 'All checks', count: counts.all, icon: <ChecksIcon sx={{ fontSize: 18, color: PURPLE }} /> },
                { id: 'untagged', label: 'Untagged', count: counts.untagged, icon: <UnfiledIcon sx={{ fontSize: 18, color: PURPLE }} /> },
              ].map((item) => (
                <Box key={item.id} onClick={() => selectFilter(item.id)} sx={sidebarItemSx(libraryFilter === item.id)}>
                  {item.icon}
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: libraryFilter === item.id ? 600 : 400 }}>
                    {item.label}
                  </Typography>
                  <Chip label={item.count} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(PURPLE, 0.1), color: PURPLE }} />
                </Box>
              ))}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ px: 2, py: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.6 }}>
                  LABS / UNITS
                </Typography>
              </Box>
              {visibleLabs.length === 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, py: 1.5 }}>
                  {labUnits.length === 0
                    ? 'No labs yet. Add one so researchers can tag their checks.'
                    : 'No labs match this visibility filter.'}
                </Typography>
              ) : (
                visibleLabs.map((unit) => {
                  const active = libraryFilter === unit.id;
                  return (
                    <Box
                      key={unit.id}
                      onClick={() => selectFilter(unit.id)}
                      sx={{ ...sidebarItemSx(active), opacity: unit.isActive ? 1 : 0.72, '&:hover .folder-actions': { opacity: 1 } }}
                    >
                      <LabIcon sx={{ fontSize: 18, color: PURPLE }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: active ? 600 : 400 }} noWrap title={unit.name}>
                          {unit.name}
                        </Typography>
                        {!unit.isActive ? (
                          <Typography variant="caption" color="text.secondary">Hidden</Typography>
                        ) : null}
                      </Box>
                      <Stack className="folder-actions" direction="row" spacing={0} sx={{ opacity: { xs: 1, md: 0 } }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDialog(unit);
                          }}
                        >
                          <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirm({ open: true, unit });
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Stack>
                      <Chip
                        label={counts.byLab[unit.id] || 0}
                        size="small"
                        sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(PURPLE, 0.1), color: PURPLE }}
                      />
                    </Box>
                  );
                })
              )}
            </Box>
          </Paper>

          <Paper sx={{ flex: 1, minWidth: 0, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <Box sx={{ p: 2.5, bgcolor: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                  <LabIcon sx={{ color: PURPLE, fontSize: 20 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }} noWrap>
                      {libraryFilter === 'all'
                        ? 'Integrity checks'
                        : libraryFilter === 'untagged'
                          ? 'Untagged'
                          : activeLab?.name || 'Lab / Unit'}
                    </Typography>
                    {activeLab?.description ? (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {activeLab.description}
                      </Typography>
                    ) : null}
                  </Box>
                  <Chip
                    label={filteredCases.length}
                    size="small"
                    sx={{ bgcolor: PURPLE, color: 'white', fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                  />
                  {activeLab && !activeLab.isActive ? (
                    <Chip size="small" label="Hidden from researchers" sx={{ height: 20, fontWeight: 600 }} />
                  ) : null}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  {filteredCases.length === 0
                    ? 'No checks'
                    : `Showing ${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filteredCases.length)} of ${filteredCases.length}`}
                </Typography>
              </Box>

              {loading ? (
                <Box sx={{ py: 4 }}>
                  <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
                  <Typography sx={{ textAlign: 'center', mt: 2 }} color="text.secondary">
                    Loading labs and checks...
                  </Typography>
                </Box>
              ) : filteredCases.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <LabIcon sx={{ fontSize: 72, color: '#e0e0e0', mb: 1.5 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {labUnits.length === 0 && cases.length === 0
                      ? 'Add your first lab or unit'
                      : cases.length === 0
                        ? 'No integrity checks yet'
                        : 'No checks in this view'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 440, mx: 'auto' }}>
                    {labUnits.length === 0
                      ? 'Researchers can optionally tag integrity checks with a lab name. That makes oversight easier to filter later.'
                      : 'Try another lab, or clear search and status filters.'}
                  </Typography>
                  {labUnits.length === 0 ? (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => openDialog()}
                      sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: '#7559a3' }, textTransform: 'none', fontWeight: 700 }}
                    >
                      {t('institution_nav.integrity_lab_unit_add', 'Add lab or unit')}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: '#7559a3' }, textTransform: 'none', fontWeight: 700 }}
                      onClick={() => router.push('/institution/image-integrity')}
                    >
                      Go to Submission Reports
                    </Button>
                  )}
                </Box>
              ) : (
                <Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: PURPLE }}>
                          <TableCell sx={thSx}>Check</TableCell>
                          <TableCell sx={thSx}>Researcher</TableCell>
                          <TableCell sx={thSx}>Authors</TableCell>
                          <TableCell sx={thSx}>Labs / Units</TableCell>
                          <TableCell sx={thSx}>Collection</TableCell>
                          <TableCell sx={thSx}>Findings</TableCell>
                          <TableCell sx={thSx}>Status</TableCell>
                          <TableCell sx={thSx}>Submitted</TableCell>
                          <TableCell sx={{ ...thSx, textAlign: 'center' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pagedCases.map((item, index) => {
                          const authors = formatAuthors(item.authors);
                          const lab = item.labUnit || labById[item.labUnitId];
                          const submitter = formatSubmitter(item.submittedBy);
                          return (
                            <TableRow
                              key={item.id}
                              hover
                              onClick={() => router.push(`/institution/image-integrity/${item.id}`)}
                              sx={{
                                cursor: 'pointer',
                                bgcolor: index % 2 === 0 ? '#fafafa' : 'white',
                                '&:hover': { backgroundColor: alpha(PURPLE, 0.12) },
                                '& td': { verticalAlign: 'top' },
                              }}
                            >
                              <TableCell sx={{ py: 2, maxWidth: 320 }}>
                                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                                  <CheckPreview caseItem={item} />
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }} title={item.title}>
                                      {item.title}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} title={item.fileName}>
                                      {item.fileName}
                                      {(item.fileFormat || item.fileSizeBytes)
                                        ? ` · ${(item.fileFormat || '').toUpperCase()}${item.fileSizeBytes ? ` · ${formatBytes(item.fileSizeBytes)}` : ''}`
                                        : ''}
                                    </Typography>
                                    {item.doi ? (
                                      <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} title={item.doi}>
                                        <LinkIcon sx={{ fontSize: 12 }} />
                                        {item.doi}
                                      </Typography>
                                    ) : (
                                      <Typography variant="caption" color="text.disabled">No DOI</Typography>
                                    )}
                                  </Box>
                                </Stack>
                              </TableCell>
                              <TableCell sx={{ py: 2, maxWidth: 180 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {submitter || 'Not recorded'}
                                </Typography>
                                {item.submittedBy?.email ? (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    {item.submittedBy.email}
                                  </Typography>
                                ) : null}
                              </TableCell>
                              <TableCell sx={{ maxWidth: 160, py: 2 }}>
                                <Typography variant="body2" color={authors ? 'text.primary' : 'text.disabled'}>
                                  {authors || 'Not recorded'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ py: 2 }}>
                                {lab ? (
                                  <Chip
                                    size="small"
                                    icon={<LabIcon sx={{ fontSize: '16px !important' }} />}
                                    label={lab.name}
                                    sx={{
                                      maxWidth: 180,
                                      fontWeight: 600,
                                      bgcolor: alpha(PURPLE, 0.1),
                                      color: '#6f4fa0',
                                      '& .MuiChip-icon': { color: PURPLE },
                                    }}
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.disabled">Not set</Typography>
                                )}
                              </TableCell>
                              <TableCell sx={{ py: 2 }}>
                                {item.collection?.name ? (
                                  <Chip
                                    size="small"
                                    label={item.collection.name}
                                    sx={{ maxWidth: 160, fontWeight: 600, bgcolor: alpha(PURPLE, 0.1), color: '#6f4fa0' }}
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.disabled">Personal</Typography>
                                )}
                              </TableCell>
                              <TableCell sx={{ py: 2 }} onClick={(e) => e.stopPropagation()}>
                                <IntegrityResultSummary caseItem={item} />
                              </TableCell>
                              <TableCell sx={{ py: 2 }}>
                                <StatusChip status={item.status} />
                              </TableCell>
                              <TableCell sx={{ py: 2, whiteSpace: 'nowrap' }}>
                                <Typography variant="body2">{formatDate(item.createdAt)}</Typography>
                                {item.status === 'COMPLETED' ? (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Results {formatDate(item.analysisCompletedAt || item.updatedAt)}
                                  </Typography>
                                ) : null}
                              </TableCell>
                              <TableCell align="center" onClick={(e) => e.stopPropagation()} sx={{ py: 2 }}>
                                <Tooltip title="Open report">
                                  <IconButton
                                    size="small"
                                    onClick={() => router.push(`/institution/image-integrity/${item.id}`)}
                                    sx={{ color: PURPLE }}
                                  >
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
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
                    sx={{
                      borderTop: '1px solid #e5e7eb',
                      bgcolor: '#fafbfd',
                      '.MuiTablePagination-select': { color: PURPLE, fontWeight: 600 },
                    }}
                  />
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1.75,
            px: 2.5,
            mb: 0,
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.25 }}>
              {editing ? 'Edit lab or unit' : 'Add a lab or unit'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.88)' }}>
              Researchers can tag this name on new integrity checks.
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => !saving && setDialogOpen(false)}
            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.16)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: '24px !important', pb: 1 }}>
          <Stack spacing={2.25}>
            {formError ? <Alert severity="error" sx={{ borderRadius: 2 }}>{formError}</Alert> : null}
            <TextField
              autoFocus
              label="Name"
              placeholder="e.g. Cardiology imaging lab"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.slice(0, 80) }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              required
              fullWidth
              helperText={`${form.name.trim().length}/80 - shown on the researcher submit form`}
              InputLabelProps={{ shrink: true }}
              sx={fieldFocusSx}
            />
            <TextField
              label="Description (optional)"
              placeholder="What this lab covers - for admins only"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, 240) }))}
              multiline
              minRows={3}
              fullWidth
              helperText="Not shown to researchers"
              InputLabelProps={{ shrink: true }}
              sx={fieldFocusSx}
            />
            <Paper
              elevation={0}
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: form.isActive ? alpha(PURPLE, 0.35) : 'divider',
                bgcolor: form.isActive ? alpha(PURPLE, 0.05) : 'grey.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  Available on new submissions
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.45 }}>
                  {form.isActive
                    ? 'Researchers can select this lab when they submit a check.'
                    : 'Hidden from new checks. Existing tagged submissions keep this name.'}
                </Typography>
              </Box>
              <Switch
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: PURPLE },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: PURPLE },
                }}
              />
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#faf8fc' }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} sx={{ textTransform: 'none' }}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#7a5aad' } }}
          >
            {saving ? t('common.saving', 'Saving...') : editing ? 'Save changes' : 'Add lab or unit'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirm.open}
        onClose={() => !removing && setConfirm({ open: false, unit: null })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {confirmHasSubmissions ? 'Hide this lab from researchers?' : 'Remove this lab or unit?'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ lineHeight: 1.65, color: '#475569' }}>
            {confirmHasSubmissions
              ? `"${confirm.unit?.name}" is tagged on ${counts.byLab[confirm.unit?.id] || confirm.unit?.submissionCount} check${(counts.byLab[confirm.unit?.id] || confirm.unit?.submissionCount) === 1 ? '' : 's'}. It will be hidden from new submissions. Existing tags are kept.`
              : `"${confirm.unit?.name}" has no tagged checks and will be deleted.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirm({ open: false, unit: null })} disabled={removing} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRemove}
            disabled={removing}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {removing ? 'Working...' : confirmHasSubmissions ? 'Hide lab' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
