'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Paper, Chip, Avatar, AvatarGroup,
  TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, LinearProgress, Stack, Divider, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArticleIcon from '@mui/icons-material/Article';
import EditIcon from '@mui/icons-material/Edit';
import RateReviewIcon from '@mui/icons-material/RateReview';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import ArchiveIcon from '@mui/icons-material/Archive';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PageHeader from '../../../../components/common/PageHeader';

const STAGE_CONFIG = {
  DRAFT: {
    label: 'Draft (Ongoing)',
    color: '#f59e0b',
    bg: '#fef3c7',
    icon: <EditIcon sx={{ fontSize: 13 }} />,
    order: 1
  },
  IN_REVIEW: {
    label: 'In Review',
    color: '#3b82f6',
    bg: '#dbeafe',
    icon: <RateReviewIcon sx={{ fontSize: 13 }} />,
    order: 2
  },
  UNDER_REVISION: {
    label: 'Under Revision',
    color: '#8b5cf6',
    bg: '#ede9fe',
    icon: <AutorenewIcon sx={{ fontSize: 13 }} />,
    order: 3
  },
  PUBLISHED: {
    label: 'Published',
    color: '#10b981',
    bg: '#d1fae5',
    icon: <PublishedWithChangesIcon sx={{ fontSize: 13 }} />,
    order: 4
  },
  ARCHIVED: {
    label: 'Archived',
    color: '#6b7280',
    bg: '#f3f4f6',
    icon: <ArchiveIcon sx={{ fontSize: 13 }} />,
    order: 5
  }
};

const STAGE_ORDER = ['DRAFT', 'IN_REVIEW', 'UNDER_REVISION', 'PUBLISHED', 'ARCHIVED'];

function StagePipeline({ currentStatus }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STAGE_ORDER.map((stage, i) => {
        const cfg = STAGE_CONFIG[stage];
        const isActive = stage === currentStatus;
        const isPast = STAGE_CONFIG[currentStatus]?.order > cfg.order;
        const isLast = i === STAGE_ORDER.length - 1;
        return (
          <Box key={stage} sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={cfg.label}>
              <Box sx={{
                width: 22, height: 22, borderRadius: '50%',
                bgcolor: isActive ? cfg.color : isPast ? '#10b981' : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: isActive ? `2px solid ${cfg.color}` : isPast ? '2px solid #10b981' : '2px solid #d1d5db',
                boxShadow: isActive ? `0 0 0 3px ${cfg.bg}` : 'none',
                transition: 'all 0.2s',
                color: isActive || isPast ? 'white' : '#9ca3af',
                fontSize: 11,
              }}>
                {isPast ? '✓' : (i + 1)}
              </Box>
            </Tooltip>
            {!isLast && (
              <Box sx={{ width: 14, height: 2, bgcolor: isPast ? '#10b981' : '#e5e7eb' }} />
            )}
          </Box>
        );
      })}
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

export default function InstitutionManuscriptsPage() {
  const router = useRouter();
  const [manuscripts, setManuscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    fetch('/api/institution/publications/manuscripts')
      .then(r => r.json())
      .then(data => {
        if (data.success) setManuscripts(data.manuscripts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const types = [...new Set(manuscripts.map(m => m.type).filter(Boolean))];

  const filtered = manuscripts.filter(m => {
    const matchSearch = !search ||
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.createdBy?.toLowerCase().includes(search.toLowerCase()) ||
      m.type?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchType = typeFilter === 'ALL' || m.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const stats = {
    total: manuscripts.length,
    draft: manuscripts.filter(m => m.status === 'DRAFT').length,
    inReview: manuscripts.filter(m => m.status === 'IN_REVIEW' || m.status === 'UNDER_REVISION').length,
    published: manuscripts.filter(m => m.status === 'PUBLISHED').length,
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const formatWords = (n) => n ? `${n.toLocaleString()} words` : '—';

  return (
    <>
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Manuscripts"
          description="Institutional overview of all manuscripts and their writing stages"
          icon={<ArticleIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Publications', path: '/institution/publications/manuscripts' },
            { label: 'Manuscripts' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>

        {/* Stage Legend */}
        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(139,108,188,0.12)' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
            Writing Stages
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
            label="Total Manuscripts" 
            value={stats.total} 
            sub="All submissions"
            icon={<ArticleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />}
          />
          <StatCard 
            label="Draft / Ongoing" 
            value={stats.draft} 
            sub="Active writing" 
            icon={<EditIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />}
          />
          <StatCard 
            label="In Review / Revision" 
            value={stats.inReview} 
            sub="Awaiting feedback" 
            icon={<RateReviewIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />}
          />
          <StatCard 
            label="Published" 
            value={stats.published} 
            sub="Completed" 
            icon={<PublishedWithChangesIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />}
          />
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2.5, borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by title, author or type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ flex: '1 1 280px' }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#9ca3af', fontSize: 18 }} /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Stage</InputLabel>
            <Select value={statusFilter} label="Stage" onChange={e => setStatusFilter(e.target.value)}>
              <MenuItem value="ALL">All Stages</MenuItem>
              {STAGE_ORDER.map(s => <MenuItem key={s} value={s}>{STAGE_CONFIG[s].label}</MenuItem>)}
            </Select>
          </FormControl>
          {types.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Type</InputLabel>
              <Select value={typeFilter} label="Type" onChange={e => setTypeFilter(e.target.value)}>
                <MenuItem value="ALL">All Types</MenuItem>
                {types.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          <Typography variant="caption" sx={{ color: '#9ca3af', ml: 'auto' }}>
            {filtered.length} of {manuscripts.length} manuscripts
          </Typography>
        </Paper>

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 2.5, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {loading && <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc' } }} />}
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f7ff' }}>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #ede9fe' }}>
                  Manuscript
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #ede9fe' }}>
                  Type / Field
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #ede9fe' }}>
                  Stage
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #ede9fe' }}>
                  Progress Pipeline
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #ede9fe' }}>
                  Lead Author
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #ede9fe' }}>
                  Team
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #ede9fe' }}>
                  Word Count
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #ede9fe' }}>
                  Last Updated
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}>
                    <ArticleIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography variant="body2" color="text.secondary">No manuscripts found</Typography>
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((m, idx) => {
                const cfg = STAGE_CONFIG[m.status] || STAGE_CONFIG.DRAFT;
                return (
                  <TableRow
                    key={m.id}
                    sx={{
                      bgcolor: idx % 2 === 0 ? 'white' : '#fafafa',
                      '&:hover': { bgcolor: '#f5f3ff' },
                      transition: 'background 0.15s',
                      cursor: 'default'
                    }}
                  >
                    {/* Manuscript Title */}
                    <TableCell sx={{ maxWidth: 280, borderBottom: '1px solid #f3f4f6' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                          <ArticleIcon sx={{ fontSize: 16, color: cfg.color }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1f2937', lineHeight: 1.3, mb: 0.25 }}>
                            {m.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                            Created {formatDate(m.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Type / Field */}
                    <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                      <Stack spacing={0.5}>
                        {m.type && <Chip label={m.type} size="small" sx={{ bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 700, fontSize: '0.7rem', height: 20 }} />}
                        {m.field && <Typography variant="caption" sx={{ color: '#6b7280' }}>{m.field}</Typography>}
                      </Stack>
                    </TableCell>

                    {/* Stage Chip */}
                    <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, borderRadius: 2, bgcolor: cfg.bg, width: 'fit-content' }}>
                        <Box sx={{ color: cfg.color, display: 'flex', alignItems: 'center' }}>{cfg.icon}</Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap' }}>{cfg.label}</Typography>
                      </Box>
                    </TableCell>

                    {/* Pipeline */}
                    <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                      <StagePipeline currentStatus={m.status} />
                    </TableCell>

                    {/* Lead Author */}
                    <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#8b6cbc', fontSize: '0.72rem', fontWeight: 700 }}>
                          {m.createdBy?.charAt(0)?.toUpperCase() || 'A'}
                        </Avatar>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151' }}>{m.createdBy}</Typography>
                      </Box>
                    </TableCell>

                    {/* Team */}
                    <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                      {m.collaboratorCount > 0 ? (
                        <Tooltip title={m.collaborators.map(c => `${c.name} (${c.role})`).join(', ')}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <GroupIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                              {m.collaboratorCount} member{m.collaboratorCount > 1 ? 's' : ''}
                            </Typography>
                          </Box>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#d1d5db' }}>Solo</Typography>
                      )}
                    </TableCell>

                    {/* Word Count */}
                    <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TextFieldsIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>{formatWords(m.wordCount)}</Typography>
                      </Box>
                    </TableCell>

                    {/* Last Updated */}
                    <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>{formatDate(m.updatedAt)}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary Footer */}
        {filtered.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Typography variant="caption" sx={{ color: '#9ca3af' }}>
              Showing {filtered.length} manuscript{filtered.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        )}
      </Container>
    </>
  );
}
