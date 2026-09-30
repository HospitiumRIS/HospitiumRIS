'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  LinearProgress,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
  School as TrainingIcon,
} from '@mui/icons-material';
import { DEPARTMENTS } from '@/lib/departments';
import {
  buildLocationPayload,
  buildSchedulePayload,
  formatTargetGroupLabel,
  getTrainingDetailsValidationErrors,
  hydrateTrainingForm,
  normalizeTargetGroups,
  PREDEFINED_TARGET_GROUPS,
} from '@/lib/training-admin';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
} from '../GlobalAdmin/InstitutionModalShell';

const PURPLE = '#8b6cbc';
const STEPS = ['Details', 'Modules', 'Materials'];
const TRAINING_STATUSES = ['DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED'];

const EMPTY_FORM = {
  title: '',
  description: '',
  departments: [],
  targetGroups: [],
  scheduleType: 'single',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  locationType: 'in_person',
  locationAddress: '',
  onlineLink: '',
  maxParticipants: 30,
  status: 'PUBLISHED',
};

const fieldSx = { '& .MuiInputBase-root': { borderRadius: 1.5 } };

function SectionLabel({ children }) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'text.secondary',
        mb: 1,
      }}
    >
      {children}
    </Typography>
  );
}

const targetGroupOptions = PREDEFINED_TARGET_GROUPS.map((value) => ({
  value,
  label: formatTargetGroupLabel(value),
}));

function buildDetailsPayload(form) {
  const schedule = buildSchedulePayload({
    scheduleType: form.scheduleType,
    startDate: form.startDate,
    startTime: form.startTime,
    endDate: form.scheduleType === 'multi' ? form.endDate : form.startDate,
    endTime: form.endTime,
  });
  if (schedule.error) return { error: schedule.error };

  const location = buildLocationPayload({
    locationType: form.locationType,
    locationAddress: form.locationAddress,
    onlineLink: form.onlineLink,
  });
  if (location.error) return { error: location.error };

  return {
    payload: {
      title: form.title.trim(),
      description: form.description.trim(),
      department: form.departments.join(', '),
      targetGroup: form.targetGroups,
      location: location.location,
      startDate: schedule.startDate.toISOString(),
      endDate: schedule.endDate.toISOString(),
      maxParticipants: Number(form.maxParticipants) || 30,
      status: 'DRAFT',
    },
  };
}

export default function TrainingFormDialog({
  open,
  mode = 'create',
  initialTraining = null,
  submitting = false,
  onClose,
  onSaveDetails,
  onFinished,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [trainingId, setTrainingId] = useState(null);
  const [modules, setModules] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [moduleDraft, setModuleDraft] = useState({ title: '', description: '' });
  const [materialDraft, setMaterialDraft] = useState({ name: '', moduleId: '', accessLevel: 'PUBLIC', file: null });
  const [busy, setBusy] = useState(false);
  const [intendedStatus, setIntendedStatus] = useState('PUBLISHED');
  const [departmentInput, setDepartmentInput] = useState('');
  const [targetGroupInput, setTargetGroupInput] = useState('');

  const trainingSeedKey = useMemo(() => {
    if (!initialTraining) return 'create';
    if (initialTraining.id) return initialTraining.id;
    return [
      initialTraining.title,
      initialTraining.department,
      initialTraining.startDate,
      (initialTraining.targetGroups || initialTraining.targetGroup || []).join('|'),
    ].join('::');
  }, [initialTraining]);

  const loadCurriculum = async (id) => {
    try {
      const [modulesRes, materialsRes] = await Promise.all([
        fetch(`/api/training/${id}/modules`, { credentials: 'include' }),
        fetch(`/api/training/${id}/materials`, { credentials: 'include' }),
      ]);
      const modulesData = await modulesRes.json();
      const materialsData = await materialsRes.json();
      if (modulesData.success) setModules(modulesData.modules || []);
      if (materialsData.success) setMaterials(materialsData.materials || []);
    } catch (err) {
      console.error('Failed to load curriculum:', err);
    }
  };

  useEffect(() => {
    if (!open) return;

    setStep(0);
    setError('');
    setBusy(false);
    setDepartmentInput('');
    setTargetGroupInput('');
    setModuleDraft({ title: '', description: '' });
    setMaterialDraft({ name: '', moduleId: '', accessLevel: 'PUBLIC', file: null });

    const hydrated = hydrateTrainingForm(initialTraining);
    if (hydrated) {
      setForm(hydrated);
      setIntendedStatus(hydrated.status || 'PUBLISHED');
      setTrainingId(initialTraining.id || null);
      if (initialTraining.id) loadCurriculum(initialTraining.id);
      else {
        setModules([]);
        setMaterials([]);
      }
    } else {
      setForm(EMPTY_FORM);
      setIntendedStatus('PUBLISHED');
      setTrainingId(null);
      setModules([]);
      setMaterials([]);
    }
  }, [open, trainingSeedKey]);

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    if (error) setError('');
  };

  const detailsValidationErrors = useMemo(
    () => getTrainingDetailsValidationErrors(form),
    [form]
  );
  const detailsValid = detailsValidationErrors.length === 0;

  const commitDepartmentInput = () => {
    const trimmed = departmentInput.trim();
    if (!trimmed) return;
    setForm((prev) => {
      const exists = prev.departments.some(
        (item) => item.toLowerCase() === trimmed.toLowerCase()
      );
      if (exists) return prev;
      return { ...prev, departments: [...prev.departments, trimmed] };
    });
    setDepartmentInput('');
  };

  const commitTargetGroupInput = () => {
    const trimmed = targetGroupInput.trim();
    if (!trimmed) return;
    const normalized = normalizeTargetGroups([trimmed]);
    if (normalized.length === 0) return;
    setForm((prev) => {
      const exists = prev.targetGroups.some((item) => {
        const label = PREDEFINED_TARGET_GROUPS.includes(item)
          ? formatTargetGroupLabel(item)
          : item;
        return (
          item.toLowerCase() === normalized[0].toLowerCase()
          || label.toLowerCase() === trimmed.toLowerCase()
        );
      });
      if (exists) return prev;
      return { ...prev, targetGroups: [...prev.targetGroups, normalized[0]] };
    });
    setTargetGroupInput('');
  };

  const saveDetailsAndContinue = async () => {
    let nextForm = form;
    if (departmentInput.trim() || targetGroupInput.trim()) {
      const departments = [...form.departments];
      const dept = departmentInput.trim();
      if (dept && !departments.some((item) => item.toLowerCase() === dept.toLowerCase())) {
        departments.push(dept);
      }
      const targetGroups = normalizeTargetGroups([
        ...form.targetGroups,
        ...(targetGroupInput.trim() ? [targetGroupInput.trim()] : []),
      ]);
      nextForm = { ...form, departments, targetGroups };
      setForm(nextForm);
      setDepartmentInput('');
      setTargetGroupInput('');
    }

    const validationErrors = getTrainingDetailsValidationErrors(nextForm);
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    const built = buildDetailsPayload(nextForm);
    if (built.error) {
      setError(built.error);
      return;
    }
    setIntendedStatus(form.status || 'PUBLISHED');
    setBusy(true);
    try {
      const result = await onSaveDetails?.(built.payload, { trainingId });
      if (!result?.success || !result.training) {
        throw new Error(result?.error || 'Failed to save training details');
      }
      setTrainingId(result.training.id);
      await loadCurriculum(result.training.id);
      setStep(1);
    } catch (err) {
      setError(err.message || 'Failed to save training details');
    } finally {
      setBusy(false);
    }
  };

  const addModule = async () => {
    if (!trainingId || !moduleDraft.title.trim()) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/training/${trainingId}/modules`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: moduleDraft.title.trim(),
          description: moduleDraft.description.trim(),
          order: modules.length + 1,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to add module');
      setModules((prev) => [...prev, data.module]);
      setModuleDraft({ title: '', description: '' });
    } catch (err) {
      setError(err.message || 'Failed to add module');
    } finally {
      setBusy(false);
    }
  };

  const removeModule = async (moduleId) => {
    if (!trainingId) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/training/${trainingId}/modules/${moduleId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to remove module');
      setModules((prev) => prev.filter((item) => item.id !== moduleId));
      setMaterials((prev) => prev.filter((item) => item.moduleId !== moduleId));
    } catch (err) {
      setError(err.message || 'Failed to remove module');
    } finally {
      setBusy(false);
    }
  };

  const uploadMaterial = async () => {
    if (!trainingId || !materialDraft.file) return;
    setBusy(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', materialDraft.file);
      formData.append('name', materialDraft.name.trim() || materialDraft.file.name);
      formData.append('accessLevel', materialDraft.accessLevel);
      if (materialDraft.moduleId) formData.append('moduleId', materialDraft.moduleId);
      const response = await fetch(`/api/training/${trainingId}/materials`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to upload material');
      setMaterials((prev) => [data.material, ...prev]);
      setMaterialDraft({ name: '', moduleId: '', accessLevel: 'PUBLIC', file: null });
    } catch (err) {
      setError(err.message || 'Failed to upload material');
    } finally {
      setBusy(false);
    }
  };

  const finish = async (publish) => {
    if (!trainingId) return;
    setBusy(true);
    try {
      await onFinished?.({ id: trainingId, status: publish ? 'PUBLISHED' : 'DRAFT' }, { publish });
    } catch (err) {
      setError(err.message || 'Failed to finish training setup');
      setBusy(false);
    }
  };

  const working = submitting || busy;

  return (
    <InstitutionModal open={open} onClose={() => !working && onClose?.()} disableClose={working} maxWidth="md">
      <InstitutionModalHeader
        icon={TrainingIcon}
        title={mode === 'create' ? 'Create training' : 'Edit training'}
        subtitle="Add details, then modules and materials in the same flow."
        onClose={onClose}
        disableClose={working}
        dense
      />
      <InstitutionModalBody dense>
        <Stepper activeStep={step} sx={{ mb: 2, '& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed': { color: PURPLE } }}>
          {STEPS.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
        {working ? <LinearProgress sx={{ mb: 2, '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} /> : null}
        {error ? <Alert severity="error" onClose={() => setError('')} sx={{ mb: 1.5, borderRadius: 1.5 }}>{error}</Alert> : null}

        {step === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <SectionLabel>Basic details</SectionLabel>
            <TextField label="Training title" value={form.title} onChange={(e) => updateForm({ title: e.target.value })} fullWidth required size="small" sx={fieldSx} />
            <TextField label="Description" value={form.description} onChange={(e) => updateForm({ description: e.target.value })} fullWidth multiline minRows={2} size="small" sx={fieldSx} />

            <SectionLabel>Audience</SectionLabel>
            <Autocomplete
              multiple
              freeSolo
              options={DEPARTMENTS}
              value={form.departments}
              inputValue={departmentInput}
              onInputChange={(_, value, reason) => {
                if (reason !== 'reset') setDepartmentInput(value);
              }}
              onChange={(_, value) => {
                updateForm({ departments: value.map((item) => String(item).trim()).filter(Boolean) });
                setDepartmentInput('');
              }}
              onBlur={commitDepartmentInput}
              renderTags={(value, getTagProps) => value.map((option, index) => (
                <Chip {...getTagProps({ index })} key={`${option}-${index}`} label={option} size="small" />
              ))}
              renderInput={(params) => (
                <TextField {...params} label="Departments" required size="small" placeholder="Select or type a department" sx={fieldSx} />
              )}
            />
            <Autocomplete
              multiple
              freeSolo
              options={targetGroupOptions.map((item) => item.label)}
              value={form.targetGroups.map((item) => (PREDEFINED_TARGET_GROUPS.includes(item) ? formatTargetGroupLabel(item) : item))}
              inputValue={targetGroupInput}
              onInputChange={(_, value, reason) => {
                if (reason !== 'reset') setTargetGroupInput(value);
              }}
              onChange={(_, labels) => {
                const values = labels.map((label) => {
                  const match = targetGroupOptions.find((item) => item.label === label);
                  return match ? match.value : String(label).trim();
                }).filter(Boolean);
                updateForm({ targetGroups: normalizeTargetGroups(values) });
                setTargetGroupInput('');
              }}
              onBlur={commitTargetGroupInput}
              renderTags={(value, getTagProps) => value.map((option, index) => (
                <Chip {...getTagProps({ index })} key={`${option}-${index}`} label={option} size="small" />
              ))}
              renderInput={(params) => (
                <TextField {...params} label="Target groups" required size="small" placeholder="Select or type a group, then press Enter" sx={fieldSx} />
              )}
            />

            <SectionLabel>Schedule</SectionLabel>
            <FormControl>
              <FormLabel sx={{ fontSize: '0.8rem', mb: 0.5 }}>Event duration</FormLabel>
              <RadioGroup
                row
                value={form.scheduleType}
                onChange={(e) => {
                  const nextType = e.target.value;
                  updateForm({
                    scheduleType: nextType,
                    ...(nextType === 'single' ? { endDate: '' } : {}),
                  });
                }}
              >
                <FormControlLabel value="single" control={<Radio size="small" />} label="Single day" />
                <FormControlLabel value="multi" control={<Radio size="small" />} label="Multiple days" />
              </RadioGroup>
            </FormControl>
            {form.scheduleType === 'single' ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.25 }}>
                <TextField label="Date" type="date" value={form.startDate} onChange={(e) => updateForm({ startDate: e.target.value })} required fullWidth size="small" InputLabelProps={{ shrink: true }} sx={fieldSx} />
                <TextField label="Start time" type="time" value={form.startTime} onChange={(e) => updateForm({ startTime: e.target.value })} fullWidth size="small" InputLabelProps={{ shrink: true }} sx={fieldSx} />
                <TextField label="End time" type="time" value={form.endTime} onChange={(e) => updateForm({ endTime: e.target.value })} fullWidth size="small" InputLabelProps={{ shrink: true }} sx={fieldSx} />
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
                <TextField label="Start date" type="date" value={form.startDate} onChange={(e) => updateForm({ startDate: e.target.value })} required fullWidth size="small" InputLabelProps={{ shrink: true }} inputProps={{ max: form.endDate || undefined }} sx={fieldSx} />
                <TextField label="Start time" type="time" value={form.startTime} onChange={(e) => updateForm({ startTime: e.target.value })} fullWidth size="small" InputLabelProps={{ shrink: true }} sx={fieldSx} />
                <TextField label="End date" type="date" value={form.endDate} onChange={(e) => updateForm({ endDate: e.target.value })} required fullWidth size="small" InputLabelProps={{ shrink: true }} inputProps={{ min: form.startDate || undefined }} sx={fieldSx} />
                <TextField label="End time" type="time" value={form.endTime} onChange={(e) => updateForm({ endTime: e.target.value })} fullWidth size="small" InputLabelProps={{ shrink: true }} sx={fieldSx} />
              </Box>
            )}

            <SectionLabel>Location</SectionLabel>
            <TextField select label="Location type" value={form.locationType} onChange={(e) => updateForm({ locationType: e.target.value })} size="small" sx={fieldSx}>
              <MenuItem value="in_person">In person</MenuItem>
              <MenuItem value="online">Online</MenuItem>
              <MenuItem value="hybrid">Hybrid</MenuItem>
            </TextField>
            {(form.locationType === 'in_person' || form.locationType === 'hybrid') && (
              <TextField label="Venue / address" value={form.locationAddress} onChange={(e) => updateForm({ locationAddress: e.target.value })} fullWidth required={form.locationType === 'in_person'} size="small" sx={fieldSx} />
            )}
            {(form.locationType === 'online' || form.locationType === 'hybrid') && (
              <TextField label="Online meeting link" value={form.onlineLink} onChange={(e) => updateForm({ onlineLink: e.target.value })} fullWidth required={form.locationType === 'online'} size="small" placeholder="https://..." sx={fieldSx} />
            )}

            <SectionLabel>Capacity</SectionLabel>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
              <TextField label="Max participants" type="number" value={form.maxParticipants} onChange={(e) => updateForm({ maxParticipants: e.target.value ? parseInt(e.target.value, 10) : '' })} fullWidth required size="small" sx={fieldSx} />
              <TextField select label="When finished" value={form.status} onChange={(e) => updateForm({ status: e.target.value })} fullWidth size="small" helperText="Publishing happens after modules and materials" sx={fieldSx}>
                {TRAINING_STATUSES.filter((status) => status === 'DRAFT' || status === 'PUBLISHED').map((status) => (
                  <MenuItem key={status} value={status}>{status === 'PUBLISHED' ? 'Publish at the end' : 'Keep as draft'}</MenuItem>
                ))}
              </TextField>
            </Box>
            {step === 0 && !detailsValid && !working ? (
              <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
                {detailsValidationErrors[0]}
              </Alert>
            ) : null}
          </Box>
        )}

        {step === 1 && (
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              Add the sessions staff will complete. You can attach files in the next step.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start">
              <TextField
                fullWidth
                size="small"
                label="Module title"
                value={moduleDraft.title}
                onChange={(e) => setModuleDraft((prev) => ({ ...prev, title: e.target.value }))}
                sx={fieldSx}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled={working || !moduleDraft.title.trim()}
                onClick={addModule}
                sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap', minWidth: 140 }}
              >
                Add module
              </Button>
            </Stack>
            <TextField
              fullWidth
              size="small"
              multiline
              minRows={2}
              label="Module description (optional)"
              value={moduleDraft.description}
              onChange={(e) => setModuleDraft((prev) => ({ ...prev, description: e.target.value }))}
              sx={fieldSx}
            />
            {modules.length ? (
              <Stack spacing={1}>
                {modules.map((module, index) => (
                  <Box key={module.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Module {index + 1}: {module.title}</Typography>
                        {module.description ? <Typography variant="caption" color="text.secondary">{module.description}</Typography> : null}
                      </Box>
                      <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => removeModule(module.id)} sx={{ textTransform: 'none' }}>
                        Remove
                      </Button>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Alert severity="info" sx={{ borderRadius: 1.5 }}>No modules yet. Add at least one before publishing, or skip and add later.</Alert>
            )}
          </Stack>
        )}

        {step === 2 && (
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              Upload slides, forms, or reading. Attach a file to a module or keep it as general material.
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
              <TextField size="small" label="Material name" value={materialDraft.name} onChange={(e) => setMaterialDraft((prev) => ({ ...prev, name: e.target.value }))} sx={fieldSx} />
              <TextField select size="small" label="Attach to" value={materialDraft.moduleId} onChange={(e) => setMaterialDraft((prev) => ({ ...prev, moduleId: e.target.value }))} sx={fieldSx}>
                <MenuItem value="">General materials</MenuItem>
                {modules.map((module) => (
                  <MenuItem key={module.id} value={module.id}>{module.title}</MenuItem>
                ))}
              </TextField>
              <TextField select size="small" label="Access" value={materialDraft.accessLevel} onChange={(e) => setMaterialDraft((prev) => ({ ...prev, accessLevel: e.target.value }))} sx={fieldSx}>
                <MenuItem value="PUBLIC">Visible before registration</MenuItem>
                <MenuItem value="REGISTERED_ONLY">Registered staff only</MenuItem>
              </TextField>
              <Button component="label" variant="outlined" startIcon={<UploadIcon />} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                {materialDraft.file ? materialDraft.file.name : 'Choose file'}
                <input hidden type="file" onChange={(e) => setMaterialDraft((prev) => ({ ...prev, file: e.target.files?.[0] || null }))} />
              </Button>
            </Box>
            <Button
              variant="contained"
              disabled={working || !materialDraft.file}
              onClick={uploadMaterial}
              sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, alignSelf: 'flex-start' }}
            >
              Upload material
            </Button>
            {materials.length ? (
              <Stack spacing={1}>
                {materials.map((material) => (
                  <Stack key={material.id} direction="row" spacing={1} alignItems="center" sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                    <FileIcon sx={{ color: PURPLE, fontSize: 18 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{material.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {material.module?.title || 'General'} · {material.accessLevel === 'PUBLIC' ? 'Open' : 'Registered only'}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Alert severity="info" sx={{ borderRadius: 1.5 }}>No files uploaded yet. You can finish now and add them later.</Alert>
            )}
          </Stack>
        )}
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={working} color="inherit" size="small">Cancel</Button>
        {step > 0 ? (
          <Button onClick={() => setStep((prev) => prev - 1)} disabled={working} size="small" sx={{ textTransform: 'none' }}>Back</Button>
        ) : null}
        {step === 0 ? (
          <Button variant="contained" size="small" onClick={saveDetailsAndContinue} disabled={working || !detailsValid} startIcon={working ? <CircularProgress size={14} color="inherit" /> : null}>
            {working ? 'Saving...' : 'Save and add modules'}
          </Button>
        ) : null}
        {step === 1 ? (
          <Button variant="contained" size="small" onClick={() => setStep(2)} disabled={working} sx={{ bgcolor: PURPLE }}>
            Continue to materials
          </Button>
        ) : null}
        {step === 2 ? (
          <Stack direction="row" spacing={1}>
            <Button size="small" disabled={working} onClick={() => finish(false)} sx={{ textTransform: 'none' }}>
              Save as draft
            </Button>
            <Button variant="contained" size="small" disabled={working} onClick={() => finish(intendedStatus === 'PUBLISHED')} sx={{ bgcolor: PURPLE }}>
              {intendedStatus === 'PUBLISHED' ? 'Publish training' : 'Finish'}
            </Button>
          </Stack>
        ) : null}
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

export { EMPTY_FORM as TRAINING_EMPTY_FORM };
