'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Collapse,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrackChanges as TrackIcon,
  Timeline as TimelineIcon,
  Group as TeamIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Description as ReportIcon,
  Business as BusinessIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  PlayArrow as PlayIcon,
  RadioButtonUnchecked as PendingIcon,
  Cancel as BlockedIcon,
  Flag as MilestoneIcon,
  Task as TaskIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

import PageHeader from '../../../../../components/common/PageHeader';
import { useAuth } from '../../../../../components/AuthProvider';

// Function to transform proposal data to project format
const transformProposalToProject = (proposal) => {
  // Calculate progress based on milestone completion
  const milestones = proposal.milestones || [];
  const completedMilestones = milestones.filter(m => m.status === 'Completed' || m.status === 'COMPLETED').length;
  const progress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

  // Calculate days until deadline
  const endDateString = proposal.endDate || proposal.grantEndDate;
  const endDate = endDateString ? new Date(endDateString) : null;
  const today = new Date();
  const daysUntilDeadline = endDate && !isNaN(endDate.getTime()) 
    ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) 
    : null;

  // Determine project status based on proposal status
  const statusMap = {
    'DRAFT': 'Planning',
    'SUBMITTED': 'Review',
    'UNDER_REVIEW': 'Review', 
    'APPROVED': 'Active',
    'REJECTED': 'On Hold',
    'REVISION_REQUESTED': 'Planning'
  };

  // Get next milestone
  const pendingMilestones = milestones.filter(m => m.status === 'Pending' || m.status === 'PENDING' || m.status === 'In Progress' || m.status === 'IN_PROGRESS');
  const nextMilestone = pendingMilestones.length > 0 ? pendingMilestones[0]?.title || 'No pending milestones' : 'All milestones completed';

  return {
    id: proposal.id,
    title: proposal.title,
    status: statusMap[proposal.status] || 'Planning',
    progress: progress,
    priority: 'High', // Default priority - could be enhanced based on proposal data
    startDate: proposal.startDate || proposal.grantStartDate,
    endDate: proposal.endDate || proposal.grantEndDate,
    team: (proposal.coInvestigators?.length || 0) + 1, // PI + co-investigators
    completedTasks: completedMilestones,
    totalTasks: milestones.length,
    budget: proposal.totalBudgetAmount ? parseFloat(proposal.totalBudgetAmount) : 0,
    budgetUsed: proposal.totalBudgetAmount ? parseFloat(proposal.totalBudgetAmount) * 0.6 : 0, // Estimated 60% usage
    lastUpdate: proposal.updatedAt,
    lead: { 
      name: proposal.principalInvestigator || 'Unknown PI', 
      avatar: null 
    },
    nextMilestone: nextMilestone,
    daysUntilDeadline: daysUntilDeadline || 0,
    milestones: milestones.map((milestone, index) => ({
      id: index + 1,
      title: milestone.title || milestone.name || `Milestone ${index + 1}`,
      status: milestone.status || 'Pending',
      dueDate: milestone.dueDate || milestone.targetDate,
      completedDate: milestone.completedDate,
      progress: milestone.progress || 0
    })),
    deliverables: (proposal.deliverables || []).map((deliverable, index) => ({
      id: index + 1,
      title: deliverable.title || deliverable.name || `Deliverable ${index + 1}`,
      status: deliverable.status || 'Pending',
      dueDate: deliverable.dueDate || deliverable.deadline,
      type: deliverable.type || 'Document'
    }))
  };
};

const ProjectStatusPage = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [viewDetailsDialog, setViewDetailsDialog] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [expandedRows, setExpandedRows] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Milestone management states
  const [milestoneDialog, setMilestoneDialog] = useState(false);
  const [newMilestoneDialog, setNewMilestoneDialog] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    status: 'Pending',
    dueDate: '',
    description: '',
    progress: 0
  });
  
  // Status update states
  const [statusUpdate, setStatusUpdate] = useState({
    newStatus: '',
    reason: '',
    notes: ''
  });

  // Fetch proposals from database
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/proposals');
        const data = await response.json();
        
        if (data.success && data.proposals) {
          // Transform proposals to project format
          const transformedProjects = data.proposals.map(transformProposalToProject);
          setProjects(transformedProjects);
        } else {
          console.error('Failed to fetch proposals:', data.error);
          setProjects([]); // Set empty array as fallback
        }
      } catch (error) {
        console.error('Error fetching proposals:', error);
        setProjects([]); // Set empty array as fallback
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  // Calculate overview statistics
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'Active').length,
    overdue: projects.filter(p => p.daysUntilDeadline < 0).length,
    upcoming: projects.filter(p => p.daysUntilDeadline <= 7 && p.daysUntilDeadline > 0).length,
    avgProgress: projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length) : 0,
    totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    budgetUsed: projects.reduce((sum, p) => sum + (p.budgetUsed || 0), 0),
    teamMembers: projects.reduce((sum, p) => sum + (p.team || 0), 0),
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'success',
      'Planning': 'info',
      'Review': 'warning',
      'Completed': 'default',
      'On Hold': 'error',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Critical': 'error',
      'High': 'warning',
      'Medium': 'info',
      'Low': 'default',
    };
    return colors[priority] || 'default';
  };


  const renderOverviewCards = () => (
    <Box sx={{ 
      display: 'flex', 
      gap: 3, 
      mb: 3,
      flexWrap: 'nowrap',
      '& > *': { flex: 1, minWidth: 0 }
    }}>
      <Card elevation={2} sx={{ bgcolor: '#8b6cbc' }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5, color: 'white' }}>
                {stats.totalProjects}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Total Projects
              </Typography>
            </Box>
            <DashboardIcon sx={{ fontSize: 28, color: 'white', opacity: 0.8 }} />
          </Box>
        </CardContent>
      </Card>

      <Card elevation={2} sx={{ bgcolor: '#8b6cbc' }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5, color: 'white' }}>
                {stats.activeProjects}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Active Projects
              </Typography>
            </Box>
            <TrackIcon sx={{ fontSize: 28, color: 'white', opacity: 0.8 }} />
          </Box>
        </CardContent>
      </Card>

      <Card elevation={2} sx={{ bgcolor: '#8b6cbc' }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5, color: 'white' }}>
                {stats.upcoming}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Due This Week
              </Typography>
            </Box>
            <ScheduleIcon sx={{ fontSize: 28, color: 'white', opacity: 0.8 }} />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  // Milestone management functions
  const handleToggleRow = (projectId) => {
    setExpandedRows(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const handleUpdateMilestone = (milestone, projectId) => {
    setSelectedMilestone({ ...milestone, projectId });
    setMilestoneDialog(true);
  };

  const handleAddNewMilestone = (projectId) => {
    setSelectedProject(projects.find(p => p.id === projectId));
    setMilestoneForm({
      title: '',
      status: 'Pending',
      dueDate: '',
      description: '',
      progress: 0
    });
    setNewMilestoneDialog(true);
  };

  // Status update functions
  const handleUpdateProjectStatus = async () => {
    if (!selectedProject || !statusUpdate.newStatus) return;

    try {
      // Update status in database (if needed - for now we'll just update locally)
      // const response = await fetch(`/api/proposals/${selectedProject.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: statusUpdate.newStatus })
      // });

      // Update the project status locally
      setProjects(prev => prev.map(project => 
        project.id === selectedProject.id 
          ? { 
              ...project, 
              status: statusUpdate.newStatus,
              lastUpdate: new Date().toISOString()
            }
          : project
      ));

      // Reset form and close dialog
      setStatusUpdate({ newStatus: '', reason: '', notes: '' });
      setStatusUpdateDialog(false);
      setSelectedProject(null);
      
      // Show success message
      alert(`Project status updated to "${statusUpdate.newStatus}" successfully!`);
    } catch (error) {
      console.error('Error updating project status:', error);
      alert('Failed to update project status. Please try again.');
    }
  };

  const handleSaveMilestone = () => {
    if (!selectedMilestone) return;

    setProjects(prev => prev.map(project => 
      project.id === selectedMilestone.projectId
        ? {
            ...project,
            milestones: project.milestones.map(milestone =>
              milestone.id === selectedMilestone.id
                ? { ...milestone, status: selectedMilestone.status }
                : milestone
            )
          }
        : project
    ));

    setMilestoneDialog(false);
    setSelectedMilestone(null);
    alert('Milestone updated successfully!');
  };

  const handleAddMilestone = () => {
    if (!selectedProject || !milestoneForm.title) return;

    const newMilestone = {
      id: Date.now(), // Simple ID generation
      title: milestoneForm.title,
      status: milestoneForm.status,
      dueDate: milestoneForm.dueDate,
      description: milestoneForm.description,
      progress: milestoneForm.progress
    };

    setProjects(prev => prev.map(project => 
      project.id === selectedProject.id
        ? { ...project, milestones: [...project.milestones, newMilestone] }
        : project
    ));

    setNewMilestoneDialog(false);
    setMilestoneForm({
      title: '',
      status: 'Pending',
      dueDate: '',
      description: '',
      progress: 0
    });
    alert('Milestone added successfully!');
  };

  const getMilestoneIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckIcon color="success" />;
      case 'In Progress': return <PlayIcon color="primary" />;
      case 'Blocked': return <BlockedIcon color="error" />;
      case 'Pending': return <PendingIcon color="action" />;
      default: return <PendingIcon color="action" />;
    }
  };

  const getDeliverableIcon = (status) => {
    switch (status) {
      case 'Delivered': return <CheckIcon color="success" />;
      case 'In Progress': return <PlayIcon color="primary" />;
      case 'Pending': return <PendingIcon color="action" />;
      default: return <PendingIcon color="action" />;
    }
  };

  const renderProjectsList = () => {
    const filteredProjects = projects.filter(project => {
      const statusMatch = filterStatus === 'All' || project.status === filterStatus;
      const priorityMatch = filterPriority === 'All' || project.priority === filterPriority;
      return statusMatch && priorityMatch;
    });

    return (
      <Box>
        {/* Filters */}
        <Paper elevation={1} sx={{ p: 3, mb: 3, width: '100%' }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            alignItems: 'center',
            flexWrap: 'wrap',
            width: '100%'
          }}>
            <FormControl sx={{ minWidth: 200, flex: '0 0 auto' }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus}
                label="Filter by Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Planning">Planning</MenuItem>
                <MenuItem value="Review">Review</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="On Hold">On Hold</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200, flex: '0 0 auto' }}>
              <InputLabel>Filter by Priority</InputLabel>
              <Select
                value={filterPriority}
                label="Filter by Priority"
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <MenuItem value="All">All Priorities</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Projects Table */}
        <TableContainer component={Paper} elevation={1} sx={{ width: '100%' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell />
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Project Name</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Status</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Priority</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Progress</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Lead</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Next Milestone</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Due Date</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((project) => (
                <React.Fragment key={project.id}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleRow(project.id)}
                      >
                        {expandedRows[project.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {project.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={project.status} 
                        color={getStatusColor(project.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={project.priority} 
                        color={getPriorityColor(project.priority)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={project.progress} 
                          sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="body2" sx={{ minWidth: 35 }}>
                          {project.progress}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          {project.lead.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Typography variant="body2">
                          {project.lead.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {project.nextMilestone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={project.daysUntilDeadline <= 7 && project.daysUntilDeadline > 0 ? 'error.main' : 'text.primary'}
                      >
                        {project.endDate && new Date(project.endDate) && !isNaN(new Date(project.endDate).getTime()) 
                          ? format(new Date(project.endDate), 'MMM dd, yyyy')
                          : 'No deadline set'
                        }
                        {project.daysUntilDeadline <= 7 && project.daysUntilDeadline > 0 && (
                          <Chip 
                            size="small" 
                            label={`${project.daysUntilDeadline}d`} 
                            color="error" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              setSelectedProject(project);
                              setViewDetailsDialog(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Update Status">
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              setSelectedProject(project);
                              setStatusUpdateDialog(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Row Content */}
                  <TableRow>
                    <TableCell colSpan={9} sx={{ py: 0 }}>
                      <Collapse in={expandedRows[project.id]} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 4, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 4, 
                            flexWrap: 'wrap',
                            '& > *': { flex: 1, minWidth: { xs: '100%', md: 'calc(50% - 16px)' } }
                          }}>
                            {/* Milestones Section */}
                            <Paper elevation={2} sx={{ p: 3, flex: 1, borderRadius: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8b6cbc', display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <MilestoneIcon />
                                  Milestones ({project.milestones.length})
                                </Typography>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<AddIcon />}
                                  onClick={() => handleAddNewMilestone(project.id)}
                                  sx={{ 
                                    borderColor: '#8b6cbc', 
                                    color: '#8b6cbc',
                                    '&:hover': { borderColor: '#7b5cac', bgcolor: 'rgba(139, 108, 188, 0.04)' }
                                  }}
                                >
                                  Add Milestone
                                </Button>
                              </Box>
                              
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {project.milestones.map((milestone) => (
                                  <Paper 
                                    key={milestone.id} 
                                    elevation={1} 
                                    sx={{ 
                                      p: 2.5, 
                                      borderRadius: 2,
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      position: 'relative',
                                      '&:hover': { 
                                        boxShadow: 2,
                                        borderColor: '#8b6cbc' 
                                      }
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                      <Box sx={{ mt: 0.5 }}>
                                        {getMilestoneIcon(milestone.status)}
                                      </Box>
                                      
                                      <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            {milestone.title}
                                          </Typography>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip 
                                              label={milestone.status} 
                                              size="small"
                                              color={
                                                milestone.status === 'Completed' ? 'success' : 
                                                milestone.status === 'In Progress' ? 'primary' : 'default'
                                              }
                                              sx={{ fontSize: '0.7rem' }}
                                            />
                                            <IconButton
                                              size="small"
                                              onClick={() => handleUpdateMilestone(milestone, project.id)}
                                              sx={{ 
                                                color: '#8b6cbc',
                                                '&:hover': { bgcolor: 'rgba(139, 108, 188, 0.1)' }
                                              }}
                                            >
                                              <EditIcon fontSize="small" />
                                            </IconButton>
                                          </Box>
                                        </Box>
                                        
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                          <strong>Due:</strong> {milestone.dueDate && new Date(milestone.dueDate) && !isNaN(new Date(milestone.dueDate).getTime())
                                            ? format(new Date(milestone.dueDate), 'MMM dd, yyyy')
                                            : 'No due date set'
                                          }
                                        </Typography>
                                        
                                        {milestone.status === 'In Progress' && milestone.progress && (
                                          <Box sx={{ mt: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                              <Typography variant="caption" color="text.secondary">
                                                Progress
                                              </Typography>
                                              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                                                {milestone.progress}%
                                              </Typography>
                                            </Box>
                                            <LinearProgress
                                              variant="determinate"
                                              value={milestone.progress}
                                              sx={{ 
                                                height: 6, 
                                                borderRadius: 3,
                                                bgcolor: 'rgba(139, 108, 188, 0.1)',
                                                '& .MuiLinearProgress-bar': {
                                                  bgcolor: '#8b6cbc'
                                                }
                                              }}
                                            />
                                          </Box>
                                        )}
                                      </Box>
                                    </Box>
                                  </Paper>
                                ))}
                                
                                {project.milestones.length === 0 && (
                                  <Box sx={{ 
                                    textAlign: 'center', 
                                    py: 4, 
                                    color: 'text.secondary',
                                    bgcolor: 'grey.100',
                                    borderRadius: 2,
                                    border: '2px dashed',
                                    borderColor: 'divider'
                                  }}>
                                    <MilestoneIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                                    <Typography variant="body2">
                                      No milestones defined yet
                                    </Typography>
                                    <Typography variant="caption">
                                      Click "Add Milestone" to create the first milestone
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Paper>
                            
                            {/* Deliverables Section */}
                            <Paper elevation={2} sx={{ p: 3, flex: 1, borderRadius: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8b6cbc', display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <TaskIcon />
                                  Deliverables ({project.deliverables.length})
                                </Typography>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<AddIcon />}
                                  sx={{ 
                                    borderColor: '#8b6cbc', 
                                    color: '#8b6cbc',
                                    '&:hover': { borderColor: '#7b5cac', bgcolor: 'rgba(139, 108, 188, 0.04)' }
                                  }}
                                >
                                  Add Deliverable
                                </Button>
                              </Box>
                              
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {project.deliverables.map((deliverable) => (
                                  <Paper 
                                    key={deliverable.id} 
                                    elevation={1} 
                                    sx={{ 
                                      p: 2.5, 
                                      borderRadius: 2,
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      position: 'relative',
                                      '&:hover': { 
                                        boxShadow: 2,
                                        borderColor: '#8b6cbc' 
                                      }
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                      <Box sx={{ mt: 0.5 }}>
                                        {getDeliverableIcon(deliverable.status)}
                                      </Box>
                                      
                                      <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            {deliverable.title}
                                          </Typography>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip 
                                              label={deliverable.status} 
                                              size="small"
                                              color={
                                                deliverable.status === 'Delivered' ? 'success' : 
                                                deliverable.status === 'In Progress' ? 'primary' : 'default'
                                              }
                                              sx={{ fontSize: '0.7rem' }}
                                            />
                                            <IconButton
                                              size="small"
                                              sx={{ 
                                                color: '#8b6cbc',
                                                '&:hover': { bgcolor: 'rgba(139, 108, 188, 0.1)' }
                                              }}
                                            >
                                              <EditIcon fontSize="small" />
                                            </IconButton>
                                          </Box>
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                          <Typography variant="caption" color="text.secondary">
                                            <strong>Type:</strong> {deliverable.type}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            <strong>Due:</strong> {deliverable.dueDate && new Date(deliverable.dueDate) && !isNaN(new Date(deliverable.dueDate).getTime())
                                              ? format(new Date(deliverable.dueDate), 'MMM dd, yyyy')
                                              : 'No due date set'
                                            }
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </Box>
                                  </Paper>
                                ))}
                                
                                {project.deliverables.length === 0 && (
                                  <Box sx={{ 
                                    textAlign: 'center', 
                                    py: 4, 
                                    color: 'text.secondary',
                                    bgcolor: 'grey.100',
                                    borderRadius: 2,
                                    border: '2px dashed',
                                    borderColor: 'divider'
                                  }}>
                                    <TaskIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                                    <Typography variant="body2">
                                      No deliverables defined yet
                                    </Typography>
                                    <Typography variant="caption">
                                      Click "Add Deliverable" to create the first deliverable
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Paper>
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
          
          <TablePagination
            component="div"
            count={filteredProjects.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>
      </Box>
    );
  };


  return (
    <Box sx={{ mt: '80px' }}>
      <PageHeader
        title="Project Status Tracking"
        description="Monitor project progress, deadlines, and team performance"
        icon={<TrackIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher', icon: <BusinessIcon /> },
          { label: 'Projects', path: '/researcher/projects', icon: <BusinessIcon /> },
          { label: 'Tracking', path: '/researcher/projects/tracking', icon: <TrackIcon /> },
        ]}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Loading State */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress size={40} sx={{ color: '#8b6cbc' }} />
            <Typography variant="h6" sx={{ ml: 2 }}>
              Loading project data...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Overview Statistics */}
            {renderOverviewCards()}

            {/* Main Content Tabs */}
            <Paper elevation={1} sx={{ mb: 4 }}>
              <Tabs 
                value={currentTab} 
                onChange={handleTabChange}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="All Projects" icon={<DashboardIcon />} iconPosition="start" />
                <Tab label="Timeline View" icon={<TimelineIcon />} iconPosition="start" />
                <Tab label="Team Activity" icon={<TeamIcon />} iconPosition="start" />
                <Tab label="Reports" icon={<ReportIcon />} iconPosition="start" />
              </Tabs>
            </Paper>

            {/* Tab Content */}
            {currentTab === 0 && renderProjectsList()}

        {currentTab === 1 && (
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Project Timeline
            </Typography>
            
            {projects.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {projects.map((project) => (
                  <Paper key={project.id} elevation={2} sx={{ p: 4, borderLeft: '4px solid #8b6cbc' }}>
                    <Typography variant="h6" sx={{ mb: 3, color: '#8b6cbc', fontWeight: 'bold' }}>
                      {project.title}
                    </Typography>
                    
                    {/* Project Timeline */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      position: 'relative', 
                      pl: 4,
                      gap: 3
                    }}>
                      {/* Timeline Line */}
                      <Box sx={{ 
                        position: 'absolute', 
                        left: '8px', 
                        top: '8px', 
                        bottom: '8px', 
                        width: '2px', 
                        bgcolor: '#8b6cbc',
                        opacity: 0.3
                      }} />
                      
                      {/* Start Date */}
                      <Box sx={{ 
                        position: 'relative', 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 2 
                      }}>
                        <Box sx={{ 
                          position: 'absolute', 
                          left: '-12px', 
                          top: '2px', 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%', 
                          bgcolor: '#8b6cbc',
                          border: '2px solid white',
                          boxShadow: 2
                        }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            Project Start
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {project.startDate && new Date(project.startDate) && !isNaN(new Date(project.startDate).getTime())
                              ? format(new Date(project.startDate), 'MMM dd, yyyy')
                              : 'Start date not set'
                            }
                          </Typography>
                        </Box>
                      </Box>

                      {/* Milestones */}
                      {project.milestones.map((milestone, index) => (
                        <Box key={milestone.id} sx={{ 
                          position: 'relative', 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: 2 
                        }}>
                          <Box sx={{ 
                            position: 'absolute', 
                            left: '-12px', 
                            top: '2px', 
                            width: '16px', 
                            height: '16px', 
                            borderRadius: '50%', 
                            bgcolor: milestone.status === 'Completed' ? '#4caf50' : 
                                     milestone.status === 'In Progress' ? '#2196f3' : '#f44336',
                            border: '2px solid white',
                            boxShadow: 2
                          }} />
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {milestone.title}
                              </Typography>
                              <Chip 
                                label={milestone.status} 
                                size="small" 
                                color={
                                  milestone.status === 'Completed' ? 'success' : 
                                  milestone.status === 'In Progress' ? 'primary' : 'default'
                                }
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {milestone.dueDate && new Date(milestone.dueDate) && !isNaN(new Date(milestone.dueDate).getTime())
                                ? format(new Date(milestone.dueDate), 'MMM dd, yyyy')
                                : 'No due date'
                              }
                            </Typography>
                            {milestone.status === 'In Progress' && milestone.progress && (
                              <Box sx={{ mt: 1, maxWidth: 400 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={milestone.progress} 
                                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                                  />
                                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 50 }}>
                                    {milestone.progress}%
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      ))}

                      {/* End Date */}
                      <Box sx={{ 
                        position: 'relative', 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 2 
                      }}>
                        <Box sx={{ 
                          position: 'absolute', 
                          left: '-12px', 
                          top: '2px', 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%', 
                          bgcolor: project.daysUntilDeadline < 0 ? '#f44336' : '#8b6cbc',
                          border: '2px solid white',
                          boxShadow: 2
                        }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            Project End
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {project.endDate && new Date(project.endDate) && !isNaN(new Date(project.endDate).getTime())
                                ? format(new Date(project.endDate), 'MMM dd, yyyy')
                                : 'End date not set'
                              }
                            </Typography>
                            {project.daysUntilDeadline < 0 && (
                              <Chip 
                                label={`${Math.abs(project.daysUntilDeadline)} days overdue`} 
                                color="error" 
                                size="small"
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No projects to display in timeline view.
              </Typography>
            )}
          </Paper>
        )}

            {currentTab === 2 && (
              <Paper elevation={1} sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Team Activity Dashboard
                </Typography>
                
                {projects.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {/* Team Overview Cards */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 3, 
                      flexWrap: 'wrap',
                      '& > *': { flex: 1, minWidth: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 12px)' } }
                    }}>
                      <Card sx={{ bgcolor: '#8b6cbc', color: 'white', flex: 1 }}>
                        <CardContent>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {stats.teamMembers}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Total Team Members
                          </Typography>
                        </CardContent>
                      </Card>
                      
                      <Card sx={{ bgcolor: '#4caf50', color: 'white', flex: 1 }}>
                        <CardContent>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {projects.reduce((sum, p) => sum + (p.completedTasks || 0), 0)}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Completed Tasks
                          </Typography>
                        </CardContent>
                      </Card>
                      
                      <Card sx={{ bgcolor: '#ff9800', color: 'white', flex: 1 }}>
                        <CardContent>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {projects.reduce((sum, p) => sum + (p.totalTasks || 0) - (p.completedTasks || 0), 0)}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Pending Tasks
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>

                    {/* Project Team Breakdown & Activity Feed */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 4, 
                      flexWrap: 'wrap',
                      '& > *': { minWidth: { xs: '100%', lg: 'calc(66.666% - 16px)' } }
                    }}>
                      {/* Project Team Breakdown */}
                      <Paper elevation={2} sx={{ p: 3, flex: 2, minWidth: { xs: '100%', lg: 'calc(66.666% - 16px)' } }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>
                          Project Teams
                        </Typography>
                        <List>
                          {projects.map((project) => (
                            <ListItem key={project.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mb: 2 }}>
                              <ListItemIcon>
                                <Avatar sx={{ bgcolor: '#8b6cbc' }}>
                                  {project.lead.name.split(' ').map(n => n[0]).join('')}
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    {project.title}
                                  </Typography>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">
                                      Lead: {project.lead.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Team Size: {project.team} members • Progress: {project.progress}%
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                      <LinearProgress 
                                        variant="determinate" 
                                        value={project.progress} 
                                        sx={{ height: 6, borderRadius: 3 }}
                                      />
                                    </Box>
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>

                      {/* Activity Feed */}
                      <Paper elevation={2} sx={{ p: 3, flex: 1, minWidth: { xs: '100%', lg: 'calc(33.333% - 16px)' } }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>
                          Recent Activity
                        </Typography>
                        <List dense>
                          {projects.slice(0, 5).map((project) => (
                            <ListItem key={project.id}>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: getStatusColor(project.status) === 'success' ? '#4caf50' : '#8b6cbc', width: 32, height: 32 }}>
                                  <CheckIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Typography variant="body2">
                                    {project.title}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    Status: {project.status} • {project.lead.name}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No team activity data available.
                  </Typography>
                )}
              </Paper>
            )}

        {currentTab === 3 && (
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Project Reports & Analytics
            </Typography>
            
            {projects.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Top Row - Performance Metrics & Budget Analysis */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 4, 
                  flexWrap: 'wrap',
                  '& > *': { flex: 1, minWidth: { xs: '100%', md: 'calc(50% - 16px)' } }
                }}>
                  {/* Performance Metrics */}
                  <Paper elevation={2} sx={{ p: 3, flex: 1 }}>
                    <Typography variant="h6" sx={{ mb: 3, color: '#8b6cbc' }}>
                      Performance Metrics
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Overall Progress
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={stats.avgProgress} 
                        sx={{ height: 10, borderRadius: 5, mb: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {stats.avgProgress}% Average across all projects
                      </Typography>
                    </Box>

                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      '& > *': { flex: 1 }
                    }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
                          {projects.filter(p => p.status === 'Active').length}
                        </Typography>
                        <Typography variant="body2" color="success.dark">
                          Active Projects
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>
                          {stats.upcoming}
                        </Typography>
                        <Typography variant="body2" color="warning.dark">
                          Due Soon
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Budget Analysis */}
                  <Paper elevation={2} sx={{ p: 3, flex: 1 }}>
                    <Typography variant="h6" sx={{ mb: 3, color: '#8b6cbc' }}>
                      Budget Analysis
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          Budget Utilization
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {stats.totalBudget > 0 ? Math.round((stats.budgetUsed / stats.totalBudget) * 100) : 0}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={stats.totalBudget > 0 ? (stats.budgetUsed / stats.totalBudget) * 100 : 0}
                        sx={{ height: 10, borderRadius: 5, mb: 2 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Budget:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          ${stats.totalBudget.toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Used:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          ${stats.budgetUsed.toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Remaining:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          ${(stats.totalBudget - stats.budgetUsed).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Box>

                {/* Full Width - Detailed Project Report */}
                <Paper elevation={2} sx={{ p: 3, width: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 3, color: '#8b6cbc' }}>
                    Detailed Project Status
                  </Typography>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell><Typography variant="subtitle2" fontWeight="bold">Project</Typography></TableCell>
                          <TableCell><Typography variant="subtitle2" fontWeight="bold">Status</Typography></TableCell>
                          <TableCell><Typography variant="subtitle2" fontWeight="bold">Progress</Typography></TableCell>
                          <TableCell><Typography variant="subtitle2" fontWeight="bold">Budget Used</Typography></TableCell>
                          <TableCell><Typography variant="subtitle2" fontWeight="bold">Team</Typography></TableCell>
                          <TableCell><Typography variant="subtitle2" fontWeight="bold">Days to Deadline</Typography></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {projects.map((project) => (
                          <TableRow key={project.id} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {project.title}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={project.status} 
                                color={getStatusColor(project.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={project.progress} 
                                  sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="body2" sx={{ minWidth: 35 }}>
                                  {project.progress}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {project.budget > 0 ? Math.round((project.budgetUsed / project.budget) * 100) : 0}%
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {project.team} members
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2"
                                color={project.daysUntilDeadline <= 7 && project.daysUntilDeadline > 0 ? 'error.main' : 'text.primary'}
                              >
                                {project.daysUntilDeadline > 0 
                                  ? `${project.daysUntilDeadline} days`
                                  : project.daysUntilDeadline < 0 
                                  ? `${Math.abs(project.daysUntilDeadline)} days overdue`
                                  : 'No deadline'
                                }
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No project data available for reports.
              </Typography>
            )}
          </Paper>
        )}
          </>
        )}
      </Container>

      {/* Status Update Dialog */}
      <Dialog 
        open={statusUpdateDialog} 
        onClose={() => {
          setStatusUpdateDialog(false);
          setStatusUpdate({ newStatus: '', reason: '', notes: '' });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#8b6cbc', color: 'white' }}>
          Update Project Status
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedProject && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                {selectedProject.title}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Current Status: <Chip 
                  label={selectedProject.status} 
                  color={getStatusColor(selectedProject.status)}
                  size="small"
                />
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>New Status</InputLabel>
                <Select
                  value={statusUpdate.newStatus}
                  label="New Status"
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, newStatus: e.target.value }))}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Planning">Planning</MenuItem>
                  <MenuItem value="Review">Review</MenuItem>
                  <MenuItem value="On Hold">On Hold</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Reason for Status Change"
                value={statusUpdate.reason}
                onChange={(e) => setStatusUpdate(prev => ({ ...prev, reason: e.target.value }))}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional Notes"
                value={statusUpdate.notes}
                onChange={(e) => setStatusUpdate(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes about this status change..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setStatusUpdateDialog(false);
              setStatusUpdate({ newStatus: '', reason: '', notes: '' });
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateProjectStatus}
            disabled={!statusUpdate.newStatus}
            sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7b5cac' } }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Milestone Dialog */}
      <Dialog
        open={milestoneDialog}
        onClose={() => setMilestoneDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Milestone Status</DialogTitle>
        <DialogContent>
          {selectedMilestone && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                {selectedMilestone.title}
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedMilestone.status}
                  label="Status"
                  onChange={(e) => setSelectedMilestone(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Blocked">Blocked</MenuItem>
                </Select>
              </FormControl>

              {selectedMilestone.status === 'In Progress' && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Progress: {selectedMilestone.progress || 0}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={selectedMilestone.progress || 0} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                placeholder="Add notes about milestone progress..."
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMilestoneDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveMilestone}
          >
            Update Milestone
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add New Milestone Dialog */}
      <Dialog
        open={newMilestoneDialog}
        onClose={() => setNewMilestoneDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Milestone</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Milestone Title"
              value={milestoneForm.title}
              onChange={(e) => setMilestoneForm(prev => ({ ...prev, title: e.target.value }))}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              type="date"
              label="Due Date"
              value={milestoneForm.dueDate}
              onChange={(e) => setMilestoneForm(prev => ({ ...prev, dueDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={milestoneForm.status}
                label="Status"
                onChange={(e) => setMilestoneForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Blocked">Blocked</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={milestoneForm.description}
              onChange={(e) => setMilestoneForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this milestone..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewMilestoneDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddMilestone}
          >
            Add Milestone
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog 
        open={viewDetailsDialog} 
        onClose={() => {
          setViewDetailsDialog(false);
          setDetailsTab(0);
        }}
        maxWidth="lg"
        fullWidth
        sx={{ '& .MuiDialog-paper': { height: '90vh' } }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#8b6cbc', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ViewIcon />
            Project Details
          </Box>
          <IconButton 
            onClick={() => {
              setViewDetailsDialog(false);
              setDetailsTab(0);
            }}
            sx={{ color: 'white' }}
            size="small"
          >
            <BlockedIcon />
          </IconButton>
        </DialogTitle>
        
        {selectedProject && (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
              <Tabs 
                value={detailsTab} 
                onChange={(e, newValue) => setDetailsTab(newValue)}
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
                <Tab label="Overview" />
                <Tab label="Timeline" />
                <Tab label="Team" />
                <Tab label="Deliverables" />
                <Tab label="Activity" />
              </Tabs>
            </Box>
            
            <DialogContent sx={{ p: 0, flex: 1, overflow: 'hidden' }}>
              {detailsTab === 0 && (
                <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
                  {/* Overview Tab */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Project Header */}
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {selectedProject.title}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            {selectedProject.description || 'No description available'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Chip 
                              label={selectedProject.status} 
                              color={getStatusColor(selectedProject.status)}
                              size="medium"
                            />
                            <Chip 
                              label={selectedProject.priority || 'Medium'} 
                              color={selectedProject.priority === 'High' ? 'error' : selectedProject.priority === 'Low' ? 'default' : 'warning'}
                              variant="outlined"
                              size="medium"
                            />
                            <Chip 
                              label={`${selectedProject.progress || 0}% Complete`}
                              color="primary"
                              variant="outlined"
                              size="medium"
                            />
                          </Box>
                        </Box>
                        <Avatar 
                          sx={{ 
                            width: 80, 
                            height: 80, 
                            bgcolor: '#8b6cbc',
                            fontSize: '2rem'
                          }}
                        >
                          {selectedProject.title?.charAt(0) || 'P'}
                        </Avatar>
                      </Box>
                      
                      {/* Progress Bar */}
                      <Box sx={{ mt: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Overall Progress
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {selectedProject.progress || 0}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={selectedProject.progress || 0}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: 'rgba(139, 108, 188, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: '#8b6cbc'
                            }
                          }}
                        />
                      </Box>
                    </Paper>

                    {/* Key Information Grid */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 3, 
                      flexWrap: 'wrap',
                      '& > *': { flex: 1, minWidth: { xs: '100%', md: 'calc(50% - 12px)' } }
                    }}>
                      {/* Timeline Information */}
                      <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ScheduleIcon sx={{ color: '#8b6cbc' }} />
                          Timeline
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Start Date</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {selectedProject.startDate && new Date(selectedProject.startDate) && !isNaN(new Date(selectedProject.startDate).getTime())
                                ? format(new Date(selectedProject.startDate), 'MMM dd, yyyy')
                                : 'Not set'
                              }
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">End Date</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {selectedProject.endDate && new Date(selectedProject.endDate) && !isNaN(new Date(selectedProject.endDate).getTime())
                                ? format(new Date(selectedProject.endDate), 'MMM dd, yyyy')
                                : 'Not set'
                              }
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Days Until Deadline</Typography>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 'bold',
                              color: (selectedProject.daysUntilDeadline && selectedProject.daysUntilDeadline < 30) ? 'error.main' : 'text.primary'
                            }}>
                              {selectedProject.daysUntilDeadline || 'N/A'} days
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>

                      {/* Team Information */}
                      <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TeamIcon sx={{ color: '#8b6cbc' }} />
                          Team
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Project Lead</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {typeof selectedProject.lead === 'string' 
                                ? selectedProject.lead || 'Not assigned'
                                : selectedProject.lead?.name || 'Not assigned'
                              }
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Team Size</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {selectedProject.team || 0} members
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Department</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {selectedProject.department || 'Not specified'}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Box>

                    {/* Milestones Summary */}
                    <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MilestoneIcon sx={{ color: '#8b6cbc' }} />
                        Milestones Summary
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 3, 
                        flexWrap: 'wrap',
                        '& > *': { flex: 1, minWidth: { xs: '100%', sm: 'calc(25% - 12px)' } }
                      }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {selectedProject.milestones?.length || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Total</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {selectedProject.milestones?.filter(m => m.status === 'Completed').length || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Completed</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {selectedProject.milestones?.filter(m => m.status === 'In Progress').length || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">In Progress</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                            {selectedProject.milestones?.filter(m => m.status === 'Pending').length || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Pending</Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              )}

              {detailsTab === 1 && (
                <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
                  {/* Timeline Tab */}
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelineIcon sx={{ color: '#8b6cbc' }} />
                    Project Timeline
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Project Start */}
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #8b6cbc' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#8b6cbc', width: 32, height: 32 }}>
                          <PlayIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            Project Start
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedProject.startDate && new Date(selectedProject.startDate) && !isNaN(new Date(selectedProject.startDate).getTime())
                              ? format(new Date(selectedProject.startDate), 'MMM dd, yyyy')
                              : 'Not set'
                            }
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>

                    {/* Milestones */}
                    {selectedProject.milestones?.map((milestone, index) => (
                      <Paper 
                        key={milestone.id} 
                        elevation={1} 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2,
                          borderLeft: `4px solid ${
                            milestone.status === 'Completed' ? 'green' :
                            milestone.status === 'In Progress' ? 'blue' : 'grey'
                          }`
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {getMilestoneIcon(milestone.status)}
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {milestone.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Due: {milestone.dueDate && new Date(milestone.dueDate) && !isNaN(new Date(milestone.dueDate).getTime())
                                ? format(new Date(milestone.dueDate), 'MMM dd, yyyy')
                                : 'No due date'
                              }
                            </Typography>
                            {milestone.status === 'In Progress' && milestone.progress && (
                              <Box sx={{ mt: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={milestone.progress}
                                  sx={{ 
                                    height: 4, 
                                    borderRadius: 2,
                                    bgcolor: 'rgba(139, 108, 188, 0.1)',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: '#8b6cbc'
                                    }
                                  }}
                                />
                              </Box>
                            )}
                          </Box>
                          <Chip 
                            label={milestone.status} 
                            size="small"
                            color={
                              milestone.status === 'Completed' ? 'success' : 
                              milestone.status === 'In Progress' ? 'primary' : 'default'
                            }
                          />
                        </Box>
                      </Paper>
                    )) || (
                      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        <MilestoneIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                        <Typography>No milestones defined</Typography>
                      </Box>
                    )}

                    {/* Project End */}
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #8b6cbc' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#8b6cbc', width: 32, height: 32 }}>
                          <CheckIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            Project End
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedProject.endDate && new Date(selectedProject.endDate) && !isNaN(new Date(selectedProject.endDate).getTime())
                              ? format(new Date(selectedProject.endDate), 'MMM dd, yyyy')
                              : 'Not set'
                            }
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              )}

              {detailsTab === 2 && (
                <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
                  {/* Team Tab */}
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TeamIcon sx={{ color: '#8b6cbc' }} />
                    Team Members
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Project Lead */}
                    <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#8b6cbc' }}>
                        Project Lead
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#8b6cbc', width: 48, height: 48 }}>
                          {typeof selectedProject.lead === 'string' 
                            ? selectedProject.lead?.split(' ').map(n => n[0]).join('') || 'PL'
                            : selectedProject.lead?.name?.split(' ').map(n => n[0]).join('') || 'PL'
                          }
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {typeof selectedProject.lead === 'string' 
                              ? selectedProject.lead || 'Not assigned'
                              : selectedProject.lead?.name || 'Not assigned'
                            }
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Principal Investigator
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>

                    {/* Team Stats */}
                    <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#8b6cbc' }}>
                        Team Overview
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 3, 
                        flexWrap: 'wrap',
                        '& > *': { flex: 1, minWidth: { xs: '100%', sm: 'calc(50% - 12px)' } }
                      }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {selectedProject.team || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Total Members</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {Math.floor((selectedProject.team || 0) * 0.8)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Active Members</Typography>
                        </Box>
                      </Box>
                    </Paper>

                    {/* Team Members List (Mock) */}
                    <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#8b6cbc' }}>
                        Team Members
                      </Typography>
                      <List>
                        {Array.from({ length: Math.min(selectedProject.team || 1, 5) }, (_, index) => (
                          <ListItem key={index}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: index === 0 ? '#8b6cbc' : 'grey.400' }}>
                                {index === 0 
                                  ? (typeof selectedProject.lead === 'string' 
                                      ? selectedProject.lead?.charAt(0) || 'M' 
                                      : selectedProject.lead?.name?.charAt(0) || 'M')
                                  : `M${index + 1}`
                                }
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={index === 0 ? (typeof selectedProject.lead === 'string' ? selectedProject.lead : selectedProject.lead?.name || 'Project Lead') : `Team Member ${index + 1}`}
                              secondary={index === 0 ? 'Principal Investigator' : `Co-Investigator`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Box>
                </Box>
              )}

              {detailsTab === 3 && (
                <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
                  {/* Deliverables Tab */}
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TaskIcon sx={{ color: '#8b6cbc' }} />
                    Project Deliverables
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {selectedProject.deliverables?.map((deliverable) => (
                      <Paper 
                        key={deliverable.id} 
                        elevation={1} 
                        sx={{ 
                          p: 2.5, 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': { 
                            boxShadow: 2,
                            borderColor: '#8b6cbc' 
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Box sx={{ mt: 0.5 }}>
                            {getDeliverableIcon(deliverable.status)}
                          </Box>
                          
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {deliverable.title}
                              </Typography>
                              <Chip 
                                label={deliverable.status} 
                                size="small"
                                color={
                                  deliverable.status === 'Delivered' ? 'success' : 
                                  deliverable.status === 'In Progress' ? 'primary' : 'default'
                                }
                              />
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Type:</strong> {deliverable.type}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Due Date:</strong> {deliverable.dueDate && new Date(deliverable.dueDate) && !isNaN(new Date(deliverable.dueDate).getTime())
                                  ? format(new Date(deliverable.dueDate), 'MMM dd, yyyy')
                                  : 'No due date set'
                                }
                              </Typography>
                            </Box>
                            
                            {deliverable.description && (
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {deliverable.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    )) || (
                      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        <TaskIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                        <Typography>No deliverables defined</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {detailsTab === 4 && (
                <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
                  {/* Activity Tab */}
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReportIcon sx={{ color: '#8b6cbc' }} />
                    Recent Activity
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Mock Activity Timeline */}
                    {[
                      { 
                        action: 'Project status updated to Active',
                        date: new Date(Date.now() - 86400000 * 2),
                        user: typeof selectedProject.lead === 'string' ? selectedProject.lead || 'System' : selectedProject.lead?.name || 'System',
                        type: 'status'
                      },
                      {
                        action: 'New milestone added: Data Collection Phase',
                        date: new Date(Date.now() - 86400000 * 5),
                        user: typeof selectedProject.lead === 'string' ? selectedProject.lead || 'System' : selectedProject.lead?.name || 'System',
                        type: 'milestone'
                      },
                      {
                        action: 'Team member assigned to project',
                        date: new Date(Date.now() - 86400000 * 7),
                        user: 'Admin',
                        type: 'team'
                      },
                      {
                        action: 'Project created',
                        date: selectedProject.startDate ? new Date(selectedProject.startDate) : new Date(Date.now() - 86400000 * 30),
                        user: typeof selectedProject.lead === 'string' ? selectedProject.lead || 'System' : selectedProject.lead?.name || 'System',
                        type: 'creation'
                      }
                    ].map((activity, index) => (
                      <Paper key={index} elevation={1} sx={{ p: 2.5, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: activity.type === 'status' ? '#8b6cbc' : 
                                      activity.type === 'milestone' ? 'primary.main' :
                                      activity.type === 'team' ? 'success.main' : 'grey.500',
                              width: 32, 
                              height: 32 
                            }}
                          >
                            {activity.type === 'status' ? <EditIcon /> :
                             activity.type === 'milestone' ? <MilestoneIcon /> :
                             activity.type === 'team' ? <TeamIcon /> : <AddIcon />}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {activity.action}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(activity.date, 'MMM dd, yyyy • h:mm a')} • by {activity.user}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ProjectStatusPage;