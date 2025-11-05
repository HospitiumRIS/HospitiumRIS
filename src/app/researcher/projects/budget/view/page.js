'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
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
  Alert,
  Grid
} from '@mui/material';
import {
  AccountBalance as BudgetIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ExpenseIcon,
  Analytics as AnalyticsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  Assignment as ProjectIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import PageHeader from '../../../../../components/common/PageHeader';
import { useAuth } from '../../../../../components/AuthProvider';

const BudgetManagementPage = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [addExpenseDialog, setAddExpenseDialog] = useState(false);
  const [budgetDialog, setBudgetDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('All');
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    receipt: null
  });
  const [budgetForm, setBudgetForm] = useState({
    totalBudget: '',
    personnel: '',
    equipment: '',
    supplies: '',
    travel: '',
    other: ''
  });

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
        
        if (!Array.isArray(data)) {
          console.warn('Expected array of proposals, got:', typeof data);
          setProjects([]);
          return;
        }
        
        const transformedProjects = data.map(transformProposalToBudgetProject);
        console.log('Transformed projects:', transformedProjects);
        
        setProjects(transformedProjects);
        if (transformedProjects.length > 0) {
          setSelectedProject(transformedProjects[0]);
          console.log('Selected first project:', transformedProjects[0].title);
        }
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
    
    const totalBudget = parseFloat(budget.total || budget.totalBudget || 0);
    
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
  const calculateBudgetStats = () => {
    if (!projects.length) return { totalBudget: 0, totalSpent: 0, avgUtilization: 0, activeProjects: 0 };
    
    const totalBudget = projects.reduce((sum, p) => sum + p.budget.total, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.budget.spent, 0);
    const avgUtilization = projects.reduce((sum, p) => sum + p.budget.utilization, 0) / projects.length;
    const activeProjects = projects.filter(p => p.status === 'ACTIVE' || p.status === 'Active').length;
    
    return { totalBudget, totalSpent, avgUtilization, activeProjects };
  };

  const budgetStats = calculateBudgetStats();

  // Handle expense form submission
  const handleAddExpense = () => {
    if (!selectedProject || !expenseForm.description || !expenseForm.amount) return;

    const newExpense = {
      id: `exp_${selectedProject.id}_${Date.now()}`,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      date: new Date(expenseForm.date),
      status: 'Pending',
      receipt: expenseForm.receipt
    };

    // Update selected project expenses
    const updatedProject = {
      ...selectedProject,
      expenses: [newExpense, ...selectedProject.expenses],
      budget: {
        ...selectedProject.budget,
        spent: selectedProject.budget.spent + newExpense.amount,
        remaining: selectedProject.budget.remaining - newExpense.amount,
        utilization: ((selectedProject.budget.spent + newExpense.amount) / selectedProject.budget.total) * 100
      }
    };

    setSelectedProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
    setExpenseForm({ description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0], receipt: null });
    setAddExpenseDialog(false);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': case 'approved': return 'success';
      case 'pending': case 'under_review': return 'warning';
      case 'rejected': case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Get budget status based on utilization
  const getBudgetStatus = (utilization) => {
    if (utilization < 50) return { color: 'success', label: 'On Track' };
    if (utilization < 80) return { color: 'warning', label: 'Monitor' };
    return { color: 'error', label: 'At Risk' };
  };

  if (loading) {
  return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      <PageHeader
        title="Budget Management"
        description="Track project budgets, expenses, and financial performance across all research initiatives"
        icon={<BudgetIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher', icon: <BusinessIcon /> },
          { label: 'Projects', path: '/researcher/projects', icon: <ProjectIcon /> },
          { label: 'Budget Management', path: '/researcher/projects/budget/view', icon: <BudgetIcon /> },
        ]}
        actionButton={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddExpenseDialog(true)}
            sx={{ 
              bgcolor: '#8b6cbc', 
              color: 'white',
              '&:hover': { bgcolor: '#7b5cac' },
              '&:disabled': { bgcolor: 'grey.400', color: 'grey.600' },
              fontWeight: 'bold',
              px: 3,
              py: 1.2,
              fontSize: '0.9rem'
            }}
            disabled={!selectedProject}
          >
            Add Expense
          </Button>
        }
        sx={{ mt: '80px' }}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Budget Overview Cards */}
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          mb: 4,
          flexWrap: 'wrap',
          '& > *': { flex: 1, minWidth: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 12px)' } }
        }}>
          <Card elevation={2} sx={{ bgcolor: '#8b6cbc' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Total Budget</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
                    ${budgetStats.totalBudget.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}>
                  <MoneyIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ bgcolor: '#8b6cbc' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Total Spent</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
                    ${budgetStats.totalSpent.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}>
                  <ExpenseIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ bgcolor: '#8b6cbc' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Avg Utilization</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {budgetStats.avgUtilization.toFixed(1)}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ bgcolor: '#8b6cbc' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Active Projects</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {budgetStats.activeProjects}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}>
                  <AnalyticsIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Project Selection and Main Content */}
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Select Project
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Project</InputLabel>
              <Select
                value={selectedProject?.id || ''}
                onChange={(e) => {
                  const project = projects.find(p => p.id === e.target.value);
                  setSelectedProject(project);
                }}
                label="Project"
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {project.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Budget: ${project.budget.total.toLocaleString()} • 
                          Spent: ${project.budget.spent.toLocaleString()} • 
                          {project.budget.utilization.toFixed(1)}% utilized
                        </Typography>
                      </Box>
                      <Chip 
                        label={project.status} 
                        size="small"
                        color={getStatusColor(project.status)}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {selectedProject && (
          <Paper elevation={2}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={currentTab} 
                onChange={(e, newValue) => setCurrentTab(newValue)}
                sx={{ 
                  px: 3,
                  '& .MuiTab-root': { 
                    minHeight: 48,
                    color: 'text.secondary',
                    '&.Mui-selected': { color: '#8b6cbc' }
                  },
                  '& .MuiTabs-indicator': { backgroundColor: '#8b6cbc' }
                }}
              >
                <Tab label="Budget Overview" />
                <Tab label="Expense Tracking" />
                <Tab label="Budget Analysis" />
                <Tab label="Financial Reports" />
              </Tabs>
            </Box>

            <Box sx={{ p: 3 }}>
              {currentTab === 0 && (
                <Box>
                  {/* Budget Overview Tab */}
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                    {selectedProject.title} - Budget Overview
                  </Typography>

                  <Box sx={{ 
                    display: 'flex', 
                    gap: 3, 
                    mb: 4,
                    flexWrap: 'wrap',
                    '& > *': { flex: 1, minWidth: { xs: '100%', md: 'calc(50% - 12px)' } }
                  }}>
                    {/* Budget Summary */}
                    <Card elevation={1} sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#8b6cbc' }}>
                        Budget Summary
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Total Budget:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            ${selectedProject.budget.total.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Amount Spent:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                            ${selectedProject.budget.spent.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Remaining:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            ${selectedProject.budget.remaining.toLocaleString()}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">Utilization:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {selectedProject.budget.utilization.toFixed(1)}%
                            </Typography>
                            <Chip 
                              label={getBudgetStatus(selectedProject.budget.utilization).label}
                              size="small"
                              color={getBudgetStatus(selectedProject.budget.utilization).color}
                            />
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(selectedProject.budget.utilization, 100)}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: 'rgba(139, 108, 188, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: selectedProject.budget.utilization > 80 ? 'error.main' : '#8b6cbc'
                            }
                          }}
                        />
                      </Box>
                    </Card>

                    {/* Budget Categories */}
                    <Card elevation={1} sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#8b6cbc' }}>
                        Budget Allocation by Category
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {Object.entries(selectedProject.budget.categories).map(([category, amount]) => (
                          <Box key={category} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {category}:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, ml: 2 }}>
                              <LinearProgress
                                variant="determinate"
                                value={(amount / selectedProject.budget.total) * 100}
                                sx={{ 
                                  flex: 1,
                                  height: 6, 
                                  borderRadius: 3,
                                  bgcolor: 'rgba(139, 108, 188, 0.1)',
                                  '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc' }
                                }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '80px', textAlign: 'right' }}>
                                ${amount.toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Card>
                  </Box>

                  {/* Project Details */}
                  <Card elevation={1} sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#8b6cbc' }}>
                      Project Information
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Principal Investigator</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {selectedProject.pi}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Project Status</Typography>
                            <Box sx={{ mt: 0.5 }}>
                              <Chip 
                                label={selectedProject.status} 
                                color={getStatusColor(selectedProject.status)}
                                size="small"
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Start Date</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {selectedProject.startDate 
                                ? format(new Date(selectedProject.startDate), 'MMM dd, yyyy')
                                : 'Not set'
                              }
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">End Date</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {selectedProject.endDate 
                                ? format(new Date(selectedProject.endDate), 'MMM dd, yyyy')
                                : 'Not set'
                              }
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                </Box>
              )}

              {currentTab === 1 && (
                <Box>
                  {/* Expense Tracking Tab */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Expense Tracking - {selectedProject.title}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setAddExpenseDialog(true)}
                      sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7b5cac' } }}
                    >
                      Add Expense
                    </Button>
                  </Box>

                  {/* Expense Filters */}
                  <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          label="Status"
                        >
                          <MenuItem value="All">All</MenuItem>
                          <MenuItem value="Approved">Approved</MenuItem>
                          <MenuItem value="Pending">Pending</MenuItem>
                          <MenuItem value="Rejected">Rejected</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Paper>

                  {/* Expenses Table */}
                  <TableContainer component={Paper} elevation={1}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Receipt</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedProject.expenses
                          .filter(expense => filterStatus === 'All' || expense.status === filterStatus)
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((expense) => (
                            <TableRow key={expense.id} hover>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {expense.description}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  ${expense.amount.toLocaleString()}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={expense.category} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                {format(new Date(expense.date), 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={expense.status} 
                                  size="small"
                                  color={getStatusColor(expense.status)}
                                />
                              </TableCell>
                              <TableCell>
                                {expense.receipt ? (
                                  <Chip label="Available" size="small" color="success" />
                                ) : (
                                  <Chip label="Missing" size="small" color="warning" />
                                )}
                              </TableCell>
                              <TableCell align="center">
                                <Stack direction="row" spacing={1}>
                                  <Tooltip title="Edit">
                                    <IconButton size="small">
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton size="small" color="error">
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25]}
                      component="div"
                      count={selectedProject.expenses.filter(expense => filterStatus === 'All' || expense.status === filterStatus).length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={(e, newPage) => setPage(newPage)}
                      onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                      }}
                    />
                  </TableContainer>
                </Box>
              )}

              {currentTab === 2 && (
                <Box>
                  {/* Budget Analysis Tab - Placeholder for now */}
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                    Budget Analysis - {selectedProject.title}
                  </Typography>
                  <Alert severity="info">
                    Budget analysis features including spending trends, variance analysis, and forecasting will be implemented here.
                  </Alert>
                </Box>
              )}

              {currentTab === 3 && (
                <Box>
                  {/* Financial Reports Tab - Placeholder for now */}
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                    Financial Reports - {selectedProject.title}
                  </Typography>
                  <Alert severity="info">
                    Financial reporting features including budget reports, expense summaries, and export functionality will be implemented here.
                  </Alert>
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {error && (
          <Paper elevation={2} sx={{ p: 6, textAlign: 'center' }}>
            <WarningIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography variant="h6" color="error.main" sx={{ mb: 1 }}>
              Error Loading Data
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setError(null);
                setLoading(true);
                // Trigger refetch by calling the effect
                window.location.reload();
              }}
              sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7b5cac' } }}
            >
              Try Again
            </Button>
          </Paper>
        )}

        {!selectedProject && !loading && !error && projects.length === 0 && (
          <Paper elevation={2} sx={{ p: 6, textAlign: 'center' }}>
            <BudgetIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No projects available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a project proposal to start managing budgets and expenses.
            </Typography>
          </Paper>
        )}
      </Container>

      {/* Add Expense Dialog */}
      <Dialog open={addExpenseDialog} onClose={() => setAddExpenseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#8b6cbc', color: 'white' }}>
          Add New Expense
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Description"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter expense description..."
            />
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                label="Category"
              >
                <MenuItem value="Personnel">Personnel</MenuItem>
                <MenuItem value="Equipment">Equipment</MenuItem>
                <MenuItem value="Supplies">Supplies</MenuItem>
                <MenuItem value="Travel">Travel</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={expenseForm.date}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
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

export default BudgetManagementPage;