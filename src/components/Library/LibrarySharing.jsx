'use client';

/**
 * Library sharing UI for /researcher/publications/manage ("Manage Library").
 *  - useLibrarySharing(): loads shares, shared-with-me libraries and member contributions
 *  - ShareLibraryDialog: owner adds / removes people
 *  - SharedWithMeList: sidebar list of libraries others shared with you
 *  - SharedLibraryPanel: main view of a shared library (add your publications, remove only your own)
 *  - FolderContributionsPanel: owner view of what members added to a folder
 * API: /api/publications/library/shared
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Delete as RemoveIcon,
  ExitToApp as LeaveIcon,
  FolderShared as SharedFolderIcon,
  GroupAdd as ShareIcon,
  LibraryAdd as AddIcon,
  OpenInNew as OpenIcon,
  PersonRemove as PersonRemoveIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '@/components/GlobalAdmin/InstitutionModalShell';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#6d5499';
const INK = '#1f2937';
const MUTED = '#64748b';

const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

async function post(body) {
  const res = await fetch('/api/publications/library/shared', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.error || 'Request failed');
  return data;
}

export function useLibrarySharing() {
  const [data, setData] = useState({ sharedWithMe: [], mySharesByFolder: {}, contributionsByFolder: {} });
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/publications/library/shared', { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) setData(json);
    } catch (err) {
      console.error('Failed to load shared libraries', err);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { ...data, loading, reload };
}

function PublicationLine({ publication, meta, action }) {
  const href = publication.doi ? `https://doi.org/${String(publication.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//, '')}` : publication.url;
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {href ? (
          <MuiLink href={href} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ color: PURPLE_DARK, fontWeight: 600, fontSize: '0.9rem' }}>
            {publication.title} <OpenIcon sx={{ fontSize: 12, verticalAlign: 'middle' }} />
          </MuiLink>
        ) : <Typography sx={{ fontWeight: 600, color: INK, fontSize: '0.9rem' }}>{publication.title}</Typography>}
        <Typography variant="caption" sx={{ color: MUTED, display: 'block' }} noWrap>
          {[publication.authors?.length ? `${publication.authors.slice(0, 3).join(', ')}${publication.authors.length > 3 ? ' et al.' : ''}` : null, publication.journal, publication.year].filter(Boolean).join(' · ')}
        </Typography>
        {meta}
      </Box>
      {action}
    </Stack>
  );
}

/* ------------------------------------------------------------------ share dialog */
export function ShareLibraryDialog({ open, onClose, folder, members = [], onChanged }) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setQuery(''); setOptions([]); setSelected([]); setError(''); }
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) { setOptions([]); return undefined; }
    const handle = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await fetch(`/api/publications/library/shared?searchUsers=${encodeURIComponent(query.trim())}`, { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        const existing = new Set(members.map((m) => m.userId));
        setOptions((json.users || []).filter((u) => !existing.has(u.id)));
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query, open, members]);

  const share = async () => {
    if (!selected.length) return;
    setBusy(true);
    setError('');
    try {
      await post({ action: 'share', folderId: folder.id, userIds: selected.map((u) => u.id) });
      setSelected([]);
      await onChanged?.(`Shared "${folder.name}" with ${selected.length} ${selected.length === 1 ? 'person' : 'people'}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (member) => {
    setRemoving(member.userId);
    setError('');
    try {
      await post({ action: 'unshare', folderId: folder.id, userId: member.userId });
      await onChanged?.(`${member.name} no longer has access to "${folder.name}"`);
    } catch (err) {
      setError(err.message);
    } finally {
      setRemoving(null);
    }
  };

  if (!folder) return null;
  return (
    <InstitutionModal open={open} onClose={onClose} disableClose={busy} maxWidth="sm">
      <InstitutionModalHeader icon={ShareIcon} title={`Share "${folder.name}"`} subtitle="Shared libraries include all subfolders" onClose={onClose} disableClose={busy} />
      <InstitutionModalBody>
        {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}
        <InstitutionModalSection title="Add people">
          <Autocomplete
            multiple
            options={options}
            value={selected}
            loading={searching}
            filterOptions={(x) => x}
            getOptionLabel={(o) => o.name || o.email}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            onChange={(_, v) => setSelected(v)}
            inputValue={query}
            onInputChange={(_, v, reason) => { if (reason !== 'reset') setQuery(v); }}
            noOptionsText={query.trim().length < 2 ? 'Type at least 2 characters' : 'No matching researchers'}
            renderOption={(props, o) => {
              const { key, ...rest } = props;
              return (
                <Box component="li" key={key} {...rest} sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
                  <Avatar src={o.avatarUrl || undefined} sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: alpha(PURPLE, 0.15), color: PURPLE_DARK }}>{initials(o.name)}</Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{o.name}</Typography>
                    <Typography variant="caption" sx={{ color: MUTED }}>{[o.email, o.primaryInstitution].filter(Boolean).join(' · ')}</Typography>
                  </Box>
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder={selected.length ? '' : 'Search by name or email'}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (<><InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment>{params.InputProps.startAdornment}</>),
                  endAdornment: (<>{searching ? <CircularProgress size={16} /> : null}{params.InputProps.endAdornment}</>),
                }}
              />
            )}
          />
          <Typography variant="caption" sx={{ color: MUTED, display: 'block', mt: 1 }}>
            People you share with can open this library and add their own publications. They can remove only what they added. Only you can rename, move or delete folders.
          </Typography>
        </InstitutionModalSection>

        <InstitutionModalSection title={`People with access (${members.length})`}>
          {members.length ? (
            <Stack spacing={1}>
              {members.map((m) => (
                <Stack key={m.userId} direction="row" spacing={1.25} alignItems="center" sx={{ p: 1, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                  <Avatar src={m.avatarUrl || undefined} sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: alpha(PURPLE, 0.15), color: PURPLE_DARK }}>{initials(m.name)}</Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{m.name}</Typography>
                    <Typography variant="caption" sx={{ color: MUTED }} noWrap>{[m.email, m.sharedAt ? `since ${fmtDate(m.sharedAt)}` : null].filter(Boolean).join(' · ')}</Typography>
                  </Box>
                  <Chip size="small" label="Can add" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(PURPLE, 0.1), color: PURPLE_DARK }} />
                  <Tooltip title="Remove access">
                    <span>
                      <IconButton size="small" onClick={() => remove(m)} disabled={removing === m.userId} sx={{ color: '#dc2626' }}>
                        {removing === m.userId ? <CircularProgress size={16} /> : <PersonRemoveIcon fontSize="small" />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              ))}
            </Stack>
          ) : <Typography variant="body2" sx={{ color: MUTED }}>Not shared with anyone yet.</Typography>}
        </InstitutionModalSection>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={busy} color="inherit" sx={{ textTransform: 'none' }}>Done</Button>
        <Button
          variant="contained"
          startIcon={busy ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <ShareIcon />}
          onClick={share}
          disabled={busy || !selected.length}
          sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, boxShadow: 'none', '&:hover': { bgcolor: PURPLE_DARK, boxShadow: 'none' } }}
        >
          {selected.length ? `Share with ${selected.length}` : 'Share'}
        </Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

/* ------------------------------------------------------------------ sidebar list */
export function SharedWithMeList({ libraries = [], activeId, onSelect, loading }) {
  return (
    <Box>
      <Box sx={{ px: 2, py: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.6 }}>SHARED WITH ME</Typography>
      </Box>
      {loading && !libraries.length ? (
        <Box sx={{ px: 2, py: 1 }}><CircularProgress size={16} /></Box>
      ) : libraries.length ? libraries.map((lib) => {
        const selected = activeId === lib.folder.id;
        return (
          <Box
            key={lib.shareId}
            onClick={() => onSelect(lib.folder.id)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, cursor: 'pointer',
              bgcolor: selected ? alpha(PURPLE, 0.1) : 'transparent',
              borderLeft: selected ? `3px solid ${PURPLE}` : '3px solid transparent',
              '&:hover': { bgcolor: alpha(PURPLE, 0.06) },
            }}
          >
            <SharedFolderIcon sx={{ fontSize: 18, color: PURPLE }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: selected ? 600 : 500 }} noWrap>{lib.folder.name}</Typography>
              <Typography variant="caption" sx={{ color: MUTED }} noWrap>by {lib.owner?.name || 'Unknown'}</Typography>
            </Box>
            <Chip label={lib.items.length} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(PURPLE, 0.1), color: PURPLE }} />
          </Box>
        );
      }) : (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, py: 1 }}>
          Libraries others share with you appear here.
        </Typography>
      )}
    </Box>
  );
}

/* ------------------------------------------------------------------ add publications dialog */
function AddPublicationsDialog({ open, onClose, myPublications = [], existingIds = new Set(), folderOptions = [], defaultFolderId, onAdd }) {
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState([]);
  const [folderId, setFolderId] = useState(defaultFolderId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (open) { setSearch(''); setPicked([]); setFolderId(defaultFolderId); setError(''); } }, [open, defaultFolderId]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return myPublications.filter((p) => !q || [p.title, p.journal, ...(p.authors || [])].some((v) => String(v || '').toLowerCase().includes(q))).slice(0, 200);
  }, [myPublications, search]);

  const toggle = (id) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const add = async () => {
    setBusy(true);
    setError('');
    try {
      await onAdd(folderId, picked);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <InstitutionModal open={open} onClose={onClose} disableClose={busy} maxWidth="md">
      <InstitutionModalHeader icon={AddIcon} title="Add your publications" subtitle="Only publications you are an author of can be added" onClose={onClose} disableClose={busy} />
      <InstitutionModalBody>
        {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert> : null}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search your publications"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
            sx={{ flex: 1 }}
          />
          {folderOptions.length > 1 ? (
            <TextField select size="small" label="Add to" value={folderId} onChange={(e) => setFolderId(e.target.value)} SelectProps={{ native: true }} sx={{ minWidth: 220 }}>
              {folderOptions.map((f) => <option key={f.id} value={f.id}>{`${'— '.repeat(f.depth || 0)}${f.name}`}</option>)}
            </TextField>
          ) : null}
        </Stack>
        <Stack spacing={0.75} sx={{ maxHeight: 420, overflowY: 'auto' }}>
          {list.length ? list.map((p) => {
            const already = existingIds.has(`${folderId}:${p.id}`);
            return (
              <Stack
                key={p.id}
                direction="row"
                spacing={1}
                alignItems="center"
                onClick={() => !already && toggle(p.id)}
                sx={{ p: 1, borderRadius: 1.5, border: '1px solid #e2e8f0', cursor: already ? 'default' : 'pointer', opacity: already ? 0.55 : 1, bgcolor: picked.includes(p.id) ? alpha(PURPLE, 0.05) : 'white' }}
              >
                <Checkbox size="small" checked={already || picked.includes(p.id)} disabled={already} sx={{ p: 0.5, '&.Mui-checked': { color: PURPLE } }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{p.title}</Typography>
                  <Typography variant="caption" sx={{ color: MUTED }} noWrap>{[p.journal, p.year].filter(Boolean).join(' · ')}{already ? ' · already in this folder' : ''}</Typography>
                </Box>
              </Stack>
            );
          }) : <Typography variant="body2" sx={{ color: MUTED, py: 3, textAlign: 'center' }}>{myPublications.length ? 'No publications match.' : 'You have no publications yet.'}</Typography>}
        </Stack>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={busy} color="inherit" sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={add}
          disabled={busy || !picked.length}
          startIcon={busy ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <AddIcon />}
          sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, boxShadow: 'none', '&:hover': { bgcolor: PURPLE_DARK, boxShadow: 'none' } }}
        >
          {picked.length ? `Add ${picked.length}` : 'Add'}
        </Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

/* ------------------------------------------------------------------ shared library (member) */
export function SharedLibraryPanel({ library, myPublications = [], onChanged, onLeft, notify }) {
  const [subfolder, setSubfolder] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { setSubfolder('all'); setSearch(''); }, [library?.folder?.id]);
  if (!library) return null;

  const folderOptions = [{ id: library.folder.id, name: library.folder.name, depth: 0 }, ...library.subfolders];
  const nameOf = new Map(folderOptions.map((f) => [f.id, f.name]));
  const existingIds = new Set(library.items.map((i) => `${i.folderId}:${i.publication.id}`));
  const q = search.trim().toLowerCase();
  const items = library.items
    .filter((i) => subfolder === 'all' || i.folderId === subfolder)
    .filter((i) => !q || [i.publication.title, i.publication.journal, i.addedBy.name, ...(i.publication.authors || [])].some((v) => String(v || '').toLowerCase().includes(q)));

  const remove = async (item) => {
    setBusyId(`${item.folderId}:${item.publication.id}`);
    try {
      await post({ action: 'removePublication', folderId: item.folderId, publicationId: item.publication.id });
      await onChanged?.('Removed from the shared library');
    } catch (err) {
      notify?.(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const add = async (folderId, publicationIds) => {
    const res = await post({ action: 'addPublications', folderId, publicationIds });
    await onChanged?.(`Added ${res.added} publication${res.added === 1 ? '' : 's'} to "${nameOf.get(folderId)}"${res.skipped ? ` (${res.skipped} already there)` : ''}`);
  };

  const leave = async () => {
    setLeaving(true);
    try {
      await post({ action: 'leave', folderId: library.folder.id });
      setConfirmLeave(false);
      await onLeft?.(`You left "${library.folder.name}"`);
    } catch (err) {
      notify?.(err.message, 'error');
    } finally {
      setLeaving(false);
    }
  };

  return (
    <Paper sx={{ flex: 1, minWidth: 0, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <Box sx={{ p: 2.5, borderBottom: '1px solid #eef0f4', background: `linear-gradient(135deg, ${alpha(PURPLE, 0.06)} 0%, #ffffff 70%)` }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <SharedFolderIcon sx={{ color: PURPLE, fontSize: 28 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, color: INK, fontSize: '1.1rem' }} noWrap>{library.folder.name}</Typography>
              <Typography variant="body2" sx={{ color: MUTED }}>
                Shared by <strong>{library.owner?.name || 'Unknown'}</strong>{library.sharedAt ? ` · ${fmtDate(library.sharedAt)}` : ''} · {library.items.length} publication{library.items.length === 1 ? '' : 's'}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title={[library.owner?.name ? `${library.owner.name} (owner)` : null, ...library.members.map((m) => (m.isMe ? `${m.name} (you)` : m.name))].filter(Boolean).join(', ')}>
              <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.7rem', bgcolor: alpha(PURPLE, 0.2), color: PURPLE_DARK } }}>
                {library.owner ? <Avatar src={library.owner.avatarUrl || undefined}>{initials(library.owner.name)}</Avatar> : null}
                {library.members.map((m) => <Avatar key={m.id} src={m.avatarUrl || undefined}>{initials(m.name)}</Avatar>)}
              </AvatarGroup>
            </Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, boxShadow: 'none', '&:hover': { bgcolor: PURPLE_DARK, boxShadow: 'none' } }}>
              Add publications
            </Button>
            <Tooltip title="Leave this library">
              <IconButton onClick={() => setConfirmLeave(true)} sx={{ color: MUTED }}><LeaveIcon /></IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mt: 2 }} alignItems={{ md: 'center' }}>
          {library.subfolders.length ? (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1 }}>
              {[{ id: 'all', name: 'All' }, { id: library.folder.id, name: library.folder.name }, ...library.subfolders].map((f) => (
                <Chip
                  key={f.id}
                  label={`${f.name}${f.id === 'all' ? '' : ` (${library.items.filter((i) => i.folderId === f.id).length})`}`}
                  onClick={() => setSubfolder(f.id)}
                  size="small"
                  sx={{ fontWeight: 600, bgcolor: subfolder === f.id ? PURPLE : alpha(PURPLE, 0.08), color: subfolder === f.id ? 'white' : PURPLE_DARK }}
                />
              ))}
            </Stack>
          ) : <Box sx={{ flex: 1 }} />}
          <TextField
            size="small"
            placeholder="Search this library"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
            sx={{ width: { xs: '100%', md: 260 }, bgcolor: 'white' }}
          />
        </Stack>
      </Box>

      <Box sx={{ p: 2.5 }}>
        <Alert severity="info" icon={false} sx={{ mb: 2, borderRadius: 1.5, py: 0.5 }}>
          You can add your own publications and remove ones you added. Items added by others can only be removed by them or the owner.
        </Alert>
        {items.length ? (
          <Stack spacing={1}>
            {items.map((item) => {
              const key = `${item.folderId}:${item.publication.id}`;
              return (
                <PublicationLine
                  key={key}
                  publication={item.publication}
                  meta={(
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                      <Typography variant="caption" sx={{ color: MUTED }}>
                        Added by <Box component="span" sx={{ fontWeight: 700, color: item.addedBy.isMe ? PURPLE_DARK : INK }}>{item.addedBy.isMe ? 'you' : item.addedBy.name}</Box>
                        {item.addedBy.isOwner && !item.addedBy.isMe ? ' (owner)' : ''} · {fmtDate(item.addedAt)}
                      </Typography>
                      {library.subfolders.length && subfolder === 'all' ? <Chip size="small" label={nameOf.get(item.folderId)} sx={{ height: 18, fontSize: '0.62rem' }} /> : null}
                    </Stack>
                  )}
                  action={item.canRemove ? (
                    <Tooltip title="Remove (you added this)">
                      <span>
                        <IconButton size="small" onClick={() => remove(item)} disabled={busyId === key} sx={{ color: '#dc2626' }}>
                          {busyId === key ? <CircularProgress size={16} /> : <RemoveIcon fontSize="small" />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : null}
                />
              );
            })}
          </Stack>
        ) : (
          <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: 2 }}>
            <Typography sx={{ color: MUTED }}>{library.items.length ? 'No publications match.' : 'This library is empty. Add your publications to start building it together.'}</Typography>
          </Box>
        )}
      </Box>

      <AddPublicationsDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        myPublications={myPublications}
        existingIds={existingIds}
        folderOptions={folderOptions}
        defaultFolderId={subfolder !== 'all' ? subfolder : library.folder.id}
        onAdd={add}
      />

      <InstitutionModal open={confirmLeave} onClose={() => setConfirmLeave(false)} disableClose={leaving} maxWidth="xs">
        <InstitutionModalHeader icon={LeaveIcon} title="Leave this library?" subtitle={library.folder.name} tone="danger" onClose={() => setConfirmLeave(false)} disableClose={leaving} />
        <InstitutionModalBody>
          <Typography variant="body2">
            You will lose access to &quot;{library.folder.name}&quot;. Publications you added stay in the library. {library.owner?.name || 'The owner'} can share it with you again.
          </Typography>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setConfirmLeave(false)} disabled={leaving} color="inherit" sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={leave} disabled={leaving} sx={{ textTransform: 'none', fontWeight: 700 }}>{leaving ? 'Leaving…' : 'Leave library'}</Button>
        </InstitutionModalFooter>
      </InstitutionModal>
    </Paper>
  );
}

/* ------------------------------------------------------------------ owner: member contributions */
export function FolderContributionsPanel({ items = [], folderNames = {}, onChanged, notify }) {
  const [busyId, setBusyId] = useState(null);
  const [expanded, setExpanded] = useState(true);
  if (!items.length) return null;

  const remove = async (item) => {
    const key = `${item.folderId}:${item.publication.id}`;
    setBusyId(key);
    try {
      await post({ action: 'removePublication', folderId: item.folderId, publicationId: item.publication.id });
      await onChanged?.('Removed from your library');
    } catch (err) {
      notify?.(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box sx={{ mb: 2.5, p: 2, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.25)}`, bgcolor: alpha(PURPLE, 0.03) }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: expanded ? 1.5 : 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <SharedFolderIcon sx={{ color: PURPLE, fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: INK }}>Added by collaborators ({items.length})</Typography>
        </Stack>
        <Button size="small" onClick={() => setExpanded((v) => !v)} sx={{ textTransform: 'none', color: PURPLE_DARK, fontWeight: 600 }}>{expanded ? 'Hide' : 'Show'}</Button>
      </Stack>
      {expanded ? (
        <Stack spacing={1}>
          {items.map((item) => {
            const key = `${item.folderId}:${item.publication.id}`;
            return (
              <PublicationLine
                key={key}
                publication={item.publication}
                meta={(
                  <Typography variant="caption" sx={{ color: MUTED, display: 'block', mt: 0.5 }}>
                    Added by <Box component="span" sx={{ fontWeight: 700, color: INK }}>{item.addedBy.name}</Box> · {fmtDate(item.addedAt)}
                    {folderNames[item.folderId] ? ` · ${folderNames[item.folderId]}` : ''}
                  </Typography>
                )}
                action={(
                  <Tooltip title="Remove from your library (you are the owner)">
                    <span>
                      <IconButton size="small" onClick={() => remove(item)} disabled={busyId === key} sx={{ color: '#dc2626' }}>
                        {busyId === key ? <CircularProgress size={16} /> : <RemoveIcon fontSize="small" />}
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              />
            );
          })}
        </Stack>
      ) : null}
    </Box>
  );
}
