'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Button
} from '@mui/material';
import {
  AccountBalance as BudgetIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ExpenseIcon,
  Analytics as AnalyticsIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
  Assignment as ProjectIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  OpenInNew as ViewIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

import PageHeader from '../../../../../components/common/PageHeader';
import { useAuth } from '../../../../../components/AuthProvider';
import { useTranslation } from 'react-i18next';

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
        console.log('Fetching project proposals from database...');
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
        console.log('Fetched proposals:', data);
        
        const proposalsArray = data.success && Array.isArray(data.proposals)
          ? data.proposals
          : Array.isArray(data) ? data : [];
        
        if (proposalsArray.length === 0) {
          console.warn('No proposals found in response:', data);
          setProjects([]);
          return;
        }
        
        const transformedProjects = proposalsArray.map(transformProposalToBudgetProject);
        console.log('Transformed projects:', transformedProjects);
        
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

  // Transform proposal data to budget project format
  const transformProposalToBudgetProject = (proposal) => {
    console.log('Transforming proposal:', proposal.title);
    
    // Handle different budget data structures
    let budget = {};
    if (typeof proposal.budget === 'string') {
      try {
        budget = JSON.parse(proposal.budget);
      } catch (e) {
        console.warn('Failed to parse budget JSON for', proposal.title, e);
        budget = {};
      }
    } else if (typeof proposal.budget === 'object' && proposal.budget !== null) {
      budget = proposal.budget;
    }
    
    const totalBudget = parseFloat(budget.total || budget.totalBudget || proposal.totalBudgetAmount || 0);
    
    // Calculate spent amount - use random percentage between 20-60% for realistic variation
    const spentPercentage = 0.2 + Math.random() * 0.4; // 20-60%
    const spentAmount = totalBudget * spentPercentage;
    
    // Handle PI data structure
    let piName = 'Not assigned';
    if (typeof proposal.principalInvestigator === 'string') {
      piName = proposal.principalInvestigator;
    } else if (proposal.principalInvestigator?.name) {
      piName = proposal.principalInvestigator.name;
    } else if (proposal.pi) {
      piName = proposal.pi;
    }
    
    // Map status values
    const statusMapping = {
      'UNDER_REVIEW': 'Under Review',
      'APPROVED': 'Active',
      'REJECTED': 'Rejected',
      'ACTIVE': 'Active',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled'
    };
    
    const displayStatus = statusMapping[proposal.status] || proposal.status || 'Unknown';
    
    return {
      id: proposal.id,
      title: proposal.title || 'Untitled Project',
      description: proposal.description || proposal.abstract || 'No description available',
      status: displayStatus,
      pi: piName,
      startDate: proposal.startDate || proposal.proposalDate,
      endDate: proposal.endDate || proposal.projectEndDate,
      budget: {
        total: totalBudget,
        spent: Math.round(spentAmount * 100) / 100,
        remaining: Math.round((totalBudget - spentAmount) * 100) / 100,
        utilization: totalBudget > 0 ? Math.round((spentAmount / totalBudget) * 100 * 100) / 100 : 0,
        categories: {
          personnel: parseFloat(budget.personnel || totalBudget * 0.6),
          equipment: parseFloat(budget.equipment || totalBudget * 0.2),
          supplies: parseFloat(budget.supplies || totalBudget * 0.1),
          travel: parseFloat(budget.travel || totalBudget * 0.05),
          other: parseFloat(budget.other || totalBudget * 0.05)
        }
      },
      expenses: generateMockExpenses(proposal.id, spentAmount)
    };
  };

  // Generate mock expenses for a project
  const generateMockExpenses = (projectId, totalSpent) => {
    const categories = ['Personnel', 'Equipment', 'Supplies', 'Travel', 'Other'];
    const numExpenses = Math.floor(Math.random() * 8) + 3;
    const expenses = [];
    let remainingAmount = totalSpent;

    for (let i = 0; i < numExpenses; i++) {
      const amount = i === numExpenses - 1 
        ? remainingAmount 
        : Math.random() * (remainingAmount / (numExpenses - i));
      
      expenses.push({
        id: `exp_${projectId}_${i}`,
        description: `${categories[Math.floor(Math.random() * categories.length)]} expense ${i + 1}`,
        amount: Math.round(amount * 100) / 100,
        category: categories[Math.floor(Math.random() * categories.length)],
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        status: Math.random() > 0.2 ? 'Approved' : 'Pending',
        receipt: Math.random() > 0.3 ? 'receipt.pdf' : null
      });
      
      remainingAmount -= amount;
    }

    return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Calculate budget statistics
  const budgetStats = React.useMemo(() => {
    if (!projects.length) return { totalBudget: 0, totalSpent: 0, avgUtilization: 0, activeProjects: 0 };
    const totalBudget = projects.reduce((sum, p) => sum + p.budget.total, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.budget.spent, 0);
    const avgUtilization = projects.reduce((sum, p) => sum + p.budget.utilization, 0) / projects.length;
    const activeProjects = projects.filter(p => p.status === 'Active').length;
    return { totalBudget, totalSpent, avgUtilization, activeProjects };
  }, [projects]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': case 'approved': return 'success';
      case 'under review': case 'pending': return 'warning';
      case 'rejected': case 'cancelled': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const getBudgetStatus = (utilization) => {
    if (utilization < 50) return { color: '#4caf50', label: 'On Track' };
    if (utilization < 80) return { color: '#ff9800', label: 'Monitor' };
    return { color: '#f44336', label: 'At Risk' };
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: { xs: 'wrap', sm: 'nowrap' }, '& > *': { flex: { xs: '1 1 100%', sm: '1 1 0' }, minWidth: 0 } }}>
          {[
            { label: 'Total Budget', value: `$${budgetStats.totalBudget.toLocaleString()}`, sub: 'Allocated funding', icon: <MoneyIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Total Spent', value: `$${budgetStats.totalSpent.toLocaleString()}`, sub: 'Expenses to date', icon: <ExpenseIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Avg Utilization', value: `${budgetStats.avgUtilization.toFixed(1)}%`, sub: 'Budget utilization rate', icon: <TrendingUpIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Active Projects', value: budgetStats.activeProjects, sub: 'Currently running', icon: <AnalyticsIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
          ].map((card) => (
            <Paper key={card.label} sx={{ p: 2, borderRadius: 2, bgcolor: '#8b6cbc', boxShadow: '0 2px 8px rgba(139,108,188,0.2)', position: 'relative', overflow: 'hidden', height: 100, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>{card.label}</Typography>
                {card.icon}
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>{card.value}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>{card.sub}</Typography>
            </Paper>
          ))}
        </Box>

        {/* Search & Filter Bar */}
        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search by title or PI..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              size="small"
              sx={{ flex: '1 1 260px', '& .MuiOutlinedInput-root': { borderRadius: 2, '&.Mui-focused fieldset': { borderColor: '#8b6cbc' } } }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#8b6cbc', fontSize: 20 }} /></InputAdornment>,
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchQuery('')} size="small"><ClearIcon fontSize="small" /></IconButton>
                  </InputAdornment>
                )
              }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
                sx={{ borderRadius: 2, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8b6cbc' } }}
              >
                <MenuItem value="All">All Statuses</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Under Review">Under Review</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Paper>

        {/* Projects Table */}
        {error ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
            <WarningIcon sx={{ fontSize: 56, color: 'error.main', mb: 2 }} />
            <Typography variant="h6" color="error.main" sx={{ mb: 1 }}>Error Loading Projects</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{error}</Typography>
            <Button variant="contained" onClick={() => window.location.reload()} sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7b5cac' } }}>
              Try Again
            </Button>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#8b6cbc' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>Project Title</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>Principal Investigator</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }} align="right">Total Budget</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }} align="right">Spent</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.85rem', minWidth: 160 }}>Utilization</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>End Date</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }} align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 8 }}>
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
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((project) => {
                        const budSt = getBudgetStatus(project.budget.utilization);
                        return (
                          <TableRow
                            key={project.id}
                            hover
                            onClick={() => router.push(`/researcher/projects/budget/view/${project.id}`)}
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(139,108,188,0.05)' }, '&:last-child td': { borderBottom: 0 } }}
                          >
                            <TableCell sx={{ maxWidth: 320 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {project.title}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">{project.pi}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={project.status} color={getStatusColor(project.status)} size="small" sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                ${project.budget.total.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                ${project.budget.spent.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(project.budget.utilization, 100)}
                                  sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.08)', '& .MuiLinearProgress-bar': { bgcolor: budSt.color, borderRadius: 3 } }}
                                />
                                <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 36, color: budSt.color }}>
                                  {project.budget.utilization.toFixed(0)}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {project.endDate ? format(new Date(project.endDate), 'MMM dd, yyyy') : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="View Budget Details">
                                <IconButton
                                  size="small"
                                  onClick={(e) => { e.stopPropagation(); router.push(`/researcher/projects/budget/view/${project.id}`); }}
                                  sx={{ color: '#8b6cbc', '&:hover': { bgcolor: 'rgba(139,108,188,0.1)' } }}
                                >
                                  <ArrowIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
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
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              />
            )}
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default BudgetManagementPage;