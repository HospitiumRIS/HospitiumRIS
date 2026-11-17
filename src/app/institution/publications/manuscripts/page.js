'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Container, Typography, Paper, Chip, Avatar, Grid, Button, Stack,
  TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Tooltip, LinearProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Divider
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PageHeader from '../../../../components/common/PageHeader';
import ManuscriptStatusCell from '../../../../components/Manuscripts/ManuscriptStatusCell';
import ManuscriptRowActions from '../../../../components/Manuscripts/ManuscriptRowActions';
import { MANUSCRIPT_STAGE_ORDER, MANUSCRIPT_STAGES, getStageTranslationKey } from '../../../../lib/manuscript-workflow';

const PURPLE = '#8b6cbc';

const getInitials = (name) =>
  name ? name.split(' ').filter(Boolean).map((n) => n.charAt(0)).join('').substring(0, 2).toUpperCase() : '?';

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const now = new Date();
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((todayOnly - dateOnly) / (1000 * 60 * 60 * 24));
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `Today at ${timeStr}`;
  if (diffDays === 1) return `Yesterday at ${timeStr}`;
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/** Lead author first, then collaborators (deduplicated by name). */
const buildTeam = (m) => {
  const members = [{ name: m.createdBy, role: 'Lead author', isLead: true }];
  (m.collaborators || []).forEach((c) => {
    if (c.name && c.name !== m.createdBy) members.push({ name: c.name, role: c.role, isLead: false });
  });
  return members;
};

function StatCard({ label, value, sub, icon }) {
  return (
    <Paper sx={{
      p: 2,
      borderRadius: 2,
      bgcolor: PURPLE,
      boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
      border: 'none',
      position: 'relative',
      overflow: 'hidden',
      height: '100px',
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
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
        {sub}
      </Typography>
    </Paper>
  );
}

const selectSx = {
  borderRadius: 3,
  backgroundColor: 'rgba(255,255,255,0.8)',
  '&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PURPLE },
};

export default function InstitutionManuscriptsPage() {
  const { t } = useTranslation();
  const [manuscripts, setManuscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewing, setViewing] = useState(null);

  const loadManuscripts = useCallback(() => {
    setLoading(true);
    fetch('/api/institution/publications/manuscripts')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setManuscripts(data.manuscripts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadManuscripts();
  }, [loadManuscripts]);

  const types = useMemo(() => [...new Set(manuscripts.map((m) => m.type).filter(Boolean))], [manuscripts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return manuscripts.filter((m) => {
      const matchSearch = !q ||
        m.title?.toLowerCase().includes(q) ||
        m.createdBy?.toLowerCase().includes(q) ||
        m.field?.toLowerCase().includes(q) ||
        m.type?.toLowerCase().includes(q) ||
        (m.collaborators || []).some((c) => c.name?.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
      const matchType = typeFilter === 'ALL' || m.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [manuscripts, search, statusFilter, typeFilter]);

  // Clamp to the last page if the filters shrink the result set
  const lastPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, lastPage);
  const paginated = filtered.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage);

  const stats = {
    total: manuscripts.length,
    draft: manuscripts.filter((m) => m.status === 'DRAFT').length,
    inReview: manuscripts.filter((m) => m.status === 'IN_REVIEW' || m.status === 'UNDER_REVISION').length,
    published: manuscripts.filter((m) => m.status === 'PUBLISHED').length,
  };

  const stageLabel = (status) => t(getStageTranslationKey(status), { defaultValue: MANUSCRIPT_STAGES[status]?.label || status });

  return (
    <>
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Manuscripts"
          description="Institutional overview of all manuscripts and their writing stages"
          icon={<DescriptionIcon />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Publications', path: '/institution/publications/manuscripts' },
            { label: 'Manuscripts' }
          ]}
          actionButton={
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadManuscripts}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'rgba(255, 255, 255, 0.9)',
                '&:hover': { borderColor: 'rgba(255, 255, 255, 0.6)', backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                borderRadius: 2,
                px: 2,
                py: 1,
                textTransform: 'none',
                fontWeight: 500,
                backdropFilter: 'blur(10px)',
                minWidth: 'auto'
              }}
            >
              Refresh
            </Button>
          }
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Statistics Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard label="Total Manuscripts" value={stats.total} sub="All institutional manuscripts"
              icon={<DescriptionIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard label="Draft / Ongoing" value={stats.draft} sub="Active writing"
              icon={<EditIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard label="In Peer Review" value={stats.inReview} sub="Under review or revision"
              icon={<AccessTimeIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard label="Published" value={stats.published} sub="Completed manuscripts"
              icon={<CheckCircleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />} />
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Paper sx={{
          mb: 3,
          p: 4,
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }}>
          <Box sx={{
            display: 'flex',
            gap: 3,
            alignItems: 'center',
            flexWrap: 'wrap',
            '@media (max-width: 768px)': { flexDirection: 'column', alignItems: 'stretch' }
          }}>
            <Box sx={{ flex: '2 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                placeholder="Search manuscripts, authors, fields..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: PURPLE }} />
                    </InputAdornment>
                  ),
                  endAdornment: search && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearch('')} size="small" aria-label="Clear search">
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,1)', '& fieldset': { borderColor: PURPLE } },
                    '&.Mui-focused fieldset': { borderColor: PURPLE },
                  },
                }}
              />
            </Box>
            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={selectSx}>
                  <MenuItem value="ALL">All Status</MenuItem>
                  {MANUSCRIPT_STAGE_ORDER.map((s) => (
                    <MenuItem key={s} value={s}>{stageLabel(s)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={typeFilter} label="Type" onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={selectSx}>
                  <MenuItem value="ALL">All Types</MenuItem>
                  {types.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
              <Button
                variant="text"
                startIcon={<CloseIcon />}
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setTypeFilter('ALL');
                }}
                sx={{
                  borderRadius: 3,
                  height: '56px',
                  px: 3,
                  color: PURPLE,
                  fontWeight: 600,
                  '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.08)', color: '#7a5cac' }
                }}
              >
                Clear All
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Manuscripts Table */}
        <Paper sx={{
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(139, 108, 188, 0.08)',
          border: '1px solid rgba(139, 108, 188, 0.12)',
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfd 100%)'
        }}>
          {loading && <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: PURPLE }}>
                  <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>Team</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>Last Updated</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2, textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
                      <DescriptionIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography variant="body2" color="text.secondary">{t('common.no_results')}</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {paginated.map((m, index) => {
                  const team = buildTeam(m);
                  const shown = team.slice(0, 5);
                  const remaining = team.length - shown.length;
                  return (
                    <TableRow
                      key={m.id}
                      sx={{
                        bgcolor: index % 2 === 0 ? '#fafafa' : 'white',
                        '&:hover': { backgroundColor: '#f0f0f0' },
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      {/* Title */}
                      <TableCell sx={{ py: 2, maxWidth: 400 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Box sx={{ color: PURPLE, mt: 0.5 }}>
                            <DescriptionIcon />
                          </Box>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="subtitle1"
                              onClick={() => setViewing(m)}
                              sx={{
                                fontWeight: 600,
                                color: '#2D3748',
                                mb: 0.5,
                                fontSize: '0.95rem',
                                lineHeight: 1.3,
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                '&:hover': { color: PURPLE, textDecoration: 'underline' },
                                transition: 'color 0.2s ease'
                              }}
                            >
                              {m.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                              {m.field && (
                                <Chip
                                  label={m.field}
                                  size="small"
                                  sx={{
                                    backgroundColor: 'rgba(139, 108, 188, 0.1)',
                                    color: PURPLE,
                                    fontWeight: 500,
                                    fontSize: '0.75rem',
                                    height: 20,
                                    borderRadius: 1
                                  }}
                                />
                              )}
                              {m.wordCount > 0 && (
                                <Typography variant="caption" color="text.secondary">
                                  {m.wordCount.toLocaleString()} words
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ py: 2 }}>
                        <ManuscriptStatusCell status={m.status} type={m.type} />
                      </TableCell>

                      {/* Team */}
                      <TableCell sx={{ py: 2 }}>
                        <Tooltip
                          arrow
                          placement="top"
                          title={
                            <Box sx={{ p: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.75, display: 'block' }}>
                                Team ({team.length})
                              </Typography>
                              {team.map((member) => (
                                <Box key={`${member.name}-${member.role}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.35 }}>
                                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: member.isLead ? PURPLE : '#4caf50' }} />
                                  <Typography variant="caption">{member.name} ({member.role})</Typography>
                                </Box>
                              ))}
                            </Box>
                          }
                        >
                          <Stack direction="row" spacing={-0.5} sx={{ alignItems: 'center', width: 'fit-content', px: 0.5, py: 0.25 }}>
                            {shown.map((member, idx) => (
                              <Avatar
                                key={`${member.name}-${idx}`}
                                sx={{
                                  width: 28,
                                  height: 28,
                                  fontSize: '0.7rem',
                                  backgroundColor: member.isLead ? PURPLE : '#7c9abd',
                                  color: 'white',
                                  border: '2px solid white',
                                  fontWeight: 600,
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  zIndex: 10 - idx
                                }}
                              >
                                {getInitials(member.name)}
                              </Avatar>
                            ))}
                            {remaining > 0 && (
                              <Avatar sx={{
                                width: 28, height: 28, fontSize: '0.7rem', backgroundColor: '#f5f5f5', color: '#666',
                                border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 5, fontWeight: 600
                              }}>
                                +{remaining}
                              </Avatar>
                            )}
                          </Stack>
                        </Tooltip>
                      </TableCell>

                      {/* Last Updated */}
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatDate(m.updatedAt)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                          by {m.createdBy}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell sx={{ py: 2, textAlign: 'center' }}>
                        <ManuscriptRowActions onView={() => setViewing(m)} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filtered.length}
            page={currentPage}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{
              borderTop: '1px solid rgba(139, 108, 188, 0.12)',
              bgcolor: '#fafbfd',
              '.MuiTablePagination-toolbar': { minHeight: 52 },
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontWeight: 500, color: '#6b7280' }
            }}
          />
        </Paper>
      </Container>

      {/* Manuscript Details (read-only) */}
      <Dialog open={Boolean(viewing)} onClose={() => setViewing(null)} maxWidth="sm" fullWidth>
        {viewing && (
          <>
            <DialogTitle sx={{ pr: 6, fontWeight: 600, lineHeight: 1.35 }}>
              {viewing.title}
              <IconButton onClick={() => setViewing(null)} aria-label="Close" sx={{ position: 'absolute', right: 12, top: 12 }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mb: 2.5 }}>
                <ManuscriptStatusCell status={viewing.status} type={viewing.type} />
              </Box>
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                {[
                  ['Field', viewing.field || '—'],
                  ['Word count', viewing.wordCount ? viewing.wordCount.toLocaleString() : '—'],
                  ['Created', formatDate(viewing.createdAt)],
                  ['Last updated', formatDate(viewing.updatedAt)],
                ].map(([label, value]) => (
                  <Grid key={label} size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
                  </Grid>
                ))}
              </Grid>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Team ({buildTeam(viewing).length})
              </Typography>
              <Stack spacing={1}>
                {buildTeam(viewing).map((member, idx) => (
                  <Box key={`${member.name}-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 600, bgcolor: member.isLead ? PURPLE : '#7c9abd' }}>
                      {getInitials(member.name)}
                    </Avatar>
                    <Typography variant="body2">{member.name}</Typography>
                    <Chip
                      label={member.role}
                      size="small"
                      sx={{ height: 20, fontSize: '0.7rem', bgcolor: alpha(PURPLE, 0.1), color: PURPLE }}
                    />
                  </Box>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button onClick={() => setViewing(null)} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 600 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
