'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  alpha,
} from '@mui/material';
import {
  Assessment as UsageIcon,
  FileDownload as ExportIcon,
  ArrowBack as BackIcon,
  Assignment as ChecksIcon,
  CheckCircleOutline as CompletedIcon,
  Flag as FlagIcon,
  People as PeopleIcon,
  BarChart as ChartIcon,
  TableChart as TableIcon,
  Edit as EditIcon,
  ImageSearch as SimilarIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../../components/common/PageHeader';
import IntegrityStatCards from '../../../../components/ImageIntegrity/IntegrityStatCards';

const PURPLE = '#8b6cbc';

const REPORT_TYPES = [
  { value: 'submissions', label: 'Each check', hint: 'Every check in the period, with contributor and findings.' },
  { value: 'monthly', label: 'By month', hint: 'Totals grouped by calendar month.' },
  { value: 'account', label: 'By researcher', hint: 'Usage rolled up by researcher account.' },
  { value: 'group', label: 'By group', hint: 'Usage by department or group.' },
  { value: 'lab', label: 'By lab', hint: 'Usage by lab or unit.' },
  { value: 'sessions', label: 'Active researchers', hint: 'How many researchers submitted in each month.' },
];

const STATUS_CONFIG = {
  UPLOADING: { label: 'Uploading', color: '#1976d2', bg: '#e3f2fd' },
  PROCESSING: { label: 'Analyzing', color: '#ef6c00', bg: '#fff3e0' },
  COMPLETED: { label: 'Completed', color: '#2e7d32', bg: '#e8f5e9' },
  FAILED: { label: 'Failed', color: '#c62828', bg: '#ffebee' },
};

const axisTick = { fontSize: 11, fill: '#64748b' };
const tooltipStyle = { borderRadius: 8, fontSize: 13, border: `1px solid ${alpha('#8b6cbc', 0.15)}` };

function isoLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultDates() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 11);
  start.setDate(1);
  return { start: isoLocal(start), end: isoLocal(end) };
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPeriod(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
  const opts = { month: 'short', year: 'numeric', day: 'numeric' };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

function monthLabel(key) {
  const [year, month] = String(key).split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleString(undefined, { month: 'short', year: 'numeric' });
}

function fillMonthRange(monthly, startDate, endDate) {
  const byKey = Object.fromEntries((monthly || []).map((row) => [row.month, row]));
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return monthly || [];

  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  const rows = [];
  while (cursor <= last) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    rows.push(
      byKey[key] || {
        month: key,
        label: monthLabel(key),
        submissions: 0,
        completed: 0,
        failed: 0,
        flagged: 0,
        uniqueResearchers: 0,
        manipulation: 0,
        similarity: 0,
      }
    );
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return rows;
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function downloadCsv(filename, columns, rows) {
  const header = columns.map((c) => csvEscape(c.label)).join(',');
  const body = rows.map((row) => columns.map((c) => csvEscape(row[c.key])).join(',')).join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function StatusChip({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PROCESSING;
  return (
    <Chip
      size="small"
      label={config.label}
      sx={{ height: 22, fontWeight: 600, fontSize: '0.7rem', bgcolor: config.bg, color: config.color }}
    />
  );
}

function SectionHeader({ icon, title, subtitle, action }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            bgcolor: alpha(PURPLE, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 18, color: PURPLE } })}
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {action}
    </Box>
  );
}

export default function InstitutionImageIntegrityUsagePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const defaults = useMemo(defaultDates, []);
  const [view, setView] = useState('summary');
  const [type, setType] = useState('submissions');
  const [org, setOrg] = useState('all');
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  const mapUsageError = useCallback(
    (status, message) => {
      if (status === 401) {
        return t('institution_nav.integrity_error_unauthorized', 'Please sign in again to view the usage report.');
      }
      if (status === 403) {
        return t(
          'institution_nav.integrity_error_forbidden',
          message || 'Institution admin access is required to view the usage report.'
        );
      }
      if (status === 400) {
        return message || t('institution_nav.integrity_usage_invalid_dates', 'Please check the date range and try again.');
      }
      if (status >= 500) {
        return t('institution_nav.integrity_usage_failed', 'Failed to generate usage report. Please try again.');
      }
      return message || t('institution_nav.integrity_usage_failed', 'Failed to generate usage report.');
    },
    [t]
  );

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        view,
        type,
        org,
        start_date: startDate,
        end_date: endDate,
      });
      const res = await fetch(`/api/institution/image-integrity/usage?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(mapUsageError(res.status, data.error));
        return;
      }
      setReport(data);
    } catch (err) {
      console.error(err);
      setError(t('institution_nav.integrity_usage_failed', 'Failed to generate usage report. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [view, type, org, startDate, endDate, t, mapUsageError]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const csvSpec = useMemo(() => {
    if (!report) return null;
    if (view === 'summary') {
      return {
        filename: `image-integrity-usage-summary-${startDate}-to-${endDate}.csv`,
        columns: [
          { key: 'label', label: 'Month' },
          { key: 'submissions', label: 'Submissions' },
          { key: 'completed', label: 'Completed' },
          { key: 'failed', label: 'Failed' },
          { key: 'flagged', label: 'Flagged for review' },
          { key: 'uniqueResearchers', label: 'Researchers' },
          { key: 'manipulation', label: 'Possible edits' },
          { key: 'similarity', label: 'Similar images' },
        ],
        rows: report.monthly || [],
      };
    }
    if (type === 'submissions') {
      return {
        filename: `image-integrity-usage-checks-${startDate}-to-${endDate}.csv`,
        columns: [
          { key: 'submittedAt', label: 'Submitted' },
          { key: 'title', label: 'Title' },
          { key: 'contributor', label: 'Contributor' },
          { key: 'account', label: 'Account' },
          { key: 'email', label: 'Email' },
          { key: 'department', label: 'Group' },
          { key: 'lab', label: 'Lab/Unit' },
          { key: 'collection', label: 'Collection' },
          { key: 'fileName', label: 'File' },
          { key: 'status', label: 'Status' },
          { key: 'manipulation', label: 'Possible edits' },
          { key: 'similarity', label: 'Similar images' },
        ],
        rows: report.detail || [],
      };
    }
    if (type === 'account') {
      return {
        filename: `image-integrity-usage-researchers-${startDate}-to-${endDate}.csv`,
        columns: [
          { key: 'name', label: 'Account' },
          { key: 'email', label: 'Email' },
          { key: 'contributor', label: 'Contributor' },
          { key: 'department', label: 'Group' },
          { key: 'lab', label: 'Lab/Unit' },
          { key: 'submissions', label: 'Submissions' },
          { key: 'completed', label: 'Completed' },
          { key: 'flagged', label: 'Flagged for review' },
          { key: 'manipulation', label: 'Possible edits' },
          { key: 'similarity', label: 'Similar images' },
        ],
        rows: report.detail || [],
      };
    }
    if (type === 'sessions') {
      return {
        filename: `image-integrity-usage-researchers-by-month-${startDate}-to-${endDate}.csv`,
        columns: [
          { key: 'label', label: 'Month' },
          { key: 'sessions', label: 'Active researchers' },
          { key: 'submissions', label: 'Submissions' },
          { key: 'contributors', label: 'Contributors' },
        ],
        rows: report.detail || [],
      };
    }
    const nameLabel = type === 'group' ? 'Group' : type === 'lab' ? 'Lab/Unit' : 'Month';
    return {
      filename: `image-integrity-usage-${type}-${startDate}-to-${endDate}.csv`,
      columns: [
        { key: type === 'monthly' ? 'label' : 'name', label: nameLabel },
        { key: 'submissions', label: 'Submissions' },
        { key: 'completed', label: 'Completed' },
        { key: 'flagged', label: 'Flagged for review' },
        ...(type === 'monthly'
          ? [
              { key: 'failed', label: 'Failed' },
              { key: 'uniqueResearchers', label: 'Researchers' },
            ]
          : [{ key: 'uniqueResearchers', label: 'Researchers' }]),
        { key: 'manipulation', label: 'Possible edits' },
        { key: 'similarity', label: 'Similar images' },
      ],
      rows: report.detail || [],
    };
  }, [report, view, type, startDate, endDate]);

  const handleExport = () => {
    if (!csvSpec) return;
    downloadCsv(csvSpec.filename, csvSpec.columns, csvSpec.rows);
  };

  const organizations = report?.organizations || { groups: [], labs: [] };
  const summary = report?.summary;
  const chartData = useMemo(
    () => fillMonthRange(report?.monthly || [], startDate, endDate),
    [report?.monthly, startDate, endDate]
  );
  const periodLabel = formatPeriod(startDate, endDate);
  const selectedType = REPORT_TYPES.find((option) => option.value === type);
  const thSx = { fontWeight: 700, bgcolor: alpha(PURPLE, 0.05), color: '#334155', whiteSpace: 'nowrap' };

  return (
    <Box>
      <PageHeader
        title={t('institution_nav.integrity_usage_report', 'Usage Report')}
        description={t(
          'institution_nav.integrity_usage_desc',
          'See how image integrity checks are used across your institution, who submitted them, and which results need review.'
        )}
        icon={<UsageIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: t('institution.portal_title', 'Institution Portal'), path: '/institution' },
          { label: t('institution.image_integrity', 'Image Integrity'), path: '/institution/image-integrity' },
        ]}
      />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push('/institution/image-integrity')}
          sx={{ mb: 2.5, color: PURPLE, textTransform: 'none', fontWeight: 600 }}
        >
          {t('institution_nav.integrity_back_to_list', 'Back to Submission Reports')}
        </Button>

        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={1.75}>
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                p: 0.5,
                bgcolor: alpha(PURPLE, 0.06),
                borderRadius: 2,
                width: 'fit-content',
              }}
            >
              {[
                { id: 'summary', label: t('institution_nav.integrity_usage_overview', 'Overview') },
                { id: 'detail', label: t('institution_nav.integrity_usage_detail', 'Activity') },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  size="small"
                  onClick={() => setView(tab.id)}
                  sx={{
                    borderRadius: 1.5,
                    px: 2,
                    py: 0.6,
                    minWidth: 0,
                    textTransform: 'none',
                    fontWeight: view === tab.id ? 700 : 500,
                    bgcolor: view === tab.id ? 'white' : 'transparent',
                    color: view === tab.id ? PURPLE : 'text.secondary',
                    boxShadow: view === tab.id ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
                    '&:hover': {
                      bgcolor: view === tab.id ? 'white' : alpha(PURPLE, 0.08),
                    },
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </Box>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
              <TextField
                type="date"
                size="small"
                label={t('common.start_date', 'From')}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 160 }}
              />
              <TextField
                type="date"
                size="small"
                label={t('common.end_date', 'To')}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 160 }}
              />

              {view === 'detail' && (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>{t('institution_nav.integrity_usage_org', 'Scope')}</InputLabel>
                  <Select
                    value={org}
                    label={t('institution_nav.integrity_usage_org', 'Scope')}
                    onChange={(e) => setOrg(e.target.value)}
                  >
                    <MenuItem value="all">
                      {t('institution_nav.integrity_usage_org_all', 'Entire institution')}
                    </MenuItem>
                    {organizations.labs.map((lab) => (
                      <MenuItem key={lab.value} value={lab.value}>
                        Lab: {lab.label}
                      </MenuItem>
                    ))}
                    {organizations.groups.map((group) => (
                      <MenuItem key={group.value} value={group.value}>
                        Group: {group.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Box sx={{ flex: 1 }} />
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                disabled={!csvSpec || (csvSpec.rows || []).length === 0}
                onClick={handleExport}
                sx={{ borderColor: PURPLE, color: PURPLE, fontWeight: 700, textTransform: 'none' }}
              >
                {t('institution_nav.integrity_export_csv', 'Export CSV')}
              </Button>
            </Stack>

            {view === 'detail' && (
              <Stack spacing={1}>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {REPORT_TYPES.map((option) => (
                    <Chip
                      key={option.value}
                      clickable
                      label={option.label}
                      onClick={() => setType(option.value)}
                      sx={{
                        fontWeight: type === option.value ? 700 : 500,
                        bgcolor: type === option.value ? PURPLE : alpha(PURPLE, 0.08),
                        color: type === option.value ? 'white' : PURPLE,
                        '&:hover': {
                          bgcolor: type === option.value ? '#7a5aad' : alpha(PURPLE, 0.14),
                        },
                      }}
                    />
                  ))}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {selectedType?.hint}
                  {type === 'group'
                    ? ` ${t(
                        'institution_nav.integrity_usage_group_note',
                        'Groups appear only when researchers have a department on their profile.'
                      )}`
                    : ''}
                </Typography>
              </Stack>
            )}
          </Stack>
          {loading && <LinearProgress sx={{ mt: 2, borderRadius: 1, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />}
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading && !report && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: PURPLE }} />
          </Box>
        )}

        {report && view === 'summary' && summary && (
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {periodLabel}
              </Typography>
              <IntegrityStatCards
                items={[
                  {
                    icon: <ChecksIcon />,
                    label: 'Checks submitted',
                    value: summary.submissions,
                    hint: 'Integrity checks in this period',
                  },
                  {
                    icon: <CompletedIcon />,
                    label: 'Completed',
                    value: summary.completed,
                    hint: summary.failed ? `${summary.failed} failed` : 'Analysis finished',
                  },
                  {
                    icon: <FlagIcon />,
                    label: 'Flagged for review',
                    value: summary.flagged,
                    hint: 'Possible edits or similar images',
                  },
                  {
                    icon: <PeopleIcon />,
                    label: 'Researchers',
                    value: summary.uniqueResearchers,
                    hint: 'People who submitted checks',
                  },
                  {
                    icon: <EditIcon />,
                    label: 'Possible edits',
                    value: summary.manipulation || 0,
                    hint: 'Regions that may have been altered',
                  },
                  {
                    icon: <SimilarIcon />,
                    label: 'Similar images',
                    value: summary.similarity || 0,
                    hint: 'Possible image reuse',
                  },
                ]}
              />
            </Box>

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
              <SectionHeader
                icon={<ChartIcon />}
                title={t('institution_nav.integrity_usage_monthly', 'Checks over time')}
                subtitle="Submitted checks versus those flagged for review"
              />
              {summary.submissions === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    {t('institution_nav.integrity_usage_empty', 'No integrity checks in this date range.')}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={4} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(PURPLE, 0.12)} vertical={false} />
                      <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={32} />
                      <RechartsTooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="submissions" name="Submitted" fill={PURPLE} maxBarSize={28} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="flagged" name="Flagged for review" fill="#f59e0b" maxBarSize={28} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>

            <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ px: 2.5, pt: 2.25, pb: 1.5 }}>
                <SectionHeader
                  icon={<TableIcon />}
                  title="Monthly breakdown"
                  subtitle="Months with no activity are omitted from this table"
                />
              </Box>
              {(report.monthly || []).length === 0 ? (
                <Box sx={{ px: 2.5, pb: 4 }}>
                  <Typography color="text.secondary">
                    {t('institution_nav.integrity_usage_empty', 'No integrity checks in this date range.')}
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={thSx}>Month</TableCell>
                        <TableCell align="right" sx={thSx}>Submitted</TableCell>
                        <TableCell align="right" sx={thSx}>Completed</TableCell>
                        <TableCell align="right" sx={thSx}>Failed</TableCell>
                        <TableCell align="right" sx={thSx}>Flagged</TableCell>
                        <TableCell align="right" sx={thSx}>Researchers</TableCell>
                        <TableCell align="right" sx={thSx}>Possible edits</TableCell>
                        <TableCell align="right" sx={thSx}>Similar images</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(report.monthly || []).map((row) => (
                        <TableRow key={row.month} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{row.label}</TableCell>
                          <TableCell align="right">{row.submissions}</TableCell>
                          <TableCell align="right">{row.completed}</TableCell>
                          <TableCell align="right">{row.failed}</TableCell>
                          <TableCell align="right">
                            {row.flagged > 0 ? (
                              <Chip size="small" label={row.flagged} sx={{ height: 22, bgcolor: alpha('#d97706', 0.12), color: '#b45309', fontWeight: 700 }} />
                            ) : (
                              0
                            )}
                          </TableCell>
                          <TableCell align="right">{row.uniqueResearchers}</TableCell>
                          <TableCell align="right">{row.manipulation}</TableCell>
                          <TableCell align="right">{row.similarity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Stack>
        )}

        {report && view === 'detail' && (
          <Stack spacing={2}>
            {type === 'group' && !report.groupsConfigured && (
              <Alert severity="info">
                {t(
                  'institution_nav.integrity_usage_no_groups',
                  'No groups have been configured. Researchers can add a department on their research profile to appear here.'
                )}
              </Alert>
            )}

            {!(type === 'group' && !report.groupsConfigured) && type === 'monthly' && (report.detail || []).length > 0 && (
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                <SectionHeader icon={<ChartIcon />} title="Monthly activity" subtitle={periodLabel} />
                <Box sx={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.detail} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(PURPLE, 0.12)} vertical={false} />
                      <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={32} />
                      <RechartsTooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="submissions" name="Submitted" fill={PURPLE} maxBarSize={28} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" name="Completed" fill="#22c55e" maxBarSize={28} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            )}

            {!(type === 'group' && !report.groupsConfigured) && (
              <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                {(report.detail || []).length === 0 ? (
                  <Box sx={{ p: 6, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      {t('institution_nav.integrity_usage_empty', 'No integrity checks in this date range.')}
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer sx={{ maxHeight: type === 'submissions' ? 560 : undefined }}>
                    <Table size="small" stickyHeader={type === 'submissions'}>
                      <TableHead>
                        <TableRow>
                          {type === 'submissions' && (
                            <>
                              <TableCell sx={thSx}>Submitted</TableCell>
                              <TableCell sx={thSx}>Check</TableCell>
                              <TableCell sx={thSx}>Contributor</TableCell>
                              <TableCell sx={thSx}>Researcher</TableCell>
                              <TableCell sx={thSx}>Group</TableCell>
                              <TableCell sx={thSx}>Status</TableCell>
                              <TableCell align="right" sx={thSx}>Possible edits</TableCell>
                              <TableCell align="right" sx={thSx}>Similar images</TableCell>
                            </>
                          )}
                          {type === 'sessions' && (
                            <>
                              <TableCell sx={thSx}>Month</TableCell>
                              <TableCell align="right" sx={thSx}>Active researchers</TableCell>
                              <TableCell align="right" sx={thSx}>Checks</TableCell>
                              <TableCell sx={thSx}>Contributors</TableCell>
                            </>
                          )}
                          {type === 'monthly' && (
                            <>
                              <TableCell sx={thSx}>Month</TableCell>
                              <TableCell align="right" sx={thSx}>Submitted</TableCell>
                              <TableCell align="right" sx={thSx}>Completed</TableCell>
                              <TableCell align="right" sx={thSx}>Failed</TableCell>
                              <TableCell align="right" sx={thSx}>Flagged</TableCell>
                              <TableCell align="right" sx={thSx}>Researchers</TableCell>
                            </>
                          )}
                          {type === 'account' && (
                            <>
                              <TableCell sx={thSx}>Researcher</TableCell>
                              <TableCell sx={thSx}>Contributor</TableCell>
                              <TableCell sx={thSx}>Group</TableCell>
                              <TableCell sx={thSx}>Lab</TableCell>
                              <TableCell align="right" sx={thSx}>Checks</TableCell>
                              <TableCell align="right" sx={thSx}>Completed</TableCell>
                              <TableCell align="right" sx={thSx}>Flagged</TableCell>
                              <TableCell align="right" sx={thSx}>Possible edits</TableCell>
                            </>
                          )}
                          {(type === 'group' || type === 'lab') && (
                            <>
                              <TableCell sx={thSx}>{type === 'group' ? 'Group' : 'Lab'}</TableCell>
                              <TableCell align="right" sx={thSx}>Checks</TableCell>
                              <TableCell align="right" sx={thSx}>Completed</TableCell>
                              <TableCell align="right" sx={thSx}>Researchers</TableCell>
                              <TableCell align="right" sx={thSx}>Flagged</TableCell>
                            </>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(report.detail || []).map((row, index) => (
                          <TableRow
                            key={row.id || row.month || row.accountId || row.name || index}
                            hover={type === 'submissions'}
                            onClick={
                              type === 'submissions' && row.id
                                ? () => router.push(`/institution/image-integrity/${row.id}`)
                                : undefined
                            }
                            sx={type === 'submissions' ? { cursor: 'pointer' } : undefined}
                          >
                            {type === 'submissions' && (
                              <>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                  {formatDateTime(row.submittedAt)}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {row.title}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {row.fileName}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ minWidth: 140 }}>{row.contributor}</TableCell>
                                <TableCell>
                                  <Typography variant="body2">{row.account}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {row.email}
                                  </Typography>
                                </TableCell>
                                <TableCell>{row.department}</TableCell>
                                <TableCell>
                                  <StatusChip status={row.status} />
                                </TableCell>
                                <TableCell align="right">{row.manipulation}</TableCell>
                                <TableCell align="right">{row.similarity}</TableCell>
                              </>
                            )}
                            {type === 'sessions' && (
                              <>
                                <TableCell sx={{ fontWeight: 600 }}>{row.label}</TableCell>
                                <TableCell align="right">{row.sessions}</TableCell>
                                <TableCell align="right">{row.submissions}</TableCell>
                                <TableCell sx={{ maxWidth: 420 }}>{row.contributors || '—'}</TableCell>
                              </>
                            )}
                            {type === 'monthly' && (
                              <>
                                <TableCell sx={{ fontWeight: 600 }}>{row.label}</TableCell>
                                <TableCell align="right">{row.submissions}</TableCell>
                                <TableCell align="right">{row.completed}</TableCell>
                                <TableCell align="right">{row.failed}</TableCell>
                                <TableCell align="right">{row.flagged}</TableCell>
                                <TableCell align="right">{row.uniqueResearchers}</TableCell>
                              </>
                            )}
                            {type === 'account' && (
                              <>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {row.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {row.email}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ minWidth: 140 }}>{row.contributor || '—'}</TableCell>
                                <TableCell>{row.department}</TableCell>
                                <TableCell>{row.lab}</TableCell>
                                <TableCell align="right">{row.submissions}</TableCell>
                                <TableCell align="right">{row.completed}</TableCell>
                                <TableCell align="right">{row.flagged}</TableCell>
                                <TableCell align="right">{row.manipulation}</TableCell>
                              </>
                            )}
                            {(type === 'group' || type === 'lab') && (
                              <>
                                <TableCell>
                                  {row.name}
                                  {row.name === 'Unassigned' && (
                                    <Chip size="small" label="Unassigned" sx={{ ml: 1, height: 20 }} />
                                  )}
                                </TableCell>
                                <TableCell align="right">{row.submissions}</TableCell>
                                <TableCell align="right">{row.completed}</TableCell>
                                <TableCell align="right">{row.uniqueResearchers}</TableCell>
                                <TableCell align="right">{row.flagged}</TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            )}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
