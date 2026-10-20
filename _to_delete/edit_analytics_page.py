import sys
p = sys.argv[1]
raw = open(p, encoding='utf-8', newline='').read()
crlf = '\r\n' in raw
import re
s = re.sub(r'[ \t]+\n', '\n', raw.replace('\r\n', '\n'))

def rep(old, new):
    global s
    assert s.count(old) == 1, 'NOT UNIQUE/FOUND: ' + old[:100]
    s = s.replace(old, new)

rep("""import InstitutionReportsDashboard from '@/components/Analytics/InstitutionReportsDashboard';
""", """import InstitutionReportsDashboard from '@/components/Analytics/InstitutionReportsDashboard';

const toInputDate = (date) => {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const RANGE_PRESETS = [
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 90 days', days: 90 },
  { key: '12m', label: 'Last 12 months', months: 12 },
  { key: 'ytd', label: 'This year', ytd: true },
  { key: 'all', label: 'All time', all: true },
];

const presetRange = (preset) => {
  const end = new Date();
  const start = new Date(end);
  if (preset.days) start.setDate(start.getDate() - preset.days + 1);
  else if (preset.months) { start.setMonth(start.getMonth() - preset.months); start.setDate(start.getDate() + 1); }
  else if (preset.ytd) { start.setMonth(0, 1); }
  else if (preset.all) { start.setFullYear(2000, 0, 1); }
  return { startDate: toInputDate(start), endDate: toInputDate(end) };
};
""")

rep("""  const [researcherSearchTerm, setResearcherSearchTerm] = useState('');

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/institution/analytics', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setError('Failed to load institutional analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };
""", """  const [researcherSearchTerm, setResearcherSearchTerm] = useState('');
  const [rangePreset, setRangePreset] = useState('12m');
  const [range, setRange] = useState(() => presetRange(RANGE_PRESETS[2]));
  const [draftRange, setDraftRange] = useState(() => presetRange(RANGE_PRESETS[2]));
  const [reportsData, setReportsData] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState('');

  useEffect(() => {
    loadAnalyticsData(range);
    loadReportsData(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.startDate, range.endDate]);

  const rangeQuery = (r) => `startDate=${encodeURIComponent(r.startDate)}&endDate=${encodeURIComponent(r.endDate)}`;

  const loadAnalyticsData = async (r = range) => {
    try {
      if (!analyticsData) setLoading(true);
      setError(null);

      const response = await fetch(`/api/institution/analytics?${rangeQuery(r)}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setError('Failed to load institutional analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadReportsData = async (r = range) => {
    try {
      setReportsLoading(true);
      setReportsError('');
      const response = await fetch(`/api/institution/analytics/reports?${rangeQuery(r)}`, { credentials: 'include' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to load reports');
      setReportsData(data);
    } catch (err) {
      console.error('Error loading institution reports:', err);
      setReportsError(err.message || 'Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  };

  const applyPreset = (preset) => {
    const next = presetRange(preset);
    setRangePreset(preset.key);
    setDraftRange(next);
    setRange(next);
  };

  const applyCustomRange = () => {
    if (!draftRange.startDate || !draftRange.endDate || draftRange.startDate > draftRange.endDate) return;
    setRangePreset('custom');
    setRange({ ...draftRange });
  };

  const handleRefresh = () => {
    loadAnalyticsData(range);
    loadReportsData(range);
  };
""")

rep("""      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Key Performance Indicators */}""", """      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Reporting period */}
        <Paper
          elevation={0}
          sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2d3748' }}>
              Reporting period{analyticsData?.institution?.name ? ` · ${analyticsData.institution.name}` : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Applies to the cards and every report below. Reports compare against the previous period of the same length.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            {RANGE_PRESETS.map((preset) => (
              <Chip
                key={preset.key}
                label={preset.label}
                onClick={() => applyPreset(preset)}
                sx={{
                  fontWeight: 600,
                  bgcolor: rangePreset === preset.key ? '#8b6cbc' : alpha('#8b6cbc', 0.08),
                  color: rangePreset === preset.key ? 'white' : '#8b6cbc',
                  '&:hover': { bgcolor: rangePreset === preset.key ? '#7b5ca7' : alpha('#8b6cbc', 0.15) },
                }}
              />
            ))}
            <TextField
              type="date"
              size="small"
              label="From"
              value={draftRange.startDate}
              onChange={(event) => setDraftRange((prev) => ({ ...prev, startDate: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: draftRange.endDate }}
              sx={{ width: 160 }}
            />
            <TextField
              type="date"
              size="small"
              label="To"
              value={draftRange.endDate}
              onChange={(event) => setDraftRange((prev) => ({ ...prev, endDate: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: draftRange.startDate, max: toInputDate(new Date()) }}
              sx={{ width: 160 }}
            />
            <Button
              variant="contained"
              onClick={applyCustomRange}
              disabled={!draftRange.startDate || !draftRange.endDate || draftRange.startDate > draftRange.endDate || (draftRange.startDate === range.startDate && draftRange.endDate === range.endDate)}
              sx={{ bgcolor: '#8b6cbc', textTransform: 'none', fontWeight: 700, boxShadow: 'none', '&:hover': { bgcolor: '#7b5ca7', boxShadow: 'none' } }}
            >
              Apply
            </Button>
          </Stack>
        </Paper>

        {/* Key Performance Indicators */}""")

rep("""        <InstitutionReportsDashboard />""", """        <InstitutionReportsDashboard data={reportsData} loading={reportsLoading} error={reportsError} />""")

if crlf:
    s = s.replace('\n', '\r\n')
open(p, 'w', encoding='utf-8', newline='').write(s)
print('page edited')
