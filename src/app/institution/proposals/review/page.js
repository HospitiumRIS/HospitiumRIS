'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
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
  CheckCircle as ApproveIcon,
  Clear as ClearIcon,
  Home as HomeIcon,
  PersonAdd as AssignIcon,
  RateReview as ReviewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import PageHeader from '../../../../components/common/PageHeader';
import ProposalReviewStatus from '../../../../components/Proposals/ProposalReviewStatus';

const PURPLE = '#8b6cbc';

const statusChip = (status) => {
  const tones = {
    UNDER_REVIEW: { bg: PURPLE, color: '#fff' },
    SUBMITTED: { bg: '#0284c7', color: '#fff' },
    APPROVED: { bg: '#16a34a', color: '#fff' },
    REJECTED: { bg: '#dc2626', color: '#fff' },
    REVISION_REQUESTED: { bg: '#d97706', color: '#fff' },
    DRAFT: { bg: '#64748b', color: '#fff' },
  };
  const tone = tones[status] || tones.DRAFT;
  return (
    <Chip
      size="small"
      label={String(status || 'DRAFT').replaceAll('_', ' ')}
      sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700, textTransform: 'capitalize' }}
    />
  );
};

const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined || amount === '') return 'Not set';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount));
  } catch {
    return `${amount}`;
  }
};

const daysInReview = (proposal) => {
  if (!['UNDER_REVIEW', 'SUBMITTED'].includes(proposal.status)) return '-';
  const start = new Date(proposal.updatedAt || proposal.createdAt);
  if (Number.isNaN(start.getTime())) return '-';
  return `${Math.max(0, Math.ceil((Date.now() - start.getTime()) / 86400000))} days`;
};

export default function InstitutionProposalReviewPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState([]);
  const [tracking, setTracking] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
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
      const response = await fetch('/api/proposals?limit=100');
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load proposals');
      const items = (data.proposals || []).filter((item) => item.status !== 'DRAFT');
      setProposals(items);
      const results = await Promise.all(items.map(async (item) => {
        try {
          const res = await fetch(`/api/proposals/${item.id}/review-status`);
          if (!res.ok) return [item.id, null];
          const payload = await res.json();
          return [item.id, payload.tracking || null];
        } catch {
          return [item.id, null];
        }
      }));
      setTracking(Object.fromEntries(results));
    } catch (err) {
      setError(err.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const filtered = useMemo(() => {
    return proposals.filter((proposal) => {
      const haystack = `${proposal.title} ${proposal.principalInvestigator} ${(proposal.departments || []).join(' ')}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
      const matchesDepartment = departmentFilter === 'all'
        || (proposal.departments || []).includes(departmentFilter);
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [proposals, search, statusFilter, departmentFilter]);

  const departments = useMemo(
    () => [...new Set(proposals.flatMap((item) => item.departments || []))].sort(),
    [proposals]
  );

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const stats = {
    total: proposals.length,
    review: proposals.filter((item) => ['UNDER_REVIEW', 'SUBMITTED'].includes(item.status)).length,
    approved: proposals.filter((item) => item.status === 'APPROVED').length,
  };

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
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadProposals}
            sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}
          >
            Refresh
          </Button>
        }
      />

      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
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

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          {[
            ['Total proposals', stats.total, <ReviewIcon key="t" />],
            ['Under review', stats.review, <ReviewIcon key="r" />],
            ['Approved', stats.approved, <ApproveIcon key="a" />],
          ].map(([label, value, icon]) => (
            <Paper key={label} sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: PURPLE, color: 'white' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700 }}>{label}</Typography>
                {icon}
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{value}</Typography>
            </Paper>
          ))}
        </Stack>

        <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by title, PI, or department"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(0); }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(event) => { setStatusFilter(event.target.value); setPage(0); }}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="all">All statuses</MenuItem>
              <MenuItem value="SUBMITTED">Submitted</MenuItem>
              <MenuItem value="UNDER_REVIEW">Under review</MenuItem>
              <MenuItem value="REVISION_REQUESTED">Revision requested</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Department"
              value={departmentFilter}
              onChange={(event) => { setDepartmentFilter(event.target.value); setPage(0); }}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="all">All departments</MenuItem>
              {departments.map((department) => (
                <MenuItem key={department} value={department}>{department}</MenuItem>
              ))}
            </TextField>
            <Button startIcon={<ClearIcon />} onClick={() => { setSearch(''); setStatusFilter('all'); setDepartmentFilter('all'); }} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
              Clear
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress sx={{ color: PURPLE }} />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                      {['Proposal', 'Principal investigator', 'Status', 'Review pipeline', 'Budget', 'Time in review', 'Actions'].map((label) => (
                        <TableCell key={label} sx={{ fontWeight: 700 }}>{label}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paged.map((proposal) => (
                      <TableRow key={proposal.id} hover>
                        <TableCell sx={{ maxWidth: 360 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{proposal.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(proposal.departments || []).slice(0, 2).join(' · ') || 'No department'}
                          </Typography>
                        </TableCell>
                        <TableCell>{proposal.principalInvestigator || proposal.author}</TableCell>
                        <TableCell>{statusChip(proposal.status)}</TableCell>
                        <TableCell>
                          {tracking[proposal.id] ? (
                            <ProposalReviewStatus tracking={tracking[proposal.id]} compact />
                          ) : (
                            <Typography variant="caption" color="text.secondary">No pipeline</Typography>
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(proposal.totalBudgetAmount, proposal.budgetCurrency)}</TableCell>
                        <TableCell>{daysInReview(proposal)}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Open review">
                              <IconButton size="small" sx={{ color: PURPLE }} onClick={() => router.push(`/institution/proposals/review/${proposal.id}`)}>
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Invite reviewers">
                              <IconButton size="small" sx={{ color: PURPLE }} onClick={() => openAssign(proposal)}>
                                <AssignIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!paged.length ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                            No proposals match these filters.
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
                page={page}
                onPageChange={(_, next) => setPage(next)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); }}
              />
            </>
          )}
        </Paper>
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
