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
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AccountBalance as FundingIcon,
  Refresh as RefreshIcon,
  RequestQuote as BudgetIcon,
  Send as AppliedIcon,
  EmojiEvents as AwardIcon,
  Percent as RateIcon,
  WorkHistory as ActiveIcon,
  HourglassTop as PipelineIcon,
  FilterAlt as FunnelIcon,
  ShowChart as TrendIcon,
  Business as FunderIcon,
  Apartment as DeptIcon,
  TableRows as PortfolioIcon,
  Lightbulb as OpportunityIcon,
  NotificationImportant as GapIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import {
  AnalyticsRangeBar,
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
  presetRange,
  rangeQuery,
} from '@/components/Analytics/AnalyticsUI';

const FUNNEL_COLORS = ['#c4b5fd', '#a78bfa', PURPLE, '#16a34a'];

export default function FundingAnalytics() {
  const router = useRouter();
  const [range, setRange] = useState(() => presetRange('12m'));
  const [preset, setPreset] = useState('12m');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState('flow');
  const [breakdown, setBreakdown] = useState('funder');

  const load = async (r = range) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/institution/analytics/funding?${rangeQuery(r)}`, { credentials: 'include' });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || 'Failed to load funding analytics');
      setData(json);
    } catch (err) {
      console.error('Error loading funding analytics:', err);
      setError(err.message || 'Failed to load funding analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.startDate, range.endDate]);

  const money = (v, compact = true) => formatMoney(v, data?.currency || 'USD', compact);
  const openProposal = (id) => router.push(`/institution/proposals/review/${id}`);
  const goTo = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const funnelMax = useMemo(() => Math.max(1, ...(data?.funnel || []).map((f) => f.count)), [data]);
  const hasTrend = data?.monthlyTrends?.some((m) => m.budgeted || m.applied || m.awarded);

  const header = (
    <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
      <PageHeader
        title="Funding Analytics"
        description="From proposal budgets to grant applications, awards and the active grant portfolio"
        icon={<FundingIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Institution', path: '/institution' },
          { label: 'Analytics', path: '/institution/analytics' },
          { label: 'Funding' },
        ]}
        gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        actionButton={(
          <Tooltip title="Refresh">
            <span>
              <IconButton onClick={() => load(range)} disabled={loading} sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
      />
    </Box>
  );

  const c = data?.current;
  const p = data?.position;

  const sections = data ? [
    { id: 'flow', label: 'Funding flow', icon: <FunnelIcon /> },
    { id: 'trend', label: 'Trend', icon: <TrendIcon /> },
    { id: 'breakdown', label: 'By funder / department', icon: <FunderIcon /> },
    { id: 'portfolio', label: 'Active awards', icon: <PortfolioIcon />, count: data.activePortfolio.length || null },
    { id: 'pipeline', label: 'Applications in progress', icon: <PipelineIcon />, count: data.pipeline.length || null },
    { id: 'gaps', label: 'Approved, not applied', icon: <GapIcon />, count: data.approvedNotApplied.length || null, countTone: data.approvedNotApplied.length ? 'bad' : undefined },
    { id: 'opportunities', label: 'Open opportunities', icon: <OpportunityIcon />, count: data.opportunities.length || null },
  ] : [];

  return (
    <>
      {header}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <AnalyticsRangeBar
          value={range}
          preset={preset}
          institutionName={data?.institution?.name}
          note="Flow figures cover the period. Active awards and applications in progress are as of today."
          onChange={(next, key) => { setPreset(key); setRange(next); }}
        />

        {error ? (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} action={<Button color="inherit" size="small" onClick={() => load(range)}>Retry</Button>}>
            {error}
          </Alert>
        ) : null}

        {data?.otherCurrencies?.length ? (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Amounts are shown in {data.currency}. Proposals budgeted in {data.otherCurrencies.join(', ')} are counted but not included in the totals.
          </Alert>
        ) : null}

        {loading && !data ? (
          <Stack spacing={2}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 2 }}>
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rounded" height={118} />)}
            </Box>
            <Skeleton variant="rounded" height={52} />
            <Skeleton variant="rounded" height={300} />
          </Stack>
        ) : data ? (
          <Stack spacing={3} sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 2 }}>
              <KpiTile label="Budget requested" value={money(c.requestedBudget)} sub={`${c.proposals} proposals`} delta={data.change.requestedBudget} icon={<BudgetIcon />} hint="Total proposed budget of proposals submitted in the period." />
              <KpiTile label="Applied to funders" value={money(c.amountApplied)} sub={`${c.applicationsSubmitted} applications`} delta={data.change.amountApplied} icon={<AppliedIcon />} />
              <KpiTile label="Awarded" value={money(c.amountAwarded)} sub={`${c.awards} awards`} delta={data.change.amountAwarded} icon={<AwardIcon />} tone="good" />
              <KpiTile label="Win rate" value={fmtPct(c.winRate)} sub={`${c.awards} won · ${c.rejections} unsuccessful`} icon={<RateIcon />} tone={c.winRate === null ? 'neutral' : c.winRate >= 30 ? 'good' : 'warn'} hint="Awards divided by decided applications (awarded + rejected) in the period." />
              <KpiTile label="Active awards" value={money(p.activeAwardValue)} sub={`${p.activeAwards} grants running`} icon={<ActiveIcon />} tone="info" hint="Awarded grants that have not yet ended, as of today." />
              <KpiTile label="Awaiting decision" value={money(p.pipelineValue)} sub={`${p.pipelineCount} with funders`} icon={<PipelineIcon />} tone="warn" hint="Applications submitted and still under funder review, as of today." />
            </Box>

            {(p.overdueReports || p.unsignedContracts || data.approvedNotApplied.length) ? (
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                {p.overdueReports ? <Alert severity="error" sx={{ flex: 1, borderRadius: 2 }}>{p.overdueReports} active award{p.overdueReports === 1 ? ' has' : 's have'} an overdue funder report.</Alert> : null}
                {p.unsignedContracts ? <Alert severity="warning" sx={{ flex: 1, borderRadius: 2 }}>{p.unsignedContracts} award contract{p.unsignedContracts === 1 ? ' is' : 's are'} not yet signed.</Alert> : null}
                {data.approvedNotApplied.length ? (
                  <Alert severity="info" sx={{ flex: 1, borderRadius: 2 }} action={<Button color="inherit" size="small" onClick={() => goTo('gaps')}>View</Button>}>
                    {data.approvedNotApplied.length} internally approved proposal{data.approvedNotApplied.length === 1 ? ' has' : 's have'} no external grant application yet.
                  </Alert>
                ) : null}
              </Stack>
            ) : null}

            <SectionNav sections={sections} active={active} onSelect={goTo} />

            <SectionCard id="flow" icon={<FunnelIcon />} title="Funding flow" subtitle="How proposals convert into external funding during the period.">
              <Stack spacing={1.5}>
                {data.funnel.map((f, i) => {
                  const prev = i ? data.funnel[i - 1] : null;
                  const conversion = prev ? pct(f.count, prev.count) : null;
                  return (
                    <Box key={f.stage} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '200px 1fr 160px 110px' }, gap: { xs: 0.5, md: 2 }, alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: INK }}>{f.stage}</Typography>
                      <Box sx={{ height: 30, bgcolor: '#f8fafc', borderRadius: 1, overflow: 'hidden' }}>
                        <Box sx={{ width: `${Math.max(f.count ? 4 : 0, (f.count / funnelMax) * 100)}%`, height: '100%', bgcolor: FUNNEL_COLORS[i], borderRadius: 1, display: 'flex', alignItems: 'center', px: 1.25, transition: 'width 300ms' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: i >= 2 ? 'white' : INK }}>{f.count}</Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: INK, textAlign: { md: 'right' } }}>{money(f.amount, false)}</Typography>
                      <Typography variant="caption" sx={{ color: MUTED, textAlign: { md: 'right' } }}>{conversion === null ? '' : `${conversion}% of previous`}</Typography>
                    </Box>
                  );
                })}
              </Stack>
            </SectionCard>

            <SectionCard id="trend" icon={<TrendIcon />} title="Funding over time" subtitle={`Budgets proposed, amounts applied for and amounts awarded (${data.currency}).`}>
              {hasTrend ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={data.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => money(v)} width={70} />
                    <RTooltip {...chartTooltip} formatter={(v, name) => [money(v, false), name]} />
                    <Legend />
                    <Bar dataKey="budgeted" name="Budget proposed" fill={alpha(PURPLE, 0.35)} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="applied" name="Applied for" fill={PURPLE} radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="awarded" name="Awarded" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <EmptyState>No budgets, applications or awards in this period.</EmptyState>}
            </SectionCard>

            <SectionCard
              id="breakdown"
              icon={<FunderIcon />}
              title={breakdown === 'funder' ? 'By funder' : 'By department'}
              subtitle="Applications and awards in the period."
              action={(
                <ToggleButtonGroup size="small" exclusive value={breakdown} onChange={(_, v) => v && setBreakdown(v)}>
                  <ToggleButton value="funder" sx={{ textTransform: 'none' }}><FunderIcon sx={{ fontSize: 16, mr: 0.5 }} />Funder</ToggleButton>
                  <ToggleButton value="department" sx={{ textTransform: 'none' }}><DeptIcon sx={{ fontSize: 16, mr: 0.5 }} />Department</ToggleButton>
                </ToggleButtonGroup>
              )}
            >
              {(breakdown === 'funder' ? data.byFunder : data.byDepartment).length ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.1fr' }, gap: 3 }}>
                  <ResponsiveContainer width="100%" height={Math.max(220, (breakdown === 'funder' ? data.byFunder : data.byDepartment).slice(0, 8).length * 40)}>
                    <BarChart data={(breakdown === 'funder' ? data.byFunder : data.byDepartment).slice(0, 8)} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => money(v)} />
                      <YAxis type="category" dataKey={breakdown === 'funder' ? 'funder' : 'department'} width={150} tick={{ fontSize: 10 }} />
                      <RTooltip {...chartTooltip} formatter={(v, name) => [money(v, false), name]} />
                      <Legend />
                      {breakdown === 'funder'
                        ? <Bar dataKey="requested" name="Applied for" fill={alpha(PURPLE, 0.45)} radius={[0, 4, 4, 0]} />
                        : <Bar dataKey="budget" name="Budget proposed" fill={alpha(PURPLE, 0.45)} radius={[0, 4, 4, 0]} />}
                      <Bar dataKey="awarded" name="Awarded" fill="#16a34a" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {(breakdown === 'funder'
                            ? ['Funder', 'Applications', 'Awards', 'Win rate', 'Awarded']
                            : ['Department', 'Proposals', 'Applications', 'Awards', 'Awarded']
                          ).map((h, i) => <TableCell key={h} align={i ? 'right' : 'left'} sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem' }}>{h}</TableCell>)}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {breakdown === 'funder'
                          ? data.byFunder.map((f) => (
                            <TableRow key={f.funder} hover>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{f.funder}</TableCell>
                              <TableCell align="right">{f.applications}</TableCell>
                              <TableCell align="right">{f.awards}</TableCell>
                              <TableCell align="right">{fmtPct(f.winRate)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{money(f.awarded)}</TableCell>
                            </TableRow>
                          ))
                          : data.byDepartment.map((d) => (
                            <TableRow key={d.department} hover>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{d.department}</TableCell>
                              <TableCell align="right">{d.proposals}</TableCell>
                              <TableCell align="right">{d.applications}</TableCell>
                              <TableCell align="right">{d.awards}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{money(d.awarded)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : <EmptyState>No funding activity in this period.</EmptyState>}
            </SectionCard>

            <SectionCard id="portfolio" icon={<PortfolioIcon />} title="Active award portfolio" subtitle="Grants awarded and not yet ended, as of today. Click a row to open the proposal.">
              {data.activePortfolio.length ? (
                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#fafafa' }}>
                        {['Grant', 'Funder', 'Award', 'Period', 'Time elapsed', 'Next report', 'Contract'].map((h, i) => (
                          <TableCell key={h} align={i === 2 ? 'right' : 'left'} sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.activePortfolio.map((a) => (
                        <TableRow key={a.id} hover sx={{ cursor: 'pointer' }} onClick={() => openProposal(a.proposalId)}>
                          <TableCell sx={{ maxWidth: 320 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: INK }} noWrap title={a.title}>{a.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{a.principalInvestigator} · {a.department}{a.grantNumber ? ` · ${a.grantNumber}` : ''}</Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.82rem' }}>{a.funder}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatMoney(a.amount, a.currency, false)}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{fmtDate(a.startDate)} – {fmtDate(a.endDate)}</TableCell>
                          <TableCell sx={{ minWidth: 140 }}>
                            {a.elapsed === null ? <Typography variant="caption" color="text.secondary">Dates not set</Typography> : (
                              <>
                                <LinearProgress variant="determinate" value={a.elapsed} sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: a.elapsed > 85 ? '#f59e0b' : PURPLE, borderRadius: 3 } }} />
                                <Typography variant="caption" color="text.secondary">{a.elapsed}% · {a.daysRemaining} days left</Typography>
                              </>
                            )}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {a.nextReport ? (
                              <StatusPill label={`${a.nextReport.type ? `${a.nextReport.type.charAt(0)}${a.nextReport.type.slice(1).toLowerCase()} ` : ''}${fmtDate(a.nextReport.dueDate)}`} tone={a.nextReport.overdue ? 'bad' : 'neutral'} />
                            ) : <Typography variant="caption" color="text.secondary">{a.source === 'tracker' ? 'Not tracked' : 'None due'}</Typography>}
                          </TableCell>
                          <TableCell>
                            {a.contractSigned === null ? <Typography variant="caption" color="text.secondary">Not tracked</Typography> : <StatusPill label={a.contractSigned ? 'Signed' : 'Unsigned'} tone={a.contractSigned ? 'good' : 'warn'} />}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : <EmptyState>No active grant awards yet. Awards recorded in the grant tracker appear here.</EmptyState>}
            </SectionCard>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 3 }}>
              <SectionCard id="pipeline" icon={<PipelineIcon />} title="Applications in progress" subtitle="Being prepared or awaiting a funder decision, as of today.">
                {data.pipeline.length ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {['Application', 'Funder', 'Requested', 'Status'].map((h, i) => (
                            <TableCell key={h} align={i === 2 ? 'right' : 'left'} sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem' }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.pipeline.map((a) => (
                          <TableRow key={a.id} hover sx={{ cursor: 'pointer' }} onClick={() => openProposal(a.proposalId)}>
                            <TableCell sx={{ maxWidth: 260 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={a.title}>{a.title}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {a.principalInvestigator}
                                {a.deadline ? ` · deadline ${fmtDate(a.deadline)}` : ''}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>{a.funder}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatMoney(a.requested, a.currency)}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              <StatusPill label={a.statusLabel} tone={['PREPARING', 'READY_TO_SUBMIT'].includes(a.status) ? 'neutral' : a.status === 'ADDITIONAL_INFO_REQUESTED' ? 'warn' : 'info'} />
                              {a.daysWaiting !== null ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{a.daysWaiting} days with funder</Typography> : null}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : <EmptyState>No grant applications in progress.</EmptyState>}
              </SectionCard>

              <SectionCard id="gaps" icon={<GapIcon />} title="Approved, not yet applied" subtitle="Internally approved proposals with no external grant application recorded.">
                {data.approvedNotApplied.length ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {['Proposal', 'Intended source', 'Budget'].map((h, i) => (
                            <TableCell key={h} align={i === 2 ? 'right' : 'left'} sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem' }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.approvedNotApplied.map((row) => (
                          <TableRow key={row.id} hover sx={{ cursor: 'pointer' }} onClick={() => openProposal(row.id)}>
                            <TableCell sx={{ maxWidth: 300 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={row.title}>{row.title}</Typography>
                              <Typography variant="caption" color="text.secondary">{row.principalInvestigator} · {row.department}</Typography>
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>{row.fundingSource || '—'}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatMoney(row.budget, row.currency)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : <EmptyState>Every approved proposal has a grant application on record.</EmptyState>}
              </SectionCard>
            </Box>

            <SectionCard id="opportunities" icon={<OpportunityIcon />} title="Open funding opportunities" subtitle="From the grants catalogue, soonest deadline first.">
              {data.opportunities.length ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                  {data.opportunities.map((o) => (
                    <Box key={o.id} sx={{ p: 1.75, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', '&:hover': { borderColor: alpha(PURPLE, 0.5) } }}>
                      <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: INK, lineHeight: 1.35 }}>{o.title}</Typography>
                        <StatusPill label={`${o.daysLeft} d left`} tone={o.daysLeft <= 14 ? 'bad' : o.daysLeft <= 45 ? 'warn' : 'neutral'} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {o.funder}{o.country ? ` · ${o.country}` : ''}{o.category ? ` · ${o.category}` : ''}
                      </Typography>
                      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: PURPLE }}>{o.amount ? formatMoney(o.amount, 'USD') : 'Amount varies'}</Typography>
                        <Typography variant="caption" color="text.secondary">Deadline {fmtDate(o.deadline)}</Typography>
                      </Stack>
                    </Box>
                  ))}
                </Box>
              ) : <EmptyState>No open opportunities in the grants catalogue.</EmptyState>}
            </SectionCard>
          </Stack>
        ) : null}
      </Container>
    </>
  );
}

function pct(n, d) {
  return d > 0 ? Math.round((n / d) * 100) : null;
}
