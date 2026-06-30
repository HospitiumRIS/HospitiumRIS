'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Divider,
  InputAdornment,
  Autocomplete,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Link as LinkIcon,
  Article as PublicationIcon,
  Storage as DatasetIcon,
  AttachMoney as FundingIcon,
  Science as ScienceIcon,
  Home as HomeIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import PageHeader from '../../../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';

const TRIALS = [
  { id: 1, trialId: 'CT-2024-001', title: 'Phase III Trial of Novel Antimalarial Drug', status: 'COMPLETED' },
  { id: 2, trialId: 'CT-2024-002', title: 'Observational Study on HIV Treatment Adherence', status: 'ONGOING' },
  { id: 3, trialId: 'CT-2024-003', title: 'Randomized Trial of TB Vaccine Efficacy', status: 'COMPLETED' },
];

const OUTPUT_TYPES = [
  { id: 'publication', label: 'Publication', description: 'Link a journal article or preprint via DOI', icon: PublicationIcon, color: '#2196f3' },
  { id: 'dataset', label: 'Dataset', description: 'Link a shared dataset from Dryad, Zenodo, or similar', icon: DatasetIcon, color: '#4caf50' },
  { id: 'funding', label: 'Funding Source', description: 'Link a grant or funding award to this trial', icon: FundingIcon, color: '#ff9800' },
];

const REPOSITORIES = ['Dryad', 'Zenodo', 'Figshare', 'Harvard Dataverse', 'OSF', 'Other'];

const STEPS = ['Select Trial', 'Output Type', 'Link Details', 'Review'];

const initialForm = {
  trialId: '',
  outputType: '',
  // Publication
  pubTitle: '',
  pubDoi: '',
  pubJournal: '',
  pubDate: '',
  pubAuthors: '',
  // Dataset
  datasetName: '',
  datasetDoi: '',
  datasetRepository: '',
  datasetUploadDate: '',
  datasetDescription: '',
  // Funding
  fundingName: '',
  fundingGrantNumber: '',
  fundingAmount: '',
  fundingCurrency: 'USD',
  fundingStartDate: '',
  fundingEndDate: '',
};

export default function LinkTrialOutputPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const selectedTrial = TRIALS.find((tr) => tr.id === parseInt(form.trialId, 10));
  const selectedOutputType = OUTPUT_TYPES.find((o) => o.id === form.outputType);

  const breadcrumbs = [
    { label: 'Dashboard', path: '/researcher', icon: <HomeIcon sx={{ fontSize: 16 }} /> },
    { label: 'Clinical Trials', path: '/researcher/clinical-trials/results' },
    { label: t('researcher.trial_results'), path: '/researcher/clinical-trials/results' },
    { label: 'Link Output' },
  ];

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 0 && !form.trialId) newErrors.trialId = 'Please select a trial';
    if (step === 1 && !form.outputType) newErrors.outputType = 'Please select an output type';
    if (step === 2) {
      if (form.outputType === 'publication') {
        if (!form.pubTitle.trim()) newErrors.pubTitle = 'Title is required';
        if (!form.pubDoi.trim()) newErrors.pubDoi = 'DOI is required';
        if (!form.pubJournal.trim()) newErrors.pubJournal = 'Journal is required';
      } else if (form.outputType === 'dataset') {
        if (!form.datasetName.trim()) newErrors.datasetName = 'Dataset name is required';
        if (!form.datasetDoi.trim()) newErrors.datasetDoi = 'DOI is required';
        if (!form.datasetRepository) newErrors.datasetRepository = 'Repository is required';
      } else if (form.outputType === 'funding') {
        if (!form.fundingName.trim()) newErrors.fundingName = 'Funder name is required';
        if (!form.fundingGrantNumber.trim()) newErrors.fundingGrantNumber = 'Grant number is required';
        if (!form.fundingAmount.trim()) newErrors.fundingAmount = 'Amount is required';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) setActiveStep((s) => s + 1);
  };

  const handleBack = () => setActiveStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      setActiveStep(2);
      return;
    }
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmitting(false);
    setSuccessOpen(true);
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    router.push('/researcher/clinical-trials/results');
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Select the clinical trial you want to link an output to.
            </Typography>
            <FormControl fullWidth error={Boolean(errors.trialId)}>
              <InputLabel>Clinical Trial *</InputLabel>
              <Select
                value={form.trialId}
                label="Clinical Trial *"
                onChange={(e) => updateForm('trialId', e.target.value)}
              >
                {TRIALS.map((trial) => (
                  <MenuItem key={trial.id} value={trial.id}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{trial.trialId}</Typography>
                      <Typography variant="caption" color="text.secondary">{trial.title}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.trialId && <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>{errors.trialId}</Typography>}
            </FormControl>
            {selectedTrial && (
              <Paper variant="outlined" sx={{ mt: 3, p: 2.5, borderRadius: 2, bgcolor: 'rgba(139,108,188,0.04)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ScienceIcon sx={{ color: '#8b6cbc' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{selectedTrial.trialId}</Typography>
                  <Chip label={selectedTrial.status} size="small" color={selectedTrial.status === 'COMPLETED' ? 'success' : 'warning'} />
                </Box>
                <Typography variant="body2">{selectedTrial.title}</Typography>
              </Paper>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              What type of output would you like to link to this trial?
            </Typography>
            <Grid container spacing={2}>
              {OUTPUT_TYPES.map((type) => {
                const Icon = type.icon;
                const selected = form.outputType === type.id;
                return (
                  <Grid key={type.id} size={{ xs: 12, md: 4 }}>
                    <Paper
                      onClick={() => updateForm('outputType', type.id)}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: selected ? '#8b6cbc' : 'rgba(0,0,0,0.12)',
                        bgcolor: selected ? 'rgba(139,108,188,0.06)' : 'white',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: '#8b6cbc', bgcolor: 'rgba(139,108,188,0.04)' },
                        height: '100%',
                      }}
                    >
                      <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${type.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                        <Icon sx={{ color: type.color }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>{type.label}</Typography>
                      <Typography variant="body2" color="text.secondary">{type.description}</Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
            {errors.outputType && <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>{errors.outputType}</Typography>}
          </Box>
        );

      case 2:
        return (
          <Box>
            {form.outputType === 'publication' && (
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Publication Title *" value={form.pubTitle} onChange={(e) => updateForm('pubTitle', e.target.value)} error={Boolean(errors.pubTitle)} helperText={errors.pubTitle} multiline rows={2} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="DOI *" value={form.pubDoi} onChange={(e) => updateForm('pubDoi', e.target.value)} error={Boolean(errors.pubDoi)} helperText={errors.pubDoi || 'e.g. 10.1001/jama.2024.1234'} InputProps={{ startAdornment: <InputAdornment position="start">doi.org/</InputAdornment> }} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Journal *" value={form.pubJournal} onChange={(e) => updateForm('pubJournal', e.target.value)} error={Boolean(errors.pubJournal)} helperText={errors.pubJournal} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Publication Date" type="date" value={form.pubDate} onChange={(e) => updateForm('pubDate', e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Authors" value={form.pubAuthors} onChange={(e) => updateForm('pubAuthors', e.target.value)} placeholder="Comma-separated author list" />
                </Grid>
              </Grid>
            )}

            {form.outputType === 'dataset' && (
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Dataset Name *" value={form.datasetName} onChange={(e) => updateForm('datasetName', e.target.value)} error={Boolean(errors.datasetName)} helperText={errors.datasetName} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Dataset DOI *" value={form.datasetDoi} onChange={(e) => updateForm('datasetDoi', e.target.value)} error={Boolean(errors.datasetDoi)} helperText={errors.datasetDoi || 'e.g. 10.5061/dryad.abc123'} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Autocomplete
                    options={REPOSITORIES}
                    value={form.datasetRepository || null}
                    onChange={(_, val) => updateForm('datasetRepository', val || '')}
                    renderInput={(params) => (
                      <TextField {...params} label="Repository *" error={Boolean(errors.datasetRepository)} helperText={errors.datasetRepository} />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Upload Date" type="date" value={form.datasetUploadDate} onChange={(e) => updateForm('datasetUploadDate', e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Description" value={form.datasetDescription} onChange={(e) => updateForm('datasetDescription', e.target.value)} multiline rows={3} placeholder="Brief description of the dataset contents" />
                </Grid>
              </Grid>
            )}

            {form.outputType === 'funding' && (
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Funder / Organization *" value={form.fundingName} onChange={(e) => updateForm('fundingName', e.target.value)} error={Boolean(errors.fundingName)} helperText={errors.fundingName} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Grant Number *" value={form.fundingGrantNumber} onChange={(e) => updateForm('fundingGrantNumber', e.target.value)} error={Boolean(errors.fundingGrantNumber)} helperText={errors.fundingGrantNumber} placeholder="e.g. R01-AI123456" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth label="Award Amount *" type="number" value={form.fundingAmount} onChange={(e) => updateForm('fundingAmount', e.target.value)} error={Boolean(errors.fundingAmount)} helperText={errors.fundingAmount} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select value={form.fundingCurrency} label="Currency" onChange={(e) => updateForm('fundingCurrency', e.target.value)}>
                      {['USD', 'EUR', 'GBP', 'KES'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} />
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Grant Start Date" type="date" value={form.fundingStartDate} onChange={(e) => updateForm('fundingStartDate', e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Grant End Date" type="date" value={form.fundingEndDate} onChange={(e) => updateForm('fundingEndDate', e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
              </Grid>
            )}
          </Box>
        );

      case 3:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              Review the details below before linking this output to the trial record.
            </Alert>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2 }}>Trial</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedTrial?.trialId} — {selectedTrial?.title}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2 }}>Output Type</Typography>
              <Chip icon={selectedOutputType ? React.createElement(selectedOutputType.icon) : undefined} label={selectedOutputType?.label} sx={{ fontWeight: 600 }} />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2 }}>Details</Typography>
              {form.outputType === 'publication' && (
                <Stack spacing={1}>
                  <Typography variant="body2"><strong>Title:</strong> {form.pubTitle}</Typography>
                  <Typography variant="body2"><strong>DOI:</strong> {form.pubDoi}</Typography>
                  <Typography variant="body2"><strong>Journal:</strong> {form.pubJournal}</Typography>
                  {form.pubAuthors && <Typography variant="body2"><strong>Authors:</strong> {form.pubAuthors}</Typography>}
                </Stack>
              )}
              {form.outputType === 'dataset' && (
                <Stack spacing={1}>
                  <Typography variant="body2"><strong>Name:</strong> {form.datasetName}</Typography>
                  <Typography variant="body2"><strong>DOI:</strong> {form.datasetDoi}</Typography>
                  <Typography variant="body2"><strong>Repository:</strong> {form.datasetRepository}</Typography>
                </Stack>
              )}
              {form.outputType === 'funding' && (
                <Stack spacing={1}>
                  <Typography variant="body2"><strong>Funder:</strong> {form.fundingName}</Typography>
                  <Typography variant="body2"><strong>Grant:</strong> {form.fundingGrantNumber}</Typography>
                  <Typography variant="body2"><strong>Amount:</strong> {form.fundingCurrency} {Number(form.fundingAmount).toLocaleString()}</Typography>
                </Stack>
              )}
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title="Link Trial Output"
        description={t('researcher.trial_results_desc')}
        icon={<LinkIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={breadcrumbs}
        actionButton={
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => router.push('/researcher/clinical-trials/results')}
            sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            Back to Results
          </Button>
        }
      />

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, '& .MuiStepLabel-label.Mui-active': { color: '#8b6cbc', fontWeight: 700 }, '& .MuiStepIcon-root.Mui-active': { color: '#8b6cbc' }, '& .MuiStepIcon-root.Mui-completed': { color: '#8b6cbc' } }}>
            {STEPS.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>

          {renderStepContent()}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ color: '#8b6cbc' }}
            >
              Back
            </Button>
            {activeStep < STEPS.length - 1 ? (
              <Button variant="contained" onClick={handleNext} sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7b5cac' }, px: 4 }}>
                Continue
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<LinkIcon />}
                onClick={handleSubmit}
                disabled={submitting}
                sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7b5cac' }, px: 4 }}
              >
                {submitting ? 'Linking...' : 'Link Output'}
              </Button>
            )}
          </Box>
        </Paper>
      </Container>

      <Dialog open={successOpen} onClose={handleSuccessClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <SuccessIcon sx={{ fontSize: 56, color: '#4caf50', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Output Linked Successfully</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
          <Typography color="text.secondary">
            The {selectedOutputType?.label.toLowerCase()} has been linked to {selectedTrial?.trialId}.
            It will now appear in the trial&apos;s dissemination record.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 1 }}>
          <Button onClick={handleSuccessClose} variant="contained" sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7b5cac' } }}>
            View Results
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
