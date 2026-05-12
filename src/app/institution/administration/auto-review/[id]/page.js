'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
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
  Stack,
  Tooltip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Rule as RuleIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { useRouter } from 'next/navigation';

const VALIDATION_TYPES = [
  { value: 'FIELD_COMPLETENESS', label: 'Field Completeness' },
  { value: 'DOCUMENT_REQUIREMENTS', label: 'Document Requirements' },
  { value: 'BUDGET_VALIDATION', label: 'Budget Validation' },
  { value: 'TIMELINE_VALIDATION', label: 'Timeline Validation' },
  { value: 'RISK_ASSESSMENT', label: 'Risk Assessment' },
  { value: 'REGULATORY_COMPLIANCE', label: 'Regulatory Compliance' },
  { value: 'TEAM_QUALIFICATIONS', label: 'Team Qualifications' },
  { value: 'CUSTOM_RULE', label: 'Custom Rule' }
];

export default function WorkflowBuilderPage({ params }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openStageDialog, setOpenStageDialog] = useState(false);
  const [openParameterDialog, setOpenParameterDialog] = useState(false);
  const [openReviewerDialog, setOpenReviewerDialog] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [availableReviewers, setAvailableReviewers] = useState([]);
  const [reviewerRoles, setReviewerRoles] = useState([]);

  const [stageForm, setStageForm] = useState({
    name: '',
    description: '',
    isRequired: true,
    allowSkip: false,
    autoApproveOnPass: false,
    daysToComplete: '',
    requiresAllReviewers: false,
    minimumApprovals: 1
  });

  const [parameterForm, setParameterForm] = useState({
    name: '',
    type: 'FIELD_COMPLETENESS',
    config: { fields: [] },
    isRequired: true,
    failOnError: true,
    weight: 5,
    errorMessage: '',
    successMessage: ''
  });

  const [reviewerForm, setReviewerForm] = useState({
    userId: null,
    roleId: '',
    externalEmail: '',
    externalName: '',
    isRequired: true,
    order: 0
  });

  useEffect(() => {
    fetchWorkflow();
    fetchReviewers();
    fetchRoles();
  }, [unwrappedParams.id]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/institution/auto-review/workflows/${unwrappedParams.id}`);
      const data = await response.json();
      
      if (data.success) {
        setWorkflow(data.workflow);
      } else {
        setError('Failed to load workflow');
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
      setError('Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewers = async () => {
    try {
      const response = await fetch('/api/institution/auto-review/reviewers');
      const data = await response.json();
      if (data.success) {
        setAvailableReviewers(data.users);
      }
    } catch (error) {
      console.error('Error fetching reviewers:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/institution/auto-review/roles');
      const data = await response.json();
      if (data.success) {
        setReviewerRoles(data.roles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleSaveStage = async () => {
    try {
      setError('');
      const url = selectedStage 
        ? `/api/institution/auto-review/stages/${selectedStage.id}`
        : `/api/institution/auto-review/workflows/${unwrappedParams.id}/stages`;
      
      const method = selectedStage ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stageForm)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(selectedStage ? 'Stage updated successfully' : 'Stage created successfully');
        setOpenStageDialog(false);
        fetchWorkflow();
        resetStageForm();
        setSelectedStage(null);
      } else {
        setError(data.error || 'Failed to save stage');
      }
    } catch (error) {
      console.error('Error saving stage:', error);
      setError('Failed to save stage');
    }
  };

  const handleDeleteStage = async (stageId) => {
    if (!confirm('Are you sure you want to delete this stage?')) return;

    try {
      const response = await fetch(`/api/institution/auto-review/stages/${stageId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Stage deleted successfully');
        fetchWorkflow();
      } else {
        setError(data.error || 'Failed to delete stage');
      }
    } catch (error) {
      console.error('Error deleting stage:', error);
      setError('Failed to delete stage');
    }
  };

  const handleAddParameter = async () => {
    try {
      setError('');
      const response = await fetch(`/api/institution/auto-review/stages/${selectedStage.id}/parameters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameterForm)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Validation parameter added successfully');
        setOpenParameterDialog(false);
        fetchWorkflow();
        resetParameterForm();
      } else {
        setError(data.error || 'Failed to add parameter');
      }
    } catch (error) {
      console.error('Error adding parameter:', error);
      setError('Failed to add parameter');
    }
  };

  const handleAddReviewer = async () => {
    try {
      setError('');
      const response = await fetch(`/api/institution/auto-review/stages/${selectedStage.id}/reviewers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewerForm)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Reviewer added successfully');
        setOpenReviewerDialog(false);
        fetchWorkflow();
        resetReviewerForm();
      } else {
        setError(data.error || 'Failed to add reviewer');
      }
    } catch (error) {
      console.error('Error adding reviewer:', error);
      setError('Failed to add reviewer');
    }
  };

  const resetStageForm = () => {
    setStageForm({
      name: '',
      description: '',
      isRequired: true,
      allowSkip: false,
      autoApproveOnPass: false,
      daysToComplete: '',
      requiresAllReviewers: false,
      minimumApprovals: 1
    });
  };

  const resetParameterForm = () => {
    setParameterForm({
      name: '',
      type: 'FIELD_COMPLETENESS',
      config: { fields: [] },
      isRequired: true,
      failOnError: true,
      weight: 5,
      errorMessage: '',
      successMessage: ''
    });
  };

  const resetReviewerForm = () => {
    setReviewerForm({
      userId: null,
      roleId: '',
      externalEmail: '',
      externalName: '',
      isRequired: true,
      order: 0
    });
  };

  const openEditStageDialog = (stage) => {
    setSelectedStage(stage);
    setStageForm({
      name: stage.name,
      description: stage.description || '',
      isRequired: stage.isRequired,
      allowSkip: stage.allowSkip,
      autoApproveOnPass: stage.autoApproveOnPass,
      daysToComplete: stage.daysToComplete || '',
      requiresAllReviewers: stage.requiresAllReviewers,
      minimumApprovals: stage.minimumApprovals
    });
    setOpenStageDialog(true);
  };

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Workflow Builder"
          description="Configure stages, parameters, and reviewers"
          icon={<SettingsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Auto-Review', path: '/institution/administration/auto-review' },
            { label: 'Configure' }
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

  if (!workflow) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">Workflow not found</Alert>
      </Container>
    );
  }

  return (
    <>
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title={workflow.name}
          description={workflow.description || 'Configure stages, parameters, and reviewers'}
          icon={<SettingsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Auto-Review', path: '/institution/administration/auto-review' },
            { label: workflow.name }
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/institution/administration/auto-review')}
          >
            Back to Workflows
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedStage(null);
              resetStageForm();
              setOpenStageDialog(true);
            }}
            sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7b5cac' } }}
          >
            Add Stage
          </Button>
        </Box>

        {/* Workflow Overview Cards */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2.5, 
          mb: 4, 
          flexWrap: 'wrap',
          '& > *': {
            flex: '1 1 calc(25% - 19px)',
            minWidth: '200px'
          }
        }}>
          <Paper sx={{ 
            p: 2.5, 
            borderRadius: 2,
            bgcolor: '#8b6cbc',
            boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Workflow Type
              </Typography>
              <SettingsIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', fontSize: '1.1rem', mb: 0.5 }}>
              {workflow.type.replace('_', ' ')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Configuration type
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2.5, 
            borderRadius: 2,
            bgcolor: '#8b6cbc',
            boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Status
              </Typography>
            </Box>
            <Chip 
              label={workflow.isActive ? 'Active' : 'Inactive'} 
              sx={{
                bgcolor: 'rgba(255,255,255,0.25)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.1rem',
                height: 32,
                mb: 0.5
              }}
            />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Current state
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2.5, 
            borderRadius: 2,
            bgcolor: '#8b6cbc',
            boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Total Stages
              </Typography>
              <RuleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem', mb: 0.5 }}>
              {workflow.stages?.length || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Review stages
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2.5, 
            borderRadius: 2,
            bgcolor: '#8b6cbc',
            boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Executions
              </Typography>
              <PeopleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem', mb: 0.5 }}>
              {workflow.executions?.length || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Total runs
            </Typography>
          </Paper>
        </Box>

        {workflow.stages && workflow.stages.length > 0 ? (
          <Stepper orientation="vertical">
            {workflow.stages.map((stage) => (
              <Step key={stage.id} active expanded>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      width: '100%',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      color: '#8b6cbc'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: '#8b6cbc15',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#8b6cbc'
                      }}>
                        <RuleIcon sx={{ fontSize: 20 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>{stage.name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit Stage">
                        <IconButton 
                          size="small" 
                          onClick={() => openEditStageDialog(stage)}
                          sx={{
                            color: '#8b6cbc',
                            '&:hover': { bgcolor: '#8b6cbc15' }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Stage">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteStage(stage.id)}
                          sx={{
                            color: '#f44336',
                            '&:hover': { bgcolor: '#f4433615' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </StepLabel>
                <StepContent>
                  <Paper sx={{ 
                    p: 3, 
                    mb: 2, 
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #f0f0f0'
                  }}>
                    {stage.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {stage.description}
                      </Typography>
                    )}

                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      mb: 2.5, 
                      flexWrap: 'wrap',
                      '& > *': {
                        flex: '1 1 calc(25% - 12px)',
                        minWidth: '120px'
                      }
                    }}>
                      <Paper sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Required</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: stage.isRequired ? '#4caf50' : '#9e9e9e', mt: 0.5 }}>
                          {stage.isRequired ? 'Yes' : 'No'}
                        </Typography>
                      </Paper>
                      <Paper sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Auto-Approve</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: stage.autoApproveOnPass ? '#4caf50' : '#9e9e9e', mt: 0.5 }}>
                          {stage.autoApproveOnPass ? 'Yes' : 'No'}
                        </Typography>
                      </Paper>
                      <Paper sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Days to Complete</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#8b6cbc', mt: 0.5 }}>
                          {stage.daysToComplete || 'N/A'}
                        </Typography>
                      </Paper>
                      <Paper sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Min Approvals</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#8b6cbc', mt: 0.5 }}>
                          {stage.minimumApprovals}
                        </Typography>
                      </Paper>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, color: '#8b6cbc' }}>
                          <RuleIcon sx={{ fontSize: 20, mr: 1 }} />
                          Validation Parameters ({stage.parameters?.length || 0})
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            setSelectedStage(stage);
                            setOpenParameterDialog(true);
                          }}
                          sx={{
                            borderColor: '#8b6cbc',
                            color: '#8b6cbc',
                            '&:hover': {
                              borderColor: '#7b5cac',
                              bgcolor: '#8b6cbc10'
                            }
                          }}
                        >
                          Add Parameter
                        </Button>
                      </Box>
                      {stage.parameters && stage.parameters.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {stage.parameters.map((param) => (
                            <Paper key={param.id} sx={{ 
                              p: 2, 
                              bgcolor: '#fafafa', 
                              borderRadius: 1.5,
                              border: '1px solid #e0e0e0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {param.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Type: {param.type.replace('_', ' ')} • Weight: {param.weight}
                                </Typography>
                              </Box>
                              <Chip 
                                label={param.isRequired ? 'Required' : 'Optional'} 
                                size="small" 
                                sx={{
                                  bgcolor: param.isRequired ? '#8b6cbc15' : '#f5f5f5',
                                  color: param.isRequired ? '#8b6cbc' : 'text.secondary',
                                  fontWeight: 600
                                }}
                              />
                            </Paper>
                          ))}
                        </Box>
                      ) : (
                        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fafafa', borderRadius: 1.5, border: '1px dashed #e0e0e0' }}>
                          <Typography variant="body2" color="text.secondary">No validation parameters configured</Typography>
                        </Paper>
                      )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, color: '#8b6cbc' }}>
                          <PeopleIcon sx={{ fontSize: 20, mr: 1 }} />
                          Reviewers ({stage.reviewers?.length || 0})
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            setSelectedStage(stage);
                            setOpenReviewerDialog(true);
                          }}
                          sx={{
                            borderColor: '#8b6cbc',
                            color: '#8b6cbc',
                            '&:hover': {
                              borderColor: '#7b5cac',
                              bgcolor: '#8b6cbc10'
                            }
                          }}
                        >
                          Add Reviewer
                        </Button>
                      </Box>
                      {stage.reviewers && stage.reviewers.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {stage.reviewers.map((reviewer) => (
                            <Paper key={reviewer.id} sx={{ 
                              p: 2, 
                              bgcolor: '#fafafa', 
                              borderRadius: 1.5,
                              border: '1px solid #e0e0e0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {reviewer.externalName || reviewer.userId || 'User'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Role: {reviewer.role?.name || 'N/A'}{reviewer.externalEmail ? ` • ${reviewer.externalEmail}` : ''}
                                </Typography>
                              </Box>
                              <Chip 
                                label={reviewer.isRequired ? 'Required' : 'Optional'} 
                                size="small" 
                                sx={{
                                  bgcolor: reviewer.isRequired ? '#8b6cbc15' : '#f5f5f5',
                                  color: reviewer.isRequired ? '#8b6cbc' : 'text.secondary',
                                  fontWeight: 600
                                }}
                              />
                            </Paper>
                          ))}
                        </Box>
                      ) : (
                        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fafafa', borderRadius: 1.5, border: '1px dashed #e0e0e0' }}>
                          <Typography variant="body2" color="text.secondary">No reviewers assigned</Typography>
                        </Paper>
                      )}
                    </Box>
                  </Paper>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        ) : (
          <Paper sx={{ 
            p: 6, 
            textAlign: 'center', 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px dashed #e0e0e0'
          }}>
            <SettingsIcon sx={{ fontSize: 64, color: '#8b6cbc', opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              No stages configured
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              Add your first stage to start building the workflow. Stages define the review process steps.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedStage(null);
                resetStageForm();
                setOpenStageDialog(true);
              }}
              sx={{ 
                bgcolor: '#8b6cbc', 
                '&:hover': { bgcolor: '#7b5cac' },
                px: 3,
                py: 1.2,
                borderRadius: 1.5
              }}
            >
              Add Stage
            </Button>
          </Paper>
        )}
      </Container>

      {/* Stage Dialog */}
      <Dialog 
        open={openStageDialog} 
        onClose={() => setOpenStageDialog(false)} 
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
                {selectedStage ? 'Edit Stage' : 'Add New Stage'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Configure review stage settings and requirements
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
                  label="Stage Name"
                  fullWidth
                  value={stageForm.name}
                  onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                  required
                  placeholder="e.g., Initial Review, Ethics Assessment"
                  helperText="Choose a descriptive name for this review stage"
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
                  value={stageForm.description}
                  onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
                  placeholder="Describe the purpose and requirements of this stage..."
                  helperText="Optional: Provide details about what happens in this stage"
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

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    label="Days to Complete"
                    type="number"
                    value={stageForm.daysToComplete}
                    onChange={(e) => setStageForm({ ...stageForm, daysToComplete: e.target.value })}
                    placeholder="e.g., 7"
                    helperText="Time limit for this stage"
                    sx={{
                      flex: '1 1 calc(50% - 8px)',
                      minWidth: '200px',
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
                    label="Minimum Approvals Required"
                    type="number"
                    value={stageForm.minimumApprovals}
                    onChange={(e) => setStageForm({ ...stageForm, minimumApprovals: parseInt(e.target.value) || 1 })}
                    placeholder="e.g., 2"
                    helperText="Number of approvals needed"
                    inputProps={{ min: 1 }}
                    sx={{
                      flex: '1 1 calc(50% - 8px)',
                      minWidth: '200px',
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
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Stage Behavior Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc', display: 'flex', alignItems: 'center', gap: 1 }}>
                <RuleIcon sx={{ fontSize: 18 }} />
                Stage Behavior
              </Typography>
              <Stack spacing={2}>
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Required Stage
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        This stage must be completed before proceeding
                      </Typography>
                    </Box>
                    <Switch
                      checked={stageForm.isRequired}
                      onChange={(e) => setStageForm({ ...stageForm, isRequired: e.target.checked })}
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
                        Allow Skip
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Reviewers can skip this stage under certain conditions
                      </Typography>
                    </Box>
                    <Switch
                      checked={stageForm.allowSkip}
                      onChange={(e) => setStageForm({ ...stageForm, allowSkip: e.target.checked })}
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
                        Auto-Approve on Pass
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Automatically approve if all validation checks pass
                      </Typography>
                    </Box>
                    <Switch
                      checked={stageForm.autoApproveOnPass}
                      onChange={(e) => setStageForm({ ...stageForm, autoApproveOnPass: e.target.checked })}
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
                        Require All Reviewers
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        All assigned reviewers must approve (overrides minimum approvals)
                      </Typography>
                    </Box>
                    <Switch
                      checked={stageForm.requiresAllReviewers}
                      onChange={(e) => setStageForm({ ...stageForm, requiresAllReviewers: e.target.checked })}
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
            onClick={() => setOpenStageDialog(false)}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveStage} 
            variant="contained" 
            disabled={!stageForm.name}
            startIcon={<AddIcon />}
            sx={{ 
              bgcolor: '#8b6cbc', 
              '&:hover': { bgcolor: '#7b5cac' },
              '&:disabled': { bgcolor: 'rgba(0,0,0,0.12)' },
              px: 3,
              py: 1
            }}
          >
            {selectedStage ? 'Update' : 'Create'} Stage
          </Button>
        </DialogActions>
      </Dialog>

      {/* Parameter Dialog */}
      <Dialog 
        open={openParameterDialog} 
        onClose={() => setOpenParameterDialog(false)} 
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
            <RuleIcon />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Add Validation Parameter
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Configure validation rules and criteria
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3.5}>
            {/* Basic Configuration Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc', display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon sx={{ fontSize: 18 }} />
                Basic Configuration
              </Typography>
              <Stack spacing={2.5}>
                <TextField
                  label="Parameter Name"
                  fullWidth
                  value={parameterForm.name}
                  onChange={(e) => setParameterForm({ ...parameterForm, name: e.target.value })}
                  required
                  placeholder="e.g., Document Completeness Check"
                  helperText="Choose a descriptive name for this validation parameter"
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
                  <InputLabel sx={{ '&.Mui-focused': { color: '#8b6cbc' } }}>Validation Type</InputLabel>
                  <Select
                    value={parameterForm.type}
                    label="Validation Type"
                    onChange={(e) => setParameterForm({ ...parameterForm, type: e.target.value })}
                    sx={{
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#8b6cbc',
                      },
                    }}
                  >
                    {VALIDATION_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Typography variant="body2">{type.label}</Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Weight (1-10)"
                  type="number"
                  fullWidth
                  value={parameterForm.weight}
                  onChange={(e) => setParameterForm({ ...parameterForm, weight: parseInt(e.target.value) || 1 })}
                  inputProps={{ min: 1, max: 10 }}
                  placeholder="5"
                  helperText="Higher weight means more important for overall validation score"
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
              </Stack>
            </Box>

            <Divider />

            {/* Messages Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc', display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon sx={{ fontSize: 18 }} />
                Feedback Messages
              </Typography>
              <Stack spacing={2.5}>
                <TextField
                  label="Error Message"
                  fullWidth
                  multiline
                  rows={2}
                  value={parameterForm.errorMessage}
                  onChange={(e) => setParameterForm({ ...parameterForm, errorMessage: e.target.value })}
                  placeholder="Message to display when validation fails..."
                  helperText="Optional: Custom message shown when this validation fails"
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
                  label="Success Message"
                  fullWidth
                  multiline
                  rows={2}
                  value={parameterForm.successMessage}
                  onChange={(e) => setParameterForm({ ...parameterForm, successMessage: e.target.value })}
                  placeholder="Message to display when validation passes..."
                  helperText="Optional: Custom message shown when this validation succeeds"
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
              </Stack>
            </Box>

            <Divider />

            {/* Behavior Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc', display: 'flex', alignItems: 'center', gap: 1 }}>
                <RuleIcon sx={{ fontSize: 18 }} />
                Validation Behavior
              </Typography>
              <Stack spacing={2}>
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Required Parameter
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        This validation must pass for the stage to proceed
                      </Typography>
                    </Box>
                    <Switch
                      checked={parameterForm.isRequired}
                      onChange={(e) => setParameterForm({ ...parameterForm, isRequired: e.target.checked })}
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
                        Fail Stage on Error
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Automatically fail the entire stage if this validation fails
                      </Typography>
                    </Box>
                    <Switch
                      checked={parameterForm.failOnError}
                      onChange={(e) => setParameterForm({ ...parameterForm, failOnError: e.target.checked })}
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
            onClick={() => setOpenParameterDialog(false)}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddParameter} 
            variant="contained" 
            disabled={!parameterForm.name}
            startIcon={<AddIcon />}
            sx={{ 
              bgcolor: '#8b6cbc', 
              '&:hover': { bgcolor: '#7b5cac' },
              '&:disabled': { bgcolor: 'rgba(0,0,0,0.12)' },
              px: 3,
              py: 1
            }}
          >
            Add Parameter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reviewer Dialog */}
      <Dialog 
        open={openReviewerDialog} 
        onClose={() => setOpenReviewerDialog(false)} 
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
            <PeopleIcon />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Add Reviewer
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Assign a reviewer to this stage
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3.5}>
            {/* Internal User Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc', display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon sx={{ fontSize: 18 }} />
                Internal User
              </Typography>
              <Autocomplete
                options={availableReviewers}
                getOptionLabel={(option) => `${option.givenName} ${option.familyName} (${option.email})`}
                value={availableReviewers.find(u => u.id === reviewerForm.userId) || null}
                onChange={(e, newValue) => setReviewerForm({ ...reviewerForm, userId: newValue?.id || null })}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Select User" 
                    placeholder="Search for a user..."
                    helperText="Select an existing user from your institution"
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
                )}
              />
            </Box>

            <Divider>
              <Chip 
                label="OR" 
                size="small" 
                sx={{ 
                  bgcolor: '#8b6cbc15', 
                  color: '#8b6cbc',
                  fontWeight: 600 
                }} 
              />
            </Divider>

            {/* External Reviewer Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc', display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon sx={{ fontSize: 18 }} />
                External Reviewer
              </Typography>
              <Stack spacing={2.5}>
                <TextField
                  label="External Reviewer Name"
                  fullWidth
                  value={reviewerForm.externalName}
                  onChange={(e) => setReviewerForm({ ...reviewerForm, externalName: e.target.value })}
                  placeholder="e.g., Dr. Jane Smith"
                  helperText="Full name of the external reviewer"
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
                  label="External Reviewer Email"
                  type="email"
                  fullWidth
                  value={reviewerForm.externalEmail}
                  onChange={(e) => setReviewerForm({ ...reviewerForm, externalEmail: e.target.value })}
                  placeholder="e.g., jane.smith@example.com"
                  helperText="Email address for sending review invitations"
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
              </Stack>
            </Box>

            <Divider />

            {/* Role and Settings Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc', display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon sx={{ fontSize: 18 }} />
                Role and Settings
              </Typography>
              <Stack spacing={2.5}>
                <FormControl fullWidth>
                  <InputLabel sx={{ '&.Mui-focused': { color: '#8b6cbc' } }}>Reviewer Role</InputLabel>
                  <Select
                    value={reviewerForm.roleId}
                    label="Reviewer Role"
                    onChange={(e) => setReviewerForm({ ...reviewerForm, roleId: e.target.value })}
                    required
                    sx={{
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#8b6cbc',
                      },
                    }}
                  >
                    {reviewerRoles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        <Typography variant="body2">{role.name}</Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Required Reviewer
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        This reviewer must approve before the stage can proceed
                      </Typography>
                    </Box>
                    <Switch
                      checked={reviewerForm.isRequired}
                      onChange={(e) => setReviewerForm({ ...reviewerForm, isRequired: e.target.checked })}
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
            onClick={() => setOpenReviewerDialog(false)}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddReviewer} 
            variant="contained" 
            disabled={!reviewerForm.roleId || (!reviewerForm.userId && !reviewerForm.externalEmail)}
            startIcon={<AddIcon />}
            sx={{ 
              bgcolor: '#8b6cbc', 
              '&:hover': { bgcolor: '#7b5cac' },
              '&:disabled': { bgcolor: 'rgba(0,0,0,0.12)' },
              px: 3,
              py: 1
            }}
          >
            Add Reviewer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
