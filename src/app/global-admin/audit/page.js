'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Button,
  Chip,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  TextField,
  MenuItem,
  InputAdornment,
  LinearProgress,
  Typography,
  Alert,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  FilterAltOff as ClearIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import GlobalAdminLayout from '../../../components/GlobalAdmin/GlobalAdminLayout';
import {
  useGlobalAdminGuard,
  PageHeader,
  EmptyState,
  ActionChip,
  OutcomeChip,
  formatDate,
  describeDevice,
} from '../../../components/GlobalAdmin/ops/OpsUi';

const CATEGORIES = [
  { value: '', label: 'All changes & sign-ins' },
  { value: 'AUTH', label: 'Sign-ins' },
  { value: 'ADMIN', label: 'Admin changes' },
  { value: 'USAGE', label: 'Activity' },
  { value: 'SYSTEM', label: 'Jobs' },
];

const MODULE_OPTIONS = [
  ['publications', 'Publications'],
  ['projects', 'Projects & Proposals'],
  ['ethics', 'Ethics'],
  ['grants', 'Grants'],
  ['clinical_trials', 'Clinical Trials'],
  ['image_integrity', 'Image Integrity'],
  ['training', 'Training'],
  ['administration', 'Administration'],
  ['analytics', 'Reports & Analytics'],
  ['ai_assistant', 'AI Assistant'],
  ['profile', 'Profile & Settings'],
  ['institution_admin', 'Institution Admin'],
  ['foundation', 'Foundation'],
  ['network', 'Research Network'],
  ['dashboard', 'Dashboard'],
  ['other', 'Other'],
];

const FILTER_KEYS = ['category', 'q', 'action', 'outcome', 'institutionId', 'actorUserId', 'ip', 'from', 'to', 'module', 'kind'];

const ROLE_LABELS = {
  GLOBAL_ADMIN: 'Platform administrator',
  INSTITUTION_ADMIN: 'Institution administrator',
  RESEARCH_ADMIN: 'Research administrator',
  RESEARCHER: 'Researcher',
  FOUNDATION_ADMIN: 'Foundation administrator',
};

const KIND_LABELS = { VIEW: 'Opened', CREATE: 'Created', UPDATE: 'Updated', DELETE: 'Deleted' };

function AuditLogInner() {
  const { ready } = useGlobalAdminGuard();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState(() => {
    const initial = {};
    for (const key of FILTER_KEYS) initial[key] = searchParams.get(key) || '';
    return initial;
  });
  const [searchInput, setSearchInput] = useState(filters.q);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [institutions, setInstitutions] = useState([]);

  const isUsage = filters.category === 'USAGE';

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    for (const key of FILTER_KEYS) if (filters[key]) params.set(key, filters[key]);
    return params.toString();
  }, [filters]);

  // keep URL shareable
  useEffect(() => {
    if (!ready) return;
    router.replace(`/global-admin/audit${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [queryString, ready, router]);

  // debounce free-text search
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.q === searchInput ? f : { ...f, q: searchInput }));
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams(queryString);
      params.set('page', String(page + 1));
      params.set('pageSize', String(pageSize));
      const res = await fetch(`/api/global-admin/audit?${params}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load');
      setData(json.data);
    } catch (err) {
      setError(err.message || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [queryString, page, pageSize]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  useEffect(() => {
    if (!ready) return;
    fetch('/api/global-admin/institutions')
      .then((r) => r.json())
      .then((json) => setInstitutions((json.institutions || []).map((i) => ({ id: i.id, name: i.name })).sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {});
  }, [ready]);

  const setFilter = (key, value) => {
    setFilters((f) => {
      const next = { ...f, [key]: value };
      if (key === 'category') {
        next.action = '';
        next.outcome = '';
        next.module = '';
        next.kind = '';
      }
      return next;
    });
    setPage(0);
  };

  const clearFilters = () => {
    const cleared = Object.fromEntries(FILTER_KEYS.map((k) => [k, '']));
    cleared.category = filters.category;
    setFilters(cleared);
    setSearchInput('');
    setPage(0);
  };

  const exportCsv = () => {
    const params = new URLSearchParams(queryString);
    params.set('format', 'csv');
    window.location.href = `/api/global-admin/audit?${params}`;
  };

  const actionOptions = useMemo(() => {
    if (isUsage) return [];
    return (data?.actions || []).filter((a) => !filters.category || a.category === filters.category);
  }, [data, filters.category, isUsage]);

  const hasFilters = FILTER_KEYS.some((k) => k !== 'category' && filters[k]);

  if (!ready) return null;

  return (
    <GlobalAdminLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <PageHeader
          title="Audit log"
          subtitle="Who signed in or tried to, what administrators changed, and how people used each module, across all institutions. Entries cannot be edited or deleted."
          actions={
            <>
              {data?.retention && (
                <Tooltip title={`Sign-ins kept ${data.retention.authDays} days · admin changes ${Math.round(data.retention.adminDays / 365)} years · activity ${data.retention.usageDays} days`}>
                  <Chip icon={<LockIcon fontSize="small" />} label={`Kept ${Math.round(data.retention.adminDays / 365)} years`} variant="outlined" />
                </Tooltip>
              )}
              <Button variant="contained" startIcon={<DownloadIcon />} onClick={exportCsv}>
                Export CSV
              </Button>
            </>
          }
        />

        <Tabs
          value={filters.category}
          onChange={(_, v) => setFilter('category', v)}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          {CATEGORIES.map((c) => (
            <Tab key={c.value || 'all'} value={c.value} label={c.label} sx={{ textTransform: 'none', fontWeight: 600 }} />
          ))}
        </Tabs>

        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder={isUsage ? 'Search people or pages' : 'Search people, IPs or events'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              sx={{ minWidth: 240, flex: '1 1 240px' }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
            {!isUsage && (
              <TextField select size="small" label="Action" value={filters.action} onChange={(e) => setFilter('action', e.target.value)} sx={{ minWidth: 180 }}>
                <MenuItem value="">All actions</MenuItem>
                {actionOptions.map((a) => (
                  <MenuItem key={`${a.category}-${a.action}`} value={a.action}>
                    {a.action.toLowerCase().replace(/_/g, ' ')} ({a.count})
                  </MenuItem>
                ))}
              </TextField>
            )}
            {!isUsage && (
              <TextField select size="small" label="Result" value={filters.outcome} onChange={(e) => setFilter('outcome', e.target.value)} sx={{ minWidth: 130 }}>
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="SUCCESS">Succeeded</MenuItem>
                <MenuItem value="FAILURE">Failed</MenuItem>
              </TextField>
            )}
            {isUsage && (
              <TextField select size="small" label="Module" value={filters.module} onChange={(e) => setFilter('module', e.target.value)} sx={{ minWidth: 180 }}>
                <MenuItem value="">All modules</MenuItem>
                {MODULE_OPTIONS.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
              </TextField>
            )}
            {isUsage && (
              <TextField select size="small" label="Type" value={filters.kind} onChange={(e) => setFilter('kind', e.target.value)} sx={{ minWidth: 140 }}>
                <MenuItem value="">Views & actions</MenuItem>
                <MenuItem value="VIEW">Page views</MenuItem>
                <MenuItem value="ACTION">Actions</MenuItem>
              </TextField>
            )}
            <TextField select size="small" label="Institution" value={filters.institutionId} onChange={(e) => setFilter('institutionId', e.target.value)} sx={{ minWidth: 200 }}>
              <MenuItem value="">All institutions</MenuItem>
              <MenuItem value="platform">Platform-wide / none</MenuItem>
              {institutions.map((i) => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
            </TextField>
            <TextField type="date" size="small" label="From" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField type="date" size="small" label="To" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} InputLabelProps={{ shrink: true }} />
            <Button startIcon={<ClearIcon />} onClick={clearFilters} disabled={!hasFilters}>Clear</Button>
          </Box>

          {(filters.actorUserId || filters.ip) && (
            <Box sx={{ px: 2, pb: 1.5, display: 'flex', gap: 1 }}>
              {filters.actorUserId && <Chip size="small" label="Filtered to one person" onDelete={() => setFilter('actorUserId', '')} />}
              {filters.ip && <Chip size="small" label={`IP ${filters.ip}`} onDelete={() => setFilter('ip', '')} />}
            </Box>
          )}

          {loading && <LinearProgress />}
          {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

          <TableContainer>
            {isUsage ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>When</TableCell>
                    <TableCell>Who</TableCell>
                    <TableCell>Module</TableCell>
                    <TableCell>Did</TableCell>
                    <TableCell>Where</TableCell>
                    <TableCell>Institution</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.events || []).map((e) => (
                    <TableRow key={e.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(e.createdAt, { time: true })}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => setFilter('actorUserId', e.userId)}>
                          {e.userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{ROLE_LABELS[e.accountType] || e.accountType}</Typography>
                      </TableCell>
                      <TableCell><Chip size="small" label={e.moduleLabel} variant="outlined" /></TableCell>
                      <TableCell>
                        {KIND_LABELS[e.kind === 'VIEW' ? 'VIEW' : e.action] || e.kind}
                        {e.statusCode >= 400 && <Chip size="small" color="error" variant="outlined" label={e.statusCode} sx={{ ml: 1 }} />}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{e.route}</TableCell>
                      <TableCell>{e.institutionName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>When</TableCell>
                    <TableCell>Done by</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>What happened</TableCell>
                    <TableCell>Institution</TableCell>
                    <TableCell>From</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.events || []).map((e) => (
                    <TableRow key={e.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(e.createdAt, { time: true })}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {e.actorName || e.actorEmail || (e.category === 'SYSTEM' ? 'Scheduler' : 'Unknown')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {e.actorName && e.actorEmail ? e.actorEmail : ROLE_LABELS[e.actorAccountType] || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                          <ActionChip action={e.action} category={e.category} />
                          {e.outcome === 'FAILURE' && <OutcomeChip outcome={e.outcome} />}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 420 }}>
                        <Typography variant="body2">{e.summary}</Typography>
                        {e.metadata?.changedFields?.length > 0 && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Changed: {e.metadata.changedFields.join(', ')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{e.institutionName}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {e.ipAddress ? (
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: 'monospace', fontSize: 13, cursor: 'pointer' }}
                            onClick={() => setFilter('ip', e.ipAddress)}
                            title="Show everything from this IP"
                          >
                            {e.ipAddress}
                          </Typography>
                        ) : '—'}
                        <Typography variant="caption" color="text.secondary">{describeDevice(e.userAgent)}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          {!loading && !data?.events?.length && <EmptyState>No entries match these filters.</EmptyState>}

          <TablePagination
            component="div"
            count={data?.total ?? 0}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[25, 50, 100]}
          />
        </Paper>
      </Container>
    </GlobalAdminLayout>
  );
}

export default function AuditLogPage() {
  return (
    <React.Suspense fallback={null}>
      <AuditLogInner />
    </React.Suspense>
  );
}
