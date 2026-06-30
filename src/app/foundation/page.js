'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Container, Typography, Paper, Chip, LinearProgress, CircularProgress,
  Alert, InputAdornment, TextField, alpha, Avatar, Stack, Divider,
  Select, MenuItem, FormControl, Button,
} from '@mui/material';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts';
import {
  AttachMoney as MoneyIcon,
  Campaign as CampaignIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as GrantIcon,
  Assessment as AnalyticsIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  BarChart as BarIcon,
  PieChart as PieIcon,
  Timeline as TrendsIcon,
  DragIndicator as DragIcon,
  ArrowForward as ArrowIcon,
  Savings as FundraisingIcon,
  ContactPage as FundersIcon,
  AccountBalanceWallet as FinancialIcon,
  NoteAdd as InternalGrantIcon,
  EmojiEvents as WonIcon,
  Star as StarIcon,
  CalendarMonth as ActivitiesIcon,
  EventNote as EventIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

// ─── constants ────────────────────────────────────────────────────────────────
const PURPLE = '#8b6cbc';
const CHART_COLORS = ['#8b6cbc','#3b82f6','#22c55e','#f59e0b','#ef4444','#0891b2','#ec4899','#84cc16'];
const fmt  = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
const fmtS = (n) => { if (n>=1e6) return `$${(n/1e6).toFixed(1)}M`; if (n>=1e3) return `$${(n/1e3).toFixed(0)}K`; return `$${Math.round(n||0)}`; };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—';

const RADIAN = Math.PI / 180;
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.57;
  return <text x={cx + r*Math.cos(-midAngle*RADIAN)} y={cy + r*Math.sin(-midAngle*RADIAN)} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>{`${(percent*100).toFixed(0)}%`}</text>;
};

const WIDGET_SPAN = { trends: 2, campaigns: 1, categories: 1, donors: 1, grants: 1, activities: 1, 'quick-nav': 2 };
const DEFAULT_ORDER = ['trends', 'campaigns', 'categories', 'donors', 'grants', 'activities', 'quick-nav'];

const WHeader = ({ icon, title, subtitle, action }) => (
  <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:2.5 }}>
    <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
      <DragIcon sx={{ fontSize:18, color:'text.disabled', cursor:'grab', flexShrink:0 }} />
      <Box sx={{ width:32, height:32, borderRadius:2, bgcolor:alpha(PURPLE,0.1), display:'flex', alignItems:'center', justifyContent:'center' }}>
        {React.cloneElement(icon, { sx:{ fontSize:18, color:PURPLE } })}
      </Box>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight:700, lineHeight:1.2 }}>{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary" sx={{ fontSize:'0.72rem' }}>{subtitle}</Typography>}
      </Box>
    </Box>
    {action}
  </Box>
);

export default function FoundationDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading]           = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError]               = useState(null);
  const [greeting, setGreeting]         = useState('');
  const [currentDate, setCurrentDate]   = useState('');

  // widget state
  const [widgetOrder, setWidgetOrder]   = useState(DEFAULT_ORDER);
  const [draggedId, setDraggedId]       = useState(null);
  const [dragOverId, setDragOverId]     = useState(null);

  // intra-widget state
  const [perfFilter, setPerfFilter]     = useState('all');
  const [perfSort, setPerfSort]         = useState('raised');
  const [showAll, setShowAll]           = useState(false);
  const [selCategory, setSelCategory]   = useState(null);
  const [donorSearch, setDonorSearch]   = useState('');

  // restore widget order from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem('foundation-widget-order');
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p) && DEFAULT_ORDER.every(id => p.includes(id))) setWidgetOrder(p);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' }));
    const h = now.getHours();
    setGreeting(h < 12 ? t('foundation_dashboard.good_morning') : h < 18 ? t('foundation_dashboard.good_afternoon') : t('foundation_dashboard.good_evening'));
  }, [t]);

  const getName = () => {
    if (user?.givenName && user?.familyName) return `${user.givenName} ${user.familyName}`;
    if (user?.firstName && user?.lastName)   return `${user.firstName} ${user.lastName}`;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };
  const getRole = () => {
    switch (user?.accountType?.toLowerCase()) {
      case 'foundation_admin': return t('foundation_dashboard.foundation_administrator');
      case 'super_admin':      return t('foundation_dashboard.super_administrator');
      case 'global_admin':     return t('foundation_dashboard.global_admin');
      default:                 return t('foundation_dashboard.foundation_portal');
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch('/api/foundation/analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      setAnalyticsData(await res.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── drag & drop ────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);
  const handleDragOver = useCallback((e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedId) setDragOverId(id);
  }, [draggedId]);
  const handleDrop = useCallback((e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) { setDraggedId(null); setDragOverId(null); return; }
    const next = [...widgetOrder];
    const fi = next.indexOf(draggedId), ti = next.indexOf(targetId);
    next.splice(fi, 1); next.splice(ti, 0, draggedId);
    setWidgetOrder(next);
    try { localStorage.setItem('foundation-widget-order', JSON.stringify(next)); } catch {}
    setDraggedId(null); setDragOverId(null);
  }, [draggedId, widgetOrder]);
  const handleDragEnd = useCallback(() => { setDraggedId(null); setDragOverId(null); }, []);

  // ── derived data ───────────────────────────────────────────────────────────
  const monthlyTrends = useMemo(() => [...(analyticsData?.monthlyTrends || [])].reverse(), [analyticsData]);

  const catChartData = useMemo(() =>
    (analyticsData?.categoryDistribution || [])
      .filter(c => c.amount > 0).slice(0, 8)
      .map((c, i) => ({ name: c.category, value: c.amount, pct: c.percentage, color: CHART_COLORS[i % CHART_COLORS.length] })),
    [analyticsData]);

  const allCampaigns = analyticsData?.campaignPerformance || [];
  const filteredCampaigns = useMemo(() => {
    let r = perfFilter === 'all' ? [...allCampaigns] : allCampaigns.filter(c => c.status?.toLowerCase() === perfFilter);
    if (selCategory) r = r.filter(c => c.category === selCategory);
    if (perfSort === 'raised')    r.sort((a,b) => b.raised - a.raised);
    if (perfSort === 'progress')  r.sort((a,b) => b.progress - a.progress);
    if (perfSort === 'donors')    r.sort((a,b) => (b.donors||0) - (a.donors||0));
    return r;
  }, [allCampaigns, perfFilter, perfSort, selCategory]);
  const shownCampaigns = showAll ? filteredCampaigns : filteredCampaigns.slice(0, 5);
  const maxRaised = Math.max(...allCampaigns.map(c => c.raised), 1);
  const statusCounts = useMemo(() => ({
    all: allCampaigns.length,
    active:    allCampaigns.filter(c => c.status?.toLowerCase() === 'active').length,
    completed: allCampaigns.filter(c => c.status?.toLowerCase() === 'completed').length,
  }), [allCampaigns]);

  const donors = analyticsData?.topDonors || [];
  const filteredDonors = useMemo(() => {
    if (!donorSearch) return donors;
    const s = donorSearch.toLowerCase();
    return donors.filter(d => d.name?.toLowerCase().includes(s) || d.email?.toLowerCase().includes(s));
  }, [donors, donorSearch]);

  const grantOpps = useMemo(() =>
    [...(analyticsData?.grantOpportunities || [])].sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 8),
    [analyticsData]);

  const upcomingActivities = useMemo(() => {
    const now = new Date();
    const items = [];
    // Active campaigns ending soon
    (analyticsData?.campaigns || [])
      .filter(c => c.status === 'Active' && c.endDate && new Date(c.endDate) > now)
      .forEach(c => items.push({
        type: 'campaign', title: c.name, subtitle: c.category,
        date: c.endDate, path: '/foundation/campaigns',
      }));
    // Grant deadlines
    (analyticsData?.grantOpportunities || [])
      .forEach(g => items.push({
        type: 'grant', title: g.title, subtitle: g.grantor,
        date: g.deadline, path: '/foundation/grants/opportunities',
      }));
    return items
      .map(item => ({ ...item, days: Math.ceil((new Date(item.date) - now) / 86400000) }))
      .filter(item => item.days >= 0)
      .sort((a, b) => a.days - b.days)
      .slice(0, 10);
  }, [analyticsData]);

  const ov = analyticsData?.overview || {};

  // ── loading / error ────────────────────────────────────────────────────────
  if (loading) return (
    <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'60vh', flexDirection:'column', gap:2 }}>
      <CircularProgress size={48} sx={{ color:PURPLE }} />
      <Typography color="text.secondary">{t('common.loading')}</Typography>
    </Box>
  );
  if (error) return (
    <Container maxWidth="xl" sx={{ py:4 }}>
      <Alert severity="error" action={<Button size="small" onClick={loadData}>{t('common.retry')}</Button>}>{error}</Alert>
    </Container>
  );

  // ── widget definitions ─────────────────────────────────────────────────────
  const BAR_COLORS = ['#8b6cbc','#a084d1','#b794f4','#7a5cb0','#6b4fa0'];

  const WIDGETS = {

    trends: (
      <Paper elevation={0} sx={{ borderRadius:3, border:'1px solid', borderColor:'divider', p:3 }}>
        <WHeader icon={<TrendsIcon />} title={t('foundation_dashboard.monthly_inflow_trend')} subtitle={t('foundation_dashboard.donation_revenue_last_6m')} />
        {monthlyTrends.length === 0
          ? <Box sx={{ py:6, textAlign:'center' }}><Typography color="text.disabled">{t('common.no_data')}</Typography></Box>
          : <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyTrends} margin={{ top:5, right:16, left:0, bottom:5 }}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={PURPLE} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={PURPLE} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(PURPLE,0.1)} />
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={fmtS} tick={{ fontSize:11, fill:'#64748b' }} tickLine={false} axisLine={false} />
                <RTooltip formatter={(v) => [fmt(v),t('foundation_dashboard.revenue')]} contentStyle={{ borderRadius:8, fontSize:13 }} />
                <Area type="monotone" dataKey="total" stroke={PURPLE} strokeWidth={2.5} fill="url(#ag)" dot={{ r:3, fill:PURPLE }} activeDot={{ r:5 }} />
              </AreaChart>
            </ResponsiveContainer>
        }
      </Paper>
    ),

    campaigns: (
      <Paper elevation={0} sx={{ borderRadius:3, border:'1px solid', borderColor:'divider', p:3, height:'100%' }}>
        <WHeader icon={<BarIcon />} title={t('foundation_dashboard.performance_overview')}
          subtitle={selCategory ? `${t('common.filter')}: ${selCategory}` : t('foundation_dashboard.campaigns_ranked')}
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              {selCategory && <Chip label={selCategory} size="small" onDelete={() => setSelCategory(null)}
                sx={{ bgcolor:alpha(PURPLE,0.1), color:PURPLE, fontSize:'0.7rem', height:22 }} />}
              <FormControl size="small" sx={{ minWidth:130 }}>
                <Select value={perfSort} onChange={e => setPerfSort(e.target.value)} sx={{ fontSize:'0.78rem' }} MenuProps={{ disableScrollLock:true }}>
                  <MenuItem value="raised">{t('foundation_dashboard.by_amount')}</MenuItem>
                  <MenuItem value="progress">{t('foundation_dashboard.by_progress')}</MenuItem>
                  <MenuItem value="donors">{t('foundation_dashboard.by_donors')}</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          }
        />
        <Stack direction="row" sx={{ mb:2, flexWrap:'wrap', gap:0.75 }}>
          {[{ k:'all', l:t('foundation_dashboard.all_count', { count: statusCounts.all }) }, { k:'active', l:t('foundation_dashboard.active_count', { count: statusCounts.active }) }, { k:'completed', l:t('foundation_dashboard.completed_count', { count: statusCounts.completed }) }]
            .map(({ k, l }) => (
              <Chip key={k} label={l} size="small"
                onClick={() => { setPerfFilter(k); setShowAll(false); }}
                sx={{ bgcolor: perfFilter===k ? PURPLE : alpha(PURPLE,0.1), color: perfFilter===k ? 'white' : PURPLE, fontWeight: perfFilter===k ? 600 : 400, cursor:'pointer', '&:hover':{ bgcolor: perfFilter===k ? '#7a5cb0' : alpha(PURPLE,0.2) } }}
              />
            ))
          }
        </Stack>
        <Box sx={{ bgcolor:alpha(PURPLE,0.04), borderRadius:2, p:1.5 }}>
          {shownCampaigns.length > 0
            ? <Stack spacing={1.25}>
                {shownCampaigns.map((item, i) => (
                  <Box key={item.id} onClick={() => router.push('/foundation/campaigns')}
                    sx={{ p:1.5, borderRadius:2, bgcolor:'background.paper', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', cursor:'pointer', transition:'box-shadow 0.2s, transform 0.15s', '&:hover':{ boxShadow:'0 4px 12px rgba(139,108,188,0.15)', transform:'translateY(-1px)' } }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb:0.75 }}>
                      <Box sx={{ flex:1, mr:1 }}>
                        <Typography variant="body2" sx={{ fontWeight:600, lineHeight:1.3, mb:0.4 }}>{item.name}</Typography>
                        <Stack direction="row" spacing={0.5}>
                          <Chip label={item.category} size="small"
                            onClick={e => { e.stopPropagation(); setSelCategory(item.category === selCategory ? null : item.category); }}
                            sx={{ fontSize:'0.63rem', height:17, bgcolor:alpha(PURPLE,0.1), color:PURPLE, cursor:'pointer' }} />
                          <Chip label={item.status} size="small"
                            sx={{ fontSize:'0.63rem', height:17, bgcolor: item.status?.toLowerCase()==='active' ? alpha('#22c55e',0.1) : alpha('#94a3b8',0.1), color: item.status?.toLowerCase()==='active' ? '#16a34a' : '#64748b' }} />
                        </Stack>
                      </Box>
                      <Box sx={{ textAlign:'right', flexShrink:0 }}>
                        <Typography variant="body2" sx={{ fontWeight:700, color:PURPLE }}>{fmt(item.raised)}</Typography>
                        <Typography variant="caption" color="text.secondary">{t('foundation_dashboard.of')} {fmt(item.target)}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <LinearProgress variant="determinate" value={Math.min((item.raised/maxRaised)*100,100)}
                        sx={{ flex:1, height:6, borderRadius:3, bgcolor:alpha(PURPLE,0.1), '& .MuiLinearProgress-bar':{ bgcolor:BAR_COLORS[i%5], borderRadius:3 } }} />
                      <Typography variant="caption" sx={{ color:PURPLE, fontWeight:600, minWidth:56, textAlign:'right', fontSize:'0.72rem' }}>
                        {(item.donors||0)} {t('foundation_dashboard.donors_text')} · {item.progress.toFixed(0)}%
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            : <Box sx={{ textAlign:'center', py:4 }}><Typography color="text.disabled">{t('common.no_results')}</Typography></Box>
          }
        </Box>
        {filteredCampaigns.length > 5 && (
          <Box sx={{ textAlign:'center', mt:1.5 }}>
            <Button size="small" onClick={() => setShowAll(!showAll)} sx={{ color:PURPLE, textTransform:'none' }}>
              {showAll ? t('common.show_less') : t('common.show_more')}
            </Button>
          </Box>
        )}
      </Paper>
    ),

    categories: (
      <Paper elevation={0} sx={{ borderRadius:3, border:'1px solid', borderColor:'divider', p:3, height:'100%' }}>
        <WHeader icon={<PieIcon />} title={t('foundation_dashboard.category_distribution')} subtitle={t('foundation_dashboard.click_slice_to_filter')} />
        {catChartData.length === 0
          ? <Box sx={{ py:6, textAlign:'center' }}><Typography color="text.disabled">{t('common.no_data')}</Typography></Box>
          : <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={catChartData} cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={3} dataKey="value" labelLine={false} label={<PieLabel />}>
                    {catChartData.map((e, i) => (
                      <Cell key={i} fill={e.color} style={{ cursor:'pointer', outline:'none' }}
                        onClick={() => setSelCategory(selCategory === e.name ? null : e.name)} />
                    ))}
                  </Pie>
                  <RTooltip formatter={(v,n) => [fmt(v),n]} contentStyle={{ borderRadius:8, fontSize:13 }} />
                </PieChart>
              </ResponsiveContainer>
              <Stack spacing={0.5} sx={{ mt:1.5 }}>
                {catChartData.map(c => (
                  <Box key={c.name} onClick={() => setSelCategory(selCategory===c.name ? null : c.name)}
                    sx={{ display:'flex', alignItems:'center', gap:1, cursor:'pointer', px:0.75, py:0.5, borderRadius:1.5,
                      bgcolor: selCategory===c.name ? alpha(c.color,0.1) : 'transparent',
                      '&:hover':{ bgcolor:alpha(c.color,0.07) }, transition:'background 0.15s' }}
                  >
                    <Box sx={{ width:9, height:9, borderRadius:'50%', bgcolor:c.color, flexShrink:0 }} />
                    <Typography variant="caption" sx={{ fontSize:'0.73rem', flex:1, color: selCategory===c.name ? c.color : 'text.secondary', fontWeight: selCategory===c.name ? 700 : 400 }}>{c.name}</Typography>
                    <Typography variant="caption" sx={{ fontWeight:700, fontSize:'0.73rem' }}>{c.pct}%</Typography>
                  </Box>
                ))}
              </Stack>
              {selCategory && (
                <Box sx={{ mt:1.5, p:1.25, borderRadius:2, bgcolor:alpha(PURPLE,0.06), border:`1px solid ${alpha(PURPLE,0.15)}` }}>
                  <Typography variant="caption" sx={{ color:PURPLE, fontSize:'0.72rem' }}
                    dangerouslySetInnerHTML={{ __html: t('foundation_dashboard.filtering_performance', { category: selCategory }) }}
                  />
                </Box>
              )}
            </>
        }
      </Paper>
    ),

    donors: (
      <Paper elevation={0} sx={{ borderRadius:3, border:'1px solid', borderColor:'divider', p:3, height:'100%' }}>
        <WHeader icon={<PeopleIcon />} title={t('foundation_dashboard.top_donors')} subtitle={t('foundation_dashboard.highest_lifetime_contributors')}
          action={
            <TextField size="small" placeholder="Search…" value={donorSearch} onChange={e => setDonorSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize:16, color:'text.secondary' }} /></InputAdornment> }}
              sx={{ width:150, '& .MuiOutlinedInput-root':{ fontSize:'0.8rem', borderRadius:2 } }} />
          }
        />
        {filteredDonors.length === 0
          ? <Box sx={{ py:4, textAlign:'center' }}><Typography color="text.disabled">{t('common.no_results')}</Typography></Box>
          : <Box>
              {filteredDonors.slice(0, 8).map((d, i) => (
                <Box key={d.id} onClick={() => router.push('/foundation/funders')}
                  sx={{ display:'flex', alignItems:'center', gap:1.5, py:1.25, px:0.5, borderBottom:'1px solid', borderColor:'divider', cursor:'pointer', '&:last-child':{ border:0 }, '&:hover':{ bgcolor:alpha(PURPLE,0.04) }, borderRadius:1, transition:'background 0.15s' }}
                >
                  <Typography variant="caption" sx={{ color:'text.disabled', fontWeight:700, minWidth:18, fontSize:'0.72rem' }}>{i+1}</Typography>
                  <Avatar sx={{ width:28, height:28, bgcolor:alpha(PURPLE,0.15), color:PURPLE, fontSize:'0.65rem', fontWeight:700 }}>
                    {d.name?.charAt(0) || '?'}
                  </Avatar>
                  <Box sx={{ flex:1, minWidth:0 }}>
                    <Typography variant="body2" sx={{ fontWeight:600, fontSize:'0.8rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize:'0.68rem' }}>{d.type} · {d.donations} {d.donations!==1 ? t('foundation_dashboard.gifts') : t('foundation_dashboard.gift')}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight:700, color:'#16a34a', fontSize:'0.85rem', flexShrink:0 }}>{fmt(d.totalDonated)}</Typography>
                </Box>
              ))}
            </Box>
        }
        <Box sx={{ mt:1.5, textAlign:'right' }}>
          <Button size="small" endIcon={<ArrowIcon sx={{ fontSize:14 }} />} onClick={() => router.push('/foundation/funders')}
            sx={{ color:PURPLE, textTransform:'none', fontSize:'0.78rem' }}>
            {t('foundation.funders_crm')}
          </Button>
        </Box>
      </Paper>
    ),

    grants: (
      <Paper elevation={0} sx={{ borderRadius:3, border:'1px solid', borderColor:'divider', p:3, height:'100%' }}>
        <WHeader icon={<GrantIcon />} title={t('foundation.grant_opportunities')} subtitle={t('foundation_dashboard.sorted_by_deadline')}
          action={
            <Button size="small" endIcon={<ArrowIcon sx={{ fontSize:14 }} />} onClick={() => router.push('/foundation/grants/opportunities')}
              sx={{ color:PURPLE, textTransform:'none', fontSize:'0.75rem' }}>{t('common.all')}</Button>
          }
        />
        {grantOpps.length === 0
          ? <Box sx={{ py:4, textAlign:'center' }}><Typography color="text.disabled">{t('common.no_data')}</Typography></Box>
          : <Stack spacing={1.25}>
              {grantOpps.map((g) => {
                const days = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null;
                const urg  = days != null && days <= 7 ? '#ef4444' : days != null && days <= 30 ? '#f59e0b' : '#22c55e';
                return (
                  <Box key={g.id} onClick={() => router.push('/foundation/grants/opportunities')}
                    sx={{ display:'flex', alignItems:'flex-start', gap:1.5, p:1.25, borderRadius:2,
                      bgcolor:alpha(urg,0.04), border:`1px solid ${alpha(urg,0.15)}`, cursor:'pointer',
                      transition:'transform 0.15s', '&:hover':{ transform:'translateX(3px)' } }}
                  >
                    <Box sx={{ mt:0.3, width:8, height:8, borderRadius:'50%', bgcolor:urg, flexShrink:0 }} />
                    <Box sx={{ flex:1, minWidth:0 }}>
                      <Typography variant="body2" sx={{ fontWeight:600, fontSize:'0.8rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize:'0.7rem' }}>{g.grantor} · {g.amount > 0 ? fmt(g.amount) : t('foundation_dashboard.amt_tbd')}</Typography>
                    </Box>
                    <Box sx={{ textAlign:'right', flexShrink:0 }}>
                      <Typography variant="caption" sx={{ fontWeight:700, fontSize:'0.72rem', color:urg, display:'block' }}>
                        {days == null ? '—' : days <= 0 ? t('foundation_dashboard.expired') : t('foundation_dashboard.days_left', { days })}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize:'0.65rem' }}>{fmtDate(g.deadline)}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
        }
      </Paper>
    ),

    activities: (
      <Paper elevation={0} sx={{ borderRadius:3, border:'1px solid', borderColor:'divider', p:3, height:'100%' }}>
        <WHeader icon={<ActivitiesIcon />} title={t('foundation_dashboard.upcoming_activities')}
          subtitle={t('foundation_dashboard.deadlines_sorted_by_urgency')} />
        {upcomingActivities.length === 0
          ? <Box sx={{ py:4, textAlign:'center' }}><Typography color="text.disabled">{t('common.no_data')}</Typography></Box>
          : <Stack spacing={1}>
              {upcomingActivities.map((item, i) => {
                const urg = item.days <= 7 ? '#ef4444' : item.days <= 30 ? '#f59e0b' : '#22c55e';
                const isCampaign = item.type === 'campaign';
                return (
                  <Box key={i} onClick={() => router.push(item.path)}
                    sx={{ display:'flex', alignItems:'flex-start', gap:1.5, p:1.25, borderRadius:2,
                      bgcolor:alpha(urg,0.04), border:`1px solid ${alpha(urg,0.15)}`, cursor:'pointer',
                      transition:'transform 0.15s', '&:hover':{ transform:'translateX(3px)' } }}
                  >
                    <Box sx={{ mt:0.3, width:26, height:26, borderRadius:1.5, bgcolor:alpha(urg,0.12),
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {isCampaign
                        ? <CampaignIcon sx={{ fontSize:14, color:urg }} />
                        : <GrantIcon sx={{ fontSize:14, color:urg }} />}
                    </Box>
                    <Box sx={{ flex:1, minWidth:0 }}>
                      <Typography variant="body2" sx={{ fontWeight:600, fontSize:'0.8rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</Typography>
                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt:0.3 }}>
                        <Chip label={isCampaign ? t('foundation_dashboard.campaign_label') : t('foundation_dashboard.grant_label')} size="small"
                          sx={{ fontSize:'0.6rem', height:16, bgcolor:alpha(PURPLE,0.1), color:PURPLE, fontWeight:600 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize:'0.68rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.subtitle}</Typography>
                      </Stack>
                    </Box>
                    <Box sx={{ textAlign:'right', flexShrink:0 }}>
                      <Typography variant="caption" sx={{ fontWeight:700, fontSize:'0.75rem', color:urg, display:'block' }}>
                        {item.days === 0 ? t('foundation_dashboard.today') : t('foundation_dashboard.days_short', { days: item.days })}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize:'0.63rem' }}>{fmtDate(item.date)}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
        }
      </Paper>
    ),

    'quick-nav': (
      <Paper elevation={0} sx={{ borderRadius:3, border:'1px solid', borderColor:'divider', p:3 }}>
        <WHeader icon={<AnalyticsIcon />} title={t('foundation_dashboard.quick_navigation')} subtitle={t('foundation_dashboard.jump_to_section')} />
        <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
          {[
            { labelKey:'quick_nav_campaigns',       icon:<CampaignIcon />,     path:'/foundation/campaigns',                        color:'#8b6cbc', descKey:'campaigns_desc' },
            { labelKey:'quick_nav_donations',       icon:<MoneyIcon />,         path:'/foundation/donations',                        color:'#3b82f6', descKey:'donations_desc' },
            { labelKey:'quick_nav_funders_crm',     icon:<FundersIcon />,       path:'/foundation/funders',                          color:'#0891b2', descKey:'funders_crm_desc' },
            { labelKey:'quick_nav_grant_opps',      icon:<GrantIcon />,         path:'/foundation/grants/opportunities',             color:'#22c55e', descKey:'grant_opps_desc' },
            { labelKey:'quick_nav_won_grants',      icon:<WonIcon />,           path:'/foundation/grants/won',                       color:'#f59e0b', descKey:'won_grants_desc' },
            { labelKey:'quick_nav_internal_grants', icon:<InternalGrantIcon />, path:'/foundation/grants/internal-requests',         color:'#ec4899', descKey:'internal_grants_desc' },
            { labelKey:'quick_nav_fund_pool',       icon:<FinancialIcon />,     path:'/foundation/financial/central-fund-pool',      color:'#6366f1', descKey:'fund_pool_desc' },
            { labelKey:'quick_nav_reports',         icon:<AnalyticsIcon />,     path:'/foundation/reports',                          color:'#ef4444', descKey:'reports_desc' },
          ].map(({ labelKey, icon, path, color, descKey }) => (
            <Box key={labelKey} onClick={() => router.push(path)}
              sx={{ flex:'1 1 140px', minWidth:0, p:2, borderRadius:2.5, border:'1px solid', borderColor:alpha(color,0.2),
                bgcolor:alpha(color,0.04), cursor:'pointer', transition:'all 0.2s',
                '&:hover':{ bgcolor:alpha(color,0.1), borderColor:alpha(color,0.4), transform:'translateY(-2px)', boxShadow:`0 4px 16px ${alpha(color,0.15)}` } }}
            >
              <Box sx={{ width:36, height:36, borderRadius:2, bgcolor:alpha(color,0.12), display:'flex', alignItems:'center', justifyContent:'center', mb:1.25 }}>
                {React.cloneElement(icon, { sx:{ fontSize:20, color } })}
              </Box>
              <Typography variant="body2" sx={{ fontWeight:700, mb:0.25 }}>{t(`foundation_dashboard.${labelKey}`)}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize:'0.7rem' }}>{t(`foundation_dashboard.${descKey}`)}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    ),
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <Box>
      <Box sx={{ width:'100vw', marginLeft:'calc(-50vw + 50%)', marginRight:'calc(-50vw + 50%)' }}>
        <PageHeader
          title={`${greeting}, ${getName()}!`}
          description={
            <>
              <span style={{ fontSize:'0.9rem', opacity:0.85 }}>{t('foundation_dashboard.logged_in_as')} <strong>{getRole()}</strong></span>
              <br />
              <span style={{ opacity:0.72, fontSize:'0.82rem' }}>{currentDate}</span>
            </>
          }
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          actionButton={
            <Stack direction="row" spacing={1.5}>
              <Button variant="contained" size="small" startIcon={<RefreshIcon />} onClick={loadData}
                sx={{ bgcolor:'rgba(255,255,255,0.22)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.4)', color:'white', fontWeight:600, '&:hover':{ bgcolor:'rgba(255,255,255,0.32)' } }}>
                {t('common.refresh')}
              </Button>
              <Button variant="contained" size="small" onClick={() => router.push('/foundation/reports')}
                sx={{ bgcolor:'rgba(255,255,255,0.13)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.3)', color:'white', fontWeight:600, '&:hover':{ bgcolor:'rgba(255,255,255,0.22)' } }}>
                {t('foundation_dashboard.full_reports')}
              </Button>
            </Stack>
          }
        />
      </Box>

      <Container maxWidth="xl" sx={{ py:4 }}>

        {/* Clickable KPI strip */}
        <Paper elevation={0} sx={{ borderRadius:2, mb:3, border:'1px solid', borderColor:'divider', overflow:'hidden' }}>
          <Box sx={{ px:3, py:1.5, background:`linear-gradient(135deg, ${alpha(PURPLE,0.06)} 0%, ${alpha(PURPLE,0.03)} 100%)`, display:'flex', alignItems:'center', gap:0, flexWrap:'wrap', rowGap:0.5 }}>
            {[
              { labelKey:'total_raised_kpi',    value: fmt((ov.totalRaised||0)+(ov.totalGrants||0)), icon:<MoneyIcon sx={{ fontSize:15 }} />,       color:PURPLE,    path:'/foundation/donations' },
              { labelKey:'donations_kpi',       value: (ov.totalDonations||0).toLocaleString(),        icon:<CampaignIcon sx={{ fontSize:15 }} />,   color:'#3b82f6', path:'/foundation/donations' },
              { labelKey:'unique_donors_kpi',   value: (ov.uniqueDonors||0).toLocaleString(),          icon:<PeopleIcon sx={{ fontSize:15 }} />,     color:'#0891b2', path:'/foundation/funders' },
              { labelKey:'avg_donation_kpi',    value: fmt(ov.averageDonation),                        icon:<TrendingUpIcon sx={{ fontSize:15 }} />, color:'#22c55e', path:'/foundation/reports' },
              { labelKey:'active_campaigns_kpi',value: (ov.activeCampaigns||0),                        icon:<FundraisingIcon sx={{ fontSize:15 }} />,color:'#f59e0b', path:'/foundation/campaigns' },
              { labelKey:'open_grants_kpi',     value: (ov.activeGrants||0),                           icon:<GrantIcon sx={{ fontSize:15 }} />,      color:'#ec4899', path:'/foundation/grants/opportunities' },
              { labelKey:'retention_kpi',       value: `${(ov.retentionRate||0).toFixed(1)}%`,         icon:<StarIcon sx={{ fontSize:15 }} />,       color:'#6366f1', path:'/foundation/reports' },
            ].map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Divider orientation="vertical" flexItem sx={{ mx:2, my:0.5 }} />}
                <Stack direction="row" spacing={0.75} alignItems="center" onClick={() => router.push(item.path)}
                  sx={{ cursor:'pointer', px:1, py:0.25, borderRadius:1, '&:hover':{ bgcolor:alpha(item.color,0.08) }, transition:'background 0.15s' }}>
                  <Box sx={{ color:item.color, display:'flex', opacity:0.9 }}>{item.icon}</Box>
                  <Typography variant="caption" sx={{ color:'#64748b', fontSize:'0.75rem' }}>{t(`foundation_dashboard.${item.labelKey}`)}:</Typography>
                  <Typography variant="caption" sx={{ fontWeight:700, color:'#1e293b', fontSize:'0.8rem' }}>{item.value}</Typography>
                </Stack>
              </React.Fragment>
            ))}
          </Box>
        </Paper>

        {/* Drag hint */}
        <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:2, opacity:0.45 }}>
          <DragIcon sx={{ fontSize:14 }} />
          <Typography variant="caption" sx={{ fontSize:'0.72rem' }}>{t('foundation_dashboard.drag_hint')}</Typography>
        </Box>

        {/* Draggable widget grid */}
        <Box sx={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:3 }}>
          {widgetOrder.map((id) => {
            const span = WIDGET_SPAN[id] || 1;
            return (
              <Box key={id} draggable
                onDragStart={e => handleDragStart(e, id)}
                onDragOver={e  => handleDragOver(e, id)}
                onDrop={e      => handleDrop(e, id)}
                onDragEnd={handleDragEnd}
                sx={{
                  gridColumn: span === 2 ? 'span 2' : 'span 1',
                  opacity: draggedId === id ? 0.35 : 1,
                  outline: dragOverId === id ? `2px dashed ${PURPLE}` : '2px solid transparent',
                  borderRadius: 3,
                  transition: 'opacity 0.2s, outline 0.12s',
                }}
              >
                {WIDGETS[id]}
              </Box>
            );
          })}
        </Box>

      </Container>
    </Box>
  );
}