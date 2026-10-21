'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Analytics as AnalyticsIcon,
  AccountBalance as FunderIcon,
  Assignment as ProjectIcon,
  Business as BusinessIcon,
  CheckCircle as CheckIcon,
  ChevronRight as OpenIcon,
  ErrorOutline as AlertIcon,
  Gavel as EthicsIcon,
  HighlightOff as CrossIcon,
  ImageSearch as ImageIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  RemoveCircleOutline as NaIcon,
  School as TrainingIcon,
  TaskAlt as AllClearIcon,
  VerifiedUser as ComplianceIcon,
  WorkspacePremium as CertificateIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
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
} from '@/components/Analytics/AnalyticsUI';
import ReportInsights from '@/components/Analytics/ReportInsights';

const ETHICS_TONE = {
  APPROVED: 'good', CONDITIONAL_APPROVAL: 'info', SUBMITTED: 'warn', UNDER_REVIEW: 'warn', REVISION_REQUESTED: 'warn',
  REJECTED: 'bad', EXPIRED: 'bad', WITHDRAWN: 'neutral', DRAFT: 'neutral',
  approved: 'good', conditional: 'info', not_required: 'neutral', pending: 'warn', revision: 'warn', expired: 'bad', rejected: 'bad', withdrawn: 'neutral', missing: 'bad',
};
const OUTCOME = {
  clean: { tone: 'good', color: '#22c55e' },
  minor: { tone: 'info', color: '#3b82f6' },
  review: { tone: 'bad', color: '#ef4444' },
  in_progress: { tone: 'warn', color: '#f59e0b' },
  failed: { tone: 'neutral', color: '#94a3b8' },
};
const SEVERITY = { high: { tone: 'bad', label: 'High' }, medium: { tone: 'warn', label: 'Medium' }, low: { tone: 'info', label: 'Low' } };
const CHECKS = [['ethics', 'Ethics'], ['dataPlan', 'DMP'], ['consent', 'Consent'], ['dataSecurity', 'Data security'], ['documentation', 'Documents']];
const pretty = (s) => String(s || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

function Check({ value, label }) {
  if (value === null) return <Tooltip title={`${label}: not applicable`}><NaIcon sx={{ fontSize: 18, color: '#cbd5e1' }} /></Tooltip>;
  return value
    ? <Tooltip title={`${label}: in place`}><CheckIcon sx={{ fontSize: 18, color: '#16a34a' }} /></Tooltip>
    : <Tooltip title={`${label}: missing`}><CrossIcon sx={{ fontSize: 18, color: '#dc2626' }} /></Tooltip>;
}

function Gauge({ score, label }) {
  const tone = score === null ? 'neutral' : score >= 85 ? 'good' : score >= 65 ? 'warn' : 'bad';
  return (
    <Box sx={{ position: 'relative', width: 104, height: 104, flexShrink: 0 }}>
      <CircularProgress variant="determinate" value={100} size={104} thickness={4.5} sx={{ color: '#f1f5f9', position: 'absolute' }} />
      <CircularProgress variant="determinate" value={score || 0} size={104} thickness={4.5} sx={{ color: TONES[tone].color, position: 'absolute', '& circle': { strokeLinecap: 'round' } }} />
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.6rem', color: INK, lineHeight: 1 }}>{score === null ? '—' : score}</Typography>
        <Typography variant="caption" sx={{ color: MUTED, fontWeight: 600 }}>{label}</Typography>
      </Box>
    </Box>
  );
}

export default function ResearchComplianceReport() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState('actions');
  const [imageFilter, setImageFilter] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/researcher/analytics/compliance', { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to load compliance report');
      setData(json);
    } catch (err) {
      setError(err.message || 'Failed to load compliance report');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const goTo = (id) => { setActive(id); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  const o = data?.overview;
  const ii = data?.imageIntegrity;
  const submissions = useMemo(() => {
    const list = ii?.submissions || [];
    return imageFilter === 'all' ? list : list.filter((s) => s.outcome === imageFilter);
  }, [ii, imageFilter]);
  const outcomePie = (ii?.outcomeCounts || []).filter((c) => c.count > 0);
  const classBars = Object.entries(ii?.classificationTotals || {}).map(([k, v]) => ({ name: pretty(k), count: v })).sort((a, b) => b.count - a.count);

  const standing = o?.complianceScore === null || o?.complianceScore === undefined ? 'Nothing to assess yet'
    : o.complianceScore >= 85 ? 'In good standing' : o.complianceScore >= 65 ? 'Some items need attention' : 'Action needed';

  const sections = [
    { id: 'actions', label: 'Action required', icon: <AlertIcon />, count: data?.actions?.length || null, countTone: 'bad' },
    { id: 'ethics', label: 'Ethics approvals', icon: <EthicsIcon />, count: data?.ethics?.totalApplications || null },
    { id: 'projects', label: 'Project requirements', icon: <ProjectIcon />, count: data?.projects?.register?.length || null },
    { id: 'image', label: 'Image integrity', icon: <ImageIcon />, count: ii?.totalCases || null },
    { id: 'funder', label: 'Funder obligations', icon: <FunderIcon />, count: data?.funder?.obligations?.length || null, countTone: o?.overdueFunderObligations ? 'bad' : undefined },
    { id: 'training', label: 'Training', icon: <TrainingIcon /> },
  ];

  return (
    <Box sx={{ bgcolor: '#f6f7fb', minHeight: '100vh', pb: 6, '@media print': { bgcolor: 'white' } }}>
      <PageHeader
        title="Research Compliance Report"
        description="Ethics approvals, project requirements, image integrity, funder obligations and training"
        icon={<ComplianceIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher', icon: <BusinessIcon /> },
          { label: 'Analytics', path: '/researcher/analytics', icon: <AnalyticsIcon /> },
          { label: 'Compliance' },
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

        {loading && !data ? (
          <Stack spacing={2}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' }, gap: 2 }}>
              <Skeleton variant="rounded" height={150} />
              <Skeleton variant="rounded" height={150} />
            </Box>
            <Skeleton variant="rounded" height={140} />
            <Skeleton variant="rounded" height={320} />
          </Stack>
        ) : data ? (
          <Stack spacing={3}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 2.2fr' }, gap: 2 }}>
              <Box sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: 'white', display: 'flex', gap: 2.5, alignItems: 'center' }}>
                <Gauge score={o.complianceScore} label="standing" />
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: MUTED, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.68rem' }}>Compliance standing</Typography>
                  <Typography sx={{ fontWeight: 700, color: INK, fontSize: '1.05rem' }}>{standing}</Typography>
                  <Typography variant="body2" sx={{ color: MUTED, mt: 0.5 }}>
                    {o.openActions ? `${o.openActions} item${o.openActions === 1 ? '' : 's'} to address, ${o.highPriorityActions} high priority.` : 'No open compliance items.'}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2 }}>
                <KpiTile label="Ethics approvals" value={o.activeEthicsApprovals} sub={o.expiringSoon || o.expiredApprovals ? `${o.expiredApprovals} expired · ${o.expiringSoon} expiring` : `${o.pendingEthics} pending`} icon={<EthicsIcon />} tone={o.expiredApprovals ? 'bad' : o.expiringSoon ? 'warn' : 'good'} />
                <KpiTile label="Project requirements" value={fmtPct(o.projectComplianceScore)} sub={`${o.projects} project${o.projects === 1 ? '' : 's'} checked`} icon={<ProjectIcon />} tone={o.projectComplianceScore === null ? 'neutral' : o.projectComplianceScore >= 85 ? 'good' : 'warn'} hint="Average share of requirements met: ethics, DMP, consent, data security, documentation." />
                <KpiTile label="Image integrity" value={o.imageSubmissions} sub={o.imagesNeedingReview ? `${o.imagesNeedingReview} need review` : o.imageIntegrityCleanRate !== null ? `${Math.round(o.imageIntegrityCleanRate)}% clean` : 'no completed checks'} icon={<ImageIcon />} tone={o.imagesNeedingReview ? 'bad' : 'good'} />
                <KpiTile label="Funder obligations" value={o.funderObligations} sub={o.overdueFunderObligations ? `${o.overdueFunderObligations} overdue` : `due in ${data.thresholds.obligationWindowDays} days`} icon={<FunderIcon />} tone={o.overdueFunderObligations ? 'bad' : o.funderObligations ? 'warn' : 'good'} />
                <KpiTile label="Training" value={fmtPct(o.trainingCompletionRate === null ? null : Math.round(o.trainingCompletionRate))} sub={`${o.certificatesHeld} certificate${o.certificatesHeld === 1 ? '' : 's'}`} icon={<TrainingIcon />} tone={o.overdueTrainings ? 'warn' : 'good'} />
              </Box>
            </Box>

            <ReportInsights endpoint="/api/researcher/analytics/compliance/insights" />

            <SectionNav sections={sections} active={active} onSelect={goTo} />

            <SectionCard id="actions" icon={<AlertIcon />} title="Action required" subtitle="Generated from your current records, most urgent first.">
              {data.actions.length ? (
                <Stack spacing={1.25}>
                  {data.actions.map((a, i) => {
                    const sev = SEVERITY[a.severity] || SEVERITY.low;
                    const t = TONES[sev.tone];
                    return (
                      <Box key={i} sx={{ p: 1.75, borderRadius: 1.5, border: `1px solid ${t.border}`, borderLeft: `4px solid ${t.color}`, bgcolor: 'white' }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
                          <StatusPill label={sev.label} tone={sev.tone} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: INK }}>{a.title}</Typography>
                            <Typography variant="caption" sx={{ color: MUTED }}>{a.detail}</Typography>
                            {a.items?.length ? (
                              <Typography variant="caption" sx={{ display: 'block', color: INK, mt: 0.25 }}>{a.items.join(' · ')}</Typography>
                            ) : null}
                          </Box>
                          {a.link ? (
                            <Button size="small" endIcon={<OpenIcon />} onClick={() => router.push(a.link)} sx={{ textTransform: 'none', fontWeight: 700, color: t.color, whiteSpace: 'nowrap' }} className="no-print">
                              Go to
                            </Button>
                          ) : null}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 2, borderRadius: 1.5, bgcolor: TONES.good.bg, border: `1px solid ${TONES.good.border}` }}>
                  <AllClearIcon sx={{ color: TONES.good.color }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: TONES.good.color }}>Nothing needs your attention right now.</Typography>
                </Stack>
              )}
            </SectionCard>

            <SectionCard id="ethics" icon={<EthicsIcon />} title="Ethics approvals" subtitle={data.ethics.totalApplications ? `${data.ethics.totalApplications} application${data.ethics.totalApplications === 1 ? '' : 's'}${o.avgEthicsTurnaroundDays !== null ? ` · average ${o.avgEthicsTurnaroundDays} days from submission to decision` : ''}` : 'Your ethics and IRB applications.'}>
              {data.ethics.register.length ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '2fr 1fr' }, gap: 3 }}>
                  <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                          {['Application', 'Status', 'Risk', 'Approved', 'Expires'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem' }}>{h}</TableCell>)}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.ethics.register.map((e) => (
                          <TableRow key={e.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/researcher/ethics/applications/view/${e.id}`)}>
                            <TableCell sx={{ maxWidth: 320 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={e.title}>{e.title}</Typography>
                              <Typography variant="caption" sx={{ color: MUTED }}>{[e.reference, e.committee].filter(Boolean).join(' · ') || '—'}</Typography>
                            </TableCell>
                            <TableCell><StatusPill label={pretty(e.statusLabel)} tone={ETHICS_TONE[e.status] || 'neutral'} /></TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>{e.riskLevel ? pretty(e.riskLevel) : '—'}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{fmtDate(e.approvalDate)}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {e.expiryDate ? (
                                <StatusPill label={e.daysToExpiry < 0 ? `Expired ${fmtDate(e.expiryDate)}` : e.daysToExpiry <= data.thresholds.expiryWindowDays ? `${e.daysToExpiry} d left` : fmtDate(e.expiryDate)} tone={e.daysToExpiry < 0 ? 'bad' : e.daysToExpiry <= data.thresholds.expiryWindowDays ? 'warn' : 'neutral'} />
                              ) : <Typography variant="caption" sx={{ color: '#cbd5e1' }}>—</Typography>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Data protection</Typography>
                    <MetricBar label="Data anonymised" value={data.dataProtection.anonymizationRate === null ? null : Math.round(data.dataProtection.anonymizationRate)} caption={`${data.dataProtection.anonymizationCount} of ${data.dataProtection.totalApplications} applications`} />
                    <Stack direction="row" spacing={1.5}>
                      {[['Consent waivers', data.dataProtection.consentWaiverCount], ['Vulnerable populations', data.dataProtection.vulnerablePopulationCount]].map(([l, v]) => (
                        <Box key={l} sx={{ flex: 1, p: 1.5, borderRadius: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <Typography variant="caption" sx={{ color: MUTED, fontWeight: 700 }}>{l}</Typography>
                          <Typography sx={{ fontWeight: 800, color: INK }}>{v}</Typography>
                        </Box>
                      ))}
                    </Stack>
                    {data.ethics.riskLevelCounts.length ? (
                      <Box>
                        <Typography variant="caption" sx={{ color: MUTED, fontWeight: 700 }}>Risk profile</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                          {data.ethics.riskLevelCounts.map((r) => <StatusPill key={r.level} label={`${pretty(r.level)}: ${r.count}`} tone={r.level === 'HIGH' ? 'bad' : r.level === 'MODERATE' ? 'warn' : 'neutral'} />)}
                        </Stack>
                      </Box>
                    ) : null}
                  </Stack>
                </Box>
              ) : <EmptyState>No ethics applications yet.</EmptyState>}
            </SectionCard>

            <SectionCard id="projects" icon={<ProjectIcon />} title="Project requirements" subtitle="Each project you lead or co-investigate, checked against institutional requirements. The marker shows the 90% target.">
              {data.projects.register.length ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 2fr' }, gap: 3 }}>
                  <Stack spacing={2}>
                    {data.projects.requirementCoverage.map((r) => (
                      <MetricBar key={r.key} label={r.label} value={r.rate} target={90} caption={r.applicable ? `${r.met} of ${r.applicable} projects` : 'Not applicable'} />
                    ))}
                  </Stack>
                  <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                          <TableCell sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem' }}>Project</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem' }}>Ethics</TableCell>
                          {CHECKS.map(([k, l]) => <TableCell key={k} align="center" sx={{ fontWeight: 700, color: MUTED, fontSize: '0.7rem' }}>{l}</TableCell>)}
                          <TableCell align="right" sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem' }}>Score</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.projects.register.map((r) => {
                          const tone = r.score >= 85 ? 'good' : r.score >= 65 ? 'warn' : 'bad';
                          return (
                            <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/researcher/projects/proposals/view/${r.id}`)}>
                              <TableCell sx={{ maxWidth: 280 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={r.title}>{r.title}</Typography>
                                <Typography variant="caption" sx={{ color: MUTED }}>{r.role} · {pretty(r.proposalStatus)}</Typography>
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}><StatusPill label={r.ethicsLabel} tone={ETHICS_TONE[r.ethics] || 'neutral'} /></TableCell>
                              {CHECKS.map(([k, l]) => <TableCell key={k} align="center"><Check value={r.checks[k]} label={l} /></TableCell>)}
                              <TableCell align="right"><Typography sx={{ fontWeight: 800, color: TONES[tone].color }}>{r.score}</Typography></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : <EmptyState>No submitted proposals where you are PI or co-investigator.</EmptyState>}
            </SectionCard>

            <SectionCard
              id="image"
              icon={<ImageIcon />}
              title="Image integrity reports"
              subtitle="Every figure set you have submitted for integrity screening, with the analysis outcome. Open a submission for the full report."
              action={(
                <Button size="small" variant="outlined" onClick={() => router.push('/researcher/image-integrity')} sx={{ textTransform: 'none', fontWeight: 700, color: '#6d5499', borderColor: alpha(PURPLE, 0.5) }} className="no-print">
                  New submission
                </Button>
              )}
            >
              {ii.totalCases ? (
                <Stack spacing={2.5}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 1.2fr' }, gap: 3, alignItems: 'center' }}>
                    <Box>
                      <ResponsiveContainer width="100%" height={170}>
                        <PieChart>
                          <Pie data={outcomePie} dataKey="count" nameKey="label" innerRadius={48} outerRadius={72} paddingAngle={2}>
                            {outcomePie.map((c) => <Cell key={c.key} fill={OUTCOME[c.key].color} />)}
                          </Pie>
                          <RTooltip {...chartTooltip} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                    <Stack spacing={0.75}>
                      {(ii.outcomeCounts || []).map((c) => (
                        <Stack key={c.key} direction="row" alignItems="center" spacing={1}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: OUTCOME[c.key].color }} />
                          <Typography variant="body2" sx={{ flex: 1 }}>{c.label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.count}</Typography>
                        </Stack>
                      ))}
                      <Typography variant="caption" sx={{ color: MUTED, pt: 0.5 }}>
                        {ii.completedCases} analysed · {ii.imagesAnalysed} images screened{ii.cleanRate !== null ? ` · ${Math.round(ii.cleanRate)}% clean` : ''}
                      </Typography>
                    </Stack>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Images by type</Typography>
                      {classBars.length ? (
                        <ResponsiveContainer width="100%" height={Math.max(120, classBars.length * 28)}>
                          <BarChart data={classBars} layout="vertical" margin={{ left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                            <RTooltip {...chartTooltip} />
                            <Bar dataKey="count" name="Images" fill={PURPLE} radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : <Typography variant="caption" sx={{ color: MUTED }}>Image classification appears once analyses complete.</Typography>}
                    </Box>
                  </Box>

                  <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Submissions ({submissions.length})</Typography>
                    <ToggleButtonGroup size="small" exclusive value={imageFilter} onChange={(_, v) => v && setImageFilter(v)} sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600 } }} className="no-print">
                      <ToggleButton value="all">All</ToggleButton>
                      <ToggleButton value="review">Needs review</ToggleButton>
                      <ToggleButton value="minor">Minor</ToggleButton>
                      <ToggleButton value="clean">Clean</ToggleButton>
                      <ToggleButton value="in_progress">In progress</ToggleButton>
                      <ToggleButton value="failed">Failed</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                  {submissions.length ? (
                    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#fafafa' }}>
                            {['Submission', 'Submitted', 'Outcome', 'Manipulation', 'Similarity (H / M / L)', 'Images', ''].map((h, i) => (
                              <TableCell key={h || i} align={i >= 3 && i <= 5 ? 'right' : 'left'} sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem' }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {submissions.map((s) => {
                            const lvl = s.similarityLevel || {};
                            return (
                              <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/researcher/image-integrity/${s.id}`)}>
                                <TableCell sx={{ maxWidth: 300 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={s.title}>{s.title}</Typography>
                                  <Typography variant="caption" sx={{ color: MUTED }} noWrap>
                                    {[s.fileName, s.collection, s.doi, s.comparedGlobalRepository ? 'compared with global repository' : null].filter(Boolean).join(' · ')}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                  {fmtDate(s.submittedAt)}
                                  {s.turnaroundHours !== null ? <Typography variant="caption" sx={{ color: MUTED, display: 'block' }}>analysed in {s.turnaroundHours < 1 ? '<1' : s.turnaroundHours} h</Typography> : null}
                                </TableCell>
                                <TableCell sx={{ minWidth: 140 }}>
                                  <StatusPill label={s.outcomeLabel} tone={OUTCOME[s.outcome].tone} />
                                  {s.outcome === 'in_progress' ? <LinearProgress variant="determinate" value={s.progress} sx={{ mt: 0.75, height: 4, borderRadius: 2 }} /> : null}
                                  {s.errorMessage ? <Typography variant="caption" sx={{ color: '#b91c1c', display: 'block' }} noWrap title={s.errorMessage}>{s.errorMessage}</Typography> : null}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: s.manipulationCount ? '#b91c1c' : INK }}>{s.manipulationCount ?? '—'}</TableCell>
                                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                  {s.similarityCount === null ? '—' : (
                                    <>
                                      <Box component="span" sx={{ fontWeight: 800 }}>{s.similarityCount}</Box>
                                      <Typography component="span" variant="caption" sx={{ color: MUTED, ml: 0.75 }}>
                                        <Box component="span" sx={{ color: Number(lvl.high) ? '#b91c1c' : 'inherit', fontWeight: Number(lvl.high) ? 700 : 400 }}>{lvl.high ?? 0}</Box> / {lvl.medium ?? 0} / {lvl.low ?? 0}
                                      </Typography>
                                    </>
                                  )}
                                </TableCell>
                                <TableCell align="right">{s.croppedAmount ?? '—'}</TableCell>
                                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                  <Typography variant="caption" sx={{ color: '#6d5499', fontWeight: 700 }}>View report</Typography>
                                  <OpenIcon sx={{ fontSize: 16, color: '#6d5499', verticalAlign: 'middle' }} />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : <EmptyState>No submissions with this outcome.</EmptyState>}
                  <Typography variant="caption" sx={{ color: MUTED }}>
                    &quot;Needs review&quot; means possible manipulation or high similarity was detected. It is a signal to check, not a finding of misconduct.
                  </Typography>
                </Stack>
              ) : <EmptyState>No image integrity submissions yet. Screen figures before submitting a manuscript.</EmptyState>}
            </SectionCard>

            <SectionCard id="funder" icon={<FunderIcon />} title="Funder obligations" subtitle={`Grant reports and milestones overdue or due within ${data.thresholds.obligationWindowDays} days, plus unsigned award contracts.`}>
              {data.funder.obligations.length ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {['Obligation', 'Grant', 'Due', 'Status'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem' }}>{h}</TableCell>)}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.funder.obligations.map((ob, i) => (
                        <TableRow key={i} hover sx={{ cursor: ob.proposalId ? 'pointer' : 'default' }} onClick={() => ob.proposalId && router.push(`/researcher/projects/proposals/view/${ob.proposalId}`)}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{ob.item}</Typography>
                            <Typography variant="caption" sx={{ color: MUTED }}>{ob.kind}</Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>{ob.grant}<Typography variant="caption" sx={{ color: MUTED, display: 'block' }}>{ob.funder}</Typography></TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{fmtDate(ob.dueDate)}</TableCell>
                          <TableCell><StatusPill label={ob.daysUntilDue === null ? 'Action needed' : ob.overdue ? `${Math.abs(ob.daysUntilDue)} d overdue` : `Due in ${ob.daysUntilDue} d`} tone={ob.overdue ? 'bad' : 'warn'} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : <EmptyState>No funder reports or grant milestones due in the next {data.thresholds.obligationWindowDays} days.</EmptyState>}
            </SectionCard>

            <SectionCard id="training" icon={<TrainingIcon />} title="Training and certification" subtitle={data.training.totalRegistrations ? `${data.training.totalRegistrations} registration${data.training.totalRegistrations === 1 ? '' : 's'}` : 'Research integrity and compliance training.'}>
              {data.training.totalRegistrations ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
                  <Stack spacing={1.5}>
                    <MetricBar label="Completion rate" value={data.training.completionRate === null ? null : Math.round(data.training.completionRate)} caption={data.training.statusCounts.map((s) => `${s.count} ${s.status.toLowerCase()}`).join(' · ')} />
                    {data.training.overdueTrainings.length ? (
                      <Box>
                        <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 700 }}>Not completed after end date</Typography>
                        {data.training.overdueTrainings.map((t, i) => <Typography key={i} variant="body2" sx={{ fontSize: '0.82rem' }}>{t.title} · ended {fmtDate(t.endDate)}</Typography>)}
                      </Box>
                    ) : null}
                  </Stack>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Certificates held</Typography>
                    {data.training.certificates?.length ? (
                      <Stack spacing={0.75}>
                        {data.training.certificates.map((c) => (
                          <Stack key={c.id} direction="row" spacing={1} alignItems="center">
                            <CertificateIcon sx={{ fontSize: 18, color: '#16a34a' }} />
                            <Typography variant="body2" sx={{ flex: 1, fontSize: '0.82rem' }} noWrap>{c.title}</Typography>
                            <Typography variant="caption" sx={{ color: MUTED }}>{fmtDate(c.issuedAt)}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    ) : <Typography variant="body2" sx={{ color: MUTED }}>No certificates yet.</Typography>}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Upcoming</Typography>
                    {data.training.upcomingTrainings.length ? (
                      <Stack spacing={0.75}>
                        {data.training.upcomingTrainings.map((t, i) => (
                          <Stack key={i} direction="row" spacing={1} justifyContent="space-between">
                            <Typography variant="body2" sx={{ fontSize: '0.82rem' }} noWrap>{t.title}</Typography>
                            <Typography variant="caption" sx={{ color: MUTED, whiteSpace: 'nowrap' }}>{fmtDate(t.startDate)}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    ) : <Typography variant="body2" sx={{ color: MUTED }}>Nothing scheduled.</Typography>}
                  </Box>
                </Box>
              ) : (
                <Stack direction="row" spacing={2} alignItems="center">
                  <EmptyState height={100}>No training registrations yet.</EmptyState>
                  <Button variant="outlined" onClick={() => router.push('/researcher/training')} sx={{ textTransform: 'none', fontWeight: 700, color: '#6d5499', borderColor: alpha(PURPLE, 0.5), whiteSpace: 'nowrap' }} className="no-print">Browse training</Button>
                </Stack>
              )}
            </SectionCard>

            <Typography variant="caption" sx={{ color: MUTED }}>
              Report generated {new Date(data.meta.generatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}. The standing score averages the share of applicable checks met across projects, ethics approvals, image integrity and training.
            </Typography>
          </Stack>
        ) : null}
      </Container>
    </Box>
  );
}
