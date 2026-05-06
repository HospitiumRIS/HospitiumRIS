'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  MenuItem,
  Tab,
  Tabs,
} from '@mui/material';
import {
  VerifiedUser as ComplianceIcon,
  Search as SearchIcon,
  Error as CriticalIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as OkIcon,
  Visibility as ViewIcon,
  Gavel as EthicsIcon,
  School as GcpIcon,
  CloudSync as RegistryIcon,
  HealthAndSafety as SaeIcon,
  Assessment as ResultsIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const PURPLE = '#8b6cbc';

const mockFlags = [
  { id: 'FL-001', trial: 'HIV Prevention Trial', pi: 'Dr. Sarah Ndlovu', category: 'ETHICS', issue: 'Ethics approval expired 45 days ago', severity: 'CRITICAL', dueDate: '2024-12-15', daysOverdue: 45 },
  { id: 'FL-002', trial: 'Diabetes Management Study', pi: 'Dr. Mohamed Hassan', category: 'ETHICS', issue: 'Ethics approval expiring in 15 days', severity: 'WARNING', dueDate: '2024-08-01', daysOverdue: -15 },
  { id: 'FL-003', trial: 'TB Treatment Efficacy Study', pi: 'Dr. James Mwangi', category: 'GCP', issue: 'GCP certificate expiring in 22 days', severity: 'WARNING', dueDate: '2024-07-15', daysOverdue: -22 },
  { id: 'FL-004', trial: 'Malaria Vaccine Phase II', pi: 'Dr. Amina Okonkwo', category: 'GCP', issue: 'Site coordinator GCP cert expired', severity: 'CRITICAL', dueDate: '2024-05-01', daysOverdue: 60 },
  { id: 'FL-005', trial: 'Cancer Screening Initiative', pi: 'Dr. Peter Ochieng', category: 'REGISTRY', issue: 'PACTR registration overdue by 30 days', severity: 'CRITICAL', dueDate: '2024-03-01', daysOverdue: 30 },
  { id: 'FL-006', trial: 'Hypertension Control Trial', pi: 'Dr. Grace Kamau', category: 'REGISTRY', issue: 'Annual registry update not submitted', severity: 'WARNING', dueDate: '2024-07-20', daysOverdue: -10 },
  { id: 'FL-007', trial: 'Maternal Health Study', pi: 'Dr. Fatima Diop', category: 'SAE', issue: 'SAE report 7 days past submission deadline', severity: 'CRITICAL', dueDate: '2024-06-10', daysOverdue: 7 },
  { id: 'FL-008', trial: 'TB Treatment Efficacy Study', pi: 'Dr. James Mwangi', category: 'SAE', issue: 'SAE follow-up report due in 3 days', severity: 'WARNING', dueDate: '2024-07-03', daysOverdue: -3 },
  { id: 'FL-009', trial: 'Malaria Vaccine Phase II', pi: 'Dr. Amina Okonkwo', category: 'RESULTS', issue: 'Results submission deadline in 28 days', severity: 'INFO', dueDate: '2024-07-28', daysOverdue: -28 },
  { id: 'FL-010', trial: 'HIV Prevention Trial', pi: 'Dr. Sarah Ndlovu', category: 'RESULTS', issue: 'Final study report 14 days overdue', severity: 'CRITICAL', dueDate: '2024-06-16', daysOverdue: 14 },
];

const getCategoryConfig = (category) => {
  switch (category) {
    case 'ETHICS':   return { label: 'Ethics Expiry', icon: <EthicsIcon sx={{ fontSize: 16 }} />, color: '#8b6cbc' };
    case 'GCP':      return { label: 'GCP Certificate', icon: <GcpIcon sx={{ fontSize: 16 }} />, color: '#3b82f6' };
    case 'REGISTRY': return { label: 'Registry Update', icon: <RegistryIcon sx={{ fontSize: 16 }} />, color: '#f59e0b' };
    case 'SAE':      return { label: 'SAE Reporting', icon: <SaeIcon sx={{ fontSize: 16 }} />, color: '#ef4444' };
    case 'RESULTS':  return { label: 'Results Deadline', icon: <ResultsIcon sx={{ fontSize: 16 }} />, color: '#10b981' };
    default:         return { label: category, icon: null, color: '#6b7280' };
  }
};

const getSeverityConfig = (severity) => {
  switch (severity) {
    case 'CRITICAL': return { color: '#ef4444', icon: <CriticalIcon sx={{ fontSize: 16 }} />, label: 'Critical' };
    case 'WARNING':  return { color: '#f59e0b', icon: <WarningIcon sx={{ fontSize: 16 }} />, label: 'Warning' };
    case 'INFO':     return { color: '#3b82f6', icon: <InfoIcon sx={{ fontSize: 16 }} />, label: 'Info' };
    default:         return { color: '#10b981', icon: <OkIcon sx={{ fontSize: 16 }} />, label: 'OK' };
  }
};

const statCardSx = {
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

export default function ComplianceFlagsDashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState(0);

  const tabCategories = ['ALL', 'ETHICS', 'GCP', 'REGISTRY', 'SAE', 'RESULTS'];
  const activeCategory = tabCategories[tab];

  const filteredFlags = mockFlags.filter((f) => {
    const matchesSearch =
      f.trial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.pi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.issue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || f.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const criticalCount = mockFlags.filter(f => f.severity === 'CRITICAL').length;
  const warningCount  = mockFlags.filter(f => f.severity === 'WARNING').length;
  const infoCount     = mockFlags.filter(f => f.severity === 'INFO').length;

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Compliance Flags Dashboard"
          description="Live compliance monitoring — ethics expiry, GCP certs, registry updates, SAE deadlines"
          icon={<ComplianceIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Clinical Trials', path: '/institution/clinical-trials' },
            { label: 'Compliance', path: '/institution/clinical-trials/compliance' },
          ]}
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 6, backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 300px)' }}>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Flags', value: mockFlags.length, sub: 'Active issues', icon: <ComplianceIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Critical', value: criticalCount, sub: 'Immediate action', icon: <CriticalIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Warnings', value: warningCount, sub: 'Action needed soon', icon: <WarningIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Informational', value: infoCount, sub: 'Upcoming deadlines', icon: <InfoIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
          ].map((card) => (
            <Box key={card.label} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 10px)', md: '1 1 calc(25% - 15px)' } }}>
              <Paper sx={statCardSx}>
                <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
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

        {/* Search */}
        <Paper sx={{ mb: 3, p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <TextField
            fullWidth
            placeholder="Search by trial, PI, or issue description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: PURPLE }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': { borderColor: PURPLE },
                '&.Mui-focused fieldset': { borderColor: PURPLE },
              }
            }}
            size="small"
          />
        </Paper>

        {/* Flags Table */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          {/* Table Header */}
          <Box sx={{ p: 3, bgcolor: 'white', borderBottom: '1px solid #e5e7eb' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: PURPLE, width: 40, height: 40 }}>
                  <ComplianceIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Compliance Flags</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    {filteredFlags.length} {filteredFlags.length === 1 ? 'flag' : 'flags'} found
                  </Typography>
                </Box>
              </Box>
              <Chip label={`${filteredFlags.length} Flags`} sx={{ bgcolor: PURPLE, color: 'white', fontWeight: 600 }} />
            </Box>
          </Box>

          {/* Category Tabs */}
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              px: 2,
              borderBottom: '1px solid #e5e7eb',
              bgcolor: 'white',
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', minWidth: 'auto', px: 2 },
              '& .Mui-selected': { color: PURPLE },
              '& .MuiTabs-indicator': { bgcolor: PURPLE },
            }}
          >
            {[{ label: 'All', count: mockFlags.length },
              { label: 'Ethics', count: mockFlags.filter(f => f.category === 'ETHICS').length },
              { label: 'GCP Certs', count: mockFlags.filter(f => f.category === 'GCP').length },
              { label: 'Registry', count: mockFlags.filter(f => f.category === 'REGISTRY').length },
              { label: 'SAE', count: mockFlags.filter(f => f.category === 'SAE').length },
              { label: 'Results', count: mockFlags.filter(f => f.category === 'RESULTS').length },
            ].map((t) => (
              <Tab key={t.label} label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {t.label}
                  <Chip label={t.count} size="small" sx={{ height: 18, fontSize: '0.7rem', fontWeight: 700, bgcolor: tab === tabCategories.indexOf(t.label.toUpperCase().replace(' ', '')) || (t.label === 'All' && tab === 0) ? PURPLE : '#f3f4f6', color: tab === tabCategories.indexOf(t.label.toUpperCase().replace(' ', '')) || (t.label === 'All' && tab === 0) ? 'white' : '#6b7280', minWidth: 24 }} />
                </Box>
              } />
            ))}
          </Tabs>

          <TableContainer sx={{ bgcolor: 'white' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Flag ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Trial</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Issue</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Severity</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Due / Deadline</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFlags.map((flag) => {
                  const cat = getCategoryConfig(flag.category);
                  const sev = getSeverityConfig(flag.severity);
                  return (
                    <TableRow
                      key={flag.id}
                      sx={{
                        '&:hover': { bgcolor: '#f9fafb', cursor: 'pointer' },
                        borderBottom: '1px solid #f3f4f6',
                        borderLeft: `3px solid ${sev.color}`,
                      }}
                    >
                      <TableCell>
                        <Chip label={flag.id} size="small" sx={{ fontWeight: 700, bgcolor: `${PURPLE}15`, color: PURPLE, fontFamily: 'monospace', fontSize: '0.75rem' }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{flag.trial}</Typography>
                        <Typography variant="caption" color="text.secondary">{flag.pi}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{flag.issue}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={cat.icon}
                          label={cat.label}
                          size="small"
                          sx={{ bgcolor: `${cat.color}15`, color: cat.color, fontWeight: 600, fontSize: '0.75rem', '& .MuiChip-icon': { color: cat.color } }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={sev.icon}
                          label={sev.label}
                          size="small"
                          sx={{ bgcolor: `${sev.color}15`, color: sev.color, fontWeight: 600, fontSize: '0.75rem', '& .MuiChip-icon': { color: sev.color } }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          {new Date(flag.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            color: flag.daysOverdue > 0 ? '#ef4444' : flag.daysOverdue > -14 ? '#f59e0b' : '#10b981',
                          }}
                        >
                          {flag.daysOverdue > 0
                            ? `${flag.daysOverdue}d overdue`
                            : `Due in ${Math.abs(flag.daysOverdue)}d`}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton size="small" sx={{ color: PURPLE }}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </>
  );
}
