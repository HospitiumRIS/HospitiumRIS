'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Link,
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
} from '@mui/material';
import {
  AccountBalanceWallet as BudgetIcon,
  Download as DownloadIcon,
  Home as HomeIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { AttentionList, Card, KpiCard } from '@/components/Training/admin/analytics/AnalyticsParts';
import FundingAnalytics from '@/components/Institution/FundingAnalytics';
import ProjectBudgetPanel from '@/components/Projects/budget/ProjectBudgetPanel';
import { BurnChip, ExpenseStatusChip, PURPLE, SpendBar, btn, fmtDate, money } from '@/components/Projects/budget/BudgetParts';
import { ExpenseActionDialog } from '@/components/Projects/budget/BudgetDialogs';
import { BURN_LABELS, EXPENSE_STATUS_LABELS } from '@/lib/project-budget';

const whiteBtn = { ...btn, bgcolor: 'white', color: PURPLE, '&:hover': { bgcolor: '#f5f5f5' } };
const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'projects', label: 'Projects' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'claims', label: 'Claims to approve' },
  { id: 'funding', label: 'Funding' },
];
const has = (text, q) => String(text || '').toLowerCase().includes(q);

/**
 * Projects › Budget & expenses (#179): budgets, spending and claims for every approved
 * project of the institution, plus funding analytics (moved here from Analytics).
 */
function ProjectBudgets() {
  const router = useRouter();
  const params = useSearchParams();
  const initialTab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'overview';
  const [tab, setTabState] = useState(initialTab);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [burn, setBurn] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [panel, setPanel] = useState(null);
  const [action, setAction] = useState(null);

  const setTab = (next) => {
    setTabState(next);
    setPage(0);
    router.replace(`/institution/projects/budget${next === 'overview' ? '' : `?tab=${next}`}`, { scroll: false });
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/institution/budget', { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not load budgets');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const q = search.trim().toLowerCase();
  const projects = useMemo(() => (data?.projects || []).filter((p) => (burn === 'all' || p.figures.burn === burn) && (!q || has(p.title, q) || has(p.pi, q) || has(p.funder, q) || has(p.department, q))), [data, burn, q]);
  const expenses = useMemo(() => (data?.expenses || []).filter((e) => (status === 'all' || e.status === status) && (!q || has(e.description, q) || has(e.projectTitle, q) || has(e.payee, q) || has(e.submittedByName, q))), [data, status, q]);
  const claims = useMemo(() => (data?.expenses || []).filter((e) => e.status === 'SUBMITTED'), [data]);

  const pf = data?.portfolio;
  const main = pf?.main;
  const otherCurrencies = (pf?.totals || []).slice(1);
  const byId = useMemo(() => new Map((data?.projects || []).map((p) => [p.id, p])), [data]);
  const openProject = (id) => setPanel(byId.get(id) || { id });

  const attention = useMemo(() => {
    if (!data) return [];
    const items = [];
    for (const p of data.projects) {
      if (p.figures.burn === 'OVERSPENT') items.push({ id: `o-${p.id}`, severity: 'high', title: p.title, detail: `Overspent by ${money(-p.figures.remaining, p.currency)}`, projectId: p.id });
      else if (p.figures.burn === 'OVER') items.push({ id: `f-${p.id}`, severity: 'medium', title: p.title, detail: `${p.figures.pctSpent}% spent with ${p.figures.pctTime}% of the time elapsed`, projectId: p.id });
      if (p.figures.claimsPending) items.push({ id: `c-${p.id}`, severity: 'medium', title: p.title, detail: `${p.figures.claimsPending} claim(s) awaiting approval`, projectId: p.id });
      if (p.figures.budgetSource === 'NONE') items.push({ id: `n-${p.id}`, severity: 'low', title: p.title, detail: 'No budget recorded', projectId: p.id });
    }
    const rank = { high: 0, medium: 1, low: 2 };
    return items.sort((a, b) => rank[a.severity] - rank[b.severity]);
  }, [data]);

  const pageRows = (rows) => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const pager = (count) => (
    <TablePagination component="div" count={count} page={page} rowsPerPage={rowsPerPage} rowsPerPageOptions={[10, 25, 50, 100]} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }} />
  );

  const projectTable = (rows) => (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Project</TableCell>
            <TableCell align="right">Budget</TableCell>
            <TableCell align="right">Spent</TableCell>
            <TableCell align="right">Remaining</TableCell>
            <TableCell>Progress</TableCell>
            <TableCell>Burn</TableCell>
            <TableCell>Ends</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id} hover onClick={() => setPanel(p)} sx={{ cursor: 'pointer' }}>
              <TableCell sx={{ maxWidth: 360 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{p.title}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap component="div">{[p.pi, p.funder].filter(Boolean).join(' · ') || '—'}</Typography>
              </TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{p.figures.budget ? money(p.figures.budget, p.currency) : '—'}</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{money(p.figures.spent, p.currency)}{p.figures.pending ? <Typography variant="caption" display="block" color="#92400e">+{money(p.figures.pending, p.currency)} pending</Typography> : null}</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: p.figures.remaining < 0 ? '#dc2626' : undefined, fontWeight: p.figures.remaining < 0 ? 700 : 400 }}>{p.figures.budget ? money(p.figures.remaining, p.currency) : '—'}</TableCell>
              <TableCell>{p.figures.budget ? <SpendBar figures={p.figures} width={140} /> : <Typography variant="caption" color="text.secondary">No budget</Typography>}</TableCell>
              <TableCell><BurnChip burn={p.figures.burn} /></TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(p.endDate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const expenseTable = (rows, decide = false) => (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Expense</TableCell>
            <TableCell>Project</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">{decide ? 'Decide' : ''}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((e) => (
            <TableRow key={e.id} hover>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(e.spentOn)}</TableCell>
              <TableCell sx={{ maxWidth: 320 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.description}</Typography>
                <Typography variant="caption" color="text.secondary">{e.lineCategory || 'Unallocated'}{e.payee ? ` · ${e.payee}` : ''} · {e.source === 'CLAIM' ? `claim by ${e.submittedByName || 'researcher'}` : `recorded by ${e.submittedByName || 'research office'}`}</Typography>
              </TableCell>
              <TableCell sx={{ maxWidth: 260 }}><Link component="button" variant="body2" onClick={() => openProject(e.proposalId)} sx={{ textAlign: 'left', color: PURPLE }}>{e.projectTitle}</Link></TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{money(e.amount, e.currency)}</TableCell>
              <TableCell><ExpenseStatusChip status={e.status} /></TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                {e.receiptFileId ? <Tooltip title="Open receipt"><IconButton size="small" component="a" href={`/api/files/${e.receiptFileId}`} target="_blank" rel="noopener"><ReceiptIcon fontSize="small" /></IconButton></Tooltip> : null}
                {decide ? (
                  <>
                    <Button size="small" onClick={() => setAction({ expense: e, action: 'approve' })} sx={{ ...btn, color: '#166534' }}>Approve</Button>
                    <Button size="small" onClick={() => setAction({ expense: e, action: 'reject' })} sx={{ ...btn, color: '#b91c1c' }}>Reject</Button>
                  </>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const filters = (kind) => (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2 }}>
      <TextField size="small" placeholder={kind === 'projects' ? 'Search project, PI, funder or department' : 'Search expense, project, payee or person'} value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ flex: 1 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
      {kind === 'projects' ? (
        <TextField select size="small" label="Burn" value={burn} onChange={(e) => { setBurn(e.target.value); setPage(0); }} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All</MenuItem>
          {Object.entries(BURN_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
        </TextField>
      ) : (
        <TextField select size="small" label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All</MenuItem>
          {Object.entries(EXPENSE_STATUS_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
        </TextField>
      )}
    </Stack>
  );

  const empty = (text) => <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>{text}</Typography>;

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title="Budget & expenses"
        description="Budgets, spending and expense claims for your institution's approved projects, and funding analytics."
        icon={<BudgetIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
          { label: 'Project tracking', path: '/institution/projects' },
        ]}
        actionButton={(
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => window.location.assign('/api/institution/budget?format=xlsx')} disabled={!data?.projects?.length} sx={whiteBtn}>Excel</Button>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={load} sx={whiteBtn}>Refresh</Button>
          </Stack>
        )}
      />
      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        <Stack spacing={2}>
          {notice ? <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert> : null}
          {error ? <Alert severity="error" action={<Button size="small" onClick={load}>Retry</Button>}>{error}</Alert> : null}

          {pf ? (
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' } }}>
              <KpiCard label="Total budget" value={money(main.budget, main.currency, true)} hint={`${main.projects} project(s) in ${main.currency}${otherCurrencies.length ? ` · +${otherCurrencies.length} other currenc${otherCurrencies.length === 1 ? 'y' : 'ies'}` : ''}`} onClick={() => setTab('projects')} />
              <KpiCard label="Spent" value={money(main.spent, main.currency, true)} hint={main.budget ? `${Math.round((main.spent / main.budget) * 100)}% of the budget` : 'Approved expenses'} onClick={() => setTab('expenses')} />
              <KpiCard label="Remaining" value={money(main.remaining, main.currency, true)} hint={main.pending ? `${money(main.pending, main.currency, true)} awaiting approval` : 'After approved expenses'} onClick={() => setTab('projects')} />
              <KpiCard label="Claims to approve" value={pf.claimsPending} hint="Submitted by researchers" onClick={() => setTab('claims')} />
              <KpiCard label="Needs attention" value={pf.overspent + pf.spendingFast} hint={`${pf.overspent} overspent · ${pf.spendingFast} spending fast${pf.noBudget ? ` · ${pf.noBudget} without budget` : ''}`} onClick={() => { setBurn(pf.overspent ? 'OVERSPENT' : 'OVER'); setTab('projects'); }} />
            </Box>
          ) : null}

          <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ px: 1, borderBottom: '1px solid', borderColor: 'divider', '& .MuiTab-root': { ...btn, minHeight: 50 }, '& .Mui-selected': { color: `${PURPLE} !important` }, '& .MuiTabs-indicator': { bgcolor: PURPLE, height: 3 } }}>
              {TABS.map((t) => <Tab key={t.id} value={t.id} label={t.id === 'claims' && claims.length ? `${t.label} (${claims.length})` : t.label} />)}
            </Tabs>

            {tab !== 'funding' && loading && !data ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box> : null}

            {tab === 'overview' && data ? (
              <Box sx={{ p: 2, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
                <Card title="Needs attention" subtitle="Overspent, spending fast, claims waiting and projects without a budget">
                  <AttentionList items={attention.map((a) => ({ ...a, key: a.id, action: 'Open budget' }))} limit={8} onOpen={(_, item) => openProject(item.projectId)} emptyText="Nothing needs attention." moreText="on the Projects tab" />
                </Card>
                <Card title="Ending soonest" subtitle="Approved projects by end date">
                  {data.projects.length ? projectTable(data.projects.filter((p) => !p.endDate || new Date(p.endDate) >= new Date()).slice(0, 6)) : empty('No approved projects yet.')}
                </Card>
                {otherCurrencies.length ? (
                  <Card title="Other currencies" subtitle="Totals are kept per currency">
                    <Table size="small">
                      <TableHead><TableRow><TableCell>Currency</TableCell><TableCell align="right">Projects</TableCell><TableCell align="right">Budget</TableCell><TableCell align="right">Spent</TableCell><TableCell align="right">Remaining</TableCell></TableRow></TableHead>
                      <TableBody>{otherCurrencies.map((t) => <TableRow key={t.currency}><TableCell>{t.currency}</TableCell><TableCell align="right">{t.projects}</TableCell><TableCell align="right">{money(t.budget, t.currency)}</TableCell><TableCell align="right">{money(t.spent, t.currency)}</TableCell><TableCell align="right">{money(t.remaining, t.currency)}</TableCell></TableRow>)}</TableBody>
                    </Table>
                  </Card>
                ) : null}
              </Box>
            ) : null}

            {tab === 'projects' && data ? (
              <>
                {filters('projects')}
                {projects.length ? <>{projectTable(pageRows(projects))}{pager(projects.length)}</> : empty(data.projects.length ? 'No projects match.' : 'No approved projects yet. Projects appear here once their proposal is approved.')}
              </>
            ) : null}

            {tab === 'expenses' && data ? (
              <>
                {filters('expenses')}
                {expenses.length ? <>{expenseTable(pageRows(expenses))}{pager(expenses.length)}</> : empty(data.expenses.length ? 'No expenses match.' : 'No expenses yet. Open a project to record one.')}
              </>
            ) : null}

            {tab === 'claims' && data ? (claims.length ? <>{expenseTable(pageRows(claims), true)}{pager(claims.length)}</> : empty('No claims waiting. Researchers submit claims with receipts from their project budget.')) : null}

            {tab === 'funding' ? <Box sx={{ p: 2 }}><FundingAnalytics embedded /></Box> : null}
          </Paper>
        </Stack>
      </Container>

      <ProjectBudgetPanel open={Boolean(panel)} project={panel} onClose={() => setPanel(null)} onChanged={load} />
      <ExpenseActionDialog open={Boolean(action)} expense={action?.expense} action={action?.action} onClose={() => setAction(null)} onDone={(m) => { setAction(null); setNotice(m); load(); }} />
    </Box>
  );
}

export default function ProjectBudgetsPage() {
  return (
    <Suspense fallback={<Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>}>
      <ProjectBudgets />
    </Suspense>
  );
}
