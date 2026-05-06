'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Dashboard as IntelligenceIcon,
  TrendingUp as TrendingUpIcon,
  Article as PublicationIcon,
  AttachMoney as FundingIcon,
  Science as TrialIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = ['#8b6cbc', '#2196f3', '#4caf50', '#ff9800', '#f44336', '#00bcd4'];

export default function TrialIntelligencePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('12m');

  const breadcrumbs = [
    { label: 'Dashboard', href: '/researcher' },
    { label: 'Reports & Analytics', href: '/researcher/analytics' },
    { label: 'Trial Intelligence' },
  ];

  const trialsByPhase = [
    { name: 'Phase I', value: 3, color: '#8b6cbc' },
    { name: 'Phase II', value: 5, color: '#2196f3' },
    { name: 'Phase III', value: 4, color: '#4caf50' },
    { name: 'Phase IV', value: 2, color: '#ff9800' },
    { name: 'Observational', value: 6, color: '#00bcd4' },
  ];

  const enrollmentTrend = [
    { month: 'Jan', enrolled: 45, target: 50 },
    { month: 'Feb', enrolled: 52, target: 50 },
    { month: 'Mar', enrolled: 48, target: 50 },
    { month: 'Apr', enrolled: 55, target: 50 },
    { month: 'May', enrolled: 60, target: 50 },
    { month: 'Jun', enrolled: 58, target: 50 },
    { month: 'Jul', enrolled: 62, target: 50 },
    { month: 'Aug', enrolled: 65, target: 50 },
    { month: 'Sep', enrolled: 70, target: 50 },
    { month: 'Oct', enrolled: 68, target: 50 },
    { month: 'Nov', enrolled: 72, target: 50 },
    { month: 'Dec', enrolled: 75, target: 50 },
  ];

  const publicationMetrics = [
    { year: '2020', trials: 8, publications: 12 },
    { year: '2021', trials: 10, publications: 18 },
    { year: '2022', trials: 12, publications: 22 },
    { year: '2023', trials: 15, publications: 28 },
    { year: '2024', trials: 20, publications: 35 },
  ];

  const fundingBySource = [
    { name: 'NIH', amount: 5200000 },
    { name: 'Gates Foundation', amount: 3800000 },
    { name: 'Wellcome Trust', amount: 3200000 },
    { name: 'PEPFAR', amount: 2100000 },
    { name: 'Local Grants', amount: 1500000 },
    { name: 'Industry', amount: 4200000 },
  ];

  const trialOutcomes = [
    { name: 'Completed Successfully', value: 12, color: '#4caf50' },
    { name: 'Ongoing', value: 8, color: '#2196f3' },
    { name: 'Terminated Early', value: 2, color: '#f44336' },
    { name: 'Suspended', value: 1, color: '#ff9800' },
  ];

  const kpiData = {
    totalTrials: 23,
    activeTrials: 8,
    completedTrials: 12,
    totalEnrollment: 3450,
    totalPublications: 115,
    publicationRate: 5.0,
    totalFunding: 20000000,
    avgTrialDuration: 18.5,
    successRate: 85.7,
  };

  const chartPaper = {
    p: 3,
    borderRadius: 4,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  };

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Trial Intelligence"
          description="Institutional KPIs, trial-to-publication rates, and funding ROI"
          icon={<IntelligenceIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={breadcrumbs}
          actionButton={
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.8)' }}>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                  sx={{
                    color: 'white',
                    borderRadius: 2,
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.6)' },
                    '.MuiSvgIcon-root': { color: 'white' },
                  }}
                >
                  <MenuItem value="6m">Last 6 Months</MenuItem>
                  <MenuItem value="12m">Last 12 Months</MenuItem>
                  <MenuItem value="24m">Last 24 Months</MenuItem>
                  <MenuItem value="all">All Time</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.25)',
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                Export Report
              </Button>
            </Box>
          }
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 6, backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 300px)' }}>

        {/* KPI Stats Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {[
            { label: 'Total Trials', value: kpiData.totalTrials, sub: `${kpiData.activeTrials} active, ${kpiData.completedTrials} completed`, icon: <TrialIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Publications', value: kpiData.totalPublications, sub: `${kpiData.publicationRate} per trial`, icon: <PublicationIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Total Funding', value: `$${(kpiData.totalFunding / 1000000).toFixed(1)}M`, sub: 'Across all trials', icon: <FundingIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Success Rate', value: `${kpiData.successRate}%`, sub: 'Completed trials', icon: <TrendingUpIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
          ].map((kpi, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{
                p: 2, borderRadius: 2, bgcolor: '#8b6cbc',
                boxShadow: '0 2px 8px rgba(139,108,188,0.2)',
                position: 'relative', overflow: 'hidden',
                height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
              }}>
                <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                    {kpi.label}
                  </Typography>
                  {kpi.icon}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                  {kpi.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                  {kpi.sub}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Row 1: Enrollment Trend + Trials by Phase */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3, '@media (max-width: 900px)': { flexDirection: 'column' } }}>
          <Paper sx={chartPaper}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2c3e50', mb: 2 }}>
              Monthly Enrollment Trend
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={enrollmentTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#666' }} />
                <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                <RechartsTooltip contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0' }} />
                <Legend formatter={(v) => <span style={{ fontSize: '0.8rem', color: '#2c3e50' }}>{v}</span>} />
                <Area type="monotone" dataKey="enrolled" stroke="#8b6cbc" fill="rgba(139,108,188,0.15)" strokeWidth={2} name="Enrolled" />
                <Area type="monotone" dataKey="target" stroke="#ff9800" fill="none" strokeDasharray="5 5" strokeWidth={2} name="Target" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
          <Paper sx={chartPaper}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2c3e50', mb: 2 }}>
              Trials by Phase
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={trialsByPhase} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={true}>
                  {trialsByPhase.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Row 2: Trial-to-Publication Rate + Funding by Source */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3, '@media (max-width: 900px)': { flexDirection: 'column' } }}>
          <Paper sx={chartPaper}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2c3e50', mb: 2 }}>
              Trial-to-Publication Rate
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={publicationMetrics} barGap={4} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#666' }} />
                <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                <RechartsTooltip contentStyle={{ borderRadius: 8 }} />
                <Legend formatter={(v) => <span style={{ fontSize: '0.8rem', color: '#2c3e50' }}>{v === 'trials' ? 'Trials' : 'Publications'}</span>} />
                <Bar dataKey="trials" fill="#8b6cbc" name="trials" radius={[4, 4, 0, 0]} />
                <Bar dataKey="publications" fill="#2196f3" name="publications" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
          <Paper sx={chartPaper}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2c3e50', mb: 2 }}>
              Funding by Source
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={fundingBySource} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#666' }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#666' }} />
                <RechartsTooltip formatter={(v) => `$${(v/1000000).toFixed(2)}M`} contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="amount" fill="#4caf50" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Row 3: Trial Outcomes + Additional Metrics */}
        <Box sx={{ display: 'flex', gap: 3, '@media (max-width: 900px)': { flexDirection: 'column' } }}>
          <Paper sx={chartPaper}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2c3e50', mb: 2 }}>
              Trial Outcomes
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={trialOutcomes} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {trialOutcomes.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: 8 }} formatter={(v, n, p) => [v, p.payload.name]} />
                <Legend formatter={(v, e) => <span style={{ fontSize: '0.8rem', color: '#2c3e50' }}>{e.payload.name}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>

          <Paper sx={chartPaper}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2c3e50', mb: 2 }}>
              Key Metrics Summary
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, justifyContent: 'center' }}>
              {[
                { label: 'Total Participants Enrolled', value: kpiData.totalEnrollment.toLocaleString(), color: '#8b6cbc' },
                { label: 'Avg Trial Duration', value: `${kpiData.avgTrialDuration} months`, color: '#2196f3' },
                { label: 'Funding ROI per Publication', value: `$${((kpiData.totalFunding / kpiData.totalPublications) / 1000).toFixed(0)}K`, color: '#4caf50' },
                { label: 'Active Trials', value: kpiData.activeTrials, color: '#ff9800' },
              ].map((m, i) => (
                <Box key={i} sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  p: 2, borderRadius: 2, backgroundColor: '#f8f9fa',
                  borderLeft: `4px solid ${m.color}`
                }}>
                  <Typography variant="body2" color="text.secondary">{m.label}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: m.color }}>{m.value}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

      </Container>
    </>
  );
}
