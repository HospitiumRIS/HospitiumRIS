'use client';

import React, { useState } from 'react';
import {
  Box, Container, Typography, Paper, Avatar, Chip,
  TextField, InputAdornment, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, MenuItem, Tab, Tabs,
} from '@mui/material';
import {
  Groups as TeamIcon,
  Search as SearchIcon,
  CheckCircle as ValidIcon,
  Warning as ExpiringIcon,
  Error as ExpiredIcon,
  HourglassEmpty as PendingIcon,
  Visibility as ViewIcon,
  Person as MemberIcon,
  School as GcpIcon,
  Assignment as DelegationIcon,
  AdminPanelSettings as RoleIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const PURPLE = '#8b6cbc';

const mockMembers = [
  { id: 'MBR-001', name: 'Dr. Amina Okonkwo',   role: 'Principal Investigator', trial: 'Malaria Vaccine Phase II',     email: 'a.okonkwo@institution.ac', gcpExpiry: '2025-03-15', gcpStatus: 'VALID',    delegationLog: 'COMPLETE', trialCount: 2 },
  { id: 'MBR-002', name: 'Dr. James Mwangi',    role: 'Principal Investigator', trial: 'TB Treatment Efficacy Study',  email: 'j.mwangi@institution.ac',  gcpExpiry: '2024-08-10', gcpStatus: 'EXPIRING', delegationLog: 'COMPLETE', trialCount: 1 },
  { id: 'MBR-003', name: 'Dr. Sarah Ndlovu',    role: 'Principal Investigator', trial: 'HIV Prevention Trial',         email: 's.ndlovu@institution.ac',  gcpExpiry: '2024-05-01', gcpStatus: 'EXPIRED',  delegationLog: 'MISSING',  trialCount: 1 },
  { id: 'MBR-004', name: 'Dr. Mohamed Hassan',  role: 'Principal Investigator', trial: 'Diabetes Management Study',   email: 'm.hassan@institution.ac',  gcpExpiry: '2026-01-20', gcpStatus: 'VALID',    delegationLog: 'COMPLETE', trialCount: 1 },
  { id: 'MBR-005', name: 'Dr. Grace Kamau',     role: 'Principal Investigator', trial: 'Hypertension Control Trial',  email: 'g.kamau@institution.ac',   gcpExpiry: '2024-07-05', gcpStatus: 'EXPIRING', delegationLog: 'MISSING',  trialCount: 1 },
  { id: 'MBR-006', name: 'Dr. Peter Ochieng',   role: 'Principal Investigator', trial: 'Cancer Screening Initiative', email: 'p.ochieng@institution.ac', gcpExpiry: '2025-11-30', gcpStatus: 'VALID',    delegationLog: 'COMPLETE', trialCount: 1 },
  { id: 'MBR-007', name: 'Dr. Fatima Diop',     role: 'Principal Investigator', trial: 'Maternal Health Study',       email: 'f.diop@institution.ac',    gcpExpiry: '2025-06-14', gcpStatus: 'VALID',    delegationLog: 'COMPLETE', trialCount: 1 },
  { id: 'MBR-008', name: 'Nurse Jane Otieno',   role: 'Site Coordinator',       trial: 'Malaria Vaccine Phase II',   email: 'j.otieno@institution.ac',  gcpExpiry: '2024-04-20', gcpStatus: 'EXPIRED',  delegationLog: 'COMPLETE', trialCount: 2 },
  { id: 'MBR-009', name: 'Mr. David Kipchoge',  role: 'Data Manager',           trial: 'TB Treatment Efficacy Study', email: 'd.kipchoge@institution.ac', gcpExpiry: '2025-09-01', gcpStatus: 'VALID',    delegationLog: 'MISSING',  trialCount: 1 },
  { id: 'MBR-010', name: 'Dr. Lena Mutua',      role: 'Sub-Investigator',       trial: 'HIV Prevention Trial',        email: 'l.mutua@institution.ac',   gcpExpiry: '2024-09-22', gcpStatus: 'EXPIRING', delegationLog: 'COMPLETE', trialCount: 2 },
  { id: 'MBR-011', name: 'Ms. Priya Sharma',    role: 'Pharmacist',             trial: 'Diabetes Management Study',  email: 'p.sharma@institution.ac',  gcpExpiry: '2026-03-10', gcpStatus: 'VALID',    delegationLog: 'COMPLETE', trialCount: 1 },
  { id: 'MBR-012', name: 'Mr. Kofi Mensah',     role: 'Lab Technician',         trial: 'Cancer Screening Initiative', email: 'k.mensah@institution.ac', gcpExpiry: '2024-06-30', gcpStatus: 'EXPIRING', delegationLog: 'MISSING',  trialCount: 1 },
];

const getRoleColor = (role) => {
  switch (role) {
    case 'Principal Investigator': return PURPLE;
    case 'Sub-Investigator':       return '#3b82f6';
    case 'Site Coordinator':       return '#10b981';
    case 'Data Manager':           return '#f59e0b';
    case 'Pharmacist':             return '#ef4444';
    case 'Lab Technician':         return '#6b7280';
    default:                       return '#6b7280';
  }
};

const getGcpConfig = (status) => {
  switch (status) {
    case 'VALID':    return { color: '#10b981', icon: <ValidIcon    sx={{ fontSize: 14 }} />, label: 'Valid' };
    case 'EXPIRING': return { color: '#f59e0b', icon: <ExpiringIcon sx={{ fontSize: 14 }} />, label: 'Expiring Soon' };
    case 'EXPIRED':  return { color: '#ef4444', icon: <ExpiredIcon  sx={{ fontSize: 14 }} />, label: 'Expired' };
    default:         return { color: '#6b7280', icon: null, label: status };
  }
};

const getDelegationConfig = (status) => {
  switch (status) {
    case 'COMPLETE': return { color: '#10b981', label: 'Complete' };
    case 'MISSING':  return { color: '#ef4444', label: 'Missing' };
    case 'PENDING':  return { color: '#f59e0b', label: 'Pending' };
    default:         return { color: '#6b7280', label: status };
  }
};

const statCardSx = {
  p: 2, borderRadius: 2, bgcolor: PURPLE,
  boxShadow: '0 2px 8px rgba(139,108,188,0.2)',
  border: 'none', position: 'relative', overflow: 'hidden',
  height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
};

export default function TeamAndGcpCertificationPage() {
  const [searchTerm, setSearchTerm]   = useState('');
  const [roleFilter, setRoleFilter]   = useState('ALL');
  const [gcpFilter, setGcpFilter]     = useState('ALL');
  const [tab, setTab]                 = useState(0);

  const totalMembers  = mockMembers.length;
  const gcpValid      = mockMembers.filter(m => m.gcpStatus === 'VALID').length;
  const gcpExpiring   = mockMembers.filter(m => m.gcpStatus === 'EXPIRING').length;
  const gcpExpired    = mockMembers.filter(m => m.gcpStatus === 'EXPIRED').length;
  const missingDels   = mockMembers.filter(m => m.delegationLog === 'MISSING').length;

  const filtered = mockMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.trial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    const matchesGcp  = gcpFilter  === 'ALL' || m.gcpStatus === gcpFilter;
    return matchesSearch && matchesRole && matchesGcp;
  });

  const alertMembers = filtered.filter(m => m.gcpStatus !== 'VALID' || m.delegationLog !== 'COMPLETE');

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Team & GCP Certification"
          description="Institution-wide team directory, GCP cert expiry alerts, delegation log completeness"
          icon={<TeamIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Clinical Trials', path: '/institution/clinical-trials' },
            { label: 'Team', path: '/institution/clinical-trials/team' },
          ]}
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 6, backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 300px)' }}>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: 'wrap' }}>
          {[
            { label: 'Team Members',     value: totalMembers, sub: 'Across all trials',        icon: <TeamIcon     sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'GCP Valid',        value: gcpValid,     sub: 'Certifications current',   icon: <ValidIcon    sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'GCP Expiring',     value: gcpExpiring,  sub: 'Action needed soon',        icon: <ExpiringIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Missing Del. Log', value: missingDels,  sub: 'Delegation logs absent',    icon: <DelegationIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
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
              placeholder="Search by name, trial, role, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: PURPLE }} /></InputAdornment> }}
              sx={{ flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: PURPLE }, '&.Mui-focused fieldset': { borderColor: PURPLE } } }}
            />
            <TextField select label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} size="small"
              sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: PURPLE }, '&.Mui-focused fieldset': { borderColor: PURPLE } } }}>
              <MenuItem value="ALL">All Roles</MenuItem>
              <MenuItem value="Principal Investigator">Principal Investigator</MenuItem>
              <MenuItem value="Sub-Investigator">Sub-Investigator</MenuItem>
              <MenuItem value="Site Coordinator">Site Coordinator</MenuItem>
              <MenuItem value="Data Manager">Data Manager</MenuItem>
              <MenuItem value="Pharmacist">Pharmacist</MenuItem>
              <MenuItem value="Lab Technician">Lab Technician</MenuItem>
            </TextField>
            <TextField select label="GCP Status" value={gcpFilter} onChange={(e) => setGcpFilter(e.target.value)} size="small"
              sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: PURPLE }, '&.Mui-focused fieldset': { borderColor: PURPLE } } }}>
              <MenuItem value="ALL">All GCP Status</MenuItem>
              <MenuItem value="VALID">Valid</MenuItem>
              <MenuItem value="EXPIRING">Expiring Soon</MenuItem>
              <MenuItem value="EXPIRED">Expired</MenuItem>
            </TextField>
          </Stack>
        </Paper>

        {/* Table Panel */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Box sx={{ p: 3, bgcolor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: PURPLE, width: 40, height: 40 }}><TeamIcon /></Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Trial Team Directory</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  {tab === 0 ? `${filtered.length} members` : `${alertMembers.length} members with alerts`}
                </Typography>
              </Box>
            </Box>
            <Chip label={tab === 0 ? `${filtered.length} Members` : `${alertMembers.length} Alerts`}
              sx={{ bgcolor: PURPLE, color: 'white', fontWeight: 600 }} />
          </Box>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
            px: 2, borderBottom: '1px solid #e5e7eb', bgcolor: 'white',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' },
            '& .Mui-selected': { color: PURPLE },
            '& .MuiTabs-indicator': { bgcolor: PURPLE },
          }}>
            <Tab label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                All Members
                <Chip label={mockMembers.length} size="small" sx={{ height: 18, fontSize: '0.7rem', fontWeight: 700, bgcolor: tab === 0 ? PURPLE : '#f3f4f6', color: tab === 0 ? 'white' : '#6b7280', minWidth: 24 }} />
              </Box>
            } />
            <Tab label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                GCP & Delegation Alerts
                <Chip label={mockMembers.filter(m => m.gcpStatus !== 'VALID' || m.delegationLog !== 'COMPLETE').length} size="small"
                  sx={{ height: 18, fontSize: '0.7rem', fontWeight: 700, bgcolor: tab === 1 ? PURPLE : '#f3f4f6', color: tab === 1 ? 'white' : '#6b7280', minWidth: 24 }} />
              </Box>
            } />
          </Tabs>

          <TableContainer sx={{ bgcolor: 'white' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  {['Member', 'Email', 'Role', 'Trial(s)', 'GCP Expiry', 'GCP Status', 'Delegation Log', 'Actions'].map(h => (
                    <TableCell key={h} align={h === 'Actions' ? 'center' : 'left'}
                      sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(tab === 0 ? filtered : alertMembers).map((m) => {
                  const gcp = getGcpConfig(m.gcpStatus);
                  const del = getDelegationConfig(m.delegationLog);
                  const roleColor = getRoleColor(m.role);
                  const hasAlert = m.gcpStatus !== 'VALID' || m.delegationLog !== 'COMPLETE';
                  return (
                    <TableRow key={m.id} sx={{
                      '&:hover': { bgcolor: '#f9fafb', cursor: 'pointer' },
                      borderBottom: '1px solid #f3f4f6',
                      borderLeft: `3px solid ${hasAlert ? gcp.color : '#10b981'}`,
                    }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: `${roleColor}20`, color: roleColor, fontSize: '0.8rem', fontWeight: 700 }}>
                            {m.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{m.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={m.role} size="small"
                          sx={{ fontWeight: 600, fontSize: '0.72rem', bgcolor: `${roleColor}15`, color: roleColor }} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{m.trial}</Typography>
                          {m.trialCount > 1 && (
                            <Chip label={`+${m.trialCount - 1}`} size="small"
                              sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700, bgcolor: `${PURPLE}15`, color: PURPLE, minWidth: 28 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{
                          fontSize: '0.82rem', fontWeight: 600,
                          color: gcp.color,
                        }}>
                          {new Date(m.gcpExpiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip icon={gcp.icon} label={gcp.label} size="small"
                          sx={{ bgcolor: `${gcp.color}15`, color: gcp.color, fontWeight: 600, fontSize: '0.72rem', '& .MuiChip-icon': { color: gcp.color } }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={del.label} size="small"
                          sx={{ bgcolor: `${del.color}15`, color: del.color, fontWeight: 600, fontSize: '0.72rem' }} />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Profile">
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
