'use client';

/**
 * Institution dashboard: researchers by research output.
 * Counts lead work and collaborative work (co-authored publications, manuscript
 * collaborations, proposal co-investigation). Rows open the researcher's profile.
 * Data: analyticsData.topResearchers from /api/institution/analytics.
 */

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  ChevronRight as OpenIcon,
  Groups as DirectoryIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#6d5499';
const COLLAB = '#38bdf8';
const INK = '#0f172a';
const MUTED = '#64748b';
const LINE = '#e2e8f0';

const ROLE_KEYS = {
  publications: { lead: 'lead', collab: 'coauthor', leadLabel: 'lead', collabLabel: 'co-author' },
  manuscripts: { lead: 'lead', collab: 'collaborator', leadLabel: 'lead', collabLabel: 'collaborator' },
  proposals: { lead: 'pi', collab: 'coInvestigator', leadLabel: 'PI', collabLabel: 'co-I' },
};

const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

function valueFor(r, column, role) {
  const out = r.output;
  if (!out) {
    // legacy shape fallback
    const legacy = { total: r.totalOutput, publications: r.publicationCount, manuscripts: r.manuscriptCount, proposals: r.proposalCount };
    return role === 'all' ? legacy[column] || 0 : 0;
  }
  if (column === 'total') return role === 'lead' ? out.totals.lead : role === 'collab' ? out.totals.collaborative : out.totals.all;
  const block = out[column];
  const keys = ROLE_KEYS[column];
  return role === 'lead' ? block[keys.lead] : role === 'collab' ? block[keys.collab] : block.total;
}

function SplitBar({ lead, collab, max }) {
  const total = lead + collab;
  const width = max ? Math.max(total ? 6 : 0, (total / max) * 100) : 0;
  return (
    <Box sx={{ width: '100%', maxWidth: 140, height: 6, borderRadius: 3, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
      <Box sx={{ width: `${width}%`, height: '100%', display: 'flex' }}>
        <Box sx={{ flex: lead || 0, bgcolor: PURPLE }} />
        <Box sx={{ flex: collab || 0, bgcolor: COLLAB }} />
      </Box>
    </Box>
  );
}

function OutputCell({ r, column, role }) {
  const out = r.output;
  const value = valueFor(r, column, role);
  if (!out || role !== 'all') {
    return <Typography sx={{ fontWeight: 700, color: value ? INK : '#cbd5e1' }}>{value}</Typography>;
  }
  const keys = ROLE_KEYS[column];
  const block = out[column];
  const lead = block[keys.lead];
  const collab = block[keys.collab];
  return (
    <Tooltip title={`${lead} ${keys.leadLabel} · ${collab} ${keys.collabLabel}`} arrow>
      <Box>
        <Typography sx={{ fontWeight: 700, color: value ? INK : '#cbd5e1', lineHeight: 1.2 }}>{value}</Typography>
        {value ? (
          <Typography variant="caption" sx={{ color: MUTED, whiteSpace: 'nowrap' }}>
            {lead} {keys.leadLabel}{collab ? <> · <Box component="span" sx={{ color: '#0284c7', fontWeight: 600 }}>{collab} {keys.collabLabel}</Box></> : null}
          </Typography>
        ) : null}
      </Box>
    </Tooltip>
  );
}

export default function InstitutionResearchersSection({ researchers = [], initialRows = 8 }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [department, setDepartment] = useState('all');
  const [sort, setSort] = useState({ by: 'total', dir: 'desc' });
  const [showAll, setShowAll] = useState(false);

  const departments = useMemo(() => [...new Set(researchers.map((r) => r.department).filter(Boolean))].sort(), [researchers]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = researchers.filter((r) => {
      if (department !== 'all' && r.department !== department) return false;
      if (!q) return true;
      return [r.name, r.displayName, r.department, r.email].some((v) => String(v || '').toLowerCase().includes(q));
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    return list.sort((a, b) => {
      if (sort.by === 'name') return dir * String(a.name || '').localeCompare(String(b.name || ''));
      return dir * (valueFor(a, sort.by, role) - valueFor(b, sort.by, role)) || String(a.name || '').localeCompare(String(b.name || ''));
    });
  }, [researchers, search, department, sort, role]);

  const maxTotal = Math.max(1, ...rows.map((r) => (r.output ? r.output.totals.all : r.totalOutput || 0)));
  const visible = showAll ? rows : rows.slice(0, initialRows);

  const summary = useMemo(() => {
    const active = researchers.filter((r) => (r.output ? r.output.totals.all : r.totalOutput) > 0).length;
    const lead = researchers.reduce((s, r) => s + (r.output?.totals.lead || 0), 0);
    const collab = researchers.reduce((s, r) => s + (r.output?.totals.collaborative || 0), 0);
    return { active, lead, collab, collabShare: lead + collab ? Math.round((collab / (lead + collab)) * 100) : 0 };
  }, [researchers]);

  const header = (key, label, align = 'left') => (
    <TableCell align={align} sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem', bgcolor: '#fafafa', whiteSpace: 'nowrap' }}>
      <TableSortLabel
        active={sort.by === key}
        direction={sort.by === key ? sort.dir : key === 'name' ? 'asc' : 'desc'}
        onClick={() => setSort((s) => ({ by: key, dir: s.by === key ? (s.dir === 'asc' ? 'desc' : 'asc') : key === 'name' ? 'asc' : 'desc' }))}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Card sx={{ borderRadius: 3, border: `1px solid ${LINE}`, boxShadow: '0 1px 2px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
      <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: `1px solid ${LINE}` }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
          <Box>
            <Typography sx={{ fontWeight: 700, color: INK, fontSize: '1.1rem' }}>Researchers</Typography>
            <Typography variant="body2" sx={{ color: MUTED }}>
              Output across publications, manuscripts and proposals, including co-authorship and co-investigation.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<DirectoryIcon />}
            onClick={() => router.push('/institution/researchers')}
            sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE_DARK, borderColor: alpha(PURPLE, 0.5), whiteSpace: 'nowrap' }}
          >
            Researcher directory
          </Button>
        </Stack>

        <Stack direction="row" spacing={3} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
          {[
            ['Researchers', researchers.length],
            ['With output', summary.active],
            ['Lead items', summary.lead],
            ['Collaborative items', summary.collab],
            ['Collaborative share', `${summary.collabShare}%`],
          ].map(([label, value]) => (
            <Box key={label}>
              <Typography sx={{ fontWeight: 800, color: INK, fontSize: '1.2rem', lineHeight: 1.2 }}>{value}</Typography>
              <Typography variant="caption" sx={{ color: MUTED, fontWeight: 600 }}>{label}</Typography>
            </Box>
          ))}
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} sx={{ mt: 2 }} alignItems={{ md: 'center' }}>
          <TextField
            size="small"
            placeholder="Search name or department"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
            sx={{ minWidth: { md: 260 } }}
          />
          <TextField select size="small" value={department} onChange={(e) => setDepartment(e.target.value)} sx={{ minWidth: 200 }}>
            <MenuItem value="all">All departments</MenuItem>
            {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </TextField>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={role}
            onChange={(_, v) => v && setRole(v)}
            sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, px: 1.5 }, '& .Mui-selected': { bgcolor: `${alpha(PURPLE, 0.14)} !important`, color: `${PURPLE_DARK} !important` } }}
          >
            <ToggleButton value="all">All roles</ToggleButton>
            <ToggleButton value="lead">Lead</ToggleButton>
            <ToggleButton value="collab">Collaborative</ToggleButton>
          </ToggleButtonGroup>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Stack direction="row" spacing={0.5} alignItems="center"><Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: PURPLE }} /><Typography variant="caption" sx={{ color: MUTED }}>Lead</Typography></Stack>
            <Stack direction="row" spacing={0.5} alignItems="center"><Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: COLLAB }} /><Typography variant="caption" sx={{ color: MUTED }}>Co-author / co-investigator</Typography></Stack>
          </Stack>
        </Stack>
      </Box>

      <TableContainer sx={{ maxHeight: showAll ? 640 : 'none' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {header('name', 'Researcher')}
              {header('total', role === 'lead' ? 'Lead output' : role === 'collab' ? 'Collaborative output' : 'Total output')}
              {header('publications', 'Publications')}
              {header('manuscripts', 'Manuscripts')}
              {header('proposals', 'Proposals')}
              <TableCell sx={{ bgcolor: '#fafafa', width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.length ? visible.map((r) => {
              const lead = r.output?.totals.lead || 0;
              const collab = r.output?.totals.collaborative || 0;
              return (
                <TableRow
                  key={r.id}
                  hover
                  onClick={() => r.id && router.push(`/institution/researcher/${r.id}`)}
                  sx={{ cursor: 'pointer', '& td': { py: 1.25, borderColor: LINE }, '&:hover .open-icon': { color: PURPLE, transform: 'translateX(2px)' } }}
                >
                  <TableCell sx={{ minWidth: 220 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar src={r.avatarUrl || undefined} sx={{ width: 36, height: 36, bgcolor: alpha(PURPLE, 0.14), color: PURPLE_DARK, fontSize: '0.8rem', fontWeight: 700 }}>
                        {initials(r.name)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, color: INK, fontSize: '0.88rem' }} noWrap>{r.displayName || r.name}</Typography>
                        <Typography variant="caption" sx={{ color: MUTED }} noWrap>{r.department || r.institution || '—'}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ minWidth: 160 }}>
                    <Typography sx={{ fontWeight: 800, color: PURPLE_DARK, fontSize: '1.05rem', lineHeight: 1.2 }}>{valueFor(r, 'total', role)}</Typography>
                    {role === 'all' && r.output ? <SplitBar lead={lead} collab={collab} max={maxTotal} /> : null}
                  </TableCell>
                  <TableCell><OutputCell r={r} column="publications" role={role} /></TableCell>
                  <TableCell><OutputCell r={r} column="manuscripts" role={role} /></TableCell>
                  <TableCell><OutputCell r={r} column="proposals" role={role} /></TableCell>
                  <TableCell align="right"><OpenIcon className="open-icon" sx={{ color: '#cbd5e1', transition: 'all 120ms' }} /></TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={6} sx={{ py: 5, textAlign: 'center', color: MUTED }}>
                  {researchers.length ? 'No researchers match these filters.' : 'No researchers registered for your institution yet.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {rows.length > initialRows ? (
        <Box sx={{ px: 3, py: 1.5, borderTop: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: MUTED }}>
            Showing {visible.length} of {rows.length}
          </Typography>
          <Button size="small" onClick={() => setShowAll((v) => !v)} sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE_DARK }}>
            {showAll ? 'Show fewer' : `Show all ${rows.length}`}
          </Button>
        </Box>
      ) : null}
      {role !== 'all' ? (
        <Box sx={{ px: 3, pb: 1.5 }}>
          <Chip size="small" label={role === 'lead' ? 'Counting only work the researcher leads (owner, first author, PI)' : 'Counting only co-authored, collaborative and co-investigator work'} sx={{ bgcolor: alpha(PURPLE, 0.08), color: PURPLE_DARK, fontWeight: 600 }} />
        </Box>
      ) : null}
    </Card>
  );
}
