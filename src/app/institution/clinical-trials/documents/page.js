'use client';

import React, { useState } from 'react';
import {
  Box, Container, Typography, Paper, Avatar, Chip,
  TextField, InputAdornment, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, MenuItem, Tab, Tabs,
} from '@mui/material';
import {
  FolderOpen as DocumentIcon,
  Search as SearchIcon,
  CheckCircle as ApprovedIcon,
  HourglassEmpty as PendingIcon,
  Warning as ConflictIcon,
  Error as OverdueIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Description as ProtocolIcon,
  Assignment as ConsentIcon,
  Science as LabIcon,
  Policy as RegulatoryIcon,
  HealthAndSafety as SafetyIcon,
  History as AuditIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const PURPLE = '#8b6cbc';

const mockDocuments = [
  { id: 'DOC-001', trial: 'Malaria Vaccine Phase II',     name: 'Study Protocol v3.1',                    category: 'PROTOCOL',   version: 'v3.1', uploadedDate: '2024-05-10', reviewDeadline: '2024-07-10', status: 'APPROVED',  uploadedBy: 'Dr. Amina Okonkwo',   size: '2.4 MB' },
  { id: 'DOC-002', trial: 'TB Treatment Efficacy Study',  name: 'Informed Consent Form v2.0',             category: 'CONSENT',    version: 'v2.0', uploadedDate: '2024-06-01', reviewDeadline: '2024-06-15', status: 'PENDING',   uploadedBy: 'Dr. James Mwangi',    size: '0.8 MB' },
  { id: 'DOC-003', trial: 'HIV Prevention Trial',         name: 'Investigator Brochure v4.2',             category: 'REGULATORY', version: 'v4.2', uploadedDate: '2024-04-20', reviewDeadline: '2024-05-20', status: 'OVERDUE',   uploadedBy: 'Dr. Sarah Ndlovu',    size: '5.1 MB' },
  { id: 'DOC-004', trial: 'Malaria Vaccine Phase II',     name: 'Lab Manual v1.0',                        category: 'LAB',        version: 'v1.0', uploadedDate: '2024-03-15', reviewDeadline: '2024-09-15', status: 'APPROVED',  uploadedBy: 'Dr. Amina Okonkwo',   size: '1.2 MB' },
  { id: 'DOC-005', trial: 'Diabetes Management Study',   name: 'Protocol Amendment v1.1',                category: 'PROTOCOL',   version: 'v1.1', uploadedDate: '2024-06-05', reviewDeadline: '2024-06-20', status: 'CONFLICT',  uploadedBy: 'Dr. Mohamed Hassan',  size: '3.0 MB' },
  { id: 'DOC-006', trial: 'Cancer Screening Initiative', name: 'Ethics Approval Certificate',            category: 'REGULATORY', version: 'v1.0', uploadedDate: '2024-02-28', reviewDeadline: '2025-02-28', status: 'APPROVED',  uploadedBy: 'Dr. Peter Ochieng',   size: '0.5 MB' },
  { id: 'DOC-007', trial: 'Hypertension Control Trial',  name: 'Safety Monitoring Plan v2.0',            category: 'SAFETY',     version: 'v2.0', uploadedDate: '2024-05-22', reviewDeadline: '2024-07-01', status: 'PENDING',   uploadedBy: 'Dr. Grace Kamau',     size: '1.8 MB' },
  { id: 'DOC-008', trial: 'Maternal Health Study',       name: 'Informed Consent Form v1.0',             category: 'CONSENT',    version: 'v1.0', uploadedDate: '2024-01-10', reviewDeadline: '2024-06-01', status: 'OVERDUE',   uploadedBy: 'Dr. Fatima Diop',     size: '0.6 MB' },
  { id: 'DOC-009', trial: 'TB Treatment Efficacy Study',  name: 'Randomisation SOP v3.0',                 category: 'PROTOCOL',   version: 'v3.0', uploadedDate: '2024-04-18', reviewDeadline: '2024-10-18', status: 'APPROVED',  uploadedBy: 'Dr. James Mwangi',    size: '0.9 MB' },
  { id: 'DOC-010', trial: 'HIV Prevention Trial',         name: 'DSMB Charter v2.1',                      category: 'SAFETY',     version: 'v2.1', uploadedDate: '2024-06-12', reviewDeadline: '2024-08-12', status: 'PENDING',   uploadedBy: 'Dr. Sarah Ndlovu',    size: '1.1 MB' },
];

const mockAudit = [
  { id: 'AUD-001', trial: 'Malaria Vaccine Phase II',    document: 'Study Protocol v3.1',           action: 'Approved',       user: 'IRB Reviewer',       date: '2024-05-18', notes: 'Approved after minor revisions' },
  { id: 'AUD-002', trial: 'TB Treatment Efficacy Study', document: 'Informed Consent Form v2.0',    action: 'Uploaded',       user: 'Dr. James Mwangi',   date: '2024-06-01', notes: 'Updated to v2.0 per ethics committee request' },
  { id: 'AUD-003', trial: 'HIV Prevention Trial',        document: 'Investigator Brochure v4.2',    action: 'Review Overdue', user: 'System',             date: '2024-06-14', notes: 'No reviewer assigned after 25 days' },
  { id: 'AUD-004', trial: 'Diabetes Management Study',  document: 'Protocol Amendment v1.1',        action: 'Version Conflict', user: 'System',           date: '2024-06-07', notes: 'v1.0 still marked active — conflict detected' },
  { id: 'AUD-005', trial: 'Cancer Screening Initiative',document: 'Ethics Approval Certificate',   action: 'Downloaded',     user: 'Dr. Peter Ochieng',  date: '2024-06-10', notes: 'Downloaded for site submission' },
  { id: 'AUD-006', trial: 'Maternal Health Study',       document: 'Informed Consent Form v1.0',   action: 'Review Overdue', user: 'System',             date: '2024-06-08', notes: 'ICF v2 available but not yet uploaded' },
];

const getCategoryConfig = (category) => {
  switch (category) {
    case 'PROTOCOL':   return { label: 'Protocol',    color: PURPLE,    icon: <ProtocolIcon    sx={{ fontSize: 14 }} /> };
    case 'CONSENT':    return { label: 'Consent',     color: '#3b82f6', icon: <ConsentIcon     sx={{ fontSize: 14 }} /> };
    case 'REGULATORY': return { label: 'Regulatory',  color: '#f59e0b', icon: <RegulatoryIcon  sx={{ fontSize: 14 }} /> };
    case 'LAB':        return { label: 'Lab',         color: '#10b981', icon: <LabIcon         sx={{ fontSize: 14 }} /> };
    case 'SAFETY':     return { label: 'Safety',      color: '#ef4444', icon: <SafetyIcon      sx={{ fontSize: 14 }} /> };
    default:           return { label: category,      color: '#6b7280', icon: null };
  }
};

const getStatusConfig = (status) => {
  switch (status) {
    case 'APPROVED':  return { color: '#10b981', icon: <ApprovedIcon sx={{ fontSize: 14 }} />, label: 'Approved' };
    case 'PENDING':   return { color: '#f59e0b', icon: <PendingIcon  sx={{ fontSize: 14 }} />, label: 'Pending Review' };
    case 'OVERDUE':   return { color: '#ef4444', icon: <OverdueIcon  sx={{ fontSize: 14 }} />, label: 'Review Overdue' };
    case 'CONFLICT':  return { color: '#7c3aed', icon: <ConflictIcon sx={{ fontSize: 14 }} />, label: 'Version Conflict' };
    default:          return { color: '#6b7280', icon: null, label: status };
  }
};

const getAuditActionColor = (action) => {
  switch (action) {
    case 'Approved':        return '#10b981';
    case 'Uploaded':        return PURPLE;
    case 'Downloaded':      return '#3b82f6';
    case 'Review Overdue':  return '#ef4444';
    case 'Version Conflict':return '#7c3aed';
    default:                return '#6b7280';
  }
};

const statCardSx = {
  p: 2, borderRadius: 2, bgcolor: PURPLE,
  boxShadow: '0 2px 8px rgba(139,108,188,0.2)',
  border: 'none', position: 'relative', overflow: 'hidden',
  height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
};

export default function DocumentRepositoryPage() {
  const [searchTerm, setSearchTerm]     = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tab, setTab] = useState(0);

  const filteredDocs = mockDocuments.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.trial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat    = categoryFilter === 'ALL' || d.category === categoryFilter;
    const matchesStatus = statusFilter   === 'ALL' || d.status   === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const filteredAudit = mockAudit.filter((a) =>
    a.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.trial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const approved  = mockDocuments.filter(d => d.status === 'APPROVED').length;
  const pending   = mockDocuments.filter(d => d.status === 'PENDING').length;
  const overdue   = mockDocuments.filter(d => d.status === 'OVERDUE').length;
  const conflicts = mockDocuments.filter(d => d.status === 'CONFLICT').length;

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Document Repository"
          description="Institution-wide TMF review — version-controlled protocols, audit trail, pending reviews"
          icon={<DocumentIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Clinical Trials', path: '/institution/clinical-trials' },
            { label: 'Documents', path: '/institution/clinical-trials/documents' },
          ]}
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 6, backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 300px)' }}>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: 'wrap' }}>
          {[
            { label: 'Approved',        value: approved,  sub: 'Documents cleared',      icon: <ApprovedIcon  sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Pending Review',  value: pending,   sub: 'Awaiting sign-off',       icon: <PendingIcon   sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Review Overdue',  value: overdue,   sub: 'Past review deadline',    icon: <OverdueIcon   sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
            { label: 'Version Conflicts', value: conflicts, sub: 'Conflicting versions',  icon: <ConflictIcon  sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} /> },
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
              placeholder="Search document, trial, or uploader..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: PURPLE }} /></InputAdornment> }}
              sx={{ flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: PURPLE }, '&.Mui-focused fieldset': { borderColor: PURPLE } } }}
            />
            <TextField select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} size="small"
              sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: PURPLE }, '&.Mui-focused fieldset': { borderColor: PURPLE } } }}>
              <MenuItem value="ALL">All Categories</MenuItem>
              <MenuItem value="PROTOCOL">Protocol</MenuItem>
              <MenuItem value="CONSENT">Consent</MenuItem>
              <MenuItem value="REGULATORY">Regulatory</MenuItem>
              <MenuItem value="LAB">Lab</MenuItem>
              <MenuItem value="SAFETY">Safety</MenuItem>
            </TextField>
            <TextField select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} size="small"
              sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: PURPLE }, '&.Mui-focused fieldset': { borderColor: PURPLE } } }}>
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="PENDING">Pending Review</MenuItem>
              <MenuItem value="OVERDUE">Review Overdue</MenuItem>
              <MenuItem value="CONFLICT">Version Conflict</MenuItem>
            </TextField>
          </Stack>
        </Paper>

        {/* Table Panel */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Box sx={{ p: 3, bgcolor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: PURPLE, width: 40, height: 40 }}><DocumentIcon /></Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Trial Master File (TMF)</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  {tab === 0 ? `${filteredDocs.length} documents` : `${filteredAudit.length} audit entries`}
                </Typography>
              </Box>
            </Box>
            <Chip label={tab === 0 ? `${filteredDocs.length} Docs` : `${filteredAudit.length} Entries`}
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
                Documents
                <Chip label={mockDocuments.length} size="small" sx={{ height: 18, fontSize: '0.7rem', fontWeight: 700, bgcolor: tab === 0 ? PURPLE : '#f3f4f6', color: tab === 0 ? 'white' : '#6b7280', minWidth: 24 }} />
              </Box>
            } />
            <Tab label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                Audit Trail
                <Chip label={mockAudit.length} size="small" sx={{ height: 18, fontSize: '0.7rem', fontWeight: 700, bgcolor: tab === 1 ? PURPLE : '#f3f4f6', color: tab === 1 ? 'white' : '#6b7280', minWidth: 24 }} />
              </Box>
            } />
          </Tabs>

          {/* Documents Table */}
          {tab === 0 && (
            <TableContainer sx={{ bgcolor: 'white' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    {['Document Name', 'Trial', 'Category', 'Version', 'Uploaded By', 'Upload Date', 'Review Deadline', 'Status', 'Size', 'Actions'].map(h => (
                      <TableCell key={h} align={h === 'Actions' ? 'center' : 'left'}
                        sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDocs.map((doc) => {
                    const cat = getCategoryConfig(doc.category);
                    const st  = getStatusConfig(doc.status);
                    return (
                      <TableRow key={doc.id} sx={{ '&:hover': { bgcolor: '#f9fafb', cursor: 'pointer' }, borderBottom: '1px solid #f3f4f6', borderLeft: `3px solid ${st.color}` }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DocumentIcon sx={{ fontSize: 18, color: cat.color }} />
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{doc.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{doc.trial}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip icon={cat.icon} label={cat.label} size="small"
                            sx={{ bgcolor: `${cat.color}15`, color: cat.color, fontWeight: 600, fontSize: '0.72rem', '& .MuiChip-icon': { color: cat.color } }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={doc.version} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.72rem', bgcolor: `${PURPLE}15`, color: PURPLE }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{doc.uploadedBy}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                            {new Date(doc.uploadedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                            {new Date(doc.reviewDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip icon={st.icon} label={st.label} size="small"
                            sx={{ bgcolor: `${st.color}15`, color: st.color, fontWeight: 600, fontSize: '0.72rem', '& .MuiChip-icon': { color: st.color } }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{doc.size}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Preview">
                              <IconButton size="small" sx={{ color: PURPLE }}><ViewIcon fontSize="small" /></IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton size="small" sx={{ color: '#6b7280' }}><DownloadIcon fontSize="small" /></IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Audit Trail */}
          {tab === 1 && (
            <TableContainer sx={{ bgcolor: 'white' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    {['Audit ID', 'Trial', 'Document', 'Action', 'Performed By', 'Date', 'Notes'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAudit.map((entry) => (
                    <TableRow key={entry.id} sx={{ '&:hover': { bgcolor: '#f9fafb' }, borderBottom: '1px solid #f3f4f6', borderLeft: `3px solid ${getAuditActionColor(entry.action)}` }}>
                      <TableCell>
                        <Chip label={entry.id} size="small" sx={{ fontWeight: 700, bgcolor: `${PURPLE}15`, color: PURPLE, fontFamily: 'monospace', fontSize: '0.72rem' }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 500 }}>{entry.trial}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{entry.document}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={entry.action} size="small" sx={{
                          bgcolor: `${getAuditActionColor(entry.action)}15`,
                          color: getAuditActionColor(entry.action),
                          fontWeight: 600, fontSize: '0.72rem'
                        }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{entry.user}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                          {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{entry.notes}</Typography>
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
