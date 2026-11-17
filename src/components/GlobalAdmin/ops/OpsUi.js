'use client';

/**
 * Small shared building blocks for the Operations, Institution activity and
 * Audit log pages (Global Admin).
 */
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Paper, Typography, Chip, Tooltip, Button, Alert } from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  WarningAmber as WarningIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { useAuth } from '../../AuthProvider';

export function useGlobalAdminGuard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const allowed = user?.accountType === 'GLOBAL_ADMIN';
  useEffect(() => {
    if (!isLoading && !allowed) router.push('/dashboard');
  }, [isLoading, allowed, router]);
  return { ready: !isLoading && allowed, user };
}

export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = n / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[i]}`;
}

export function formatNumber(n) {
  return new Intl.NumberFormat().format(Number(n) || 0);
}

export function formatDate(value, { time = false } = {}) {
  if (!value) return 'Never';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(time ? { hour: '2-digit', minute: '2-digit', second: '2-digit' } : {}),
  });
}

export function timeAgo(value) {
  if (!value) return 'Never';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export function describeDevice(userAgent) {
  if (!userAgent) return '';
  const ua = userAgent;
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'Browser';
  const osName = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad/.test(ua)
        ? 'iOS'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : '';
  return osName ? `${browser} on ${osName}` : browser;
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
      <Box>
        {back}
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>{actions}</Box>}
    </Box>
  );
}

export function SectionCard({ title, subtitle, action, children, sx }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, mb: 3, ...sx }}>
      {(title || action) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Box>
            {title && (
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Box>
      )}
      {children}
    </Paper>
  );
}

export function StatTile({ label, value, hint, tone }) {
  const color = tone === 'error' ? 'error.main' : tone === 'warning' ? 'warning.main' : 'text.primary';
  return (
    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3, minWidth: 0, height: '100%' }}>
      <Typography variant="body2" color="text.secondary" noWrap title={label}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Paper>
  );
}

export function StatGrid({ children }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        mb: 3,
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(6, minmax(0, 1fr))' },
      }}
    >
      {children}
    </Box>
  );
}

const SEVERITY = {
  error: { icon: <ErrorIcon fontSize="small" />, label: 'Critical', color: 'error' },
  warning: { icon: <WarningIcon fontSize="small" />, label: 'Warning', color: 'warning' },
  info: { icon: <InfoIcon fontSize="small" />, label: 'Info', color: 'info' },
};

export function AttentionList({ items, onOpen }) {
  if (!items?.length) {
    return <Alert severity="success">Nothing needs attention right now.</Alert>;
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {items.map((item, idx) => {
        const s = SEVERITY[item.severity] || SEVERITY.info;
        return (
          <Alert
            key={`${item.code}-${idx}`}
            severity={s.color}
            icon={s.icon}
            action={
              item.tab && onOpen ? (
                <Button color="inherit" size="small" onClick={() => onOpen(item.tab)}>
                  Open
                </Button>
              ) : null
            }
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={s.label} size="small" variant="outlined" color={s.color} />
              <span>{item.message}</span>
            </Box>
          </Alert>
        );
      })}
    </Box>
  );
}

const OUTCOME_COLORS = { SUCCESS: 'success', FAILURE: 'error' };

export function OutcomeChip({ outcome }) {
  return <Chip size="small" label={outcome === 'FAILURE' ? 'Failed' : 'OK'} color={OUTCOME_COLORS[outcome] || 'default'} variant="outlined" />;
}

const ACTION_LABELS = {
  LOGIN_SUCCESS: 'Signed in',
  LOGIN_FAILED: 'Failed sign-in',
  LOGOUT: 'Signed out',
  REGISTERED: 'Registered',
  REGISTRATION_FAILED: 'Registration failed',
  ACCOUNT_ACTIVATED: 'Activated',
  ACTIVATION_RESENT: 'Activation resent',
  JOB_RUN: 'Job run',
  AUDIT_EXPORTED: 'Audit exported',
};

export function actionLabel(action) {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  return String(action || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function ActionChip({ action, category }) {
  const color =
    action === 'LOGIN_FAILED' || action === 'REGISTRATION_FAILED'
      ? 'error'
      : category === 'AUTH'
        ? 'info'
        : category === 'SYSTEM'
          ? 'default'
          : 'secondary';
  return (
    <Tooltip title={action}>
      <Chip size="small" label={actionLabel(action)} color={color} variant="outlined" sx={{ fontWeight: 600 }} />
    </Tooltip>
  );
}

export function EmptyState({ children }) {
  return (
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        {children}
      </Typography>
    </Box>
  );
}
