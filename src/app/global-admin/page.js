'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Chip,
  LinearProgress,
  Skeleton,
  ButtonBase,
  Divider
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ApartmentOutlined as InstitutionsIcon,
  PeopleAltOutlined as UsersIcon,
  HowToRegOutlined as ActiveIcon,
  HealthAndSafetyOutlined as HealthIcon,
  Refresh as RefreshIcon,
  StorageOutlined as StorageIcon,
  MonitorHeartOutlined as OperationsIcon,
  HistoryOutlined as AuditIcon,
  ChevronRight as ChevronRightIcon,
  CheckCircleRounded as SuccessIcon,
  ErrorRounded as FailureIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import GlobalAdminLayout from '../../components/GlobalAdmin/GlobalAdminLayout';

const EMPTY_STATS = { totalInstitutions: 0, totalUsers: 0, activeUsers: 0, totalManuscripts: 0 };
const EMPTY_HEALTH = { cpuUsage: 0, memoryUsage: 0, diskUsage: 0, status: 'unknown' };
const HEALTH_LIMIT = 80;

// Green below 60%, amber up to the health limit, red above it.
const usageColor = (value) => (value >= HEALTH_LIMIT ? 'error' : value >= 60 ? 'warning' : 'success');

const formatRelative = (date, locale) => {
  const diffSeconds = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  const units = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60]
  ];
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) return rtf.format(Math.round(diffSeconds / seconds), unit);
  }
  return rtf.format(diffSeconds, 'second');
};

const formatUptime = (hours) => {
  const h = Number(hours) || 0;
  const days = Math.floor(h / 24);
  return days > 0 ? `${days}d ${h % 24}h` : `${h}h`;
};

/* ---------- Small presentational pieces ---------- */

const SectionCard = ({ title, action, children, sx }) => (
  <Paper
    elevation={0}
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      ...sx
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 3,
        py: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>{title}</Typography>
      {action}
    </Box>
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</Box>
  </Paper>
);

const StatCard = ({ label, value, caption, icon: Icon, color, loading }) => {
  const theme = useTheme();
  const main = theme.palette[color]?.main || theme.palette.primary.main;
  return (
    <Paper
      elevation={0}
      sx={{
        flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 10px)', lg: '1 1 0' },
        minWidth: 0,
        p: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 2
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }} noWrap>
          {label}
        </Typography>
        {loading ? (
          <Skeleton width={72} height={44} />
        ) : (
          <Typography sx={{ fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.25, mt: 0.5 }} noWrap>
            {value}
          </Typography>
        )}
        <Box sx={{ mt: 0.5, color: 'text.secondary', fontSize: '0.8rem' }}>{caption}</Box>
      </Box>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 1.5,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(main, 0.12),
          color: main
        }}
      >
        <Icon />
      </Box>
    </Paper>
  );
};

const UsageMeter = ({ label, value, loading }) => (
  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 0' }, minWidth: 0 }}>
    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
      {loading ? (
        <Skeleton width={36} />
      ) : (
        <Typography sx={{ fontWeight: 700, fontSize: '1.125rem' }}>{value}%</Typography>
      )}
    </Box>
    <LinearProgress
      variant={loading ? 'indeterminate' : 'determinate'}
      value={Math.min(value, 100)}
      color={usageColor(value)}
      sx={{ height: 6, borderRadius: 3 }}
    />
  </Box>
);

const InfoRow = ({ label, children }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 1.25 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }} component="div">
      {children}
    </Typography>
  </Box>
);

/* ---------- Page ---------- */

const GlobalAdminPage = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [systemHealth, setSystemHealth] = useState(EMPTY_HEALTH);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.accountType !== 'GLOBAL_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const [statsResult, activityResult] = await Promise.allSettled([
      fetch('/api/global-admin/dashboard-stats', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/global-admin/audit?pageSize=6', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null))
    ]);

    const data = statsResult.status === 'fulfilled' ? statsResult.value : null;
    setStats(data?.stats || EMPTY_STATS);
    setSystemHealth(data?.systemHealth || EMPTY_HEALTH);

    const activity = activityResult.status === 'fulfilled' ? activityResult.value : null;
    setRecentActivity(activity?.success ? activity.data?.events || [] : []);

    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.accountType === 'GLOBAL_ADMIN') fetchDashboardData();
  }, [user, fetchDashboardData]);

  if (!user || user.accountType !== 'GLOBAL_ADMIN') return null;

  const locale = i18n?.language || undefined;
  const isHealthy = systemHealth.status === 'healthy';
  const isUnknown = systemHealth.status === 'unknown';
  const overLimit = [
    [t('global_admin.cpu_usage'), systemHealth.cpuUsage],
    [t('global_admin.memory_usage'), systemHealth.memoryUsage],
    [t('global_admin.disk_usage'), systemHealth.diskUsage]
  ]
    .filter(([, v]) => (v || 0) >= HEALTH_LIMIT)
    .map(([label]) => label);

  const statusColor = isUnknown ? 'text.disabled' : isHealthy ? 'success.main' : 'warning.main';
  const statusLabel = isUnknown
    ? t('global_admin.status_unknown', 'Unknown')
    : isHealthy
      ? t('global_admin.healthy')
      : t('common.warning');
  const statusCaption = isUnknown
    ? t('global_admin.status_unavailable', 'Health data unavailable')
    : isHealthy
      ? t('global_admin.all_systems_operational')
      : t('global_admin.high_usage', { list: overLimit.join(', '), defaultValue: 'High {{list}}' });

  const activeShare = stats.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0;

  const quickActions = [
    { label: t('global_admin.manage_institutions'), icon: InstitutionsIcon, path: '/global-admin/institutions' },
    { label: t('global_admin.operations', 'Operations'), icon: OperationsIcon, path: '/global-admin/operations' },
    { label: t('global_admin.system_health_check'), icon: HealthIcon, path: '/global-admin/health' },
    { label: t('global_admin.database_management'), icon: StorageIcon, path: '/global-admin/database' },
    { label: t('global_admin.audit_log', 'Audit log'), icon: AuditIcon, path: '/global-admin/audit' }
  ];

  return (
    <GlobalAdminLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            mb: 3
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="h1"
              sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              {t('global_admin.system_dashboard')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('global_admin.system_health_label')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {lastUpdated && (
              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {t('global_admin.last_updated', 'Updated')}{' '}
                {lastUpdated.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchDashboardData}
              disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
            >
              {t('global_admin.refresh_data')}
            </Button>
          </Box>
        </Box>

        {/* KPI cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, mb: 2.5 }}>
          <StatCard
            label={t('global_admin.total_institutions')}
            value={stats.totalInstitutions || 0}
            caption={t('global_admin.registered_institutions')}
            icon={InstitutionsIcon}
            color="primary"
            loading={loading}
          />
          <StatCard
            label={t('global_admin.total_users')}
            value={stats.totalUsers || 0}
            caption={t('global_admin.system_wide_users')}
            icon={UsersIcon}
            color="info"
            loading={loading}
          />
          <StatCard
            label={t('global_admin.active_users')}
            value={stats.activeUsers || 0}
            caption={
              loading
                ? t('global_admin.currently_active')
                : t('global_admin.active_share', { pct: activeShare, defaultValue: '{{pct}}% of all users' })
            }
            icon={ActiveIcon}
            color="success"
            loading={loading}
          />
          <StatCard
            label={t('global_admin.system_status')}
            value={statusLabel}
            caption={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColor, flexShrink: 0 }} />
                <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {statusCaption}
                </Box>
              </Box>
            }
            icon={HealthIcon}
            color={isUnknown ? 'primary' : isHealthy ? 'success' : 'warning'}
            loading={loading}
          />
        </Box>

        {/* Health metrics + system info */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5, mb: 2.5 }}>
          <SectionCard
            title={t('global_admin.system_health_metrics')}
            sx={{ flex: { lg: 2 } }}
            action={
              <Button
                size="small"
                endIcon={<ArrowForwardIcon fontSize="small" />}
                onClick={() => router.push('/global-admin/health')}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {t('global_admin.view_details', 'View details')}
              </Button>
            }
          >
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
                px: 3,
                py: 3,
                flex: 1,
                alignItems: 'center'
              }}
            >
              <UsageMeter label={t('global_admin.cpu_usage')} value={systemHealth.cpuUsage || 0} loading={loading} />
              <UsageMeter label={t('global_admin.memory_usage')} value={systemHealth.memoryUsage || 0} loading={loading} />
              <UsageMeter label={t('global_admin.disk_usage')} value={systemHealth.diskUsage || 0} loading={loading} />
            </Box>
          </SectionCard>

          <SectionCard title={t('global_admin.system_information')} sx={{ flex: { lg: 1 } }}>
            <Box sx={{ px: 3, py: 1 }}>
              <InfoRow label={t('global_admin.platform')}>
                {loading ? (
                  <Skeleton width={60} />
                ) : (
                  <Chip
                    label={systemHealth.platform || t('common.not_available')}
                    size="small"
                    sx={{ fontWeight: 600, textTransform: 'capitalize', height: 22 }}
                  />
                )}
              </InfoRow>
              <Divider />
              <InfoRow label={t('global_admin.cpu_cores')}>
                {loading ? <Skeleton width={30} /> : systemHealth.cpuCount || 0}
              </InfoRow>
              <Divider />
              <InfoRow label={t('global_admin.total_memory')}>
                {loading ? <Skeleton width={50} /> : `${systemHealth.totalMemoryGB || 0} GB`}
              </InfoRow>
              <Divider />
              <InfoRow label={t('global_admin.uptime')}>
                {loading ? <Skeleton width={50} /> : formatUptime(systemHealth.uptime)}
              </InfoRow>
            </Box>
          </SectionCard>
        </Box>

        {/* Recent activity + quick actions */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5 }}>
          <SectionCard
            title={t('global_admin.recent_system_activity')}
            sx={{ flex: { lg: 2 } }}
            action={
              <Button
                size="small"
                endIcon={<ArrowForwardIcon fontSize="small" />}
                onClick={() => router.push('/global-admin/audit')}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {t('global_admin.view_all', 'View all')}
              </Button>
            }
          >
            {loading ? (
              <Box sx={{ px: 3, py: 1 }}>
                {[0, 1, 2, 3].map((i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                    <Skeleton variant="circular" width={20} height={20} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="60%" />
                      <Skeleton width="35%" />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : recentActivity.length === 0 ? (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  py: 6,
                  color: 'text.secondary'
                }}
              >
                <AuditIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
                <Typography variant="body2">{t('global_admin.no_recent_activity')}</Typography>
              </Box>
            ) : (
              <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                {recentActivity.map((event, index) => {
                  const failed = event.outcome === 'FAILURE';
                  return (
                    <Box
                      component="li"
                      key={event.id || index}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.75,
                        px: 3,
                        py: 1.5,
                        borderTop: index === 0 ? 'none' : '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      {failed ? (
                        <FailureIcon sx={{ fontSize: 20, color: 'error.main', mt: 0.25 }} />
                      ) : (
                        <SuccessIcon sx={{ fontSize: 20, color: 'success.main', mt: 0.25 }} />
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap title={event.summary}>
                          {event.summary}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          {event.actorName || event.actorEmail || t('global_admin.system_actor', 'System')}
                          {event.institutionName ? ` · ${event.institutionName}` : ''}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: 0.5,
                          flexShrink: 0
                        }}
                      >
                        <Chip
                          label={event.category}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          title={new Date(event.createdAt).toLocaleString(locale)}
                        >
                          {formatRelative(event.createdAt, locale)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </SectionCard>

          <SectionCard title={t('global_admin.quick_actions')} sx={{ flex: { lg: 1 } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', p: 1 }}>
              {quickActions.map(({ label, icon: Icon, path }) => (
                <ButtonBase
                  key={path}
                  onClick={() => router.push(path)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 1.25,
                    borderRadius: 1.5,
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    transition: 'background-color 0.15s ease',
                    '&:hover': { bgcolor: 'action.hover' },
                    '&:hover .qa-chevron': { color: 'primary.main', transform: 'translateX(2px)' }
                  }}
                >
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 1.25,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      flexShrink: 0
                    }}
                  >
                    <Icon sx={{ fontSize: 19 }} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }} noWrap>
                    {label}
                  </Typography>
                  <ChevronRightIcon
                    className="qa-chevron"
                    sx={{ fontSize: 20, color: 'text.disabled', transition: 'all 0.15s ease' }}
                  />
                </ButtonBase>
              ))}
            </Box>
          </SectionCard>
        </Box>
      </Container>
    </GlobalAdminLayout>
  );
};

export default GlobalAdminPage;
