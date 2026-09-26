'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Paper, Typography, Button, TextField, MenuItem, FormControl, FormLabel,
  RadioGroup, FormControlLabel, Radio, Checkbox, Alert, Chip,
  Divider, CircularProgress, Card, CardContent, Stack, alpha,
} from '@mui/material';
import {
  Shield as EthicsIcon, ArrowBack as BackIcon, Save as SaveIcon, Send as SubmitIcon,
  Add as AddIcon, Person as PersonIcon,
  Groups as GroupsIcon,
  Description as DocIcon, CheckCircle as CheckIcon, Search as SearchIcon,
} from '@mui/icons-material';
import PageHeader from '../../../../../components/common/PageHeader';
import RichTextEditor from '../../../../../components/common/RichTextEditor';
import FileUploadZone from '../../../../../components/common/FileUploadZone';
import OrcidSearchModal from './components/OrcidSearchModal';
import { useAuth } from '../../../../../components/AuthProvider';
import { useTranslation } from 'react-i18next';

const steps = [
  { label: 'Overview', title: 'Project overview', hint: 'Title, lay summary, aims, and significance' },
  { label: 'Team', title: 'Research team', hint: 'Principal investigator and co-investigators' },
  { label: 'Design', title: 'Research design', hint: 'Type, procedures, analysis, and timeline' },
  { label: 'Participants', title: 'Participants', hint: 'Population, criteria, recruitment, and vulnerable groups' },
  { label: 'Ethics', title: 'Consent and data', hint: 'Informed consent and how data will be protected' },
  { label: 'Risks', title: 'Risks and benefits', hint: 'Identify risks, mitigation, and expected benefit' },
  { label: 'Files', title: 'Documentation', hint: 'Upload required supporting documents' },
  { label: 'Review', title: 'Review and submit', hint: 'Check the summary, then save or submit' },
];

const PURPLE = '#8b6cbc';
const fieldFocusSx = {
  '& .MuiOutlinedInput-root:hover fieldset': { borderColor: PURPLE },
  '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: PURPLE },
  '& .MuiInputLabel-root.Mui-focused': { color: PURPLE },
};
const sectionCardSx = {
  p: 2.5,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  background: 'white',
  boxShadow: 'none',
};

function StepIntro({ index, title, hint }) {
  return (
    <Box sx={{ mb: 2.5, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: alpha(PURPLE, 0.12),
            color: PURPLE,
            fontWeight: 800,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mt: 0.15,
          }}
        >
          {index}
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.25 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {hint}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

const researchTypes = [
  'Clinical Trial', 'Observational Study', 'Survey Research', 'Interview Study',
  'Laboratory Research', 'Secondary Data Analysis', 'Community-Based Research', 'Other'
];

const vulnerablePopulations = [
  'Children (under 18)', 'Pregnant Women', 'Prisoners', 'Mentally Disabled Persons',
  'Economically Disadvantaged', 'Educationally Disadvantaged', 'None'
];

export default function CreateEthicsApplicationPage() {
  const { t } = useTranslation();
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

  // Convert File objects to metadata for JSON serialization
  const convertFilesToMetadata = (files) => {
    return files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      uploadedAt: new Date().toISOString(),
      // In production, upload to storage and store URL
      url: null,
      path: null
    }));
  };

  const prepareFormDataForSubmission = () => {
    return {
      ...formData,
      participantInfoSheet: convertFilesToMetadata(formData.participantInfoSheet),
      consentForm: convertFilesToMetadata(formData.consentForm),
      researchProtocol: convertFilesToMetadata(formData.researchProtocol),
      recruitmentMaterials: convertFilesToMetadata(formData.recruitmentMaterials),
      dataCollectionTools: convertFilesToMetadata(formData.dataCollectionTools),
      lettersOfSupport: convertFilesToMetadata(formData.lettersOfSupport),
      investigatorCVs: convertFilesToMetadata(formData.investigatorCVs),
      userId: user?.id
    };
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      setError('');
      const submissionData = prepareFormDataForSubmission();
      const response = await fetch('/api/ethics/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...submissionData, status: 'DRAFT' }),
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
      const submissionData = prepareFormDataForSubmission();
      const response = await fetch('/api/ethics/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...submissionData, status: 'DRAFT' }),
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
            <StepIntro index={1} title="Project overview" hint="Write a plain-language summary. Avoid jargon." />
            <TextField label="Study Title" fullWidth required value={formData.title} onChange={handleChange('title')}
              placeholder="Enter the full title of your research study" sx={{ mb: 3, ...fieldFocusSx }} InputLabelProps={{ sx: { fontWeight: 600 } }} />
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
            <StepIntro index={2} title="Research team" hint="CVs are uploaded in the Documentation step." />
            <Card sx={{ mb: 2, ...sectionCardSx }}>
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
            <Card sx={sectionCardSx}>
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
            <StepIntro index={3} title="Research design" hint="Show how the study can answer the research question." />
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
            <StepIntro index={4} title="Participants" hint="Define who can take part and justify any vulnerable groups." />
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
            <Card sx={{ ...sectionCardSx, mb: 3 }}>
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
            <StepIntro index={5} title="Consent and data" hint="Show how consent is obtained and how data is protected." />
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
            <StepIntro index={6} title="Risks and benefits" hint="Identify risks, how you will reduce them, and why the study should proceed." />
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
            <Card sx={sectionCardSx}>
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
            <StepIntro index={7} title="Documentation" hint="Upload the required files. Keep title, sample size, and procedures consistent across documents." />
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
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Consistency check: title, participant numbers, and procedures should match across all documents.
            </Typography>
          </Box>
        );

      case 7:
        return (
          <Box>
            <StepIntro index={8} title="Review and submit" hint="Check this summary, save a draft, or submit for review." />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
                <Card sx={{ height: '100%', ...sectionCardSx }}>
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
                <Card sx={{ height: '100%', ...sectionCardSx }}>
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
                <Card sx={{ height: '100%', ...sectionCardSx }}>
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
                <Card sx={{ height: '100%', ...sectionCardSx }}>
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
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              Before submitting, use clear everyday language on participant-facing documents and check they match each other.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <PageHeader
        title="Create Ethics Application"
        description="Complete each section, save a draft at any time, then submit for review."
        icon={<EthicsIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: t('researcher.portal_title', 'Researcher Portal'), path: '/researcher' },
          { label: t('researcher.ethics_applications', 'My Applications'), path: '/researcher/ethics/applications' },
        ]}
        actionButton={
          <Button
            variant="contained"
            startIcon={<BackIcon />}
            onClick={() => router.push('/researcher/ethics/applications')}
            sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}
          >
            Back to list
          </Button>
        }
      />
      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        ) : null}

        <Paper
          elevation={0}
          sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }} flexWrap="wrap" gap={1}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Step {activeStep + 1} of {steps.length}: {steps[activeStep].title}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: PURPLE }}>
              {Math.round(((activeStep + 1) / steps.length) * 100)}% complete
            </Typography>
          </Stack>
          <Box sx={{ height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), mb: 1.75, overflow: 'hidden' }}>
            <Box
              sx={{
                height: '100%',
                width: `${((activeStep + 1) / steps.length) * 100}%`,
                bgcolor: PURPLE,
                transition: 'width 0.25s ease',
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {steps.map((item, index) => {
              const isCompleted = index < activeStep;
              const isActive = index === activeStep;
              return (
                <Box
                  key={item.label}
                  component="button"
                  type="button"
                  onClick={() => setActiveStep(index)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.25,
                    py: 0.7,
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: isActive ? PURPLE : isCompleted ? alpha(PURPLE, 0.35) : 'divider',
                    bgcolor: isActive ? PURPLE : isCompleted ? alpha(PURPLE, 0.08) : 'white',
                    color: isActive ? 'white' : '#334155',
                  }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                      bgcolor: isActive ? 'rgba(255,255,255,0.2)' : isCompleted ? PURPLE : alpha(PURPLE, 0.12),
                      color: isActive || isCompleted ? 'white' : PURPLE,
                    }}
                  >
                    {isCompleted ? <CheckIcon sx={{ fontSize: 13 }} /> : index + 1}
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {item.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: '1px solid', borderColor: 'divider', minHeight: 480 }}
        >
          {renderStepContent(activeStep)}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            startIcon={<BackIcon />}
            sx={{ color: PURPLE, textTransform: 'none', fontWeight: 600 }}
          >
            Previous
          </Button>
          <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSaveDraft}
              disabled={loading}
              sx={{
                borderColor: PURPLE,
                color: PURPLE,
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) },
              }}
            >
              {loading ? 'Saving...' : 'Save draft'}
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SubmitIcon />}
                onClick={handleSubmit}
                disabled={loading}
                sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#7a5aad' } }}
              >
                {loading ? 'Submitting...' : 'Submit for review'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#7a5aad' } }}
              >
                Next
              </Button>
            )}
          </Stack>
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
