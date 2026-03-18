'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Paper, Typography, Button, TextField, MenuItem, FormControl, FormLabel,
  RadioGroup, FormControlLabel, Radio, Checkbox, Stepper, Step, StepLabel, Alert, Chip,
  Divider, CircularProgress, Card, CardContent,
} from '@mui/material';
import {
  Shield as EthicsIcon, ArrowBack as BackIcon, Save as SaveIcon, Send as SubmitIcon,
  Add as AddIcon, Home as HomeIcon, Person as PersonIcon, Science as ScienceIcon,
  Groups as GroupsIcon, Security as SecurityIcon, Assessment as RiskIcon,
  Description as DocIcon, CheckCircle as CheckIcon, Search as SearchIcon,
} from '@mui/icons-material';
import PageHeader from '../../../../../components/common/PageHeader';
import RichTextEditor from '../../../../../components/common/RichTextEditor';
import FileUploadZone from '../../../../../components/common/FileUploadZone';
import OrcidSearchModal from './components/OrcidSearchModal';
import { useAuth } from '../../../../../components/AuthProvider';

const steps = [
  { label: 'Project Overview', icon: <EthicsIcon /> },
  { label: 'Research Team', icon: <PersonIcon /> },
  { label: 'Research Design', icon: <ScienceIcon /> },
  { label: 'Participants', icon: <GroupsIcon /> },
  { label: 'Ethics & Data', icon: <SecurityIcon /> },
  { label: 'Risk & Benefits', icon: <RiskIcon /> },
  { label: 'Documentation', icon: <DocIcon /> },
  { label: 'Review', icon: <CheckIcon /> }
];

const researchTypes = [
  'Clinical Trial', 'Observational Study', 'Survey Research', 'Interview Study',
  'Laboratory Research', 'Secondary Data Analysis', 'Community-Based Research', 'Other'
];

const vulnerablePopulations = [
  'Children (under 18)', 'Pregnant Women', 'Prisoners', 'Mentally Disabled Persons',
  'Economically Disadvantaged', 'Educationally Disadvantaged', 'None'
];

export default function CreateEthicsApplicationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [piSearchModalOpen, setPiSearchModalOpen] = useState(false);
  const [coInvSearchModalOpen, setCoInvSearchModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '', laySummary: '', researchAims: '', researchSignificance: '',
    piOption: 'useProfile',
    principalInvestigator: '', piOrcid: '', piEmail: user?.email || '', piPhone: '',
    piInstitution: '', piDepartment: '', piQualifications: '', coInvestigators: [],
    researchType: '', researchTypeOther: '', scientificValidity: '', researchProcedures: '',
    dataAnalysisPlan: '', studyDuration: '', startDate: '', endDate: '', fundingSource: '',
    fundingAmount: '', timeline: '', studyPopulation: '', sampleSize: '', inclusionCriteria: '',
    exclusionCriteria: '', recruitmentStrategy: '', vulnerablePopulations: [],
    vulnerableGroupJustification: '', powerImbalanceConsiderations: '',
    informedConsentProcess: '', consentCapacityAssessment: '', withdrawalProcess: '',
    participantCosts: '', dataCollectionMethods: '', anonymizationMethod: '',
    dataStorageLocation: '', dataStorageSecurity: '', dataRetentionPeriod: '',
    dataDisposalProtocol: '', physicalRisks: '', psychologicalRisks: '', socialRisks: '',
    riskMitigationStrategies: '', directBenefits: '', indirectBenefits: '',
    riskBenefitAnalysis: '', conflictOfInterest: false, conflictDetails: '',
    previousEthicsApproval: false, previousApprovalDetails: '',
    participantInfoSheet: [], consentForm: [], researchProtocol: [],
    recruitmentMaterials: [], dataCollectionTools: [], lettersOfSupport: [],
    investigatorCVs: [], additionalComments: '',
  });

  const handleChange = (field) => (value) => {
    if (typeof value === 'object' && value?.target) {
      const targetValue = value.target.type === 'checkbox' ? value.target.checked : value.target.value;
      setFormData(prev => ({ ...prev, [field]: targetValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleVulnerablePopChange = (population) => (event) => {
    if (event.target.checked) {
      setFormData(prev => ({ ...prev, vulnerablePopulations: [...prev.vulnerablePopulations, population] }));
    } else {
      setFormData(prev => ({ ...prev, vulnerablePopulations: prev.vulnerablePopulations.filter(p => p !== population) }));
    }
  };

  const handlePrincipalInvestigatorSelect = (researcher) => {
    setFormData(prev => ({
      ...prev,
      principalInvestigator: researcher.creditName || `${researcher.givenNames} ${researcher.familyName}`.trim(),
      piOrcid: researcher.orcidId,
      piInstitution: researcher.affiliations?.[0] || '',
    }));
  };

  const handleCoInvestigatorSelect = (researcher) => {
    const newCoInv = {
      name: researcher.creditName || `${researcher.givenNames} ${researcher.familyName}`.trim(),
      orcid: researcher.orcidId,
      email: '',
      role: '',
      institution: researcher.affiliations?.[0] || '',
    };
    setFormData(prev => ({ ...prev, coInvestigators: [...prev.coInvestigators, newCoInv] }));
  };

  const removeCoInvestigator = (index) => {
    setFormData(prev => ({ ...prev, coInvestigators: prev.coInvestigators.filter((_, i) => i !== index) }));
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/ethics/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id, status: 'DRAFT' }),
      });
      const data = await response.json();
      if (data.success) {
        router.push('/researcher/ethics/applications');
      } else {
        setError(data.error || 'Failed to save application');
      }
    } catch (err) {
      setError('An error occurred while saving the application');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/ethics/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id, status: 'DRAFT' }),
      });
      const data = await response.json();
      if (data.success) {
        const submitResponse = await fetch(`/api/ethics/applications/${data.application.id}/submit`, { method: 'POST' });
        if (submitResponse.ok) {
          router.push('/researcher/ethics/applications');
        } else {
          setError('Failed to submit application');
        }
      } else {
        setError(data.error || 'Failed to create application');
      }
    } catch (err) {
      setError('An error occurred while submitting the application');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Project Summary Guidelines</Typography>
              <Typography variant="body2">Provide a brief overview in plain language for non-expert audiences. Avoid jargon and technical terms.</Typography>
            </Alert>
            <TextField label="Study Title" fullWidth required value={formData.title} onChange={handleChange('title')}
              placeholder="Enter the full title of your research study" sx={{ mb: 3 }} InputLabelProps={{ sx: { fontWeight: 600 } }} />
            <RichTextEditor label="Lay Summary (Plain Language)" value={formData.laySummary} onChange={handleChange('laySummary')}
              placeholder="Explain your research in simple terms that anyone can understand. Avoid jargon and technical language."
              helperText="Write for a general audience without specialized knowledge" required minRows={5} />
            <RichTextEditor label="Research Aims" value={formData.researchAims} onChange={handleChange('researchAims')}
              placeholder="What does this research intend to achieve? What questions will it answer?"
              helperText="Clearly state the main objectives" required minRows={4} />
            <RichTextEditor label="Research Significance" value={formData.researchSignificance} onChange={handleChange('researchSignificance')}
              placeholder="Why is this research important? What are the potential benefits to participants, science, or society?"
              helperText="Explain the value and impact of this research" required minRows={4} />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Research Team Qualifications</Typography>
              <Typography variant="body2">Evidence of research team qualifications and experience must be provided. CVs will be uploaded in the Documentation step.</Typography>
            </Alert>
            <Card sx={{ mb: 4, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon sx={{ color: '#8b6cbc' }} />
                  Principal Investigator
                </Typography>
                <RadioGroup value={formData.piOption} onChange={(e) => handleChange('piOption')(e.target.value)} sx={{ mb: 3 }}>
                  <FormControlLabel value="useProfile" control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />}
                    label={<Box><Typography variant="body1" sx={{ fontWeight: 600 }}>Use My Profile</Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>Use your ORCID profile information</Typography></Box>} />
                  <FormControlLabel value="searchOther" control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />}
                    label={<Box><Typography variant="body1" sx={{ fontWeight: 600 }}>Search for Another Researcher</Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>Find a different principal investigator using ORCID</Typography></Box>} />
                </RadioGroup>
                {formData.piOption === 'searchOther' && (
                  <Button variant="outlined" startIcon={<SearchIcon />} onClick={() => setPiSearchModalOpen(true)}
                    sx={{ mb: 3, borderColor: '#8b6cbc', color: '#8b6cbc', '&:hover': { borderColor: '#7a5caa', bgcolor: 'rgba(139, 108, 188, 0.04)' } }}>
                    Search ORCID Database
                  </Button>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '250px' }}>
                      <TextField label="Full Name" fullWidth required
                        value={formData.piOption === 'useProfile' ? `${user?.givenName || ''} ${user?.familyName || ''}`.trim() : formData.principalInvestigator}
                        onChange={handleChange('principalInvestigator')} disabled={formData.piOption === 'useProfile'}
                        InputLabelProps={{ sx: { fontWeight: 600 } }} />
                    </Box>
                    <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '250px' }}>
                      <TextField label="ORCID iD" fullWidth required
                        value={formData.piOption === 'useProfile' ? user?.orcidId || '' : formData.piOrcid}
                        onChange={handleChange('piOrcid')} placeholder="0000-0000-0000-0000" disabled={formData.piOption === 'useProfile'}
                        helperText="Enter your ORCID identifier" InputLabelProps={{ sx: { fontWeight: 600 } }} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '250px' }}>
                      <TextField label="Email" type="email" fullWidth required value={formData.piEmail}
                        onChange={handleChange('piEmail')} InputLabelProps={{ sx: { fontWeight: 600 } }} />
                    </Box>
                    <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '250px' }}>
                      <TextField label="Phone Number" fullWidth required value={formData.piPhone}
                        onChange={handleChange('piPhone')} InputLabelProps={{ sx: { fontWeight: 600 } }} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '250px' }}>
                      <TextField label="Institution" fullWidth required value={formData.piInstitution}
                        onChange={handleChange('piInstitution')} InputLabelProps={{ sx: { fontWeight: 600 } }} />
                    </Box>
                    <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '250px' }}>
                      <TextField label="Department" fullWidth required value={formData.piDepartment}
                        onChange={handleChange('piDepartment')} InputLabelProps={{ sx: { fontWeight: 600 } }} />
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ mt: 3 }}>
                  <RichTextEditor label="Qualifications & Experience" value={formData.piQualifications} onChange={handleChange('piQualifications')}
                    placeholder="Briefly describe your relevant qualifications and research experience"
                    helperText="Include degrees, certifications, and relevant experience" required minRows={3} />
                </Box>
              </CardContent>
            </Card>
            <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GroupsIcon sx={{ color: '#8b6cbc' }} />
                  Co-Investigators
                </Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setCoInvSearchModalOpen(true)}
                  sx={{ mb: 2, borderColor: '#8b6cbc', color: '#8b6cbc', '&:hover': { borderColor: '#7a5caa', bgcolor: 'rgba(139, 108, 188, 0.04)' } }}>
                  Add Co-Investigator from ORCID
                </Button>
                {formData.coInvestigators.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {formData.coInvestigators.map((ci, index) => (
                      <Chip key={index} label={`${ci.name} ${ci.orcid ? `(${ci.orcid})` : ''}`} onDelete={() => removeCoInvestigator(index)}
                        sx={{ bgcolor: 'rgba(139, 108, 188, 0.1)', border: '1px solid rgba(139, 108, 188, 0.3)', '& .MuiChip-deleteIcon': { color: '#8b6cbc' } }} />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Scientific Validity</Typography>
              <Typography variant="body2">Demonstrate that your study design can answer the research question.</Typography>
            </Alert>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '250px' }}>
                <TextField select label="Research Type" fullWidth required value={formData.researchType} onChange={handleChange('researchType')}
                  InputLabelProps={{ sx: { fontWeight: 600 } }}>
                  {researchTypes.map((type) => (<MenuItem key={type} value={type}>{type}</MenuItem>))}
                </TextField>
              </Box>
              {formData.researchType === 'Other' && (
                <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '250px' }}>
                  <TextField label="Specify Research Type" fullWidth required value={formData.researchTypeOther}
                    onChange={handleChange('researchTypeOther')} InputLabelProps={{ sx: { fontWeight: 600 } }} />
                </Box>
              )}
            </Box>
            <Box sx={{ mt: 3 }}>
              <RichTextEditor label="Scientific Validity" value={formData.scientificValidity} onChange={handleChange('scientificValidity')}
                placeholder="Explain how your research design ensures the study can answer the research question"
                helperText="Justify your methodology and approach" required minRows={4} />
              <RichTextEditor label="Research Procedures" value={formData.researchProcedures} onChange={handleChange('researchProcedures')}
                placeholder="Provide a step-by-step account of what participants will be asked to do (e.g., interviews, surveys, clinical tests, observations)"
                helperText="Be specific about all procedures involving participants" required minRows={5} />
              <RichTextEditor label="Data Analysis Plan" value={formData.dataAnalysisPlan} onChange={handleChange('dataAnalysisPlan')}
                placeholder="Describe how the collected information will be processed and interpreted"
                helperText="Include statistical methods or qualitative analysis approaches" required minRows={4} />
              <RichTextEditor label="Research Timeline" value={formData.timeline} onChange={handleChange('timeline')}
                placeholder="Provide a detailed timeline for your research activities"
                helperText="Include key milestones and phases" required minRows={3} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 calc(33.333% - 11px)', minWidth: '200px' }}>
                  <TextField label="Study Duration (months)" type="number" fullWidth required value={formData.studyDuration}
                    onChange={handleChange('studyDuration')} InputLabelProps={{ sx: { fontWeight: 600 } }} />
                </Box>
                <Box sx={{ flex: '1 1 calc(33.333% - 11px)', minWidth: '200px' }}>
                  <TextField label="Start Date" type="date" fullWidth required value={formData.startDate}
                    onChange={handleChange('startDate')} InputLabelProps={{ shrink: true, sx: { fontWeight: 600 } }} />
                </Box>
                <Box sx={{ flex: '1 1 calc(33.333% - 11px)', minWidth: '200px' }}>
                  <TextField label="End Date" type="date" fullWidth required value={formData.endDate}
                    onChange={handleChange('endDate')} InputLabelProps={{ shrink: true, sx: { fontWeight: 600 } }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '250px' }}>
                  <TextField label="Funding Source" fullWidth value={formData.fundingSource} onChange={handleChange('fundingSource')}
                    helperText="Leave blank if unfunded" InputLabelProps={{ sx: { fontWeight: 600 } }} />
                </Box>
                <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '250px' }}>
                  <TextField label="Funding Amount" fullWidth value={formData.fundingAmount}
                    onChange={handleChange('fundingAmount')} InputLabelProps={{ sx: { fontWeight: 600 } }} />
                </Box>
              </Box>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Alert severity="warning" sx={{ mb: 4, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Participant Selection Criteria</Typography>
              <Typography variant="body2">Clearly define who can participate and justify inclusion of vulnerable groups.</Typography>
            </Alert>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
              <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
                <RichTextEditor label="Study Population" value={formData.studyPopulation} onChange={handleChange('studyPopulation')}
                  placeholder="Describe the target population for your study"
                  helperText="Be specific about demographics and characteristics" required minRows={3} />
              </Box>
              <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
                <TextField label="Sample Size" type="number" fullWidth required value={formData.sampleSize}
                  onChange={handleChange('sampleSize')} helperText="Justify your sample size if possible"
                  InputLabelProps={{ sx: { fontWeight: 600 } }} sx={{ mb: 3 }} />
              </Box>
            </Box>
            <RichTextEditor label="Inclusion Criteria" value={formData.inclusionCriteria} onChange={handleChange('inclusionCriteria')}
              placeholder="Clearly defined parameters for who CAN participate in this study"
              helperText="List all criteria that participants must meet" required minRows={4} />
            <RichTextEditor label="Exclusion Criteria" value={formData.exclusionCriteria} onChange={handleChange('exclusionCriteria')}
              placeholder="Clearly defined parameters for who CANNOT participate in this study"
              helperText="List all criteria that would exclude participants" required minRows={4} />
            <RichTextEditor label="Recruitment Strategy" value={formData.recruitmentStrategy} onChange={handleChange('recruitmentStrategy')}
              placeholder="How will participants be identified and approached? (e.g., flyers, social media, database screening, direct contact)"
              helperText="Describe all recruitment methods in detail. Recruitment materials will be uploaded in the Documentation step." required minRows={4} />
            <Card sx={{ p: 3, bgcolor: 'rgba(255, 193, 7, 0.05)', border: '1px solid rgba(255, 193, 7, 0.3)', mb: 3 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ color: '#2D3748', fontWeight: 600, mb: 2 }}>Vulnerable Populations Involved *</FormLabel>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {vulnerablePopulations.map((population) => (
                    <Box key={population} sx={{ flex: '1 1 calc(50% - 4px)', minWidth: '200px' }}>
                      <FormControlLabel control={<Checkbox checked={formData.vulnerablePopulations.includes(population)}
                        onChange={handleVulnerablePopChange(population)} sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />}
                        label={population} />
                    </Box>
                  ))}
                </Box>
              </FormControl>
            </Card>
            {formData.vulnerablePopulations.length > 0 && !formData.vulnerablePopulations.includes('None') && (
              <RichTextEditor label="Vulnerable Group Justification" value={formData.vulnerableGroupJustification}
                onChange={handleChange('vulnerableGroupJustification')}
                placeholder="Provide specific justification for including vulnerable populations in your study"
                helperText="Explain why this group must be included and how they will be protected" required minRows={4} />
            )}
            <RichTextEditor label="Power Imbalance Considerations" value={formData.powerImbalanceConsiderations}
              onChange={handleChange('powerImbalanceConsiderations')}
              placeholder="If you have a relationship with participants (e.g., teacher/student, employer/employee), explain how you will prevent coercion"
              helperText="Address any dependent relationships that might affect voluntary participation" minRows={3} />
          </Box>
        );

      case 4:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Informed Consent & Data Protection</Typography>
              <Typography variant="body2">Demonstrate that participants can make a truly voluntary and informed decision, and that their data will be protected.</Typography>
            </Alert>
            <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 2, mt: 3 }}>Informed Consent Process</Typography>
            <RichTextEditor label="Consent Process" value={formData.informedConsentProcess} onChange={handleChange('informedConsentProcess')}
              placeholder="Describe HOW and WHEN consent will be sought. Ensure participants have adequate time to decide."
              helperText="Include details about the consent procedure and timing. Consent forms will be uploaded in the Documentation step." required minRows={5} />
            <RichTextEditor label="Capacity Assessment" value={formData.consentCapacityAssessment} onChange={handleChange('consentCapacityAssessment')}
              placeholder="How will you assess if the participant understands the information provided?"
              helperText="Describe methods to ensure comprehension" required minRows={3} />
            <RichTextEditor label="Withdrawal Process" value={formData.withdrawalProcess} onChange={handleChange('withdrawalProcess')}
              placeholder="Describe the process for participants to withdraw from the study and what happens to their data"
              helperText="Confirm that participation is voluntary and participants can withdraw at any time without penalty" required minRows={3} />
            <RichTextEditor label="Participant Costs & Compensation" value={formData.participantCosts} onChange={handleChange('participantCosts')}
              placeholder="Will participants incur any costs (e.g., travel, parking, time off work)? Will they receive reimbursement or incentives? State 'None' if no costs."
              helperText="Be transparent about any costs to participants and any compensation provided" required minRows={2} />
            <Divider sx={{ my: 4 }} />
            <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 2 }}>Data Management & Protection</Typography>
            <RichTextEditor label="Data Collection Methods" value={formData.dataCollectionMethods} onChange={handleChange('dataCollectionMethods')}
              placeholder="Describe all methods of data collection (questionnaires, interviews, observations, etc.)"
              helperText="Final versions of data collection tools will be uploaded in the Documentation step" required minRows={3} />
            <RichTextEditor label="Anonymization Method" value={formData.anonymizationMethod} onChange={handleChange('anonymizationMethod')}
              placeholder="How will data be de-identified? (e.g., pseudonyms, ID codes, removal of identifiers)"
              helperText="Describe the specific anonymization process" required minRows={3} />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '250px' }}>
                <TextField label="Data Storage Location" fullWidth required value={formData.dataStorageLocation}
                  onChange={handleChange('dataStorageLocation')} placeholder="e.g., encrypted drives, locked cabinets, secure servers"
                  helperText="Be specific about physical and digital storage" InputLabelProps={{ sx: { fontWeight: 600 } }} />
              </Box>
              <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '250px' }}>
                <TextField label="Data Retention Period" fullWidth required value={formData.dataRetentionPeriod}
                  onChange={handleChange('dataRetentionPeriod')} placeholder="e.g., 5 years after publication"
                  helperText="Follow institutional or funder requirements" InputLabelProps={{ sx: { fontWeight: 600 } }} />
              </Box>
            </Box>
            <RichTextEditor label="Data Storage Security" value={formData.dataStorageSecurity} onChange={handleChange('dataStorageSecurity')}
              placeholder="Describe security measures (encryption, password protection, access controls)"
              helperText="Explain how data will be protected from unauthorized access" required minRows={3} />
            <RichTextEditor label="Data Disposal Protocol" value={formData.dataDisposalProtocol} onChange={handleChange('dataDisposalProtocol')}
              placeholder="Describe protocols for the eventual destruction of sensitive records"
              helperText="Include methods for secure deletion/destruction" required minRows={3} />
          </Box>
        );

      case 5:
        return (
          <Box>
            <Alert severity="warning" sx={{ mb: 4, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Risk-Benefit Analysis</Typography>
              <Typography variant="body2">Demonstrate that benefits outweigh risks and that all risks are minimized.</Typography>
            </Alert>
            <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 2 }}>Risk Identification</Typography>
            <RichTextEditor label="Physical Risks" value={formData.physicalRisks} onChange={handleChange('physicalRisks')}
              placeholder="Identify any potential physical risks to participants (discomfort, injury, health impacts). State 'None' if no physical risks." required minRows={3} />
            <RichTextEditor label="Psychological Risks" value={formData.psychologicalRisks} onChange={handleChange('psychologicalRisks')}
              placeholder="Identify any potential psychological risks (stress, anxiety, emotional distress). State 'None' if no psychological risks."
              helperText="Consider sensitive topics or traumatic experiences" required minRows={3} />
            <RichTextEditor label="Social & Other Risks" value={formData.socialRisks} onChange={handleChange('socialRisks')}
              placeholder="Identify any potential social, legal, or economic risks (stigma, discrimination, job loss, financial burden). State 'None' if no such risks." required minRows={3} />
            <RichTextEditor label="Risk Mitigation Strategies" value={formData.riskMitigationStrategies} onChange={handleChange('riskMitigationStrategies')}
              placeholder="Describe specific steps to minimize ALL identified risks (e.g., providing counselor contact info for sensitive topics, monitoring procedures, stopping criteria)"
              helperText="Address each type of risk identified above" required minRows={5} />
            <Divider sx={{ my: 4 }} />
            <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 2 }}>Benefits Analysis</Typography>
            <RichTextEditor label="Direct Benefits to Participants" value={formData.directBenefits} onChange={handleChange('directBenefits')}
              placeholder="What direct benefits will participants receive? State 'None' if no direct benefits."
              helperText="Be realistic - not all research provides direct benefits" required minRows={3} />
            <RichTextEditor label="Indirect Benefits (Science/Society)" value={formData.indirectBenefits} onChange={handleChange('indirectBenefits')}
              placeholder="What are the potential benefits to science or society?"
              helperText="Explain the broader impact of the research" required minRows={3} />
            <RichTextEditor label="Risk-Benefit Analysis" value={formData.riskBenefitAnalysis} onChange={handleChange('riskBenefitAnalysis')}
              placeholder="Explain why the benefits outweigh the risks. Justify why this research should proceed despite the risks."
              helperText="Provide a balanced assessment" required minRows={5} />
            <Divider sx={{ my: 4 }} />
            <Card sx={{ p: 3, bgcolor: 'rgba(139, 108, 188, 0.05)', border: '1px solid rgba(139, 108, 188, 0.2)' }}>
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel component="legend" sx={{ color: '#2D3748', fontWeight: 600, mb: 1 }}>Conflict of Interest Disclosure *</FormLabel>
                <RadioGroup value={formData.conflictOfInterest.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, conflictOfInterest: e.target.value === 'true' }))}>
                  <FormControlLabel value="false" control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />} label="No conflict of interest" />
                  <FormControlLabel value="true" control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />} label="Conflict of interest exists" />
                </RadioGroup>
              </FormControl>
              {formData.conflictOfInterest && (
                <RichTextEditor label="Conflict of Interest Details" value={formData.conflictDetails} onChange={handleChange('conflictDetails')}
                  placeholder="Disclose any financial or personal interests that could influence the research"
                  helperText="Full transparency is required" required minRows={3} />
              )}
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ color: '#2D3748', fontWeight: 600, mb: 1 }}>Previous Ethics Approval</FormLabel>
                <RadioGroup value={formData.previousEthicsApproval.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, previousEthicsApproval: e.target.value === 'true' }))}>
                  <FormControlLabel value="false" control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />} label="No previous approval" />
                  <FormControlLabel value="true" control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />} label="Previously approved by another committee" />
                </RadioGroup>
              </FormControl>
              {formData.previousEthicsApproval && (
                <Box sx={{ mt: 2 }}>
                  <RichTextEditor label="Previous Approval Details" value={formData.previousApprovalDetails} onChange={handleChange('previousApprovalDetails')}
                    placeholder="Provide reference number, institution, and date of previous approval" required minRows={2} />
                </Box>
              )}
            </Card>
          </Box>
        );

      case 6:
        return (
          <Box>
            <Alert severity="warning" sx={{ mb: 4, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Mandatory Documentation</Typography>
              <Typography variant="body2">All required documents must be uploaded. Ensure consistency across all documents (participant numbers, study title, procedures).</Typography>
            </Alert>
            <FileUploadZone label="Participant Information Sheet (PIS)"
              description="Explains the study in lay terms; includes contact details for PI and Ethics Committee"
              files={formData.participantInfoSheet} onChange={(files) => setFormData(prev => ({ ...prev, participantInfoSheet: files }))}
              acceptedTypes=".pdf,.doc,.docx" required />
            <FileUploadZone label="Consent Form"
              description="Formal document for participant signature (or verbal script/online version)"
              files={formData.consentForm} onChange={(files) => setFormData(prev => ({ ...prev, consentForm: files }))}
              acceptedTypes=".pdf,.doc,.docx" required />
            <FileUploadZone label="Research Protocol"
              description="Full scientific plan including references and detailed timeline"
              files={formData.researchProtocol} onChange={(files) => setFormData(prev => ({ ...prev, researchProtocol: files }))}
              acceptedTypes=".pdf,.doc,.docx" required />
            <FileUploadZone label="Recruitment Materials"
              description="Copies of all flyers, emails, social media posts, or scripts"
              files={formData.recruitmentMaterials} onChange={(files) => setFormData(prev => ({ ...prev, recruitmentMaterials: files }))}
              acceptedTypes=".pdf,.doc,.docx,.jpg,.jpeg,.png" multiple required />
            <FileUploadZone label="Data Collection Tools"
              description="Final versions of questionnaires, interview schedules, or observation checklists"
              files={formData.dataCollectionTools} onChange={(files) => setFormData(prev => ({ ...prev, dataCollectionTools: files }))}
              acceptedTypes=".pdf,.doc,.docx,.xlsx" multiple required />
            <FileUploadZone label="Letters of Support"
              description="Permission from third-party organizations (schools, hospitals) if applicable"
              files={formData.lettersOfSupport} onChange={(files) => setFormData(prev => ({ ...prev, lettersOfSupport: files }))}
              acceptedTypes=".pdf,.doc,.docx" multiple />
            <FileUploadZone label="Investigator CVs"
              description="Evidence of research team qualifications and experience"
              files={formData.investigatorCVs} onChange={(files) => setFormData(prev => ({ ...prev, investigatorCVs: files }))}
              acceptedTypes=".pdf,.doc,.docx" multiple required />
            <Divider sx={{ my: 4 }} />
            <RichTextEditor label="Additional Comments" value={formData.additionalComments} onChange={handleChange('additionalComments')}
              placeholder="Any additional information or clarifications you would like to provide" minRows={4} />
            <Alert severity="success" sx={{ mt: 3 }}>
              <Typography variant="body2"><strong>Consistency Check:</strong> Ensure the number of participants, study title, and procedures match across ALL submitted documents.</Typography>
            </Alert>
          </Box>
        );

      case 7:
        return (
          <Box>
            <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 3 }}>Review Your Application</Typography>
            <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
              Please review all information carefully before submitting. You can save as draft and return later if needed.
            </Alert>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
                <Card sx={{ height: '100%', border: '1px solid rgba(139, 108, 188, 0.2)', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EthicsIcon fontSize="small" />Project Overview
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box><Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>Title</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.title || 'Not provided'}</Typography></Box>
                      <Box><Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>Research Type</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.researchType || 'Not provided'}</Typography></Box>
                      <Box><Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>Duration</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.studyDuration ? `${formData.studyDuration} months` : 'Not provided'}</Typography></Box>
                      <Box><Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>Sample Size</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.sampleSize || 'Not provided'}</Typography></Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
                <Card sx={{ height: '100%', border: '1px solid rgba(139, 108, 188, 0.2)', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" />Research Team
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box><Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>Principal Investigator</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formData.piOption === 'useProfile' ? `${user?.givenName || ''} ${user?.familyName || ''}`.trim() : formData.principalInvestigator || 'Not provided'}
                        </Typography></Box>
                      <Box><Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>ORCID</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formData.piOption === 'useProfile' ? user?.orcidId || 'Not provided' : formData.piOrcid || 'Not provided'}
                        </Typography></Box>
                      <Box><Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>Institution</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.piInstitution || 'Not provided'}</Typography></Box>
                      <Box><Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>Co-Investigators</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.coInvestigators.length}</Typography></Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
                <Card sx={{ height: '100%', border: '1px solid rgba(139, 108, 188, 0.2)', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GroupsIcon fontSize="small" />Participants & Ethics
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box><Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>Vulnerable Populations</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formData.vulnerablePopulations.length > 0 ? formData.vulnerablePopulations.join(', ') : 'None'}
                        </Typography></Box>
                      <Box><Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>Conflict of Interest</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.conflictOfInterest ? 'Yes - Disclosed' : 'No'}</Typography></Box>
                      <Box><Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>Previous Approval</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.previousEthicsApproval ? 'Yes' : 'No'}</Typography></Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
                <Card sx={{ height: '100%', border: '1px solid rgba(139, 108, 188, 0.2)', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DocIcon fontSize="small" />Documentation
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="body2">
                        <CheckIcon sx={{ fontSize: 16, color: formData.participantInfoSheet.length > 0 ? '#10b981' : '#cbd5e0', mr: 1 }} />
                        Participant Info Sheet: {formData.participantInfoSheet.length > 0 ? `${formData.participantInfoSheet.length} file(s)` : 'Not uploaded'}
                      </Typography>
                      <Typography variant="body2">
                        <CheckIcon sx={{ fontSize: 16, color: formData.consentForm.length > 0 ? '#10b981' : '#cbd5e0', mr: 1 }} />
                        Consent Form: {formData.consentForm.length > 0 ? `${formData.consentForm.length} file(s)` : 'Not uploaded'}
                      </Typography>
                      <Typography variant="body2">
                        <CheckIcon sx={{ fontSize: 16, color: formData.researchProtocol.length > 0 ? '#10b981' : '#cbd5e0', mr: 1 }} />
                        Research Protocol: {formData.researchProtocol.length > 0 ? `${formData.researchProtocol.length} file(s)` : 'Not uploaded'}
                      </Typography>
                      <Typography variant="body2">
                        <CheckIcon sx={{ fontSize: 16, color: formData.recruitmentMaterials.length > 0 ? '#10b981' : '#cbd5e0', mr: 1 }} />
                        Recruitment Materials: {formData.recruitmentMaterials.length > 0 ? `${formData.recruitmentMaterials.length} file(s)` : 'Not uploaded'}
                      </Typography>
                      <Typography variant="body2">
                        <CheckIcon sx={{ fontSize: 16, color: formData.dataCollectionTools.length > 0 ? '#10b981' : '#cbd5e0', mr: 1 }} />
                        Data Collection Tools: {formData.dataCollectionTools.length > 0 ? `${formData.dataCollectionTools.length} file(s)` : 'Not uploaded'}
                      </Typography>
                      <Typography variant="body2">
                        <CheckIcon sx={{ fontSize: 16, color: formData.investigatorCVs.length > 0 ? '#10b981' : '#cbd5e0', mr: 1 }} />
                        Investigator CVs: {formData.investigatorCVs.length > 0 ? `${formData.investigatorCVs.length} file(s)` : 'Not uploaded'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
            <Alert severity="warning" sx={{ mt: 4 }}>
              <Typography variant="body2"><strong>Before submitting:</strong> Ensure all participant-facing documents use clear, everyday language without jargon. Verify consistency across all documents.</Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ bgcolor: '#f7fafc', minHeight: '100vh', pb: 6 }}>
      <PageHeader title="Create Ethics Application" description="Submit a comprehensive research ethics application for review"
        icon={<EthicsIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' },
          { label: 'Ethics', path: '/researcher/ethics/applications' },
          { label: 'Create Application' }
        ]} />
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', border: '1px solid #e2e8f0' }}>
          <Stepper activeStep={activeStep} sx={{ mb: 5, '& .MuiStepLabel-root .Mui-completed': { color: '#10b981' }, '& .MuiStepLabel-root .Mui-active': { color: '#8b6cbc' } }}>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel StepIconComponent={() => (
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: index === activeStep ? '#8b6cbc' : index < activeStep ? '#10b981' : '#e2e8f0',
                    color: index <= activeStep ? '#fff' : '#a0aec0', transition: 'all 0.3s ease' }}>
                    {React.cloneElement(step.icon, { sx: { fontSize: 20 } })}
                  </Box>
                )}>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {error && (<Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>)}
          <Box sx={{ minHeight: 400 }}>{renderStepContent(activeStep)}</Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5, pt: 3, borderTop: '2px solid #e2e8f0' }}>
            <Button startIcon={<BackIcon />} onClick={() => router.push('/researcher/ethics/applications')}
              sx={{ color: '#718096', '&:hover': { bgcolor: 'rgba(113, 128, 150, 0.08)' } }}>Cancel</Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep > 0 && (<Button onClick={handleBack} sx={{ color: '#8b6cbc', '&:hover': { bgcolor: 'rgba(139, 108, 188, 0.08)' } }}>Back</Button>)}
              {activeStep < steps.length - 1 ? (
                <>
                  <Button variant="outlined" startIcon={<SaveIcon />} onClick={handleSaveDraft} disabled={loading}
                    sx={{ borderColor: '#8b6cbc', color: '#8b6cbc', '&:hover': { borderColor: '#7a5caa', bgcolor: 'rgba(139, 108, 188, 0.04)' } }}>Save Draft</Button>
                  <Button variant="contained" onClick={handleNext}
                    sx={{ background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)', boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)',
                      '&:hover': { background: 'linear-gradient(135deg, #7a5caa 0%, #6a4c9a 100%)', boxShadow: '0 6px 16px rgba(139, 108, 188, 0.4)' } }}>Next</Button>
                </>
              ) : (
                <>
                  <Button variant="outlined" startIcon={<SaveIcon />} onClick={handleSaveDraft} disabled={loading}
                    sx={{ borderColor: '#8b6cbc', color: '#8b6cbc', '&:hover': { borderColor: '#7a5caa', bgcolor: 'rgba(139, 108, 188, 0.04)' } }}>Save Draft</Button>
                  <Button variant="contained" startIcon={loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <SubmitIcon />}
                    onClick={handleSubmit} disabled={loading}
                    sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)' } }}>
                    {loading ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Paper>
      </Container>
      <OrcidSearchModal open={piSearchModalOpen} onClose={() => setPiSearchModalOpen(false)}
        onSelect={handlePrincipalInvestigatorSelect} title="Search for Principal Investigator"
        subtitle="Find and select the principal investigator using ORCID database" />
      <OrcidSearchModal open={coInvSearchModalOpen} onClose={() => setCoInvSearchModalOpen(false)}
        onSelect={handleCoInvestigatorSelect} title="Search for Co-Investigator"
        subtitle="Find and add co-investigators using ORCID database" />
    </Box>
  );
}
