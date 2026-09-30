'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
} from '@mui/material';
import {
  Block as BlockIcon,
  CheckCircle as CheckIcon,
  Domain as DomainIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Login as LoginIcon,
  People as PeopleIcon,
  Public as IPIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../components/AuthProvider';
import InstitutionAdminLayout from '../../../components/InstitutionAdmin/InstitutionAdminLayout';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7a5caa';

const EVENT_TONE = {
  UNAUTHORIZED: { bg: '#fee2e2', color: '#b91c1c', label: 'Unauthorized' },
  FORBIDDEN: { bg: '#fef3c7', color: '#b45309', label: 'Forbidden' },
  ERROR: { bg: '#fee2e2', color: '#b91c1c', label: 'Error' },
};

const REC_SEVERITY = {
  error: { icon: ErrorIcon, color: '#b91c1c', bg: '#fee2e2' },
  warning: { icon: WarningIcon, color: '#b45309', bg: '#fef3c7' },
  info: { icon: InfoIcon, color: PURPLE_DARK, bg: alpha(PURPLE, 0.12) },
  success: { icon: CheckIcon, color: '#15803d', bg: '#dcfce7' },
};

const EMPTY_DATA = {
  institutionName: '',
  overview: {
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    suspendedMembers: 0,
    unverifiedMembers: 0,
    unverifiedInstitutionMembers: 0,
    recentLogins: 0,
    securityScore: 0,
  },
  domains: { verified: 0, pending: 0, suspended: 0, total: 0 },
  securityEvents: { unauthorized: 0, forbidden: 0, errors: 0, total: 0 },
  recentSecurityEvents: [],
  topIPs: [],
  usersByStatus: [],
  recommendations: [],
};

function PageHeading({ title, subtitle, action }) {
  return (
    <Box sx={{ mb: 3, p: { xs: 2, md: 2.5 }, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}`, bgcolor: 'background.paper' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Box>
          <Typography variant="overline" sx={{ color: alpha(PURPLE, 0.75), fontWeight: 700, letterSpacing: '0.08em' }}>
            Institution Admin
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mt: 0.25 }}>{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>
        </Box>
        {action}
      </Stack>
    </Box>
  );
}

function StatCard({ label, value, caption, icon: Icon }) {
  return (
    <Paper elevation={0} sx={{ px: 2, py: 1.25, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}`, bgcolor: 'background.paper' }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{ width: 34, height: 34, borderRadius: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(PURPLE, 0.12), color: PURPLE, flexShrink: 0 }}>
          <Icon sx={{ fontSize: 18 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
            <Typography variant="caption" noWrap sx={{ color: alpha(PURPLE, 0.7), fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: PURPLE_DARK, lineHeight: 1 }}>{value}</Typography>
          </Stack>
          {caption ? <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: 0.25 }}>{caption}</Typography> : null}
        </Box>
      </Stack>
    </Paper>
  );
}

function scoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs attention';
}

function scoreColor(score) {
  if (score >= 80) return '#15803d';
  if (score >= 60) return '#b45309';
  return '#b91c1c';
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const SecurityPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(EMPTY_DATA);
  const [notice, setNotice] = useState({ open: false, message: '', severity: 'success' });
  const [lastRefreshed, setLastRefreshed] = useState(null);

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

  const showNotice = (message, severity = 'success') => {
    setNotice({ open: true, message, severity });
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/institution-admin/security', { credentials: 'include' });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load security data');
      }

      setData(payload.data || EMPTY_DATA);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error loading security data:', err);
      showNotice(err.message || 'Failed to load security data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.accountType === 'INSTITUTION_ADMIN') {
      loadData();
    }
  }, [user, loadData]);

  const { overview, domains, securityEvents, recentSecurityEvents, topIPs, usersByStatus, recommendations } = data;
  const score = overview.securityScore || 0;

  const statCards = useMemo(
    () => [
      { label: 'Members', value: overview.totalMembers, caption: `${overview.activeMembers} active`, icon: PeopleIcon },
      { label: 'Unverified', value: overview.unverifiedMembers, caption: 'Email not verified', icon: WarningIcon },
      { label: 'Domains', value: domains.verified, caption: `${domains.pending} pending`, icon: DomainIcon },
      { label: 'Events (7d)', value: securityEvents.total, caption: `${securityEvents.unauthorized} unauthorized`, icon: SecurityIcon },
    ],
    [overview, domains, securityEvents]
  );

  if (!user || user.accountType !== 'INSTITUTION_ADMIN') {
    return null;
  }

  return (
    <InstitutionAdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
        <PageHeading
          title="Security"
          subtitle={
            data.institutionName
              ? `Security posture and access monitoring for ${data.institutionName}.`
              : 'Monitor member access, domains, and security events for your institution.'
          }
          action={(
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 600, borderColor: alpha(PURPLE, 0.35), color: PURPLE_DARK, '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) } }}
            >
              Refresh
            </Button>
          )}
        />

        {lastRefreshed ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Last refreshed {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        ) : null}

        {loading ? (
          <Skeleton variant="rounded" height={88} sx={{ mb: 3, borderRadius: 2 }} />
        ) : (
          <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}` }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: alpha(PURPLE, 0.12), color: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldIcon />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="baseline" spacing={1.5} sx={{ mb: 0.5 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: scoreColor(score) }}>{score}</Typography>
                  <Typography variant="body2" color="text.secondary">/ 100 · {scoreLabel(score)}</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={score}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mb: 1,
                    bgcolor: alpha(PURPLE, 0.1),
                    '& .MuiLinearProgress-bar': { bgcolor: scoreColor(score), borderRadius: 4 },
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Based on member verification, domain status, account health, and recent security events.
                </Typography>
              </Box>
              <Stack spacing={0.75} sx={{ minWidth: 140 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Recent logins</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{overview.recentLogins}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Suspended</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{overview.suspendedMembers}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Pending</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{overview.pendingMembers}</Typography>
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3 }}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={68} sx={{ borderRadius: 2 }} />)
            : statCards.map((card) => <StatCard key={card.label} {...card} />)}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}` }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Recommendations</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Actions to improve your institution security</Typography>
            {loading ? (
              <Stack spacing={1}>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={64} />)}</Stack>
            ) : (
              <Stack spacing={1}>
                {recommendations.map((item) => {
                  const tone = REC_SEVERITY[item.severity] || REC_SEVERITY.info;
                  const Icon = tone.icon;
                  const content = (
                    <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ p: 1.25, borderRadius: 1.5, border: `1px solid ${alpha(PURPLE, 0.1)}`, bgcolor: item.href ? 'background.paper' : alpha(PURPLE, 0.02) }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: tone.bg, color: tone.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon sx={{ fontSize: 18 }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.description}</Typography>
                      </Box>
                    </Stack>
                  );
                  return item.href ? (
                    <Link key={item.id} href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {content}
                    </Link>
                  ) : (
                    <Box key={item.id}>{content}</Box>
                  );
                })}
              </Stack>
            )}
          </Paper>

          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}` }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Member status</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Account distribution across your institution</Typography>
            {loading ? (
              <Stack spacing={1}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={36} />)}</Stack>
            ) : usersByStatus.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No members yet</Typography>
            ) : (
              <Stack spacing={1}>
                {usersByStatus.map((entry) => (
                  <Stack key={entry.status} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.25, borderRadius: 1.5, border: `1px solid ${alpha(PURPLE, 0.1)}` }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {entry.status === 'ACTIVE' ? <VerifiedIcon sx={{ fontSize: 18, color: PURPLE }} /> : null}
                      {entry.status === 'PENDING' ? <InfoIcon sx={{ fontSize: 18, color: '#b45309' }} /> : null}
                      {entry.status === 'SUSPENDED' ? <BlockIcon sx={{ fontSize: 18, color: '#b91c1c' }} /> : null}
                      <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{entry.status.toLowerCase()}</Typography>
                    </Stack>
                    <Chip size="small" label={entry.count} sx={{ bgcolor: alpha(PURPLE, 0.12), color: PURPLE_DARK, fontWeight: 700 }} />
                  </Stack>
                ))}
                {overview.unverifiedInstitutionMembers > 0 ? (
                  <Alert severity="warning" sx={{ borderRadius: 1.5, py: 0.5 }}>
                    {overview.unverifiedInstitutionMembers} member{overview.unverifiedInstitutionMembers === 1 ? '' : 's'} not yet verified with the institution
                  </Alert>
                ) : null}
              </Stack>
            )}
          </Paper>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 0.6fr' }, gap: 2.5 }}>
          <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}`, overflow: 'hidden' }}>
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${alpha(PURPLE, 0.1)}` }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent security events</Typography>
              <Typography variant="body2" color="text.secondary">Last 24 hours · institution members only</Typography>
            </Box>
            {loading ? (
              <Box sx={{ p: 2 }}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={48} sx={{ mb: 1 }} />)}</Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(PURPLE, 0.04) }}>
                      <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>IP</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentSecurityEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                          <Stack spacing={1} alignItems="center">
                            <CheckIcon sx={{ color: alpha(PURPLE, 0.45), fontSize: 36 }} />
                            <Typography variant="body2" color="text.secondary">No security events in the last 24 hours</Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentSecurityEvents.map((event, index) => {
                        const tone = EVENT_TONE[event.type] || { bg: '#f3f4f6', color: '#6b7280', label: event.type };
                        return (
                          <TableRow key={`${event.timestamp}-${index}`} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                            <TableCell>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{formatTimestamp(event.timestamp)}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip size="small" label={tone.label} sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700 }} />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>{event.user}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{event.ip}</Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {!loading && recentSecurityEvents.length > 0 ? (
              <Box sx={{ p: 2, borderTop: `1px solid ${alpha(PURPLE, 0.1)}` }}>
                <Button component={Link} href="/institution-admin/logs" size="small" sx={{ textTransform: 'none', color: PURPLE_DARK, fontWeight: 600 }}>
                  View full activity logs
                </Button>
              </Box>
            ) : null}
          </Paper>

          <Stack spacing={2.5}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}` }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Event breakdown (7d)</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Failed access and errors</Typography>
              {loading ? (
                <Stack spacing={1}>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={32} />)}</Stack>
              ) : (
                <Stack spacing={1.25}>
                  {[
                    { label: 'Unauthorized (401)', value: securityEvents.unauthorized, icon: ErrorIcon, color: '#b91c1c' },
                    { label: 'Forbidden (403)', value: securityEvents.forbidden, icon: BlockIcon, color: '#b45309' },
                    { label: 'Errors', value: securityEvents.errors, icon: WarningIcon, color: '#b45309' },
                  ].map((item) => (
                    <Stack key={item.label} direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <item.icon sx={{ fontSize: 16, color: item.color }} />
                        <Typography variant="body2">{item.label}</Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Paper>

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}` }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Top IP addresses</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Most active in the last 7 days</Typography>
              {loading ? (
                <Stack spacing={1}>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={32} />)}</Stack>
              ) : topIPs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No external IP activity recorded</Typography>
              ) : (
                <Stack spacing={1}>
                  {topIPs.map((entry) => (
                    <Stack key={entry.ip} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1, borderRadius: 1.5, border: `1px solid ${alpha(PURPLE, 0.1)}` }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IPIcon sx={{ fontSize: 16, color: PURPLE }} />
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{entry.ip}</Typography>
                      </Stack>
                      <Chip size="small" label={`${entry.requests} req`} sx={{ bgcolor: alpha(PURPLE, 0.12), color: PURPLE_DARK, fontWeight: 700 }} />
                    </Stack>
                  ))}
                </Stack>
              )}
            </Paper>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}` }}>
              <Stack spacing={1}>
                <Button component={Link} href="/institution-admin/users" variant="outlined" fullWidth startIcon={<PeopleIcon />} sx={{ textTransform: 'none', fontWeight: 600, borderColor: alpha(PURPLE, 0.35), color: PURPLE_DARK, '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) } }}>
                  Manage users
                </Button>
                <Button component={Link} href="/institution-admin/verified-domains" variant="outlined" fullWidth startIcon={<DomainIcon />} sx={{ textTransform: 'none', fontWeight: 600, borderColor: alpha(PURPLE, 0.35), color: PURPLE_DARK, '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) } }}>
                  Verified domains
                </Button>
                <Button component={Link} href="/institution-admin/logs" variant="outlined" fullWidth startIcon={<LoginIcon />} sx={{ textTransform: 'none', fontWeight: 600, borderColor: alpha(PURPLE, 0.35), color: PURPLE_DARK, '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) } }}>
                  Activity logs
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Box>

      <Snackbar open={notice.open} autoHideDuration={6000} onClose={() => setNotice((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={notice.severity} onClose={() => setNotice((prev) => ({ ...prev, open: false }))} sx={{ borderRadius: 2, width: '100%' }}>
          {notice.message}
        </Alert>
      </Snackbar>
    </InstitutionAdminLayout>
  );
};

export default SecurityPage;
