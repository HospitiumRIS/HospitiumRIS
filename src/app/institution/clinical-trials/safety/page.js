'use client';

import React, { useState } from 'react';
import {
  Box, Container, Typography, Paper, Avatar, Chip,
  TextField, InputAdornment, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, MenuItem, Tab, Tabs,
} from '@mui/material';
import {
  HealthAndSafety as SafetyIcon,
  Search as SearchIcon,
  Error as CriticalIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as ResolvedIcon,
  HourglassEmpty as PendingIcon,
  Visibility as ViewIcon,
  ReportProblem as SaeIcon,
  BugReport as DeviationIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const PURPLE = '#8b6cbc';

const mockSAEs = [
  { id: 'SAE-001', trial: 'Malaria Vaccine Phase II',     pi: 'Dr. Amina Okonkwo', event: 'Severe allergic reaction (Grade 3)',        severity: 'SERIOUS',      reportedDate: '2024-06-01', slaDeadline: '2024-06-08', slaRemaining: -5,  status: 'OVERDUE',    caAction: 'Dose suspension pending review' },
  { id: 'SAE-002', trial: 'TB Treatment Efficacy Study',  pi: 'Dr. James Mwangi',  event: 'Hepatotoxicity — elevated liver enzymes',  severity: 'SERIOUS',      reportedDate: '2024-06-10', slaDeadline: '2024-06-17', slaRemaining: 2,   status: 'IN_REVIEW',  caAction: 'Participant withdrawn, hepatology referral' },
  { id: 'SAE-003', trial: 'HIV Prevention Trial',         pi: 'Dr. Sarah Ndlovu',  event: 'Hospitalisation — unrelated to study drug', severity: 'UNEXPECTED',   reportedDate: '2024-05-20', slaDeadline: '2024-05-27', slaRemaining: -18, status: 'RESOLVED',   caAction: 'DSMB notified, causality assessed as unrelated' },
  { id: 'SAE-004', trial: 'Diabetes Management Study',   pi: 'Dr. Mohamed Hassan', event: 'Severe hypoglycaemia episode',             severity: 'SERIOUS',      reportedDate: '2024-06-12', slaDeadline: '2024-06-19', slaRemaining: 4,   status: 'IN_REVIEW',  caAction: 'Dosing protocol under revision' },
  { id: 'SAE-005', trial: 'Maternal Health Study',       pi: 'Dr. Fatima Diop',   event: 'Preterm labour — possibly related',         severity: 'UNEXPECTED',   reportedDate: '2024-06-14', slaDeadline: '2024-06-21', slaRemaining: 6,   status: 'PENDING',    caAction: 'Causality assessment in progress' },
  { id: 'SAE-006', trial: 'Cancer Screening Initiative', pi: 'Dr. Peter Ochieng', event: 'Anaphylaxis following biopsy procedure',    severity: 'LIFE_THREATENING', reportedDate: '2024-06-15', slaDeadline: '2024-06-16', slaRemaining: 1, status: 'IN_REVIEW',  caAction: 'Emergency protocol activated; IRB notified' },
];

const mockDeviations = [
  { id: 'DEV-001', trial: 'Malaria Vaccine Phase II',     pi: 'Dr. Amina Okonkwo', deviation: 'Missed visit window — participant seen 5 days late', type: 'PROTOCOL',   severity: 'MINOR',    reportedDate: '2024-05-15', status: 'RESOLVED',   caAction: 'Participant reminder system updated' },
  { id: 'DEV-002', trial: 'TB Treatment Efficacy Study',  pi: 'Dr. James Mwangi',  deviation: 'Concomitant medication not recorded at baseline',  type: 'PROCEDURAL', severity: 'MAJOR',    reportedDate: '2024-06-02', status: 'OPEN',       caAction: 'Staff re-training scheduled' },
  { id: 'DEV-003', trial: 'HIV Prevention Trial',         pi: 'Dr. Sarah Ndlovu',  deviation: 'Informed consent form version outdated (v1 used)',  type: 'CONSENT',    severity: 'MAJOR',    reportedDate: '2024-05-28', status: 'CAPA_OPEN',  caAction: 'All ICFs re-obtained with v2 form' },
  { id: 'DEV-004', trial: 'Hypertension Control Trial',  pi: 'Dr. Grace Kamau',   deviation: 'Incorrect drug storage temperature for 2 hours',   type: 'PROTOCOL',   severity: 'CRITICAL', reportedDate: '2024-06-08', status: 'OPEN',       caAction: 'Pharmacy storage audit initiated' },
  { id: 'DEV-005', trial: 'Diabetes Management Study',   pi: 'Dr. Mohamed Hassan', deviation: 'Lab sample processed beyond acceptable window',    type: 'PROCEDURAL', severity: 'MINOR',    reportedDate: '2024-06-11', status: 'RESOLVED',   caAction: 'SOP updated for sample processing' },
  { id: 'DEV-006', trial: 'Maternal Health Study',       pi: 'Dr. Fatima Diop',   deviation: 'Eligibility criteria not fully verified at enrolment', type: 'CONSENT', severity: 'MAJOR',    reportedDate: '2024-06-13', status: 'CAPA_OPEN',  caAction: 'Screening checklist revised and re-trained' },
];

const getSeverityConfig = (severity) => {
  switch (severity) {
    case 'LIFE_THREATENING': return { color: '#7c3aed', label: 'Life-Threatening' };
    case 'SERIOUS':          return { color: '#ef4444', label: 'Serious' };
    case 'UNEXPECTED':       return { color: '#f59e0b', label: 'Unexpected' };
    case 'CRITICAL':         return { color: '#ef4444', label: 'Critical' };
    case 'MAJOR':            return { color: '#f59e0b', label: 'Major' };
    case 'MINOR':            return { color: '#10b981', label: 'Minor' };
    default:                 return { color: '#6b7280', label: severity };
  }
};

const getSaeStatusConfig = (status) => {
  switch (status) {
    case 'OVERDUE':   return { color: '#ef4444', icon: <CriticalIcon sx={{ fontSize: 14 }} />, label: 'Overdue' };
    case 'IN_REVIEW': return { color: '#f59e0b', icon: <WarningIcon  sx={{ fontSize: 14 }} />, label: 'In Review' };
    case 'PENDING':   return { color: '#3b82f6', icon: <PendingIcon  sx={{ fontSize: 14 }} />, label: 'Pending' };
    case 'RESOLVED':  return { color: '#10b981', icon: <ResolvedIcon sx={{ fontSize: 14 }} />, label: 'Resolved' };
    default:          return { color: '#6b7280', icon: null, label: status };
  }
};

const getDevStatusConfig = (status) => {
  switch (status) {
    case 'OPEN':      return { color: '#ef4444', label: 'Open' };
    case 'CAPA_OPEN': return { color: '#f59e0b', label: 'CAPA Open' };
    case 'RESOLVED':  return { color: '#10b981', label: 'Resolved' };
    default:          return { color: '#6b7280', label: status };
  }
};

const statCardSx = {
  p: 2, borderRadius: 2, bgcolor: PURPLE,
  boxShadow: '0 2px 8px rgba(139,108,188,0.2)',
  border: 'none', position: 'relative', overflow: 'hidden',
  height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
};

export default function SafetyAndDeviationsMonitorPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState(0);

  const saeOpen     = mockSAEs.filter(s => s.status !== 'RESOLVED').length;
  const saeOverdue  = mockSAEs.filter(s => s.status === 'OVERDUE').length;
  const devOpen     = mockDeviations.filter(d => d.status !== 'RESOLVED').length;
  const devCritical = mockDeviations.filter(d => d.severity === 'CRITICAL' || d.severity === 'MAJOR').length;

  const filteredSAEs = mockSAEs.filter(s =>
    s.trial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.pi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDevs = mockDeviations.filter(d =>
    d.trial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.deviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.pi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Safety & Deviations Monitor"
          description="SAE flag tracker, protocol deviations, SLA countdowns and corrective actions"
          icon={<SafetyIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Clinical Trials', path: '/institution/clinical-trials' },
            { label: 'Safety', path: '/institution/clinical-trials/safety' },
          ]}
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 6, backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 300px)' }}>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: 'wrap' }}>
          {[
            { label: 'Open SAEs',         value: saeOpen,     sub: 'Awaiting resolution',    icon: <SaeIcon       sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'SAEs Overdue',      value: saeOverdue,  sub: 'Past SLA deadline',       icon: <CriticalIcon  sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Open Deviations',   value: devOpen,     sub: 'Unresolved deviations',   icon: <DeviationIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Major / Critical',  value: devCritical, sub: 'High-severity deviations', icon: <WarningIcon   sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
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

        {/* Search */}
        <Paper sx={{ mb: 3, p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <TextField
            fullWidth
            placeholder="Search by trial, PI, or event description..."
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
              <Avatar sx={{ bgcolor: PURPLE, width: 40, height: 40 }}><SafetyIcon /></Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Safety Events & Deviations</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  {tab === 0 ? `${filteredSAEs.length} SAEs` : `${filteredDevs.length} deviations`} found
                </Typography>
              </Box>
            </Box>
            <Chip
              label={tab === 0 ? `${filteredSAEs.length} SAEs` : `${filteredDevs.length} Deviations`}
              sx={{ bgcolor: PURPLE, color: 'white', fontWeight: 600 }}
            />
          </Box>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
            px: 2, borderBottom: '1px solid #e5e7eb', bgcolor: 'white',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' },
            '& .Mui-selected': { color: PURPLE },
            '& .MuiTabs-indicator': { bgcolor: PURPLE },
          }}>
            <Tab label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                Serious Adverse Events
                <Chip label={mockSAEs.length} size="small" sx={{ height: 18, fontSize: '0.7rem', fontWeight: 700, bgcolor: tab === 0 ? PURPLE : '#f3f4f6', color: tab === 0 ? 'white' : '#6b7280', minWidth: 24 }} />
              </Box>
            } />
            <Tab label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                Protocol Deviations
                <Chip label={mockDeviations.length} size="small" sx={{ height: 18, fontSize: '0.7rem', fontWeight: 700, bgcolor: tab === 1 ? PURPLE : '#f3f4f6', color: tab === 1 ? 'white' : '#6b7280', minWidth: 24 }} />
              </Box>
            } />
          </Tabs>

          {/* SAEs */}
          {tab === 0 && (
            <TableContainer sx={{ bgcolor: 'white' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    {['ID', 'Trial', 'Adverse Event', 'Severity', 'Reported', 'SLA Deadline', 'SLA Status', 'Current Status', 'Corrective Action', 'Action'].map(h => (
                      <TableCell key={h} align={h === 'Action' ? 'center' : 'left'}
                        sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSAEs.map((sae) => {
                    const sev = getSeverityConfig(sae.severity);
                    const st  = getSaeStatusConfig(sae.status);
                    return (
                      <TableRow key={sae.id} sx={{ '&:hover': { bgcolor: '#f9fafb', cursor: 'pointer' }, borderBottom: '1px solid #f3f4f6', borderLeft: `3px solid ${sev.color}` }}>
                        <TableCell>
                          <Chip label={sae.id} size="small" sx={{ fontWeight: 700, bgcolor: `${PURPLE}15`, color: PURPLE, fontFamily: 'monospace', fontSize: '0.72rem' }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{sae.trial}</Typography>
                          <Typography variant="caption" color="text.secondary">{sae.pi}</Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{sae.event}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={sev.label} size="small" sx={{ bgcolor: `${sev.color}15`, color: sev.color, fontWeight: 600, fontSize: '0.72rem' }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                            {new Date(sae.reportedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                            {new Date(sae.slaDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{
                            fontWeight: 700, fontSize: '0.82rem',
                            color: sae.slaRemaining < 0 ? '#ef4444' : sae.slaRemaining <= 3 ? '#f59e0b' : '#10b981',
                          }}>
                            {sae.slaRemaining < 0 ? `${Math.abs(sae.slaRemaining)}d overdue` : `${sae.slaRemaining}d left`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip icon={st.icon} label={st.label} size="small"
                            sx={{ bgcolor: `${st.color}15`, color: st.color, fontWeight: 600, fontSize: '0.72rem', '& .MuiChip-icon': { color: st.color } }} />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{sae.caAction}</Typography>
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

          {/* Deviations */}
          {tab === 1 && (
            <TableContainer sx={{ bgcolor: 'white' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    {['ID', 'Trial', 'Deviation', 'Type', 'Severity', 'Reported', 'Status', 'Corrective Action', 'Action'].map(h => (
                      <TableCell key={h} align={h === 'Action' ? 'center' : 'left'}
                        sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDevs.map((dev) => {
                    const sev = getSeverityConfig(dev.severity);
                    const st  = getDevStatusConfig(dev.status);
                    return (
                      <TableRow key={dev.id} sx={{ '&:hover': { bgcolor: '#f9fafb', cursor: 'pointer' }, borderBottom: '1px solid #f3f4f6', borderLeft: `3px solid ${sev.color}` }}>
                        <TableCell>
                          <Chip label={dev.id} size="small" sx={{ fontWeight: 700, bgcolor: `${PURPLE}15`, color: PURPLE, fontFamily: 'monospace', fontSize: '0.72rem' }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{dev.trial}</Typography>
                          <Typography variant="caption" color="text.secondary">{dev.pi}</Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{dev.deviation}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={dev.type} size="small" sx={{ fontWeight: 600, fontSize: '0.72rem', bgcolor: `${PURPLE}15`, color: PURPLE }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={sev.label} size="small" sx={{ bgcolor: `${sev.color}15`, color: sev.color, fontWeight: 600, fontSize: '0.72rem' }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                            {new Date(dev.reportedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={st.label} size="small" sx={{ bgcolor: `${st.color}15`, color: st.color, fontWeight: 600, fontSize: '0.72rem' }} />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{dev.caAction}</Typography>
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
        </Paper>
      </Container>
    </>
  );
}
