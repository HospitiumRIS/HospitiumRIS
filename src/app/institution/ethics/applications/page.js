'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Gavel as EthicsIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { KpiCard, PURPLE, btn } from '@/components/Training/admin/analytics/AnalyticsParts';
import { ETHICS_TABS, filterEthicsRows } from '@/lib/institution-ethics';

const whiteBtn = { ...btn, bgcolor: 'white', color: PURPLE, '&:hover': { bgcolor: '#f5f5f5' } };
const STATUS_SX = {
  APPROVED: { bgcolor: '#dcfce7', color: '#166534' },
  CONDITIONAL_APPROVAL: { bgcolor: '#dcfce7', color: '#166534' },
  SUBMITTED: { bgcolor: '#e0e7ff', color: '#3730a3' },
  UNDER_REVIEW: { bgcolor: '#ede9fe', color: '#6d28d9' },
  REVISION_REQUESTED: { bgcolor: '#fef3c7', color: '#92400e' },
  DRAFT: { bgcolor: '#f1f5f9', color: '#475569' },
  REJECTED: { bgcolor: '#fee2e2', color: '#b91c1c' },
  EXPIRED: { bgcolor: '#fee2e2', color: '#b91c1c' },
  WITHDRAWN: { bgcolor: '#f1f5f9', color: '#64748b' },
};
const fmt = (v) => (v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/**
 * Ethics applications register for the research office (#21): every application of the
 * institution's members, with status tabs, expiring approvals, search, department filter
 * and Excel/CSV export. Opening a row goes to the ethics review page.
 */
export default function EthicsApplicationsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/institution/ethics/applications', { credentials: 'include', cache: 'no-store' });
      if (res.status === 401) { router.replace('/login'); return; }
      const json = await res.json().catch(() => ({}));
      if (res.status === 403) throw new Error('You do not have access to the institution ethics register.');
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load ethics applications');
      setData(json);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => data?.applications || [], [data]);
  const departments = useMemo(() => [...new Set(rows.map((r) => r.department).filter(Boolean))].sort(), [rows]);
  const filtered = useMemo(() => filterEthicsRows(rows, { tab, search, department }), [rows, tab, search, department]);
  useEffect(() => { setPage(0); }, [tab, search, department]);
  const s = data?.summary;

  const exportList = (format) => {
    const p = new URLSearchParams({ format, tab, search, department });
    window.location.assign(`/api/institution/ethics/applications?${p.toString()}`);
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title="Ethics applications"
        description="Every ethics application and approval held by your institution's researchers."
        icon={<EthicsIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
          { label: 'Ethics review', path: '/institution/ethics/review' },
        ]}
        actionButton={(
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => exportList('xlsx')} disabled={!rows.length} sx={whiteBtn}>Excel</Button>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={load} sx={whiteBtn}>Refresh</Button>
          </Stack>
        )}
      />
      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        <Stack spacing={2}>
          {error ? <Alert severity="error" action={<Button size="small" onClick={load}>Retry</Button>}>{error}</Alert> : null}
          {loading && !data ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box> : null}

          {s ? (
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' } }}>
              <KpiCard label="All applications" value={s.total} hint={s.external ? `${s.external} external certificate(s)` : 'Held by your researchers'} onClick={() => setTab('all')} />
              <KpiCard label="To review" value={s.toReview} hint="Submitted or under review" onClick={() => setTab('to_review')} />
              <KpiCard label="Approved" value={s.approved} hint="Valid approvals" onClick={() => setTab('approved')} />
              <KpiCard label="Expiring in 60 days" value={s.expiring} hint={s.expired ? `${s.expired} already expired` : 'Renew before they lapse'} onClick={() => setTab('expiring')} />
              <KpiCard label="With researcher" value={s.withResearcher} hint="Drafts and revisions" onClick={() => setTab('with_researcher')} />
            </Box>
          ) : null}

          {data ? (
            <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ px: 1, borderBottom: '1px solid', borderColor: 'divider', '& .MuiTab-root': { ...btn, minHeight: 50 }, '& .Mui-selected': { color: `${PURPLE} !important` }, '& .MuiTabs-indicator': { bgcolor: PURPLE, height: 3 } }}>
                {ETHICS_TABS.map((t) => <Tab key={t.key} value={t.key} label={`${t.label} (${data.counts?.[t.key] ?? 0})`} />)}
              </Tabs>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ p: 2 }}>
                <TextField size="small" placeholder="Search title, reference, investigator, committee" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
                <TextField select size="small" label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} sx={{ minWidth: 200 }}>
                  <MenuItem value="all">All departments</MenuItem>
                  {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
                <Button size="small" startIcon={<DownloadIcon />} onClick={() => exportList('csv')} disabled={!filtered.length} sx={{ ...btn, color: PURPLE }}>CSV</Button>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                      {['Application', 'Principal investigator', 'Submitted', 'Approval', 'Status'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, py: 1.25 }}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((r) => (
                      <TableRow key={r.id} hover onClick={() => router.push(`/institution/ethics/review/${r.id}`)} sx={{ cursor: 'pointer' }}>
                        <TableCell sx={{ maxWidth: 440 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{r.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{[r.referenceNumber, r.department, r.committeeName].filter(Boolean).join(' · ') || '—'}</Typography>
                          {r.external ? <Chip size="small" label="External certificate" sx={{ ml: 1, height: 20, fontWeight: 700, bgcolor: alpha(PURPLE, 0.1), color: PURPLE }} /> : null}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{r.principalInvestigator}</Typography>
                          {r.linkedProposals ? <Typography variant="caption" color="text.secondary">{r.linkedProposals} linked proposal(s)</Typography> : null}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmt(r.submittedDate || r.createdAt)}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="body2">{r.approvalDate ? fmt(r.approvalDate) : '—'}</Typography>
                          {r.expiryDate ? (
                            <Typography variant="caption" sx={{ color: r.status === 'EXPIRED' ? '#b91c1c' : r.expiringSoon ? '#b45309' : 'text.secondary', fontWeight: r.expiringSoon || r.status === 'EXPIRED' ? 700 : 400 }}>
                              {r.status === 'EXPIRED' ? 'Expired ' : 'Expires '}{fmt(r.expiryDate)}{r.daysToExpiry !== null ? ` (${r.daysToExpiry} days)` : ''}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell><Tooltip title={r.source === 'EXTERNAL_CERTIFICATE' ? 'Approved by an external committee; uploaded certificate' : ''}><Chip size="small" label={r.statusLabel} sx={{ fontWeight: 700, ...(STATUS_SX[r.status] || {}) }} /></Tooltip></TableCell>
                      </TableRow>
                    ))}
                    {!filtered.length ? (
                      <TableRow><TableCell colSpan={5} sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>{rows.length ? 'No applications match these filters.' : 'Your researchers have no ethics applications yet.'}</TableCell></TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </TableContainer>
              {filtered.length > 10 ? (
                <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }} rowsPerPageOptions={[10, 25, 50, 100]} />
              ) : null}
            </Paper>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
