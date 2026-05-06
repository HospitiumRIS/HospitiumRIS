'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  Chip,
  Button,
  Tab,
  Tabs,
} from '@mui/material';
import {
  BarChart as ChartIcon,
  Science as TrialIcon,
  TrendingUp,
  CheckCircle,
  Warning,
  ArrowBack as BackIcon,
  People as PeopleIcon,
  Assessment as ReportsIcon,
} from '@mui/icons-material';
import {
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
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import PageHeader from '@/components/common/PageHeader';

const enrollmentData = [
  { month: 'Oct', target: 80, actual: 62 },
  { month: 'Nov', target: 90, actual: 75 },
  { month: 'Dec', target: 100, actual: 88 },
  { month: 'Jan', target: 110, actual: 95 },
  { month: 'Feb', target: 130, actual: 118 },
  { month: 'Mar', target: 150, actual: 143 },
  { month: 'Apr', target: 170, actual: 155 },
];

const complianceData = [
  { month: 'Oct', rate: 84 },
  { month: 'Nov', rate: 87 },
  { month: 'Dec', rate: 85 },
  { month: 'Jan', rate: 90 },
  { month: 'Feb', rate: 88 },
  { month: 'Mar', rate: 92 },
  { month: 'Apr', rate: 94 },
];

const phaseData = [
  { name: 'Phase I', value: 3, color: '#8b6cbc' },
  { name: 'Phase II', value: 5, color: '#a78bca' },
  { name: 'Phase III', value: 7, color: '#c4a8d8' },
  { name: 'Phase IV', value: 2, color: '#ddc9e6' },
];

const statusData = [
  { name: 'Active', value: 12, color: '#10b981' },
  { name: 'Concept', value: 4, color: '#3b82f6' },
  { name: 'Suspended', value: 2, color: '#f59e0b' },
  { name: 'Closed', value: 5, color: '#9ca3af' },
];

const sitePerformanceData = [
  { site: 'Site A', enrolled: 145, target: 160, compliance: 94 },
  { site: 'Site B', enrolled: 98, target: 120, compliance: 88 },
  { site: 'Site C', enrolled: 210, target: 200, compliance: 96 },
  { site: 'Site D', enrolled: 67, target: 100, compliance: 79 },
  { site: 'Site E', enrolled: 133, target: 140, compliance: 91 },
];

const PURPLE = '#8b6cbc';

const cardSx = {
  p: 2,
  borderRadius: 2,
  bgcolor: PURPLE,
  boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
  border: 'none',
  position: 'relative',
  overflow: 'hidden',
  height: '100px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const decoBubble = (
  <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
);

export default function ClinicalTrialsReportsPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0);

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Reports & Analytics"
          description="KPI dashboard, trial pipeline, enrollment vs target, and compliance metrics"
          icon={<ReportsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Clinical Trials', path: '/institution/clinical-trials' },
            { label: 'Reports & Analytics', path: '/institution/clinical-trials/reports' },
          ]}
          actionButton={
            <Button
              variant="contained"
              startIcon={<BackIcon />}
              onClick={() => router.push('/institution/clinical-trials')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.25)',
                  transform: 'translateY(-1px)',
                }
              }}
            >
              Back to Portfolio
            </Button>
          }
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 6, backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 300px)' }}>

        {/* KPI Cards */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: 'wrap' }}>
          {[
            { label: 'Active Trials', value: '12', sub: 'Currently running', icon: <CheckCircle sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Compliance Rate', value: '92%', sub: 'Ethics compliance', icon: <TrendingUp sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Total Enrolled', value: '1,155', sub: 'Across all trials', icon: <PeopleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Overdue Actions', value: '3', sub: 'Require attention', icon: <Warning sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
          ].map((card) => (
            <Box key={card.label} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 10px)', md: '1 1 calc(25% - 15px)' } }}>
              <Paper sx={cardSx}>
                {decoBubble}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                    {card.label}
                  </Typography>
                  {card.icon}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                  {card.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                  {card.sub}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>

        {/* Tabs */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', mb: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              px: 2,
              borderBottom: '1px solid #e5e7eb',
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' },
              '& .Mui-selected': { color: PURPLE },
              '& .MuiTabs-indicator': { bgcolor: PURPLE },
            }}
          >
            <Tab label="Enrollment" />
            <Tab label="Compliance" />
            <Tab label="Pipeline" />
            <Tab label="Site Performance" />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        {tab === 0 && (
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: PURPLE, width: 40, height: 40 }}><PeopleIcon /></Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Enrollment vs Target</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>Monthly actual enrollment compared to target</Typography>
              </Box>
            </Box>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={enrollmentData}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PURPLE} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                <Legend />
                <Area type="monotone" dataKey="target" stroke="#d1d5db" strokeDasharray="5 5" fill="none" strokeWidth={2} name="Target" />
                <Area type="monotone" dataKey="actual" stroke={PURPLE} fill="url(#actualGrad)" strokeWidth={2} name="Actual" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        )}

        {tab === 1 && (
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: PURPLE, width: 40, height: 40 }}><CheckCircle /></Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Ethics Compliance Rate</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>Monthly compliance trend across all active trials</Typography>
              </Box>
            </Box>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} formatter={(v) => [`${v}%`, 'Compliance']} />
                <Legend />
                <Line type="monotone" dataKey="rate" stroke={PURPLE} strokeWidth={2.5} dot={{ fill: PURPLE, r: 5 }} name="Compliance %" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        )}

        {tab === 2 && (
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', flex: '1 1 calc(50% - 12px)', minWidth: 280 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: PURPLE, width: 40, height: 40 }}><TrialIcon /></Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Trials by Phase</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>Distribution across clinical phases</Typography>
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={phaseData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {phaseData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', flex: '1 1 calc(50% - 12px)', minWidth: 280 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: PURPLE, width: 40, height: 40 }}><ChartIcon /></Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Trials by Status</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>Current status breakdown</Typography>
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Box>
        )}

        {tab === 3 && (
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: PURPLE, width: 40, height: 40 }}><ReportsIcon /></Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Site Performance</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>Enrollment and compliance by research site</Typography>
              </Box>
            </Box>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={sitePerformanceData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="site" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                <Legend />
                <Bar yAxisId="left" dataKey="target" fill="#d1d5db" name="Target" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="enrolled" fill={PURPLE} name="Enrolled" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="compliance" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Compliance %" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        )}

      </Container>
    </>
  );
}
