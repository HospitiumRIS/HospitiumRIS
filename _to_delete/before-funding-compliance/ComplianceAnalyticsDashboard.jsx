'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  alpha,
  LinearProgress,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
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
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Shield as ShieldIcon,
  FactCheck as FactCheckIcon,
  Policy as PolicyIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  Gavel as CommitteeIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Folder as FolderIcon,
  CheckCircleOutline as CheckIcon,
} from '@mui/icons-material';
import {
  COMPLIANCE_REPORT_CATALOG,
  complianceRiskAlerts,
  regulatoryFrameworks,
  auditTrailTrend,
} from '@/data/complianceReportsMockData';
import { generateComplianceReportPdf } from '@/utils/generateComplianceReportPdf';

const PURPLE = '#8b6cbc';

const tooltipStyle = {
  contentStyle: { borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 },
};

const severityColors = {
  high: { bg: alpha('#ef4444', 0.1), color: '#dc2626', border: '#fecaca' },
  medium: { bg: alpha('#f59e0b', 0.1), color: '#d97706', border: '#fde68a' },
  low: { bg: alpha('#3b82f6', 0.1), color: '#2563eb', border: '#bfdbfe' },
};

function DownloadButton({ reportId, title, analyticsData, size = 'small' }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="outlined"
      size={size}
      startIcon={<DownloadIcon />}
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await generateComplianceReportPdf(reportId, title, analyticsData);
        } finally {
          setLoading(false);
        }
      }}
      sx={{ borderColor: PURPLE, color: PURPLE, fontWeight: 600, '&:hover': { bgcolor: alpha(PURPLE, 0.06) } }}
    >
      {loading ? 'Generating…' : 'Download PDF'}
    </Button>
  );
}

function ReportShell({ id, icon, title, subtitle, reportId, analyticsData, children }) {
  return (
    <Paper id={id} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <Box sx={{ px: 3, py: 2.5, bgcolor: alpha(PURPLE, 0.04), borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(PURPLE, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: PURPLE }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
            <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
          </Box>
        </Box>
        <DownloadButton reportId={reportId} title={title} analyticsData={analyticsData} />
      </Box>
      <Box sx={{ p: 3 }}>{children}</Box>
    </Paper>
  );
}

function KpiCard({ label, value, sub, icon: Icon, accent = '#8b6cbc', suffix = '' }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 2, bgcolor: accent, boxShadow: `0 2px 8px ${alpha(accent, 0.35)}`, height: 100, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: '50%' }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{label}</Typography>
        <Icon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>{value}{suffix}</Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>{sub}</Typography>
    </Paper>
  );
}

export default function ComplianceAnalyticsDashboard({ analyticsData }) {
  const [activeReport, setActiveReport] = useState('ethics-pipeline');
  const [proposalSearch, setProposalSearch] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [deptMetric, setDeptMetric] = useState('complianceRate');
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedCommittee, setSelectedCommittee] = useState(null);

  const overview = analyticsData.overview;
  const requirements = analyticsData.complianceRequirements;
  const review = analyticsData.reviewMetrics;

  const radarData = useMemo(() => [
    { req: 'Ethics', value: requirements?.ethicsApproval || 0, full: 100 },
    { req: 'Data Mgmt', value: requirements?.dataManagement || 0, full: 100 },
    { req: 'Consent', value: requirements?.informedConsent || 0, full: 100 },
    { req: 'Documentation', value: requirements?.documentation || 0, full: 100 },
    { req: 'Approval Rate', value: overview?.approvalRate || 0, full: 100 },
  ], [requirements, overview]);

  const filteredApprovals = useMemo(() => {
    let list = analyticsData.recentApprovals || [];
    if (proposalSearch.trim()) {
      const q = proposalSearch.toLowerCase();
      list = list.filter((p) =>
        p.title?.toLowerCase().includes(q) ||
        p.principalInvestigator?.toLowerCase().includes(q) ||
        p.department?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [analyticsData.recentApprovals, proposalSearch]);

  const filteredPending = useMemo(() => {
    let list = analyticsData.pendingReviews || [];
    if (pendingSearch.trim()) {
      const q = pendingSearch.toLowerCase();
      list = list.filter((p) =>
        p.title?.toLowerCase().includes(q) ||
        p.principalInvestigator?.toLowerCase().includes(q) ||
        p.department?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [analyticsData.pendingReviews, pendingSearch]);

  const committeeChartData = useMemo(() => {
    return (analyticsData.ethicsCommittees || []).map((c) => ({
      ...c,
      name: c.committee?.length > 20 ? `${c.committee.slice(0, 18)}…` : c.committee,
    }));
  }, [analyticsData.ethicsCommittees]);

  const scrollTo = (id) => {
    setActiveReport(id);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <>
      {/* KPI strip */}
      <Box sx={{ mb: 4, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 2 }}>
        <KpiCard label="Total Proposals" value={overview.totalProposals} sub="All submissions" icon={PolicyIcon} />
        <KpiCard label="Ethics Approved" value={overview.approvedEthics} sub="Approved" icon={ApprovedIcon} accent="#22c55e" />
        <KpiCard label="Pending Review" value={overview.pendingEthics} sub="Under review" icon={PendingIcon} accent="#f59e0b" />
        <KpiCard label="Data Plans" value={overview.proposalsWithDataPlan} sub="DMP submitted" icon={ShieldIcon} accent="#3b82f6" />
        <KpiCard label="Compliance Rate" value={overview.complianceRate} suffix="%" sub="Overall coverage" icon={TrendingUpIcon} />
        <KpiCard label="Approval Rate" value={overview.approvalRate} suffix="%" sub="Ethics success" icon={FactCheckIcon} accent="#7c3aed" />
      </Box>

      {/* Risk alerts banner */}
      {review.overdueReviews > 0 && (
        <Paper elevation={0} sx={{ mb: 4, p: 2, borderRadius: 2, border: '1px solid #fecaca', bgcolor: alpha('#ef4444', 0.04), display: 'flex', alignItems: 'center', gap: 2 }}>
          <WarningIcon sx={{ color: '#dc2626' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#dc2626' }}>
              {review.overdueReviews} overdue ethics review{review.overdueReviews !== 1 ? 's' : ''} require attention
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Proposals pending beyond the 30-day review SLA — committee escalation recommended.
            </Typography>
          </Box>
          <Chip label="Action required" size="small" sx={{ bgcolor: '#ef4444', color: 'white', fontWeight: 700 }} />
        </Paper>
      )}

      {/* Reports catalog */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon sx={{ color: PURPLE }} />
          Compliance Dashboards &amp; Reports
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
          Interactive compliance analytics drawn from ethics submissions, data management plans, and regulatory requirements.
        </Typography>

        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                  <TableCell sx={{ fontWeight: 700, width: '26%' }}>Report</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 80 }} align="center">Raised</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 130 }} align="center">Download</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {COMPLIANCE_REPORT_CATALOG.map((r) => (
                  <TableRow key={r.id} hover selected={activeReport === r.id} onClick={() => scrollTo(r.id)} sx={{ cursor: 'pointer', '&.Mui-selected': { bgcolor: alpha(PURPLE, 0.06) } }}>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{r.title}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>{r.description}</Typography></TableCell>
                    <TableCell align="center"><Chip label={r.raised} size="small" sx={{ fontWeight: 600, bgcolor: alpha(PURPLE, 0.08), color: PURPLE }} /></TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <DownloadButton reportId={r.id} title={r.title} analyticsData={analyticsData} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
          {COMPLIANCE_REPORT_CATALOG.map((r) => (
            <Chip
              key={r.id}
              label={r.title}
              onClick={() => scrollTo(r.id)}
              sx={{
                fontWeight: 600,
                bgcolor: activeReport === r.id ? PURPLE : 'white',
                color: activeReport === r.id ? 'white' : '#374151',
                border: '1px solid',
                borderColor: activeReport === r.id ? PURPLE : '#e5e7eb',
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Requirement cards */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PolicyIcon sx={{ color: PURPLE, fontSize: 22 }} />
          Compliance Requirements at a Glance
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
          {[
            { label: 'Ethics Approval', value: requirements.ethicsApproval, color: '#22c55e', icon: CheckIcon, sub: `${overview.approvedEthics} of ${overview.totalProposals}` },
            { label: 'Data Management', value: requirements.dataManagement, color: '#3b82f6', icon: ShieldIcon, sub: `${overview.proposalsWithDataPlan} with DMP` },
            { label: 'Informed Consent', value: requirements.informedConsent, color: '#f59e0b', icon: FactCheckIcon, sub: `${requirements.consentCount} with consent` },
            { label: 'Documentation', value: requirements.documentation, color: '#8b5cf6', icon: FolderIcon, sub: 'Complete documentation' },
          ].map((item) => (
            <Card key={item.label} sx={{ borderRadius: 2, border: '1px solid #f3f4f6', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                  <item.icon sx={{ fontSize: 20, color: item.color }} />
                </Stack>
                <Typography variant="h4" sx={{ fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.value}%</Typography>
                <Typography variant="caption" color="text.secondary">{item.sub}</Typography>
                <LinearProgress variant="determinate" value={item.value} sx={{ mt: 1.5, height: 5, borderRadius: 3, bgcolor: alpha(item.color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 3 } }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Review timeline */}
      <Box sx={{ mb: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        {[
          { label: 'Average Review Time', value: review.averageReviewTime, unit: 'days', color: PURPLE },
          { label: 'Fastest Review', value: review.fastestReview, unit: 'days', color: '#22c55e' },
          { label: 'Overdue Reviews', value: review.overdueReviews, unit: 'pending', color: '#ef4444' },
        ].map((m) => (
          <Paper key={m.label} elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <TimeIcon sx={{ color: m.color, mb: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>{m.label}</Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: m.color }}>{m.value}</Typography>
            <Typography variant="body2" color="text.secondary">{m.unit}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Report dashboards */}
      <Stack spacing={3} sx={{ mb: 4 }}>
        {/* Ethics Pipeline */}
        <ReportShell id="ethics-pipeline" icon={<TrendingUpIcon />} title="Ethics review pipeline" subtitle="Monthly submissions and outcomes — hover for details, toggle series in legend." reportId="ethics-pipeline" analyticsData={analyticsData}>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={analyticsData.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip {...tooltipStyle} />
              <Legend />
              <Bar dataKey="approved" stackId="a" fill="#22c55e" name="Approved" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
              <Bar dataKey="rejected" stackId="a" fill="#ef4444" name="Rejected" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="total" stroke={PURPLE} strokeWidth={2} dot={{ r: 4 }} name="Total submissions" />
            </ComposedChart>
          </ResponsiveContainer>
        </ReportShell>

        {/* Department Compliance */}
        <ReportShell id="department-compliance" icon={<PolicyIcon />} title="Compliance by department" subtitle="Click a bar to highlight — compare compliance rate vs proposal volume." reportId="department-compliance" analyticsData={analyticsData}>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <ToggleButtonGroup size="small" value={deptMetric} exclusive onChange={(_, v) => v && setDeptMetric(v)}>
              <ToggleButton value="complianceRate">Compliance %</ToggleButton>
              <ToggleButton value="totalProposals">Proposal count</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={analyticsData.complianceByDepartment.slice(0, 8)}
              onClick={(e) => e?.activeLabel && setSelectedDept(e.activeLabel)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="department" tick={{ fontSize: 10, angle: -20, textAnchor: 'end' }} height={60} interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip {...tooltipStyle} />
              <Bar dataKey={deptMetric} fill={PURPLE} radius={[4, 4, 0, 0]} cursor="pointer">
                {analyticsData.complianceByDepartment.slice(0, 8).map((d) => (
                  <Cell key={d.department} fill={selectedDept === d.department ? '#6d5499' : PURPLE} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {selectedDept && (
            <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: alpha(PURPLE, 0.04), border: '1px solid', borderColor: alpha(PURPLE, 0.2) }}>
              {(() => {
                const d = analyticsData.complianceByDepartment.find((x) => x.department === selectedDept);
                if (!d) return null;
                return (
                  <Typography variant="body2">
                    <strong>{d.department}</strong> — {d.complianceRate}% compliance across {d.totalProposals} proposals
                    ({d.withEthicsApproval} ethics, {d.withDataPlan} DMP, {d.withConsent} consent)
                  </Typography>
                );
              })()}
            </Box>
          )}
        </ReportShell>

        {/* Committee Performance */}
        <ReportShell id="committee-performance" icon={<CommitteeIcon />} title="Committee performance" subtitle="Workload and outcome distribution across ethics review committees." reportId="committee-performance" analyticsData={analyticsData}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={committeeChartData} onClick={(e) => e?.activeLabel && setSelectedCommittee(e.activeLabel)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip {...tooltipStyle} />
              <Legend />
              <Bar dataKey="approved" fill="#22c55e" name="Approved" stackId="s" />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" stackId="s" />
              <Bar dataKey="rejected" fill="#ef4444" name="Rejected" stackId="s" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {selectedCommittee && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Selected: {selectedCommittee} — click elsewhere on chart to change selection
            </Typography>
          )}
        </ReportShell>

        {/* Requirement Scorecard */}
        <ReportShell id="requirement-scorecard" icon={<FactCheckIcon />} title="Requirement fulfillment scorecard" subtitle="Radar view of institutional compliance coverage across all requirement domains." reportId="requirement-scorecard" analyticsData={analyticsData}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="req" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Compliance %" dataKey="value" stroke={PURPLE} fill={PURPLE} fillOpacity={0.35} />
                <RTooltip {...tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
            <Stack spacing={1.5}>
              {radarData.map((r) => (
                <Box key={r.req}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.req}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: r.value >= 80 ? '#22c55e' : r.value >= 60 ? '#f59e0b' : '#ef4444' }}>{r.value}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={r.value} sx={{ height: 6, borderRadius: 3, bgcolor: '#f3f4f6', '& .MuiLinearProgress-bar': { bgcolor: r.value >= 80 ? '#22c55e' : r.value >= 60 ? '#f59e0b' : '#ef4444', borderRadius: 3 } }} />
                </Box>
              ))}
            </Stack>
          </Box>
        </ReportShell>

        {/* Risk & Regulatory */}
        <ReportShell id="risk-regulatory" icon={<WarningIcon />} title="Risk & regulatory readiness" subtitle="Overdue items, audit activity, and alignment with key regulatory frameworks." reportId="risk-regulatory" analyticsData={analyticsData}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.2fr' }, gap: 3 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Active risk alerts</Typography>
              {complianceRiskAlerts.map((alert) => {
                const sc = severityColors[alert.severity];
                return (
                  <Paper key={alert.id} elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${sc.border}`, bgcolor: sc.bg }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: sc.color }}>{alert.title}</Typography>
                      <Chip label={alert.severity} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: sc.color, color: 'white', textTransform: 'capitalize' }} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{alert.detail}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: sc.color }}>→ {alert.action}</Typography>
                  </Paper>
                );
              })}
            </Stack>

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Regulatory framework alignment</Typography>
                {regulatoryFrameworks.map((f) => (
                  <Box key={f.framework} sx={{ mb: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{f.framework}</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: f.compliance >= f.target ? '#22c55e' : '#f59e0b' }}>{f.compliance}% / {f.target}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={f.compliance} sx={{ height: 6, borderRadius: 3, bgcolor: '#f3f4f6', '& .MuiLinearProgress-bar': { bgcolor: f.compliance >= f.target ? '#22c55e' : '#f59e0b', borderRadius: 3 } }} />
                  </Box>
                ))}
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Audit activity trend</Typography>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={auditTrailTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <RTooltip {...tooltipStyle} />
                    <Area type="monotone" dataKey="audits" stroke={PURPLE} fill={alpha(PURPLE, 0.2)} name="Audits" />
                    <Area type="monotone" dataKey="findings" stroke="#f59e0b" fill={alpha('#f59e0b', 0.15)} name="Findings" />
                    <Area type="monotone" dataKey="resolved" stroke="#22c55e" fill={alpha('#22c55e', 0.15)} name="Resolved" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Stack>
          </Box>
        </ReportShell>
      </Stack>

      {/* Data tables */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Box sx={{ p: 3, pb: 2, bgcolor: alpha(PURPLE, 0.03), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Approvals</Typography>
                <Typography variant="body2" color="text.secondary">Latest ethics approvals granted</Typography>
              </Box>
              <TextField size="small" placeholder="Search approvals…" value={proposalSearch} onChange={(e) => setProposalSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
                sx={{ width: { xs: '100%', sm: 220 }, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
              />
            </Stack>
          </Box>
          {filteredApprovals.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <ApprovedIcon sx={{ fontSize: 48, color: alpha(PURPLE, 0.2), mb: 1 }} />
              <Typography variant="body2" color="text.secondary">No approvals found</Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 380 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: '#fafafa' }}>Proposal</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: '#fafafa' }}>Committee</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: '#fafafa' }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApprovals.slice(0, 10).map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.principalInvestigator} · {p.department}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2">{p.ethicsCommittee || 'N/A'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{formatDate(p.approvalDate)}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Box sx={{ p: 3, pb: 2, bgcolor: alpha(PURPLE, 0.03), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Pending Reviews</Typography>
                <Typography variant="body2" color="text.secondary">Awaiting ethics committee review</Typography>
              </Box>
              <TextField size="small" placeholder="Search pending…" value={pendingSearch} onChange={(e) => setPendingSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
                sx={{ width: { xs: '100%', sm: 220 }, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
              />
            </Stack>
          </Box>
          <Box sx={{ p: 2, maxHeight: 380, overflowY: 'auto' }}>
            {filteredPending.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <PendingIcon sx={{ fontSize: 48, color: alpha('#f59e0b', 0.2), mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No pending reviews</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {filteredPending.slice(0, 10).map((p) => (
                  <Paper key={p.id} elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.02) } }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{p.title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{p.principalInvestigator} · {p.department}</Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {p.hasDataPlan && <Chip icon={<ShieldIcon sx={{ fontSize: '14px !important' }} />} label="DMP" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />}
                      {p.hasConsent && <Chip icon={<FactCheckIcon sx={{ fontSize: '14px !important' }} />} label="Consent" size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha('#22c55e', 0.1), color: '#16a34a' }} />}
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>Submitted {formatDate(p.submittedDate)}</Typography>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>
        </Paper>
      </Box>
    </>
  );
}
