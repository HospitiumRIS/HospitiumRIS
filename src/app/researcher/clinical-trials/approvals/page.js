'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Warning as WarningIcon,
  Gavel as IRBIcon,
  VerifiedUser as ComplianceIcon,
  Description as DocumentIcon,
  Send as SubmitIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';

const statusColors = {
  DRAFT: '#9e9e9e',
  SUBMITTED_TO_IRB: '#2196f3',
  UNDER_IRB_REVIEW: '#ff9800',
  IRB_APPROVED: '#4caf50',
  IRB_CONDITIONAL: '#8bc34a',
  IRB_REJECTED: '#f44336',
  INSTITUTIONAL_CLEARANCE: '#00bcd4',
  FULLY_APPROVED: '#4caf50',
};

export default function ApprovalsEthicsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedApproval, setSelectedApproval] = useState(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const mockApprovals = [
        {
          id: 1,
          trialId: 'CT-2024-001',
          title: 'Phase III Trial of Novel Antimalarial Drug',
          irbNumber: 'IRB-2024-045',
          status: 'IRB_APPROVED',
          submittedDate: new Date('2024-01-20'),
          approvalDate: new Date('2024-02-15'),
          expiryDate: new Date('2025-02-15'),
          institutionalClearance: true,
          progress: 100,
        },
        {
          id: 2,
          trialId: 'CT-2024-002',
          title: 'Observational Study on HIV Treatment Adherence',
          irbNumber: 'IRB-2024-052',
          status: 'UNDER_IRB_REVIEW',
          submittedDate: new Date('2024-03-01'),
          approvalDate: null,
          expiryDate: null,
          institutionalClearance: false,
          progress: 45,
        },
        {
          id: 3,
          trialId: 'CT-2024-003',
          title: 'Randomized Trial of TB Vaccine Efficacy',
          irbNumber: null,
          status: 'DRAFT',
          submittedDate: null,
          approvalDate: null,
          expiryDate: null,
          institutionalClearance: false,
          progress: 20,
        },
      ];
      setApprovals(mockApprovals);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, approval) => {
    setMenuAnchor(event.currentTarget);
    setSelectedApproval(approval);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedApproval(null);
  };

  const filteredApprovals = approvals.filter((approval) => {
    const matchesSearch = approval.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         approval.trialId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || approval.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const breadcrumbs = [
    { label: 'Dashboard', path: '/researcher' },
    { label: 'Clinical Trials', path: '/researcher/clinical-trials' },
    { label: 'Approvals & Ethics' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', pt: 10 }}>
      <Container maxWidth="xl">
        <PageHeader
          title="Approvals & Ethics"
          subtitle="Route protocols through IRB/IEC and track institutional clearances"
          icon={<ComplianceIcon sx={{ fontSize: 40, color: '#8b6cbc' }} />}
          breadcrumbs={breadcrumbs}
          actions={
            <Button
              variant="contained"
              startIcon={<SubmitIcon />}
              onClick={() => router.push('/researcher/clinical-trials/approvals/submit')}
              sx={{
                backgroundColor: '#8b6cbc',
                '&:hover': { backgroundColor: '#7a5caa' },
              }}
            >
              Submit for IRB Review
            </Button>
          }
        />

        <Box sx={{ mt: 4 }}>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <CardContent>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {approvals.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Total Applications
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <CardContent>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {approvals.filter(a => a.status === 'IRB_APPROVED' || a.status === 'FULLY_APPROVED').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Approved
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <CardContent>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {approvals.filter(a => a.status === 'UNDER_IRB_REVIEW').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Under Review
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                <CardContent>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {approvals.filter(a => a.status === 'DRAFT').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Pending Submission
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Search approvals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ flexGrow: 1, minWidth: 250 }}
                />
                <TextField
                  select
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="All">All Statuses</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="SUBMITTED_TO_IRB">Submitted to IRB</MenuItem>
                  <MenuItem value="UNDER_IRB_REVIEW">Under IRB Review</MenuItem>
                  <MenuItem value="IRB_APPROVED">IRB Approved</MenuItem>
                  <MenuItem value="FULLY_APPROVED">Fully Approved</MenuItem>
                </TextField>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress sx={{ color: '#8b6cbc' }} />
                </Box>
              ) : filteredApprovals.length === 0 ? (
                <Alert severity="info">No approval records found matching your criteria.</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Trial ID</strong></TableCell>
                        <TableCell><strong>Title</strong></TableCell>
                        <TableCell><strong>IRB Number</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Progress</strong></TableCell>
                        <TableCell><strong>Submitted</strong></TableCell>
                        <TableCell><strong>Approval Date</strong></TableCell>
                        <TableCell><strong>Expiry</strong></TableCell>
                        <TableCell align="right"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredApprovals.map((approval) => (
                        <TableRow key={approval.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                              {approval.trialId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{approval.title}</Typography>
                          </TableCell>
                          <TableCell>
                            {approval.irbNumber ? (
                              <Chip
                                icon={<IRBIcon />}
                                label={approval.irbNumber}
                                size="small"
                                color="primary"
                              />
                            ) : (
                              <Chip label="Not Assigned" size="small" variant="outlined" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={approval.status.replace(/_/g, ' ')}
                              size="small"
                              sx={{
                                backgroundColor: statusColors[approval.status],
                                color: 'white',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={approval.progress}
                                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                              />
                              <Typography variant="caption">{approval.progress}%</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {approval.submittedDate ? format(approval.submittedDate, 'MMM dd, yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            {approval.approvalDate ? format(approval.approvalDate, 'MMM dd, yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            {approval.expiryDate ? (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: new Date(approval.expiryDate) < new Date() ? 'error.main' : 'text.primary'
                                }}
                              >
                                {format(approval.expiryDate, 'MMM dd, yyyy')}
                              </Typography>
                            ) : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, approval)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <ViewIcon sx={{ mr: 1 }} /> View Details
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <EditIcon sx={{ mr: 1 }} /> Edit Application
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <DocumentIcon sx={{ mr: 1 }} /> View Documents
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <SubmitIcon sx={{ mr: 1 }} /> Submit to IRB
          </MenuItem>
        </Menu>
      </Container>
    </Box>
  );
}
