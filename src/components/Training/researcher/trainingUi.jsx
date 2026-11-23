'use client';

/**
 * Shared pieces of the researcher training screens (#107): status chips, formatting,
 * enrolment button rules and session windows. Moved out of the training page so the
 * list, the overview and the full training page agree.
 */
import React from 'react';
import { Box, Chip, Paper, Stack, Typography, alpha } from '@mui/material';

export const ATTENDANCE_CHIP_SX = {
  PRESENT: { bgcolor: '#dcfce7', color: '#166534' },
  LATE: { bgcolor: '#fef3c7', color: '#92400e' },
  ABSENT: { bgcolor: '#fee2e2', color: '#b91c1c' },
  EXCUSED: { bgcolor: '#e0f2fe', color: '#075985' },
};

export const PURPLE = '#8b6cbc';

export const STATUS_TONE = {
  REGISTERED: { bg: alpha(PURPLE, 0.12), color: PURPLE, label: 'Registered' },
  COMPLETED: { bg: '#dcfce7', color: '#166534', label: 'Completed' },
  NOT_COMPLETED: { bg: '#fef3c7', color: '#92400e', label: 'Not completed' },
  CANCELLED: { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled' },
  PENDING_APPROVAL: { bg: '#fef3c7', color: '#92400e', label: 'Awaiting approval' },
  WAITLISTED: { bg: '#e0f2fe', color: '#075985', label: 'Waiting list' },
  REJECTED: { bg: '#fee2e2', color: '#b91c1c', label: 'Not approved' },
};

export const formatDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

// What the main button does for someone not yet holding a place (#102).
export function enrolmentAction(training) {
  const status = training.userRegistration?.status;
  if (status === 'PENDING_APPROVAL' || status === 'WAITLISTED' || status === 'REJECTED') return { show: false };
  const now = Date.now();
  if (training.eligibility && !training.eligibility.ok) return { show: true, disabled: true, label: 'Not eligible' };
  if (training.registrationOpensAt && new Date(training.registrationOpensAt).getTime() > now) {
    return { show: true, disabled: true, label: 'Registration not open yet' };
  }
  const closes = [training.registrationClosesAt, training.startDate].filter(Boolean).map((d) => new Date(d).getTime());
  if (closes.length && Math.min(...closes) <= now) return { show: true, disabled: true, label: 'Registration closed' };
  if ((training.remainingSlots ?? 0) <= 0) {
    return training.waitlistEnabled
      ? { show: true, label: 'Join waiting list' }
      : { show: true, disabled: true, label: 'Training is full' };
  }
  return { show: true, label: training.requiresApproval ? 'Request a place' : 'Register' };
}

// Assigned trainings and certificate expiry (#103).
export const DUE_CHIP = {
  OVERDUE: { label: 'Overdue', sx: { bgcolor: '#fee2e2', color: '#b91c1c' } },
  DUE_SOON: { label: 'Due soon', sx: { bgcolor: '#fef3c7', color: '#92400e' } },
  RETRAINING_DUE: { label: 'Certificate expired: re-training due', sx: { bgcolor: '#fee2e2', color: '#b91c1c' } },
  EXPIRING: { label: 'Certificate expiring soon', sx: { bgcolor: '#fef3c7', color: '#92400e' } },
};

export const CANCEL_LABELS = {
  REGISTERED: 'Cancel registration',
  PENDING_APPROVAL: 'Withdraw request',
  WAITLISTED: 'Leave waiting list',
};

export const formatDate = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatRange = (start, end) => `${formatDate(start)} - ${formatDate(end)}`;

export const daysUntil = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
};

export const asList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
};

export const locationDisplay = (location) => {
  if (!location) return { label: 'Location to be announced', href: null };
  const trimmed = String(location).trim();
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (url.hostname.includes('.')) {
      return { label: url.hostname.replace(/^www\./, ''), href: url.href };
    }
  } catch {
    // not a URL
  }
  return { label: trimmed, href: trimmed.startsWith('http') ? trimmed : null };
};

export function StatusChip({ status }) {
  const tone = STATUS_TONE[status] || { bg: '#f1f5f9', color: '#475569', label: String(status || '').replaceAll('_', ' ') };
  return <Chip size="small" label={tone.label} sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700, height: 24 }} />;
}

export function StatCard({ label, value, caption }) {
  return (
    <Paper sx={{ flex: 1, minWidth: 160, p: 2, borderRadius: 2, bgcolor: PURPLE, color: 'white' }}>
      <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700 }}>{label}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{value}</Typography>
      {caption ? <Typography variant="caption" sx={{ opacity: 0.75 }}>{caption}</Typography> : null}
    </Paper>
  );
}

export function MetaRow({ icon, children }) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start">
      <Box sx={{ color: PURPLE, mt: '1px' }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary">{children}</Typography>
    </Stack>
  );
}

export function DeadlineLabel({ startDate, endDate }) {
  const untilEnd = daysUntil(endDate);
  const untilStart = daysUntil(startDate);
  if (untilEnd == null) return null;
  if (untilEnd < 0) return <Chip size="small" label="Ended" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 700 }} />;
  if (untilStart > 0) return <Chip size="small" label={`Starts in ${untilStart} day${untilStart === 1 ? '' : 's'}`} sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }} />;
  return <Chip size="small" label={`${untilEnd} day${untilEnd === 1 ? '' : 's'} left`} sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />;
}

export const checkInOpenNow = (session) => {
  const start = new Date(session.startsAt).getTime();
  const now = Date.now();
  return now >= start - (session.checkInOpensMinutesBefore ?? 15) * 60000
    && now <= start + (session.checkInClosesMinutesAfter ?? 30) * 60000;
};

// Same window as the server's join link (lib/training-virtual-attendance.js).
export const joinOpenNow = (session) => {
  if (session.status !== 'SCHEDULED') return false;
  const now = Date.now();
  return now >= new Date(session.startsAt).getTime() - (session.checkInOpensMinutesBefore ?? 15) * 60000
    && now <= new Date(session.endsAt).getTime();
};

export const formatSessionTime = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '';
  const day = s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time(s)} – ${time(e)}`;
};

/** A location that may be a link. */
export function LocationText({ location }) {
  const meta = locationDisplay(location);
  if (meta.href) {
    return (
      <Box component="a" href={meta.href} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} sx={{ color: PURPLE, fontWeight: 600, textDecoration: 'none' }}>
        {meta.label}
      </Box>
    );
  }
  return meta.label;
}
