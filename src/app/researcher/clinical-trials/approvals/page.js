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

  const stats = {
    total: approvals.length,
    approved: approvals.filter(a => a.status === 'IRB_APPROVED' || a.status === 'FULLY_APPROVED').length,
    underReview: approvals.filter(a => a.status === 'UNDER_IRB_REVIEW').length,
    draft: approvals.filter(a => a.status === 'DRAFT').length,
  };

  return (
    <Box>
      {/* Page Header */}
      <PageHeader
        title="Approvals & Ethics"
        description="Route protocols through IRB/IEC and track institutional clearances"
        icon={<ComplianceIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', path: '/researcher' },
          { label: 'Clinical Trials', path: '/researcher/clinical-trials' },
          { label: 'Approvals & Ethics' }
        ]}
        actionButton={
          <Button
            variant="contained"
            startIcon={<SubmitIcon />}
            onClick={() => router.push('/researcher/clinical-trials/approvals/submit')}
            sx={{ 
              bgcolor: 'white',
              color: '#8b6cbc',
              boxShadow: '0 4px 12px rgba(255, 255, 255, 0.3)',
              '&:hover': { 
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                boxShadow: '0 6px 16px rgba(255, 255, 255, 0.4)',
              }
            }}
          >
            Submit for IRB Review
          </Button>
        }
      />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Statistics Cards */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: 'wrap' }}>
          <Paper sx={{ 
            flex: '1 1 200px',
            p: 2, 
            borderRadius: 2,
            bgcolor: '#8b6cbc',
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
              <ComplianceIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.total}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              All IRB applications
            </Typography>
          </Paper>
          
          <Paper sx={{ 
            flex: '1 1 200px',
            p: 2, 
            borderRadius: 2,
            bgcolor: '#8b6cbc',
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
                IRB Approved
              </Typography>
              <ApprovedIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.approved}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Approved protocols
            </Typography>
          </Paper>
          
          <Paper sx={{ 
            flex: '1 1 200px',
            p: 2, 
            borderRadius: 2,
            bgcolor: '#8b6cbc',
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
                Under Review
              </Typography>
              <WarningIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.underReview}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Awaiting IRB decision
            </Typography>
          </Paper>
          
          <Paper sx={{ 
            flex: '1 1 200px',
            p: 2, 
            borderRadius: 2,
            bgcolor: '#8b6cbc',
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
                Draft
              </Typography>
              <EditIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.draft}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Pending submission
            </Typography>
          </Paper>
        </Box>

        {/* Search and Filter */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <TextField
            placeholder="Search by trial ID or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ 
              width: { xs: '100%', sm: 350 },
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#8b6cbc',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#8b6cbc',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#8b6cbc' }} />
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            sx={{ 
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: '#8b6cbc' },
                '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
              },
              '& .MuiInputLabel-root.Mui-focused': { color: '#8b6cbc' }
            }}
          >
            <MenuItem value="All">All Statuses</MenuItem>
            <MenuItem value="DRAFT">Draft</MenuItem>
            <MenuItem value="SUBMITTED_TO_IRB">Submitted to IRB</MenuItem>
            <MenuItem value="UNDER_IRB_REVIEW">Under IRB Review</MenuItem>
            <MenuItem value="IRB_APPROVED">IRB Approved</MenuItem>
            <MenuItem value="FULLY_APPROVED">Fully Approved</MenuItem>
          </TextField>
        </Box>

        {/* Applications Table */}
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            py: 8,
            bgcolor: 'white',
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.12)'
          }}>
            <CircularProgress sx={{ color: '#8b6cbc' }} />
            <Typography sx={{ mt: 2, color: '#718096' }}>Loading approvals...</Typography>
          </Box>
        ) : filteredApprovals.length === 0 ? (
          <Paper sx={{ 
            p: 6, 
            textAlign: 'center',
            bgcolor: 'rgba(139, 108, 188, 0.02)',
            border: '2px dashed rgba(139, 108, 188, 0.3)',
            borderRadius: 2
          }}>
            <ComplianceIcon sx={{ fontSize: 64, color: 'rgba(139, 108, 188, 0.3)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#2D3748', mb: 1 }}>
              No approval records found
            </Typography>
            <Typography variant="body2" sx={{ color: '#718096' }}>
              {searchQuery || statusFilter !== 'All' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Get started by submitting your first protocol for IRB review'}
            </Typography>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#2D3748' }}>Trial ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2D3748' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2D3748' }}>IRB Number</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2D3748' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2D3748' }}>Progress</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2D3748' }}>Submitted</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2D3748' }}>Approval Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2D3748' }}>Expiry</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#2D3748' }}>Actions</TableCell>
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
                            sx={{ 
                              flexGrow: 1, 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: '#e2e8f0',
                              '& .MuiLinearProgress-bar': { backgroundColor: '#8b6cbc' }
                            }}
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
          </Paper>
        )}

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
