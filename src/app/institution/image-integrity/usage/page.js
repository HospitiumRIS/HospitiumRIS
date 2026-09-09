'use client';

import React, { useCallback, useMemo, useState } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
  Chip,
} from '@mui/material';
import {
  Assessment as UsageIcon,
  Search as SearchIcon,
  FileDownload as ExportIcon,
  ArrowBack as BackIcon,
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

const PURPLE = '#8b6cbc';

const REPORT_TYPES = [
  { value: 'submissions', label: 'By Submission', hint: 'Each integrity check, including contributor name' },
  { value: 'sessions', label: 'Sessions', hint: 'Monthly unique researchers who submitted checks' },
  { value: 'monthly', label: 'By Monthly', hint: 'Monthly usage statistics' },
  { value: 'account', label: 'By Account', hint: 'Usage by individual researcher account' },
  { value: 'group', label: 'By Group', hint: 'Usage by department / group' },
  { value: 'lab', label: 'By Lab/Unit', hint: 'Usage by lab or unit' },
];

const STATUS_LABELS = {
  UPLOADING: 'Uploading',
  PROCESSING: 'Analyzing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

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

function SummaryMetric({ label, value }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 16px)' },
        minWidth: 0,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#2D3748', lineHeight: 1.2, mt: 0.5 }}>
        {value}
      </Typography>
    </Paper>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    setHasSearched(true);
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
        setError(data.error || t('institution_nav.integrity_usage_failed', 'Failed to generate usage report.'));
        return;
      }
      setReport(data);
    } catch (err) {
      console.error(err);
      setError(t('institution_nav.integrity_usage_failed', 'Failed to generate usage report.'));
    } finally {
      setLoading(false);
    }
  }, [view, type, org, startDate, endDate, t]);

  const csvSpec = useMemo(() => {
    if (!report) return null;
    if (view === 'summary') {
      return {
        filename: `imachek-usage-summary-${startDate}-to-${endDate}.csv`,
        columns: [
          { key: 'label', label: 'Month' },
          { key: 'submissions', label: 'Submissions' },
          { key: 'completed', label: 'Completed' },
          { key: 'failed', label: 'Failed' },
          { key: 'flagged', label: 'With findings' },
          { key: 'uniqueResearchers', label: 'Unique researchers' },
          { key: 'manipulation', label: 'Manipulation' },
          { key: 'similarity', label: 'Similarity' },
        ],
        rows: report.monthly || [],
      };
    }
    if (type === 'submissions') {
      return {
        filename: `imachek-usage-submissions-${startDate}-to-${endDate}.csv`,
        columns: [
          { key: 'submittedAt', label: 'Submitted' },
          { key: 'title', label: 'Title' },
          { key: 'contributor', label: 'Contributor' },
          { key: 'account', label: 'Account' },
          { key: 'email', label: 'Email' },
          { key: 'department', label: 'Group' },
          { key: 'lab', label: 'Lab/Unit' },
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
        filename: `imachek-usage-account-${startDate}-to-${endDate}.csv`,
        columns: [
          { key: 'name', label: 'Account' },
          { key: 'email', label: 'Email' },
          { key: 'contributor', label: 'Contributor' },
          { key: 'department', label: 'Group' },
          { key: 'lab', label: 'Lab/Unit' },
          { key: 'submissions', label: 'Submissions' },
          { key: 'completed', label: 'Completed' },
          { key: 'flagged', label: 'With findings' },
          { key: 'manipulation', label: 'Manipulation' },
          { key: 'similarity', label: 'Similarity' },
        ],
        rows: report.detail || [],
      };
    }
    if (type === 'sessions') {
      return {
        filename: `imachek-usage-sessions-${startDate}-to-${endDate}.csv`,
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
      filename: `imachek-usage-${type}-${startDate}-to-${endDate}.csv`,
      columns: [
        { key: type === 'monthly' ? 'label' : 'name', label: nameLabel },
        { key: 'submissions', label: 'Submissions' },
        { key: 'completed', label: 'Completed' },
        { key: 'flagged', label: 'With findings' },
        ...(type === 'monthly'
          ? [
              { key: 'failed', label: 'Failed' },
              { key: 'uniqueResearchers', label: 'Unique researchers' },
            ]
          : [{ key: 'uniqueResearchers', label: 'Unique researchers' }]),
        { key: 'manipulation', label: 'Manipulation' },
        { key: 'similarity', label: 'Similarity' },
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

  return (
    <Box>
      <PageHeader
        title={t('institution_nav.integrity_usage_report', 'Usage Report')}
        description={t(
          'institution_nav.integrity_usage_desc',
          'Monthly usage overview and detailed ImaChek activity for this institution'
        )}
        icon={<UsageIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: t('institution.portal_title', 'Institution Portal'), path: '/institution' },
          { label: t('institution.image_integrity', 'Image Integrity'), path: '/institution/image-integrity' },
          { label: t('institution_nav.integrity_usage_report', 'Usage Report') },
        ]}
      />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push('/institution/image-integrity')}
          sx={{ mb: 3, color: PURPLE, textTransform: 'none', fontWeight: 600 }}
        >
          {t('institution_nav.integrity_back_to_list', 'Back to Submission Reports')}
        </Button>

        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={2}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={view}
              onChange={(_, value) => value && setView(value)}
              sx={{
                '& .MuiToggleButton-root.Mui-selected': { bgcolor: PURPLE, color: 'white', '&:hover': { bgcolor: '#7a5aad' } },
              }}
            >
              <ToggleButton value="summary">{t('researcher.integrity_summary', 'Summary')}</ToggleButton>
              <ToggleButton value="detail">{t('institution_nav.integrity_usage_detail', 'Detail')}</ToggleButton>
            </ToggleButtonGroup>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
              <TextField
                type="date"
                size="small"
                label={t('common.start_date', 'Start date')}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="date"
                size="small"
                label={t('common.end_date', 'End date')}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              {view === 'detail' && (
                <>
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel>{t('institution_nav.integrity_usage_org', 'Organization')}</InputLabel>
                    <Select
                      value={org}
                      label={t('institution_nav.integrity_usage_org', 'Organization')}
                      onChange={(e) => setOrg(e.target.value)}
                    >
                      <MenuItem value="all">
                        {t('institution_nav.integrity_usage_org_all', 'Entire institution')}
                      </MenuItem>
                      {organizations.labs.map((lab) => (
                        <MenuItem key={lab.value} value={lab.value}>
                          {t('institution_nav.integrity_usage_lab_prefix', 'Lab/Unit')}: {lab.label}
                        </MenuItem>
                      ))}
                      {organizations.groups.map((group) => (
                        <MenuItem key={group.value} value={group.value}>
                          {t('institution_nav.integrity_usage_group_prefix', 'Group')}: {group.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>{t('institution_nav.integrity_usage_type', 'Report type')}</InputLabel>
                    <Select
                      value={type}
                      label={t('institution_nav.integrity_usage_type', 'Report type')}
                      onChange={(e) => setType(e.target.value)}
                    >
                      {REPORT_TYPES.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}

              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
                onClick={loadReport}
                disabled={loading}
                sx={{ bgcolor: PURPLE, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#7a5aad' } }}
              >
                {t('common.search', 'Search')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                disabled={!csvSpec || (csvSpec.rows || []).length === 0}
                onClick={handleExport}
                sx={{ borderColor: PURPLE, color: PURPLE, fontWeight: 700, textTransform: 'none' }}
              >
                {t('institution_nav.integrity_export_csv', 'Export to CSV')}
              </Button>
            </Stack>

            {view === 'detail' && (
              <Typography variant="caption" color="text.secondary">
                {REPORT_TYPES.find((option) => option.value === type)?.hint}
                {type === 'group'
                  ? ` ${t(
                      'institution_nav.integrity_usage_group_note',
                      'No data will be displayed if groups have not been configured for the lab/unit.'
                    )}`
                  : ''}
              </Typography>
            )}
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!hasSearched && !loading && (
          <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
            <Typography color="text.secondary">
              {t(
                'institution_nav.integrity_usage_idle',
                'Set a date range and click Search to generate the usage report.'
              )}
            </Typography>
          </Paper>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: PURPLE }} />
          </Box>
        )}

        {!loading && report && view === 'summary' && summary && (
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              <SummaryMetric label={t('institution_nav.integrity_total', 'Total')} value={summary.submissions} />
              <SummaryMetric label={t('institution_nav.integrity_completed', 'Completed')} value={summary.completed} />
              <SummaryMetric label={t('institution_nav.integrity_flagged', 'With findings')} value={summary.flagged} />
              <SummaryMetric
                label={t('institution_nav.integrity_usage_researchers', 'Unique researchers')}
                value={summary.uniqueResearchers}
              />
            </Box>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                {t('institution_nav.integrity_usage_monthly', 'Monthly usage')}
              </Typography>
              {(report.monthly || []).length === 0 ? (
                <Typography color="text.secondary">
                  {t('institution_nav.integrity_usage_empty', 'No usage in this date range.')}
                </Typography>
              ) : (
                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.monthly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="submissions" name="Submissions" fill={PURPLE} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="flagged" name="With findings" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                      <TableCell>Month</TableCell>
                      <TableCell align="right">Submissions</TableCell>
                      <TableCell align="right">Completed</TableCell>
                      <TableCell align="right">Failed</TableCell>
                      <TableCell align="right">With findings</TableCell>
                      <TableCell align="right">Researchers</TableCell>
                      <TableCell align="right">Manipulation</TableCell>
                      <TableCell align="right">Similarity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(report.monthly || []).map((row) => (
                      <TableRow key={row.month}>
                        <TableCell>{row.label}</TableCell>
                        <TableCell align="right">{row.submissions}</TableCell>
                        <TableCell align="right">{row.completed}</TableCell>
                        <TableCell align="right">{row.failed}</TableCell>
                        <TableCell align="right">{row.flagged}</TableCell>
                        <TableCell align="right">{row.uniqueResearchers}</TableCell>
                        <TableCell align="right">{row.manipulation}</TableCell>
                        <TableCell align="right">{row.similarity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Stack>
        )}

        {!loading && report && view === 'detail' && (
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
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.detail}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="submissions" name="Submissions" fill={PURPLE} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            )}

            {!(type === 'group' && !report.groupsConfigured) && (
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
              {(report.detail || []).length === 0 ? (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    {t('institution_nav.integrity_usage_empty', 'No usage in this date range.')}
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: type === 'submissions' ? 560 : undefined }}>
                  <Table size="small" stickyHeader={type === 'submissions'}>
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                        {type === 'submissions' && (
                          <>
                            <TableCell>Submitted</TableCell>
                            <TableCell>Title</TableCell>
                            <TableCell>Contributor</TableCell>
                            <TableCell>Account</TableCell>
                            <TableCell>Group</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Possible edits</TableCell>
                            <TableCell align="right">Similar images</TableCell>
                          </>
                        )}
                        {type === 'sessions' && (
                          <>
                            <TableCell>Month</TableCell>
                            <TableCell align="right">Active researchers</TableCell>
                            <TableCell align="right">Submissions</TableCell>
                            <TableCell>Contributors</TableCell>
                          </>
                        )}
                        {type === 'monthly' && (
                          <>
                            <TableCell>Month</TableCell>
                            <TableCell align="right">Submissions</TableCell>
                            <TableCell align="right">Completed</TableCell>
                            <TableCell align="right">Failed</TableCell>
                            <TableCell align="right">With findings</TableCell>
                            <TableCell align="right">Researchers</TableCell>
                          </>
                        )}
                        {type === 'account' && (
                          <>
                            <TableCell>Account</TableCell>
                            <TableCell>Contributor</TableCell>
                            <TableCell>Group</TableCell>
                            <TableCell>Lab/Unit</TableCell>
                            <TableCell align="right">Submissions</TableCell>
                            <TableCell align="right">Completed</TableCell>
                            <TableCell align="right">With findings</TableCell>
                            <TableCell align="right">Manipulation</TableCell>
                          </>
                        )}
                        {(type === 'group' || type === 'lab') && (
                          <>
                            <TableCell>{type === 'group' ? 'Group' : 'Lab/Unit'}</TableCell>
                            <TableCell align="right">Submissions</TableCell>
                            <TableCell align="right">Completed</TableCell>
                            <TableCell align="right">Researchers</TableCell>
                            <TableCell align="right">With findings</TableCell>
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
                                <Chip
                                  size="small"
                                  label={STATUS_LABELS[row.status] || row.status}
                                  sx={{ height: 22, fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell align="right">{row.manipulation}</TableCell>
                              <TableCell align="right">{row.similarity}</TableCell>
                            </>
                          )}
                          {type === 'sessions' && (
                            <>
                              <TableCell>{row.label}</TableCell>
                              <TableCell align="right">{row.sessions}</TableCell>
                              <TableCell align="right">{row.submissions}</TableCell>
                              <TableCell sx={{ maxWidth: 420 }}>{row.contributors || '—'}</TableCell>
                            </>
                          )}
                          {type === 'monthly' && (
                            <>
                              <TableCell>{row.label}</TableCell>
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
