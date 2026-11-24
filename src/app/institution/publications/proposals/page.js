'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  Container,
  MenuItem,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CheckCircle as ApprovedIcon,
  Description as DescriptionIcon,
  EditNote as DraftIcon,
  FindInPage as ReviewIcon,
  Home as HomeIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import RowActions from '@/components/common/RowActions';
import StatusPill, { humanizeStatus } from '@/components/common/StatusPill';
import { PROPOSAL_STATUS_TONE } from '@/components/Proposals/ProposalStatusCell';
import {
  BRAND_PURPLE as PURPLE,
  FilterBar,
  PurpleTableHead,
  StatCards,
  TablePaper,
  filterFieldSx,
  paginationSx,
  zebraRowSx,
} from '@/components/common/ListPage';

const STAGES = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'draft', label: 'Drafting', match: (s) => s === 'DRAFT' },
  { key: 'review', label: 'In review', match: (s) => s === 'SUBMITTED' || s === 'UNDER_REVIEW' },
  { key: 'revision', label: 'Needs revision', match: (s) => s === 'REVISION_REQUESTED' },
  { key: 'approved', label: 'Approved', match: (s) => s === 'APPROVED' },
  { key: 'rejected', label: 'Rejected', match: (s) => s === 'REJECTED' },
];
const CAPTION = {
  DRAFT: 'Being written by the researcher',
  SUBMITTED: 'Waiting for review to start',
  UNDER_REVIEW: 'In internal review',
  REVISION_REQUESTED: 'Back with the researcher',
  APPROVED: 'Approved project',
  REJECTED: 'Not approved',
};

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const money = (v, c) => {
  if (v === null || v === undefined || v === '') return null;
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: c || 'USD', maximumFractionDigits: 0 }).format(Number(v)); } catch { return `${v}`; }
};
const initials = (n) => (n ? n.split(' ').filter(Boolean).map((x) => x[0]).join('').slice(0, 2).toUpperCase() : '?');

function DraftSummary({ p }) {
  return (
    <Box sx={{ p: 0.5, maxWidth: 380 }}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 0.5 }}>Draft – not submitted yet</Typography>
      <Typography sx={{ fontSize: '0.78rem', lineHeight: 1.5, mb: 0.75 }}>{p.summary || 'No abstract written yet.'}</Typography>
      <Typography sx={{ fontSize: '0.72rem', opacity: 0.85 }}>
        PI: {p.principalInvestigator || 'not set'} · Started {fmt(p.createdAt)} · Last edited {fmt(p.updatedAt)}
      </Typography>
      <Typography sx={{ fontSize: '0.72rem', opacity: 0.85, mt: 0.5 }}>Details open once the researcher submits it.</Typography>
    </Box>
  );
}

/**
 * Proposals pipeline: every proposal of the institution by stage. Drafts belong to the
 * researcher until submitted, so they show a summary on hover instead of opening.
 */
export default function ProposalsPipelinePage() {
  const router = useRouter();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('all');
  const [department, setDepartment] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetch('/api/institution/publications/proposals', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProposals(data.proposals || []);
        else setError(data.error || 'Could not load proposals');
      })
      .catch(() => setError('Could not load proposals'))
      .finally(() => setLoading(false));
  }, []);

  const departments = useMemo(() => [...new Set(proposals.flatMap((p) => p.departments || []))].sort(), [proposals]);
  const counts = useMemo(() => Object.fromEntries(STAGES.map((s) => [s.key, proposals.filter((p) => s.match(p.status)).length])), [proposals]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const st = STAGES.find((s) => s.key === stage) || STAGES[0];
    return proposals.filter((p) => st.match(p.status)
      && (department === 'all' || (p.departments || []).includes(department))
      && (!q || [p.title, p.principalInvestigator, ...(p.departments || []), p.fundingInstitution, p.fundingSource].some((v) => String(v || '').toLowerCase().includes(q))));
  }, [proposals, search, stage, department]);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1));
  const paged = filtered.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage);

  const stats = [
    { label: 'Total proposals', value: proposals.length, sub: 'All stages', icon: <DescriptionIcon /> },
    { label: 'Drafting', value: counts.draft || 0, sub: 'Being written', icon: <DraftIcon /> },
    { label: 'In review', value: (counts.review || 0) + (counts.revision || 0), sub: `${counts.revision || 0} back with researcher`, icon: <ReviewIcon /> },
    { label: 'Approved', value: counts.approved || 0, sub: `${counts.rejected || 0} not approved`, icon: <ApprovedIcon /> },
  ];

  const open = (p) => { if (p.status !== 'DRAFT') router.push(`/institution/projects/${p.id}`); };
  const reset = () => setPage(0);

  return (
    <>
      <PageHeader
        title="Proposals pipeline"
        description="Every research proposal of your institution, from draft to award, by stage"
        icon={<DescriptionIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
          { label: 'Proposal review', path: '/institution/proposals/review' },
        ]}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert> : null}

        <StatCards cards={stats} />

        <FilterBar
          search={search}
          onSearchChange={(v) => { setSearch(v); reset(); }}
          searchPlaceholder="Search by title, PI, department or funder"
          onClear={() => { setSearch(''); setStage('all'); setDepartment('all'); reset(); }}
        >
          <TextField select className="filter-control" label="Department" value={department} onChange={(e) => { setDepartment(e.target.value); reset(); }} sx={filterFieldSx}>
            <MenuItem value="all">All departments</MenuItem>
            {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </TextField>
        </FilterBar>

        <TablePaper>
          <Tabs
            value={stage}
            onChange={(_, v) => { setStage(v); reset(); }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 1, borderBottom: '1px solid rgba(139, 108, 188, 0.12)', '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 52 }, '& .Mui-selected': { color: `${PURPLE} !important` }, '& .MuiTabs-indicator': { bgcolor: PURPLE } }}
          >
            {STAGES.map((s) => (
              <Tab
                key={s.key}
                value={s.key}
                label={(
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {s.label}
                    <Box component="span" sx={{ px: 0.75, borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, minWidth: 20, textAlign: 'center', bgcolor: stage === s.key ? PURPLE : '#f3f4f6', color: stage === s.key ? 'white' : '#6b7280' }}>
                      {counts[s.key] || 0}
                    </Box>
                  </Box>
                )}
              />
            ))}
          </Tabs>

          {loading ? (
            <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <PurpleTableHead columns={['Proposal', 'Stage', 'Budget', 'Timeline', 'Last updated', { label: 'Actions', align: 'center' }]} />
                  <TableBody>
                    {paged.map((p, index) => {
                      const draft = p.status === 'DRAFT';
                      const budget = money(p.totalBudgetAmount, p.budgetCurrency);
                      const meta = [(p.departments || []).slice(0, 2).join(', '), p.coInvestigatorCount ? `+${p.coInvestigatorCount} co-investigator${p.coInvestigatorCount > 1 ? 's' : ''}` : null].filter(Boolean).join(' · ');
                      const title = (
                        <Typography
                          variant="subtitle1"
                          onClick={() => open(p)}
                          sx={{
                            fontWeight: 600,
                            color: draft ? '#4b5563' : '#2D3748',
                            fontSize: '0.95rem',
                            lineHeight: 1.3,
                            mb: 0.75,
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 2,
                            overflow: 'hidden',
                            cursor: draft ? 'help' : 'pointer',
                            ...(draft ? {} : { '&:hover': { color: PURPLE, textDecoration: 'underline' } }),
                          }}
                        >
                          {p.title}
                        </Typography>
                      );
                      return (
                        <TableRow key={p.id} sx={zebraRowSx(index)}>
                          <TableCell sx={{ maxWidth: 460 }}>
                            {draft ? <Tooltip title={<DraftSummary p={p} />} arrow placement="bottom-start">{title}</Tooltip> : title}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                              <Avatar sx={{ width: 22, height: 22, fontSize: '0.62rem', fontWeight: 700, bgcolor: PURPLE }}>{initials(p.principalInvestigator)}</Avatar>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                <Box component="span" sx={{ color: '#374151', fontWeight: 600 }}>{p.principalInvestigator || 'Unknown PI'}</Box>
                                {meta ? ` · ${meta}` : ''}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <StatusPill label={draft ? 'Drafting' : humanizeStatus(p.status)} tone={PROPOSAL_STATUS_TONE[p.status] || 'neutral'} />
                              <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.72rem' }}>{CAPTION[p.status] || ''}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: budget ? '#059669' : '#9ca3af' }}>{budget || 'Not set'}</Typography>
                            {p.fundingInstitution || p.fundingSource ? <Typography variant="caption" color="text.secondary" noWrap component="div" sx={{ maxWidth: 180 }}>{p.fundingInstitution || p.fundingSource}</Typography> : null}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Typography variant="body2">{p.startDate ? fmt(p.startDate) : '—'}</Typography>
                            <Typography variant="caption" color="text.secondary">{p.endDate ? `to ${fmt(p.endDate)}` : ''}</Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}><Typography variant="body2" color="text.secondary">{fmt(p.updatedAt)}</Typography></TableCell>
                          <TableCell align="center">
                            <RowActions
                              reserveMenuSpace={false}
                              actions={[{
                                key: 'open',
                                label: draft ? 'Drafts open once submitted' : 'Open details',
                                icon: <ViewIcon fontSize="small" />,
                                disabled: draft,
                                onClick: () => open(p),
                              }]}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!paged.length ? (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">{proposals.length ? 'No proposals match these filters.' : 'No proposals yet.'}</Typography>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filtered.length}
                page={currentPage}
                onPageChange={(_, next) => setPage(next)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={paginationSx}
              />
            </>
          )}
        </TablePaper>
      </Container>
    </>
  );
}
