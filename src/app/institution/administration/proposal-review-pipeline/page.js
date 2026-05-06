'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
} from '@mui/icons-material';

const STAGE_TYPES = [
  { value: 'ADMINISTRATIVE_REVIEW', label: 'Administrative Pre-Review (Triage)' },
  { value: 'SCIENTIFIC_REVIEW', label: 'Scientific/Departmental Review' },
  { value: 'IRB_ETHICS_REVIEW', label: 'Institutional Review Board (IRB) / Ethics Committee' },
  { value: 'BIOSAFETY_REVIEW', label: 'Institutional Biosafety Committee (IBC)' },
  { value: 'RADIATION_SAFETY_REVIEW', label: 'Radiation Safety Committee (RSC)' },
  { value: 'CONFLICT_OF_INTEREST_REVIEW', label: 'Conflict of Interest (COI) Committee' },
  { value: 'SPONSORED_PROGRAMS_REVIEW', label: 'Office of Sponsored Programs (OSP)' },
  { value: 'CLINICAL_TRIALS_REVIEW', label: 'Clinical Trials Office (CTO) / Pharmacy Review' },
  { value: 'CUSTOM', label: 'Custom Review Stage' },
];

export default function ProposalReviewPipelinePage() {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openStageDialog, setOpenStageDialog] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [pipelineForm, setPipelineForm] = useState({
    name: '',
    description: '',
    isActive: true,
    isDefault: false,
  });

  const [stageForm, setStageForm] = useState({
    name: '',
    description: '',
    stageType: '',
    isRequired: true,
    autoApprove: false,
    daysToComplete: '',
    reviewerRoles: [],
    reviewerEmails: [],
    requiresAllReviewers: false,
    minimumApprovals: 1,
  });

  useEffect(() => {
    fetchPipelines();
  }, []);

  const fetchPipelines = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/institution/proposal-review-pipeline');
      const data = await response.json();
      
      if (data.migrationNeeded) {
        setError('Database migration required. Please run the migration command in your terminal.');
        setPipelines([]);
      } else if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pipelines');
      } else {
        setPipelines(data.pipelines || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePipeline = () => {
    setPipelineForm({
      name: '',
      description: '',
      isActive: true,
      isDefault: false,
    });
    setSelectedPipeline(null);
    setOpenDialog(true);
  };

  const handleEditPipeline = (pipeline) => {
    setPipelineForm({
      name: pipeline.name,
      description: pipeline.description || '',
      isActive: pipeline.isActive,
      isDefault: pipeline.isDefault,
    });
    setSelectedPipeline(pipeline);
    setOpenDialog(true);
  };

  const handleSavePipeline = async () => {
    try {
      const url = selectedPipeline
        ? `/api/institution/proposal-review-pipeline/${selectedPipeline.id}`
        : '/api/institution/proposal-review-pipeline';
      
      const method = selectedPipeline ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pipelineForm),
      });

      if (!response.ok) throw new Error('Failed to save pipeline');
      
      setSuccess(selectedPipeline ? 'Pipeline updated successfully' : 'Pipeline created successfully');
      setOpenDialog(false);
      fetchPipelines();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeletePipeline = async (pipelineId) => {
    if (!confirm('Are you sure you want to delete this pipeline? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/institution/proposal-review-pipeline/${pipelineId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete pipeline');
      
      setSuccess('Pipeline deleted successfully');
      fetchPipelines();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddStage = (pipeline) => {
    setStageForm({
      name: '',
      description: '',
      stageType: '',
      isRequired: true,
      autoApprove: false,
      daysToComplete: '',
      reviewerRoles: [],
      reviewerEmails: [],
      requiresAllReviewers: false,
      minimumApprovals: 1,
    });
    setSelectedPipeline(pipeline);
    setSelectedStage(null);
    setOpenStageDialog(true);
  };

  const handleEditStage = (pipeline, stage) => {
    setStageForm({
      name: stage.name,
      description: stage.description || '',
      stageType: stage.stageType,
      isRequired: stage.isRequired,
      autoApprove: stage.autoApprove,
      daysToComplete: stage.daysToComplete || '',
      reviewerRoles: stage.reviewerRoles || [],
      reviewerEmails: stage.reviewerEmails || [],
      requiresAllReviewers: stage.requiresAllReviewers,
      minimumApprovals: stage.minimumApprovals,
    });
    setSelectedPipeline(pipeline);
    setSelectedStage(stage);
    setOpenStageDialog(true);
  };

  const handleSaveStage = async () => {
    try {
      const url = selectedStage
        ? `/api/institution/proposal-review-pipeline/${selectedPipeline.id}/stages/${selectedStage.id}`
        : `/api/institution/proposal-review-pipeline/${selectedPipeline.id}/stages`;
      
      const method = selectedStage ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stageForm),
      });

      if (!response.ok) throw new Error('Failed to save stage');
      
      setSuccess(selectedStage ? 'Stage updated successfully' : 'Stage added successfully');
      setOpenStageDialog(false);
      fetchPipelines();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteStage = async (pipelineId, stageId) => {
    if (!confirm('Are you sure you want to delete this stage?')) return;
    
    try {
      const response = await fetch(`/api/institution/proposal-review-pipeline/${pipelineId}/stages/${stageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete stage');
      
      setSuccess('Stage deleted successfully');
      fetchPipelines();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMoveStage = async (pipelineId, stageId, direction) => {
    try {
      const response = await fetch(`/api/institution/proposal-review-pipeline/${pipelineId}/stages/${stageId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });

      if (!response.ok) throw new Error('Failed to move stage');
      
      fetchPipelines();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#2D3748', mb: 1 }}>
            Proposal Review Pipeline
          </Typography>
          <Typography variant="body1" sx={{ color: '#666' }}>
            Configure the review stages that proposals go through from submission to approval
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreatePipeline}
          sx={{
            backgroundColor: '#8b6cbc',
            '&:hover': { backgroundColor: '#7a5aa8' },
          }}
        >
          Create Pipeline
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Pipelines List */}
      {pipelines.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <TimelineIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }}/>
          <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
            No Review Pipelines Configured
          </Typography>
          <Typography variant="body2" sx={{ color: '#999', mb: 3 }}>
            Create your first proposal review pipeline to define the stages proposals go through
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreatePipeline}
            sx={{
              backgroundColor: '#8b6cbc',
              '&:hover': { backgroundColor: '#7a5aa8' },
            }}
          >
            Create Pipeline
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {pipelines.map((pipeline) => (
            <Card key={pipeline.id} sx={{ border: pipeline.isDefault ? '2px solid #8b6cbc' : '1px solid #e0e0e0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {pipeline.name}
                      </Typography>
                      {pipeline.isDefault && (
                        <Chip label="Default" size="small" color="primary" />
                      )}
                      {!pipeline.isActive && (
                        <Chip label="Inactive" size="small" color="error" />
                      )}
                    </Box>
                    {pipeline.description && (
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {pipeline.description}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <IconButton onClick={() => handleEditPipeline(pipeline)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeletePipeline(pipeline.id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Stages */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Review Stages ({pipeline.stages?.length || 0})
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddStage(pipeline)}
                      sx={{ color: '#8b6cbc' }}
                    >
                      Add Stage
                    </Button>
                  </Box>

                  {pipeline.stages && pipeline.stages.length > 0 ? (
                    <Stepper orientation="vertical" activeStep={-1}>
                      {pipeline.stages
                        .sort((a, b) => a.order - b.order)
                        .map((stage, index) => (
                          <Step key={stage.id} expanded>
                            <StepLabel
                              icon={
                                <Box
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    backgroundColor: '#8b6cbc',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 600,
                                  }}
                                >
                                  {index + 1}
                                </Box>
                              }
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {stage.name}
                                  </Typography>
                                  {stage.description && (
                                    <Typography variant="caption" sx={{ color: '#666' }}>
                                      {stage.description}
                                    </Typography>
                                  )}
                                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                    {!stage.isRequired && (
                                      <Chip label="Optional" size="small" variant="outlined" />
                                    )}
                                    {stage.autoApprove && (
                                      <Chip label="Auto-approve" size="small" variant="outlined" color="success" />
                                    )}
                                    {stage.daysToComplete && (
                                      <Chip label={`${stage.daysToComplete} days`} size="small" variant="outlined" />
                                    )}
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleMoveStage(pipeline.id, stage.id, 'up')}
                                    disabled={index === 0}
                                  >
                                    <ArrowUpIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleMoveStage(pipeline.id, stage.id, 'down')}
                                    disabled={index === pipeline.stages.length - 1}
                                  >
                                    <ArrowDownIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => handleEditStage(pipeline, stage)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteStage(pipeline.id, stage.id)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            </StepLabel>
                          </Step>
                        ))}
                    </Stepper>
                  ) : (
                    <Alert severity="info">
                      No stages configured. Click "Add Stage" to create the first review stage.
                    </Alert>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Pipeline Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedPipeline ? 'Edit Pipeline' : 'Create New Pipeline'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Pipeline Name"
              value={pipelineForm.name}
              onChange={(e) => setPipelineForm({ ...pipelineForm, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={pipelineForm.description}
              onChange={(e) => setPipelineForm({ ...pipelineForm, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={pipelineForm.isActive}
                  onChange={(e) => setPipelineForm({ ...pipelineForm, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={pipelineForm.isDefault}
                  onChange={(e) => setPipelineForm({ ...pipelineForm, isDefault: e.target.checked })}
                />
              }
              label="Set as Default Pipeline"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePipeline} variant="contained" disabled={!pipelineForm.name}>
            {selectedPipeline ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stage Dialog */}
      <Dialog open={openStageDialog} onClose={() => setOpenStageDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedStage ? 'Edit Review Stage' : 'Add Review Stage'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Stage Type</InputLabel>
              <Select
                value={stageForm.stageType}
                onChange={(e) => {
                  const selectedType = STAGE_TYPES.find(t => t.value === e.target.value);
                  setStageForm({
                    ...stageForm,
                    stageType: e.target.value,
                    name: stageForm.name || selectedType?.label || '',
                  });
                }}
                label="Stage Type"
              >
                {STAGE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Stage Name"
              value={stageForm.name}
              onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
              required
              fullWidth
            />

            <TextField
              label="Description"
              value={stageForm.description}
              onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />

            <TextField
              label="Expected Days to Complete"
              type="number"
              value={stageForm.daysToComplete}
              onChange={(e) => setStageForm({ ...stageForm, daysToComplete: e.target.value })}
              fullWidth
            />

            <TextField
              label="Minimum Approvals Required"
              type="number"
              value={stageForm.minimumApprovals}
              onChange={(e) => setStageForm({ ...stageForm, minimumApprovals: parseInt(e.target.value) || 1 })}
              fullWidth
              inputProps={{ min: 1 }}
            />

            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={stageForm.reviewerEmails}
              onChange={(e, newValue) => setStageForm({ ...stageForm, reviewerEmails: newValue })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Reviewer Emails"
                  placeholder="Enter email addresses"
                  helperText="Type email and press Enter to add"
                />
              )}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={stageForm.isRequired}
                  onChange={(e) => setStageForm({ ...stageForm, isRequired: e.target.checked })}
                />
              }
              label="Required Stage (cannot be skipped)"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={stageForm.requiresAllReviewers}
                  onChange={(e) => setStageForm({ ...stageForm, requiresAllReviewers: e.target.checked })}
                />
              }
              label="Requires All Reviewers to Approve"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={stageForm.autoApprove}
                  onChange={(e) => setStageForm({ ...stageForm, autoApprove: e.target.checked })}
                />
              }
              label="Auto-approve if conditions are met"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStageDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveStage}
            variant="contained"
            disabled={!stageForm.name || !stageForm.stageType}
          >
            {selectedStage ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
