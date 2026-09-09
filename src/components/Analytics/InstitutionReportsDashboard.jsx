'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Chip,
  alpha,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import {
  REPORT_CATALOG,
  institutePerformanceData,
  citationTrackingData,
  workStatusData,
  publicationsByFacultyData,
  publicationTypeData,
} from '@/data/institutionReportsMockData';
import { generateInstitutionReportPdf } from '@/utils/generateInstitutionReportPdf';

const PURPLE = '#8b6cbc';
const COLORS = ['#8b6cbc', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#0891b2', '#ec4899', '#84cc16'];

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

const ReportCard = ({ icon, title, subtitle, action, children, id }) => (
  <Paper
    id={id}
    elevation={0}
    sx={{
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      overflow: 'hidden',
    }}
  >
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
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: alpha(PURPLE, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: PURPLE,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2937', lineHeight: 1.3 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 560 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {action}
    </Box>
    <Box sx={{ p: 3 }}>{children}</Box>
  </Paper>
);

const DownloadButton = ({ reportId, title, size = 'small' }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateInstitutionReportPdf(reportId, title);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      variant="outlined"
      size={size}
      startIcon={<DownloadIcon />}
      disabled={downloading}
      onClick={handleDownload}
      sx={{
        borderColor: PURPLE,
        color: PURPLE,
        fontWeight: 600,
        '&:hover': { borderColor: '#7b5ca7', bgcolor: alpha(PURPLE, 0.06) },
      }}
    >
      {downloading ? 'Generating…' : 'Download PDF'}
    </Button>
  );
};

function InstitutePerformanceReport() {
  const [metric, setMetric] = useState('publications');
  const [activeInsight, setActiveInsight] = useState(null);

  const radarData = institutePerformanceData.benchmarks.map((b) => ({
    metric: b.metric.split(' ')[0],
    institute: b.institute,
    peer: b.peer,
    national: b.national,
  }));

  return (
    <ReportCard
      id="institute-performance"
      icon={REPORT_ICONS['institute-performance']}
      title="Institute performance report"
      subtitle="Where the institute is doing better or worse in research output and publishing effectiveness."
      action={<DownloadButton reportId="institute-performance" title="Institute Performance Report" />}
    >
      <Stack spacing={3}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' }, gap: 1.5 }}>
          {institutePerformanceData.insights.map((item) => (
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
                {item.status === 'better' ? (
                  <BetterIcon sx={{ fontSize: 16, color: '#22c55e' }} />
                ) : (
                  <WorseIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                )}
                <Chip
                  label={item.status === 'better' ? 'Above peer' : 'Below peer'}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    bgcolor: item.status === 'better' ? alpha('#22c55e', 0.12) : alpha('#f59e0b', 0.12),
                    color: item.status === 'better' ? '#16a34a' : '#d97706',
                    fontWeight: 700,
                  }}
                />
              </Stack>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                {item.area}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={item.score}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  mb: 1,
                  bgcolor: alpha(PURPLE, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: item.score >= 70 ? '#22c55e' : item.score >= 60 ? PURPLE : '#f59e0b',
                    borderRadius: 3,
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', lineHeight: 1.4 }}>
                {item.detail}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 3 }}>
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Research output trend
              </Typography>
              <ToggleButtonGroup
                size="small"
                value={metric}
                exclusive
                onChange={(_, v) => v && setMetric(v)}
              >
                <ToggleButton value="publications">Publications</ToggleButton>
                <ToggleButton value="manuscripts">Manuscripts</ToggleButton>
                <ToggleButton value="proposals">Proposals</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={institutePerformanceData.monthlyOutput}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RTooltip {...ChartTooltipStyle} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey={metric}
                  fill={alpha(PURPLE, 0.2)}
                  stroke={PURPLE}
                  strokeWidth={2}
                  name="Institute"
                />
                <Line
                  type="monotone"
                  dataKey="peerAvg"
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  dot={false}
                  name="Peer average"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              Benchmark radar — institute vs peers
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} />
                <Radar name="Institute" dataKey="institute" stroke={PURPLE} fill={PURPLE} fillOpacity={0.35} />
                <Radar name="Peer" dataKey="peer" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                <Radar name="National" dataKey="national" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} />
                <Legend />
                <RTooltip {...ChartTooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Stack>
    </ReportCard>
  );
}

function CitationTrackingReport() {
  const [selectedResearcher, setSelectedResearcher] = useState(null);
  const filteredWorks = selectedResearcher
    ? citationTrackingData.topWorks.filter((w) => w.researcher === selectedResearcher)
    : citationTrackingData.topWorks;

  return (
    <ReportCard
      id="citation-tracking"
      icon={REPORT_ICONS['citation-tracking']}
      title="Citation tracking"
      subtitle="Citations received per researcher and per work — click a bar to filter top works."
      action={<DownloadButton reportId="citation-tracking" title="Citation Tracking Report" />}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: 3 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
            Citations by researcher
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={citationTrackingData.byResearcher}
              layout="vertical"
              margin={{ left: 10 }}
              onClick={(e) => {
                if (e?.activeLabel) setSelectedResearcher(e.activeLabel);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
              <RTooltip
                {...ChartTooltipStyle}
                formatter={(value, name) => [value, name === 'citations' ? 'Total citations' : name]}
              />
              <Bar dataKey="citations" fill={PURPLE} radius={[0, 4, 4, 0]} cursor="pointer">
                {citationTrackingData.byResearcher.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={selectedResearcher === entry.name ? '#6d5499' : COLORS[i % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {selectedResearcher && (
            <Button size="small" onClick={() => setSelectedResearcher(null)} sx={{ mt: 1, color: PURPLE }}>
              Clear filter: {selectedResearcher}
            </Button>
          )}
        </Box>

        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Citation growth (monthly)
            </Typography>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={citationTrackingData.monthlyCitations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RTooltip {...ChartTooltipStyle} />
                <Area type="monotone" dataKey="citations" stroke="#3b82f6" fill={alpha('#3b82f6', 0.2)} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Top cited works {selectedResearcher ? `— ${selectedResearcher}` : ''}
            </Typography>
            <Stack spacing={1}>
              {filteredWorks.map((work, i) => (
                <Paper
                  key={work.title}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid #e5e7eb',
                    '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.02) },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1, pr: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: PURPLE }}>
                        #{i + 1}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.3 }}>
                        {work.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {work.researcher} · {work.year}
                      </Typography>
                    </Box>
                    <Chip label={`${work.citations} cites`} size="small" sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 700 }} />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </ReportCard>
  );
}

function WorkStatusReport() {
  const [view, setView] = useState('pipeline');

  return (
    <ReportCard
      id="work-status"
      icon={REPORT_ICONS['work-status']}
      title="Work-status report"
      subtitle="Pipeline of work by status — draft, in review, preprint, and published."
      action={<DownloadButton reportId="work-status" title="Work Status Report" />}
    >
      <Stack spacing={3}>
        <ToggleButtonGroup size="small" value={view} exclusive onChange={(_, v) => v && setView(v)}>
          <ToggleButton value="pipeline">Current pipeline</ToggleButton>
          <ToggleButton value="trend">Monthly trend</ToggleButton>
          <ToggleButton value="conversion">Conversion rates</ToggleButton>
        </ToggleButtonGroup>

        {view === 'pipeline' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.2fr' }, gap: 3, alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={workStatusData.pipeline}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                >
                  {workStatusData.pipeline.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Pie>
                <RTooltip {...ChartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <Stack spacing={1.5}>
              {workStatusData.pipeline.map((item) => (
                <Box key={item.status}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.status}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: item.color }}>{item.count}</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(item.count / 257) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(item.color, 0.15),
                      '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 4 },
                    }}
                  />
                </Box>
              ))}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Total active works in pipeline: 257
              </Typography>
            </Stack>
          </Box>
        )}

        {view === 'trend' && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workStatusData.monthlyPipeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip {...ChartTooltipStyle} />
              <Legend />
              <Bar dataKey="draft" stackId="a" fill="#94a3b8" name="Draft" />
              <Bar dataKey="inReview" stackId="a" fill="#f59e0b" name="In Review" />
              <Bar dataKey="preprint" stackId="a" fill="#3b82f6" name="Preprint" />
              <Bar dataKey="published" stackId="a" fill="#22c55e" name="Published" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {view === 'conversion' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {workStatusData.conversionRates.map((item) => (
              <Paper key={item.stage} elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {item.stage}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: item.rate >= item.target ? '#22c55e' : '#f59e0b', my: 1 }}>
                  {item.rate}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Target: {item.target}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={item.rate}
                  sx={{
                    mt: 2,
                    height: 6,
                    borderRadius: 3,
                    bgcolor: '#f3f4f6',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: item.rate >= item.target ? '#22c55e' : '#f59e0b',
                      borderRadius: 3,
                    },
                  }}
                />
              </Paper>
            ))}
          </Box>
        )}
      </Stack>
    </ReportCard>
  );
}

function PublicationsFacultyReport() {
  const [facultyFilter, setFacultyFilter] = useState('All Faculties');
  const [viewMode, setViewMode] = useState('area');

  const filteredAreas = useMemo(() => {
    if (facultyFilter === 'All Faculties') return publicationsByFacultyData.byResearchArea;
    return publicationsByFacultyData.byResearchArea.filter((a) => a.faculty === facultyFilter);
  }, [facultyFilter]);

  return (
    <ReportCard
      id="publications-faculty"
      icon={REPORT_ICONS['publications-faculty']}
      title="Publications by faculty / research area"
      subtitle="Publication counts and trends broken down by faculty and research area."
      action={<DownloadButton reportId="publications-faculty" title="Publications by Faculty Report" />}
    >
      <Stack spacing={3}>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {publicationsByFacultyData.faculties.map((f) => (
            <Chip
              key={f}
              label={f}
              onClick={() => setFacultyFilter(f)}
              sx={{
                fontWeight: 600,
                bgcolor: facultyFilter === f ? PURPLE : alpha(PURPLE, 0.08),
                color: facultyFilter === f ? 'white' : PURPLE,
                '&:hover': { bgcolor: facultyFilter === f ? '#7b5ca7' : alpha(PURPLE, 0.15) },
              }}
            />
          ))}
        </Stack>

        <ToggleButtonGroup size="small" value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)}>
          <ToggleButton value="area">By research area</ToggleButton>
          <ToggleButton value="faculty">By faculty</ToggleButton>
          <ToggleButton value="quarterly">Quarterly trend</ToggleButton>
        </ToggleButtonGroup>

        {viewMode === 'area' && (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={filteredAreas} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="area" tick={{ fontSize: 10, angle: -25, textAnchor: 'end' }} interval={0} height={70} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip {...ChartTooltipStyle} />
              <Bar dataKey="count" fill={PURPLE} radius={[4, 4, 0, 0]} name="Publications">
                {filteredAreas.map((entry, i) => (
                  <Cell key={entry.area} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'faculty' && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={publicationsByFacultyData.byFaculty}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="faculty" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip {...ChartTooltipStyle} />
              <Legend />
              <Bar dataKey="publications" fill={PURPLE} name="Publications" radius={[4, 4, 0, 0]} />
              <Bar dataKey="researchers" fill="#3b82f6" name="Researchers" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'quarterly' && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={publicationsByFacultyData.quarterlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip {...ChartTooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="medicine" stroke={COLORS[0]} strokeWidth={2} name="Medicine" />
              <Line type="monotone" dataKey="engineering" stroke={COLORS[1]} strokeWidth={2} name="Engineering" />
              <Line type="monotone" dataKey="publicHealth" stroke={COLORS[2]} strokeWidth={2} name="Public Health" />
              <Line type="monotone" dataKey="sciences" stroke={COLORS[3]} strokeWidth={2} name="Sciences" />
              <Line type="monotone" dataKey="humanities" stroke={COLORS[4]} strokeWidth={2} name="Humanities" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Stack>
    </ReportCard>
  );
}

function PublicationTypeReport() {
  const [hoveredType, setHoveredType] = useState(null);

  return (
    <ReportCard
      id="publication-type"
      icon={REPORT_ICONS['publication-type']}
      title="Performance by publication type"
      subtitle="Published output by type with journal quality and credibility criteria for leadership context."
      action={<DownloadButton reportId="publication-type" title="Performance by Publication Type Report" />}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.2fr' }, gap: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Output distribution by type
          </Typography>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={publicationTypeData.byType}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={90}
                onMouseEnter={(_, i) => setHoveredType(publicationTypeData.byType[i].type)}
                onMouseLeave={() => setHoveredType(null)}
              >
                {publicationTypeData.byType.map((entry, i) => (
                  <Cell
                    key={entry.type}
                    fill={COLORS[i % COLORS.length]}
                    opacity={hoveredType && hoveredType !== entry.type ? 0.4 : 1}
                  />
                ))}
              </Pie>
              <RTooltip {...ChartTooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Impact factor distribution (journal articles)
          </Typography>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={publicationTypeData.impactDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <RTooltip {...ChartTooltipStyle} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Stack>

        <Stack spacing={2}>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Count</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Avg IF</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Q1 %</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Credibility</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {publicationTypeData.byType.map((row) => (
                  <TableRow
                    key={row.type}
                    hover
                    sx={{
                      bgcolor: hoveredType === row.type ? alpha(PURPLE, 0.04) : 'inherit',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={() => setHoveredType(row.type)}
                    onMouseLeave={() => setHoveredType(null)}
                  >
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{row.type}</TableCell>
                    <TableCell align="right">{row.count}</TableCell>
                    <TableCell align="right">{row.avgIF ?? '—'}</TableCell>
                    <TableCell align="right">{row.q1Share != null ? `${row.q1Share}%` : '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.credibility}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          bgcolor:
                            row.credibility === 'High'
                              ? alpha('#22c55e', 0.12)
                              : row.credibility === 'Emerging'
                                ? alpha('#3b82f6', 0.12)
                                : alpha('#f59e0b', 0.12),
                          color:
                            row.credibility === 'High'
                              ? '#16a34a'
                              : row.credibility === 'Emerging'
                                ? '#2563eb'
                                : '#d97706',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: alpha(PURPLE, 0.02) }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <InfoIcon sx={{ fontSize: 18, color: PURPLE }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Journal quality / credibility criteria
              </Typography>
            </Stack>
            <Stack spacing={1}>
              {publicationTypeData.journalQualityCriteria.map((c) => (
                <Box key={c.criterion} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Chip label={c.weight} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: alpha(PURPLE, 0.1), color: PURPLE }} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{c.criterion}</Typography>
                    <Typography variant="caption" color="text.secondary">{c.threshold}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
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
  'publications-faculty': PublicationsFacultyReport,
  'publication-type': PublicationTypeReport,
};

export default function InstitutionReportsDashboard() {
  const [activeReport, setActiveReport] = useState('institute-performance');

  const scrollToReport = (id) => {
    setActiveReport(id);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, mb: 1, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <AssessmentIcon sx={{ color: PURPLE }} />
        Dashboards &amp; Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Interactive dashboards and downloadable reports drawn from data captured across publications, manuscripts, proposals, and researcher modules.
      </Typography>

      {/* Action items catalog */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                <TableCell sx={{ fontWeight: 700, width: '28%' }}>Action Item</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 90 }} align="center">Raised</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 120 }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {REPORT_CATALOG.map((report) => (
                <TableRow
                  key={report.id}
                  hover
                  selected={activeReport === report.id}
                  sx={{
                    cursor: 'pointer',
                    '&.Mui-selected': { bgcolor: alpha(PURPLE, 0.06) },
                    '&.Mui-selected:hover': { bgcolor: alpha(PURPLE, 0.09) },
                  }}
                  onClick={() => scrollToReport(report.id)}
                >
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ color: PURPLE, display: 'flex' }}>{REPORT_ICONS[report.id]}</Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{report.title}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                      {report.description}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={report.raised} size="small" sx={{ fontWeight: 600, bgcolor: alpha(PURPLE, 0.08), color: PURPLE }} />
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <DownloadButton reportId={report.id} title={report.title} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Quick navigation tabs */}
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
              '&:hover': {
                bgcolor: activeReport === report.id ? '#7b5ca7' : alpha(PURPLE, 0.06),
              },
            }}
          />
        ))}
      </Stack>

      {/* All report dashboards */}
      <Stack spacing={3}>
        {REPORT_CATALOG.map((report) => {
          const Component = REPORT_COMPONENTS[report.id];
          return <Component key={report.id} />;
        })}
      </Stack>
    </Box>
  );
}
