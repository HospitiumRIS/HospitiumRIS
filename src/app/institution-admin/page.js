'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Button,
  Stack,
  Alert,
  Skeleton,
  alpha,
} from '@mui/material';
import {
  People as UsersIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  Verified as VerifiedIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Business as InstitutionIcon,
  AdminPanelSettings as AccountTypesIcon,
  Article as ManuscriptIcon,
  ArrowForward as ArrowForwardIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import InstitutionAdminLayout from '../../components/InstitutionAdmin/InstitutionAdminLayout';
import { useInstitutionAdmin } from '../../components/InstitutionAdmin/InstitutionAdminContext';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7a5caa';

const PERIOD_FILTERS = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: '1 month' },
  { value: '3months', label: '3 months' },
  { value: '6months', label: '6 months' },
  { value: 'year', label: 'Past year' },
];

const STATUS_TONE = {
  ACTIVE: { bg: alpha(PURPLE, 0.12), color: PURPLE_DARK, label: 'Active' },
  PENDING: { bg: '#fef3c7', color: '#b45309', label: 'Pending' },
  SUSPENDED: { bg: '#fee2e2', color: '#b91c1c', label: 'Suspended' },
  INACTIVE: { bg: '#f1f5f9', color: '#475569', label: 'Inactive' },
};

const QUICK_ACTIONS = [
  {
    title: 'User management',
    description: 'Review accounts, roles, and access',
    href: '/institution-admin/users',
    icon: UsersIcon,
  },
  {
    title: 'Institution profile',
    description: 'Update branding and contact details',
    href: '/institution-admin/profile',
    icon: InstitutionIcon,
  },
  {
    title: 'Verified domains',
    description: 'Manage email domains for your institution',
    href: '/institution-admin/verified-domains',
    icon: VerifiedIcon,
  },
  {
    title: 'Account types',
    description: 'Configure researcher and admin roles',
    href: '/institution-admin/account-types',
    icon: AccountTypesIcon,
  },
];

function StatCard({ label, value, caption, icon: Icon, highlight = false }) {
  return (
    <Paper
      elevation={0}
      sx={{
        px: 2,
        py: 1.25,
        borderRadius: 2,
        border: `1px solid ${alpha(PURPLE, highlight ? 0.22 : 0.12)}`,
        bgcolor: highlight ? alpha(PURPLE, 0.06) : 'background.paper',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(PURPLE, 0.12),
            color: PURPLE,
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 18 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
            <Typography
              variant="caption"
              noWrap
              sx={{ color: alpha(PURPLE, 0.7), fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              {label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: PURPLE_DARK, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {value}
            </Typography>
          </Stack>
          {caption ? (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: 0.25 }}>
              {caption}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Paper>
  );
}

function StatusChip({ status }) {
  const tone = STATUS_TONE[status] || { bg: '#f1f5f9', color: '#475569', label: status || 'Unknown' };
  return (
    <Chip
      size="small"
      label={tone.label}
      sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700, height: 24 }}
    />
  );
}

function DashboardHeading({ institutionName, onRefresh, loading, lastUpdated }) {
  const { t } = useTranslation();
  const { logoSrc } = useInstitutionAdmin();

  return (
    <Box
      sx={{
        mb: 3,
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        border: `1px solid ${alpha(PURPLE, 0.12)}`,
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Stack direction="row" spacing={1.75} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar
            src={logoSrc}
            variant="rounded"
            alt={institutionName}
            imgProps={{ style: { objectFit: 'contain' } }}
            sx={{
              width: 52,
              height: 52,
              bgcolor: alpha(PURPLE, 0.12),
              color: PURPLE,
              border: `1px solid ${alpha(PURPLE, 0.18)}`,
              p: logoSrc ? 0.5 : 0,
            }}
          >
            <InstitutionIcon />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" sx={{ color: alpha(PURPLE, 0.75), fontWeight: 700, letterSpacing: '0.08em' }}>
              {t('institution_admin.panel_title')}
            </Typography>
            <Typography variant="h5" noWrap sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              {institutionName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('institution_admin.dashboard', { defaultValue: 'Dashboard' })}
              {lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          disabled={loading}
          sx={{
            borderColor: alpha(PURPLE, 0.35),
            color: PURPLE_DARK,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) },
          }}
        >
          Refresh
        </Button>
      </Stack>
    </Box>
  );
}

const InstitutionAdminPage = () => {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { institution } = useInstitutionAdmin();
  const [stats, setStats] = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [profileComplete, setProfileComplete] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timePeriod, setTimePeriod] = useState('week');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.accountType !== 'INSTITUTION_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/institution-admin/dashboard-stats?period=${timePeriod}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load dashboard data');
      }

      setStats(data.stats || {});
      setRecentUsers(data.recentUsers || []);
      setProfileComplete(data.institution?.profileComplete ?? true);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [timePeriod]);

  useEffect(() => {
    if (user?.accountType === 'INSTITUTION_ADMIN') {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const institutionName = institution?.name || user?.primaryInstitution || t('institution_admin.panel_title');

  const setupItems = useMemo(() => [
    {
      label: 'Complete institution profile',
      done: profileComplete,
      href: '/institution-admin/profile',
    },
    {
      label: 'Review pending user approvals',
      done: (stats.pendingUsers || 0) === 0,
      href: '/institution-admin/users',
      count: stats.pendingUsers || 0,
    },
    {
      label: 'Configure verified domains',
      done: (stats.verifiedDomainsCount || 0) > 0,
      href: '/institution-admin/verified-domains',
      count: stats.verifiedDomainsCount || 0,
    },
  ], [profileComplete, stats.pendingUsers, stats.verifiedDomainsCount]);

  const pendingSetupCount = setupItems.filter((item) => !item.done).length;

  if (!user || user.accountType !== 'INSTITUTION_ADMIN') {
    return null;
  }

  return (
    <InstitutionAdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
        <DashboardHeading
          institutionName={institutionName}
          onRefresh={fetchDashboardData}
          loading={loading}
          lastUpdated={lastUpdated}
        />

        {error ? (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        ) : null}

        {pendingSetupCount > 0 && !loading ? (
          <Alert
            severity="warning"
            icon={<WarningIcon fontSize="inherit" />}
            sx={{ mb: 2.5, borderRadius: 2 }}
          >
            {pendingSetupCount} setup {pendingSetupCount === 1 ? 'item needs' : 'items need'} your attention below.
          </Alert>
        ) : null}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3 }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={68} sx={{ borderRadius: 2 }} />
            ))
          ) : (
            <>
              <StatCard label={t('global_admin.total_users', { defaultValue: 'Total users' })} value={stats.totalUsers || 0} caption={`${stats.newUsersInPeriod || 0} added in selected period`} icon={UsersIcon} highlight />
              <StatCard label={t('global_admin.active_users', { defaultValue: 'Active users' })} value={stats.activeUsers || 0} caption="Currently active accounts" icon={CheckIcon} />
              <StatCard label="Pending approvals" value={stats.pendingUsers || 0} caption={stats.newUsersToday ? `${stats.newUsersToday} joined today` : 'Awaiting review'} icon={PendingIcon} />
              <StatCard label="Verified domains" value={stats.verifiedDomainsCount || 0} caption="Configured email domains" icon={VerifiedIcon} />
            </>
          )}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' }, gap: 2, mb: 3 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}` }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Quick actions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Jump to the most common admin tasks
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.href}
                    onClick={() => router.push(action.href)}
                    sx={{
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      p: 1.5,
                      borderRadius: 1.5,
                      border: `1px solid ${alpha(PURPLE, 0.12)}`,
                      color: 'text.primary',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: alpha(PURPLE, 0.06),
                        borderColor: alpha(PURPLE, 0.24),
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ width: '100%' }}>
                      <Box sx={{ color: PURPLE, mt: 0.25 }}>
                        <Icon fontSize="small" />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {action.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {action.description}
                        </Typography>
                      </Box>
                      <ArrowForwardIcon sx={{ fontSize: 16, color: alpha(PURPLE, 0.5), mt: 0.25 }} />
                    </Stack>
                  </Button>
                );
              })}
            </Box>
          </Paper>

          <Stack spacing={2}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}` }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                Setup checklist
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Keep your institution ready for researchers
              </Typography>
              <Stack spacing={1}>
                {setupItems.map((item) => (
                  <Button
                    key={item.label}
                    onClick={() => router.push(item.href)}
                    sx={{
                      justifyContent: 'space-between',
                      px: 1.5,
                      py: 1.25,
                      borderRadius: 1.5,
                      border: `1px solid ${alpha(PURPLE, item.done ? 0.1 : 0.18)}`,
                      bgcolor: item.done ? alpha(PURPLE, 0.04) : alpha(PURPLE, 0.08),
                      color: 'text.primary',
                      textTransform: 'none',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      {item.done ? (
                        <CheckIcon sx={{ fontSize: 18, color: PURPLE }} />
                      ) : (
                        <WarningIcon sx={{ fontSize: 18, color: '#b45309' }} />
                      )}
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.label}
                      </Typography>
                    </Stack>
                    {typeof item.count === 'number' && item.count > 0 ? (
                      <Chip size="small" label={item.count} sx={{ bgcolor: alpha(PURPLE, 0.14), color: PURPLE_DARK, fontWeight: 700 }} />
                    ) : null}
                  </Button>
                ))}
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}` }}>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
                <Box sx={{ color: PURPLE }}>
                  <ManuscriptIcon fontSize="small" />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Research activity
                </Typography>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: PURPLE_DARK }}>
                    {loading ? '—' : stats.totalManuscripts || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Total manuscripts</Typography>
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: PURPLE_DARK }}>
                    {loading ? '—' : stats.activeManuscripts || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">In progress</Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}`, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${alpha(PURPLE, 0.1)}` }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Recent user accounts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  New accounts created in the selected period
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  size="small"
                  label={`${recentUsers.length} shown`}
                  sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE_DARK, fontWeight: 700 }}
                />
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push('/institution-admin/users')}
                  sx={{ textTransform: 'none', color: PURPLE_DARK, fontWeight: 600 }}
                >
                  View all users
                </Button>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={0.75} sx={{ mt: 2, flexWrap: 'wrap', gap: 0.75 }}>
              {PERIOD_FILTERS.map((filter) => (
                <Chip
                  key={filter.value}
                  label={filter.label}
                  size="small"
                  onClick={() => setTimePeriod(filter.value)}
                  sx={{
                    fontWeight: 600,
                    bgcolor: timePeriod === filter.value ? PURPLE : alpha(PURPLE, 0.08),
                    color: timePeriod === filter.value ? 'white' : PURPLE_DARK,
                    '&:hover': {
                      bgcolor: timePeriod === filter.value ? PURPLE_DARK : alpha(PURPLE, 0.14),
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(PURPLE, 0.04) }}>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Account type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 6 }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}><Skeleton variant="text" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : recentUsers.length > 0 ? (
                  recentUsers.map((entry) => (
                    <TableRow
                      key={entry.id}
                      hover
                      sx={{ '&:last-child td': { borderBottom: 0 } }}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(PURPLE, 0.14), color: PURPLE, fontSize: '0.85rem', fontWeight: 700 }}>
                            {entry.name?.[0] || entry.email?.[0] || '?'}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {entry.name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{entry.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" label={entry.accountType.replaceAll('_', ' ')} sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <StatusChip status={entry.status} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View user">
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/institution-admin/users?id=${entry.id}`)}
                            sx={{
                              color: PURPLE,
                              bgcolor: alpha(PURPLE, 0.08),
                              '&:hover': { bgcolor: alpha(PURPLE, 0.16) },
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <Stack spacing={1} alignItems="center">
                        <PersonAddIcon sx={{ color: alpha(PURPLE, 0.45) }} />
                        <Typography variant="body2" color="text.secondary">
                          No new users in this period
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => router.push('/institution-admin/users')}
                          sx={{ textTransform: 'none', color: PURPLE_DARK, fontWeight: 600 }}
                        >
                          Go to user management
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </InstitutionAdminLayout>
  );
};

export default InstitutionAdminPage;
