'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Stack,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  MenuItem,
  Grid,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CompletedIcon,
  Schedule as OngoingIcon,
  Warning as DelayedIcon,
  Assignment as ProjectIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as BudgetIcon,
  Visibility as ViewIcon,
  FileDownload as ExportIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const ProjectsTracking = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchTerm, statusFilter, departmentFilter, projects]);

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
      setFilteredProjects(data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(project => {
        const title = (project.title || '').toLowerCase();
        const pi = (project.principalInvestigator || '').toLowerCase();
        const dept = (project.department || '').toLowerCase();
        
        return title.includes(term) || pi.includes(term) || dept.includes(term);
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Apply department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(project => project.department === departmentFilter);
    }

    setFilteredProjects(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'ONGOING':
        return 'primary';
      case 'DELAYED':
        return 'warning';
      case 'AT_RISK':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CompletedIcon fontSize="small" />;
      case 'ONGOING':
        return <OngoingIcon fontSize="small" />;
      case 'DELAYED':
      case 'AT_RISK':
        return <DelayedIcon fontSize="small" />;
      default:
        return <ProjectIcon fontSize="small" />;
    }
  };

  const calculateProgress = (project) => {
    if (!project.milestones || project.milestones.length === 0) return 0;
    
    const completed = project.milestones.filter(m => m.completed).length;
    return Math.round((completed / project.milestones.length) * 100);
  };

  const getDepartments = () => {
    const depts = new Set();
    projects.forEach(p => {
      if (p.department) depts.add(p.department);
    });
    return Array.from(depts).sort();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProjectStats = () => {
    return {
      total: projects.length,
      ongoing: projects.filter(p => p.status === 'ONGOING').length,
      completed: projects.filter(p => p.status === 'COMPLETED').length,
      delayed: projects.filter(p => p.status === 'DELAYED' || p.status === 'AT_RISK').length,
      totalBudget: projects.reduce((sum, p) => sum + (p.totalBudgetAmount || 0), 0)
    };
  };

  if (!mounted || loading) {
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
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress size={60} sx={{ color: '#8b6cbc' }} />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
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
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="error" gutterBottom>
              Error Loading Projects
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={fetchProjects}
              sx={{
                bgcolor: '#8b6cbc',
                '&:hover': { bgcolor: '#7a5caa' }
              }}
            >
              Retry
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  const stats = getProjectStats();

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
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #f3f4f6',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderColor: '#e5e7eb'
              }
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 0.5, lineHeight: 1 }}>
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                      Total Projects
                    </Typography>
                  </Box>
                  <ProjectIcon sx={{ fontSize: 28, color: '#8b6cbc', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #f3f4f6',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderColor: '#e5e7eb'
              }
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563eb', mb: 0.5, lineHeight: 1 }}>
                      {stats.ongoing}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                      Ongoing Projects
                    </Typography>
                  </Box>
                  <OngoingIcon sx={{ fontSize: 28, color: '#2563eb', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #f3f4f6',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderColor: '#e5e7eb'
              }
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981', mb: 0.5, lineHeight: 1 }}>
                      {stats.completed}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                      Completed
                    </Typography>
                  </Box>
                  <CompletedIcon sx={{ fontSize: 28, color: '#10b981', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #f3f4f6',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderColor: '#e5e7eb'
              }
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ef4444', mb: 0.5, lineHeight: 1 }}>
                      {stats.delayed}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                      Delayed/At Risk
                    </Typography>
                  </Box>
                  <DelayedIcon sx={{ fontSize: 28, color: '#ef4444', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search projects by title, PI, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flex: 1, minWidth: 300 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ minWidth: 180 }}
                size="small"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="ONGOING">Ongoing</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="DELAYED">Delayed</MenuItem>
                <MenuItem value="AT_RISK">At Risk</MenuItem>
              </TextField>
              <TextField
                select
                label="Department"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                sx={{ minWidth: 200 }}
                size="small"
              >
                <MenuItem value="all">All Departments</MenuItem>
                {getDepartments().map((dept) => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </TextField>
              {(searchTerm || statusFilter !== 'all' || departmentFilter !== 'all') && (
                <Chip
                  label="Clear Filters"
                  onDelete={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDepartmentFilter('all');
                  }}
                  sx={{ ml: 'auto' }}
                />
              )}
            </Box>
          </Stack>
        </Paper>

        {/* Projects Table */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          {filteredProjects.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <ProjectIcon sx={{ fontSize: 64, color: '#e5e7eb', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#6b7280', mb: 1 }}>
                {searchTerm ? 'No projects found' : 'No projects yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'Projects will appear here once they are created'
                }
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#1f2937', py: 2.5, fontSize: '0.875rem' }}>
                      Project
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1f2937', py: 2.5, fontSize: '0.875rem' }}>
                      Principal Investigator
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1f2937', py: 2.5, fontSize: '0.875rem' }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1f2937', py: 2.5, fontSize: '0.875rem' }}>
                      Progress
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1f2937', py: 2.5, fontSize: '0.875rem' }}>
                      Timeline
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1f2937', py: 2.5, fontSize: '0.875rem', textAlign: 'right' }}>
                      Budget
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1f2937', py: 2.5, fontSize: '0.875rem', textAlign: 'center' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProjects.map((project) => {
                    const progress = calculateProgress(project);
                    return (
                      <TableRow
                        key={project.id}
                        sx={{
                          '&:hover': { 
                            backgroundColor: '#f5f3f7',
                          },
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '& td': { borderBottom: '1px solid #f3f4f6' }
                        }}
                        onClick={() => router.push(`/institution/projects/${project.id}`)}
                      >
                        <TableCell sx={{ py: 2.5 }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem', mb: 0.5 }}>
                              {project.title}
                            </Typography>
                            <Chip
                              label={project.department || 'N/A'}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(139, 108, 188, 0.08)',
                                color: '#8b6cbc',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 20
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: '#8b6cbc',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                            >
                              {project.principalInvestigator?.charAt(0) || 'P'}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                              {project.principalInvestigator || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Chip
                            label={project.status || 'UNKNOWN'}
                            size="small"
                            color={getStatusColor(project.status)}
                            icon={getStatusIcon(project.status)}
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 2.5, minWidth: 200 }}>
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280' }}>
                                {progress}% Complete
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                                {project.milestones?.filter(m => m.completed).length || 0}/{project.milestones?.length || 0} Milestones
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={progress} 
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: '#e5e7eb',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: progress === 100 ? '#10b981' : progress > 50 ? '#8b6cbc' : '#f59e0b',
                                  borderRadius: 4
                                }
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Box>
                            <Typography variant="caption" sx={{ display: 'block', color: '#6b7280', fontWeight: 600 }}>
                              Start: {formatDate(project.startDate)}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', color: '#6b7280', fontWeight: 600 }}>
                              End: {formatDate(project.endDate)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2.5, textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>
                            {formatCurrency(project.totalBudgetAmount || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2.5, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="View Details" arrow>
                            <IconButton
                              size="small"
                              onClick={() => router.push(`/institution/projects/${project.id}`)}
                              sx={{ 
                                color: '#8b6cbc',
                                '&:hover': {
                                  bgcolor: 'rgba(139, 108, 188, 0.1)',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Results Count */}
        {filteredProjects.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredProjects.length} of {projects.length} projects
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ProjectsTracking;
