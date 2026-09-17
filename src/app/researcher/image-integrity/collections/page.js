'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
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
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
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
  Clear as ClearIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  DriveFileMove as MoveIcon,
  Edit as EditIcon,
  Folder as FolderIcon,
  FolderShared as CollectionIcon,
  Inbox as UnfiledIcon,
  Link as LinkIcon,
  Search as SearchIcon,
  Science as ScienceIcon,
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

export default function ResearcherCollectionsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionIdFromUrl = searchParams.get('collectionId') || '';

  const [collections, setCollections] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [libraryFilter, setLibraryFilter] = useState(
    collectionIdFromUrl === 'none' ? 'unfiled' : collectionIdFromUrl || 'all'
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, collection: null });
  const [removing, setRemoving] = useState(false);
  const [assignMenu, setAssignMenu] = useState({ anchor: null, caseIds: [] });
  const [busyId, setBusyId] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [collectionsRes, casesRes] = await Promise.all([
        fetch('/api/researcher/image-integrity/collections'),
        fetch('/api/researcher/image-integrity'),
      ]);
      const collectionsData = await collectionsRes.json();
      const casesData = await casesRes.json();
      if (!collectionsRes.ok) {
        setError(collectionsData.error || t('researcher.integrity_collections_load_failed', 'Failed to load collections.'));
        return;
      }
      if (!casesRes.ok) {
        setError(casesData.error || t('researcher.integrity_load_failed', 'Failed to load integrity checks.'));
        return;
      }
      setCollections(collectionsData.collections || []);
      setCases(casesData.cases || []);
    } catch (err) {
      console.error(err);
      setError(t('researcher.integrity_collections_load_failed', 'Failed to load collections.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const collectionById = useMemo(
    () => Object.fromEntries(collections.map((collection) => [collection.id, collection])),
    [collections]
  );

  const counts = useMemo(() => {
    const byCollection = {};
    let filed = 0;
    cases.forEach((item) => {
      if (item.collectionId) {
        filed += 1;
        byCollection[item.collectionId] = (byCollection[item.collectionId] || 0) + 1;
      }
    });
    return {
      all: cases.length,
      filed,
      unfiled: cases.length - filed,
      byCollection,
    };
  }, [cases]);

  const completedCount = useMemo(
    () => cases.filter((item) => item.status === 'COMPLETED').length,
    [cases]
  );

  const filteredCases = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = cases.filter((item) => {
      if (libraryFilter === 'unfiled' && item.collectionId) return false;
      if (libraryFilter !== 'all' && libraryFilter !== 'unfiled' && item.collectionId !== libraryFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;
      const collectionName = collectionById[item.collectionId]?.name || '';
      const labName = item.labUnit?.name || '';
      const authors = formatAuthors(item.authors);
      return [item.title, item.fileName, item.doi, item.description, authors, labName, collectionName]
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
  }, [cases, collectionById, libraryFilter, query, sortBy, statusFilter]);

  const pagedCases = useMemo(
    () => filteredCases.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredCases, page, rowsPerPage]
  );

  const activeCollection = libraryFilter !== 'all' && libraryFilter !== 'unfiled'
    ? collectionById[libraryFilter]
    : null;

  const openDialog = (collection = null) => {
    setFormError('');
    if (collection) {
      setEditing(collection);
      setForm({ name: collection.name, description: collection.description || '' });
    } else {
      setEditing(null);
      setForm({ name: '', description: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError(t('researcher.integrity_collection_name_required', 'Collection name is required.'));
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const url = editing
        ? `/api/researcher/image-integrity/collections/${editing.id}`
        : '/api/researcher/image-integrity/collections';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || t('researcher.integrity_collection_save_failed', 'Failed to save collection.'));
        return;
      }
      setDialogOpen(false);
      setSnackbar({
        open: true,
        severity: 'success',
        message: editing
          ? t('researcher.integrity_collection_updated', 'Collection updated.')
          : t('researcher.integrity_collection_created', 'Collection created.'),
      });
      if (!editing && data.collection?.id) setLibraryFilter(data.collection.id);
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError(t('researcher.integrity_collection_save_failed', 'Failed to save collection.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCollection = async () => {
    const collection = confirm.collection;
    if (!collection) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/researcher/image-integrity/collections/${collection.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('researcher.integrity_collection_delete_failed', 'Failed to delete collection.'));
        return;
      }
      setConfirm({ open: false, collection: null });
      if (libraryFilter === collection.id) setLibraryFilter('all');
      setSnackbar({
        open: true,
        severity: 'success',
        message: t('researcher.integrity_collection_deleted', 'Collection removed. Checks were kept.'),
      });
      fetchData();
    } catch (err) {
      console.error(err);
      setError(t('researcher.integrity_collection_delete_failed', 'Failed to delete collection.'));
    } finally {
      setRemoving(false);
    }
  };

  const assignCases = async (caseIds, collectionId) => {
    setBusyId('batch');
    try {
      await Promise.all(
        caseIds.map((id) =>
          fetch(`/api/researcher/image-integrity/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collectionId }),
          })
        )
      );
      setCases((prev) =>
        prev.map((item) =>
          caseIds.includes(item.id)
            ? {
                ...item,
                collectionId,
                collection: collectionId ? collectionById[collectionId] || item.collection : null,
              }
            : item
        )
      );
      setSelectedIds([]);
      setAssignMenu({ anchor: null, caseIds: [] });
      setSnackbar({
        open: true,
        severity: 'success',
        message: collectionId
          ? t('researcher.integrity_collection_assigned', 'Checks added to the collection.')
          : t('researcher.integrity_collection_unassigned', 'Checks removed from the collection.'),
      });
    } catch (err) {
      console.error(err);
      setError(t('researcher.integrity_collection_assign_failed', 'Failed to update collection assignment.'));
    } finally {
      setBusyId('');
    }
  };

  const toggleSelected = (id, checked) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((item) => item !== id)));
  };

  const toggleSelectPage = (checked) => {
    const ids = pagedCases.map((item) => item.id);
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, ...ids]));
      return prev.filter((id) => !ids.includes(id));
    });
  };

  const selectFilter = (id) => {
    setLibraryFilter(id);
    setPage(0);
    setSelectedIds([]);
  };

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('all');
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
        title={t('researcher.integrity_my_collections', 'My Collections')}
        description={t(
          'researcher.integrity_collections_desc',
          'Personal folders for grouping your integrity checks. Collections are not labs or units.'
        )}
        icon={<CollectionIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: t('researcher.portal_title', 'Researcher Portal'), path: '/researcher' },
          { label: t('researcher.image_integrity', 'Image Integrity'), path: '/researcher/image-integrity' },
        ]}
        actionButton={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openDialog()}
            sx={{ bgcolor: 'white', color: PURPLE, '&:hover': { bgcolor: '#f5f5f5' }, textTransform: 'none', fontWeight: 700 }}
          >
            {t('researcher.integrity_collection_add', 'New collection')}
          </Button>
        }
      />

      <Container maxWidth={false} sx={{ py: 4, mt: 5, maxWidth: '1600px', mx: 'auto' }}>
        <Grid container spacing={2.5} sx={{ mb: 4, mt: -6 }}>
          <StatCard
            label="Collections"
            value={collections.length}
            hint="Personal folders created"
            icon={<FolderIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />}
          />
          <StatCard
            label="Integrity checks"
            value={counts.all}
            hint="All of your submissions"
            icon={<ChecksIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />}
          />
          <StatCard
            label="In a collection"
            value={counts.filed}
            hint={counts.all ? `${Math.round((counts.filed / counts.all) * 100)}% filed` : 'None filed yet'}
            icon={<CollectionIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />}
          />
          <StatCard
            label="Completed"
            value={completedCount}
            hint="Analysis finished"
            icon={<ChecksIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />}
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
            placeholder="Search checks, authors, DOI, labs..."
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
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              label="Sort by"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="date-desc">Newest first</MenuItem>
              <MenuItem value="date-asc">Oldest first</MenuItem>
              <MenuItem value="title">Title A-Z</MenuItem>
            </Select>
          </FormControl>
          <Button
            startIcon={<ClearIcon />}
            onClick={clearFilters}
            sx={{ color: PURPLE, textTransform: 'none', fontWeight: 600 }}
          >
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
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>My Collections</Typography>
                <Typography variant="caption" color="text.secondary">
                  {collections.length} folder{collections.length === 1 ? '' : 's'}
                </Typography>
              </Box>
              <Tooltip title="New collection">
                <IconButton size="small" onClick={() => openDialog()} sx={{ color: PURPLE }}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
              {[
                { id: 'all', label: 'All checks', count: counts.all, icon: <ChecksIcon sx={{ fontSize: 18, color: PURPLE }} /> },
                { id: 'unfiled', label: 'Unfiled', count: counts.unfiled, icon: <UnfiledIcon sx={{ fontSize: 18, color: PURPLE }} /> },
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
                  FOLDERS
                </Typography>
              </Box>
              {collections.length === 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, py: 1.5 }}>
                  No collections yet. Create one to group related integrity checks.
                </Typography>
              ) : (
                collections.map((collection) => {
                  const active = libraryFilter === collection.id;
                  return (
                    <Box
                      key={collection.id}
                      onClick={() => selectFilter(collection.id)}
                      sx={{ ...sidebarItemSx(active), '&:hover .folder-actions': { opacity: 1 } }}
                    >
                      <FolderIcon sx={{ fontSize: 18, color: PURPLE }} />
                      <Typography variant="body2" sx={{ flex: 1, fontWeight: active ? 600 : 400 }} noWrap title={collection.name}>
                        {collection.name}
                      </Typography>
                      <Stack className="folder-actions" direction="row" spacing={0} sx={{ opacity: { xs: 1, md: 0 } }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDialog(collection);
                          }}
                        >
                          <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirm({ open: true, collection });
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Stack>
                      <Chip
                        label={counts.byCollection[collection.id] || 0}
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
                  <FolderIcon sx={{ color: PURPLE, fontSize: 20 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }} noWrap>
                      {libraryFilter === 'all'
                        ? 'Integrity checks'
                        : libraryFilter === 'unfiled'
                          ? 'Unfiled'
                          : activeCollection?.name || 'Collection'}
                    </Typography>
                    {activeCollection?.description ? (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {activeCollection.description}
                      </Typography>
                    ) : null}
                  </Box>
                  <Chip
                    label={filteredCases.length}
                    size="small"
                    sx={{ bgcolor: PURPLE, color: 'white', fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {selectedIds.length > 0 && (
                    <>
                      <Chip
                        label={`${selectedIds.length} selected`}
                        size="small"
                        onDelete={() => setSelectedIds([])}
                        sx={{ bgcolor: '#ff9800', color: 'white', fontWeight: 600, height: 20 }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<MoveIcon />}
                        disabled={busyId === 'batch' || collections.length === 0}
                        onClick={(e) => setAssignMenu({ anchor: e.currentTarget, caseIds: selectedIds })}
                        sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none' }}
                      >
                        Add to collection
                      </Button>
                      {activeCollection && (
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={busyId === 'batch'}
                          onClick={() => assignCases(selectedIds, null)}
                          sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none' }}
                        >
                          Remove from collection
                        </Button>
                      )}
                    </>
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {filteredCases.length === 0
                      ? 'No checks'
                      : `Showing ${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filteredCases.length)} of ${filteredCases.length}`}
                  </Typography>
                </Box>
              </Box>

              {loading ? (
                <Box sx={{ py: 4 }}>
                  <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
                  <Typography sx={{ textAlign: 'center', mt: 2 }} color="text.secondary">
                    Loading collections...
                  </Typography>
                </Box>
              ) : filteredCases.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CollectionIcon sx={{ fontSize: 72, color: '#e0e0e0', mb: 1.5 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {cases.length === 0 ? 'No integrity checks yet' : 'No checks in this view'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 420, mx: 'auto' }}>
                    {cases.length === 0
                      ? 'Submit an integrity check and assign it to a collection to keep related files together.'
                      : 'Try another folder, or clear search and status filters.'}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: '#7559a3' }, textTransform: 'none', fontWeight: 700 }}
                    onClick={() => router.push('/researcher/image-integrity')}
                  >
                    Go to My Submissions
                  </Button>
                </Box>
              ) : (
                <Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: PURPLE }}>
                          <TableCell padding="checkbox" sx={{ borderBottom: 'none' }}>
                            <Checkbox
                              size="small"
                              sx={{ color: 'white', '&.Mui-checked': { color: 'white' }, '&.MuiCheckbox-indeterminate': { color: 'white' } }}
                              indeterminate={pagedCases.some((item) => selectedIds.includes(item.id)) && !pagedCases.every((item) => selectedIds.includes(item.id))}
                              checked={pagedCases.length > 0 && pagedCases.every((item) => selectedIds.includes(item.id))}
                              onChange={(e) => toggleSelectPage(e.target.checked)}
                            />
                          </TableCell>
                          <TableCell sx={thSx}>Check</TableCell>
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
                          const labName = item.labUnit?.name;
                          const collection = item.collection || collectionById[item.collectionId];
                          return (
                            <TableRow
                              key={item.id}
                              hover
                              onClick={() => router.push(`/researcher/image-integrity/${item.id}`)}
                              sx={{
                                cursor: 'pointer',
                                bgcolor: selectedIds.includes(item.id)
                                  ? alpha(PURPLE, 0.08)
                                  : index % 2 === 0 ? '#fafafa' : 'white',
                                '&:hover': { backgroundColor: alpha(PURPLE, 0.12) },
                                '& td': { verticalAlign: 'top' },
                              }}
                            >
                              <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  size="small"
                                  checked={selectedIds.includes(item.id)}
                                  onChange={(e) => toggleSelected(item.id, e.target.checked)}
                                  sx={{ color: PURPLE, '&.Mui-checked': { color: PURPLE } }}
                                />
                              </TableCell>
                              <TableCell sx={{ py: 2, maxWidth: 340 }}>
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
                                    {item.description ? (
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35 }} noWrap title={item.description}>
                                        {item.description}
                                      </Typography>
                                    ) : null}
                                  </Box>
                                </Stack>
                              </TableCell>
                              <TableCell sx={{ maxWidth: 180, py: 2 }}>
                                <Typography variant="body2" color={authors ? 'text.primary' : 'text.disabled'}>
                                  {authors || 'Not recorded'}
                                </Typography>
                                {item.contributor ? (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Contributor: {item.contributor}
                                  </Typography>
                                ) : null}
                              </TableCell>
                              <TableCell sx={{ py: 2 }}>
                                {labName ? (
                                  <Chip
                                    size="small"
                                    icon={<ScienceIcon sx={{ fontSize: '16px !important' }} />}
                                    label={labName}
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
                                {collection ? (
                                  <Chip
                                    size="small"
                                    icon={<FolderIcon sx={{ fontSize: '16px !important' }} />}
                                    label={collection.name}
                                    sx={{
                                      maxWidth: 180,
                                      fontWeight: 600,
                                      bgcolor: alpha(PURPLE, 0.1),
                                      color: '#6f4fa0',
                                      '& .MuiChip-icon': { color: PURPLE },
                                    }}
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.disabled">Unfiled</Typography>
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
                                  <IconButton size="small" onClick={() => router.push(`/researcher/image-integrity/${item.id}`)} sx={{ color: PURPLE }}>
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Move to collection">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => setAssignMenu({ anchor: e.currentTarget, caseIds: [item.id] })}
                                    sx={{ color: PURPLE }}
                                  >
                                    <MoveIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {item.collectionId ? (
                                  <Tooltip title="Remove from collection">
                                    <IconButton size="small" onClick={() => assignCases([item.id], null)} sx={{ color: '#b91c1c' }}>
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                ) : null}
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

      <Menu
        anchorEl={assignMenu.anchor}
        open={Boolean(assignMenu.anchor)}
        onClose={() => setAssignMenu({ anchor: null, caseIds: [] })}
      >
        {collections.length === 0 ? (
          <MenuItem disabled>Create a collection first</MenuItem>
        ) : (
          collections.map((collection) => (
            <MenuItem
              key={collection.id}
              onClick={() => assignCases(assignMenu.caseIds, collection.id)}
            >
              <FolderIcon sx={{ fontSize: 18, color: PURPLE, mr: 1 }} />
              {collection.name}
            </MenuItem>
          ))
        )}
      </Menu>

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
              {editing ? 'Edit collection' : 'Add a collection'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.88)' }}>
              A personal folder for grouping related integrity checks.
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
              label="Collection name"
              placeholder="e.g. Heart paper 2026"
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
              helperText={`${form.name.trim().length}/80`}
              InputLabelProps={{ shrink: true }}
              sx={fieldFocusSx}
            />
            <TextField
              label="Description (optional)"
              placeholder="What belongs in this folder"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, 240) }))}
              multiline
              minRows={3}
              fullWidth
              helperText="For your reference when browsing folders"
              InputLabelProps={{ shrink: true }}
              sx={fieldFocusSx}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#faf8fc' }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} sx={{ textTransform: 'none' }}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#7a5aad' } }}
          >
            {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirm.open}
        onClose={() => !removing && setConfirm({ open: false, collection: null })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Remove this collection?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ lineHeight: 1.65, color: '#475569' }}>
            {confirm.collection?.name ? `"${confirm.collection.name}" ` : ''}
            will be removed from your folders. Integrity checks stay in My Submissions and become unfiled.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirm({ open: false, collection: null })} disabled={removing} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteCollection}
            disabled={removing}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {removing ? 'Removing...' : 'Remove collection'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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
