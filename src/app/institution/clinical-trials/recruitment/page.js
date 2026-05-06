'use client';

import React, { useState } from 'react';
import {
  Box, Container, Typography, Paper, Avatar, Chip,
  TextField, InputAdornment, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, MenuItem, LinearProgress, Tab, Tabs,
} from '@mui/material';
import {
  PeopleAlt as RecruitmentIcon,
  Search as SearchIcon,
  CheckCircle as OnTrackIcon,
  Warning as BelowIcon,
  Error as CriticalIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendIcon,
  LocationOn as SiteIcon,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import PageHeader from '@/components/common/PageHeader';

const PURPLE = '#8b6cbc';

const mockTrials = [
  { id: 'CT-001', trial: 'Malaria Vaccine Phase II',     pi: 'Dr. Amina Okonkwo', target: 200, enrolled: 155, phase: 'Phase II',  status: 'ACTIVE',    sites: 4 },
  { id: 'CT-002', trial: 'TB Treatment Efficacy Study', pi: 'Dr. James Mwangi',  target: 150, enrolled: 112, phase: 'Phase III', status: 'ACTIVE',    sites: 3 },
  { id: 'CT-003', trial: 'HIV Prevention Trial',         pi: 'Dr. Sarah Ndlovu', target: 300, enrolled: 87,  phase: 'Phase III', status: 'ACTIVE',    sites: 5 },
  { id: 'CT-004', trial: 'Diabetes Management Study',   pi: 'Dr. Mohamed Hassan',target: 120, enrolled: 118, phase: 'Phase IV',  status: 'ACTIVE',    sites: 2 },
  { id: 'CT-005', trial: 'Hypertension Control Trial',  pi: 'Dr. Grace Kamau',   target: 180, enrolled: 44,  phase: 'Phase II',  status: 'ACTIVE',    sites: 3 },
  { id: 'CT-006', trial: 'Cancer Screening Initiative', pi: 'Dr. Peter Ochieng', target: 250, enrolled: 201, phase: 'Phase II',  status: 'ACTIVE',    sites: 4 },
  { id: 'CT-007', trial: 'Maternal Health Study',       pi: 'Dr. Fatima Diop',   target: 160, enrolled: 133, phase: 'Phase III', status: 'ACTIVE',    sites: 3 },
];

const mockSites = [
  { site: 'Nairobi General',    trial: 'Malaria Vaccine Phase II',     enrolled: 58,  target: 80,  status: 'ON_TRACK' },
  { site: 'Mombasa Coastal',   trial: 'Malaria Vaccine Phase II',     enrolled: 35,  target: 60,  status: 'BELOW' },
  { site: 'Kisumu Regional',   trial: 'Malaria Vaccine Phase II',     enrolled: 62,  target: 60,  status: 'ON_TRACK' },
  { site: 'Kampala IDI',       trial: 'TB Treatment Efficacy Study',  enrolled: 72,  target: 80,  status: 'ON_TRACK' },
  { site: 'Entebbe Medical',   trial: 'TB Treatment Efficacy Study',  enrolled: 40,  target: 70,  status: 'CRITICAL' },
  { site: 'Johannesburg Wits', trial: 'HIV Prevention Trial',          enrolled: 55,  target: 100, status: 'CRITICAL' },
  { site: 'Cape Town UCT',     trial: 'HIV Prevention Trial',          enrolled: 32,  target: 100, status: 'CRITICAL' },
  { site: 'Accra KBTH',        trial: 'Hypertension Control Trial',   enrolled: 22,  target: 60,  status: 'CRITICAL' },
  { site: 'Kumasi KNUST',      trial: 'Hypertension Control Trial',   enrolled: 22,  target: 60,  status: 'CRITICAL' },
  { site: 'Dakar FANN',        trial: 'Maternal Health Study',        enrolled: 133, target: 160, status: 'ON_TRACK' },
];

const chartData = mockTrials.map(t => ({
  name: t.trial.split(' ').slice(0, 2).join(' '),
  Enrolled: t.enrolled,
  Target: t.target,
  pct: Math.round((t.enrolled / t.target) * 100),
}));

const getTrialStatus = (enrolled, target) => {
  const pct = (enrolled / target) * 100;
  if (pct >= 80)  return { color: '#10b981', icon: <OnTrackIcon sx={{ fontSize: 16 }} />, label: 'On Track' };
  if (pct >= 50)  return { color: '#f59e0b', icon: <BelowIcon   sx={{ fontSize: 16 }} />, label: 'Below Target' };
  return              { color: '#ef4444', icon: <CriticalIcon sx={{ fontSize: 16 }} />, label: 'Critical' };
};

const getSiteStatus = (status) => {
  switch (status) {
    case 'ON_TRACK': return { color: '#10b981', label: 'On Track' };
    case 'BELOW':    return { color: '#f59e0b', label: 'Below' };
    case 'CRITICAL': return { color: '#ef4444', label: 'Critical' };
    default:         return { color: '#6b7280', label: status };
  }
};

const statCardSx = {
  p: 2, borderRadius: 2, bgcolor: PURPLE,
  boxShadow: '0 2px 8px rgba(139,108,188,0.2)',
  border: 'none', position: 'relative', overflow: 'hidden',
  height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
};

export default function RecruitmentPerformancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState(0);

  const totalEnrolled = mockTrials.reduce((s, t) => s + t.enrolled, 0);
  const totalTarget   = mockTrials.reduce((s, t) => s + t.target, 0);
  const onTrack       = mockTrials.filter(t => (t.enrolled / t.target) >= 0.8).length;
  const critical      = mockTrials.filter(t => (t.enrolled / t.target) < 0.5).length;
  const overallPct    = Math.round((totalEnrolled / totalTarget) * 100);

  const filteredTrials = mockTrials.filter(t =>
    t.trial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.pi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSites = mockSites.filter(s =>
    s.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.trial.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Recruitment Performance"
          description="Cross-trial enrollment vs target, site benchmarks and below-threshold alerts"
          icon={<RecruitmentIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Clinical Trials', path: '/institution/clinical-trials' },
            { label: 'Recruitment', path: '/institution/clinical-trials/recruitment' },
          ]}
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 6, backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 300px)' }}>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Enrolled',   value: totalEnrolled.toLocaleString(), sub: `of ${totalTarget.toLocaleString()} target`,   icon: <RecruitmentIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Overall Progress', value: `${overallPct}%`,               sub: 'Across all trials',                           icon: <TrendIcon       sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'On Track',         value: onTrack,                         sub: 'Trials ≥80% enrolled',                        icon: <OnTrackIcon     sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Critical',         value: critical,                        sub: 'Trials <50% enrolled',                        icon: <CriticalIcon    sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
          ].map((card) => (
            <Box key={card.label} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 10px)', md: '1 1 calc(25% - 15px)' } }}>
              <Paper sx={statCardSx}>
                <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>{card.label}</Typography>
                  {card.icon}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>{card.value}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>{card.sub}</Typography>
              </Paper>
            </Box>
          ))}
        </Box>

        {/* Bar Chart */}
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{ bgcolor: PURPLE, width: 40, height: 40 }}><TrendIcon /></Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Enrollment vs Target by Trial</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>Current enrolled count compared to recruitment target</Typography>
            </Box>
          </Box>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ReTooltip contentStyle={{ borderRadius: 8, fontSize: 13 }}
                formatter={(value, name) => [value, name]}
              />
              <Legend />
              <Bar dataKey="Target"   fill="#e5e7eb" radius={[4,4,0,0]} name="Target" />
              <Bar dataKey="Enrolled" radius={[4,4,0,0]} name="Enrolled">
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.pct >= 80 ? '#10b981' : entry.pct >= 50 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        {/* Search */}
        <Paper sx={{ mb: 3, p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <TextField
            fullWidth
            placeholder="Search by trial name, PI, or site..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: PURPLE }} /></InputAdornment> }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: PURPLE }, '&.Mui-focused fieldset': { borderColor: PURPLE } } }}
          />
        </Paper>

        {/* Tabs + Tables */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Box sx={{ p: 3, bgcolor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: PURPLE, width: 40, height: 40 }}><RecruitmentIcon /></Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Enrollment Breakdown</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>By trial and by site</Typography>
              </Box>
            </Box>
          </Box>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
            px: 2, borderBottom: '1px solid #e5e7eb', bgcolor: 'white',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' },
            '& .Mui-selected': { color: PURPLE },
            '& .MuiTabs-indicator': { bgcolor: PURPLE },
          }}>
            <Tab label="By Trial" />
            <Tab label="By Site" />
          </Tabs>

          {/* By Trial */}
          {tab === 0 && (
            <TableContainer sx={{ bgcolor: 'white' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    {['Trial', 'Principal Investigator', 'Phase', 'Sites', 'Enrolled', 'Target', 'Progress', 'Status', 'Actions'].map(h => (
                      <TableCell key={h} align={h === 'Actions' ? 'center' : 'left'}
                        sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTrials.map((t) => {
                    const pct = Math.round((t.enrolled / t.target) * 100);
                    const st  = getTrialStatus(t.enrolled, t.target);
                    return (
                      <TableRow key={t.id} sx={{ '&:hover': { bgcolor: '#f9fafb', cursor: 'pointer' }, borderBottom: '1px solid #f3f4f6', borderLeft: `3px solid ${st.color}` }}>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{t.trial}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{t.pi}</Typography></TableCell>
                        <TableCell>
                          <Chip label={t.phase} size="small" sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: `${PURPLE}15`, color: PURPLE }} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <SiteIcon sx={{ fontSize: 14, color: '#6b7280' }} />
                            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{t.sites}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{t.enrolled}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ color: 'text.secondary' }}>{t.target}</Typography></TableCell>
                        <TableCell sx={{ minWidth: 140 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress variant="determinate" value={pct}
                                sx={{ height: 6, borderRadius: 3, bgcolor: '#f3f4f6',
                                  '& .MuiLinearProgress-bar': { bgcolor: st.color, borderRadius: 3 } }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: st.color, minWidth: 36 }}>{pct}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip icon={st.icon} label={st.label} size="small"
                            sx={{ bgcolor: `${st.color}15`, color: st.color, fontWeight: 600, fontSize: '0.75rem', '& .MuiChip-icon': { color: st.color } }} />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton size="small" sx={{ color: PURPLE }}><ViewIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* By Site */}
          {tab === 1 && (
            <TableContainer sx={{ bgcolor: 'white' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    {['Site', 'Trial', 'Enrolled', 'Target', 'Progress', 'Status'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSites.map((s, i) => {
                    const pct = Math.round((s.enrolled / s.target) * 100);
                    const st  = getSiteStatus(s.status);
                    return (
                      <TableRow key={i} sx={{ '&:hover': { bgcolor: '#f9fafb', cursor: 'pointer' }, borderBottom: '1px solid #f3f4f6', borderLeft: `3px solid ${st.color}` }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <SiteIcon sx={{ fontSize: 16, color: PURPLE }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{s.site}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{s.trial}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{s.enrolled}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ color: 'text.secondary' }}>{s.target}</Typography></TableCell>
                        <TableCell sx={{ minWidth: 140 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress variant="determinate" value={Math.min(pct, 100)}
                                sx={{ height: 6, borderRadius: 3, bgcolor: '#f3f4f6',
                                  '& .MuiLinearProgress-bar': { bgcolor: st.color, borderRadius: 3 } }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: st.color, minWidth: 36 }}>{pct}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={st.label} size="small"
                            sx={{ bgcolor: `${st.color}15`, color: st.color, fontWeight: 600, fontSize: '0.75rem' }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </>
  );
}
