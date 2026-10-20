'use client';

/**
 * Dashboards & Reports on /institution/analytics.
 * All figures come from GET /api/institution/analytics/reports (live, scoped to
 * the logged-in institution, filtered by the page's date range). Comparisons are
 * against the previous period of equal length; nothing here is mock data.
 */

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Chip,
  alpha,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
} from '@mui/material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import {
  Assessment as AssessmentIcon,
  FormatQuote as CitationIcon,
  Timeline as PipelineIcon,
  School as FacultyIcon,
  MenuBook as PublicationTypeIcon,
  Download as DownloadIcon,
  CheckCircle as BetterIcon,
  Warning as WorseIcon,
  RemoveCircleOutline as NeutralIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { generateInstitutionReportPdf } from '@/utils/generateInstitutionReportPdf';

const PURPLE = '#8b6cbc';
const COLORS = ['#8b6cbc', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#0891b2', '#ec4899', '#84cc16'];

export const REPORT_CATALOG = [
  {
    id: 'institute-performance',
    title: 'Institute performance report',
    description: 'Where the institute is doing better or worse in research output across publications, manuscripts and proposals.',
  },
  {
    id: 'citation-tracking',
    title: 'Citation tracking',
    description: 'Citations and h-index per researcher, alongside who is most active this period.',
  },
  {
    id: 'work-status',
    title: 'Work-status report',
    description: 'Pipeline of manuscripts and project proposals by status, with conversion rates.',
  },
  {
    id: 'publications-faculty',
    title: 'Output by faculty / research area',
    description: 'Publications, manuscripts and proposals broken down by department and research area.',
  },
  {
    id: 'publication-type',
    title: 'Performance by publication type',
    description: 'Published output and work in progress by type, with DOI coverage and top journals.',
  },
];

const REPORT_ICONS = {
  'institute-performance': <AssessmentIcon />,
  'citation-tracking': <CitationIcon />,
  'work-status': <PipelineIcon />,
  'publications-faculty': <FacultyIcon />,
  'publication-type': <PublicationTypeIcon />,
};

const ChartTooltipStyle = {
  contentStyle: {
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    fontSize: 12,
  },
};

const fmtPct = (value) => (value === null || value === undefined ? '—' : `${value}%`);
const fmtChange = (value) => (value === null || value === undefined ? null : `${value > 0 ? '+' : ''}${value}%`);

const ReportCard = ({ icon, title, subtitle, action, children, id }) => (
  <Paper id={id} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
    <Box
      sx={{
        px: 3,
        py: 2.5,
        background: `linear-gradient(135deg, ${alpha(PURPLE, 0.04)} 0%, ${alpha(PURPLE, 0.08)} 100%)`,
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(PURPLE, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: PURPLE, flexShrink: 0 }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2937', lineHeight: 1.3 }}>{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 620 }}>{subtitle}</Typography>
          )}
        </Box>
      </Box>
      {action}
    </Box>
    <Box sx={{ p: 3 }}>{children}</Box>
  </Paper>
);

const EmptyState = ({ children = 'No activity recorded in this period.' }) => (
  <Box sx={{ py: 5, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2, bgcolor: '#fafafa' }}>
    <Typography variant="body2" color="text.secondary">{children}</Typography>
  </Box>
);

const NotCaptured = ({ items }) => (items?.length ? (
  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
    <InfoIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
    <Typography variant="caption" color="text.secondary">Not captured yet:</Typography>
    {items.map((item) => (
      <Chip key={item} label={item} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.68rem', color: '#64748b' }} />
    ))}
  </Stack>
) : null);

const DownloadButton = ({ reportId, title, data, size = 'small' }) => {
  const [downloading, setDownloading] = useState(false);
  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateInstitutionReportPdf(reportId, title, data);
    } finally {
      setDownloading(false);
    }
  };
  return (
    <Button
      variant="outlined"
      size={size}
      startIcon={<DownloadIcon />}
      disabled={downloading || !data}
      onClick={handleDownload}
      sx={{ borderColor: PURPLE, color: PURPLE, fontWeight: 600, whiteSpace: 'nowrap', '&:hover': { borderColor: '#7b5ca7', bgcolor: alpha(PURPLE, 0.06) } }}
    >
      {downloading ? 'Generating…' : 'Download PDF'}
    </Button>
  );
};

const statusIcon = (status) => {
  if (status === 'better') return <BetterIcon sx={{ fontSize: 16, color: '#22c55e' }} />;
  if (status === 'worse') return <WorseIcon sx={{ fontSize: 16, color: '#f59e0b' }} />;
  return <NeutralIcon sx={{ fontSize: 16, color: '#94a3b8' }} />;
};
const statusChipSx = (status) => ({
  height: 20,
  fontSize: '0.65rem',
  fontWeight: 700,
  bgcolor: status === 'better' ? alpha('#22c55e', 0.12) : status === 'worse' ? alpha('#f59e0b', 0.12) : '#f1f5f9',
  color: status === 'better' ? '#16a34a' : status === 'worse' ? '#d97706' : '#64748b',
});
const statusLabel = (status) => (status === 'better' ? 'Improving' : status === 'worse' ? 'Declining' : 'No comparison');

// ---------------------------------------------------------------- 1
function InstitutePerformanceReport({ data }) {
  const [metric, setMetric] = useState('total');
  const [activeInsight, setActiveInsight] = useState(null);
  const perf = data.performance;
  const prevKey = { total: 'prevTotal', publications: 'prevPublications', manuscripts: 'prevManuscripts', proposals: 'prevProposals' }[metric];
  const hasOutput = perf.monthlyOutput.some((row) => row.total > 0 || row.prevTotal > 0);

  return (
    <ReportCard
      id="institute-performance"
      icon={REPORT_ICONS['institute-performance']}
      title="Institute performance report"
      subtitle="Research output across publications, manuscripts and project proposals, compared with the previous period of the same length."
      action={<DownloadButton reportId="institute-performance" title="Institute Performance Report" data={data} />}
    >
      <Stack spacing={3}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 1.5 }}>
          {perf.insights.map((item) => (
            <Paper
              key={item.area}
              elevation={0}
              onClick={() => setActiveInsight(activeInsight === item.area ? null : item.area)}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '2px solid',
                borderColor: activeInsight === item.area ? PURPLE : '#e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s',
                bgcolor: activeInsight === item.area ? alpha(PURPLE, 0.04) : 'white',
                '&:hover': { borderColor: alpha(PURPLE, 0.5), transform: 'translateY(-2px)' },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                {statusIcon(item.status)}
                <Chip label={statusLabel(item.status)} size="small" sx={statusChipSx(item.status)} />
              </Stack>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.25 }}>{item.area}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1f2937', lineHeight: 1.2, mb: 0.75 }}>
                {item.value === null ? '—' : item.area.includes('time') ? `${item.value} d` : item.score !== null ? `${item.value}%` : item.value}
                {item.changePct !== undefined && item.changePct !== null ? (
                  <Typography component="span" variant="caption" sx={{ ml: 0.75, fontWeight: 700, color: item.changePct >= 0 ? '#16a34a' : '#d97706' }}>
                    {fmtChange(item.changePct)}
                  </Typography>
                ) : null}
              </Typography>
              {item.score !== null ? (
                <LinearProgress
                  variant="determinate"
                  value={item.score}
                  sx={{ height: 6, borderRadius: 3, mb: 1, bgcolor: alpha(PURPLE, 0.1), '& .MuiLinearProgress-bar': { bgcolor: item.score >= 70 ? '#22c55e' : item.score >= 50 ? PURPLE : '#f59e0b', borderRadius: 3 } }}
                />
              ) : null}
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', lineHeight: 1.4, display: 'block' }}>
                {item.detail}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 3 }}>
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={1} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Research output trend</Typography>
              <ToggleButtonGroup size="small" value={metric} exclusive onChange={(_, v) => v && setMetric(v)}>
                <ToggleButton value="total">All</ToggleButton>
                <ToggleButton value="publications">Publications</ToggleButton>
                <ToggleButton value="manuscripts">Manuscripts</ToggleButton>
                <ToggleButton value="proposals">Proposals</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            {hasOutput ? (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={perf.monthlyOutput}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <RTooltip {...ChartTooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey={metric} fill={alpha(PURPLE, 0.2)} stroke={PURPLE} strokeWidth={2} name="This period" />
                  <Line type="monotone" dataKey={prevKey} stroke="#94a3b8" strokeDasharray="5 5" dot={false} name="Previous period" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>This period vs previous period</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={perf.comparison} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="metric" width={120} tick={{ fontSize: 11 }} />
                <RTooltip {...ChartTooltipStyle} />
                <Legend />
                <Bar dataKey="current" name="This period" fill={PURPLE} radius={[0, 4, 4, 0]} />
                <Bar dataKey="previous" name="Previous period" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <Typography variant="caption" color="text.secondary">
              {perf.perResearcher.outputs} outputs per researcher (previous period: {perf.perResearcher.previousOutputs}).
            </Typography>
          </Box>
        </Box>
      </Stack>
    </ReportCard>
  );
}

// ---------------------------------------------------------------- 2
function CitationTrackingReport({ data }) {
  const [selected, setSelected] = useState(null);
  const c = data.citations;
  const hasCitations = c.byResearcher.some((r) => r.citations > 0 || r.hIndex > 0);
  const active = selected ? c.mostActive.filter((r) => r.name === selected) : c.mostActive;

  return (
    <ReportCard
      id="citation-tracking"
      icon={REPORT_ICONS['citation-tracking']}
      title="Citation tracking"
      subtitle="Total citations and h-index from researcher profiles. Click a bar to focus on one researcher."
      action={<DownloadButton reportId="citation-tracking" title="Citation Tracking Report" data={data} />}
    >
      <Stack spacing={2.5}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
          {[
            ['Total citations', c.totals.citations.toLocaleString()],
            ['Average h-index', c.totals.averageHIndex],
            ['Researchers with citation data', `${c.totals.researchersWithProfiles} of ${c.totals.researchers}`],
            ['Researchers active this period', c.mostActive.length],
          ].map(([label, value]) => (
            <Paper key={label} elevation={0} sx={{ p: 1.75, borderRadius: 2, border: '1px solid #e5e7eb' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: PURPLE }}>{value}</Typography>
            </Paper>
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Citations by researcher</Typography>
            {hasCitations ? (
              <ResponsiveContainer width="100%" height={Math.max(220, c.byResearcher.length * 32)}>
                <BarChart data={c.byResearcher} layout="vertical" margin={{ left: 10 }} onClick={(e) => { if (e?.activeLabel) setSelected(e.activeLabel); }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} />
                  <RTooltip {...ChartTooltipStyle} formatter={(value, name) => [value, name === 'citations' ? 'Total citations' : 'h-index']} />
                  <Bar dataKey="citations" radius={[0, 4, 4, 0]} cursor="pointer">
                    {c.byResearcher.map((entry, i) => (
                      <Cell key={entry.id} fill={selected === entry.name ? '#6d5499' : COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState>No citation counts on researcher profiles yet. They fill in when researchers sync ORCID or Google Scholar.</EmptyState>
            )}
            {selected && (
              <Button size="small" onClick={() => setSelected(null)} sx={{ mt: 1, color: PURPLE }}>Clear filter: {selected}</Button>
            )}
          </Box>

          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>h-index distribution</Typography>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={c.hIndexDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <RTooltip {...ChartTooltipStyle} formatter={(v) => [v, 'Researchers']} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Most active researchers this period {selected ? `(${selected})` : ''}
              </Typography>
              {active.length ? (
                <Stack spacing={1}>
                  {active.map((r, i) => (
                    <Paper key={r.id} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e5e7eb', '&:hover': { borderColor: PURPLE } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }} noWrap>
                            <Box component="span" sx={{ color: PURPLE, mr: 0.75 }}>#{i + 1}</Box>{r.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {r.department} · {r.publications} pubs · {r.manuscripts} manuscripts · {r.proposals} proposals
                          </Typography>
                        </Box>
                        <Chip label={`${r.citations} cites · h${r.hIndex}`} size="small" sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 700 }} />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              ) : <EmptyState>No researcher output recorded in this period.</EmptyState>}
            </Box>
          </Stack>
        </Box>
        <NotCaptured items={c.notCaptured} />
      </Stack>
    </ReportCard>
  );
}

// ---------------------------------------------------------------- 3
const COMBINED_GROUPS = [
  { key: 'draft', status: 'Draft', color: '#94a3b8', manuscripts: ['DRAFT'], proposals: ['DRAFT'] },
  { key: 'review', status: 'In review', color: '#8b6cbc', manuscripts: ['IN_REVIEW'], proposals: ['SUBMITTED', 'UNDER_REVIEW'] },
  { key: 'revision', status: 'Revision', color: '#f59e0b', manuscripts: ['UNDER_REVISION'], proposals: ['REVISION_REQUESTED'] },
  { key: 'complete', status: 'Published / Approved', color: '#22c55e', manuscripts: ['PUBLISHED'], proposals: ['APPROVED'] },
  { key: 'closed', status: 'Archived / Rejected', color: '#64748b', manuscripts: ['ARCHIVED'], proposals: ['REJECTED'] },
];

function buildCombined(ws) {
  const countOf = (pipeline, keys) => pipeline.filter((p) => keys.includes(p.key)).reduce((s, p) => s + p.count, 0);
  const pipeline = COMBINED_GROUPS.map((g) => ({
    key: g.key,
    status: g.status,
    color: g.color,
    count: countOf(ws.manuscripts.pipeline, g.manuscripts) + countOf(ws.proposals.pipeline, g.proposals),
  }));
  const trend = ws.manuscripts.trend.map((row, i) => {
    const prow = ws.proposals.trend[i] || {};
    const out = { month: row.month };
    COMBINED_GROUPS.forEach((g) => {
      out[g.key] = g.manuscripts.reduce((s, k) => s + (row[k] || 0), 0) + g.proposals.reduce((s, k) => s + (prow[k] || 0), 0);
    });
    return out;
  });
  return {
    total: ws.manuscripts.total + ws.proposals.total,
    pipeline,
    trend,
    series: COMBINED_GROUPS.map((g) => ({ key: g.key, label: g.status, color: g.color })),
    conversion: [...ws.manuscripts.conversion.slice(0, 2).map((c) => ({ ...c, stage: `Manuscripts: ${c.stage}` })), ...ws.proposals.conversion.slice(0, 2).map((c) => ({ ...c, stage: `Proposals: ${c.stage}` }))],
  };
}

function WorkStatusReport({ data }) {
  const [source, setSource] = useState('manuscripts');
  const [view, setView] = useState('pipeline');
  const ws = data.workStatus;
  const combined = useMemo(() => buildCombined(ws), [ws]);
  const current = source === 'combined' ? combined : ws[source];
  const nonZero = current.pipeline.filter((p) => p.count > 0);
  const maxCount = Math.max(1, ...current.pipeline.map((p) => p.count));
  const noun = source === 'manuscripts' ? 'manuscripts' : source === 'proposals' ? 'proposals' : 'items';

  return (
    <ReportCard
      id="work-status"
      icon={REPORT_ICONS['work-status']}
      title="Work-status report"
      subtitle="Manuscripts and project proposals started in this period, by their current status."
      action={<DownloadButton reportId="work-status" title="Work Status Report" data={data} />}
    >
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
          <ToggleButtonGroup
            size="small"
            value={source}
            exclusive
            onChange={(_, v) => v && setSource(v)}
            sx={{ '& .Mui-selected': { bgcolor: `${alpha(PURPLE, 0.14)} !important`, color: `${PURPLE} !important`, fontWeight: 700 } }}
          >
            <ToggleButton value="manuscripts">Manuscripts ({ws.manuscripts.total})</ToggleButton>
            <ToggleButton value="proposals">Proposals ({ws.proposals.total})</ToggleButton>
            <ToggleButton value="combined">Combined ({combined.total})</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup size="small" value={view} exclusive onChange={(_, v) => v && setView(v)}>
            <ToggleButton value="pipeline">Current pipeline</ToggleButton>
            <ToggleButton value="trend">Trend</ToggleButton>
            <ToggleButton value="conversion">Conversion rates</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {current.total === 0 ? <EmptyState>No {noun} started in this period.</EmptyState> : null}

        {current.total > 0 && view === 'pipeline' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.2fr' }, gap: 3, alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={nonZero} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {nonZero.map((entry) => <Cell key={entry.key} fill={entry.color} />)}
                </Pie>
                <RTooltip {...ChartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <Stack spacing={1.5}>
              {current.pipeline.map((item) => (
                <Box key={item.key}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.status}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: item.color }}>{item.count}</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(item.count / maxCount) * 100}
                    sx={{ height: 8, borderRadius: 4, bgcolor: alpha(item.color, 0.15), '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 4 } }}
                  />
                </Box>
              ))}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {current.total} {noun} in this period
                {source === 'proposals' && ws.proposals.medianDecisionDays !== null ? ` · median ${ws.proposals.medianDecisionDays} days to decision` : ''}
              </Typography>
            </Stack>
          </Box>
        )}

        {current.total > 0 && view === 'trend' && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={current.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <RTooltip {...ChartTooltipStyle} />
              <Legend />
              {current.series.map((s, i) => (
                <Bar key={s.key} dataKey={s.key} stackId="a" fill={s.color} name={s.label} radius={i === current.series.length - 1 ? [4, 4, 0, 0] : 0} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

        {current.total > 0 && view === 'conversion' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${Math.min(current.conversion.length, 4)}, 1fr)` }, gap: 2 }}>
            {current.conversion.map((item) => {
              const better = item.rate === null || item.previous === null ? null : item.lowerIsBetter ? item.rate <= item.previous : item.rate >= item.previous;
              const color = better === null ? PURPLE : better ? '#22c55e' : '#f59e0b';
              return (
                <Paper key={item.stage} elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{item.stage}</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, color, my: 1 }}>{fmtPct(item.rate)}</Typography>
                  <Typography variant="caption" color="text.secondary">Previous period: {fmtPct(item.previous)}</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={item.rate || 0}
                    sx={{ mt: 2, height: 6, borderRadius: 3, bgcolor: '#f3f4f6', '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }}
                  />
                </Paper>
              );
            })}
          </Box>
        )}
      </Stack>
    </ReportCard>
  );
}

// ---------------------------------------------------------------- 4
function FacultyReport({ data }) {
  const [facultyFilter, setFacultyFilter] = useState('All Faculties');
  const [viewMode, setViewMode] = useState('area');
  const f = data.faculty;
  const areas = useMemo(
    () => (facultyFilter === 'All Faculties' ? f.byResearchArea : f.byResearchArea.filter((a) => a.faculty === facultyFilter)),
    [f.byResearchArea, facultyFilter]
  );
  const faculties = facultyFilter === 'All Faculties' ? f.byFaculty : f.byFaculty.filter((row) => row.faculty === facultyFilter);
  const quarterlySeries = facultyFilter === 'All Faculties' ? f.quarterlySeries : f.quarterlySeries.filter((s) => s === facultyFilter);

  return (
    <ReportCard
      id="publications-faculty"
      icon={REPORT_ICONS['publications-faculty']}
      title="Output by faculty / research area"
      subtitle="Publications, manuscripts and proposals by the researcher's department and by research area."
      action={<DownloadButton reportId="publications-faculty" title="Output by Faculty Report" data={data} />}
    >
      <Stack spacing={3}>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {f.faculties.map((name) => (
            <Chip
              key={name}
              label={name}
              onClick={() => setFacultyFilter(name)}
              sx={{ fontWeight: 600, bgcolor: facultyFilter === name ? PURPLE : alpha(PURPLE, 0.08), color: facultyFilter === name ? 'white' : PURPLE, '&:hover': { bgcolor: facultyFilter === name ? '#7b5ca7' : alpha(PURPLE, 0.15) } }}
            />
          ))}
        </Stack>

        <ToggleButtonGroup size="small" value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)}>
          <ToggleButton value="area">By research area</ToggleButton>
          <ToggleButton value="faculty">By faculty</ToggleButton>
          <ToggleButton value="quarterly">Quarterly trend</ToggleButton>
        </ToggleButtonGroup>

        {viewMode === 'area' && (areas.length ? (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={areas} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="area" tick={{ fontSize: 10, angle: -25, textAnchor: 'end' }} interval={0} height={80} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <RTooltip {...ChartTooltipStyle} />
              <Legend verticalAlign="top" />
              <Bar dataKey="publications" stackId="a" fill={PURPLE} name="Publications" />
              <Bar dataKey="manuscripts" stackId="a" fill="#3b82f6" name="Manuscripts" />
              <Bar dataKey="proposals" stackId="a" fill="#22c55e" name="Proposals" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState>No research areas recorded on output in this period.</EmptyState>)}

        {viewMode === 'faculty' && (faculties.length ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={faculties}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="faculty" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <RTooltip {...ChartTooltipStyle} />
                <Legend />
                <Bar dataKey="publications" fill={PURPLE} name="Publications" radius={[4, 4, 0, 0]} />
                <Bar dataKey="manuscripts" fill="#3b82f6" name="Manuscripts" radius={[4, 4, 0, 0]} />
                <Bar dataKey="proposals" fill="#22c55e" name="Proposals" radius={[4, 4, 0, 0]} />
                <Bar dataKey="researchers" fill="#cbd5e1" name="Researchers" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                    {['Faculty / department', 'Researchers', 'Publications', 'Manuscripts', 'Proposals', 'vs previous'].map((h, i) => (
                      <TableCell key={h} align={i ? 'right' : 'left'} sx={{ fontWeight: 700 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {faculties.map((row) => (
                    <TableRow key={row.faculty} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.faculty}</TableCell>
                      <TableCell align="right">{row.researchers}</TableCell>
                      <TableCell align="right">{row.publications}</TableCell>
                      <TableCell align="right">{row.manuscripts}</TableCell>
                      <TableCell align="right">{row.proposals}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: row.trend === null ? '#94a3b8' : row.trend >= 0 ? '#16a34a' : '#d97706' }}>
                        {fmtChange(row.trend) || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : <EmptyState />)}

        {viewMode === 'quarterly' && (quarterlySeries.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={f.quarterlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <RTooltip {...ChartTooltipStyle} />
              <Legend />
              {quarterlySeries.map((name) => (
                <Line key={name} type="monotone" dataKey={name} stroke={COLORS[f.quarterlySeries.indexOf(name) % COLORS.length]} strokeWidth={2} name={name} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : <EmptyState />)}

        {f.faculties.includes('Unassigned') ? (
          <Typography variant="caption" color="text.secondary">
            &quot;Unassigned&quot; covers researchers with no department on their profile and proposals with no department listed.
          </Typography>
        ) : null}
      </Stack>
    </ReportCard>
  );
}

// ---------------------------------------------------------------- 5
function PublicationTypeReport({ data }) {
  const [hoveredType, setHoveredType] = useState(null);
  const t = data.publicationType;
  const published = t.byType.filter((row) => row.published > 0);

  return (
    <ReportCard
      id="publication-type"
      icon={REPORT_ICONS['publication-type']}
      title="Performance by publication type"
      subtitle="Output published in this period by type, with manuscripts still in progress, DOI coverage and the journals used most."
      action={<DownloadButton reportId="publication-type" title="Performance by Publication Type Report" data={data} />}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.2fr' }, gap: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Published output by type</Typography>
          {published.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={published}
                  dataKey="published"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  onMouseEnter={(_, i) => setHoveredType(published[i]?.type)}
                  onMouseLeave={() => setHoveredType(null)}
                >
                  {published.map((entry, i) => (
                    <Cell key={entry.type} fill={COLORS[i % COLORS.length]} opacity={hoveredType && hoveredType !== entry.type ? 0.4 : 1} />
                  ))}
                </Pie>
                <RTooltip {...ChartTooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState>Nothing published in this period.</EmptyState>}

          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Top journals this period</Typography>
          {t.topJournals.length ? (
            <ResponsiveContainer width="100%" height={Math.max(140, t.topJournals.length * 28)}>
              <BarChart data={t.topJournals} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="journal" width={160} tick={{ fontSize: 10 }} />
                <RTooltip {...ChartTooltipStyle} formatter={(v) => [v, 'Publications']} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState>No journal names recorded on publications in this period.</EmptyState>}
        </Stack>

        <Stack spacing={2}>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Published</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Share</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>In progress</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>With DOI</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {t.byType.length ? t.byType.map((row) => (
                  <TableRow
                    key={row.type}
                    hover
                    sx={{ bgcolor: hoveredType === row.type ? alpha(PURPLE, 0.04) : 'inherit', cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredType(row.type)}
                    onMouseLeave={() => setHoveredType(null)}
                  >
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{row.type}</TableCell>
                    <TableCell align="right">{row.published}</TableCell>
                    <TableCell align="right">{row.published ? `${row.share}%` : '—'}</TableCell>
                    <TableCell align="right">{row.inProgress}</TableCell>
                    <TableCell align="right">
                      {row.doiCoverage === null ? '—' : (
                        <Chip
                          label={`${row.doiCoverage}%`}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            bgcolor: row.doiCoverage >= 80 ? alpha('#22c55e', 0.12) : row.doiCoverage >= 50 ? alpha('#3b82f6', 0.12) : alpha('#f59e0b', 0.12),
                            color: row.doiCoverage >= 80 ? '#16a34a' : row.doiCoverage >= 50 ? '#2563eb' : '#d97706',
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={5}><Typography variant="body2" color="text.secondary">No output in this period.</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: alpha(PURPLE, 0.02) }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <InfoIcon sx={{ fontSize: 18, color: PURPLE }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Reading this report</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" component="div" sx={{ lineHeight: 1.6 }}>
              <strong>{t.totals.published}</strong> items published this period, with <strong>{t.totals.inProgress}</strong> manuscripts still in progress.
              Overall DOI coverage is <strong>{fmtPct(t.totals.doiCoverage)}</strong>. Items without a DOI are harder to track for citations and funder reporting.
            </Typography>
            <NotCaptured items={t.notCaptured} />
          </Paper>
        </Stack>
      </Box>
    </ReportCard>
  );
}

const REPORT_COMPONENTS = {
  'institute-performance': InstitutePerformanceReport,
  'citation-tracking': CitationTrackingReport,
  'work-status': WorkStatusReport,
  'publications-faculty': FacultyReport,
  'publication-type': PublicationTypeReport,
};

const headline = (id, data) => {
  if (!data) return '';
  const s = data.summary.current;
  switch (id) {
    case 'institute-performance': return `${s.publications + s.manuscripts + s.proposals} outputs`;
    case 'citation-tracking': return `${data.citations.totals.citations.toLocaleString()} citations`;
    case 'work-status': return `${data.workStatus.manuscripts.total} manuscripts · ${data.workStatus.proposals.total} proposals`;
    case 'publications-faculty': return `${data.faculty.byFaculty.filter((f) => f.total > 0).length} active departments`;
    case 'publication-type': return `${data.publicationType.totals.published} published`;
    default: return '';
  }
};

export default function InstitutionReportsDashboard({ data, loading = false, error = '' }) {
  const [activeReport, setActiveReport] = useState('institute-performance');

  const scrollToReport = (id) => {
    setActiveReport(id);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssessmentIcon sx={{ color: PURPLE }} />
        Dashboards &amp; Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 760 }}>
        Live reports for {data?.institution?.name || 'your institution'}, drawn from publications, manuscripts, project proposals and researcher profiles
        {data?.range ? ` between ${new Date(data.range.start).toLocaleDateString('en-US', { dateStyle: 'medium' })} and ${new Date(data.range.end).toLocaleDateString('en-US', { dateStyle: 'medium' })}` : ''}.
      </Typography>

      {error ? <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert> : null}

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                <TableCell sx={{ fontWeight: 700, width: '28%' }}>Report</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 200 }} align="center">This period</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 140 }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {REPORT_CATALOG.map((report) => (
                <TableRow
                  key={report.id}
                  hover
                  selected={activeReport === report.id}
                  sx={{ cursor: 'pointer', '&.Mui-selected': { bgcolor: alpha(PURPLE, 0.06) }, '&.Mui-selected:hover': { bgcolor: alpha(PURPLE, 0.09) } }}
                  onClick={() => scrollToReport(report.id)}
                >
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ color: PURPLE, display: 'flex' }}>{REPORT_ICONS[report.id]}</Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{report.title}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>{report.description}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    {loading ? <Skeleton width={120} sx={{ mx: 'auto' }} /> : (
                      <Chip label={headline(report.id, data) || '—'} size="small" sx={{ fontWeight: 600, bgcolor: alpha(PURPLE, 0.08), color: PURPLE }} />
                    )}
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <DownloadButton reportId={report.id} title={report.title} data={data} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
        {REPORT_CATALOG.map((report) => (
          <Chip
            key={report.id}
            icon={REPORT_ICONS[report.id]}
            label={report.title}
            onClick={() => scrollToReport(report.id)}
            sx={{
              fontWeight: 600,
              bgcolor: activeReport === report.id ? PURPLE : 'white',
              color: activeReport === report.id ? 'white' : '#374151',
              border: '1px solid',
              borderColor: activeReport === report.id ? PURPLE : '#e5e7eb',
              '& .MuiChip-icon': { color: activeReport === report.id ? 'white' : PURPLE },
              '&:hover': { bgcolor: activeReport === report.id ? '#7b5ca7' : alpha(PURPLE, 0.06) },
            }}
          />
        ))}
      </Stack>

      <Stack spacing={3}>
        {loading || !data
          ? REPORT_CATALOG.map((report) => (
            <Skeleton key={report.id} variant="rounded" height={360} sx={{ borderRadius: 3 }} />
          ))
          : REPORT_CATALOG.map((report) => {
            const Component = REPORT_COMPONENTS[report.id];
            return <Component key={report.id} data={data} />;
          })}
      </Stack>
    </Box>
  );
}
