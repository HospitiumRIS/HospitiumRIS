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
  Divider,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Card,
  InputAdornment
} from '@mui/material';
import {
  AccountBalance as BudgetIcon,
  Receipt as ExpenseIcon,
  Analytics as AnalyticsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
  Assignment as ProjectIcon,
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  Cancel as RejectedIcon,
  Description as ReportIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useRouter, useParams } from 'next/navigation';

import PageHeader from '../../../../../../components/common/PageHeader';
import { useAuth } from '../../../../../../components/AuthProvider';
import { useTranslation } from 'react-i18next';

const transformProposalToBudgetProject = (proposal) => {
  let budget = {};
  if (typeof proposal.budget === 'string') {
    try { budget = JSON.parse(proposal.budget); } catch { budget = {}; }
  } else if (typeof proposal.budget === 'object' && proposal.budget !== null) {
    budget = proposal.budget;
  }

  const totalBudget = parseFloat(budget.total || budget.totalBudget || proposal.totalBudgetAmount || 0);

  const seed = proposal.id ? proposal.id.charCodeAt(0) / 255 : 0.35;
  const spentPercentage = 0.2 + seed * 0.4;
  const spentAmount = totalBudget * spentPercentage;

  let piName = 'Not assigned';
  if (typeof proposal.principalInvestigator === 'string') piName = proposal.principalInvestigator;
  else if (proposal.principalInvestigator?.name) piName = proposal.principalInvestigator.name;
  else if (proposal.pi) piName = proposal.pi;

  const statusMapping = {
    'UNDER_REVIEW': 'Under Review', 'APPROVED': 'Active', 'REJECTED': 'Rejected',
    'ACTIVE': 'Active', 'COMPLETED': 'Completed', 'DRAFT': 'Draft', 'CANCELLED': 'Cancelled'
  };

  return {
    id: proposal.id,
    title: proposal.title || 'Untitled Project',
    description: proposal.description || proposal.abstract || 'No description available',
    status: statusMapping[proposal.status] || proposal.status || 'Unknown',
    pi: piName,
    department: proposal.department || proposal.researchAreas?.[0] || 'Research',
    startDate: proposal.startDate || proposal.proposalDate,
    endDate: proposal.endDate || proposal.projectEndDate,
    fundingSource: proposal.fundingInstitution || proposal.fundingSource || 'Not specified',
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
    }
  };
};

const generateMockExpenses = (projectId, totalSpent) => {
  const categories = ['Personnel', 'Equipment', 'Supplies', 'Travel', 'Other'];
  const descriptions = [
    'Staff salaries Q1', 'Lab equipment purchase', 'Research supplies', 'Conference travel',
    'Software licenses', 'Participant compensation', 'Data storage', 'Printing & materials',
    'Consultant fees', 'Workshop registration'
  ];
  const numExpenses = 8;
  const expenses = [];
  let remaining = totalSpent;

  for (let i = 0; i < numExpenses; i++) {
    const amount = i === numExpenses - 1
      ? remaining
      : remaining * (0.1 + (i * 0.05));
    expenses.push({
      id: `exp_${projectId}_${i}`,
      description: descriptions[i % descriptions.length],
      amount: Math.max(0, Math.round(amount * 100) / 100),
      category: categories[i % categories.length],
      date: new Date(Date.now() - (numExpenses - i) * 12 * 24 * 60 * 60 * 1000),
      status: i % 5 === 0 ? 'Pending' : 'Approved',
      receipt: i % 3 !== 0
    });
    remaining -= amount;
  }

  return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const BudgetDetailPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [project, setProject] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [expensePage, setExpensePage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('All');
  const [addExpenseDialog, setAddExpenseDialog] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!id) return;
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/proposals/${id}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const proposal = data.proposal || data;
        const transformed = transformProposalToBudgetProject(proposal);
        setProject(transformed);
        setExpenses(generateMockExpenses(transformed.id, transformed.budget.spent));
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

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
    if (utilization < 50) return { color: '#4caf50', label: 'On Track', chipColor: 'success' };
    if (utilization < 80) return { color: '#ff9800', label: 'Monitor', chipColor: 'warning' };
    return { color: '#f44336', label: 'At Risk', chipColor: 'error' };
  };

  const handleAddExpense = () => {
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.category) return;
    const newExpense = {
      id: `exp_${id}_${Date.now()}`,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      date: new Date(expenseForm.date),
      status: 'Pending',
      receipt: false
    };
    setExpenses(prev => [newExpense, ...prev]);
    setProject(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        spent: prev.budget.spent + newExpense.amount,
        remaining: prev.budget.remaining - newExpense.amount,
        utilization: ((prev.budget.spent + newExpense.amount) / prev.budget.total) * 100
      }
    }));
    setExpenseForm({ description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0] });
    setAddExpenseDialog(false);
  };

  const filteredExpenses = expenses.filter(e => filterStatus === 'All' || e.status === filterStatus);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#8b6cbc' }} />
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
        <PageHeader
          title={t("researcher.budget_details")}
          icon={<BudgetIcon />}
          breadcrumbs={[
            { label: 'Dashboard', path: '/researcher', icon: <BusinessIcon /> },
            { label: 'Budget Management', path: '/researcher/projects/budget/view', icon: <BudgetIcon /> },
            { label: 'Details', icon: <ProjectIcon /> },
          ]}
          sx={{ mt: '80px' }}
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
            <WarningIcon sx={{ fontSize: 56, color: 'error.main', mb: 2 }} />
            <Typography variant="h6" color="error.main" sx={{ mb: 1 }}>Project Not Found</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{error || 'The requested project could not be loaded.'}</Typography>
            <Button
              variant="contained"
              startIcon={<BackIcon />}
              onClick={() => router.push('/researcher/projects/budget/view')}
              sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7b5cac' } }}
            >
              Back to Budget Management
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  const budSt = getBudgetStatus(project.budget.utilization);

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      <PageHeader
        title={project.title}
        description={`Budget management for ${project.pi}`}
        icon={<BudgetIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher', icon: <BusinessIcon /> },
          { label: 'Budget Management', path: '/researcher/projects/budget/view', icon: <BudgetIcon /> },
          { label: 'Project Details', icon: <ProjectIcon /> },
        ]}
        actionButton={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => router.push('/researcher/projects/budget/view')}
              sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              All Projects
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddExpenseDialog(true)}
              sx={{ bgcolor: 'white', color: '#8b6cbc', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
            >
              Add Expense
            </Button>
          </Box>
        }
        sx={{ mt: '80px' }}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>

        {/* Mini Stats */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: { xs: 'wrap', sm: 'nowrap' }, '& > *': { flex: { xs: '1 1 100%', sm: '1 1 0' }, minWidth: 0 } }}>
          {[
            { label: 'Total Budget', value: `$${project.budget.total.toLocaleString()}`, sub: 'Approved allocation', icon: <MoneyIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Amount Spent', value: `$${project.budget.spent.toLocaleString()}`, sub: 'Expenses to date', icon: <ExpenseIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Remaining', value: `$${project.budget.remaining.toLocaleString()}`, sub: 'Available balance', icon: <TrendingUpIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Utilization', value: `${project.budget.utilization.toFixed(1)}%`, sub: budSt.label, icon: <AnalyticsIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
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

        {/* Tabs */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
            <Tabs
              value={currentTab}
              onChange={(_, v) => setCurrentTab(v)}
              sx={{
                px: 3,
                '& .MuiTab-root': { minHeight: 52, fontWeight: 600, fontSize: '0.85rem', textTransform: 'none', color: 'text.secondary', '&.Mui-selected': { color: '#8b6cbc' } },
                '& .MuiTabs-indicator': { bgcolor: '#8b6cbc', height: 3, borderRadius: '3px 3px 0 0' }
              }}
            >
              <Tab label="Budget Overview" />
              <Tab label="Expense Tracking" />
              <Tab label="Budget Analysis" />
              <Tab label="Financial Reports" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3, bgcolor: 'white' }}>

            {/* ── Tab 0: Budget Overview ── */}
            {currentTab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                {/* Budget Summary + Categories row */}
                <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' }, '& > *': { flex: { xs: '1 1 100%', md: '1 1 0' }, minWidth: 0 } }}>

                  {/* Budget Summary Card */}
                  <Card elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#8b6cbc', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MoneyIcon fontSize="small" /> Budget Summary
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {[
                        { label: 'Total Budget', value: `$${project.budget.total.toLocaleString()}`, color: 'text.primary' },
                        { label: 'Amount Spent', value: `$${project.budget.spent.toLocaleString()}`, color: 'error.main' },
                        { label: 'Remaining', value: `$${project.budget.remaining.toLocaleString()}`, color: 'success.main' },
                      ].map(({ label, value, color }) => (
                        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">{label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color }}>{value}</Typography>
                        </Box>
                      ))}
                      <Divider sx={{ my: 0.5 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Utilization</Typography>
                        <Chip label={`${project.budget.utilization.toFixed(1)}% — ${budSt.label}`} size="small" color={budSt.chipColor} sx={{ fontWeight: 700 }} />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(project.budget.utilization, 100)}
                        sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(0,0,0,0.07)', '& .MuiLinearProgress-bar': { bgcolor: budSt.color, borderRadius: 4 } }}
                      />
                    </Box>
                  </Card>

                  {/* Budget Categories Card */}
                  <Card elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#8b6cbc', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AnalyticsIcon fontSize="small" /> Allocation by Category
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {project.budget.total > 0 ? Object.entries(project.budget.categories).map(([cat, amt]) => (
                        <Box key={cat}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 500 }}>{cat}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>${amt.toLocaleString()}</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(amt / project.budget.total) * 100}
                            sx={{ height: 5, borderRadius: 3, bgcolor: 'rgba(139,108,188,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc', borderRadius: 3 } }}
                          />
                        </Box>
                      )) : (
                        <Typography variant="body2" color="text.secondary">No budget allocated.</Typography>
                      )}
                    </Box>
                  </Card>
                </Box>

                {/* Project Information */}
                <Card elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#8b6cbc' }}>Project Information</Typography>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', '& > *': { flex: '1 1 220px' } }}>
                    {[
                      { label: 'Principal Investigator', value: project.pi },
                      { label: 'Department / Area', value: project.department },
                      { label: 'Funding Source', value: project.fundingSource },
                      { label: 'Start Date', value: project.startDate ? format(new Date(project.startDate), 'MMM dd, yyyy') : 'Not set' },
                      { label: 'End Date', value: project.endDate ? format(new Date(project.endDate), 'MMM dd, yyyy') : 'Not set' },
                    ].map(({ label, value }) => (
                      <Box key={label}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>{label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>{value}</Typography>
                      </Box>
                    ))}
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>Status</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip label={project.status} color={getStatusColor(project.status)} size="small" sx={{ fontWeight: 600 }} />
                      </Box>
                    </Box>
                  </Box>
                </Card>
              </Box>
            )}

            {/* ── Tab 1: Expense Tracking ── */}
            {currentTab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50' }}>Expense Tracking</Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <InputLabel>Status</InputLabel>
                      <Select value={filterStatus} label="Status" onChange={(e) => { setFilterStatus(e.target.value); setExpensePage(0); }}>
                        <MenuItem value="All">All</MenuItem>
                        <MenuItem value="Approved">Approved</MenuItem>
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddExpenseDialog(true)}
                      sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7b5cac' }, fontWeight: 600 }}>
                      Add Expense
                    </Button>
                  </Box>
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(139,108,188,0.08)' }}>
                        <TableCell sx={{ fontWeight: 700, color: '#2c3e50' }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#2c3e50' }} align="right">Amount</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#2c3e50' }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#2c3e50' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#2c3e50' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#2c3e50' }}>Receipt</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#2c3e50' }} align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredExpenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                            No expenses found for the selected filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredExpenses.slice(expensePage * rowsPerPage, expensePage * rowsPerPage + rowsPerPage).map((expense) => (
                          <TableRow key={expense.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{expense.description}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>${expense.amount.toLocaleString()}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={expense.category} size="small" variant="outlined" sx={{ fontSize: '0.72rem' }} />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">{format(new Date(expense.date), 'MMM dd, yyyy')}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={expense.status} size="small"
                                color={expense.status === 'Approved' ? 'success' : expense.status === 'Pending' ? 'warning' : 'error'}
                                sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
                            </TableCell>
                            <TableCell>
                              {expense.receipt
                                ? <Chip label="Available" size="small" color="success" variant="outlined" sx={{ fontSize: '0.72rem' }} />
                                : <Chip label="Missing" size="small" color="default" variant="outlined" sx={{ fontSize: '0.72rem' }} />}
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                <Tooltip title="Edit">
                                  <IconButton size="small" sx={{ color: '#8b6cbc' }}><EditIcon fontSize="small" /></IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredExpenses.length}
                    rowsPerPage={rowsPerPage}
                    page={expensePage}
                    onPageChange={(_, p) => setExpensePage(p)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setExpensePage(0); }}
                  />
                </TableContainer>
              </Box>
            )}

            {/* ── Tab 2: Budget Analysis ── */}
            {currentTab === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50' }}>Budget Analysis</Typography>

                {/* Spending breakdown */}
                <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' }, '& > *': { flex: { xs: '1 1 100%', md: '1 1 0' }, minWidth: 0 } }}>
                  <Card elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#8b6cbc' }}>Spending by Category</Typography>
                    {project.budget.total > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {Object.entries(project.budget.categories).map(([cat, amt]) => {
                          const pct = Math.round((amt / project.budget.total) * 100);
                          return (
                            <Box key={cat}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>{cat}</Typography>
                                <Typography variant="body2" color="text.secondary">{pct}% · ${amt.toLocaleString()}</Typography>
                              </Box>
                              <LinearProgress variant="determinate" value={pct}
                                sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(139,108,188,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc', borderRadius: 4 } }} />
                            </Box>
                          );
                        })}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No budget data available.</Typography>
                    )}
                  </Card>

                  <Card elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#8b6cbc' }}>Budget Health</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[
                        { label: 'Burn Rate', value: project.budget.total > 0 ? `${project.budget.utilization.toFixed(1)}%` : 'N/A', icon: <TrendingUpIcon sx={{ color: budSt.color }} />, sub: 'of budget consumed' },
                        { label: 'Remaining Balance', value: `$${project.budget.remaining.toLocaleString()}`, icon: <MoneyIcon sx={{ color: '#4caf50' }} />, sub: 'available to spend' },
                        { label: 'Total Expenses', value: expenses.length, icon: <ExpenseIcon sx={{ color: '#8b6cbc' }} />, sub: 'recorded transactions' },
                        { label: 'Pending Approvals', value: expenses.filter(e => e.status === 'Pending').length, icon: <PendingIcon sx={{ color: '#ff9800' }} />, sub: 'awaiting review' },
                      ].map(({ label, value, icon, sub }) => (
                        <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                          {icon}
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{value}</Typography>
                            <Typography variant="caption" color="text.disabled">{sub}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Card>
                </Box>
              </Box>
            )}

            {/* ── Tab 3: Financial Reports ── */}
            {currentTab === 3 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50' }}>Financial Reports</Typography>
                  <Button variant="outlined" startIcon={<ReportIcon />}
                    sx={{ borderColor: '#8b6cbc', color: '#8b6cbc', fontWeight: 600, '&:hover': { borderColor: '#7b5cac', bgcolor: 'rgba(139,108,188,0.05)' } }}>
                    Export Report
                  </Button>
                </Box>

                {/* Summary Table */}
                <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(139,108,188,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#8b6cbc' }}>Budget Summary Report</Typography>
                    <Typography variant="caption" color="text.secondary">Generated {format(new Date(), 'MMM dd, yyyy • h:mm a')}</Typography>
                  </Box>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Allocated</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Spent</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Remaining</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">% Used</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(project.budget.categories).map(([cat, allocated]) => {
                        const catExpenses = expenses.filter(e => e.category.toLowerCase() === cat.toLowerCase());
                        const spent = catExpenses.reduce((s, e) => s + e.amount, 0);
                        const remaining = allocated - spent;
                        const pct = allocated > 0 ? ((spent / allocated) * 100).toFixed(1) : '0.0';
                        return (
                          <TableRow key={cat} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                            <TableCell sx={{ textTransform: 'capitalize', fontWeight: 600 }}>{cat}</TableCell>
                            <TableCell align="right">${allocated.toLocaleString()}</TableCell>
                            <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>${spent.toLocaleString()}</TableCell>
                            <TableCell align="right" sx={{ color: remaining >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>${Math.abs(remaining).toLocaleString()}{remaining < 0 ? ' over' : ''}</TableCell>
                            <TableCell align="right">
                              <Chip label={`${pct}%`} size="small"
                                color={parseFloat(pct) > 90 ? 'error' : parseFloat(pct) > 70 ? 'warning' : 'success'}
                                sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow sx={{ bgcolor: 'rgba(139,108,188,0.06)' }}>
                        <TableCell sx={{ fontWeight: 700 }}>TOTAL</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>${project.budget.total.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>${project.budget.spent.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>${project.budget.remaining.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Chip label={`${project.budget.utilization.toFixed(1)}%`} size="small" color={budSt.chipColor} sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Card>

                {/* Expense log */}
                <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(139,108,188,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#8b6cbc' }}>Expense Log</Typography>
                  </Box>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expenses.slice(0, 10).map((exp) => (
                        <TableRow key={exp.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{format(new Date(exp.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{exp.description}</TableCell>
                          <TableCell><Chip label={exp.category} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>${exp.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip label={exp.status} size="small"
                              color={exp.status === 'Approved' ? 'success' : exp.status === 'Pending' ? 'warning' : 'error'}
                              sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </Box>
            )}

          </Box>
        </Paper>
      </Container>

      {/* Add Expense Dialog */}
      <Dialog open={addExpenseDialog} onClose={() => setAddExpenseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#8b6cbc', color: 'white', fontWeight: 700 }}>Add New Expense</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth label="Description"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Enter expense description..."
            />
            <TextField
              fullWidth label="Amount" type="number"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm(p => ({ ...p, amount: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={expenseForm.category} label="Category"
                onChange={(e) => setExpenseForm(p => ({ ...p, category: e.target.value }))}>
                <MenuItem value="Personnel">Personnel</MenuItem>
                <MenuItem value="Equipment">Equipment</MenuItem>
                <MenuItem value="Supplies">Supplies</MenuItem>
                <MenuItem value="Travel">Travel</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth label="Date" type="date"
              value={expenseForm.date}
              onChange={(e) => setExpenseForm(p => ({ ...p, date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddExpenseDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddExpense}
            variant="contained"
            disabled={!expenseForm.description || !expenseForm.amount || !expenseForm.category}
            sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7b5cac' } }}
          >
            Add Expense
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BudgetDetailPage;
