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
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import { School as TrainingIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { DEPARTMENTS } from '@/lib/departments';
import {
  buildLocationPayload,
  buildSchedulePayload,
  formatTargetGroupLabel,
  parseLocationFields,
  PREDEFINED_TARGET_GROUPS,
  splitDateTime,
} from '@/lib/training-admin';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
} from '../GlobalAdmin/InstitutionModalShell';

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

export default function TrainingFormDialog({
  open,
  mode = 'create',
  initialTraining = null,
  submitting = false,
  autoSaving = false,
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    if (initialTraining) {
      const start = splitDateTime(initialTraining.startDate);
      const end = splitDateTime(initialTraining.endDate);
      const locationFields = parseLocationFields(initialTraining.location);
      const sameDay = start.date && end.date && start.date === end.date;

      setForm({
        title: initialTraining.title || '',
        description: initialTraining.description || '',
        departments: String(initialTraining.department || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        targetGroups: Array.isArray(initialTraining.targetGroup)
          ? initialTraining.targetGroup
          : [initialTraining.targetGroup].filter(Boolean),
        scheduleType: sameDay ? 'single' : 'multi',
        startDate: start.date,
        startTime: start.time,
        endDate: sameDay ? '' : end.date,
        endTime: end.time,
        locationType: locationFields.locationType,
        locationAddress: locationFields.locationAddress,
        onlineLink: locationFields.onlineLink,
        maxParticipants: initialTraining.maxParticipants || 30,
        status: initialTraining.status || 'PUBLISHED',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [open, initialTraining]);

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    if (error) setError('');
  };

  const isValid = useMemo(() => {
    if (!form.title.trim() || form.departments.length === 0 || form.targetGroups.length === 0) {
      return false;
    }
    if (!form.startDate) return false;
    if (form.scheduleType === 'multi' && !form.endDate) return false;
    if (form.locationType === 'in_person' && !form.locationAddress.trim()) return false;
    if (form.locationType === 'online' && !form.onlineLink.trim()) return false;
    if (form.locationType === 'hybrid' && !form.locationAddress.trim() && !form.onlineLink.trim()) {
      return false;
    }
    return true;
  }, [form]);

  const handleSubmit = () => {
    const schedule = buildSchedulePayload({
      scheduleType: form.scheduleType,
      startDate: form.startDate,
      startTime: form.startTime,
      endDate: form.scheduleType === 'multi' ? form.endDate : form.startDate,
      endTime: form.endTime,
    });
    if (schedule.error) {
      setError(schedule.error);
      return;
    }

    const location = buildLocationPayload({
      locationType: form.locationType,
      locationAddress: form.locationAddress,
      onlineLink: form.onlineLink,
    });
    if (location.error) {
      setError(location.error);
      return;
    }

    onSubmit?.({
      title: form.title.trim(),
      description: form.description.trim(),
      department: form.departments.join(', '),
      targetGroup: form.targetGroups,
      location: location.location,
      startDate: schedule.startDate.toISOString(),
      endDate: schedule.endDate.toISOString(),
      maxParticipants: Number(form.maxParticipants) || 30,
      status: form.status,
    });
  };

  return (
    <InstitutionModal
      open={open}
      onClose={() => !submitting && onClose?.()}
      disableClose={submitting}
      maxWidth="md"
    >
      <InstitutionModalHeader
        icon={TrainingIcon}
        title={mode === 'create' ? 'Create New Training' : 'Edit Training'}
        subtitle="Set schedule, audience, and location details for this training event."
        onClose={onClose}
        disableClose={submitting}
        dense
      />
      <InstitutionModalBody dense>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mt: -0.5 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 1.5 }}>
              {error}
            </Alert>
          )}
          {autoSaving && (
            <Chip label="Auto-saving draft..." size="small" color="info" sx={{ alignSelf: 'flex-start' }} />
          )}

          <SectionLabel>Basic details</SectionLabel>
          <TextField
            label="Training title"
            value={form.title}
            onChange={(e) => updateForm({ title: e.target.value })}
            fullWidth
            required
            size="small"
            sx={fieldSx}
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => updateForm({ description: e.target.value })}
            fullWidth
            multiline
            minRows={2}
            size="small"
            sx={fieldSx}
          />

          <SectionLabel>Audience</SectionLabel>
          <Autocomplete
            multiple
            freeSolo
            options={DEPARTMENTS}
            value={form.departments}
            onChange={(_, value) => updateForm({ departments: value.map((item) => String(item).trim()).filter(Boolean) })}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip {...getTagProps({ index })} key={`${option}-${index}`} label={option} size="small" />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Departments"
                required
                size="small"
                placeholder="Select or type a department"
                helperText="Select from the list or type a custom department"
                sx={fieldSx}
              />
            )}
          />
          <Autocomplete
            multiple
            freeSolo
            options={targetGroupOptions.map((item) => item.label)}
            value={form.targetGroups.map((item) =>
              PREDEFINED_TARGET_GROUPS.includes(item) ? formatTargetGroupLabel(item) : item
            )}
            onChange={(_, labels) => {
              const values = labels.map((label) => {
                const match = targetGroupOptions.find((item) => item.label === label);
                return match ? match.value : String(label).trim();
              }).filter(Boolean);
              updateForm({ targetGroups: values });
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip {...getTagProps({ index })} key={`${option}-${index}`} label={option} size="small" />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Target groups"
                required
                size="small"
                placeholder="Select or type a group"
                helperText="Select predefined groups or add custom ones"
                sx={fieldSx}
              />
            )}
          />

          <SectionLabel>Schedule</SectionLabel>
          <FormControl>
            <FormLabel sx={{ fontSize: '0.8rem', mb: 0.5 }}>Event duration</FormLabel>
            <RadioGroup
              row
              value={form.scheduleType}
              onChange={(e) => updateForm({ scheduleType: e.target.value, endDate: '' })}
            >
              <FormControlLabel value="single" control={<Radio size="small" />} label="Single day" />
              <FormControlLabel value="multi" control={<Radio size="small" />} label="Multiple days" />
            </RadioGroup>
          </FormControl>

          {form.scheduleType === 'single' ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.25 }}>
              <TextField
                label="Date"
                type="date"
                value={form.startDate}
                onChange={(e) => updateForm({ startDate: e.target.value })}
                required
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
              <TextField
                label="Start time"
                type="time"
                value={form.startTime}
                onChange={(e) => updateForm({ startTime: e.target.value })}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
              <TextField
                label="End time"
                type="time"
                value={form.endTime}
                onChange={(e) => updateForm({ endTime: e.target.value })}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                helperText="Optional"
                sx={fieldSx}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
              <TextField
                label="Start date"
                type="date"
                value={form.startDate}
                onChange={(e) => updateForm({ startDate: e.target.value })}
                required
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
              <TextField
                label="Start time"
                type="time"
                value={form.startTime}
                onChange={(e) => updateForm({ startTime: e.target.value })}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
              <TextField
                label="End date"
                type="date"
                value={form.endDate}
                onChange={(e) => updateForm({ endDate: e.target.value })}
                required
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
              <TextField
                label="End time"
                type="time"
                value={form.endTime}
                onChange={(e) => updateForm({ endTime: e.target.value })}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
            </Box>
          )}

          <SectionLabel>Location</SectionLabel>
          <FormControl fullWidth size="small" sx={fieldSx}>
            <TextField
              select
              label="Location type"
              value={form.locationType}
              onChange={(e) => updateForm({ locationType: e.target.value })}
              size="small"
              sx={fieldSx}
            >
              <MenuItem value="in_person">In person</MenuItem>
              <MenuItem value="online">Online</MenuItem>
              <MenuItem value="hybrid">Hybrid</MenuItem>
            </TextField>
          </FormControl>

          {(form.locationType === 'in_person' || form.locationType === 'hybrid') && (
            <TextField
              label="Venue / address"
              value={form.locationAddress}
              onChange={(e) => updateForm({ locationAddress: e.target.value })}
              fullWidth
              required={form.locationType === 'in_person'}
              size="small"
              sx={fieldSx}
            />
          )}

          {(form.locationType === 'online' || form.locationType === 'hybrid') && (
            <TextField
              label="Online meeting link"
              value={form.onlineLink}
              onChange={(e) => updateForm({ onlineLink: e.target.value })}
              fullWidth
              required={form.locationType === 'online'}
              size="small"
              placeholder="https://..."
              sx={fieldSx}
            />
          )}

          <SectionLabel>Capacity & status</SectionLabel>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
            <TextField
              label="Max participants"
              type="number"
              value={form.maxParticipants}
              onChange={(e) => updateForm({ maxParticipants: e.target.value ? parseInt(e.target.value, 10) : '' })}
              fullWidth
              required
              size="small"
              sx={fieldSx}
            />
            <TextField
              select
              label="Status"
              value={form.status}
              onChange={(e) => updateForm({ status: e.target.value })}
              fullWidth
              required
              size="small"
              sx={fieldSx}
            >
              {TRAINING_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={submitting} color="inherit" size="small">
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit}
          disabled={submitting || !isValid}
          startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {submitting ? 'Saving...' : mode === 'create' ? 'Create training' : 'Update training'}
        </Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

export { EMPTY_FORM as TRAINING_EMPTY_FORM };
