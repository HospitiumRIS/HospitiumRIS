'use client';

/**
 * Compliance analytics (institution). Live data from /api/institution/analytics/compliance.
 */

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Assignment as PortfolioIcon,
  CheckCircle as CheckIcon,
  Description as DmpIcon,
  ErrorOutline as AlertIcon,
  EventBusy as ExpiryIcon,
  ExpandLess as CollapseIcon,
  ExpandMore as ExpandIcon,
  FactCheck as RequirementIcon,
  Gavel as CommitteeIcon,
  HighlightOff as CrossIcon,
  HourglassTop as PendingIcon,
  OpenInNew as OpenIcon,
  RemoveCircleOutline as NaIcon,
  Search as SearchIcon,
  Shield as ShieldIcon,
  ShowChart as TrendIcon,
  AccountBalance as GrantIcon,
  Apartment as DeptIcon,
  TableRows as RegisterIcon,
  TaskAlt as AllClearIcon,
} from '@mui/icons-material';
import {
  EmptyState,
  INK,
  KpiTile,
  MUTED,
  MetricBar,
  PURPLE,
  SectionCard,
  SectionNav,
  StatusPill,
  TONES,
  chartTooltip,
  fmtDate,
  fmtPct,
} from './AnalyticsUI';

const ETHICS_TONE = {
  approved: 'good',
  conditional: 'info',
  not_required: 'neutral',
  pending: 'warn',
  revision: 'warn',
  expired: 'bad',
  rejected: 'bad',
  withdrawn: 'neutral',
  missing: 'bad',
};
const ETHICS_COLORS = {
  approved: '#22c55e',
  conditional: '#3b82f6',
  not_required: '#94a3b8',
  pending: '#f59e0b',
  revision: '#fb923c',
  expired: '#b91c1c',
  rejected: '#ef4444',
  withdrawn: '#cbd5e1',
  missing: '#7f1d1d',
};

const SEVERITY = {
  high: { tone: 'bad', label: 'High' },
  medium: { tone: 'warn', label: 'Medium' },
  low: { tone: 'info', label: 'Low' },
};

const CHECK_LABELS = {
  ethics: 'Ethics clearance',
  dataPlan: 'Data management plan',
  consent: 'Consent procedure',
  dataSecurity: 'Data security',
  documentation: 'Ethics documentation',
};

function CheckMark({ value, label }) {
  if (value === null) {
    return <Tooltip title={`${label}: not applicable`}><NaIcon sx={{ fontSize: 18, color: '#cbd5e1' }} /></Tooltip>;
  }
  return value
    ? <Tooltip title={`${label}: in place`}><CheckIcon sx={{ fontSize: 18, color: '#16a34a' }} /></Tooltip>
    : <Tooltip title={`${label}: missing`}><CrossIcon sx={{ fontSize: 18, color: '#dc2626' }} /></Tooltip>;
}

function HealthGauge({ score }) {
  const tone = score === null ? 'neutral' : score >= 85 ? 'good' : score >= 65 ? 'warn' : 'bad';
  const t = TONES[tone];
  return (
    <Box sx={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
      <CircularProgress variant="determinate" value={100} size={120} thickness={4.5} sx={{ color: '#f1f5f9', position: 'absolute' }} />
      <CircularProgress variant="determinate" value={score || 0} size={120} thickness={4.5} sx={{ color: t.color, position: 'absolute', '& circle': { strokeLinecap: 'round' } }} />
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.9rem', color: INK, lineHeight: 1 }}>{score === null ? '—' : score}</Typography>
        <Typography variant="caption" sx={{ color: MUTED, fontWeight: 600 }}>out of 100</Typography>
      </Box>
    </Box>
  );
}

export default function ComplianceAnalyticsDashboard({ analyticsData: data }) {
  const router = useRouter();
  const [active, setActive] = useState('actions');
  const [openAction, setOpenAction] = useState(null);
  const [search, setSearch] = useState('');
  const [ethicsFilter, setEthicsFilter] = useState('all');
  const [gapsOnly, setGapsOnly] = useState(false);

  const o = data.overview;
  const openProposal = (id) => router.push(`/institution/proposals/review/${id}`);

  const register = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.register.filter((r) => {
      if (ethicsFilter !== 'all' && r.ethics !== ethicsFilter) return false;
      if (gapsOnly && r.score === 100) return false;
      if (!q) return true;
      return [r.title, r.principalInvestigator, r.department, r.committee, r.ethicsReference].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [data.register, search, ethicsFilter, gapsOnly]);

  const sections = [
    { id: 'actions', label: 'Action required', icon: <AlertIcon />, count: data.actions.length || null, countTone: 'bad' },
    { id: 'requirements', label: 'Requirements', icon: <RequirementIcon /> },
    { id: 'pipeline', label: 'Ethics pipeline', icon: <TrendIcon /> },
    { id: 'committees', label: 'Committees', icon: <CommitteeIcon /> },
    { id: 'departments', label: 'Departments', icon: <DeptIcon /> },
    { id: 'funder', label: 'Funder obligations', icon: <GrantIcon />, count: data.grantObligations.length || null, countTone: o.overdueGrantItems ? 'bad' : undefined },
    { id: 'register', label: 'Compliance register', icon: <RegisterIcon />, count: data.register.length || null },
  ];
  const goTo = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const healthText = o.healthScore === null
    ? 'No active proposals in this period.'
    : `${o.fullyCompliant} of ${o.portfolio} active proposals meet every applicable requirement. ${data.actions.length ? `${data.actions.length} issue type${data.actions.length === 1 ? ' needs' : 's need'} attention.` : 'No open compliance issues.'}`;

  return (
    <Stack spacing={3}>
      {/* Summary */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.15fr 2fr' }, gap: 2 }}>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'white', display: 'flex', gap: 2.5, alignItems: 'center' }}>
          <HealthGauge score={o.healthScore} />
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: MUTED, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.68rem' }}>
              Compliance health
            </Typography>
            <Typography sx={{ fontWeight: 700, color: INK, fontSize: '1.05rem', mt: 0.25 }}>
              {o.healthScore === null ? 'Nothing to assess' : o.healthScore >= 85 ? 'In good standing' : o.healthScore >= 65 ? 'Some gaps to close' : 'Significant gaps'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{healthText}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Average share of applicable requirements met per proposal.
            </Typography>
          </Box>
        </Paper>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          <KpiTile label="Active portfolio" value={o.portfolio} sub="non-draft proposals" icon={<PortfolioIcon />} hint="Submitted or later proposals that were active at any point in the reporting period." />
          <KpiTile label="Ethics clearance" value={fmtPct(o.clearanceRate)} sub={`${o.cleared} cleared`} icon={<ShieldIcon />} tone={o.clearanceRate === null ? 'neutral' : o.clearanceRate >= 85 ? 'good' : 'warn'} />
          <KpiTile label="Awaiting ethics" value={o.pending} sub={o.overdueReviews ? `${o.overdueReviews} past ${data.thresholds.reviewSlaDays}-day target` : 'none overdue'} icon={<PendingIcon />} tone={o.overdueReviews ? 'bad' : o.pending ? 'warn' : 'good'} />
          <KpiTile label="Clearances expiring" value={o.expiringSoon + o.expired} sub={`${o.expired} expired · ${o.expiringSoon} within ${data.thresholds.expiryWarningDays} d`} icon={<ExpiryIcon />} tone={o.expired ? 'bad' : o.expiringSoon ? 'warn' : 'good'} />
        </Box>
      </Box>

      <SectionNav sections={sections} active={active} onSelect={goTo} />

      {/* Actions */}
      <SectionCard id="actions" icon={<AlertIcon />} title="Action required" subtitle="Generated from current records. Expand an item to see the proposals involved.">
        {data.actions.length ? (
          <Stack spacing={1.25}>
            {data.actions.map((a) => {
              const sev = SEVERITY[a.severity] || SEVERITY.low;
              const t = TONES[sev.tone];
              const open = openAction === a.id;
              return (
                <Paper key={a.id} elevation={0} sx={{ borderRadius: 1.5, border: '1px solid', borderColor: t.border, borderLeft: `4px solid ${t.color}`, overflow: 'hidden' }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    onClick={() => setOpenAction(open ? null : a.id)}
                    sx={{ px: 2, py: 1.5, cursor: 'pointer', bgcolor: open ? t.bg : 'white', '&:hover': { bgcolor: t.bg } }}
                  >
                    <StatusPill label={sev.label} tone={sev.tone} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: INK }}>{a.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{a.detail} <Box component="span" sx={{ fontWeight: 700, color: t.color }}>Next step: {a.action}.</Box></Typography>
                    </Box>
                    <IconButton size="small">{open ? <CollapseIcon /> : <ExpandIcon />}</IconButton>
                  </Stack>
                  <Collapse in={open} unmountOnExit>
                    <Table size="small">
                      <TableBody>
                        {(a.items || []).map((item, i) => (
                          <TableRow key={`${item.id}-${i}`} hover sx={{ cursor: 'pointer' }} onClick={() => openProposal(item.id)}>
                            <TableCell sx={{ pl: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.title}</Typography>
                              <Typography variant="caption" color="text.secondary">{item.principalInvestigator}{item.department ? ` · ${item.department}` : ''}</Typography>
                            </TableCell>
                            <TableCell sx={{ color: MUTED, fontSize: '0.8rem' }}>{item.detail}</TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem', fontWeight: 600, color: t.color }}>
                              {item.pendingDays ? `${item.pendingDays} days pending` : item.daysToExpiry !== null && item.daysToExpiry !== undefined ? (item.daysToExpiry < 0 ? `Expired ${fmtDate(item.expiryDate)}` : `Expires ${fmtDate(item.expiryDate)}`) : item.dueDate ? `Due ${fmtDate(item.dueDate)}` : ''}
                            </TableCell>
                            <TableCell align="right" sx={{ width: 40 }}><OpenIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Collapse>
                </Paper>
              );
            })}
          </Stack>
        ) : (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 2, borderRadius: 1.5, bgcolor: TONES.good.bg, border: `1px solid ${TONES.good.border}` }}>
            <AllClearIcon sx={{ color: TONES.good.color }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: TONES.good.color }}>No open compliance issues for this period.</Typography>
          </Stack>
        )}
      </SectionCard>

      {/* Requirements */}
      <SectionCard id="requirements" icon={<RequirementIcon />} title="Requirement coverage" subtitle="Share of active proposals meeting each requirement. The marker shows the 90% institutional target.">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' }, gap: 4, alignItems: 'center' }}>
          <Stack spacing={2.25}>
            {data.requirements.map((r) => (
              <MetricBar
                key={r.key}
                label={r.label}
                value={r.rate}
                target={90}
                caption={r.applicable ? `${r.met} of ${r.applicable} · ${r.description}` : `Not applicable to any proposal in this period · ${r.description}`}
              />
            ))}
          </Stack>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Ethics status of the portfolio</Typography>
            {data.ethicsBreakdown.length ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.ethicsBreakdown} dataKey="count" nameKey="label" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {data.ethicsBreakdown.map((e) => <Cell key={e.key} fill={ETHICS_COLORS[e.key]} />)}
                    </Pie>
                    <RTooltip {...chartTooltip} />
                  </PieChart>
                </ResponsiveContainer>
                <Stack spacing={0.75}>
                  {data.ethicsBreakdown.map((e) => (
                    <Stack key={e.key} direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: ETHICS_COLORS[e.key] }} />
                      <Typography variant="body2" sx={{ flex: 1 }}>{e.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{e.count}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </>
            ) : <EmptyState>No proposals in this period.</EmptyState>}
          </Box>
        </Box>
      </SectionCard>

      {/* Pipeline */}
      <SectionCard
        id="pipeline"
        icon={<TrendIcon />}
        title="Ethics review pipeline"
        subtitle="Ethics submissions and outcomes over the period."
        action={(
          <Stack direction="row" spacing={3}>
            {[['Median review', o.medianReviewDays], ['Average review', o.averageReviewDays], ['Fastest', o.fastestReviewDays]].map(([label, v]) => (
              <Box key={label} sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
                <Typography sx={{ fontWeight: 800, color: INK }}>{v === null || v === undefined ? '—' : `${v} days`}</Typography>
              </Box>
            ))}
          </Stack>
        )}
      >
        {data.monthlyTrends.some((m) => m.submitted || m.approved || m.rejected) ? (
          <ResponsiveContainer width="100%" height={290}>
            <ComposedChart data={data.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <RTooltip {...chartTooltip} />
              <Legend />
              <Bar dataKey="approved" name="Approved" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="submitted" name="Submitted" stroke={PURPLE} strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : <EmptyState>No ethics submissions or decisions in this period.</EmptyState>}
      </SectionCard>

      {/* Committees + Departments */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 3 }}>
        <SectionCard id="committees" icon={<CommitteeIcon />} title="Committee performance" subtitle="Workload, outcomes and turnaround by ethics committee.">
          {data.committees.length ? (
            <>
              <ResponsiveContainer width="100%" height={Math.max(160, data.committees.length * 44)}>
                <BarChart data={data.committees} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="committee" width={170} tick={{ fontSize: 10 }} />
                  <RTooltip {...chartTooltip} />
                  <Legend />
                  <Bar dataKey="approved" stackId="c" name="Approved" fill="#22c55e" />
                  <Bar dataKey="pending" stackId="c" name="Pending" fill="#f59e0b" />
                  <Bar dataKey="rejected" stackId="c" name="Rejected" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <TableContainer sx={{ mt: 1.5 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['Committee', 'Applications', 'Approval rate', 'Median review'].map((h, i) => (
                        <TableCell key={h} align={i ? 'right' : 'left'} sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.committees.map((c) => (
                      <TableRow key={c.committee}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{c.committee}</TableCell>
                        <TableCell align="right">{c.total}</TableCell>
                        <TableCell align="right">{fmtPct(c.approvalRate)}</TableCell>
                        <TableCell align="right">{c.medianReviewDays === null ? '—' : `${c.medianReviewDays} d`}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : <EmptyState>No ethics applications linked in this period.</EmptyState>}
        </SectionCard>

        <SectionCard id="departments" icon={<DeptIcon />} title="Compliance by department" subtitle="Lowest-scoring departments first, so gaps are easy to spot.">
          {data.departments.length ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Department', 'Proposals', 'Ethics', 'DMP', 'Score'].map((h, i) => (
                      <TableCell key={h} align={i ? 'right' : 'left'} sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.departments.map((d) => {
                    const tone = d.score >= 85 ? 'good' : d.score >= 65 ? 'warn' : 'bad';
                    return (
                      <TableRow key={d.department} hover>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                          {d.department}
                          {d.issues ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{d.issues} with gaps</Typography> : null}
                        </TableCell>
                        <TableCell align="right">{d.proposals}</TableCell>
                        <TableCell align="right">{fmtPct(d.clearanceRate)}</TableCell>
                        <TableCell align="right">{fmtPct(d.dmpRate)}</TableCell>
                        <TableCell align="right" sx={{ width: 140 }}>
                          <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                            <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#f1f5f9', overflow: 'hidden', maxWidth: 70 }}>
                              <Box sx={{ width: `${d.score}%`, height: '100%', bgcolor: TONES[tone].color }} />
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: TONES[tone].color, minWidth: 28 }}>{d.score}</Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : <EmptyState />}
        </SectionCard>
      </Box>

      {/* Funder obligations */}
      <SectionCard id="funder" icon={<GrantIcon />} title="Funder obligations" subtitle={`Grant reports and milestones overdue or due within ${data.thresholds.reportWarningDays} days, plus unsigned award contracts.`}>
        {data.grantObligations.length ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Obligation', 'Grant', 'Proposal', 'Due', 'Status'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.grantObligations.map((ob, i) => (
                  <TableRow key={`${ob.proposalId}-${i}`} hover sx={{ cursor: 'pointer' }} onClick={() => openProposal(ob.proposalId)}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{ob.item}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{ob.grant}<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{ob.grantor}</Typography></TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', maxWidth: 320 }}>{ob.proposalTitle}<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{ob.principalInvestigator}</Typography></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{fmtDate(ob.dueDate)}</TableCell>
                    <TableCell>
                      <StatusPill
                        label={ob.daysUntilDue === null ? 'Action needed' : ob.overdue ? `${Math.abs(ob.daysUntilDue)} d overdue` : `Due in ${ob.daysUntilDue} d`}
                        tone={ob.overdue ? 'bad' : 'warn'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : <EmptyState>No funder reports or grant milestones due in the next {data.thresholds.reportWarningDays} days.</EmptyState>}
      </SectionCard>

      {/* Register */}
      <SectionCard
        id="register"
        icon={<RegisterIcon />}
        title="Compliance register"
        subtitle="Every active proposal with its ethics status and requirement checklist. Click a row to open the proposal."
        action={(
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <TextField
              size="small"
              placeholder="Search title, PI, department, reference"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
              sx={{ width: { xs: '100%', sm: 300 } }}
            />
            <TextField select size="small" value={ethicsFilter} onChange={(e) => setEthicsFilter(e.target.value)} sx={{ minWidth: 170 }}>
              <MenuItem value="all">All ethics statuses</MenuItem>
              {data.ethicsBreakdown.map((e) => <MenuItem key={e.key} value={e.key}>{e.label} ({e.count})</MenuItem>)}
            </TextField>
            <Button
              variant={gapsOnly ? 'contained' : 'outlined'}
              onClick={() => setGapsOnly((v) => !v)}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none', ...(gapsOnly ? { bgcolor: PURPLE, '&:hover': { bgcolor: '#6d5499', boxShadow: 'none' } } : { color: PURPLE, borderColor: alpha(PURPLE, 0.5) }) }}
            >
              Gaps only
            </Button>
          </Stack>
        )}
      >
        {register.length ? (
          <TableContainer sx={{ maxHeight: 560, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem', bgcolor: '#fafafa' }}>Proposal</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem', bgcolor: '#fafafa' }}>Ethics</TableCell>
                  {Object.entries(CHECK_LABELS).map(([key, label]) => (
                    <TableCell key={key} align="center" sx={{ fontWeight: 700, color: MUTED, fontSize: '0.7rem', bgcolor: '#fafafa', maxWidth: 80 }}>
                      {label.replace('Ethics ', '').replace(' procedure', '').replace('Data management plan', 'DMP')}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem', bgcolor: '#fafafa' }}>Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {register.map((r) => {
                  const tone = r.score >= 85 ? 'good' : r.score >= 65 ? 'warn' : 'bad';
                  return (
                    <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => openProposal(r.id)}>
                      <TableCell sx={{ maxWidth: 380 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: INK }} noWrap title={r.title}>{r.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.principalInvestigator} · {r.department}</Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <StatusPill label={r.ethicsLabel} tone={ETHICS_TONE[r.ethics]} />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                          {r.ethicsReference || r.committee}
                          {r.expiryDate ? ` · exp. ${fmtDate(r.expiryDate)}` : ''}
                        </Typography>
                      </TableCell>
                      {Object.entries(CHECK_LABELS).map(([key, label]) => (
                        <TableCell key={key} align="center"><CheckMark value={r.checks[key]} label={label} /></TableCell>
                      ))}
                      <TableCell align="right"><Typography sx={{ fontWeight: 800, color: TONES[tone].color }}>{r.score}</Typography></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : <EmptyState>{data.register.length ? 'No proposals match these filters.' : 'No active proposals in this period.'}</EmptyState>}
        <Stack direction="row" spacing={2} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
          {[[<CheckIcon key="c" sx={{ fontSize: 16, color: '#16a34a' }} />, 'In place'], [<CrossIcon key="x" sx={{ fontSize: 16, color: '#dc2626' }} />, 'Missing'], [<NaIcon key="n" sx={{ fontSize: 16, color: '#cbd5e1' }} />, 'Not applicable (no human participants)']].map(([icon, label]) => (
            <Stack key={label} direction="row" spacing={0.5} alignItems="center">{icon}<Typography variant="caption" color="text.secondary">{label}</Typography></Stack>
          ))}
          <Stack direction="row" spacing={0.5} alignItems="center"><DmpIcon sx={{ fontSize: 16, color: '#94a3b8' }} /><Typography variant="caption" color="text.secondary">DMP = data management plan</Typography></Stack>
        </Stack>
      </SectionCard>
    </Stack>
  );
}
