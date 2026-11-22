'use client';

/**
 * Small shared building blocks for the Operations, Institution activity and
 * Audit log pages (Global Admin).
 */
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Paper, Typography, Chip, Tooltip, Button, Skeleton } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ErrorOutline as ErrorIcon,
  WarningAmber as WarningIcon,
  InfoOutlined as InfoIcon,
  CheckCircleOutline as OkIcon,
  ChevronRight as ChevronRightIcon,
  InboxOutlined as InboxIcon,
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

export function PageHeader({ title, subtitle, actions, back, meta }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        mb: 3,
      }}
    >
      <Box sx={{ minWidth: 0, flex: '1 1 420px' }}>
        {back}
        <Typography
          component="h1"
          sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {(actions || meta) && (
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, flexShrink: 0 }}>
          {meta && (
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {meta}
            </Typography>
          )}
          {actions}
        </Box>
      )}
    </Box>
  );
}

/**
 * Card with a header bar. `flush` removes the body padding so tables and
 * lists can run edge to edge.
 */
export function SectionCard({ title, subtitle, action, children, sx, flush = false }) {
  const hasHeader = Boolean(title || action);
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        mb: 3,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
    >
      {hasHeader && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            px: { xs: 2, md: 3 },
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ minWidth: 0, flex: '1 1 260px' }}>
            {title && <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>{title}</Typography>}
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Box>
      )}
      <Box sx={{ flex: 1, ...(flush ? {} : { p: { xs: 2, md: 3 } }) }}>{children}</Box>
    </Paper>
  );
}

/** Consistent table header styling for tables inside a flush SectionCard. */
export const tableSx = {
  '& .MuiTableCell-head': {
    bgcolor: 'action.hover',
    color: 'text.secondary',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    py: 1.25,
  },
  '& .MuiTableCell-root': { borderColor: 'divider' },
  '& .MuiTableCell-root:first-of-type': { pl: { xs: 2, md: 3 } },
  '& .MuiTableCell-root:last-of-type': { pr: { xs: 2, md: 3 } },
  '& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root': { borderBottom: 'none' },
  '& .MuiTableBody-root .MuiTableCell-root': { py: 1.5 },
};

const TONE_COLOR = { error: 'error', warning: 'warning', success: 'success', info: 'info' };

export function StatTile({ label, value, hint, tone, icon: Icon, loading }) {
  const theme = useTheme();
  const paletteKey = TONE_COLOR[tone] || 'primary';
  const main = theme.palette[paletteKey].main;
  const valueColor = tone === 'error' ? 'error.main' : tone === 'warning' ? 'warning.main' : 'text.primary';
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        border: '1px solid',
        borderColor: tone === 'error' || tone === 'warning' ? alpha(main, 0.45) : 'divider',
        borderRadius: 2,
        minWidth: 0,
        height: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 1.5,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" noWrap title={label} sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        {loading ? (
          <Skeleton width={64} height={40} />
        ) : (
          <Typography
            sx={{
              fontSize: '1.625rem',
              fontWeight: 700,
              lineHeight: 1.3,
              mt: 0.5,
              color: valueColor,
              fontVariantNumeric: 'tabular-nums',
            }}
            noWrap
            title={typeof value === 'string' ? value : undefined}
          >
            {value}
          </Typography>
        )}
        {hint && (
          <Typography variant="caption" color="text.secondary" noWrap display="block" title={typeof hint === 'string' ? hint : undefined}>
            {hint}
          </Typography>
        )}
      </Box>
      {Icon && (
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 1.5,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(main, 0.12),
            color: main,
          }}
        >
          <Icon sx={{ fontSize: 20 }} />
        </Box>
      )}
    </Paper>
  );
}

/** Wrapping flex row of StatTiles: 2 per row on phones, 3 on tablets, 6 on wide screens. */
export function StatGrid({ children, sx }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        mb: 3,
        '& > *': {
          flex: {
            xs: '1 1 calc(50% - 8px)',
            md: '1 1 calc(33.333% - 11px)',
            xl: '1 1 0',
          },
          minWidth: { xs: 0, md: 0 },
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

const SEVERITY = {
  error: { icon: ErrorIcon, label: 'Critical', color: 'error' },
  warning: { icon: WarningIcon, label: 'Warning', color: 'warning' },
  info: { icon: InfoIcon, label: 'Info', color: 'info' },
};

export function AttentionList({ items, onOpen }) {
  const theme = useTheme();
  if (!items?.length) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: { xs: 2, md: 3 }, py: 2, color: 'success.main' }}>
        <OkIcon fontSize="small" />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Nothing needs attention right now.
        </Typography>
      </Box>
    );
  }
  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {items.map((item, idx) => {
        const s = SEVERITY[item.severity] || SEVERITY.info;
        const Icon = s.icon;
        const main = theme.palette[s.color].main;
        return (
          <Box
            component="li"
            key={`${item.code}-${idx}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: { xs: 2, md: 3 },
              py: 1.5,
              borderTop: idx === 0 ? 'none' : '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1.25,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(main, 0.12),
                color: main,
              }}
            >
              <Icon sx={{ fontSize: 18 }} />
            </Box>
            <Typography variant="body2" sx={{ flex: 1, minWidth: 0, fontWeight: 500 }}>
              {item.message}
            </Typography>
            <Chip
              label={s.label}
              size="small"
              sx={{ height: 22, fontWeight: 600, fontSize: '0.7rem', bgcolor: alpha(main, 0.1), color: main, display: { xs: 'none', sm: 'inline-flex' } }}
            />
            {item.tab && onOpen && (
              <Button
                size="small"
                onClick={() => onOpen(item.tab)}
                endIcon={<ChevronRightIcon fontSize="small" />}
                sx={{ textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
              >
                Open
              </Button>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

/** Small status pill with a coloured dot. color: success | warning | error | info | default */
export function StatusPill({ label, color = 'default' }) {
  const theme = useTheme();
  const main = color === 'default' ? theme.palette.text.secondary : theme.palette[color].main;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1,
        py: 0.25,
        borderRadius: 1,
        fontSize: '0.75rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        color: main,
        bgcolor: alpha(main, 0.1),
      }}
    >
      <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: main }} />
      {label}
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

export function EmptyState({ children, icon: Icon = InboxIcon }) {
  return (
    <Box
      sx={{
        py: 5,
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        textAlign: 'center',
      }}
    >
      <Icon sx={{ fontSize: 30, color: 'text.disabled' }} />
      <Typography variant="body2" color="text.secondary">
        {children}
      </Typography>
    </Box>
  );
}
