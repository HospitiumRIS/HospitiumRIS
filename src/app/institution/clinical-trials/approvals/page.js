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
  Gavel as EthicsIcon,
  Search as SearchIcon,
  CheckCircle as ApprovedIcon,
  HourglassEmpty as PendingIcon,
  Warning as ExpiringIcon,
  Cancel as RejectedIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const mockApplications = [
  { id: 'ETH-2024-001', trial: 'Malaria Vaccine Phase II', pi: 'Dr. Amina Okonkwo', status: 'APPROVED', submittedDate: '2024-01-15', approvalDate: '2024-02-20', expiryDate: '2025-02-20', daysToExpiry: 120 },
  { id: 'ETH-2024-002', trial: 'TB Treatment Efficacy Study', pi: 'Dr. James Mwangi', status: 'PENDING', submittedDate: '2024-03-10', approvalDate: null, expiryDate: null, daysToExpiry: null },
  { id: 'ETH-2024-003', trial: 'HIV Prevention Trial', pi: 'Dr. Sarah Ndlovu', status: 'APPROVED', submittedDate: '2023-11-05', approvalDate: '2023-12-15', expiryDate: '2024-12-15', daysToExpiry: -45 },
  { id: 'ETH-2024-004', trial: 'Diabetes Management Study', pi: 'Dr. Mohamed Hassan', status: 'EXPIRING', submittedDate: '2023-06-20', approvalDate: '2023-08-01', expiryDate: '2024-08-01', daysToExpiry: 15 },
  { id: 'ETH-2024-005', trial: 'Hypertension Control Trial', pi: 'Dr. Grace Kamau', status: 'REJECTED', submittedDate: '2024-02-28', approvalDate: null, expiryDate: null, daysToExpiry: null },
  { id: 'ETH-2024-006', trial: 'Cancer Screening Initiative', pi: 'Dr. Peter Ochieng', status: 'PENDING', submittedDate: '2024-04-05', approvalDate: null, expiryDate: null, daysToExpiry: null },
  { id: 'ETH-2024-007', trial: 'Maternal Health Study', pi: 'Dr. Fatima Diop', status: 'APPROVED', submittedDate: '2023-09-12', approvalDate: '2023-10-25', expiryDate: '2024-10-25', daysToExpiry: 45 },
];

const PURPLE = '#8b6cbc';

const getStatusConfig = (status) => {
  switch (status) {
    case 'APPROVED':
      return { color: '#10b981', icon: <ApprovedIcon sx={{ fontSize: 16 }} />, label: 'Approved' };
    case 'PENDING':
      return { color: '#f59e0b', icon: <PendingIcon sx={{ fontSize: 16 }} />, label: 'Pending Review' };
    case 'EXPIRING':
      return { color: '#ef4444', icon: <ExpiringIcon sx={{ fontSize: 16 }} />, label: 'Expiring Soon' };
    case 'REJECTED':
      return { color: '#9ca3af', icon: <RejectedIcon sx={{ fontSize: 16 }} />, label: 'Rejected' };
    default:
      return { color: '#6b7280', icon: null, label: status };
  }
};

export default function EthicsRoutingAndApprovalsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredApplications = mockApplications.filter((app) => {
    const matchesSearch =
      app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.trial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.pi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockApplications.length,
    approved: mockApplications.filter(a => a.status === 'APPROVED').length,
    pending: mockApplications.filter(a => a.status === 'PENDING').length,
    expiring: mockApplications.filter(a => a.status === 'EXPIRING' || (a.daysToExpiry !== null && a.daysToExpiry < 30 && a.daysToExpiry > 0)).length,
  };

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Ethics Routing & Approvals"
          description="Route and track IRB/ethics applications across all trials"
          icon={<EthicsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Clinical Trials', path: '/institution/clinical-trials' },
            { label: 'Ethics Routing', path: '/institution/clinical-trials/approvals' },
          ]}
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 6, backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 300px)' }}>

        {/* Statistics Cards */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: 'wrap' }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 10px)', md: '1 1 calc(25% - 15px)' } }}>
            <Paper sx={{ 
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
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Total Applications
                </Typography>
                <AssessmentIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.total}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                All submissions
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 10px)', md: '1 1 calc(25% - 15px)' } }}>
            <Paper sx={{ 
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
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Approved
                </Typography>
                <ApprovedIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.approved}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Active approvals
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 10px)', md: '1 1 calc(25% - 15px)' } }}>
            <Paper sx={{ 
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
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Pending Review
                </Typography>
                <PendingIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.pending}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Awaiting decision
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 10px)', md: '1 1 calc(25% - 15px)' } }}>
            <Paper sx={{ 
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
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Expiring Soon
                </Typography>
                <ExpiringIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.expiring}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Require renewal
              </Typography>
            </Paper>
          </Box>
        </Box>

        {/* Filters and Search */}
        <Paper sx={{ mb: 3, p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Search by ID, trial name, or PI..."
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
                flexGrow: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': { borderColor: PURPLE },
                  '&.Mui-focused fieldset': { borderColor: PURPLE },
                }
              }}
              size="small"
            />
            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ 
                minWidth: 180,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': { borderColor: PURPLE },
                  '&.Mui-focused fieldset': { borderColor: PURPLE },
                }
              }}
              size="small"
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="EXPIRING">Expiring Soon</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </TextField>
          </Stack>
        </Paper>

        {/* Applications Table */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Box sx={{ p: 3, bgcolor: 'white', borderBottom: '1px solid #e5e7eb' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: PURPLE, width: 40, height: 40 }}>
                  <EthicsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    Ethics Applications
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    {filteredApplications.length} {filteredApplications.length === 1 ? 'application' : 'applications'} found
                  </Typography>
                </Box>
              </Box>
              <Chip 
                label={`${filteredApplications.length} Total`} 
                sx={{ 
                  bgcolor: PURPLE, 
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }} 
              />
            </Box>
          </Box>
          <TableContainer sx={{ bgcolor: 'white' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Application ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Trial Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Principal Investigator</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Submitted</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Expiry Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Days to Expiry</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredApplications.map((app) => {
                  const statusConfig = getStatusConfig(app.status);
                  return (
                    <TableRow 
                      key={app.id}
                      sx={{ 
                        '&:hover': { bgcolor: '#f9fafb', cursor: 'pointer' },
                        borderBottom: '1px solid #f3f4f6'
                      }}
                    >
                      <TableCell>
                        <Chip 
                          label={app.id} 
                          size="small"
                          sx={{ 
                            fontWeight: 700, 
                            bgcolor: `${PURPLE}15`,
                            color: PURPLE,
                            fontFamily: 'monospace',
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {app.trial}
                        </Typography>
                      </TableCell>
                      <TableCell>{app.pi}</TableCell>
                      <TableCell>
                        <Chip
                          icon={statusConfig.icon}
                          label={statusConfig.label}
                          size="small"
                          sx={{
                            bgcolor: `${statusConfig.color}15`,
                            color: statusConfig.color,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            '& .MuiChip-icon': { color: statusConfig.color }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          {new Date(app.submittedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {app.expiryDate ? (
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {new Date(app.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.daysToExpiry !== null ? (
                          <Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: app.daysToExpiry < 0 ? '#ef4444' : app.daysToExpiry < 30 ? '#f59e0b' : '#10b981'
                              }}
                            >
                              {app.daysToExpiry < 0 ? `Expired ${Math.abs(app.daysToExpiry)} days ago` : `${app.daysToExpiry} days`}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>—</Typography>
                        )}
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
