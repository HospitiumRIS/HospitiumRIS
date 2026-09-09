'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
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
} from '@mui/material';
import {
  Assignment as GrantIcon,
  BusinessCenter as BusinessIcon,
  CalendarToday as CalendarIcon,
  Cancel as CancelIcon,
  CheckCircle as AwardedIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  EmojiEvents as TrophyIcon,
  HourglassEmpty as PendingIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Send as AppliedIcon,
  ThumbDown as RejectedIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../../../components/common/PageHeader';

const STATUS_META = {
  NOT_APPLIED: { label: 'Not applied', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', icon: <PendingIcon sx={{ fontSize: 16 }} /> },
  APPLIED: { label: 'Applied', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)', icon: <AppliedIcon sx={{ fontSize: 16 }} /> },
  AWARDED: { label: 'Awarded', color: '#15803d', bg: 'rgba(21, 128, 61, 0.12)', icon: <AwardedIcon sx={{ fontSize: 16 }} /> },
  REJECTED: { label: 'Rejected', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)', icon: <RejectedIcon sx={{ fontSize: 16 }} /> },
  CANCELLED: { label: 'Cancelled', color: '#c2410c', bg: 'rgba(194, 65, 12, 0.12)', icon: <CancelIcon sx={{ fontSize: 16 }} /> },
};

function formatMoney(amount) {
  if (amount == null || amount === '') return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function StatusChip({ status }) {
  const meta = STATUS_META[status] || STATUS_META.NOT_APPLIED;
  return (
    <Chip
      size="small"
      icon={meta.icon}
      label={meta.label}
      sx={{
        backgroundColor: meta.bg,
        color: meta.color,
        fontWeight: 600,
        '& .MuiChip-icon': { color: meta.color },
      }}
    />
  );
}

function StatCard({ label, value, caption, icon }) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
      <Paper
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: '#8b6cbc',
          boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
          border: 'none',
          position: 'relative',
          overflow: 'hidden',
          height: '100px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
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
          {caption}
        </Typography>
      </Paper>
    </Grid>
  );
}

export default function GrantTrackerPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [proposals, setProposals] = useState([]);
  const [colleagues, setColleagues] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    notApplied: 0,
    applied: 0,
    awarded: 0,
    rejected: 0,
    cancelled: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    grantTrackingStatus: 'NOT_APPLIED',
    grantRequestedAmount: '',
    grantAppliedOn: '',
    grantFollowUpUserId: '',
    grantTrackingNotes: '',
  });
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');

  const fetchTracker = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/researcher/grant-tracker', { credentials: 'include' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load grant tracker');
      }
      setProposals(data.proposals || []);
      setColleagues(data.colleagues || []);
      setStats(data.stats || {
        total: 0,
        notApplied: 0,
        applied: 0,
        awarded: 0,
        rejected: 0,
        cancelled: 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to load grant tracker');
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracker();
  }, [fetchTracker]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return proposals.filter((item) => {
      const matchesStatus = statusFilter === 'All' || item.grantTrackingStatus === statusFilter;
      const haystack = [
        item.title,
        item.principalInvestigator,
        item.fundingInstitution,
        item.grantFollowUpUser?.name,
        item.grantFollowUpUser?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesStatus && (!q || haystack.includes(q));
    });
  }, [proposals, searchQuery, statusFilter]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const openUpdate = (proposal) => {
    setSelected(proposal);
    setFormError('');
    setForm({
      grantTrackingStatus: proposal.grantTrackingStatus || 'NOT_APPLIED',
      grantRequestedAmount:
        proposal.grantRequestedAmount != null
          ? String(proposal.grantRequestedAmount)
          : proposal.totalBudgetAmount != null
            ? String(proposal.totalBudgetAmount)
            : '',
      grantAppliedOn: toDateInput(proposal.grantAppliedOn) || (proposal.grantTrackingStatus === 'NOT_APPLIED' ? '' : toDateInput(new Date())),
      grantFollowUpUserId: proposal.grantFollowUpUserId || '',
      grantTrackingNotes: proposal.grantTrackingNotes || '',
    });
    setDialogOpen(true);
  };

  const handleStatusChange = (nextStatus) => {
    setForm((prev) => ({
      ...prev,
      grantTrackingStatus: nextStatus,
      grantAppliedOn:
        nextStatus === 'NOT_APPLIED'
          ? ''
          : prev.grantAppliedOn || toDateInput(new Date()),
    }));
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        grantTrackingStatus: form.grantTrackingStatus,
        grantRequestedAmount:
          form.grantRequestedAmount === '' ? null : Number(form.grantRequestedAmount),
        grantAppliedOn: form.grantAppliedOn || null,
        grantFollowUpUserId: form.grantFollowUpUserId || null,
        grantTrackingNotes: form.grantTrackingNotes,
      };
      const response = await fetch(`/api/researcher/grant-tracker/${selected.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update grant tracking');
      }
      setProposals((current) =>
        current.map((item) => (item.id === data.proposal.id ? data.proposal : item))
      );
      setDialogOpen(false);
      setToast('Grant tracking updated');
      fetchTracker();
    } catch (err) {
      setFormError(err.message || 'Failed to update grant tracking');
    } finally {
      setSaving(false);
    }
  };

  const selectedColleague =
    colleagues.find((person) => person.id === form.grantFollowUpUserId) || null;
  const needsApplicationDetails = ['APPLIED', 'AWARDED', 'REJECTED'].includes(form.grantTrackingStatus);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      <PageHeader
        title={t('researcher.grant_tracker', { defaultValue: 'Grant Tracker' })}
        description={t('researcher.grant_tracker_desc', {
          defaultValue: 'Track grant performance for proposals that have completed internal review and been approved.',
        })}
        icon={<TrophyIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher', icon: <BusinessIcon /> },
          { label: 'Projects', path: '/researcher/projects', icon: <BusinessIcon /> },
          { label: 'Proposals', path: '/researcher/projects/proposals/list', icon: <GrantIcon /> },
          { label: 'Grant Tracker' },
        ]}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <StatCard label="Total" value={stats.total} caption="Approved proposals" icon={<GrantIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />} />
          <StatCard label="Not applied" value={stats.notApplied} caption="Ready to apply" icon={<PendingIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />} />
          <StatCard label="Applied" value={stats.applied} caption="Awaiting decision" icon={<AppliedIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />} />
          <StatCard label="Awarded" value={stats.awarded} caption="Successful grants" icon={<AwardedIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />} />
          <StatCard label="Rejected" value={stats.rejected} caption="Not funded" icon={<RejectedIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />} />
          <StatCard label="Cancelled" value={stats.cancelled} caption="Withdrawn" icon={<CancelIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />} />
        </Grid>

        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth
              placeholder="Search proposal, PI, or follow-up assignee..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#8b6cbc' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchQuery('')} size="small">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="All">All statuses</MenuItem>
                {Object.entries(STATUS_META).map(([value, meta]) => (
                  <MenuItem key={value} value={value}>
                    {meta.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {loading ? (
          <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
            <GrantIcon sx={{ fontSize: 64, color: '#ddd', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#666' }}>
              Loading grant tracker...
            </Typography>
            <Box sx={{ width: 200, mx: 'auto' }}>
              <LinearProgress sx={{ height: 4, borderRadius: 2, '& .MuiLinearProgress-bar': { backgroundColor: '#8b6cbc' } }} />
            </Box>
          </Paper>
        ) : filtered.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
            <TrophyIcon sx={{ fontSize: 64, color: '#ddd', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#666' }}>
              No approved proposals to track
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Proposals appear here after they complete internal review and are approved.
            </Typography>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(139, 108, 188, 0.06)' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Proposal name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Amount applied for</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Dates</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Follow-up assignee</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((proposal) => (
                    <TableRow key={proposal.id} hover>
                      <TableCell sx={{ py: 2, maxWidth: 360 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                          {proposal.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {proposal.principalInvestigator}
                          {proposal.fundingInstitution ? ` · ${proposal.fundingInstitution}` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {proposal.grantTrackingStatus === 'NOT_APPLIED'
                            ? '—'
                            : formatMoney(proposal.grantRequestedAmount)}
                        </Typography>
                        {proposal.grantTrackingStatus === 'NOT_APPLIED' && proposal.totalBudgetAmount != null && (
                          <Typography variant="caption" color="text.secondary">
                            Budget {formatMoney(proposal.totalBudgetAmount)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.3}>
                          <Typography variant="body2">
                            Applied on: {proposal.grantAppliedOn ? formatDate(proposal.grantAppliedOn) : 'Not applied'}
                          </Typography>
                          {proposal.grantDecisionOn && ['AWARDED', 'REJECTED', 'CANCELLED'].includes(proposal.grantTrackingStatus) && (
                            <Typography variant="caption" color="text.secondary">
                              {STATUS_META[proposal.grantTrackingStatus].label} on {formatDate(proposal.grantDecisionOn)}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={proposal.grantTrackingStatus} />
                      </TableCell>
                      <TableCell>
                        {proposal.grantFollowUpUser ? (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar sx={{ width: 28, height: 28, bgcolor: '#8b6cbc', fontSize: '0.7rem' }}>
                              {initials(proposal.grantFollowUpUser.name)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {proposal.grantFollowUpUser.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {proposal.grantFollowUpUser.email}
                              </Typography>
                            </Box>
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Unassigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Tooltip title="View proposal">
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/researcher/projects/proposals/view/${proposal.id}`)}
                            sx={{ color: '#8b6cbc' }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Update tracking">
                          <IconButton size="small" onClick={() => openUpdate(proposal)} sx={{ color: '#8b6cbc' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, next) => setPage(next)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </Paper>
        )}
      </Container>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Update grant tracking</DialogTitle>
        <DialogContent>
          {selected && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selected.title}
            </Typography>
          )}
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={form.grantTrackingStatus}
                label="Status"
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                {Object.entries(STATUS_META).map(([value, meta]) => (
                  <MenuItem key={value} value={value}>
                    {meta.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Amount applied for (USD)"
              type="number"
              value={form.grantRequestedAmount}
              onChange={(e) => setForm((prev) => ({ ...prev, grantRequestedAmount: e.target.value }))}
              required={needsApplicationDetails}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              helperText={
                form.grantTrackingStatus === 'NOT_APPLIED'
                  ? 'Recorded when the proposal is submitted to a funder'
                  : undefined
              }
            />
            <TextField
              label="Applied on"
              type="date"
              value={form.grantAppliedOn}
              onChange={(e) => setForm((prev) => ({ ...prev, grantAppliedOn: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              required={needsApplicationDetails}
              disabled={form.grantTrackingStatus === 'NOT_APPLIED'}
            />
            <Autocomplete
              options={colleagues}
              value={selectedColleague}
              onChange={(_, person) =>
                setForm((prev) => ({ ...prev, grantFollowUpUserId: person?.id || '' }))
              }
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assigned to follow up"
                  placeholder="Select a colleague"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: '#8b6cbc' }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <TextField
              label="Notes"
              multiline
              minRows={3}
              value={form.grantTrackingNotes}
              onChange={(e) => setForm((prev) => ({ ...prev, grantTrackingNotes: e.target.value }))}
              placeholder="Decision details, funder feedback, next steps..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CalendarIcon />}
            sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7b5cac' } }}
          >
            {saving ? 'Saving...' : 'Save update'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast('')}
        message={toast}
      />
    </Box>
  );
}
