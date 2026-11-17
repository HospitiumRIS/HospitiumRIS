'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Assignment as ProjectIcon,
  CheckCircle as CompletedIcon,
  PlayCircle as ActiveIcon,
  RateReview as ReviewIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Warning as DelayedIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import RowActions from '@/components/common/RowActions';
import StatusPill, { StageBar } from '@/components/common/StatusPill';
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
import { milestoneProgress } from '@/lib/project-milestones';

// Lifecycle from submission to completion
const STAGES = [
  { key: 'SUBMITTED', label: 'Submitted', tone: 'info' },
  { key: 'UNDER_REVIEW', label: 'Under review', tone: 'progress' },
  { key: 'APPROVED', label: 'Approved', tone: 'info' },
  { key: 'ACTIVE', label: 'Active', tone: 'progress' },
  { key: 'COMPLETED', label: 'Completed', tone: 'success' },
];

const STAGE_HINTS = {
  SUBMITTED: 'Waiting for review',
  UNDER_REVIEW: 'With reviewers',
  APPROVED: 'Approved, not started',
  ACTIVE: 'In progress',
  COMPLETED: 'Past its end date',
};

function getStageIndex(proposalStatus, projectStatus) {
  if (projectStatus === 'COMPLETED') return 4;
  if (projectStatus === 'ONGOING' || projectStatus === 'DELAYED' || projectStatus === 'AT_RISK') return 3;
  if (proposalStatus === 'APPROVED') return 2;
  if (proposalStatus === 'UNDER_REVIEW') return 1;
  return 0;
}

function LifecycleCell({ project }) {
  const index = getStageIndex(project.proposalStatus, project.status);
  const stage = STAGES[index];
  const flag = project.status === 'AT_RISK' ? 'At risk' : project.status === 'DELAYED' ? 'Delayed' : null;
  const tone = flag ? (project.status === 'AT_RISK' ? 'danger' : 'warning') : stage.tone;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, minWidth: 180 }}>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        <StatusPill label={stage.label} tone={flag ? 'progress' : tone} />
        {flag && <StatusPill label={flag} tone={tone} dot={false} />}
      </Box>
      <StageBar filled={index + 1} total={STAGES.length} tone={tone} maxWidth={150} />
      <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.72rem', lineHeight: 1.3 }}>
        Stage {index + 1} of {STAGES.length} · {flag ? 'Milestones behind schedule' : STAGE_HINTS[stage.key]}
      </Typography>
    </Box>
  );
}

const formatMonth = (value) => {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null;
};

const formatCurrency = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount) || 0);
  } catch {
    return `${currency} ${Math.round(Number(amount) || 0).toLocaleString()}`;
  }
};

function TimelineCell({ project }) {
  const start = formatMonth(project.startDate);
  const end = formatMonth(project.endDate);
  const endDate = project.endDate ? new Date(project.endDate) : null;
  const daysLeft = endDate && !Number.isNaN(endDate.getTime())
    ? Math.ceil((endDate.getTime() - Date.now()) / 86400000)
    : null;
  const range = start && end ? `${start} – ${end}` : start || end || 'Dates not set';
  let note = null;
  if (daysLeft !== null && project.status !== 'COMPLETED' && project.proposalStatus === 'APPROVED') {
    note = daysLeft < 0 ? `${Math.abs(daysLeft)} days past end` : `${daysLeft} days left`;
  }
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{range}</Typography>
      {note && (
        <Typography variant="caption" sx={{ color: daysLeft < 30 ? '#b45309' : '#6b7280' }}>{note}</Typography>
      )}
    </Box>
  );
}

function MilestonesCell({ project }) {
  const { done, total, percent } = milestoneProgress(project.milestones);
  if (!total) {
    return <Typography variant="caption" color="text.secondary">No milestones yet</Typography>;
  }
  const flagged = project.status === 'DELAYED' || project.status === 'AT_RISK';
  return (
    <Box sx={{ minWidth: 130 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2937' }}>
        {done} of {total} done
      </Typography>
      <Box sx={{ mt: 0.75, height: 4, borderRadius: 2, bgcolor: '#e5e7eb', overflow: 'hidden', maxWidth: 150 }}>
        <Box sx={{ width: `${percent}%`, height: '100%', bgcolor: percent === 100 ? '#10b981' : flagged ? '#f59e0b' : PURPLE }} />
      </Box>
    </Box>
  );
}

const initials = (name) =>
  name ? name.split(' ').filter(Boolean).map((n) => n.charAt(0)).join('').substring(0, 2).toUpperCase() : '?';

const ProjectsTracking = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/institution/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const departments = useMemo(
    () => [...new Set(projects.map((p) => p.department).filter(Boolean))].sort(),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch = !term
        || (project.title || '').toLowerCase().includes(term)
        || (project.principalInvestigator || '').toLowerCase().includes(term)
        || (project.department || '').toLowerCase().includes(term);
      let matchesStatus = true;
      if (statusFilter === 'PENDING_APPROVAL') {
        matchesStatus = project.proposalStatus === 'SUBMITTED' || project.proposalStatus === 'UNDER_REVIEW';
      } else if (statusFilter !== 'all') {
        matchesStatus = project.status === statusFilter;
      }
      const matchesDepartment = departmentFilter === 'all' || project.department === departmentFilter;
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [projects, searchTerm, statusFilter, departmentFilter]);

  const lastPage = Math.max(0, Math.ceil(filteredProjects.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, lastPage);
  const pagedProjects = filteredProjects.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage);

  const isApproved = (p) => p.proposalStatus === 'APPROVED';
  const stats = {
    total: projects.length,
    completed: projects.filter((p) => p.status === 'COMPLETED').length,
    pending: projects.filter((p) => p.proposalStatus === 'SUBMITTED' || p.proposalStatus === 'UNDER_REVIEW').length,
    active: projects.filter((p) => isApproved(p) && p.status !== 'COMPLETED').length,
    flagged: projects.filter((p) => p.status === 'DELAYED' || p.status === 'AT_RISK').length,
  };

  const openProject = (id) => router.push(`/institution/projects/${id}`);
  const resetPage = () => setPage(0);

  return (
    <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
      <PageHeader
        title="Project Tracking"
        description="Monitor all ongoing projects and their progress"
        icon={<AssessmentIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Institution', path: '/institution' },
          { label: 'Administration', path: '/institution' },
          { label: 'Project Tracking' }
        ]}
        gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        actionButton={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchProjects}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: 'rgba(255, 255, 255, 0.9)',
              '&:hover': { borderColor: 'rgba(255, 255, 255, 0.6)', backgroundColor: 'rgba(255, 255, 255, 0.05)' },
              borderRadius: 2,
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
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h6" color="error" gutterBottom>
              Error Loading Projects
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {error}
            </Typography>
            <Button variant="contained" onClick={fetchProjects} sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: '#7a5caa' } }}>
              {t('common.retry')}
            </Button>
          </Paper>
        ) : (
          <>
            <StatCards cards={[
              { label: 'Total Projects', value: stats.total, sub: `${stats.completed} completed`, icon: <ProjectIcon /> },
              { label: 'Pending Review', value: stats.pending, sub: 'Awaiting approval', icon: <ReviewIcon /> },
              { label: 'Active', value: stats.active, sub: 'Approved and running', icon: <ActiveIcon /> },
              { label: 'Delayed / At Risk', value: stats.flagged, sub: 'Milestones behind schedule', icon: <DelayedIcon /> },
            ]} />

            <FilterBar
              search={searchTerm}
              onSearchChange={(value) => { setSearchTerm(value); resetPage(); }}
              searchPlaceholder="Search projects by title, PI, or department..."
              onClear={() => { setSearchTerm(''); setStatusFilter('all'); setDepartmentFilter('all'); resetPage(); }}
            >
              <TextField
                select
                className="filter-control"
                label="Stage"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
                sx={filterFieldSx}
              >
                <MenuItem value="all">All Stages</MenuItem>
                <MenuItem value="PENDING_APPROVAL">Pending / Under Review</MenuItem>
                <MenuItem value="ONGOING">Active / Ongoing</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="DELAYED">Delayed</MenuItem>
                <MenuItem value="AT_RISK">At Risk</MenuItem>
              </TextField>
              <TextField
                select
                className="filter-control"
                label="Department"
                value={departmentFilter}
                onChange={(e) => { setDepartmentFilter(e.target.value); resetPage(); }}
                sx={filterFieldSx}
              >
                <MenuItem value="all">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </TextField>
            </FilterBar>

            <TablePaper>
              {loading ? (
                <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress sx={{ color: PURPLE }} />
                </Box>
              ) : filteredProjects.length === 0 ? (
                <Box sx={{ p: 8, textAlign: 'center' }}>
                  <ProjectIcon sx={{ fontSize: 64, color: '#e5e7eb', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#6b7280', mb: 1 }}>
                    {projects.length ? t('common.no_results') : t('common.no_data')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {projects.length
                      ? 'Try adjusting your search or filters.'
                      : 'Projects will appear here once proposals are submitted.'}
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <PurpleTableHead columns={[
                        'Project',
                        'Lifecycle',
                        'Milestones',
                        'Timeline',
                        { label: 'Budget', align: 'right' },
                        { label: t('common.actions'), align: 'center' },
                      ]} />
                      <TableBody>
                        {pagedProjects.map((project, index) => (
                          <TableRow key={project.id} sx={zebraRowSx(index)}>
                            <TableCell sx={{ maxWidth: 420 }}>
                              <Typography
                                variant="subtitle1"
                                onClick={() => openProject(project.id)}
                                sx={{
                                  fontWeight: 600, color: '#2D3748', fontSize: '0.95rem', lineHeight: 1.3, mb: 0.75,
                                  display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden',
                                  cursor: 'pointer', '&:hover': { color: PURPLE, textDecoration: 'underline' },
                                }}
                              >
                                {project.title}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Avatar sx={{ width: 22, height: 22, bgcolor: PURPLE, fontSize: '0.62rem', fontWeight: 700 }}>
                                  {initials(project.principalInvestigator)}
                                </Avatar>
                                <Typography variant="caption" sx={{ color: '#374151', fontWeight: 600 }}>
                                  {project.principalInvestigator || 'Unknown PI'}
                                </Typography>
                                {project.department && (
                                  <Chip
                                    label={project.department}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(139, 108, 188, 0.1)', color: PURPLE, fontWeight: 500, fontSize: '0.7rem', height: 20, borderRadius: 1 }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell><LifecycleCell project={project} /></TableCell>
                            <TableCell><MilestonesCell project={project} /></TableCell>
                            <TableCell><TimelineCell project={project} /></TableCell>
                            <TableCell align="right">
                              {Number(project.totalBudgetAmount) > 0 ? (
                                <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {formatCurrency(project.totalBudgetAmount, project.budgetCurrency)}
                                </Typography>
                              ) : (
                                <StatusPill label="Not set" tone="warning" dot={false} />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <RowActions
                                reserveMenuSpace={false}
                                actions={[{ key: 'view', label: t('common.details'), icon: <ViewIcon fontSize="small" />, onClick: () => openProject(project.id) }]}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={filteredProjects.length}
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
          </>
        )}
      </Container>
    </Box>
  );
};

export default ProjectsTracking;
