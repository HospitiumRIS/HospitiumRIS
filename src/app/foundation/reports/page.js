'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Container, Typography, Paper, Chip, Button, Stack, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Avatar, alpha, CircularProgress, Alert,
} from '@mui/material';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Campaign as CampaignIcon,
  Assessment as AssessmentIcon,
  Autorenew as RetentionIcon,
  Star as StarIcon,
  AccountBalance as GrantIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Timeline as TrendsIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const PURPLE = '#8b6cbc';
const COLORS = [
  '#8b6cbc', '#3b82f6', '#22c55e', '#f59e0b',
  '#ef4444', '#0891b2', '#ec4899', '#84cc16',
  '#f97316', '#6366f1',
];

const fmt = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n || 0);

const fmtShort = (n) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n || 0)}`;
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const RADIAN = Math.PI / 180;
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.58;
  return (
    <text
      x={cx + r * Math.cos(-midAngle * RADIAN)}
      y={cy + r * Math.sin(-midAngle * RADIAN)}
      fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Shared section card with left-accent header
const CardSection = ({ icon, title, subtitle, action, children, sx = {} }) => (
  <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3, ...sx }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 3, height: 22, bgcolor: PURPLE, borderRadius: 2, flexShrink: 0 }} />
        <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: alpha(PURPLE, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {React.cloneElement(icon, { sx: { fontSize: 17, color: PURPLE } })}
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>{subtitle}</Typography>}
        </Box>
      </Box>
      {action}
    </Box>
    {children}
  </Paper>
);

const TABS = [
  { label: 'Overview',  icon: <TrendsIcon sx={{ fontSize: 15 }} /> },
  { label: 'Campaigns', icon: <CampaignIcon sx={{ fontSize: 15 }} /> },
  { label: 'Donors',    icon: <PeopleIcon sx={{ fontSize: 15 }} /> },
  { label: 'Grants',    icon: <GrantIcon sx={{ fontSize: 15 }} /> },
];

export default function ReportsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [anaData, setAnaData] = useState(null);
  const [error, setError] = useState(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch('/api/foundation/donations/analytics').then((r) => r.json()),
      fetch('/api/foundation/analytics').then((r) => r.json()),
    ])
      .then(([donRes, anaRes]) => {
        if (donRes.success) setData(donRes.data);
        else setError(donRes.error || 'Failed to load donation analytics');
        setAnaData(anaRes);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const monthlyTrends = useMemo(() => {
    if (!data?.monthlyTrends?.length) return [];
    return [...data.monthlyTrends].reverse();
  }, [data]);

  const categoryChartData = useMemo(() =>
    (data?.categoryPerformance || [])
      .filter((c) => c.raised > 0)
      .slice(0, 8)
      .map((c, i) => ({ name: c.name, value: c.raised, color: COLORS[i % COLORS.length] })),
    [data]);

  const donorTypeData = useMemo(() =>
    Object.entries(data?.donorTypes || {})
      .filter(([, v]) => v.count > 0)
      .map(([k, v], i) => ({
        name: k.charAt(0) + k.slice(1).toLowerCase(),
        value: v.count, amount: v.amount,
        color: COLORS[i % COLORS.length],
      })),
    [data]);

  const paymentData = useMemo(() =>
    Object.entries(data?.paymentMethods || {})
      .filter(([, v]) => v.count > 0)
      .map(([k, v]) => ({ name: k.replace(/_/g, ' '), count: v.count, amount: v.amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8),
    [data]);

  const topCampaigns = useMemo(() =>
    (data?.campaignPerformance || []).slice(0, 12).map((c) => ({
      name: c.name.length > 28 ? c.name.slice(0, 26) + '…' : c.name,
      raised: c.raised, target: c.targetAmount,
      donors: c.donorCount, pct: c.completionPercentage,
      status: c.status, category: c.categoryName,
    })),
    [data]);

  const campaignBarData = useMemo(() => topCampaigns.slice(0, 8), [topCampaigns]);
  const retention = data?.retentionAnalysis || {};
  const overview = data?.overview || {};
  const grantOpps = useMemo(() => (anaData?.grantOpportunities || []).slice(0, 12), [anaData]);
  const grantOverview = anaData?.overview || {};

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={44} sx={{ color: PURPLE }} />
        <Typography color="text.secondary" sx={{ fontWeight: 500 }}>Loading reports…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" action={<Button size="small" onClick={loadData}>Retry</Button>}>{error}</Alert>
      </Container>
    );
  }

  return (
    <>
      {/* ── Header ── */}
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Reports & Analytics"
          description="Performance reports, trend analysis, and funder-ready insights across campaigns, donations, and grants"
          icon={<AssessmentIcon sx={{ fontSize: 28 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Reports & Analytics' },
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          actionButton={
            <Stack direction="row" spacing={1.5}>
              <Button variant="contained" size="small" startIcon={<RefreshIcon />} onClick={loadData}
                sx={{ bgcolor: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.32)' } }}>
                Refresh
              </Button>
              <Button variant="contained" size="small" startIcon={<DownloadIcon />} onClick={() => window.print()}
                sx={{ bgcolor: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}>
                Export PDF
              </Button>
            </Stack>
          }
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>

        {/* ── Inline KPI strip ── */}
        <Paper elevation={0} sx={{ borderRadius: 2, mb: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 1.5, background: `linear-gradient(135deg, ${alpha(PURPLE, 0.06)} 0%, ${alpha(PURPLE, 0.03)} 100%)`, display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', rowGap: 0.5 }}>
            {[
              { label: 'Total Raised',   value: fmt(overview.totalAmount),                          icon: <MoneyIcon sx={{ fontSize: 15 }} />,       color: PURPLE    },
              { label: 'Donations',      value: (overview.totalDonations || 0).toLocaleString(),     icon: <CampaignIcon sx={{ fontSize: 15 }} />,    color: '#3b82f6' },
              { label: 'Unique Donors',  value: (overview.uniqueDonors || 0).toLocaleString(),       icon: <PeopleIcon sx={{ fontSize: 15 }} />,      color: '#0891b2' },
              { label: 'Avg Gift',       value: fmt(overview.avgDonation),                           icon: <TrendingUpIcon sx={{ fontSize: 15 }} />,  color: '#22c55e' },
              { label: 'Retention',      value: `${(overview.retentionRate || 0).toFixed(1)}%`,      icon: <RetentionIcon sx={{ fontSize: 15 }} />,   color: '#f59e0b' },
              { label: 'Campaigns',      value: (grantOverview.activeCampaigns || 0).toLocaleString(), icon: <CampaignIcon sx={{ fontSize: 15 }} />, color: '#ec4899' },
              { label: 'Open Grants',    value: (grantOverview.activeGrants || 0).toLocaleString(),  icon: <GrantIcon sx={{ fontSize: 15 }} />,       color: '#6366f1' },
            ].map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Divider orientation="vertical" flexItem sx={{ mx: 2, my: 0.5 }} />}
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ px: 1, py: 0.25 }}>
                  <Box sx={{ color: item.color, display: 'flex', opacity: 0.9 }}>{item.icon}</Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>{item.label}:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.8rem' }}>{item.value}</Typography>
                </Stack>
              </React.Fragment>
            ))}
          </Box>
        </Paper>

        {/* ── Pill tab selector ── */}
        <Box sx={{ display: 'flex', gap: 0.5, p: 0.5, bgcolor: alpha(PURPLE, 0.05), borderRadius: 2.5, mb: 3, width: 'fit-content' }}>
          {TABS.map(({ label, icon }, i) => (
            <Button key={label} onClick={() => setTab(i)} size="small" startIcon={icon}
              sx={{
                borderRadius: 2, px: 2, py: 0.75, fontWeight: tab === i ? 700 : 500, textTransform: 'none', fontSize: '0.85rem', gap: 0.5,
                bgcolor: tab === i ? 'white' : 'transparent',
                color: tab === i ? PURPLE : 'text.secondary',
                boxShadow: tab === i ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
                '&:hover': { bgcolor: tab === i ? 'white' : alpha(PURPLE, 0.07), color: tab === i ? PURPLE : 'text.primary' },
                transition: 'all 0.18s',
              }}
            >
              {label}
            </Button>
          ))}
        </Box>

        {/* ══════════════════════════════════════════ OVERVIEW ══ */}
        {tab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Row 1 – Trend + Category */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>

              <CardSection icon={<TrendsIcon />} title="Monthly Inflow Trend"
                subtitle="Total donation revenue over the past 12 months" sx={{ flex: '2 1 360px', minWidth: 0 }}>
                {monthlyTrends.length === 0
                  ? <Box sx={{ py: 6, textAlign: 'center' }}><Typography color="text.disabled">No trend data</Typography></Box>
                  : <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={monthlyTrends} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={PURPLE} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={PURPLE} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(PURPLE, 0.1)} />
                        <XAxis dataKey="monthName" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                        <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                        <RTooltip formatter={(v) => [fmt(v), 'Revenue']} contentStyle={{ borderRadius: 8, border: `1px solid ${alpha(PURPLE,0.2)}`, fontSize: 13 }} />
                        <Area type="monotone" dataKey="amount" stroke={PURPLE} strokeWidth={2.5} fill="url(#ag2)" dot={{ r: 3, fill: PURPLE }} activeDot={{ r: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                }
              </CardSection>

              <CardSection icon={<PieChartIcon />} title="Funds by Category"
                subtitle="Share of total raised per programme area" sx={{ flex: '1 1 220px', minWidth: 0 }}>
                {categoryChartData.length === 0
                  ? <Box sx={{ py: 6, textAlign: 'center' }}><Typography color="text.disabled">No category data</Typography></Box>
                  : <>
                      <ResponsiveContainer width="100%" height={190}>
                        <PieChart>
                          <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={84} paddingAngle={3} dataKey="value" labelLine={false} label={<PieLabel />}>
                            {categoryChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <RTooltip formatter={(v) => [fmt(v)]} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <Stack spacing={0.55} sx={{ mt: 1 }}>
                        {categoryChartData.map((c) => (
                          <Box key={c.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c.color, flexShrink: 0 }} />
                            <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 700 }}>{fmt(c.value)}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    </>
                }
              </CardSection>
            </Box>

            {/* Row 2 – Campaign tracker */}
            <CardSection icon={<BarChartIcon />} title="Campaign Progress Tracker"
              subtitle="Fundraising completion toward each campaign target">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                {topCampaigns.slice(0, 7).map((c) => (
                  <Box key={c.name}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, overflow: 'hidden' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</Typography>
                        <Chip label={c.status} size="small"
                          sx={{ height: 17, fontSize: '0.63rem', fontWeight: 600, flexShrink: 0,
                            bgcolor: c.status === 'Active' ? alpha('#22c55e',0.1) : alpha('#94a3b8',0.12),
                            color: c.status === 'Active' ? '#16a34a' : '#64748b' }} />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0, ml: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {fmt(c.raised)}{c.target > 0 ? ` / ${fmt(c.target)}` : ''}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: PURPLE, minWidth: 36, textAlign: 'right', fontSize: '0.75rem' }}>
                          {c.pct > 0 ? `${Math.min(c.pct,100).toFixed(0)}%` : '—'}
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress variant="determinate" value={Math.min(c.pct||0,100)}
                      sx={{ height: 6, borderRadius: 3, bgcolor: alpha(PURPLE,0.08),
                        '& .MuiLinearProgress-bar': { bgcolor: c.pct>=100 ? '#22c55e' : PURPLE, borderRadius: 3 } }} />
                  </Box>
                ))}
              </Box>
            </CardSection>
          </Box>
        )}

        {/* ══════════════════════════════════════════ CAMPAIGNS ══ */}
        {tab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Charts row */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
              <CardSection icon={<BarChartIcon />} title="Top Campaigns by Revenue"
                subtitle="Total donations received per campaign" sx={{ flex: '1 1 340px', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaignBarData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(PURPLE,0.1)} horizontal={false} />
                    <XAxis type="number" tickFormatter={fmtShort} tick={{ fontSize:11, fill:'#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" width={148} tick={{ fontSize:10, fill:'#64748b' }} tickLine={false} axisLine={false} />
                    <RTooltip formatter={(v) => [fmt(v),'Raised']} contentStyle={{ borderRadius:8, fontSize:13 }} />
                    <Bar dataKey="raised" radius={[0,4,4,0]} maxBarSize={20}>
                      {campaignBarData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardSection>

              <CardSection icon={<TrendsIcon />} title="Monthly Donation Volume"
                subtitle="Number of gifts received each month" sx={{ flex: '1 1 260px', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyTrends} margin={{ top:5, right:10, left:0, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(PURPLE,0.1)} vertical={false} />
                    <XAxis dataKey="monthName" tick={{ fontSize:10, fill:'#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize:11, fill:'#64748b' }} tickLine={false} axisLine={false} />
                    <RTooltip formatter={(v) => [v,'Donations']} contentStyle={{ borderRadius:8, fontSize:13 }} />
                    <Bar dataKey="count" fill={alpha(PURPLE,0.75)} radius={[4,4,0,0]} maxBarSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              </CardSection>
            </Box>

            {/* Table */}
            <CardSection icon={<AssessmentIcon />} title="Campaign Performance Table"
              subtitle="Detailed metrics for all tracked campaigns">
              <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: PURPLE }}>
                      <TableRow>
                        {['Campaign','Category','Status','Raised','Target','Progress','Donors'].map((h) => (
                          <TableCell key={h} sx={{ color:'white', fontWeight:600, fontSize:'0.8rem', py:1.5 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topCampaigns.map((c,i) => (
                        <TableRow key={i} hover sx={{ '&:last-child td':{ border:0 } }}>
                          <TableCell sx={{ fontWeight:600, fontSize:'0.82rem', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</TableCell>
                          <TableCell><Chip label={c.category} size="small" sx={{ fontSize:'0.68rem', height:20, bgcolor:alpha(PURPLE,0.08), color:PURPLE }} /></TableCell>
                          <TableCell>
                            <Chip label={c.status} size="small" sx={{ fontSize:'0.68rem', height:20, bgcolor: c.status==='Active' ? alpha('#22c55e',0.1) : alpha('#94a3b8',0.1), color: c.status==='Active' ? '#16a34a' : '#64748b' }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight:700, color:'#16a34a', fontSize:'0.82rem' }}>{fmt(c.raised)}</TableCell>
                          <TableCell sx={{ fontSize:'0.82rem', color:'text.secondary' }}>{c.target > 0 ? fmt(c.target) : '—'}</TableCell>
                          <TableCell sx={{ minWidth:120 }}>
                            <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                              <LinearProgress variant="determinate" value={Math.min(c.pct||0,100)}
                                sx={{ flex:1, height:5, borderRadius:3, bgcolor:alpha(PURPLE,0.08), '& .MuiLinearProgress-bar':{ bgcolor: c.pct>=100 ? '#22c55e' : PURPLE, borderRadius:3 } }} />
                              <Typography variant="caption" sx={{ fontWeight:700, fontSize:'0.7rem', minWidth:30 }}>{c.pct > 0 ? `${Math.min(c.pct,100).toFixed(0)}%` : '—'}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontSize:'0.82rem' }}>{c.donors}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </CardSection>
          </Box>
        )}

        {/* ══════════════════════════════════════════ DONORS ══ */}
        {tab === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Top row – 3 panels */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>

              <CardSection icon={<PeopleIcon />} title="Donors by Type"
                subtitle="Gift count & revenue by donor category" sx={{ flex: '1 1 200px', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height={175}>
                  <PieChart>
                    <Pie data={donorTypeData} cx="50%" cy="50%" innerRadius={44} outerRadius={78} paddingAngle={3} dataKey="value" labelLine={false} label={<PieLabel />}>
                      {donorTypeData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie>
                    <RTooltip formatter={(v,n) => [`${v} donors`, n]} contentStyle={{ borderRadius:8, fontSize:13 }} />
                  </PieChart>
                </ResponsiveContainer>
                <Stack spacing={0.55} sx={{ mt: 1.5 }}>
                  {donorTypeData.map((d) => (
                    <Box key={d.name} sx={{ display:'flex', alignItems:'center', gap:1 }}>
                      <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:d.color, flexShrink:0 }} />
                      <Typography variant="caption" sx={{ fontSize:'0.72rem', flex:1 }}>{d.name}</Typography>
                      <Typography variant="caption" sx={{ fontWeight:700, fontSize:'0.72rem' }}>{d.value} · {fmt(d.amount)}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardSection>

              <CardSection icon={<BarChartIcon />} title="Payment Methods"
                subtitle="Revenue and volume by payment channel" sx={{ flex: '2 1 280px', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={paymentData} margin={{ top:5, right:10, left:0, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(PURPLE,0.1)} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize:10, fill:'#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={fmtShort} tick={{ fontSize:11, fill:'#64748b' }} tickLine={false} axisLine={false} />
                    <RTooltip formatter={(v,n) => [n==='amount' ? fmt(v) : v, n==='amount' ? 'Revenue' : 'Transactions']} contentStyle={{ borderRadius:8, fontSize:13 }} />
                    <Legend formatter={(v) => v==='amount' ? 'Revenue' : 'Transactions'} wrapperStyle={{ fontSize:12 }} />
                    <Bar dataKey="amount" name="amount" fill={PURPLE} radius={[4,4,0,0]} maxBarSize={36} />
                    <Bar dataKey="count"  name="count"  fill={alpha(PURPLE,0.28)} radius={[4,4,0,0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </CardSection>

              <CardSection icon={<StarIcon />} title="Donor Loyalty"
                subtitle="Segmentation by giving frequency" sx={{ flex: '1 1 170px', minWidth: 0 }}>
                {[
                  { label:'One-time',    value: retention.oneTimeDonors   || 0, color:'#ef4444', icon:<PersonIcon sx={{ fontSize:15 }} /> },
                  { label:'Returning',   value: retention.returningDonors || 0, color:'#f59e0b', icon:<RetentionIcon sx={{ fontSize:15 }} /> },
                  { label:'Loyal (5+)',  value: retention.loyalDonors     || 0, color:'#22c55e', icon:<StarIcon sx={{ fontSize:15 }} /> },
                  { label:'New (<6 mo)', value: retention.newDonors       || 0, color:'#3b82f6', icon:<PeopleIcon sx={{ fontSize:15 }} /> },
                ].map(({ label, value, color, icon }) => (
                  <Box key={label} sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', py:1.3, borderBottom:'1px solid', borderColor:'divider', '&:last-child':{ border:0 } }}>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                      <Box sx={{ color, display:'flex' }}>{icon}</Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize:'0.8rem' }}>{label}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight:800, fontSize:'1rem', color }}>{value.toLocaleString()}</Typography>
                  </Box>
                ))}
              </CardSection>
            </Box>

            {/* Top Donors table */}
            <CardSection icon={<PeopleIcon />} title="Top Donors"
              subtitle="Highest-value giving relationships ranked by lifetime contribution">
              <Paper elevation={0} sx={{ borderRadius:2, overflow:'hidden', border:'1px solid', borderColor:'divider' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: PURPLE }}>
                      <TableRow>
                        {['#','Donor','Type','Total Donated','Gifts','Avg Gift','Last Gift','Campaigns'].map((h) => (
                          <TableCell key={h} sx={{ color:'white', fontWeight:600, fontSize:'0.78rem', py:1.5 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(data?.topDonors || []).slice(0,15).map((d,i) => (
                        <TableRow key={i} hover sx={{ '&:last-child td':{ border:0 } }}>
                          <TableCell sx={{ color:'text.disabled', fontWeight:600, fontSize:'0.75rem' }}>{i+1}</TableCell>
                          <TableCell>
                            <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
                              <Avatar sx={{ width:28, height:28, bgcolor:alpha(PURPLE,0.15), color:PURPLE, fontSize:'0.65rem', fontWeight:700 }}>
                                {d.isAnonymous ? '?' : (d.name||'?').split(' ').filter(Boolean).map((n)=>n[0]).join('').slice(0,2).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight:600, fontSize:'0.8rem', lineHeight:1.2 }}>
                                  {d.isAnonymous ? 'Anonymous' : (d.name||'—')}
                                </Typography>
                                {d.email && !d.isAnonymous && (
                                  <Typography variant="caption" color="text.disabled" sx={{ fontSize:'0.68rem' }}>{d.email}</Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={d.type ? d.type.charAt(0)+d.type.slice(1).toLowerCase() : '—'} size="small" sx={{ fontSize:'0.65rem', height:18, bgcolor:alpha('#3b82f6',0.08), color:'#2563eb' }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight:700, color:'#16a34a', fontSize:'0.82rem' }}>{fmt(d.totalAmount)}</TableCell>
                          <TableCell sx={{ fontSize:'0.82rem' }}>{d.donationCount}</TableCell>
                          <TableCell sx={{ fontSize:'0.82rem', color:'text.secondary' }}>{fmt(d.averageAmount)}</TableCell>
                          <TableCell sx={{ fontSize:'0.78rem', color:'text.secondary' }}>{fmtDate(d.lastDonation)}</TableCell>
                          <TableCell sx={{ fontSize:'0.82rem' }}>{d.campaigns}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </CardSection>
          </Box>
        )}

        {/* ══════════════════════════════════════════ GRANTS ══ */}
        {tab === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Grant KPI strip */}
            <Paper elevation={0} sx={{ borderRadius:2, border:'1px solid', borderColor:'divider', overflow:'hidden' }}>
              <Box sx={{ px:3, py:1.5, background:`linear-gradient(135deg, ${alpha(PURPLE,0.06)} 0%, ${alpha(PURPLE,0.03)} 100%)`, display:'flex', alignItems:'center', flexWrap:'wrap', gap:0, rowGap:0.5 }}>
                {[
                  { label:'Open Opportunities', value:(grantOverview.activeGrants||0).toLocaleString(), icon:<CheckCircleIcon sx={{ fontSize:15 }} />, color:'#22c55e' },
                  { label:'Total Pipeline',      value: fmt(grantOverview.totalGrants||0),              icon:<MoneyIcon sx={{ fontSize:15 }} />,        color: PURPLE   },
                  { label:'Avg Grant Size',      value: fmt(grantOverview.avgGrantAmount||0),           icon:<TrendingUpIcon sx={{ fontSize:15 }} />,   color:'#0891b2' },
                  { label:'Campaign Success',    value:`${(grantOverview.grantSuccess||0).toFixed(1)}%`,icon:<StarIcon sx={{ fontSize:15 }} />,         color:'#f59e0b' },
                ].map((item,i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <Divider orientation="vertical" flexItem sx={{ mx:2, my:0.5 }} />}
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ px:1, py:0.25 }}>
                      <Box sx={{ color:item.color, display:'flex', opacity:0.9 }}>{item.icon}</Box>
                      <Typography variant="caption" sx={{ color:'#64748b', fontSize:'0.75rem' }}>{item.label}:</Typography>
                      <Typography variant="caption" sx={{ fontWeight:700, color:'#1e293b', fontSize:'0.8rem' }}>{item.value}</Typography>
                    </Stack>
                  </React.Fragment>
                ))}
              </Box>
            </Paper>

            {/* Opportunities table */}
            <CardSection icon={<GrantIcon />} title="Open Grant Opportunities"
              subtitle="Active opportunities — prioritise those closing soon">
              {grantOpps.length === 0
                ? <Box sx={{ py:8, textAlign:'center' }}>
                    <GrantIcon sx={{ fontSize:48, color:'text.disabled', mb:1.5 }} />
                    <Typography color="text.secondary" sx={{ fontWeight:500 }}>No open grant opportunities found</Typography>
                    <Typography variant="caption" color="text.disabled">Opportunities will appear here once added to the system</Typography>
                  </Box>
                : <Paper elevation={0} sx={{ borderRadius:2, overflow:'hidden', border:'1px solid', borderColor:'divider' }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: PURPLE }}>
                          <TableRow>
                            {['Grant Title','Grantor','Type','Amount','Deadline','Category','Status'].map((h) => (
                              <TableCell key={h} sx={{ color:'white', fontWeight:600, fontSize:'0.8rem', py:1.5 }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {grantOpps.map((g,i) => {
                            const days = g.deadline ? Math.ceil((new Date(g.deadline)-new Date())/(1000*60*60*24)) : null;
                            const urg  = days!=null && days<=14 ? '#ef4444' : days!=null && days<=30 ? '#f59e0b' : '#64748b';
                            return (
                              <TableRow key={i} hover sx={{ '&:last-child td':{ border:0 } }}>
                                <TableCell sx={{ fontWeight:600, fontSize:'0.82rem', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.title}</TableCell>
                                <TableCell sx={{ fontSize:'0.82rem' }}>{g.grantor}</TableCell>
                                <TableCell>
                                  <Chip label={g.grantorType||'—'} size="small" sx={{ fontSize:'0.65rem', height:18, bgcolor:alpha('#3b82f6',0.08), color:'#2563eb' }} />
                                </TableCell>
                                <TableCell sx={{ fontWeight:700, color:'#16a34a', fontSize:'0.82rem' }}>{g.amount > 0 ? fmt(g.amount) : '—'}</TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontSize:'0.78rem' }}>{fmtDate(g.deadline)}</Typography>
                                  {days != null && (
                                    <Typography variant="caption" sx={{ fontSize:'0.68rem', color:urg, fontWeight: days<=30 ? 700 : 400 }}>
                                      {days<=0 ? 'Expired' : `${days}d remaining`}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell sx={{ fontSize:'0.82rem', color:'text.secondary' }}>{g.category||'—'}</TableCell>
                                <TableCell>
                                  <Chip label={g.status} size="small" sx={{ fontSize:'0.65rem', height:18, fontWeight:600, bgcolor:alpha('#22c55e',0.1), color:'#16a34a' }} />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
              }
            </CardSection>
          </Box>
        )}

      </Container>
    </>
  );
}
