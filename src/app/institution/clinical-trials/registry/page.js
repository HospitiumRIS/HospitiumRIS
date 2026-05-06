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
  LinearProgress,
} from '@mui/material';
import {
  CloudSync as RegistryIcon,
  Search as SearchIcon,
  CheckCircle as UpToDateIcon,
  Warning as OverdueIcon,
  HourglassEmpty as PendingIcon,
  Visibility as ViewIcon,
  OpenInNew as ExternalIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const PURPLE = '#8b6cbc';

const mockRegistrations = [
  { id: 'TRN-001', trial: 'Malaria Vaccine Phase II', pi: 'Dr. Amina Okonkwo', trn: 'PACTR202401001234', registry: 'PACTR', submittedDate: '2024-01-20', updateDeadline: '2025-01-20', lastUpdated: '2024-06-01', status: 'UP_TO_DATE', completeness: 95 },
  { id: 'TRN-002', trial: 'TB Treatment Efficacy Study', pi: 'Dr. James Mwangi', trn: 'NCT05123456', registry: 'ClinicalTrials.gov', submittedDate: '2023-08-15', updateDeadline: '2024-07-10', lastUpdated: '2024-04-20', status: 'UPDATE_DUE', completeness: 78 },
  { id: 'TRN-003', trial: 'HIV Prevention Trial', pi: 'Dr. Sarah Ndlovu', trn: 'PACTR202309005678', registry: 'PACTR', submittedDate: '2023-09-01', updateDeadline: '2024-06-01', lastUpdated: '2023-12-10', status: 'OVERDUE', completeness: 62 },
  { id: 'TRN-004', trial: 'Diabetes Management Study', pi: 'Dr. Mohamed Hassan', trn: 'ISRCTN12345678', registry: 'ISRCTN', submittedDate: '2023-06-10', updateDeadline: '2024-08-10', lastUpdated: '2024-05-15', status: 'UP_TO_DATE', completeness: 88 },
  { id: 'TRN-005', trial: 'Hypertension Control Trial', pi: 'Dr. Grace Kamau', trn: null, registry: 'PACTR', submittedDate: null, updateDeadline: null, lastUpdated: null, status: 'NOT_REGISTERED', completeness: 0 },
  { id: 'TRN-006', trial: 'Cancer Screening Initiative', pi: 'Dr. Peter Ochieng', trn: 'PACTR202402007890', registry: 'PACTR', submittedDate: '2024-02-28', updateDeadline: '2025-02-28', lastUpdated: '2024-06-10', status: 'UP_TO_DATE', completeness: 91 },
  { id: 'TRN-007', trial: 'Maternal Health Study', pi: 'Dr. Fatima Diop', trn: 'NCT06234567', registry: 'ClinicalTrials.gov', submittedDate: '2023-10-05', updateDeadline: '2024-07-05', lastUpdated: '2024-03-01', status: 'UPDATE_DUE', completeness: 74 },
];

const getStatusConfig = (status) => {
  switch (status) {
    case 'UP_TO_DATE':     return { color: '#10b981', icon: <UpToDateIcon sx={{ fontSize: 16 }} />,  label: 'Up to Date' };
    case 'UPDATE_DUE':     return { color: '#f59e0b', icon: <PendingIcon  sx={{ fontSize: 16 }} />,  label: 'Update Due' };
    case 'OVERDUE':        return { color: '#ef4444', icon: <OverdueIcon  sx={{ fontSize: 16 }} />,  label: 'Overdue' };
    case 'NOT_REGISTERED': return { color: '#9ca3af', icon: <OverdueIcon  sx={{ fontSize: 16 }} />,  label: 'Not Registered' };
    default:               return { color: '#6b7280', icon: null, label: status };
  }
};

const getRegistryColor = (registry) => {
  switch (registry) {
    case 'PACTR':             return '#8b6cbc';
    case 'ClinicalTrials.gov': return '#3b82f6';
    case 'ISRCTN':            return '#10b981';
    default:                  return '#6b7280';
  }
};

const statCardSx = {
  p: 2, borderRadius: 2, bgcolor: PURPLE,
  boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
  border: 'none', position: 'relative', overflow: 'hidden',
  height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
};

export default function RegistryOversightPage() {
  const [searchTerm, setSearchTerm]     = useState('');
  const [registryFilter, setRegistryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = mockRegistrations.filter((r) => {
    const matchesSearch =
      r.trial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.pi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.trn && r.trn.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRegistry = registryFilter === 'ALL' || r.registry === registryFilter;
    const matchesStatus   = statusFilter   === 'ALL' || r.status   === statusFilter;
    return matchesSearch && matchesRegistry && matchesStatus;
  });

  const upToDate      = mockRegistrations.filter(r => r.status === 'UP_TO_DATE').length;
  const updateDue     = mockRegistrations.filter(r => r.status === 'UPDATE_DUE').length;
  const overdue       = mockRegistrations.filter(r => r.status === 'OVERDUE').length;
  const notRegistered = mockRegistrations.filter(r => r.status === 'NOT_REGISTERED').length;

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Registry Oversight"
          description="TRN tracking, submission deadlines, PACTR / ClinicalTrials.gov / ISRCTN status"
          icon={<RegistryIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Clinical Trials', path: '/institution/clinical-trials' },
            { label: 'Registry Oversight', path: '/institution/clinical-trials/registry' },
          ]}
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 6, backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 300px)' }}>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: 'wrap' }}>
          {[
            { label: 'Up to Date',      value: upToDate,      sub: 'Registrations current',    icon: <UpToDateIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Update Due',      value: updateDue,     sub: 'Deadline approaching',      icon: <PendingIcon  sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Overdue',         value: overdue,       sub: 'Past update deadline',       icon: <OverdueIcon  sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Not Registered',  value: notRegistered, sub: 'TRN missing',                icon: <RegistryIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
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

        {/* Filters */}
        <Paper sx={{ mb: 3, p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Search trial, PI, or TRN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: PURPLE }} /></InputAdornment>,
              }}
              sx={{ flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: PURPLE }, '&.Mui-focused fieldset': { borderColor: PURPLE } } }}
            />
            <TextField select label="Registry" value={registryFilter} onChange={(e) => setRegistryFilter(e.target.value)} size="small"
              sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: PURPLE }, '&.Mui-focused fieldset': { borderColor: PURPLE } } }}>
              <MenuItem value="ALL">All Registries</MenuItem>
              <MenuItem value="PACTR">PACTR</MenuItem>
              <MenuItem value="ClinicalTrials.gov">ClinicalTrials.gov</MenuItem>
              <MenuItem value="ISRCTN">ISRCTN</MenuItem>
            </TextField>
            <TextField select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} size="small"
              sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: PURPLE }, '&.Mui-focused fieldset': { borderColor: PURPLE } } }}>
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="UP_TO_DATE">Up to Date</MenuItem>
              <MenuItem value="UPDATE_DUE">Update Due</MenuItem>
              <MenuItem value="OVERDUE">Overdue</MenuItem>
              <MenuItem value="NOT_REGISTERED">Not Registered</MenuItem>
            </TextField>
          </Stack>
        </Paper>

        {/* Table */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Box sx={{ p: 3, bgcolor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: PURPLE, width: 40, height: 40 }}><RegistryIcon /></Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Trial Registrations</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  {filtered.length} {filtered.length === 1 ? 'registration' : 'registrations'} found
                </Typography>
              </Box>
            </Box>
            <Chip label={`${filtered.length} Total`} sx={{ bgcolor: PURPLE, color: 'white', fontWeight: 600 }} />
          </Box>

          <TableContainer sx={{ bgcolor: 'white' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  {['Trial', 'Principal Investigator', 'TRN', 'Registry', 'Submitted', 'Update Deadline', 'Completeness', 'Status', 'Actions'].map((h) => (
                    <TableCell key={h} align={h === 'Actions' ? 'center' : 'left'}
                      sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((reg) => {
                  const st = getStatusConfig(reg.status);
                  return (
                    <TableRow key={reg.id} sx={{ '&:hover': { bgcolor: '#f9fafb', cursor: 'pointer' }, borderBottom: '1px solid #f3f4f6', borderLeft: `3px solid ${st.color}` }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{reg.trial}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{reg.pi}</Typography>
                      </TableCell>
                      <TableCell>
                        {reg.trn ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Chip label={reg.trn} size="small" sx={{ fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700, bgcolor: `${PURPLE}15`, color: PURPLE }} />
                            <Tooltip title="Open in registry">
                              <IconButton size="small" sx={{ color: PURPLE, p: 0.25 }}><ExternalIcon sx={{ fontSize: 14 }} /></IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>Not assigned</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={reg.registry} size="small"
                          sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: `${getRegistryColor(reg.registry)}15`, color: getRegistryColor(reg.registry) }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          {reg.submittedDate ? new Date(reg.submittedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          {reg.updateDeadline ? new Date(reg.updateDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 130 }}>
                        {reg.completeness > 0 ? (
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: reg.completeness >= 80 ? '#10b981' : reg.completeness >= 60 ? '#f59e0b' : '#ef4444' }}>
                                {reg.completeness}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={reg.completeness}
                              sx={{
                                height: 5, borderRadius: 3,
                                bgcolor: '#f3f4f6',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: reg.completeness >= 80 ? '#10b981' : reg.completeness >= 60 ? '#f59e0b' : '#ef4444',
                                  borderRadius: 3,
                                }
                              }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>—</Typography>
                        )}
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
        </Paper>
      </Container>
    </>
  );
}
