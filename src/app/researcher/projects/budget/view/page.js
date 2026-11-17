'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TablePagination,
  CircularProgress,
  Button,
  Alert,
} from '@mui/material';
import {
  AccountBalance as BudgetIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
  Assignment as ProjectIcon,
  Visibility as ViewIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

import PageHeader from '../../../../../components/common/PageHeader';
import RowActions from '../../../../../components/common/RowActions';
import StatusPill, { humanizeStatus } from '../../../../../components/common/StatusPill';
import {
  BRAND_PURPLE, FilterBar, PurpleTableHead, StatCards, TablePaper, filterFieldSx, paginationSx, zebraRowSx,
} from '../../../../../components/common/ListPage';

const PROPOSAL_STATUS_TONE = {
  DRAFT: 'neutral',
  SUBMITTED: 'info',
  UNDER_REVIEW: 'progress',
  REVISION_REQUESTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

const formatMoney = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount || 0);
  } catch {
    return `${currency} ${Math.round(amount || 0).toLocaleString()}`;
  }
};

const formatRange = (start, end) => {
  const fmt = (d) => {
    const date = d ? new Date(d) : null;
    return date && !Number.isNaN(date.getTime()) ? format(date, 'MMM yyyy') : null;
  };
  const a = fmt(start);
  const b = fmt(end);
  if (a && b) return `${a} – ${b}`;
  return a || b || '—';
};
import { useAuth } from '../../../../../components/AuthProvider';
import { useTranslation } from 'react-i18next';

// Transform proposal data to budget project format.
// Only real figures: there is no expense data yet, so nothing about
// spending is shown here.
const transformProposalToBudgetProject = (proposal) => {
  let budget = {};
  if (typeof proposal.budget === 'string') {
    try {
      budget = JSON.parse(proposal.budget);
    } catch {
      budget = {};
    }
  } else if (typeof proposal.budget === 'object' && proposal.budget !== null) {
    budget = proposal.budget;
  }

  const totalBudget = parseFloat(budget.total || budget.totalBudget || proposal.totalBudgetAmount || 0) || 0;

  let piName = 'Not assigned';
  if (typeof proposal.principalInvestigator === 'string') {
    piName = proposal.principalInvestigator;
  } else if (proposal.principalInvestigator?.name) {
    piName = proposal.principalInvestigator.name;
  } else if (proposal.pi) {
    piName = proposal.pi;
  }

  return {
    id: proposal.id,
    title: proposal.title || 'Untitled Project',
    status: proposal.status || 'DRAFT',
    pi: piName,
    departments: proposal.departments || [],
    currency: proposal.budgetCurrency || 'USD',
    startDate: proposal.startDate || proposal.proposalDate,
    endDate: proposal.endDate || proposal.projectEndDate,
    totalBudget,
  };
};

const BudgetManagementPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch projects data
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/proposals', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        const proposalsArray = data.success && Array.isArray(data.proposals)
          ? data.proposals
          : Array.isArray(data) ? data : [];
        
        if (proposalsArray.length === 0) {
          console.warn('No proposals found in response:', data);
          setProjects([]);
          return;
        }
        
        const transformedProjects = proposalsArray.map(transformProposalToBudgetProject);
        
        setProjects(transformedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load project data. Please try again.');
        // Set empty projects array on error
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const budgetStats = React.useMemo(() => {
    const withBudget = projects.filter((p) => p.totalBudget > 0);
    return {
      totalBudget: withBudget.reduce((sum, p) => sum + p.totalBudget, 0),
      approvedBudget: withBudget.filter((p) => p.status === 'APPROVED').reduce((sum, p) => sum + p.totalBudget, 0),
      withBudget: withBudget.length,
      missingBudget: projects.length - withBudget.length,
      approvedCount: projects.filter((p) => p.status === 'APPROVED').length,
    };
  }, [projects]);

  const statuses = React.useMemo(() => [...new Set(projects.map((p) => p.status))], [projects]);

  const filteredProjects = projects.filter(p => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      p.pi.toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const lastPage = Math.max(0, Math.ceil(filteredProjects.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, lastPage);
  const openProject = (id) => router.push(`/researcher/projects/budget/view/${id}`);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#8b6cbc' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      <PageHeader
        title={t("researcher.budget")}
        description={t("researcher.budget_desc")}
        icon={<BudgetIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher', icon: <BusinessIcon /> },
          { label: 'Projects', path: '/researcher/projects', icon: <ProjectIcon /> },
          { label: 'Budget Management', path: '/researcher/projects/budget/view', icon: <BudgetIcon /> },
        ]}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <StatCards cards={[
          { label: 'Total Budget', value: formatMoney(budgetStats.totalBudget), sub: `Across ${budgetStats.withBudget} project${budgetStats.withBudget === 1 ? '' : 's'}`, icon: <MoneyIcon /> },
          { label: 'Approved Funding', value: formatMoney(budgetStats.approvedBudget), sub: 'Budgets on approved proposals', icon: <TrendingUpIcon /> },
          { label: 'Approved Projects', value: budgetStats.approvedCount, sub: 'Cleared internal review', icon: <AnalyticsIcon /> },
          { label: 'Budget Not Set', value: budgetStats.missingBudget, sub: 'Proposals without a budget', icon: <WarningIcon /> },
        ]} />

        <Alert severity="info" icon={<InfoIcon fontSize="inherit" />} sx={{ mb: 3, borderRadius: 2 }}>
          Spending tracking isn&apos;t set up yet, so this page shows planned budgets only.
        </Alert>

        <FilterBar
          search={searchQuery}
          onSearchChange={(value) => { setSearchQuery(value); setPage(0); }}
          searchPlaceholder="Search by title or PI..."
          onClear={() => { setSearchQuery(''); setFilterStatus('All'); setPage(0); }}
        >
          <TextField
            select
            className="filter-control"
            label="Status"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
            sx={filterFieldSx}
          >
            <MenuItem value="All">All Statuses</MenuItem>
            {statuses.map((status) => (
              <MenuItem key={status} value={status}>{humanizeStatus(status)}</MenuItem>
            ))}
          </TextField>
        </FilterBar>

        {error ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <WarningIcon sx={{ fontSize: 56, color: 'error.main', mb: 2 }} />
            <Typography variant="h6" color="error.main" sx={{ mb: 1 }}>Error Loading Projects</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{error}</Typography>
            <Button variant="contained" onClick={() => window.location.reload()} sx={{ bgcolor: BRAND_PURPLE, '&:hover': { bgcolor: '#7b5cac' } }}>
              Try Again
            </Button>
          </Paper>
        ) : (
          <TablePaper>
            <TableContainer>
              <Table>
                <PurpleTableHead columns={['Project', 'Status', { label: 'Total Budget', align: 'right' }, 'Timeline', { label: 'Actions', align: 'center' }]} />
                <TableBody>
                  {filteredProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 8 }}>
                        <BudgetIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1.5 }} />
                        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {projects.length === 0 ? 'No projects available' : 'No projects match your filters'}
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                          {projects.length === 0 ? 'Create a project proposal to start managing budgets.' : 'Try adjusting your search or status filter.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProjects
                      .slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage)
                      .map((project, index) => (
                        <TableRow key={project.id} sx={zebraRowSx(index)}>
                          <TableCell sx={{ maxWidth: 420 }}>
                            <Typography
                              variant="subtitle1"
                              onClick={() => openProject(project.id)}
                              sx={{
                                fontWeight: 600, color: '#2D3748', fontSize: '0.95rem', lineHeight: 1.3, mb: 0.5,
                                display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden',
                                cursor: 'pointer', '&:hover': { color: BRAND_PURPLE, textDecoration: 'underline' },
                              }}
                            >
                              {project.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {[project.pi, project.departments.slice(0, 2).join(', ')].filter(Boolean).join(' · ')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <StatusPill label={humanizeStatus(project.status)} tone={PROPOSAL_STATUS_TONE[project.status] || 'neutral'} />
                          </TableCell>
                          <TableCell align="right">
                            {project.totalBudget > 0 ? (
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {formatMoney(project.totalBudget, project.currency)}
                              </Typography>
                            ) : (
                              <StatusPill label="Not set" tone="warning" dot={false} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {formatRange(project.startDate, project.endDate)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <RowActions
                              reserveMenuSpace={false}
                              actions={[{ key: 'view', label: 'View budget details', icon: <ViewIcon fontSize="small" />, onClick: () => openProject(project.id) }]}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {filteredProjects.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={filteredProjects.length}
                rowsPerPage={rowsPerPage}
                page={currentPage}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                sx={paginationSx}
              />
            )}
          </TablePaper>
        )}
      </Container>
    </Box>
  );
};

export default BudgetManagementPage;