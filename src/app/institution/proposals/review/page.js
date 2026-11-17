'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Typography,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Home as HomeIcon,
  PersonAdd as AssignIcon,
  PersonSearch as NeedsReviewersIcon,
  RateReview as ReviewIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import PageHeader from '../../../../components/common/PageHeader';
import RowActions from '../../../../components/common/RowActions';
import StatusPill, { humanizeStatus } from '../../../../components/common/StatusPill';
import ProposalStatusCell, { PROPOSAL_STATUS_TONE } from '../../../../components/Proposals/ProposalStatusCell';
import {
  BRAND_PURPLE as PURPLE,
  FilterBar,
  PurpleTableHead,
  StatCards,
  TablePaper,
  filterFieldSx,
  paginationSx,
  zebraRowSx,
} from '../../../../components/common/ListPage';

const ACTIVE = ['SUBMITTED', 'UNDER_REVIEW'];

const STATUS_TONE = PROPOSAL_STATUS_TONE;

// Work queues shown as tabs above the table
const QUEUES = [
  { key: 'all', label: 'All' },
  { key: 'needs_reviewers', label: 'Needs reviewers' },
  { key: 'in_review', label: 'In review' },
  { key: 'awaiting_decision', label: 'Awaiting decision' },
  { key: 'with_researcher', label: 'With researcher' },
  { key: 'decided', label: 'Decided' },
];

const queueOf = (proposal) => {
  if (proposal.status === 'REVISION_REQUESTED') return 'with_researcher';
  if (['APPROVED', 'REJECTED'].includes(proposal.status)) return 'decided';
  const review = proposal.review;
  const assigned = review?.reviewersAssigned || 0;
  if (!assigned) return 'needs_reviewers';
  if ((review?.reviewersCompleted || 0) >= assigned) return 'awaiting_decision';
  return 'in_review';
};

const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined || amount === '') return null;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount));
  } catch {
    return `${amount}`;
  }
};

/** Days the proposal has been waiting in its current review stage (active proposals only). */
const daysWaiting = (proposal) => {
  if (!ACTIVE.includes(proposal.status)) return null;
  const since = new Date(proposal.review?.waitingSince || proposal.updatedAt || proposal.createdAt);
  if (Number.isNaN(since.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - since.getTime()) / 86400000));
};

const waitingTone = (days) => (days >= 21 ? 'danger' : days >= 14 ? 'warning' : 'neutral');

const initials = (name) =>
  name ? name.split(' ').filter(Boolean).map((n) => n.charAt(0)).join('').substring(0, 2).toUpperCase() : '?';

function ReviewersCell({ proposal }) {
  if (!ACTIVE.includes(proposal.status)) {
    return <Typography variant="caption" color="text.secondary">—</Typography>;
  }
  const assigned = proposal.review?.reviewersAssigned || 0;
  const done = Math.min(assigned, proposal.review?.reviewersCompleted || 0);
  if (!assigned) {
    return <StatusPill label="None assigned" tone="warning" dot={false} />;
  }
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2937' }}>
        {done} of {assigned} reviews in
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {assigned - done ? `${assigned - done} pending` : 'Ready for a decision'}
      </Typography>
    </Box>
  );
}

export default function InstitutionProposalReviewPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [queue, setQueue] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignEmails, setAssignEmails] = useState('');
  const [assignMessage, setAssignMessage] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [notice, setNotice] = useState('');

  const loadProposals = async () => {
    try {
      setLoading(true);
      setError('');
      // One request: review stage and reviewer counts come with each proposal
      const response = await fetch('/api/proposals?limit=500&include=review');
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load proposals');
      setProposals((data.proposals || []).filter((item) => item.status !== 'DRAFT'));
    } catch (err) {
      setError(err.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const departments = useMemo(
    () => [...new Set(proposals.flatMap((item) => item.departments || []))].sort(),
    [proposals]
  );

  const queueCounts = useMemo(() => {
    const counts = { all: proposals.length };
    proposals.forEach((p) => {
      const key = queueOf(p);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [proposals]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return proposals.filter((proposal) => {
      const haystack = `${proposal.title} ${proposal.principalInvestigator} ${(proposal.departments || []).join(' ')}`.toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      const matchesQueue = queue === 'all' || queueOf(proposal) === queue;
      const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
      const matchesDepartment = departmentFilter === 'all'
        || (proposal.departments || []).includes(departmentFilter);
      return matchesSearch && matchesQueue && matchesStatus && matchesDepartment;
    });
  }, [proposals, search, queue, statusFilter, departmentFilter]);

  const lastPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, lastPage);
  const paged = filtered.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage);

  const inReviewCount = (queueCounts.in_review || 0) + (queueCounts.awaiting_decision || 0);
  const stats = [
    { label: 'Total proposals', value: proposals.length, sub: 'Submitted for review', icon: <ReviewIcon /> },
    { label: 'Needs reviewers', value: queueCounts.needs_reviewers || 0, sub: 'No reviewers assigned yet', icon: <NeedsReviewersIcon /> },
    { label: 'In review', value: inReviewCount, sub: `${queueCounts.awaiting_decision || 0} awaiting a decision`, icon: <ReviewIcon /> },
    { label: 'Approved', value: proposals.filter((item) => item.status === 'APPROVED').length, sub: 'Cleared internal review', icon: <ApproveIcon /> },
  ];

  const resetPage = () => setPage(0);

  const openAssign = (proposal) => {
    setAssignTarget(proposal);
    setAssignEmails('');
    setAssignMessage('');
    setAssignOpen(true);
  };

  const submitAssign = async () => {
    if (!assignTarget) return;
    setAssigning(true);
    try {
      const response = await fetch(`/api/proposals/${assignTarget.id}/reviewers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: assignEmails.split(/[,\s]+/),
          message: assignMessage,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to invite reviewers');
      setNotice(`Invitations sent for "${assignTarget.title}". The researcher has been notified.`);
      setAssignOpen(false);
      loadProposals();
    } catch (err) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Proposal review"
        description="Assign reviewers by email, track the pipeline, and record decisions. Researchers are notified of status changes."
        icon={<ReviewIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
          { label: 'Proposal review' },
        ]}
        actionButton={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadProposals}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: 'rgba(255, 255, 255, 0.9)',
              '&:hover': { borderColor: 'rgba(255, 255, 255, 0.6)', backgroundColor: 'rgba(255, 255, 255, 0.05)' },
              borderRadius: 2,
              px: 2,
              py: 1,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Refresh
          </Button>
        }
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        ) : null}
        {notice ? (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setNotice('')}>
            {notice}
          </Alert>
        ) : null}

        <StatCards cards={stats} />

        <FilterBar
          search={search}
          onSearchChange={(value) => { setSearch(value); resetPage(); }}
          searchPlaceholder="Search by title, PI, or department"
          onClear={() => { setSearch(''); setQueue('all'); setStatusFilter('all'); setDepartmentFilter('all'); resetPage(); }}
        >
          <TextField
            select
            className="filter-control"
            label="Status"
            value={statusFilter}
            onChange={(event) => { setStatusFilter(event.target.value); resetPage(); }}
            sx={filterFieldSx}
          >
            <MenuItem value="all">All statuses</MenuItem>
            {Object.keys(STATUS_TONE).filter((status) => status !== 'DRAFT').map((status) => (
              <MenuItem key={status} value={status}>{humanizeStatus(status)}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            className="filter-control"
            label="Department"
            value={departmentFilter}
            onChange={(event) => { setDepartmentFilter(event.target.value); resetPage(); }}
            sx={filterFieldSx}
          >
            <MenuItem value="all">All departments</MenuItem>
            {departments.map((department) => (
              <MenuItem key={department} value={department}>{department}</MenuItem>
            ))}
          </TextField>
        </FilterBar>

        <TablePaper>
          <Tabs
            value={queue}
            onChange={(_, value) => { setQueue(value); resetPage(); }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 1,
              borderBottom: '1px solid rgba(139, 108, 188, 0.12)',
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 52 },
              '& .Mui-selected': { color: `${PURPLE} !important` },
              '& .MuiTabs-indicator': { bgcolor: PURPLE },
            }}
          >
            {QUEUES.map((item) => (
              <Tab
                key={item.key}
                value={item.key}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {item.label}
                    <Box component="span" sx={{
                      px: 0.75, borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, minWidth: 20, textAlign: 'center',
                      bgcolor: queue === item.key ? PURPLE : '#f3f4f6',
                      color: queue === item.key ? 'white' : '#6b7280',
                    }}>
                      {queueCounts[item.key] || 0}
                    </Box>
                  </Box>
                }
              />
            ))}
          </Tabs>

          {loading ? (
            <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress sx={{ color: PURPLE }} />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <PurpleTableHead columns={['Proposal', 'Review status', 'Reviewers', 'Waiting', { label: 'Actions', align: 'center' }]} />
                  <TableBody>
                    {paged.map((proposal, index) => {
                      const pi = proposal.principalInvestigator || proposal.author;
                      const budget = formatCurrency(proposal.totalBudgetAmount, proposal.budgetCurrency);
                      const days = daysWaiting(proposal);
                      const meta = [
                        (proposal.departments || []).slice(0, 2).join(', '),
                        budget || 'Budget not set',
                      ].filter(Boolean).join(' · ');
                      return (
                        <TableRow key={proposal.id} sx={zebraRowSx(index)}>
                          <TableCell sx={{ maxWidth: 420 }}>
                            <Typography
                              variant="subtitle1"
                              onClick={() => router.push(`/institution/proposals/review/${proposal.id}`)}
                              sx={{
                                fontWeight: 600,
                                color: '#2D3748',
                                fontSize: '0.95rem',
                                lineHeight: 1.3,
                                mb: 0.75,
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                '&:hover': { color: PURPLE, textDecoration: 'underline' },
                              }}
                            >
                              {proposal.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                              <Avatar sx={{ width: 22, height: 22, fontSize: '0.62rem', fontWeight: 700, bgcolor: PURPLE }}>
                                {initials(pi)}
                              </Avatar>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                <Box component="span" sx={{ color: '#374151', fontWeight: 600 }}>{pi || 'Unknown PI'}</Box>
                                {meta ? ` · ${meta}` : ''}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell><ProposalStatusCell status={proposal.status} review={proposal.review} /></TableCell>
                          <TableCell><ReviewersCell proposal={proposal} /></TableCell>
                          <TableCell>
                            {days === null ? (
                              <Typography variant="caption" color="text.secondary">—</Typography>
                            ) : (
                              <StatusPill label={`${days} day${days === 1 ? '' : 's'}`} tone={waitingTone(days)} dot={false} />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <RowActions
                              reserveMenuSpace={false}
                              actions={[
                                {
                                  key: 'open',
                                  label: 'Open review',
                                  icon: <ViewIcon fontSize="small" />,
                                  onClick: () => router.push(`/institution/proposals/review/${proposal.id}`),
                                },
                                {
                                  key: 'invite',
                                  label: 'Invite reviewers',
                                  icon: (
                                    <Badge color="warning" variant="dot" invisible={queueOf(proposal) !== 'needs_reviewers'}>
                                      <AssignIcon fontSize="small" />
                                    </Badge>
                                  ),
                                  onClick: () => openAssign(proposal),
                                },
                              ]}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!paged.length ? (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                            {proposals.length ? 'No proposals match these filters.' : 'No proposals have been submitted for review yet.'}
                          </Typography>
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
                onRowsPerPageChange={(event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={paginationSx}
              />
            </>
          )}
        </TablePaper>
      </Container>

      <Dialog open={assignOpen} onClose={() => !assigning && setAssignOpen(false)} fullWidth maxWidth="sm" disableScrollLock>
        <DialogTitle sx={{ fontWeight: 800 }}>Invite reviewers</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Invite reviewers by email. They receive the proposal link, and the researcher is notified that review has started.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Reviewer emails"
            placeholder="reviewer@university.edu, colleague@hospital.org"
            value={assignEmails}
            onChange={(event) => setAssignEmails(event.target.value)}
            helperText="Separate multiple emails with commas"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Optional message"
            value={assignMessage}
            onChange={(event) => setAssignMessage(event.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAssignOpen(false)} disabled={assigning} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitAssign}
            disabled={assigning || !assignEmails.trim()}
            sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}
          >
            {assigning ? 'Sending...' : 'Send invitations'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
