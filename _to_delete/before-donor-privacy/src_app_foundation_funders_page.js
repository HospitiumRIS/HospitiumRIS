'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Container, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Avatar,
  IconButton, Collapse, TextField, InputAdornment, Select, MenuItem,
  FormControl, TablePagination, Tooltip, Stack, CircularProgress, Alert,
  alpha, useTheme, Button, Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Autorenew as RepeatIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  Clear as ClearIcon,
  VisibilityOff as AnonymousIcon,
  ContactPage as ContactPageIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const PURPLE = '#8b6cbc';
const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function avatarColor(name = '') {
  const palette = ['#8b6cbc', '#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777'];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return palette[Math.abs(h) % palette.length];
}

const DONOR_TYPES_RAW = ['Individual', 'Corporate', 'Foundation', 'Government', 'Non-Profit', 'Other'];

export default function FundersCRM() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const [funders, setFunders]     = useState([]);
  const [stats, setStats]         = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const [search, setSearch]               = useState('');
  const [typeFilter, setTypeFilter]       = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter]   = useState('');
  const [tierFilter, setTierFilter]       = useState('');
  const [sortBy, setSortBy]               = useState('totalGiven');
  const [sortOrder, setSortOrder]         = useState('desc');

  const [page, setPage]                 = useState(0);
  const [rowsPerPage, setRowsPerPage]   = useState(25);
  const [expandedRow, setExpandedRow]   = useState(null);

  const STATUS_CONFIG = useMemo(() => ({
    active:   { label: t('funders_crm.status_active'),   color: '#16a34a', bg: '#dcfce7' },
    new:      { label: t('funders_crm.status_new'),      color: '#2563eb', bg: '#dbeafe' },
    lapsed:   { label: t('funders_crm.status_lapsed'),   color: '#d97706', bg: '#fef3c7' },
    inactive: { label: t('funders_crm.status_inactive'), color: '#9ca3af', bg: '#f3f4f6' },
  }), [t, i18n.language]);

  const TIER_CONFIG = useMemo(() => ({
    major:   { label: t('funders_crm.tier_major_donor'), color: '#b45309', bg: '#fef3c7' },
    mid:     { label: t('funders_crm.tier_mid_level'),   color: PURPLE,   bg: alpha(PURPLE, 0.1) },
    general: { label: t('funders_crm.tier_general'),     color: '#6b7280', bg: '#f3f4f6' },
  }), [t, i18n.language]);

  const DONOR_TYPES = useMemo(() => [
    { value: 'Individual', label: t('funders_crm.type_individual') },
    { value: 'Corporate', label: t('funders_crm.type_corporate') },
    { value: 'Foundation', label: t('funders_crm.type_foundation') },
    { value: 'Government', label: t('funders_crm.type_government') },
    { value: 'Non-Profit', label: t('funders_crm.type_non_profit') },
    { value: 'Other', label: t('funders_crm.type_other') },
  ], [t, i18n.language]);

  useEffect(() => {
    Promise.all([
      fetch('/api/foundation/funders').then(r => r.json()),
      fetch('/api/foundation/categories').then(r => r.json()),
    ])
      .then(([fd, cd]) => {
        if (fd.success) { setFunders(fd.funders || []); setStats(fd.stats); }
        if (cd.success) setCategories(cd.data || []);
      })
      .catch(() => setError('Failed to load funders data'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let data = [...funders];
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(f =>
        f.donorName?.toLowerCase().includes(s) ||
        f.donorEmail?.toLowerCase().includes(s) ||
        f.campaigns?.some(c => c.toLowerCase().includes(s))
      );
    }
    if (typeFilter)     data = data.filter(f => f.donorType === typeFilter);
    if (statusFilter)   data = data.filter(f => f.status === statusFilter);
    if (tierFilter)     data = data.filter(f => f.tier === tierFilter);
    if (categoryFilter) data = data.filter(f => f.categories?.some(c => c.id === categoryFilter));

    data.sort((a, b) => {
      const m = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'totalGiven':     return m * (a.totalGiven - b.totalGiven);
        case 'donationCount':  return m * (a.donationCount - b.donationCount);
        case 'lastGiftDate':   return m * (new Date(a.lastGiftDate) - new Date(b.lastGiftDate));
        case 'averageGift':    return m * (a.averageGift - b.averageGift);
        case 'name':           return m * (a.donorName || '').localeCompare(b.donorName || '');
        default:               return 0;
      }
    });
    return data;
  }, [funders, search, typeFilter, statusFilter, tierFilter, categoryFilter, sortBy, sortOrder]);

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const hasFilters = search || typeFilter || statusFilter || tierFilter || categoryFilter;

  const clearFilters = () => {
    setSearch(''); setTypeFilter(''); setCategoryFilter('');
    setStatusFilter(''); setTierFilter(''); setPage(0);
  };

  const handleSort = (col) => {
    if (sortBy === col) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortOrder('desc'); }
    setPage(0);
  };

  const sortArrow = (col) => sortBy === col ? (sortOrder === 'desc' ? ' ↓' : ' ↑') : '';


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={48} sx={{ color: PURPLE }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <>
      {/* Page Header */}
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title={t('funders_crm.page_title')}
          description={t('funders_crm.page_description')}
          icon={<ContactPageIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: t('foundation_dashboard.breadcrumb_foundation'), path: '/foundation' },
            { label: t('funders_crm.page_title') }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>

        {/* Unified filter panel with inline stats summary */}
        <Paper sx={{ borderRadius: 2, mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>

          {/* Compact stats summary bar */}
          {stats && (
            <Box sx={{
              px: 3, py: 1.5,
              background: `linear-gradient(135deg, ${alpha(PURPLE, 0.06)} 0%, ${alpha(PURPLE, 0.03)} 100%)`,
              borderBottom: '1px solid', borderColor: 'divider',
              display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', rowGap: 0.5
            }}>
              {[
                { label: t('funders_crm.total_funders'), value: stats.totalFunders,                                                                          icon: <PeopleIcon sx={{ fontSize: 15 }} />,    color: PURPLE },
                { label: t('funders_crm.active'),        value: stats.activeFunders,                                                                         icon: <StarIcon sx={{ fontSize: 15 }} />,      color: STATUS_CONFIG.active.color,   clickKey: 'active' },
                { label: t('funders_crm.new'),           value: stats.newFunders,                                                                            icon: <PeopleIcon sx={{ fontSize: 15 }} />,   color: STATUS_CONFIG.new.color,      clickKey: 'new' },
                { label: t('funders_crm.lapsed'),        value: stats.lapsedFunders,                                                                         icon: <TimelineIcon sx={{ fontSize: 15 }} />, color: STATUS_CONFIG.lapsed.color,   clickKey: 'lapsed' },
                { label: t('funders_crm.total_raised'),  value: fmt(stats.totalRaised),                                                                      icon: <MoneyIcon sx={{ fontSize: 15 }} />,    color: '#0369a1' },
                { label: t('funders_crm.avg_donation'),  value: fmt(stats.avgGiftSize),                                                                      icon: <TrendingUpIcon sx={{ fontSize: 15 }} />, color: '#059669' },
                { label: t('funders_crm.repeat'),        value: `${stats.repeatFunders} (${stats.totalFunders ? Math.round((stats.repeatFunders/stats.totalFunders)*100) : 0}%)`, icon: <RepeatIcon sx={{ fontSize: 15 }} />,   color: '#7c3aed' },
                { label: t('funders_crm.major_donors'),  value: stats.majorDonors,                                                                           icon: <StarIcon sx={{ fontSize: 15 }} />,     color: '#b45309' },
              ].map((item, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <Divider orientation="vertical" flexItem sx={{ mx: 2, my: 0.5 }} />}
                  <Stack
                    direction="row" spacing={0.75} alignItems="center"
                    onClick={item.clickKey ? () => { setStatusFilter(statusFilter === item.clickKey ? '' : item.clickKey); setPage(0); } : undefined}
                    sx={item.clickKey ? {
                      cursor: 'pointer', px: 1, py: 0.25, borderRadius: 1,
                      bgcolor: statusFilter === item.clickKey ? alpha(item.color, 0.12) : 'transparent',
                      '&:hover': { bgcolor: alpha(item.color, 0.1) },
                      transition: 'background 0.15s'
                    } : undefined}
                  >
                    <Box sx={{ color: item.color, display: 'flex', opacity: 0.9 }}>{item.icon}</Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>{item.label}:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: statusFilter === item.clickKey ? item.color : '#1e293b', fontSize: '0.8rem' }}>{item.value}</Typography>
                  </Stack>
                </React.Fragment>
              ))}
            </Box>
          )}

          {/* Filter controls */}
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <FilterIcon sx={{ color: PURPLE, fontSize: 18 }} />

              {/* Search */}
              <TextField
                placeholder={t('funders_crm.search_placeholder')}
                size="small"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: PURPLE, fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: search && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  flex: 1, minWidth: 240,
                  '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: PURPLE },
                }}
              />

              {/* Type */}
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }} displayEmpty>
                  <MenuItem value="">{t('funders_crm.all_types')}</MenuItem>
                  {DONOR_TYPES.map(type => <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>)}
                </Select>
              </FormControl>

              {/* Category */}
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(0); }} displayEmpty>
                  <MenuItem value="">{t('funders_crm.all_categories')}</MenuItem>
                  {categories.map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color || PURPLE, flexShrink: 0 }} />
                        {c.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Tier */}
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select value={tierFilter} onChange={e => { setTierFilter(e.target.value); setPage(0); }} displayEmpty>
                  <MenuItem value="">{t('funders_crm.all_tiers')}</MenuItem>
                  {Object.entries(TIER_CONFIG).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Sort */}
              <FormControl size="small" sx={{ minWidth: 170 }}>
                <Select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(0); }} displayEmpty>
                  <MenuItem value="totalGiven">{t('funders_crm.sort_total_raised')}</MenuItem>
                  <MenuItem value="donationCount">{t('funders_crm.sort_gift_count')}</MenuItem>
                  <MenuItem value="lastGiftDate">{t('funders_crm.sort_last_gift')}</MenuItem>
                  <MenuItem value="averageGift">{t('funders_crm.sort_avg_gift')}</MenuItem>
                  <MenuItem value="name">{t('funders_crm.sort_name')}</MenuItem>
                </Select>
              </FormControl>

              {hasFilters && (
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  sx={{ color: '#ef4444', textTransform: 'none', fontWeight: 600, ml: 'auto' }}
                >
                  {t('funders_crm.clear')}
                </Button>
              )}
            </Box>

            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1.5, display: 'block' }}>
              {t('funders_crm.showing_funders')} <strong>{filtered.length}</strong> {t('funders_crm.of_funders')} <strong>{funders.length}</strong> {t('funders_crm.funders_text')}
              {hasFilters && ` · ${t('funders_crm.filtered_view')}`}
            </Typography>
          </Box>
        </Paper>

        {/* Main Table */}
        <Paper sx={{
          borderRadius: 3, overflow: 'hidden',
          boxShadow: `0 4px 24px ${alpha(PURPLE, 0.08)}`,
          border: `1px solid ${alpha(PURPLE, 0.1)}`
        }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: PURPLE }}>
                  <TableCell
                    onClick={() => handleSort('name')}
                    sx={{ color: 'white', fontWeight: 600, cursor: 'pointer', userSelect: 'none', minWidth: 220, pl: 3 }}
                  >
                    {t('funders_crm.funder')}{sortArrow('name')}
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, minWidth: 180 }}>{t('funders_crm.contact')}</TableCell>
                  <TableCell
                    onClick={() => handleSort('totalGiven')}
                    sx={{ color: 'white', fontWeight: 600, cursor: 'pointer', userSelect: 'none', minWidth: 140 }}
                  >
                    {t('funders_crm.lifetime_value')}{sortArrow('totalGiven')}
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('donationCount')}
                    sx={{ color: 'white', fontWeight: 600, cursor: 'pointer', userSelect: 'none', minWidth: 80 }}
                  >
                    {t('funders_crm.donations')}{sortArrow('donationCount')}
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, minWidth: 180 }}>{t('funders_crm.areas_supported')}</TableCell>
                  <TableCell
                    onClick={() => handleSort('lastGiftDate')}
                    sx={{ color: 'white', fontWeight: 600, cursor: 'pointer', userSelect: 'none', minWidth: 155 }}
                  >
                    {t('funders_crm.last_donation')}{sortArrow('lastGiftDate')}
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, minWidth: 100 }}>{t('funders_crm.status')}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, width: 52 }} />
                </TableRow>
              </TableHead>

              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 10 }}>
                      <PeopleIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1.5, display: 'block', mx: 'auto' }} />
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 0.5 }}>
                        {funders.length === 0 ? t('funders_crm.no_donation_records') : t('funders_crm.no_funders_match')}
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        {funders.length === 0 ? t('funders_crm.add_donations_prompt') : t('funders_crm.adjust_filters_prompt')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map(funder => {
                    const isExpanded = expandedRow === funder.id;
                    const sc = STATUS_CONFIG[funder.status] || STATUS_CONFIG.inactive;
                    const tc = TIER_CONFIG[funder.tier]   || TIER_CONFIG.general;
                    const displayName = funder.isAnonymous ? t('funders_crm.anonymous_donor') : funder.donorName;

                    return (
                      <React.Fragment key={funder.id}>
                        {/* Main Row */}
                        <TableRow
                          onClick={() => setExpandedRow(isExpanded ? null : funder.id)}
                          sx={{
                            cursor: 'pointer',
                            borderLeft: isExpanded ? `4px solid ${PURPLE}` : '4px solid transparent',
                            bgcolor: isExpanded ? alpha(PURPLE, 0.03) : 'inherit',
                            transition: 'all 0.15s ease',
                            '&:hover': { bgcolor: alpha(PURPLE, 0.04) },
                          }}
                        >
                          {/* Funder */}
                          <TableCell sx={{ py: 1.75, pl: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar
                                sx={{
                                  width: 40, height: 40, flexShrink: 0,
                                  bgcolor: funder.isAnonymous ? '#9ca3af' : avatarColor(displayName),
                                  fontSize: '0.85rem', fontWeight: 700,
                                }}
                              >
                                {funder.isAnonymous ? '?' : getInitials(displayName)}
                              </Avatar>
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>
                                    {displayName}
                                  </Typography>
                                  {funder.isAnonymous && (
                                    <Tooltip title={t('funders_crm.anonymous_donor_tooltip')}>
                                      <AnonymousIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                                    </Tooltip>
                                  )}
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                                  <Chip
                                    label={DONOR_TYPES.find(dt => dt.value === funder.donorType)?.label || t('funders_crm.type_individual')}
                                    size="small"
                                    sx={{ fontSize: '0.62rem', height: 17, bgcolor: alpha(PURPLE, 0.08), color: PURPLE, '& .MuiChip-label': { px: 0.75 } }}
                                  />
                                  <Chip
                                    label={tc.label}
                                    size="small"
                                    sx={{ fontSize: '0.62rem', height: 17, bgcolor: tc.bg, color: tc.color, '& .MuiChip-label': { px: 0.75 } }}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>

                          {/* Contact */}
                          <TableCell>
                            {funder.isAnonymous ? (
                              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>{t('funders_crm.hidden')}</Typography>
                            ) : (
                              <Stack spacing={0.4}>
                                {funder.donorEmail && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                    <EmailIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.74rem' }}>
                                      {funder.donorEmail}
                                    </Typography>
                                  </Box>
                                )}
                                {funder.donorPhone && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                    <PhoneIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.74rem' }}>
                                      {funder.donorPhone}
                                    </Typography>
                                  </Box>
                                )}
                                {!funder.donorEmail && !funder.donorPhone && (
                                  <Typography variant="caption" color="text.disabled">—</Typography>
                                )}
                              </Stack>
                            )}
                          </TableCell>

                          {/* Lifetime Value */}
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: PURPLE, fontSize: '1.05rem', lineHeight: 1.2 }}>
                              {fmt(funder.totalGiven)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                              avg {fmt(funder.averageGift)} / donation
                            </Typography>
                          </TableCell>

                          {/* Gifts */}
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                              {funder.donationCount}
                            </Typography>
                            {funder.campaignCount > 1 && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.66rem', display: 'block' }}>
                                {funder.campaignCount} campaigns
                              </Typography>
                            )}
                          </TableCell>

                          {/* Areas Supported */}
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                              {funder.categories.slice(0, 2).map(cat => (
                                <Chip
                                  key={cat.id}
                                  label={cat.name}
                                  size="small"
                                  sx={{
                                    fontSize: '0.62rem', height: 19,
                                    bgcolor: alpha(cat.color || PURPLE, 0.13),
                                    color: cat.color || PURPLE,
                                    '& .MuiChip-label': { px: 0.75 },
                                  }}
                                />
                              ))}
                              {funder.categories.length > 2 && (
                                <Tooltip title={funder.categories.slice(2).map(c => c.name).join(', ')} arrow>
                                  <Chip
                                    label={`+${funder.categories.length - 2}`}
                                    size="small"
                                    sx={{ fontSize: '0.62rem', height: 19, bgcolor: alpha('#64748b', 0.1), color: '#64748b', '& .MuiChip-label': { px: 0.75 } }}
                                  />
                                </Tooltip>
                              )}
                              {funder.categories.length === 0 && (
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.72rem' }}>Unallocated</Typography>
                              )}
                            </Box>
                          </TableCell>

                          {/* Last Gift */}
                          <TableCell>
                            {funder.lastGiftDate ? (
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', color: '#374151' }}>
                                  {fmtDate(funder.lastGiftDate)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700, fontSize: '0.74rem' }}>
                                  {fmt(funder.lastGiftAmount)}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Chip
                              label={sc.label}
                              size="small"
                              sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                            />
                          </TableCell>

                          {/* Expand toggle */}
                          <TableCell sx={{ pr: 1 }}>
                            <IconButton size="small" sx={{ color: PURPLE }}>
                              {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            </IconButton>
                          </TableCell>
                        </TableRow>

                        {/* Giving History Expansion */}
                        <TableRow>
                          <TableCell colSpan={8} sx={{ p: 0, border: isExpanded ? undefined : 'none' }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{
                                px: 4, py: 3,
                                bgcolor: alpha(PURPLE, 0.025),
                                borderTop: `1px solid ${alpha(PURPLE, 0.1)}`,
                                borderBottom: `1px solid ${alpha(PURPLE, 0.06)}`,
                              }}>
                                {/* Header row */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TimelineIcon sx={{ fontSize: 18, color: PURPLE }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: PURPLE }}>
                                      {t('funders_crm.donation_history')}
                                    </Typography>
                                    <Chip
                                      label={`${funder.donations.length} donation${funder.donations.length !== 1 ? 's' : ''}`}
                                      size="small"
                                      sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 600, height: 20, fontSize: '0.68rem' }}
                                    />
                                  </Box>
                                  {funder.firstGiftDate && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                                      {t('funders_crm.donor_since')} {fmtDate(funder.firstGiftDate)}
                                    </Typography>
                                  )}
                                </Box>

                                {/* Donation history table */}
                                <Paper sx={{ borderRadius: 1.5, overflow: 'hidden', border: `1px solid ${alpha(PURPLE, 0.1)}` }}>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow sx={{ bgcolor: alpha(PURPLE, 0.07) }}>
                                        {[
                                          t('funders_crm.date'), 
                                          t('funders_crm.campaign'), 
                                          t('funders_crm.category'), 
                                          t('funders_crm.amount'), 
                                          t('funders_crm.method'), 
                                          t('funders_crm.tx_id'), 
                                          t('funders_crm.status')
                                        ].map(h => (
                                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', py: 1, color: '#374151' }}>
                                            {h}
                                          </TableCell>
                                        ))}
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {funder.donations.map((d, i) => (
                                        <TableRow
                                          key={d.id}
                                          sx={{
                                            bgcolor: i % 2 === 0 ? 'white' : alpha(PURPLE, 0.012),
                                            '&:hover': { bgcolor: alpha(PURPLE, 0.04) },
                                          }}
                                        >
                                          <TableCell sx={{ py: 0.9, fontSize: '0.78rem', fontWeight: 500, color: '#374151' }}>
                                            {fmtDate(d.date)}
                                          </TableCell>
                                          <TableCell sx={{ py: 0.9, fontSize: '0.78rem', fontWeight: 600, color: '#1e293b' }}>
                                            {d.campaignName}
                                          </TableCell>
                                          <TableCell sx={{ py: 0.9 }}>
                                            {d.categoryName ? (
                                              <Chip
                                                label={d.categoryName}
                                                size="small"
                                                sx={{
                                                  fontSize: '0.62rem', height: 18,
                                                  bgcolor: alpha(d.categoryColor || PURPLE, 0.13),
                                                  color: d.categoryColor || PURPLE,
                                                  '& .MuiChip-label': { px: 0.75 },
                                                }}
                                              />
                                            ) : (
                                              <Typography variant="caption" color="text.disabled">—</Typography>
                                            )}
                                          </TableCell>
                                          <TableCell sx={{ py: 0.9, fontWeight: 800, color: '#16a34a', fontSize: '0.84rem' }}>
                                            {fmt(d.amount)}
                                          </TableCell>
                                          <TableCell sx={{ py: 0.9, fontSize: '0.75rem', color: '#64748b' }}>
                                            {d.paymentMethod || '—'}
                                          </TableCell>
                                          <TableCell sx={{ py: 0.9 }}>
                                            {d.transactionId ? (
                                              <Tooltip title={d.transactionId} arrow>
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#94a3b8' }}>
                                                  {d.transactionId.length > 12 ? `${d.transactionId.slice(0, 12)}…` : d.transactionId}
                                                </Typography>
                                              </Tooltip>
                                            ) : (
                                              <Typography variant="caption" color="text.disabled">—</Typography>
                                            )}
                                          </TableCell>
                                          <TableCell sx={{ py: 0.9 }}>
                                            <Chip
                                              label={d.status || 'Completed'}
                                              size="small"
                                              sx={{
                                                fontSize: '0.62rem', height: 18,
                                                bgcolor: d.status === 'COMPLETED' || d.status === 'Completed' || !d.status ? '#dcfce7' : '#fef3c7',
                                                color:   d.status === 'COMPLETED' || d.status === 'Completed' || !d.status ? '#16a34a' : '#d97706',
                                                '& .MuiChip-label': { px: 0.75 },
                                              }}
                                            />
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </Paper>

                                {/* Notes / message excerpt */}
                                {funder.donations.some(d => d.message) && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                                      {t('funders_crm.donor_messages')}
                                    </Typography>
                                    <Stack spacing={0.75}>
                                      {funder.donations.filter(d => d.message).map(d => (
                                        <Box key={d.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                          <Typography variant="caption" sx={{ color: 'text.disabled', flexShrink: 0, fontSize: '0.7rem', mt: 0.1 }}>
                                            {fmtDate(d.date)}
                                          </Typography>
                                          <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#475569', fontSize: '0.78rem' }}>
                                            "{d.message}"
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Stack>
                                  </Box>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider />
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            sx={{ borderTop: 'none' }}
          />
        </Paper>

      </Container>
    </>
  );
}
