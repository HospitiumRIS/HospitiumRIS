export const TRAINING_ADMIN_TYPES = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN'];

export const PREDEFINED_TARGET_GROUPS = [
  'NURSES',
  'DOCTORS',
  'RESEARCHERS',
  'LAB_TECHNICIANS',
  'ADMINISTRATORS',
  'ALL_STAFF',
];

export function formatTargetGroupLabel(value) {
  if (!value) return '';
  if (PREDEFINED_TARGET_GROUPS.includes(value)) {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return value;
}

export function normalizeTargetGroups(groups) {
  const predefined = new Set(PREDEFINED_TARGET_GROUPS);
  return (Array.isArray(groups) ? groups : [groups])
    .map((group) => {
      const trimmed = String(group || '').trim();
      if (!trimmed) return null;
      const enumKey = trimmed.toUpperCase().replace(/\s+/g, '_');
      return predefined.has(enumKey) ? enumKey : trimmed;
    })
    .filter(Boolean);
}

export function combineDateAndTime(date, time, fallbackTime = '09:00') {
  if (!date) return null;
  const safeTime = time || fallbackTime;
  const parsed = new Date(`${date}T${safeTime}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function splitDateTime(value) {
  if (!value) {
    return { date: '', time: '' };
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { date: '', time: '' };
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const date = `${year}-${month}-${day}`;
  const time = parsed.toTimeString().slice(0, 5);
  return { date, time };
}

export function hydrateTrainingForm(initialTraining) {
  if (!initialTraining) return null;

  const start = splitDateTime(initialTraining.startDate);
  const end = splitDateTime(initialTraining.endDate);
  const locationFields = parseLocationFields(initialTraining.location);
  const hasEndDate = Boolean(end.date);
  const sameDay = hasEndDate && start.date === end.date;
  const scheduleType = hasEndDate && !sameDay ? 'multi' : 'single';
  const departmentSource = initialTraining.department
    ?? (Array.isArray(initialTraining.departments) ? initialTraining.departments.join(', ') : '');

  return {
    title: initialTraining.title || '',
    description: initialTraining.description || '',
    departments: String(departmentSource)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    targetGroups: normalizeTargetGroups(
      initialTraining.targetGroups ?? initialTraining.targetGroup ?? []
    ),
    scheduleType,
    startDate: start.date,
    startTime: start.time,
    endDate: scheduleType === 'multi' ? end.date : '',
    endTime: end.time,
    locationType: locationFields.locationType,
    locationAddress: locationFields.locationAddress,
    onlineLink: locationFields.onlineLink,
    maxParticipants: Number(initialTraining.maxParticipants) > 0
      ? Number(initialTraining.maxParticipants)
      : 30,
    status: initialTraining.status || 'PUBLISHED',
  };
}

export function getTrainingDetailsValidationErrors(form) {
  const errors = [];
  if (!form.title.trim()) errors.push('Training title is required');
  if (form.departments.length === 0) errors.push('Add at least one department');
  if (form.targetGroups.length === 0) errors.push('Add at least one target group (press Enter after typing)');
  if (!form.startDate) errors.push('Start date is required');
  if (form.scheduleType === 'multi' && !form.endDate) errors.push('End date is required for multi-day events');
  if (form.locationType === 'in_person' && !form.locationAddress.trim()) {
    errors.push('Venue / address is required for in-person training');
  }
  if (form.locationType === 'online' && !form.onlineLink.trim()) {
    errors.push('Online meeting link is required');
  }
  if (form.locationType === 'hybrid' && !form.locationAddress.trim() && !form.onlineLink.trim()) {
    errors.push('Provide a venue address and/or online link for hybrid training');
  }
  if (!Number(form.maxParticipants) || Number(form.maxParticipants) < 1) {
    errors.push('Max participants must be at least 1');
  }
  return errors;
}

export function buildSchedulePayload({ scheduleType, startDate, startTime, endDate, endTime }) {
  const start = combineDateAndTime(startDate, startTime);
  if (!start) {
    return { error: 'Start date is required' };
  }

  if (scheduleType === 'single') {
    const end = combineDateAndTime(startDate, endTime || startTime || '17:00', '17:00');
    if (end && end < start) {
      return { error: 'End time must be after start time' };
    }
    return { startDate: start, endDate: end || start };
  }

  const end = combineDateAndTime(endDate, endTime || '17:00', '17:00');
  if (!end) {
    return { error: 'End date is required for multi-day events' };
  }
  if (end < start) {
    return { error: 'End date/time must be after start date/time' };
  }
  return { startDate: start, endDate: end };
}

export function buildLocationPayload({ locationType, locationAddress, onlineLink }) {
  const address = locationAddress?.trim() || '';
  const link = onlineLink?.trim() || '';

  if (locationType === 'online') {
    if (!link) return { error: 'Online meeting link is required' };
    return { location: link };
  }

  if (locationType === 'hybrid') {
    if (!address && !link) return { error: 'Provide a venue address and/or online link' };
    if (address && link) return { location: `${address} | ${link}` };
    return { location: address || link };
  }

  if (!address) return { error: 'Location is required for in-person training' };
  return { location: address };
}

export function parseLocationFields(location) {
  const value = location || '';
  const isUrl = /^https?:\/\//i.test(value);
  if (isUrl) {
    return { locationType: 'online', locationAddress: '', onlineLink: value };
  }
  if (value.includes(' | ')) {
    const [locationAddress, onlineLink] = value.split(' | ');
    return { locationType: 'hybrid', locationAddress, onlineLink };
  }
  return { locationType: 'in_person', locationAddress: value, onlineLink: '' };
}

export function trainingBelongsToInstitution(training, institutionId) {
  return Boolean(training && institutionId && training.institutionId === institutionId);
}
