'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Analytics as AnalyticsIcon,
  AccountBalance as FundingIcon,
  Assignment as PortfolioIcon,
  Business as BusinessIcon,
  CheckCircle as DoneIcon,
  EventNote as DeadlineIcon,
  Flag as MilestoneIcon,
  HowToReg as ApprovalIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Schedule as OnTimeIcon,
  Timeline as ProgressIcon,
  RateReview as ReviewIcon,
  WorkHistory as ActiveIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import {
  EmptyState,
  INK,
  KpiTile,
  MUTED,
  PURPLE,
  SectionCard,
  SectionNav,
  StatusPill,
  chartTooltip,
  fmtDate,
  fmtPct,
  formatMoney,
} from '@/components/Analytics/AnalyticsUI';
import ReportInsights from '@/components/Analytics/ReportInsights';

const STATUS_TONE = {
  DRAFT: 'neutral', SUBMITTED: 'info', UNDER_REVIEW: 'brand', REVISION_REQUESTED: 'warn', APPROVED: 'good', REJECTED: 'bad',
  NOT_APPLIED: 'neutral', APPLIED: 'info', AWARDED: 'good', CANCELLED: 'neutral', PREPARING: 'neutral', READY_TO_SUBMIT: 'info',
  ADDITIONAL_INFO_REQUESTED: 'warn', WITHDRAWN: 'neutral',
};
const STAGE_TONE = { Planning: 'neutral', Review: 'brand', Active: 'good', 'On Hold': 'warn', Completed: 'info' };
const pretty = (s) => String(s || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const pctOf = (a, b) => (b ? Math.round((a / b) * 100) : null);

export default function ResearchProgressReport() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState('portfolio');
  const [roleFilter, setRoleFilter] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/researcher/analytics/progress', { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to load progress report');
      setData(json);
    } catch (err) {
      setError(err.message || 'Failed to load progress report');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const goTo = (id) => { setActive(id); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const openProposal = (id) => id && router.push(`/researcher/projects/proposals/view/${id}`);

  const projects = useMemo(() => {
    const list = data?.proposals || [];
    if (roleFilter === 'all') return list;
    return list.filter((p) => (roleFilter === 'pi' ? p.roleKey === 'pi' : p.roleKey !== 'pi'));
  }, [data, roleFilter]);

  const o = data?.overview;
  const mb = data?.milestoneBreakdown;
  const db = data?.deliverableBreakdown;
  const workBars = data ? [
    { name: 'Milestones', Completed: mb.completed, Open: mb.pending, Overdue: mb.overdue },
    { name: 'Deliverables', Completed: db.completed, Open: db.pending, Overdue: db.overdue },
  ] : [];
  const statusBars = (data?.proposalStatusCounts || []).map((s) => ({ name: pretty(s.key), count: s.count }));

  const sections = [
    { id: 'portfolio', label: 'Project portfolio', icon: <PortfolioIcon />, count: data?.proposals?.length || null },
    { id: 'deadlines', label: 'Upcoming deadlines', icon: <DeadlineIcon />, count: data?.upcomingMilestones?.filter((m) => m.status === 'Overdue').length || null, countTone: 'bad' },
    { id: 'delivery', label: 'Milestones & deliverables', icon: <MilestoneIcon /> },
    { id: 'funding', label: 'Funding', icon: <FundingIcon /> },
    { id: 'review', label: 'Proposal outcomes', icon: <ReviewIcon /> },
  ];

  return (
    <Box sx={{ bgcolor: '#f6f7fb', minHeight: '100vh', pb: 6, '@media print': { bgcolor: 'white' } }}>
      <PageHeader
        title="Research Progress Report"
        description="Your projects, delivery against milestones, and funding outcomes"
        icon={<ProgressIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher', icon: <BusinessIcon /> },
          { label: 'Analytics', path: '/researcher/analytics', icon: <AnalyticsIcon /> },
          { label: 'Progress' },
        ]}
        actionButton={(
          <Stack direction="row" spacing={1} className="no-print">
            <Tooltip title="Refresh"><span><IconButton onClick={load} disabled={loading} sx={{ color: 'white' }}><RefreshIcon /></IconButton></span></Tooltip>
            <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} disabled={!data} sx={{ bgcolor: 'white', color: '#6d5499', textTransform: 'none', fontWeight: 700, boxShadow: 'none', '&:hover': { bgcolor: '#f5f5f5', boxShadow: 'none' } }}>
              Print / save PDF
            </Button>
          </Stack>
        )}
      />

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {error ? <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>{error}</Alert> : null}
        {data && !data.meta?.hasOrcid ? (
          <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
            Proposals are matched to you by ORCID iD, account and email. Add your ORCID iD to your profile so none are missed.
          </Alert>
        ) : null}

        {loading && !data ? (
          <Stack spacing={2}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 2 }}>
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rounded" height={118} />)}
            </Box>
            <Skeleton variant="rounded" height={140} />
            <Skeleton variant="rounded" height={320} />
          </Stack>
        ) : data ? (
          <Stack spacing={3}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 2 }}>
              <KpiTile label="Projects" value={o.totalProposals} sub={`${o.asPrincipalInvestigator ?? 0} as PI · ${o.asCoInvestigator ?? 0} as co-I`} icon={<PortfolioIcon />} />
              <KpiTile label="Active projects" value={o.activeProjects} sub={`${o.inReview} in review · ${o.revisionRequested} to revise`} icon={<ActiveIcon />} tone="good" />
              <KpiTile label="Approval rate" value={fmtPct(o.approvalRate === null ? null : Math.round(o.approvalRate))} sub={`${o.approvedCount} approved`} icon={<ApprovalIcon />} tone={o.approvalRate === null ? 'neutral' : o.approvalRate >= 50 ? 'good' : 'warn'} hint="Approved as a share of proposals with a final decision." />
              <KpiTile label="Milestones done" value={`${o.completedMilestones}/${o.totalMilestones}`} sub={o.overdueMilestones ? `${o.overdueMilestones} overdue` : 'none overdue'} icon={<DoneIcon />} tone={o.overdueMilestones ? 'bad' : 'good'} />
              <KpiTile label="On-time delivery" value={fmtPct(o.onTimeRate === null ? null : Math.round(o.onTimeRate))} sub="of completed milestones" icon={<OnTimeIcon />} tone={o.onTimeRate === null ? 'neutral' : o.onTimeRate >= 80 ? 'good' : 'warn'} hint="Completed on or before the due date. Needs completion dates on milestones." />
              <KpiTile label="Funding awarded" value={formatMoney(o.totalAwarded)} sub={`of ${formatMoney(o.totalRequested)} requested`} icon={<FundingIcon />} tone="info" />
            </Box>

            <ReportInsights endpoint="/api/researcher/analytics/progress/insights" />

            <SectionNav sections={sections} active={active} onSelect={goTo} />

            <SectionCard
              id="portfolio"
              icon={<PortfolioIcon />}
              title="Project portfolio"
              subtitle="Every proposal you lead or co-investigate, with delivery progress. Click a row to open it."
              action={(
                <ToggleButtonGroup size="small" exclusive value={roleFilter} onChange={(_, v) => v && setRoleFilter(v)} sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600 } }}>
                  <ToggleButton value="all">All</ToggleButton>
                  <ToggleButton value="pi">As PI</ToggleButton>
                  <ToggleButton value="co">As co-investigator</ToggleButton>
                </ToggleButtonGroup>
              )}
            >
              {projects.length ? (
                <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#fafafa' }}>
                        {['Project', 'Status', 'Stage', 'Milestone progress', 'Next milestone', 'Budget'].map((h, i) => (
                          <TableCell key={h} align={i === 5 ? 'right' : 'left'} sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {projects.map((p) => (
                        <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => openProposal(p.id)}>
                          <TableCell sx={{ maxWidth: 360 }}>
                            <Typography sx={{ fontWeight: 600, color: INK, fontSize: '0.86rem' }} noWrap title={p.title}>{p.title}</Typography>
                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
                              <StatusPill label={p.role} tone={p.roleKey === 'pi' ? 'brand' : 'info'} />
                              {p.startDate ? <Typography variant="caption" sx={{ color: MUTED }}>{fmtDate(p.startDate)} – {fmtDate(p.endDate)}</Typography> : null}
                            </Stack>
                          </TableCell>
                          <TableCell><StatusPill label={pretty(p.status)} tone={STATUS_TONE[p.status] || 'neutral'} /></TableCell>
                          <TableCell>
                            <StatusPill label={p.executionStatus} tone={STAGE_TONE[p.executionStatus] || 'neutral'} />
                            {p.reviewStage && p.reviewOverall !== 'COMPLETED' ? <Typography variant="caption" sx={{ color: MUTED, display: 'block' }}>{p.reviewStage}</Typography> : null}
                          </TableCell>
                          <TableCell sx={{ minWidth: 170 }}>
                            {p.milestoneCount ? (
                              <>
                                <LinearProgress variant="determinate" value={p.progress} sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: p.overdueMilestones ? '#f59e0b' : '#16a34a', borderRadius: 3 } }} />
                                <Typography variant="caption" sx={{ color: MUTED }}>
                                  {p.completedMilestones}/{p.milestoneCount} done{p.overdueMilestones ? ` · ${p.overdueMilestones} overdue` : ''}
                                </Typography>
                              </>
                            ) : <Typography variant="caption" sx={{ color: '#94a3b8' }}>No milestones defined</Typography>}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 220 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }} noWrap title={p.nextMilestone}>{p.nextMilestone}</Typography>
                            {p.nextDue ? <Typography variant="caption" sx={{ color: new Date(p.nextDue) < new Date() ? '#b91c1c' : MUTED }}>Due {fmtDate(p.nextDue)}</Typography> : null}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{p.budget ? formatMoney(p.budget) : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : <EmptyState>{data.proposals.length ? 'No projects for this role.' : 'No proposals linked to you yet.'}</EmptyState>}
            </SectionCard>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 3 }}>
              <SectionCard id="deadlines" icon={<DeadlineIcon />} title="Upcoming deadlines" subtitle="Next milestones and deliverables across all projects, soonest first.">
                {data.upcomingMilestones.length ? (
                  <Stack spacing={1}>
                    {data.upcomingMilestones.map((m, i) => {
                      const overdue = m.status === 'Overdue';
                      const days = Math.round((new Date(m.dueDate) - new Date()) / 86400000);
                      return (
                        <Stack
                          key={`${m.title}-${i}`}
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                          onClick={() => openProposal(m.proposalId)}
                          sx={{ p: 1.25, borderRadius: 1.5, border: '1px solid', borderColor: overdue ? '#fecaca' : '#e2e8f0', bgcolor: overdue ? '#fef2f2' : 'white', cursor: m.proposalId ? 'pointer' : 'default' }}
                        >
                          <Box sx={{ width: 52, textAlign: 'center', flexShrink: 0 }}>
                            <Typography sx={{ fontWeight: 800, color: overdue ? '#b91c1c' : INK, lineHeight: 1 }}>{new Date(m.dueDate).getDate()}</Typography>
                            <Typography variant="caption" sx={{ color: MUTED, textTransform: 'uppercase', fontSize: '0.65rem' }}>{new Date(m.dueDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</Typography>
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: INK }} noWrap>{m.title}</Typography>
                            <Typography variant="caption" sx={{ color: MUTED }} noWrap>{m.kind === 'deliverable' ? 'Deliverable' : m.kind === 'grant-milestone' ? 'Grant milestone' : 'Milestone'} · {m.grantTitle}</Typography>
                          </Box>
                          <StatusPill label={overdue ? `${Math.abs(days)} d overdue` : days === 0 ? 'Due today' : `In ${days} d`} tone={overdue ? 'bad' : days <= 14 ? 'warn' : 'neutral'} />
                        </Stack>
                      );
                    })}
                  </Stack>
                ) : <EmptyState>No open milestones or deliverables with due dates.</EmptyState>}
              </SectionCard>

              <SectionCard id="delivery" icon={<MilestoneIcon />} title="Milestones and deliverables" subtitle="Delivery status across all projects.">
                {mb.total || db.total ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={workBars} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                        <RTooltip {...chartTooltip} />
                        <Legend />
                        <Bar dataKey="Completed" stackId="a" fill="#16a34a" />
                        <Bar dataKey="Open" name="Open (not yet due)" stackId="a" fill="#93c5fd" />
                        <Bar dataKey="Overdue" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mt: 1.5 }}>
                      {[['Milestones', mb], ['Deliverables', db]].map(([label, b]) => (
                        <Box key={label} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <Typography variant="caption" sx={{ color: MUTED, fontWeight: 700 }}>{label}</Typography>
                          <Typography sx={{ fontWeight: 800, color: INK }}>{fmtPct(pctOf(b.completed, b.total))} complete</Typography>
                          <Typography variant="caption" sx={{ color: MUTED }}>{b.completed} of {b.total}{b.onTimeRate !== null && b.onTimeRate !== undefined ? ` · ${Math.round(b.onTimeRate)}% on time` : ''}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                ) : <EmptyState>Add milestones and deliverables to your proposals to track delivery.</EmptyState>}
              </SectionCard>
            </Box>

            <SectionCard id="funding" icon={<FundingIcon />} title="Funding" subtitle="Grant applications from the grant tracker and your grant applications, with amounts awarded by year.">
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.4fr' }, gap: 3 }}>
                <Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 2 }}>
                    {[
                      ['Applications', o.totalGrantApplications],
                      ['Awarded', o.awardedCount],
                      ['Success rate', fmtPct(o.conversionRate === null ? null : Math.round(o.conversionRate))],
                      ['Budget proposed', formatMoney(o.totalProposedBudget)],
                    ].map(([label, value]) => (
                      <Box key={label} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" sx={{ color: MUTED, fontWeight: 700 }}>{label}</Typography>
                        <Typography sx={{ fontWeight: 800, color: INK, fontSize: '1.15rem' }}>{value}</Typography>
                      </Box>
                    ))}
                  </Box>
                  {data.fundingTrend.length ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={data.fundingTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatMoney(v)} width={60} />
                        <RTooltip {...chartTooltip} formatter={(v) => [formatMoney(v, 'USD', false), 'Awarded']} />
                        <Bar dataKey="amount" fill="#16a34a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyState height={140}>No awards recorded yet.</EmptyState>}
                </Box>
                <Box>
                  {data.grants.length ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            {['Grant', 'Status', 'Requested', 'Awarded'].map((h, i) => (
                              <TableCell key={h} align={i >= 2 ? 'right' : 'left'} sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem' }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.grants.map((g) => (
                            <TableRow key={`${g.source}-${g.id}`}>
                              <TableCell sx={{ maxWidth: 280 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={g.title}>{g.title}</Typography>
                                <Typography variant="caption" sx={{ color: MUTED }}>{g.grantorName || 'Grant tracker'}{g.appliedOn ? ` · applied ${fmtDate(g.appliedOn)}` : ''}</Typography>
                              </TableCell>
                              <TableCell><StatusPill label={pretty(g.status)} tone={STATUS_TONE[g.status] || 'neutral'} /></TableCell>
                              <TableCell align="right">{g.requestedAmount ? formatMoney(g.requestedAmount) : '—'}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: g.awardedAmount ? '#15803d' : MUTED }}>{g.awardedAmount ? formatMoney(g.awardedAmount) : '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : <EmptyState>No grant applications yet. Track external funding from the grant tracker.</EmptyState>}
                </Box>
              </Box>
            </SectionCard>

            <SectionCard id="review" icon={<ReviewIcon />} title="Proposal outcomes" subtitle={o.avgTurnaroundDays !== null ? `Average ${o.avgTurnaroundDays} days from creation to decision.` : 'Status of all your proposals.'}>
              {statusBars.some((s) => s.count) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={statusBars}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <RTooltip {...chartTooltip} />
                    <Bar dataKey="count" name="Proposals" fill={alpha(PURPLE, 0.8)} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState>No proposals yet.</EmptyState>}
            </SectionCard>

            <Typography variant="caption" sx={{ color: MUTED }}>
              Report generated {new Date(data.meta.generatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}. Average turnaround uses the first recorded review decision.
            </Typography>
          </Stack>
        ) : null}
      </Container>
    </Box>
  );
}
