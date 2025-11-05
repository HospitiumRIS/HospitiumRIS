'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Switch,
  RadioGroup,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
  Snackbar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Save as SaveIcon,
  Send as SubmitIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as BudgetIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Science as ScienceIcon,
  BusinessCenter as ManagementIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  ExpandMore as ExpandMoreIcon,
  Group as TeamIcon,
  Timeline as TimelineIcon,
  Shield as EthicsIcon,
  FolderOpen as FilesIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import PageHeader from '../../../../../../components/common/PageHeader';
import { useAuth } from '../../../../../../components/AuthProvider';
import OrcidSearchModal from '../../create/components/OrcidSearchModal';

const RESEARCH_FIELDS = [
  'Cardiology',
  'Neurology', 
  'Oncology',
  'Pediatrics',
  'Immunology',
  'Endocrinology',
  'Genetics',
  'Public Health',
  'Epidemiology',
  'Other'
];

const DEPARTMENTS = [
  'Medicine',
  'Surgery', 
  'Pediatrics',
  'Cardiology',
  'Neurology',
  'Oncology',
  'Psychiatry',
  'Radiology',
  'Pathology',
  'Anesthesiology',
  'Emergency Medicine',
  'Family Medicine',
  'Internal Medicine',
  'Obstetrics and Gynecology',
  'Orthopedics',
  'Ophthalmology',
  'Otolaryngology',
  'Dermatology',
  'Urology',
  'Public Health',
  'Nursing',
  'Pharmacy',
  'Dentistry',
  'Physical Therapy',
  'Occupational Therapy',
  'Medical Technology',
  'Health Administration',
  'Biomedical Engineering',
  'Clinical Research',
  'Health Informatics'
];

const DELIVERABLE_TYPES = [
  'Research Report',
  'Technical Report',
  'Final Report',
  'Interim Report',
  'White Paper',
  'Software/Application',
  'Mobile App',
  'Web Platform',
  'Database',
  'Dataset',
  'Research Data',
  'Survey Data',
  'Experimental Data',
  'Publication',
  'Journal Article',
  'Conference Paper',
  'Book Chapter',
  'Presentation',
  'Workshop',
  'Training Material',
  'Policy Brief',
  'Guidelines',
  'Protocol',
  'Other'
];

const FUNDING_SOURCES = [
  'National Health Institute',
  'National Science Foundation',
  'World Health Organization',
  'Gates Foundation',
  'Wellcome Trust',
  'European Research Council',
  'National Institutes of Health',
  'Department of Health',
  'Medical Research Council',
  'Cancer Research Institute',
  'Heart Foundation',
  'Diabetes Association',
  'Alzheimer\'s Association',
  'Private Foundation',
  'University Grant',
  'Government Grant',
  'Industry Partnership',
  'International Organization',
  'Non-Profit Organization',
  'Other'
];

const steps = [
  'Core Information',
  'Research Details', 
  'Project Management',
  'Funds and Grants',
  'Ethical Considerations & Data Management',
  'Related Publications & Files',
  'Proposal Summary'
];

const EditProposalPage = () => {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const proposalId = params.id;
  
  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // ORCID search modals
  const [piSearchModalOpen, setPiSearchModalOpen] = useState(false);
  const [coInvSearchModalOpen, setCoInvSearchModalOpen] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [formData, setFormData] = useState({
    // Step 1: Core Information
    title: '',
    piOption: 'useProfile',
    principalInvestigatorName: '',
    principalInvestigatorOrcid: '',
    coInvestigators: [],
    departments: [],
    startDate: '',
    endDate: '',

    // Step 2: Research Details
    fields: [],
    researchObjectives: '',
    methodology: '',
    abstract: '',

    // Step 3: Project Management
    milestones: [],
    deliverables: [],

    // Step 4: Funding and Grants
    fundingSource: '',
    grantNumber: '',
    fundingInstitution: '',
    grantStartDate: '',
    grantEndDate: '',
    totalBudgetAmount: '',

    // Step 5: Ethical Considerations & Data Management
    ethicalConsiderationsOverview: '',
    consentProcedures: '',
    dataSecurityMeasures: '',
    ethicsApprovalStatus: 'Not Required',
    ethicsApprovalReference: '',
    ethicsCommittee: '',
    approvalDate: '',
    ethicsDocuments: [],
    dataManagementPlan: [],

    // Step 6: Related Publications & Files
    selectedPublications: [],
    publicationRelevance: '',
    otherRelatedFiles: [],

    // Step 7: Proposal Summary
    linkedCollaborativeProposals: [],
    impactStatement: '',
    disseminationPlan: ''
  });

  // Load proposal data
  useEffect(() => {
    const loadProposal = async () => {
      if (!proposalId) return;
      
      try {
        setInitialLoading(true);
        const response = await fetch(`/api/proposals/${proposalId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load proposal');
        }
        
        const data = await response.json();
        
        if (data.success) {
          const proposal = data.proposal;
          
          // Map proposal data to form data
          setFormData({
            title: proposal.title || '',
            piOption: 'useProfile', // Default to use profile
            principalInvestigatorName: proposal.principalInvestigator || '',
            principalInvestigatorOrcid: proposal.principalInvestigatorOrcid || '',
            coInvestigators: proposal.coInvestigators || [],
            departments: proposal.departments || [],
            startDate: proposal.startDate ? proposal.startDate.split('T')[0] : '',
            endDate: proposal.endDate ? proposal.endDate.split('T')[0] : '',
            
            fields: proposal.researchAreas || [],
            researchObjectives: proposal.researchObjectives || '',
            methodology: proposal.methodology || '',
            abstract: proposal.abstract || '',
            
            milestones: proposal.milestones || [],
            deliverables: proposal.deliverables || [],
            
            fundingSource: proposal.fundingSource || '',
            grantNumber: proposal.grantNumber || '',
            fundingInstitution: proposal.fundingInstitution || '',
            grantStartDate: proposal.grantStartDate ? proposal.grantStartDate.split('T')[0] : '',
            grantEndDate: proposal.grantEndDate ? proposal.grantEndDate.split('T')[0] : '',
            totalBudgetAmount: proposal.totalBudgetAmount || '',
            
            ethicalConsiderationsOverview: proposal.ethicalConsiderationsOverview || '',
            consentProcedures: proposal.consentProcedures || '',
            dataSecurityMeasures: proposal.dataSecurityMeasures || '',
            ethicsApprovalStatus: proposal.ethicsApprovalStatus || 'Not Required',
            ethicsApprovalReference: proposal.ethicsApprovalReference || '',
            ethicsCommittee: proposal.ethicsCommittee || '',
            approvalDate: proposal.approvalDate ? proposal.approvalDate.split('T')[0] : '',
            ethicsDocuments: proposal.ethicsDocuments || [],
            dataManagementPlan: proposal.dataManagementPlan || [],
            
            selectedPublications: [], // Will be loaded separately if needed
            publicationRelevance: proposal.publicationRelevance || '',
            otherRelatedFiles: proposal.otherRelatedFiles || [],
            
            linkedCollaborativeProposals: [], // Will be loaded separately if needed
            impactStatement: proposal.impactStatement || '',
            disseminationPlan: proposal.disseminationPlan || ''
          });
        } else {
          throw new Error(data.error || 'Failed to load proposal');
        }
      } catch (error) {
        console.error('Error loading proposal:', error);
        setError('Failed to load proposal. Please try again.');
      } finally {
        setInitialLoading(false);
      }
    };

    loadProposal();
  }, [proposalId]);

  // Navigation handlers
  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleStepClick = (stepIndex) => {
    setActiveStep(stepIndex);
  };

  // Update proposal handler
  const handleUpdateProposal = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create FormData for file uploads
      const submitData = new FormData();

      // Add all form fields as JSON
      const proposalData = {
        // Core Information
        title: formData.title,
        principalInvestigator: formData.piOption === 'useProfile' ? 
          `${user?.givenName || ''} ${user?.familyName || ''}`.trim() || 'Current User' : 
          formData.principalInvestigatorName,
        principalInvestigatorOrcid: formData.piOption === 'useProfile' ? 
          user?.orcidId || null : 
          formData.principalInvestigatorOrcid,
        coInvestigators: formData.coInvestigators,
        departments: formData.departments,
        startDate: formData.startDate,
        endDate: formData.endDate,

        // Research Details
        researchAreas: formData.fields,
        researchObjectives: formData.researchObjectives,
        methodology: formData.methodology,
        abstract: formData.abstract,

        // Project Management
        milestones: formData.milestones,
        deliverables: formData.deliverables,

        // Funding and Grants
        fundingSource: formData.fundingSource,
        grantNumber: formData.grantNumber,
        fundingInstitution: formData.fundingInstitution,
        grantStartDate: formData.grantStartDate,
        grantEndDate: formData.grantEndDate,
        totalBudgetAmount: formData.totalBudgetAmount,

        // Ethical Considerations
        ethicalConsiderationsOverview: formData.ethicalConsiderationsOverview,
        consentProcedures: formData.consentProcedures,
        dataSecurityMeasures: formData.dataSecurityMeasures,
        ethicsApprovalStatus: formData.ethicsApprovalStatus,
        ethicsApprovalReference: formData.ethicsApprovalReference,
        ethicsCommittee: formData.ethicsCommittee,
        approvalDate: formData.approvalDate,

        // Related Publications & Files
        selectedPublications: formData.selectedPublications.map(pub => pub.id),
        publicationRelevance: formData.publicationRelevance,
        linkedCollaborativeProposals: formData.linkedCollaborativeProposals.map(prop => prop.id),

        // Proposal Summary
        impactStatement: formData.impactStatement,
        disseminationPlan: formData.disseminationPlan,

        // Status
        status: 'DRAFT'
      };

      submitData.append('proposalData', JSON.stringify(proposalData));

      // Add file uploads
      formData.ethicsDocuments.forEach((file) => {
        if (file instanceof File) {
          submitData.append(`ethicsDocuments`, file);
        }
      });
      formData.dataManagementPlan.forEach((file) => {
        if (file instanceof File) {
          submitData.append(`dataManagementPlan`, file);
        }
      });
      formData.otherRelatedFiles.forEach((file) => {
        if (file instanceof File) {
          submitData.append(`otherRelatedFiles`, file);
        }
      });

      // Submit to API
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        body: submitData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update proposal');
      }

      const result = await response.json();
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Proposal updated successfully!',
        severity: 'success'
      });
      
      // Redirect after a short delay to show the snackbar
      setTimeout(() => {
        router.push('/researcher/projects/proposals/list');
      }, 2000);

    } catch (error) {
      console.error('Error updating proposal:', error);
      setError(error.message || 'Failed to update proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    handleUpdateProposal();
  };

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Core Information
        return (
          <Box>
            {/* Step Header */}
            <Box sx={{ 
              backgroundColor: '#f8f9fc', 
              p: 3, 
              borderRadius: 2, 
              mb: 3,
              border: '1px solid rgba(139, 108, 188, 0.12)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#8b6cbc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600
                }}>
                  1
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.5 }}>
                    Core Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Basic details about your research proposal
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {/* Basic Project Information */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#2D3748' }}>
                Basic Project Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter the fundamental details about your research project.
              </Typography>
              
              <TextField
                fullWidth
                label="Project Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter your project title"
                required
                InputProps={{
                  endAdornment: <Typography component="span" sx={{ color: '#f44336', ml: 0.5 }}>*</Typography>
                }}
              />
            </Paper>

            {/* Principal Investigator */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#2D3748' }}>
                Principal Investigator
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Who will be the principal investigator for this proposal?
              </Typography>
              
              <RadioGroup
                value={formData.piOption}
                onChange={(e) => setFormData(prev => ({ ...prev, piOption: e.target.value }))}
                sx={{ mb: 2 }}
              >
                <FormControlLabel
                  value="useProfile"
                  control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />}
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Use my profile as Principal Investigator
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user?.givenName} {user?.familyName} ({user?.orcidId || 'No ORCID ID'})
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="searchOther"
                  control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />}
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Search for a different Principal Investigator
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Find and select another researcher using ORCID search
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>

              {formData.piOption === 'searchOther' && (
                <Button
                  variant="outlined"
                  startIcon={<SearchIcon />}
                  onClick={() => setPiSearchModalOpen(true)}
                  sx={{ mt: 1, borderColor: '#8b6cbc', color: '#8b6cbc' }}
                >
                  Search Principal Investigator
                </Button>
              )}

              {formData.piOption === 'searchOther' && formData.principalInvestigatorName && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: 1,
                  border: '1px solid #e2e8f0'
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Selected Principal Investigator:
                  </Typography>
                  <Typography variant="body2">
                    {formData.principalInvestigatorName}
                  </Typography>
                  {formData.principalInvestigatorOrcid && (
                    <Chip
                      label={`ORCID: ${formData.principalInvestigatorOrcid}`}
                      size="small"
                      sx={{ mt: 1, backgroundColor: '#8b6cbc', color: 'white' }}
                    />
                  )}
                </Box>
              )}

              {formData.piOption === 'useProfile' && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: 1,
                  border: '1px solid #e2e8f0'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ color: '#8b6cbc' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {user?.givenName} {user?.familyName}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Name from your ORCID profile
                  </Typography>
                  {user?.orcidId && (
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={user.orcidId}
                        size="small"
                        sx={{ backgroundColor: '#8b6cbc', color: 'white' }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        ORCID ID from your profile
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>

            {/* Co-Investigators */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <GroupIcon sx={{ color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748' }}>
                  Co-Investigators
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add team members and collaborators for this research proposal
              </Typography>

              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={() => setCoInvSearchModalOpen(true)}
                sx={{ mb: 2, borderColor: '#8b6cbc', color: '#8b6cbc' }}
              >
                Search & Add Co-Investigator
              </Button>

              {formData.coInvestigators.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {formData.coInvestigators.map((coInv, index) => (
                    <Box key={index} sx={{ 
                      p: 2, 
                      mb: 1, 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: 1,
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {coInv.name}
                        </Typography>
                        {coInv.orcidId && (
                          <Chip
                            label={`ORCID: ${coInv.orcidId}`}
                            size="small"
                            sx={{ mt: 0.5, backgroundColor: '#8b6cbc', color: 'white' }}
                          />
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            coInvestigators: prev.coInvestigators.filter((_, i) => i !== index)
                          }));
                        }}
                        sx={{ color: '#f44336' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>

            {/* Departments */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BusinessIcon sx={{ color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748' }}>
                  Departments
                </Typography>
                <Typography component="span" sx={{ color: '#f44336', ml: 0.5 }}>*</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select one or more departments. You can also add new departments not in the list.
              </Typography>

              <Autocomplete
                multiple
                freeSolo
                options={DEPARTMENTS}
                value={formData.departments}
                onChange={(event, newValue) => {
                  setFormData(prev => ({ ...prev, departments: newValue }));
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        variant="outlined"
                        label={option}
                        {...tagProps}
                        sx={{ 
                          borderColor: '#8b6cbc', 
                          color: '#8b6cbc',
                          '& .MuiChip-deleteIcon': { color: '#8b6cbc' }
                        }}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select or add departments"
                    error={formData.departments.length === 0}
                    helperText={formData.departments.length === 0 ? "At least one department is required" : ""}
                  />
                )}
              />
            </Paper>

            {/* Project Timeline */}
            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ScheduleIcon sx={{ color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748' }}>
                  Project Timeline
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Specify the expected start and end dates for your project (optional).
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    helperText="Optional - When do you plan to start?"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    helperText="Optional - Expected completion date"
                    error={formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );

      case 1: // Research Details
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#2D3748' }}>
              Research Details
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(139, 108, 188, 0.12)' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc' }}>
                Research Areas *
              </Typography>
              
              <Autocomplete
                multiple
                freeSolo
                options={RESEARCH_FIELDS}
                value={formData.fields}
                onChange={(event, newValue) => {
                  setFormData(prev => ({ ...prev, fields: newValue }));
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const isCustom = !RESEARCH_FIELDS.includes(option);
                    return (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={index}
                        sx={{
                          backgroundColor: isCustom ? 'rgba(255, 152, 0, 0.1)' : 'rgba(139, 108, 188, 0.1)',
                          borderColor: isCustom ? '#ff9800' : '#8b6cbc',
                          color: isCustom ? '#ff9800' : '#8b6cbc',
                          fontWeight: 500
                        }}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select or add research areas"
                    placeholder="Type to add custom research area"
                  />
                )}
              />
            </Paper>

            <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(139, 108, 188, 0.12)' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc' }}>
                Research Objectives *
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Research Objectives"
                value={formData.researchObjectives}
                onChange={(e) => setFormData(prev => ({ ...prev, researchObjectives: e.target.value }))}
                placeholder="Describe the main objectives of your research"
              />
            </Paper>

            <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(139, 108, 188, 0.12)' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc' }}>
                Research Methods *
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Research Methods"
                value={formData.methodology}
                onChange={(e) => setFormData(prev => ({ ...prev, methodology: e.target.value }))}
                placeholder="Describe your research methodology and approach"
              />
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(139, 108, 188, 0.12)' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc' }}>
                Abstract *
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Abstract"
                value={formData.abstract}
                onChange={(e) => setFormData(prev => ({ ...prev, abstract: e.target.value }))}
                placeholder="Provide a comprehensive abstract of your research proposal"
                helperText={`${formData.abstract.length}/2000 characters`}
                inputProps={{ maxLength: 2000 }}
              />
            </Paper>
          </Box>
        );

      case 2: // Project Management
        return (
          <Box>
            {/* Step Header */}
            <Box sx={{ 
              backgroundColor: '#f8f9fc', 
              p: 3, 
              borderRadius: 2, 
              mb: 3,
              border: '1px solid rgba(139, 108, 188, 0.12)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#8b6cbc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600
                }}>
                  3
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.5 }}>
                    Project Management & Timeline
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Define project milestones, deliverables, and potential risks.
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {/* Project Milestones */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimelineIcon sx={{ color: '#8b6cbc' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748' }}>
                    Project Milestones
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      milestones: [...prev.milestones, { title: '', targetDate: '', description: '' }]
                    }));
                  }}
                  sx={{ borderColor: '#8b6cbc', color: '#8b6cbc' }}
                >
                  Add Milestone
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add key milestones and target dates for your project (optional).
              </Typography>
              
              {formData.milestones.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 6,
                  backgroundColor: '#fafbfc',
                  borderRadius: 2,
                  border: '1px dashed #e2e8f0'
                }}>
                  <TimelineIcon sx={{ fontSize: 48, color: '#cbd5e0', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    No milestones added yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click "Add Milestone" to get started, or leave blank to populate later
                  </Typography>
                </Box>
              ) : (
                formData.milestones.map((milestone, index) => (
                  <Box key={index} sx={{ 
                    p: 0, 
                    mb: 3, 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 2,
                    backgroundColor: 'white'
                  }}>
                    {/* Milestone Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      p: 2,
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: '#f8f9fa'
                    }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                        Milestone {index + 1}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            milestones: prev.milestones.filter((_, i) => i !== index)
                          }));
                        }}
                        sx={{ color: '#f44336' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    {/* Milestone Fields */}
                    <Box sx={{ p: 3 }}>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Milestone Title
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="Enter milestone title"
                          value={milestone.title}
                          onChange={(e) => {
                            const newMilestones = [...formData.milestones];
                            newMilestones[index].title = e.target.value;
                            setFormData(prev => ({ ...prev, milestones: newMilestones }));
                          }}
                          variant="outlined"
                        />
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Target Date
                        </Typography>
                        <TextField
                          fullWidth
                          type="date"
                          value={milestone.targetDate}
                          onChange={(e) => {
                            const newMilestones = [...formData.milestones];
                            newMilestones[index].targetDate = e.target.value;
                            setFormData(prev => ({ ...prev, milestones: newMilestones }));
                          }}
                          InputLabelProps={{ shrink: true }}
                          variant="outlined"
                        />
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Description
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          placeholder="Describe the milestone details and requirements"
                          value={milestone.description}
                          onChange={(e) => {
                            const newMilestones = [...formData.milestones];
                            newMilestones[index].description = e.target.value;
                            setFormData(prev => ({ ...prev, milestones: newMilestones }));
                          }}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Box>
                ))
              )}
            </Paper>

            {/* Project Deliverables */}
            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon sx={{ color: '#8b6cbc' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748' }}>
                    Project Deliverables
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      deliverables: [...prev.deliverables, { title: '', type: '', dueDate: '', description: '' }]
                    }));
                  }}
                  sx={{ borderColor: '#8b6cbc', color: '#8b6cbc' }}
                >
                  Add Deliverable
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Define specific deliverables and their due dates (optional).
              </Typography>
              
              {formData.deliverables.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 6,
                  backgroundColor: '#fafbfc',
                  borderRadius: 2,
                  border: '1px dashed #e2e8f0'
                }}>
                  <AssignmentIcon sx={{ fontSize: 48, color: '#cbd5e0', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    No deliverables added yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click "Add Deliverable" to get started, or leave blank to populate later
                  </Typography>
                </Box>
              ) : (
                formData.deliverables.map((deliverable, index) => (
                  <Box key={index} sx={{ 
                    p: 0, 
                    mb: 3, 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 2,
                    backgroundColor: 'white'
                  }}>
                    {/* Deliverable Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      p: 2,
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: '#f8f9fa'
                    }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                        Deliverable {index + 1}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            deliverables: prev.deliverables.filter((_, i) => i !== index)
                          }));
                        }}
                        sx={{ color: '#f44336' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    {/* Deliverable Fields */}
                    <Box sx={{ p: 3 }}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Deliverable Title
                          </Typography>
                          <TextField
                            fullWidth
                            placeholder="Enter deliverable title"
                            value={deliverable.title}
                            onChange={(e) => {
                              const newDeliverables = [...formData.deliverables];
                              newDeliverables[index].title = e.target.value;
                              setFormData(prev => ({ ...prev, deliverables: newDeliverables }));
                            }}
                            variant="outlined"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Type
                          </Typography>
                          <FormControl fullWidth variant="outlined">
                            <Select
                              value={deliverable.type}
                              onChange={(e) => {
                                const newDeliverables = [...formData.deliverables];
                                newDeliverables[index].type = e.target.value;
                                setFormData(prev => ({ ...prev, deliverables: newDeliverables }));
                              }}
                              displayEmpty
                            >
                              <MenuItem value="">
                                <em>Select deliverable type</em>
                              </MenuItem>
                              {DELIVERABLE_TYPES.map((type) => (
                                <MenuItem key={type} value={type}>
                                  {type}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Due Date
                          </Typography>
                          <TextField
                            fullWidth
                            type="date"
                            value={deliverable.dueDate}
                            onChange={(e) => {
                              const newDeliverables = [...formData.deliverables];
                              newDeliverables[index].dueDate = e.target.value;
                              setFormData(prev => ({ ...prev, deliverables: newDeliverables }));
                            }}
                            InputLabelProps={{ shrink: true }}
                            variant="outlined"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Description
                          </Typography>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Describe the deliverable requirements"
                            value={deliverable.description}
                            onChange={(e) => {
                              const newDeliverables = [...formData.deliverables];
                              newDeliverables[index].description = e.target.value;
                              setFormData(prev => ({ ...prev, deliverables: newDeliverables }));
                            }}
                            variant="outlined"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                ))
              )}
            </Paper>
          </Box>
        );

      case 3: // Funds and Grants
        return (
          <Box>
            {/* Step Header */}
            <Box sx={{ 
              backgroundColor: '#f8f9fc', 
              p: 3, 
              borderRadius: 2, 
              mb: 3,
              border: '1px solid rgba(139, 108, 188, 0.12)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#8b6cbc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600
                }}>
                  $
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.5 }}>
                    Funding & Budget
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Specify the funding source, grant details, and budget breakdown.
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {/* Funding Source */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#2D3748' }}>
                Funding Source
              </Typography>
              
              <Autocomplete
                freeSolo
                options={FUNDING_SOURCES}
                value={formData.fundingSource}
                onChange={(event, newValue) => {
                  setFormData(prev => ({ ...prev, fundingSource: newValue || '' }));
                }}
                onInputChange={(event, newInputValue) => {
                  setFormData(prev => ({ ...prev, fundingSource: newInputValue }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Funding Source *"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white'
                      }
                    }}
                  />
                )}
              />
            </Box>

            {/* Grant Details */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#2D3748' }}>
                Grant Details
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Grant Number"
                    value={formData.grantNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, grantNumber: e.target.value }))}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Funding Institution"
                    value={formData.fundingInstitution}
                    onChange={(e) => setFormData(prev => ({ ...prev, fundingInstitution: e.target.value }))}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Grant Start Date *
                    </Typography>
                    <TextField
                      fullWidth
                      type="date"
                      placeholder="mm/dd/yyyy"
                      value={formData.grantStartDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, grantStartDate: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white'
                        }
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Grant End Date *
                    </Typography>
                    <TextField
                      fullWidth
                      type="date"
                      placeholder="mm/dd/yyyy"
                      value={formData.grantEndDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, grantEndDate: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white'
                        }
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Budget Information */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <BudgetIcon sx={{ color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748' }}>
                  Budget Information
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Specify the total budget amount for this research proposal
              </Typography>
              
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Total Budget Amount *
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  placeholder="$ Enter the total budget amount for the entire research project"
                  value={formData.totalBudgetAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalBudgetAmount: e.target.value }))}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white'
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>
        );

      case 4: // Ethical Considerations & Data Management
        return (
          <Box>
            {/* Step Header */}
            <Box sx={{ 
              backgroundColor: '#f8f9fc', 
              p: 3, 
              borderRadius: 2, 
              mb: 3,
              border: '1px solid rgba(139, 108, 188, 0.12)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#8b6cbc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600
                }}>
                  <EthicsIcon />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.5 }}>
                    Ethical Considerations
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Detail any ethical considerations, consent procedures, and data security measures.
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {/* Text Area Fields */}
            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Ethical Considerations Overview"
                value={formData.ethicalConsiderationsOverview}
                onChange={(e) => setFormData(prev => ({ ...prev, ethicalConsiderationsOverview: e.target.value }))}
                variant="outlined"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white'
                  }
                }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Consent Procedures"
                value={formData.consentProcedures}
                onChange={(e) => setFormData(prev => ({ ...prev, consentProcedures: e.target.value }))}
                variant="outlined"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white'
                  }
                }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Data Security and Privacy Measures"
                value={formData.dataSecurityMeasures}
                onChange={(e) => setFormData(prev => ({ ...prev, dataSecurityMeasures: e.target.value }))}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white'
                  }
                }}
              />
            </Box>

            {/* Ethics Approval Information */}
            <Paper sx={{ 
              p: 4, 
              mb: 4, 
              borderRadius: 3, 
              border: '1px solid #e2e8f0',
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#f0f9ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <VerifiedIcon sx={{ color: '#0ea5e9', fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Ethics Approval Information
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                      Ethics Approval Status
                    </Typography>
                    <FormControl fullWidth variant="outlined">
                      <Select
                        value={formData.ethicsApprovalStatus}
                        onChange={(e) => setFormData(prev => ({ ...prev, ethicsApprovalStatus: e.target.value }))}
                        displayEmpty
                        sx={{
                          backgroundColor: '#f9fafb',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#d1d5db'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#8b6cbc'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#8b6cbc'
                          }
                        }}
                      >
                        <MenuItem value="">
                          <em>Select approval status</em>
                        </MenuItem>
                        <MenuItem value="Not Required">Not Required</MenuItem>
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Approved">Approved</MenuItem>
                        <MenuItem value="Conditional Approval">Conditional Approval</MenuItem>
                        <MenuItem value="Rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                      Ethics Committee/IRB
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="Name of ethics committee or IRB"
                      value={formData.ethicsCommittee}
                      onChange={(e) => setFormData(prev => ({ ...prev, ethicsCommittee: e.target.value }))}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f9fafb',
                          '& fieldset': {
                            borderColor: '#d1d5db'
                          },
                          '&:hover fieldset': {
                            borderColor: '#8b6cbc'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#8b6cbc'
                          }
                        }
                      }}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                      Ethics Approval Reference Number
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="Reference number or identifier"
                      value={formData.ethicsApprovalReference}
                      onChange={(e) => setFormData(prev => ({ ...prev, ethicsApprovalReference: e.target.value }))}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f9fafb',
                          '& fieldset': {
                            borderColor: '#d1d5db'
                          },
                          '&:hover fieldset': {
                            borderColor: '#8b6cbc'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#8b6cbc'
                          }
                        }
                      }}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                      Approval Date
                    </Typography>
                    <TextField
                      fullWidth
                      type="date"
                      value={formData.approvalDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, approvalDate: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f9fafb',
                          '& fieldset': {
                            borderColor: '#d1d5db'
                          },
                          '&:hover fieldset': {
                            borderColor: '#8b6cbc'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#8b6cbc'
                          }
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ 
                      mt: 0.5, 
                      display: 'block', 
                      color: '#6b7280',
                      fontStyle: 'italic'
                    }}>
                      Date of ethics approval (if obtained)
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* File Upload Sections */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ 
                p: 3, 
                border: '2px dashed #e2e8f0', 
                borderRadius: 2, 
                textAlign: 'center',
                backgroundColor: '#fafbfc',
                mb: 3
              }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#2D3748' }}>
                  Ethics Documentation
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Upload supporting documents such as ethics approval letters, consent forms, participant information sheets, or protocols.
                </Typography>
                
                <input
                  type="file"
                  id="ethics-documents-upload"
                  multiple
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setFormData(prev => ({
                      ...prev,
                      ethicsDocuments: [...prev.ethicsDocuments, ...files]
                    }));
                  }}
                />
                
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => document.getElementById('ethics-documents-upload').click()}
                  sx={{ 
                    backgroundColor: '#8b6cbc', 
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#7a5aa8'
                    }
                  }}
                >
                  Upload Ethics Documents
                </Button>
                
                {formData.ethicsDocuments.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                      Uploaded Files ({formData.ethicsDocuments.length})
                    </Typography>
                    {formData.ethicsDocuments.map((file, index) => (
                      <Box key={index} sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        p: 2,
                        mb: 1,
                        backgroundColor: 'white',
                        borderRadius: 1,
                        border: '1px solid #e2e8f0'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FilesIcon sx={{ color: '#8b6cbc' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {file.originalName || file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({Math.round((file.size || 0) / 1024)} KB)
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              ethicsDocuments: prev.ethicsDocuments.filter((_, i) => i !== index)
                            }));
                          }}
                          sx={{ color: '#f44336' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              <Box sx={{ 
                p: 3, 
                border: '2px dashed #e2e8f0', 
                borderRadius: 2, 
                textAlign: 'center',
                backgroundColor: '#fafbfc'
              }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#2D3748' }}>
                  Data Management Plan
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Upload your Data Management Plan (DMP) document outlining how research data will be collected, stored, managed, and shared throughout the project lifecycle.
                </Typography>
                
                <input
                  type="file"
                  id="dmp-upload"
                  multiple
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setFormData(prev => ({
                      ...prev,
                      dataManagementPlan: [...prev.dataManagementPlan, ...files]
                    }));
                  }}
                />
                
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => document.getElementById('dmp-upload').click()}
                  sx={{ 
                    backgroundColor: '#22c55e', 
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#16a34a'
                    }
                  }}
                >
                  Upload Data Management Plan
                </Button>
                
                {formData.dataManagementPlan.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                      Uploaded Files ({formData.dataManagementPlan.length})
                    </Typography>
                    {formData.dataManagementPlan.map((file, index) => (
                      <Box key={index} sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        p: 2,
                        mb: 1,
                        backgroundColor: 'white',
                        borderRadius: 1,
                        border: '1px solid #e2e8f0'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FilesIcon sx={{ color: '#22c55e' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {file.originalName || file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({Math.round((file.size || 0) / 1024)} KB)
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              dataManagementPlan: prev.dataManagementPlan.filter((_, i) => i !== index)
                            }));
                          }}
                          sx={{ color: '#f44336' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        );

      case 5: // Related Publications & Files
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#2D3748' }}>
              Related Publications & Files
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(139, 108, 188, 0.12)' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc' }}>
                Related Publications
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Search and select publications from your database that are related to this proposal.
              </Typography>
              
              {/* Publications would be loaded from database - placeholder for now */}
              <TextField
                fullWidth
                label="Search Publications"
                placeholder="Search for related publications..."
                sx={{ mb: 2 }}
              />
              
              {formData.selectedPublications.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Selected Publications:
                  </Typography>
                  {formData.selectedPublications.map((pub, index) => (
                    <Box key={index} sx={{ 
                      p: 2, 
                      mb: 1, 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Typography variant="body2">
                        {pub.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            selectedPublications: prev.selectedPublications.filter((_, i) => i !== index)
                          }));
                        }}
                        sx={{ color: '#f44336' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>

            <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(139, 108, 188, 0.12)' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc' }}>
                Publication Relevance
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="How are these publications relevant to your proposal?"
                value={formData.publicationRelevance}
                onChange={(e) => setFormData(prev => ({ ...prev, publicationRelevance: e.target.value }))}
                placeholder="Explain the relevance of the selected publications to your research proposal"
              />
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(139, 108, 188, 0.12)' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc' }}>
                Other Related Files
              </Typography>
              
              <input
                type="file"
                id="other-files-upload"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  setFormData(prev => ({
                    ...prev,
                    otherRelatedFiles: [...prev.otherRelatedFiles, ...files]
                  }));
                }}
              />
              
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => document.getElementById('other-files-upload').click()}
                sx={{ mb: 2, borderColor: '#8b6cbc', color: '#8b6cbc' }}
              >
                Upload Other Related Files
              </Button>
              
              {formData.otherRelatedFiles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {formData.otherRelatedFiles.map((file, index) => (
                    <Box key={index} sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 1,
                      mb: 1,
                      backgroundColor: '#f8f9fa',
                      borderRadius: 1
                    }}>
                      <Typography variant="body2">
                        {file.originalName || file.name} ({Math.round((file.size || 0) / 1024)} KB)
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            otherRelatedFiles: prev.otherRelatedFiles.filter((_, i) => i !== index)
                          }));
                        }}
                        sx={{ color: '#f44336' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        );

      case 6: // Proposal Summary
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#2D3748' }}>
              Proposal Summary
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(139, 108, 188, 0.12)' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc' }}>
                Link with Collaborative Proposals
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Search and link this proposal with existing collaborative manuscripts.
              </Typography>
              
              <TextField
                fullWidth
                label="Search Collaborative Proposals"
                placeholder="Search for collaborative proposals..."
                sx={{ mb: 2 }}
              />
              
              {formData.linkedCollaborativeProposals.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Linked Collaborative Proposals:
                  </Typography>
                  {formData.linkedCollaborativeProposals.map((prop, index) => (
                    <Box key={index} sx={{ 
                      p: 2, 
                      mb: 1, 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Typography variant="body2">
                        {prop.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            linkedCollaborativeProposals: prev.linkedCollaborativeProposals.filter((_, i) => i !== index)
                          }));
                        }}
                        sx={{ color: '#f44336' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>

            <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(139, 108, 188, 0.12)' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc' }}>
                Impact Statement
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Expected Impact and Outcomes"
                value={formData.impactStatement}
                onChange={(e) => setFormData(prev => ({ ...prev, impactStatement: e.target.value }))}
                placeholder="Describe the expected impact and outcomes of your research"
              />
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(139, 108, 188, 0.12)' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#8b6cbc' }}>
                Dissemination Plan
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="How will you disseminate the research findings?"
                value={formData.disseminationPlan}
                onChange={(e) => setFormData(prev => ({ ...prev, disseminationPlan: e.target.value }))}
                placeholder="Describe your plan for sharing and disseminating research findings"
              />
            </Paper>
          </Box>
        );

      default:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Step {activeStep + 1} content
            </Typography>
          </Box>
        );
    }
  };

  // ORCID search handlers
  const handlePrincipalInvestigatorSelect = (researcher) => {
    setFormData(prev => ({
      ...prev,
      principalInvestigatorName: researcher.creditName,
      principalInvestigatorOrcid: researcher.orcidId
    }));
    setPiSearchModalOpen(false);
  };

  const handleCoInvestigatorSelect = (researcher) => {
    const newCoInvestigator = {
      name: researcher.creditName,
      email: researcher.email || '',
      role: 'Co-Investigator',
      institution: researcher.employmentSummary || '',
      orcidId: researcher.orcidId,
      affiliations: researcher.affiliations || []
    };

    setFormData(prev => ({
      ...prev,
      coInvestigators: [...prev.coInvestigators, newCoInvestigator]
    }));
    setCoInvSearchModalOpen(false);
  };

  // Show loading screen while fetching proposal data
  if (initialLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} sx={{ color: '#8b6cbc', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Loading proposal...
        </Typography>
      </Container>
    );
  }

  // Show error if proposal couldn't be loaded
  if (error && !formData.title) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/researcher/projects/proposals/list')}
        >
          Back to Proposals List
        </Button>
      </Container>
    );
  }

  return (
    <>
      {/* Page Header */}
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Edit Project Proposal"
          description="Update your research proposal details"
          icon={<AssignmentIcon />}
          breadcrumbs={[
            { label: 'Dashboard', href: '/researcher' },
            { label: 'Projects', href: '/researcher/projects' },
            { label: 'Proposals', href: '/researcher/projects/proposals/list' },
            { label: 'Edit Proposal' }
          ]}
          actionButton={
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/researcher/projects/proposals/list')}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)'
                },
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 500,
                backdropFilter: 'blur(10px)'
              }}
            >
              Back to List
            </Button>
          }
        />
      </Box>

      <Container maxWidth={false} sx={{ py: 4, width: '80%', mx: 'auto' }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 4, 
              borderRadius: 3,
              border: '1px solid rgba(244, 67, 54, 0.2)',
              background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.05) 0%, rgba(244, 67, 54, 0.02) 100%)'
            }}
          >
            {error}
          </Alert>
        )}

        {/* Custom Stepper */}
        <Paper sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 4,
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfd 100%)',
          boxShadow: '0 8px 32px rgba(139, 108, 188, 0.08)',
          border: '1px solid rgba(139, 108, 188, 0.12)'
        }}>
          {/* Progress Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: '#2D3748', 
              mb: 1,
              background: 'linear-gradient(135deg, #8b6cbc 0%, #9575d1 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Edit Proposal: {formData.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
            </Typography>
          </Box>

          {/* Custom Horizontal Stepper */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              position: 'relative',
              mb: 2
            }}>
              {/* Progress Line */}
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '4%',
                right: '4%',
                height: 2,
                backgroundColor: '#e2e8f0',
                borderRadius: 1,
                zIndex: 0
              }}>
                <Box sx={{
                  height: '100%',
                  width: `${(activeStep / (steps.length - 1)) * 100}%`,
                  background: 'linear-gradient(90deg, #8b6cbc 0%, #9575d1 100%)',
                  borderRadius: 1,
                  transition: 'width 0.3s ease'
                }} />
              </Box>

              {/* Step Circles */}
              {steps.map((step, index) => (
                <Box
                  key={index}
                  onClick={() => handleStepClick(index)}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: index <= activeStep ? '#8b6cbc' : '#e2e8f0',
                    color: index <= activeStep ? 'white' : '#64748b',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease',
                    boxShadow: index <= activeStep ? '0 4px 12px rgba(139, 108, 188, 0.3)' : 'none',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: '0 6px 16px rgba(139, 108, 188, 0.4)'
                    }
                  }}
                >
                  {index < activeStep ? (
                    <CheckIcon sx={{ fontSize: 20 }} />
                  ) : (
                    index + 1
                  )}
                </Box>
              ))}
            </Box>

            {/* Step Labels */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              {steps.map((step, index) => (
                <Typography
                  key={index}
                  variant="caption"
                  sx={{
                    textAlign: 'center',
                    width: '14%',
                    color: index <= activeStep ? '#8b6cbc' : '#64748b',
                    fontWeight: index === activeStep ? 600 : 400,
                    fontSize: '0.75rem',
                    lineHeight: 1.2
                  }}
                >
                  {step}
                </Typography>
              ))}
            </Box>
          </Box>

          {/* Step Content */}
          <Box sx={{ minHeight: 400, py: 3 }}>
            {renderStepContent()}
          </Box>

          {/* Navigation Buttons */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            pt: 3,
            borderTop: '1px solid rgba(139, 108, 188, 0.12)'
          }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<ArrowBackIcon />}
              sx={{
                color: '#8b6cbc',
                fontWeight: 500,
                '&:disabled': {
                  color: '#cbd5e0'
                }
              }}
            >
              Previous Step
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
                sx={{
                  borderColor: '#8b6cbc',
                  color: '#8b6cbc',
                  '&:hover': {
                    borderColor: '#8b6cbc',
                    backgroundColor: 'rgba(139, 108, 188, 0.08)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? 'Updating...' : 'Update Proposal'}
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SubmitIcon />}
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #8b6cbc 0%, #9575d1 100%)',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    boxShadow: '0 4px 16px rgba(139, 108, 188, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7b5ca7 0%, #8b6cbc 100%)',
                      boxShadow: '0 6px 20px rgba(139, 108, 188, 0.4)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {loading ? 'Updating...' : 'Update Proposal'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={false}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #8b6cbc 0%, #9575d1 100%)',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    boxShadow: '0 4px 16px rgba(139, 108, 188, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7b5ca7 0%, #8b6cbc 100%)',
                      boxShadow: '0 6px 20px rgba(139, 108, 188, 0.4)',
                      transform: 'translateY(-1px)'
                    },
                    '&:disabled': {
                      background: 'rgba(139, 108, 188, 0.3)',
                      boxShadow: 'none'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Next Step
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* ORCID Search Modals */}
      <OrcidSearchModal
        open={piSearchModalOpen}
        onClose={() => setPiSearchModalOpen(false)}
        onSelect={handlePrincipalInvestigatorSelect}
        title="Search for Principal Investigator"
        subtitle="Find and select the principal investigator using ORCID database"
      />

      <OrcidSearchModal
        open={coInvSearchModalOpen}
        onClose={() => setCoInvSearchModalOpen(false)}
        onSelect={handleCoInvestigatorSelect}
        title="Search for Co-Investigator"
        subtitle="Find and add co-investigators using ORCID database"
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditProposalPage;
