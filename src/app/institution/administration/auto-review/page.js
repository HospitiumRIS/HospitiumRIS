'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Stack,
  Tooltip,
  Paper,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  CheckCircle as CheckCircleIcon,
  Science as TrialIcon,
  Assignment as ProposalIcon,
  Gavel as EthicsIcon,
  Extension as CustomIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { useRouter } from 'next/navigation';

const WORKFLOW_TYPES = [
  { value: 'CLINICAL_TRIAL', label: 'Clinical Trial', icon: <TrialIcon />, color: '#2196F3' },
  { value: 'RESEARCH_PROPOSAL', label: 'Research Proposal', icon: <ProposalIcon />, color: '#FF9800' },
  { value: 'ETHICS_APPLICATION', label: 'Ethics Application', icon: <EthicsIcon />, color: '#9C27B0' },
  { value: 'CUSTOM', label: 'Custom', icon: <CustomIcon />, color: '#607D8B' }
];

export default function AutoReviewPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'CLINICAL_TRIAL',
    isActive: true,
    isDefault: false,
    autoRouteOnPass: false,
    requireHumanReview: true
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/institution/auto-review/workflows');
      const data = await response.json();
      
      if (data.success) {
        setWorkflows(data.workflows);
      } else {
        setError('Failed to load workflows');
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
      setError('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async () => {
    try {
      setError('');
      const response = await fetch('/api/institution/auto-review/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Workflow created successfully');
        setOpenDialog(false);
        fetchWorkflows();
        setFormData({
          name: '',
          description: '',
          type: 'CLINICAL_TRIAL',
          isActive: true,
          isDefault: false,
          autoRouteOnPass: false,
          requireHumanReview: true
        });
      } else {
        setError(data.error || 'Failed to create workflow');
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      setError('Failed to create workflow');
    }
  };

  const handleDeleteWorkflow = async (id) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const response = await fetch(`/api/institution/auto-review/workflows/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Workflow deleted successfully');
        fetchWorkflows();
      } else {
        setError(data.error || 'Failed to delete workflow');
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      setError('Failed to delete workflow');
    }
  };

  const handleToggleActive = async (workflow) => {
    try {
      const response = await fetch(`/api/institution/auto-review/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...workflow, isActive: !workflow.isActive })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Workflow ${workflow.isActive ? 'deactivated' : 'activated'} successfully`);
        fetchWorkflows();
      } else {
        setError(data.error || 'Failed to update workflow');
      }
    } catch (error) {
      console.error('Error updating workflow:', error);
      setError('Failed to update workflow');
    }
  };

  const getWorkflowTypeConfig = (type) => {
    return WORKFLOW_TYPES.find(t => t.value === type) || WORKFLOW_TYPES[0];
  };

  const filteredWorkflows = selectedTab === 'all' 
    ? workflows 
    : workflows.filter(w => w.type === selectedTab);

  const stats = {
    total: workflows.length,
    active: workflows.filter(w => w.isActive).length,
    clinicalTrials: workflows.filter(w => w.type === 'CLINICAL_TRIAL').length,
    proposals: workflows.filter(w => w.type === 'RESEARCH_PROPOSAL').length,
    ethics: workflows.filter(w => w.type === 'ETHICS_APPLICATION').length
  };

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Auto-Review Configuration"
          description="Configure automated review workflows and parameters"
          icon={<SettingsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Administration', path: '/institution' },
            { label: 'Auto-Review' }
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

  return (
    <>
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Auto-Review Configuration"
          description="Configure automated review workflows and parameters"
          icon={<SettingsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Administration', path: '/institution' },
            { label: 'Auto-Review' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Stats Cards */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2.5, 
          mb: 4, 
          flexWrap: 'wrap',
          '& > *': {
            flex: '1 1 calc(20% - 20px)',
            minWidth: '180px'
          }
        }}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: '#8b6cbc',
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
                Total Workflows
              </Typography>
              <AssessmentIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.total}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              All workflows
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: '#8b6cbc',
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
                Active
              </Typography>
              <CheckCircleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.active}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Currently active
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: '#8b6cbc',
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
                Clinical Trials
              </Typography>
              <TrialIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.clinicalTrials}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Trial workflows
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: '#8b6cbc',
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
                Proposals
              </Typography>
              <ProposalIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.proposals}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Proposal workflows
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: '#8b6cbc',
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
                Ethics Apps
              </Typography>
              <EthicsIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.ethics}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Ethics workflows
            </Typography>
          </Paper>
        </Box>

        {/* Header Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Review Workflows
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{
              bgcolor: '#8b6cbc',
              '&:hover': { bgcolor: '#7b5cac' }
            }}
          >
            Create Workflow
          </Button>
        </Box>

        {/* Tabs */}
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              '&.Mui-selected': {
                color: '#8b6cbc'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#8b6cbc'
            }
          }}
        >
          <Tab label="All Workflows" value="all" />
          <Tab label="Clinical Trials" value="CLINICAL_TRIAL" />
          <Tab label="Research Proposals" value="RESEARCH_PROPOSAL" />
          <Tab label="Ethics Applications" value="ETHICS_APPLICATION" />
          <Tab label="Custom" value="CUSTOM" />
        </Tabs>

        {/* Workflows Flexbox */}
        {filteredWorkflows.length === 0 ? (
          <Paper sx={{ 
            p: 6, 
            textAlign: 'center', 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px dashed #e0e0e0'
          }}>
            <AssessmentIcon sx={{ fontSize: 64, color: '#8b6cbc', opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              No workflows found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              Create your first auto-review workflow to get started with automated submission reviews
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{
                bgcolor: '#8b6cbc',
                '&:hover': { bgcolor: '#7b5cac' },
                px: 3,
                py: 1.2,
                borderRadius: 1.5
              }}
            >
              Create Workflow
            </Button>
          </Paper>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 3,
            '& > *': {
              flex: '1 1 calc(33.333% - 20px)',
              minWidth: '300px',
              maxWidth: '100%'
            }
          }}>
            {filteredWorkflows.map((workflow) => {
              const typeConfig = getWorkflowTypeConfig(workflow.type);
              return (
                <Card 
                  key={workflow.id}
                  sx={{ 
                    borderRadius: 2, 
                    display: 'flex', 
                    flexDirection: 'column',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #f0f0f0',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(139, 108, 188, 0.15)',
                      transform: 'translateY(-4px)',
                      borderColor: '#8b6cbc'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2.5 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1.5,
                          bgcolor: `${typeConfig.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          color: typeConfig.color,
                          flexShrink: 0
                        }}
                      >
                        {typeConfig.icon}
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600, 
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {workflow.name}
                        </Typography>
                        <Chip
                          label={typeConfig.label}
                          size="small"
                          sx={{
                            bgcolor: `${typeConfig.color}15`,
                            color: typeConfig.color,
                            fontWeight: 500,
                            fontSize: '0.7rem',
                            height: 22
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Description */}
                    {workflow.description ? (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: 40
                        }}
                      >
                        {workflow.description}
                      </Typography>
                    ) : (
                      <Typography 
                        variant="body2" 
                        color="text.disabled" 
                        sx={{ 
                          mb: 2.5,
                          fontStyle: 'italic',
                          minHeight: 40
                        }}
                      >
                        No description provided
                      </Typography>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Stats */}
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimelineIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Stages
                          </Typography>
                        </Box>
                        <Chip 
                          label={workflow.stages?.length || 0}
                          size="small"
                          sx={{ 
                            bgcolor: '#f5f5f5',
                            fontWeight: 600,
                            minWidth: 32,
                            height: 24
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PeopleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Executions
                          </Typography>
                        </Box>
                        <Chip 
                          label={workflow._count?.executions || 0}
                          size="small"
                          sx={{ 
                            bgcolor: '#f5f5f5',
                            fontWeight: 600,
                            minWidth: 32,
                            height: 24
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Status
                        </Typography>
                        <Chip
                          label={workflow.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            bgcolor: workflow.isActive ? '#4caf5015' : '#f5f5f5',
                            color: workflow.isActive ? '#4caf50' : 'text.secondary',
                            fontWeight: 600,
                            height: 24,
                            '& .MuiChip-icon': {
                              fontSize: 16
                            }
                          }}
                          icon={workflow.isActive ? <CheckCircleIcon /> : undefined}
                        />
                      </Box>
                      {workflow.isDefault && (
                        <Box sx={{ pt: 0.5 }}>
                          <Chip
                            label="Default Workflow"
                            size="small"
                            sx={{
                              bgcolor: '#8b6cbc15',
                              color: '#8b6cbc',
                              fontWeight: 600,
                              width: '100%',
                              height: 26
                            }}
                          />
                        </Box>
                      )}
                    </Stack>
                  </CardContent>

                  {/* Actions */}
                  <Divider />
                  <CardActions sx={{ p: 2, bgcolor: '#fafafa', justifyContent: 'space-between' }}>
                    <Button
                      size="medium"
                      startIcon={<EditIcon />}
                      onClick={() => router.push(`/institution/administration/auto-review/${workflow.id}`)}
                      sx={{ 
                        color: '#8b6cbc',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: '#8b6cbc10'
                        }
                      }}
                    >
                      Configure
                    </Button>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title={workflow.isActive ? 'Deactivate Workflow' : 'Activate Workflow'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleActive(workflow)}
                          sx={{ 
                            color: workflow.isActive ? '#ff9800' : '#4caf50',
                            '&:hover': {
                              bgcolor: workflow.isActive ? '#ff980015' : '#4caf5015'
                            }
                          }}
                        >
                          {workflow.isActive ? <PauseIcon /> : <PlayIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Workflow">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                          sx={{
                            color: '#f44336',
                            '&:hover': {
                              bgcolor: '#f4433615'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        )}
      </Container>

      {/* Create Workflow Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(139, 108, 188, 0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AddIcon />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Create New Workflow
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Configure automated review workflow settings
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3.5}>
            {/* Basic Information Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc', display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon sx={{ fontSize: 18 }} />
                Basic Information
              </Typography>
              <Stack spacing={2.5}>
                <TextField
                  label="Workflow Name"
                  fullWidth
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Standard Clinical Trial Review"
                  helperText="Choose a descriptive name for this workflow"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#8b6cbc',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#8b6cbc',
                    },
                  }}
                />
                
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the purpose and scope of this workflow..."
                  helperText="Optional: Provide details about when and how this workflow should be used"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#8b6cbc',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#8b6cbc',
                    },
                  }}
                />

                <FormControl fullWidth>
                  <InputLabel sx={{ '&.Mui-focused': { color: '#8b6cbc' } }}>Workflow Type</InputLabel>
                  <Select
                    value={formData.type}
                    label="Workflow Type"
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    sx={{
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#8b6cbc',
                      },
                    }}
                  >
                    {WORKFLOW_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              bgcolor: `${type.color}15`,
                              color: type.color 
                            }}
                          >
                            {type.icon}
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {type.label}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            <Divider />

            {/* Workflow Behavior Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc', display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon sx={{ fontSize: 18 }} />
                Workflow Behavior
              </Typography>
              <Stack spacing={2}>
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Active Status
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Enable this workflow to start processing submissions immediately
                      </Typography>
                    </Box>
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#8b6cbc',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#8b6cbc',
                        },
                      }}
                    />
                  </Box>
                </Paper>

                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Default Workflow
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Set as the default workflow for this type of submission
                      </Typography>
                    </Box>
                    <Switch
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#8b6cbc',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#8b6cbc',
                        },
                      }}
                    />
                  </Box>
                </Paper>

                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Require Human Review
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        All automated decisions must be verified by a human reviewer
                      </Typography>
                    </Box>
                    <Switch
                      checked={formData.requireHumanReview}
                      onChange={(e) => setFormData({ ...formData, requireHumanReview: e.target.checked })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#8b6cbc',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#8b6cbc',
                        },
                      }}
                    />
                  </Box>
                </Paper>

                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Auto-Route on Pass
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Automatically advance to the next stage when all checks pass
                      </Typography>
                    </Box>
                    <Switch
                      checked={formData.autoRouteOnPass}
                      onChange={(e) => setFormData({ ...formData, autoRouteOnPass: e.target.checked })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#8b6cbc',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#8b6cbc',
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2.5, bgcolor: '#f9f9f9', borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateWorkflow}
            variant="contained"
            disabled={!formData.name}
            startIcon={<AddIcon />}
            sx={{
              bgcolor: '#8b6cbc',
              '&:hover': { bgcolor: '#7b5cac' },
              '&:disabled': { bgcolor: 'rgba(0,0,0,0.12)' },
              px: 3,
              py: 1
            }}
          >
            Create Workflow
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
