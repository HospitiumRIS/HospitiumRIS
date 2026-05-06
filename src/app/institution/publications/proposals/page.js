'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Paper, Chip, Avatar,
  TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, LinearProgress, Stack, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SendIcon from '@mui/icons-material/Send';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ReplayIcon from '@mui/icons-material/Replay';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PageHeader from '../../../../components/common/PageHeader';

const STAGE_CONFIG = {
  DRAFT: {
    label: 'Drafting',
    color: '#f59e0b',
    bg: '#fef3c7',
    icon: <EditNoteIcon sx={{ fontSize: 13 }} />,
    order: 1
  },
  SUBMITTED: {
    label: 'Submitted',
    color: '#3b82f6',
    bg: '#dbeafe',
    icon: <SendIcon sx={{ fontSize: 13 }} />,
    order: 2
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    color: '#8b5cf6',
    bg: '#ede9fe',
    icon: <FindInPageIcon sx={{ fontSize: 13 }} />,
    order: 3
  },
  APPROVED: {
    label: 'Approved',
    color: '#10b981',
    bg: '#d1fae5',
    icon: <CheckCircleIcon sx={{ fontSize: 13 }} />,
    order: 4
  },
  REVISION_REQUESTED: {
    label: 'Revision Requested',
    color: '#f97316',
    bg: '#ffedd5',
    icon: <ReplayIcon sx={{ fontSize: 13 }} />,
    order: 5
  },
  REJECTED: {
    label: 'Rejected',
    color: '#ef4444',
    bg: '#fee2e2',
    icon: <CancelIcon sx={{ fontSize: 13 }} />,
    order: 6
  }
};

const STAGE_ORDER = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED'];
const PIPELINE_STAGES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'];

function StagePipeline({ currentStatus }) {
  const currentOrder = STAGE_CONFIG[currentStatus]?.order ?? 0;
  const isRejected = currentStatus === 'REJECTED';
  const isRevision = currentStatus === 'REVISION_REQUESTED';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {PIPELINE_STAGES.map((stage, i) => {
        const cfg = STAGE_CONFIG[stage];
        const isActive = stage === currentStatus;
        const isPast = !isRejected && !isRevision && STAGE_CONFIG[currentStatus]?.order > cfg.order;
        const isLast = i === PIPELINE_STAGES.length - 1;
        return (
          <Box key={stage} sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={cfg.label}>
              <Box sx={{
                width: 22, height: 22, borderRadius: '50%',
                bgcolor: isActive ? cfg.color : isPast ? '#10b981' : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: isActive ? `2px solid ${cfg.color}` : isPast ? '2px solid #10b981' : '2px solid #d1d5db',
                boxShadow: isActive ? `0 0 0 3px ${cfg.bg}` : 'none',
                color: isActive || isPast ? 'white' : '#9ca3af',
                fontSize: 11,
              }}>
                {isPast ? '✓' : (i + 1)}
              </Box>
            </Tooltip>
            {!isLast && <Box sx={{ width: 14, height: 2, bgcolor: isPast ? '#10b981' : '#e5e7eb' }} />}
          </Box>
        );
      })}
      {(isRejected || isRevision) && (
        <Tooltip title={STAGE_CONFIG[currentStatus].label}>
          <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 14, height: 2, bgcolor: isRejected ? '#ef4444' : '#f97316' }} />
            <Box sx={{
              width: 22, height: 22, borderRadius: '50%',
              bgcolor: isRejected ? '#ef4444' : '#f97316',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 11,
            }}>
              {isRejected ? '✕' : '↩'}
            </Box>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
}

function StatCard({ label, value, sub, icon }) {
  return (
    <Paper sx={{ 
      p: 2, 
      borderRadius: 2,
      bgcolor: '#8b6cbc',
      boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
      border: 'none',
      position: 'relative',
      overflow: 'hidden',
      height: '100px',
      flex: 1,
      minWidth: '200px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
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
      {sub && (
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

export default function InstitutionProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetch('/api/institution/publications/proposals')
      .then(r => r.json())
      .then(data => { if (data.success) setProposals(data.proposals); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = proposals.filter(p => {
    const matchSearch = !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.principalInvestigator?.toLowerCase().includes(search.toLowerCase()) ||
      (p.departments || []).some(d => d.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: proposals.length,
    drafting: proposals.filter(p => p.status === 'DRAFT').length,
    inProgress: proposals.filter(p => ['SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED'].includes(p.status)).length,
    approved: proposals.filter(p => p.status === 'APPROVED').length,
    rejected: proposals.filter(p => p.status === 'REJECTED').length,
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const formatCurrency = (v) => v ? `$${Number(v).toLocaleString()}` : '—';

  return (
    <>
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Research Proposals"
          description="Institutional overview of all research proposals and their submission stages"
          icon={<DescriptionIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Publications', path: '/institution/publications/proposals' },
            { label: 'Proposals' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>

        {/* Stage Legend */}
        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(139,108,188,0.12)' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
            Proposal Writing Stages
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {STAGE_ORDER.map(stage => {
              const cfg = STAGE_CONFIG[stage];
              return (
                <Box key={stage} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.5, borderRadius: 2, bgcolor: cfg.bg, border: `1px solid ${cfg.color}22` }}>
                  <Box sx={{ color: cfg.color, display: 'flex', alignItems: 'center' }}>{cfg.icon}</Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: cfg.color }}>{cfg.label}</Typography>
                </Box>
              );
            })}
          </Box>
        </Paper>

        {/* Statistics Cards */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2.5, 
          flexWrap: 'wrap',
          mb: 4
        }}>
          <StatCard 
            label="Total Proposals" 
            value={stats.total} 
            sub="All submissions"
            icon={<DescriptionIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />}
          />
          <StatCard 
            label="Drafting" 
            value={stats.drafting} 
            sub="Being written" 
            icon={<EditNoteIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />}
          />
          <StatCard 
            label="In Progress" 
            value={stats.inProgress} 
            sub="Submitted / Under review" 
            icon={<FindInPageIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />}
          />
          <StatCard 
            label="Approved" 
            value={stats.approved} 
            sub="Active projects" 
            icon={<CheckCircleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />}
          />
          <StatCard 
            label="Rejected" 
            value={stats.rejected} 
            sub="Not approved"
            icon={<CancelIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />}
          />
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2.5, borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by title, PI or department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ flex: '1 1 280px' }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#9ca3af', fontSize: 18 }} /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Stage</InputLabel>
            <Select value={statusFilter} label="Stage" onChange={e => setStatusFilter(e.target.value)}>
              <MenuItem value="ALL">All Stages</MenuItem>
              {STAGE_ORDER.map(s => <MenuItem key={s} value={s}>{STAGE_CONFIG[s].label}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="caption" sx={{ color: '#9ca3af', ml: 'auto' }}>
            {filtered.length} of {proposals.length} proposals
          </Typography>
        </Paper>

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 2.5, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {loading && <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc' } }} />}
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f7ff' }}>
                {['Proposal', 'Department / Area', 'Stage', 'Progress Pipeline', 'Principal Investigator', 'Team', 'Budget', 'Last Updated'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #ede9fe' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}>
                    <DescriptionIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography variant="body2" color="text.secondary">No proposals found</Typography>
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p, idx) => {
                const cfg = STAGE_CONFIG[p.status] || STAGE_CONFIG.DRAFT;
                return (
                  <TableRow
                    key={p.id}
                    onClick={() => router.push(`/institution/projects/${p.id}`)}
                    sx={{
                      bgcolor: idx % 2 === 0 ? 'white' : '#fafafa',
                      '&:hover': { bgcolor: '#f5f3ff', cursor: 'pointer' },
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Title */}
                    <TableCell sx={{ maxWidth: 280, borderBottom: '1px solid #f3f4f6' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                          <DescriptionIcon sx={{ fontSize: 16, color: cfg.color }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1f2937', lineHeight: 1.3, mb: 0.25 }}>
                            {p.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                            Created {formatDate(p.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Department / Area */}
                    <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                      <Stack spacing={0.5}>
                        {p.departments?.slice(0, 2).map((d, i) => (
                          <Chip key={i} label={d} size="small" sx={{ bgcolor: 'rgba(139,108,188,0.08)', color: '#8b6cbc', fontWeight: 700, fontSize: '0.7rem', height: 20 }} />
                        ))}
                        {p.researchAreas?.length > 0 && (
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>{p.researchAreas[0]}</Typography>
                        )}
                      </Stack>
                    </TableCell>

                    {/* Stage chip */}
                    <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, borderRadius: 2, bgcolor: cfg.bg, width: 'fit-content' }}>
                        <Box sx={{ color: cfg.color, display: 'flex', alignItems: 'center' }}>{cfg.icon}</Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap' }}>{cfg.label}</Typography>
                      </Box>
                    </TableCell>

                    {/* Pipeline */}
                    <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                      <StagePipeline currentStatus={p.status} />
                    </TableCell>

                    {/* PI */}
                    <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#8b6cbc', fontSize: '0.72rem', fontWeight: 700 }}>
                          {p.principalInvestigator?.charAt(0)?.toUpperCase() || 'P'}
                        </Avatar>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151' }}>{p.principalInvestigator || 'N/A'}</Typography>
                      </Box>
                    </TableCell>

                    {/* Team */}
                    <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                      {p.coInvestigatorCount > 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <GroupIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                            +{p.coInvestigatorCount} co-PI{p.coInvestigatorCount > 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#d1d5db' }}>Solo PI</Typography>
                      )}
                    </TableCell>

                    {/* Budget */}
                    <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccountBalanceIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: p.totalBudgetAmount ? '#059669' : '#9ca3af' }}>
                          {formatCurrency(p.totalBudgetAmount)}
                        </Typography>
                      </Box>
                      {p.fundingSource && (
                        <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>{p.fundingSource}</Typography>
                      )}
                    </TableCell>

                    {/* Last Updated */}
                    <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>{formatDate(p.updatedAt)}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {filtered.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Typography variant="caption" sx={{ color: '#9ca3af' }}>
              Showing {filtered.length} proposal{filtered.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        )}
      </Container>
    </>
  );
}
