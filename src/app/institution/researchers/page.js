'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Container,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Apps as GridIcon,
  ChevronRight as OpenIcon,
  Email as EmailIcon,
  Groups as ResearchersIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ViewList as ListIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#6d5499';
const COLLAB = '#0284c7';
const INK = '#0f172a';
const MUTED = '#64748b';
const LINE = '#e2e8f0';
const SURFACE = '#f6f7fb';

const SORTS = [
  { key: 'name', label: 'Name (A–Z)' },
  { key: 'output', label: 'Most output' },
  { key: 'collaborative', label: 'Most collaborative' },
  { key: 'citations', label: 'Most cited' },
  { key: 'hIndex', label: 'Highest h-index' },
  { key: 'recent', label: 'Recently joined' },
];

const initials = (r) => `${r.givenName?.[0] || ''}${r.familyName?.[0] || ''}`.toUpperCase() || (r.email?.[0] || '?').toUpperCase();

function OutputStat({ label, total, lead, collab, leadLabel, collabLabel }) {
  return (
    <Tooltip title={`${lead} ${leadLabel} · ${collab} ${collabLabel}`} arrow>
      <Box sx={{ flex: 1, minWidth: 0, textAlign: 'center', py: 0.75 }}>
        <Typography sx={{ fontWeight: 800, color: total ? INK : '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.2 }}>{total}</Typography>
        <Typography variant="caption" sx={{ color: MUTED, fontWeight: 600, display: 'block', lineHeight: 1.2 }}>{label}</Typography>
        {collab ? <Typography variant="caption" sx={{ color: COLLAB, fontSize: '0.66rem', fontWeight: 600 }}>{collab} {collabLabel}</Typography> : <Typography variant="caption" sx={{ fontSize: '0.66rem', visibility: 'hidden' }}>.</Typography>}
      </Box>
    </Tooltip>
  );
}

function OrcidChip({ orcidId }) {
  if (!orcidId) return null;
  return (
    <Chip
      component="a"
      href={`https://orcid.org/${orcidId}`}
      target="_blank"
      rel="noopener noreferrer"
      clickable
      onClick={(e) => e.stopPropagation()}
      size="small"
      label={`iD ${orcidId}`}
      sx={{ height: 20, fontSize: '0.66rem', fontWeight: 600, bgcolor: 'rgba(166,206,57,0.16)', color: '#4d6b0f', border: '1px solid rgba(166,206,57,0.35)' }}
    />
  );
}

function ResearcherCard({ r, onOpen }) {
  const o = r.output;
  return (
    <Card
      onClick={onOpen}
      sx={{
        cursor: 'pointer',
        borderRadius: 2.5,
        border: `1px solid ${LINE}`,
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 120ms, box-shadow 120ms, transform 120ms',
        '&:hover': { borderColor: alpha(PURPLE, 0.6), boxShadow: `0 6px 20px ${alpha(PURPLE, 0.12)}`, transform: 'translateY(-2px)' },
      }}
    >
      <Box sx={{ height: 44, background: `linear-gradient(120deg, ${PURPLE_DARK} 0%, ${PURPLE} 60%, #b9a3db 100%)` }} />
      <Box sx={{ px: 2.25, pb: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ mt: -3 }}>
          <Avatar src={r.avatarUrl || undefined} sx={{ width: 60, height: 60, border: '3px solid white', bgcolor: alpha(PURPLE, 0.18), color: PURPLE_DARK, fontWeight: 800, boxShadow: '0 1px 4px rgba(15,23,42,0.12)' }}>
            {initials(r)}
          </Avatar>
          {r.email ? (
            <Tooltip title={`Email ${r.fullName}`}>
              <IconButton size="small" component="a" href={`mailto:${r.email}`} onClick={(e) => e.stopPropagation()} sx={{ color: MUTED, mb: 0.25 }}>
                <EmailIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
        <Typography sx={{ fontWeight: 800, color: INK, fontSize: '1rem', mt: 1, lineHeight: 1.3 }} noWrap title={r.displayName}>{r.displayName}</Typography>
        <Typography variant="body2" sx={{ color: MUTED, fontSize: '0.82rem' }} noWrap>{r.department || r.primaryInstitution}</Typography>
        <Box sx={{ mt: 0.75, minHeight: 22 }}><OrcidChip orcidId={r.orcidId} /></Box>

        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1.25, minHeight: 48, alignContent: 'flex-start' }}>
          {r.expertise.slice(0, 3).map((k) => (
            <Chip key={k} label={k} size="small" sx={{ height: 22, fontSize: '0.7rem', bgcolor: alpha(PURPLE, 0.08), color: PURPLE_DARK, fontWeight: 600 }} />
          ))}
          {r.expertise.length > 3 ? <Chip label={`+${r.expertise.length - 3}`} size="small" sx={{ height: 22, fontSize: '0.7rem' }} /> : null}
          {!r.expertise.length ? <Typography variant="caption" sx={{ color: '#cbd5e1' }}>No expertise listed</Typography> : null}
        </Stack>

        <Box sx={{ mt: 'auto', pt: 1.5 }}>
          <Stack direction="row" sx={{ borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
            <OutputStat label="Publications" total={o.publications.total} lead={o.publications.lead} collab={o.publications.coauthor} leadLabel="lead" collabLabel="co-author" />
            <OutputStat label="Manuscripts" total={o.manuscripts.total} lead={o.manuscripts.lead} collab={o.manuscripts.collaborator} leadLabel="lead" collabLabel="collab." />
            <OutputStat label="Proposals" total={o.proposals.total} lead={o.proposals.pi} collab={o.proposals.coInvestigator} leadLabel="PI" collabLabel="co-I" />
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.25 }}>
            <Typography variant="caption" sx={{ color: MUTED }}>
              h-index <Box component="span" sx={{ fontWeight: 800, color: INK }}>{r.hIndex || '—'}</Box>
              {'  ·  '}
              Citations <Box component="span" sx={{ fontWeight: 800, color: INK }}>{r.citations ? r.citations.toLocaleString() : '—'}</Box>
            </Typography>
            <Typography variant="caption" sx={{ color: PURPLE_DARK, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
              View profile <OpenIcon sx={{ fontSize: 16 }} />
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Card>
  );
}

function ResearcherRow({ r, onOpen }) {
  const o = r.output;
  return (
    <Paper
      elevation={0}
      onClick={onOpen}
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 2,
        border: `1px solid ${LINE}`,
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr auto', md: 'minmax(240px, 2fr) minmax(160px, 1.4fr) repeat(3, 110px) 90px 24px' },
        gap: 2,
        alignItems: 'center',
        '&:hover': { borderColor: alpha(PURPLE, 0.6), bgcolor: alpha(PURPLE, 0.02) },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        <Avatar src={r.avatarUrl || undefined} sx={{ width: 40, height: 40, bgcolor: alpha(PURPLE, 0.14), color: PURPLE_DARK, fontWeight: 700, fontSize: '0.85rem' }}>{initials(r)}</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, color: INK, fontSize: '0.9rem' }} noWrap>{r.displayName}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ color: MUTED }} noWrap>{r.department || r.primaryInstitution}</Typography>
            <OrcidChip orcidId={r.orcidId} />
          </Stack>
        </Box>
      </Stack>
      <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' }, minWidth: 0, overflow: 'hidden' }}>
        {r.expertise.slice(0, 2).map((k) => <Chip key={k} label={k} size="small" sx={{ height: 22, fontSize: '0.7rem', bgcolor: alpha(PURPLE, 0.08), color: PURPLE_DARK, maxWidth: 140 }} />)}
      </Stack>
      {[
        ['Pubs', o.publications.total, o.publications.coauthor, 'co-author'],
        ['Manuscripts', o.manuscripts.total, o.manuscripts.collaborator, 'collab.'],
        ['Proposals', o.proposals.total, o.proposals.coInvestigator, 'co-I'],
      ].map(([label, total, collab, collabLabel]) => (
        <Box key={label} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Typography sx={{ fontWeight: 800, color: total ? INK : '#cbd5e1', lineHeight: 1.2 }}>{total}</Typography>
          <Typography variant="caption" sx={{ color: collab ? COLLAB : MUTED }}>{collab ? `${collab} ${collabLabel}` : label}</Typography>
        </Box>
      ))}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Typography sx={{ fontWeight: 800, color: INK, lineHeight: 1.2 }}>{r.hIndex || '—'}</Typography>
        <Typography variant="caption" sx={{ color: MUTED }}>h-index</Typography>
      </Box>
      <OpenIcon sx={{ color: '#cbd5e1' }} />
    </Paper>
  );
}

export default function ResearchersDirectory() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [expertise, setExpertise] = useState([]);
  const [orcidOnly, setOrcidOnly] = useState(false);
  const [sort, setSort] = useState('name');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/institution/researchers', { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load researchers');
      setData(json);
    } catch (err) {
      setError(err.message || 'Failed to load researchers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    try {
      const saved = window.localStorage.getItem('hospitium.researcherDirectory.view');
      if (saved === 'grid' || saved === 'list') setView(saved);
    } catch { /* storage unavailable */ }
  }, []);

  const changeView = (v) => {
    if (!v) return;
    setView(v);
    try { window.localStorage.setItem('hospitium.researcherDirectory.view', v); } catch { /* storage unavailable */ }
  };

  const researchers = data?.researchers || [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = researchers.filter((r) => {
      if (department !== 'all' && r.department !== department) return false;
      if (orcidOnly && !r.orcidId) return false;
      if (expertise.length && !expertise.every((k) => r.expertise.some((e) => e.toLowerCase() === k.toLowerCase()))) return false;
      if (!q) return true;
      return [r.fullName, r.displayName, r.email, r.department, r.orcidId, r.researchInterests, ...r.expertise]
        .some((v) => String(v || '').toLowerCase().includes(q));
    });
    const by = {
      name: (a, b) => String(a.familyName || a.fullName).localeCompare(String(b.familyName || b.fullName)) || String(a.givenName || '').localeCompare(String(b.givenName || '')),
      output: (a, b) => b.output.totals.all - a.output.totals.all,
      collaborative: (a, b) => b.output.totals.collaborative - a.output.totals.collaborative,
      citations: (a, b) => (b.citations || 0) - (a.citations || 0),
      hIndex: (a, b) => (b.hIndex || 0) - (a.hIndex || 0),
      recent: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    }[sort];
    return [...list].sort((a, b) => by(a, b) || String(a.fullName).localeCompare(String(b.fullName)));
  }, [researchers, search, department, expertise, orcidOnly, sort]);

  const activeFilters = (department !== 'all') + expertise.length + (orcidOnly ? 1 : 0) + (search ? 1 : 0);
  const open = (id) => router.push(`/institution/researcher/${id}`);
  const s = data?.summary;

  return (
    <Box sx={{ bgcolor: SURFACE, minHeight: '100vh', pb: 6 }}>
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Researcher Directory"
          description={data?.institution?.name ? `Researchers at ${data.institution.name} and their research output` : 'Researchers at your institution and their research output'}
          icon={<ResearchersIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[{ label: 'Institution', path: '/institution' }, { label: 'Researchers' }]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          actionButton={(
            <Tooltip title="Refresh">
              <span>
                <IconButton onClick={load} disabled={loading} sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}><RefreshIcon /></IconButton>
              </span>
            </Tooltip>
          )}
        />
      </Box>

      <Container maxWidth="xl" sx={{ pt: 3 }}>
        {error ? <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>{error}</Alert> : null}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 1.5, mb: 3 }}>
          {[
            ['Researchers', s?.researchers],
            ['With ORCID iD', s ? `${s.withOrcid}` : null],
            ['Publications', s?.publications],
            ['Manuscripts', s?.manuscripts],
            ['Proposals', s?.proposals],
            ['Collaborative items', s?.collaborative],
          ].map(([label, value]) => (
            <Paper key={label} elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${LINE}`, bgcolor: 'white' }}>
              <Typography variant="caption" sx={{ color: MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.66rem' }}>{label}</Typography>
              {loading && !data ? <Skeleton width="50%" height={34} /> : <Typography sx={{ fontWeight: 800, color: INK, fontSize: '1.5rem', lineHeight: 1.3 }}>{value ?? '—'}</Typography>}
            </Paper>
          ))}
        </Box>

        <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2, border: `1px solid ${LINE}`, bgcolor: 'white', position: 'sticky', top: 72, zIndex: 4 }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ lg: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by name, department, ORCID iD or expertise"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
              sx={{ flex: 1.4, minWidth: 240 }}
            />
            <TextField select size="small" value={department} onChange={(e) => setDepartment(e.target.value)} sx={{ minWidth: 200 }}>
              <MenuItem value="all">All departments</MenuItem>
              {(data?.departments || []).map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
            <Autocomplete
              multiple
              size="small"
              options={(data?.expertise || []).map((e) => e.label)}
              value={expertise}
              onChange={(_, v) => setExpertise(v)}
              renderInput={(params) => <TextField {...params} placeholder={expertise.length ? '' : 'Expertise'} />}
              sx={{ flex: 1, minWidth: 220 }}
              limitTags={2}
            />
            <TextField select size="small" value={sort} onChange={(e) => setSort(e.target.value)} sx={{ minWidth: 170 }}>
              {SORTS.map((o) => <MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>)}
            </TextField>
            <Chip
              label="Has ORCID iD"
              onClick={() => setOrcidOnly((v) => !v)}
              sx={{ fontWeight: 600, bgcolor: orcidOnly ? PURPLE : alpha(PURPLE, 0.08), color: orcidOnly ? 'white' : PURPLE_DARK, '&:hover': { bgcolor: orcidOnly ? PURPLE_DARK : alpha(PURPLE, 0.15) } }}
            />
            <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => changeView(v)}>
              <ToggleButton value="grid" aria-label="Card view"><GridIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="list" aria-label="List view"><ListIcon fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Paper>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="body2" sx={{ color: MUTED }}>
            {loading && !data ? 'Loading researchers…' : `${filtered.length} of ${researchers.length} researchers`}
          </Typography>
          {activeFilters ? (
            <Button size="small" onClick={() => { setSearch(''); setDepartment('all'); setExpertise([]); setOrcidOnly(false); }} sx={{ textTransform: 'none', color: PURPLE_DARK, fontWeight: 600 }}>
              Clear filters
            </Button>
          ) : null}
        </Stack>

        {loading && !data ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} variant="rounded" height={320} sx={{ borderRadius: 2.5 }} />)}
          </Box>
        ) : filtered.length ? (
          view === 'grid' ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
              {filtered.map((r) => <ResearcherCard key={r.id} r={r} onOpen={() => open(r.id)} />)}
            </Box>
          ) : (
            <Stack spacing={1}>
              {filtered.map((r) => <ResearcherRow key={r.id} r={r} onOpen={() => open(r.id)} />)}
            </Stack>
          )
        ) : (
          <Paper elevation={0} sx={{ py: 8, textAlign: 'center', borderRadius: 2, border: `1px dashed ${LINE}` }}>
            <ResearchersIcon sx={{ fontSize: 44, color: '#cbd5e1' }} />
            <Typography sx={{ color: MUTED, mt: 1 }}>
              {researchers.length ? 'No researchers match these filters.' : 'No researchers have registered with your institution yet.'}
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
