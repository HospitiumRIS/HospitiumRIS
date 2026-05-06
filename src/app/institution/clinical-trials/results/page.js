'use client';

import React, { useState } from 'react';
import {
  Box, Container, Typography, Paper, Avatar, Chip,
  TextField, InputAdornment, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, MenuItem, Tab, Tabs, LinearProgress,
} from '@mui/material';
import {
  Insights as ResultsIcon,
  Search as SearchIcon,
  CheckCircle as SubmittedIcon,
  HourglassEmpty as PendingIcon,
  Warning as DueIcon,
  Error as OverdueIcon,
  Article as PublicationIcon,
  MonetizationOn as GrantIcon,
  Visibility as ViewIcon,
  OpenInNew as LinkIcon,
  Timer as CountdownIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const PURPLE = '#8b6cbc';

const mockResults = [
  { id: 'RES-001', trial: 'Malaria Vaccine Phase II',     pi: 'Dr. Amina Okonkwo',  completionDate: '2024-03-01', submissionDeadline: '2024-09-01', daysToDeadline: 75,  status: 'PENDING',   registrySubmitted: false, pubLinked: true,  grantLinked: true,  publicationDoi: '10.1016/j.vaccine.2024.001', grantRef: 'NIH-R01-2022-045' },
  { id: 'RES-002', trial: 'TB Treatment Efficacy Study',  pi: 'Dr. James Mwangi',   completionDate: '2023-12-15', submissionDeadline: '2024-06-15', daysToDeadline: -15, status: 'OVERDUE',   registrySubmitted: false, pubLinked: false, grantLinked: true,  publicationDoi: null,                          grantRef: 'EDCTP-2021-119' },
  { id: 'RES-003', trial: 'HIV Prevention Trial',         pi: 'Dr. Sarah Ndlovu',   completionDate: '2024-01-10', submissionDeadline: '2024-07-10', daysToDeadline: 24,  status: 'DUE_SOON',  registrySubmitted: true,  pubLinked: false, grantLinked: false, publicationDoi: null,                          grantRef: null },
  { id: 'RES-004', trial: 'Diabetes Management Study',   pi: 'Dr. Mohamed Hassan', completionDate: '2023-09-20', submissionDeadline: '2024-03-20', daysToDeadline: -90, status: 'OVERDUE',   registrySubmitted: true,  pubLinked: true,  grantLinked: true,  publicationDoi: '10.1056/NEJMoa2024.004',      grantRef: 'MRC-MR/2020-088' },
  { id: 'RES-005', trial: 'Cancer Screening Initiative', pi: 'Dr. Peter Ochieng',  completionDate: '2024-04-30', submissionDeadline: '2024-10-30', daysToDeadline: 130, status: 'PENDING',   registrySubmitted: false, pubLinked: false, grantLinked: false, publicationDoi: null,                          grantRef: null },
  { id: 'RES-006', trial: 'Maternal Health Study',       pi: 'Dr. Fatima Diop',    completionDate: '2024-02-14', submissionDeadline: '2024-08-14', daysToDeadline: 58,  status: 'PENDING',   registrySubmitted: true,  pubLinked: false, grantLinked: true,  publicationDoi: null,                          grantRef: 'BMGF-OPP-2022-011' },
  { id: 'RES-007', trial: 'Hypertension Control Trial',  pi: 'Dr. Grace Kamau',    completionDate: '2023-11-01', submissionDeadline: '2024-05-01', daysToDeadline: -56, status: 'OVERDUE',   registrySubmitted: false, pubLinked: false, grantLinked: false, publicationDoi: null,                          grantRef: null },
  { id: 'RES-008', trial: 'Malaria Vaccine Phase II',    pi: 'Dr. Amina Okonkwo',  completionDate: '2023-06-01', submissionDeadline: '2023-12-01', daysToDeadline: null, status: 'SUBMITTED', registrySubmitted: true,  pubLinked: true,  grantLinked: true,  publicationDoi: '10.1038/s41591-2023.009',    grantRef: 'NIH-R01-2020-032' },
];

const getStatusConfig = (status) => {
  switch (status) {
    case 'SUBMITTED': return { color: '#10b981', icon: <SubmittedIcon sx={{ fontSize: 14 }} />, label: 'Submitted' };
    case 'DUE_SOON':  return { color: '#f59e0b', icon: <DueIcon       sx={{ fontSize: 14 }} />, label: 'Due Soon' };
    case 'PENDING':   return { color: '#3b82f6', icon: <PendingIcon   sx={{ fontSize: 14 }} />, label: 'Pending' };
    case 'OVERDUE':   return { color: '#ef4444', icon: <OverdueIcon   sx={{ fontSize: 14 }} />, label: 'Overdue' };
    default:          return { color: '#6b7280', icon: null, label: status };
  }
};

const getCountdownColor = (days) => {
  if (days === null) return '#10b981';
  if (days < 0)  return '#ef4444';
  if (days <= 30) return '#f59e0b';
  if (days <= 60) return '#3b82f6';
  return '#10b981';
};

const statCardSx = {
  p: 2, borderRadius: 2, bgcolor: PURPLE,
  boxShadow: '0 2px 8px rgba(139,108,188,0.2)',
  border: 'none', position: 'relative', overflow: 'hidden',
  height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
};

export default function ResultsReportingTrackerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tab, setTab] = useState(0);

  const submitted   = mockResults.filter(r => r.status === 'SUBMITTED').length;
  const overdue     = mockResults.filter(r => r.status === 'OVERDUE').length;
  const dueSoon     = mockResults.filter(r => r.status === 'DUE_SOON').length;
  const pubLinked   = mockResults.filter(r => r.pubLinked).length;

  const filtered = mockResults.filter((r) => {
    const matchesSearch =
      r.trial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.pi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.grantRef && r.grantRef.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const linkedResults = filtered.filter(r => r.pubLinked || r.grantLinked);

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Results & Reporting"
          description="Results submission deadlines, output-to-publication linkage, grant report connections"
          icon={<ResultsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Clinical Trials', path: '/institution/clinical-trials' },
            { label: 'Results', path: '/institution/clinical-trials/results' },
          ]}
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 6, backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 300px)' }}>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: 'wrap' }}>
          {[
            { label: 'Submitted',       value: submitted, sub: 'Results filed',           icon: <SubmittedIcon  sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Overdue',         value: overdue,   sub: 'Past submission deadline', icon: <OverdueIcon    sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Due Soon',        value: dueSoon,   sub: 'Within 30 days',           icon: <CountdownIcon  sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Pub. Linked',     value: pubLinked, sub: 'Output-to-publication',    icon: <PublicationIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
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
              placeholder="Search trial, PI, or grant reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: PURPLE }} /></InputAdornment> }}
              sx={{ flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: PURPLE }, '&.Mui-focused fieldset': { borderColor: PURPLE } } }}
            />
            <TextField select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} size="small"
              sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: PURPLE }, '&.Mui-focused fieldset': { borderColor: PURPLE } } }}>
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="SUBMITTED">Submitted</MenuItem>
              <MenuItem value="DUE_SOON">Due Soon</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="OVERDUE">Overdue</MenuItem>
            </TextField>
          </Stack>
        </Paper>

        {/* Table Panel */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Box sx={{ p: 3, bgcolor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: PURPLE, width: 40, height: 40 }}><ResultsIcon /></Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Results Reporting</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  {tab === 0 ? `${filtered.length} trials` : `${linkedResults.length} with linked outputs`}
                </Typography>
              </Box>
            </Box>
            <Chip label={tab === 0 ? `${filtered.length} Trials` : `${linkedResults.length} Linked`}
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
                Deadline Tracker
                <Chip label={mockResults.length} size="small" sx={{ height: 18, fontSize: '0.7rem', fontWeight: 700, bgcolor: tab === 0 ? PURPLE : '#f3f4f6', color: tab === 0 ? 'white' : '#6b7280', minWidth: 24 }} />
              </Box>
            } />
            <Tab label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                Publication & Grant Linkage
                <Chip label={mockResults.filter(r => r.pubLinked || r.grantLinked).length} size="small" sx={{ height: 18, fontSize: '0.7rem', fontWeight: 700, bgcolor: tab === 1 ? PURPLE : '#f3f4f6', color: tab === 1 ? 'white' : '#6b7280', minWidth: 24 }} />
              </Box>
            } />
          </Tabs>

          {/* Deadline Tracker */}
          {tab === 0 && (
            <TableContainer sx={{ bgcolor: 'white' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    {['Trial', 'Principal Investigator', 'Completion Date', 'Submission Deadline', 'Countdown', 'Registry Filed', 'Status', 'Actions'].map(h => (
                      <TableCell key={h} align={h === 'Actions' ? 'center' : 'left'}
                        sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((r) => {
                    const st = getStatusConfig(r.status);
                    const cdColor = getCountdownColor(r.daysToDeadline);
                    return (
                      <TableRow key={r.id} sx={{ '&:hover': { bgcolor: '#f9fafb', cursor: 'pointer' }, borderBottom: '1px solid #f3f4f6', borderLeft: `3px solid ${st.color}` }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.trial}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{r.pi}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                            {new Date(r.completionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 500 }}>
                            {new Date(r.submissionDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ minWidth: 140 }}>
                          {r.daysToDeadline !== null ? (
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem', color: cdColor, mb: 0.5 }}>
                                {r.daysToDeadline < 0
                                  ? `${Math.abs(r.daysToDeadline)}d overdue`
                                  : r.daysToDeadline === 0 ? 'Due today'
                                  : `${r.daysToDeadline}d remaining`}
                              </Typography>
                              {r.daysToDeadline >= 0 && (
                                <LinearProgress variant="determinate"
                                  value={Math.max(0, Math.min(100, 100 - (r.daysToDeadline / 180) * 100))}
                                  sx={{ height: 4, borderRadius: 2, bgcolor: '#f3f4f6',
                                    '& .MuiLinearProgress-bar': { bgcolor: cdColor, borderRadius: 2 } }}
                                />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>Completed</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={r.registrySubmitted ? 'Filed' : 'Not Filed'}
                            size="small"
                            sx={{ fontWeight: 600, fontSize: '0.72rem',
                              bgcolor: r.registrySubmitted ? '#10b98115' : '#ef444415',
                              color:   r.registrySubmitted ? '#10b981'   : '#ef4444' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip icon={st.icon} label={st.label} size="small"
                            sx={{ bgcolor: `${st.color}15`, color: st.color, fontWeight: 600, fontSize: '0.72rem', '& .MuiChip-icon': { color: st.color } }} />
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

          {/* Publication & Grant Linkage */}
          {tab === 1 && (
            <TableContainer sx={{ bgcolor: 'white' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    {['Trial', 'Principal Investigator', 'Publication DOI', 'Publication Status', 'Grant Reference', 'Grant Status', 'Actions'].map(h => (
                      <TableCell key={h} align={h === 'Actions' ? 'center' : 'left'}
                        sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} sx={{ '&:hover': { bgcolor: '#f9fafb', cursor: 'pointer' }, borderBottom: '1px solid #f3f4f6' }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.trial}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{r.pi}</Typography>
                      </TableCell>
                      <TableCell>
                        {r.publicationDoi ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Chip label={r.publicationDoi} size="small"
                              sx={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 600, bgcolor: `${PURPLE}15`, color: PURPLE, maxWidth: 180 }} />
                            <Tooltip title="Open DOI">
                              <IconButton size="small" sx={{ color: PURPLE, p: 0.25 }}><LinkIcon sx={{ fontSize: 14 }} /></IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>Not linked</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={r.pubLinked ? <PublicationIcon sx={{ fontSize: 14 }} /> : <PendingIcon sx={{ fontSize: 14 }} />}
                          label={r.pubLinked ? 'Linked' : 'Pending'}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.72rem',
                            bgcolor: r.pubLinked ? '#10b98115' : '#f59e0b15',
                            color:   r.pubLinked ? '#10b981'   : '#f59e0b',
                            '& .MuiChip-icon': { color: r.pubLinked ? '#10b981' : '#f59e0b' } }}
                        />
                      </TableCell>
                      <TableCell>
                        {r.grantRef ? (
                          <Chip label={r.grantRef} size="small"
                            sx={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 600, bgcolor: '#10b98115', color: '#10b981' }} />
                        ) : (
                          <Typography variant="body2" sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={r.grantLinked ? <GrantIcon sx={{ fontSize: 14 }} /> : <PendingIcon sx={{ fontSize: 14 }} />}
                          label={r.grantLinked ? 'Linked' : 'Not linked'}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.72rem',
                            bgcolor: r.grantLinked ? '#10b98115' : '#f3f4f6',
                            color:   r.grantLinked ? '#10b981'   : '#6b7280',
                            '& .MuiChip-icon': { color: r.grantLinked ? '#10b981' : '#6b7280' } }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton size="small" sx={{ color: PURPLE }}><ViewIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </>
  );
}
