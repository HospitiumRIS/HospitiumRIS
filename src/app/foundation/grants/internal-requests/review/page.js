'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Avatar,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  RateReview as ReviewIcon,
  Visibility as ViewIcon,
  Home as HomeIcon,
  Assessment as AssessmentIcon,
  HourglassEmpty as HourglassIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Description as DescriptionIcon,
  Inbox as InboxIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '@/components/common/PageHeader';

const STAGE_LABELS = {
  intake: 'Intake',
  initial_review: 'Initial Review',
  committee_review: 'Committee Review',
  final_decision: 'Final Decision',
};

const STAGE_ORDER = ['intake', 'initial_review', 'committee_review', 'final_decision'];

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'default', icon: <DescriptionIcon sx={{ fontSize: 14 }} /> },
  submitted: { label: 'Submitted', color: 'info', icon: <InboxIcon sx={{ fontSize: 14 }} /> },
  under_review: { label: 'Under Review', color: 'warning', icon: <HourglassIcon sx={{ fontSize: 14 }} /> },
  approved: { label: 'Approved', color: 'success', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
  rejected: { label: 'Rejected', color: 'error', icon: <CancelIcon sx={{ fontSize: 14 }} /> },
  revision_requested: { label: 'Revision Requested', color: 'warning', icon: <WarningIcon sx={{ fontSize: 14 }} /> },
};

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

const stageIdx = (s) => STAGE_ORDER.indexOf(s);

export default function InternalGrantReviewPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/foundation/internal-grants');
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const filterRequestsByTab = (reqs) => {
    switch (activeTab) {
      case 0: // Intake
        return reqs.filter(r => r.stage === 'intake' && ['submitted', 'under_review'].includes(r.status));
      case 1: // Initial Review
        return reqs.filter(r => r.stage === 'initial_review' && ['submitted', 'under_review'].includes(r.status));
      case 2: // Committee Review
        return reqs.filter(r => r.stage === 'committee_review' && ['submitted', 'under_review'].includes(r.status));
      case 3: // Final Decision
        return reqs.filter(r => r.stage === 'final_decision' && ['submitted', 'under_review'].includes(r.status));
      case 4: // All Pending
        return reqs.filter(r => ['submitted', 'under_review'].includes(r.status));
      default:
        return reqs;
    }
  };

  const filteredRequests = filterRequestsByTab(requests).filter(r => {
    const q = searchTerm.toLowerCase();
    return !q ||
      r.title?.toLowerCase().includes(q) ||
      r.applicantName?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q) ||
      r.purpose?.toLowerCase().includes(q);
  });

  const tabCounts = {
    intake: requests.filter(r => r.stage === 'intake' && ['submitted', 'under_review'].includes(r.status)).length,
    initial_review: requests.filter(r => r.stage === 'initial_review' && ['submitted', 'under_review'].includes(r.status)).length,
    committee_review: requests.filter(r => r.stage === 'committee_review' && ['submitted', 'under_review'].includes(r.status)).length,
    final_decision: requests.filter(r => r.stage === 'final_decision' && ['submitted', 'under_review'].includes(r.status)).length,
    all: requests.filter(r => ['submitted', 'under_review'].includes(r.status)).length,
  };

  return (
    <Box>
      <PageHeader
        title="Review Internal Grant Requests"
        description="Review and evaluate funding requests across different stages of the approval workflow"
        icon={<ReviewIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/foundation' },
          { label: 'Grants', path: '/foundation/grants' },
          { label: 'Internal Requests', path: '/foundation/grants/internal-requests' },
        ]}
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
                Pending Review
              </Typography>
              <HourglassIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {tabCounts.all}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Awaiting review
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
                At Intake
              </Typography>
              <InboxIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {tabCounts.intake}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Initial stage
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
                In Committee
              </Typography>
              <AssessmentIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {tabCounts.committee_review}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Committee review
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
                Final Decision
              </Typography>
              <CheckCircleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {tabCounts.final_decision}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Awaiting decision
            </Typography>
          </Paper>
        </Box>

        {/* Tabs and Search */}
        <Paper sx={{ 
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          mb: 3
        }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: '#718096',
                '&.Mui-selected': {
                  color: '#8b6cbc',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#8b6cbc',
                height: 3,
              },
            }}
          >
            <Tab 
              label={
                <Badge badgeContent={tabCounts.intake} sx={{ '& .MuiBadge-badge': { bgcolor: '#8b6cbc' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: tabCounts.intake > 0 ? 2 : 0 }}>
                    <InboxIcon fontSize="small" />
                    Intake
                  </Box>
                </Badge>
              }
            />
            <Tab 
              label={
                <Badge badgeContent={tabCounts.initial_review} sx={{ '& .MuiBadge-badge': { bgcolor: '#8b6cbc' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: tabCounts.initial_review > 0 ? 2 : 0 }}>
                    <ReviewIcon fontSize="small" />
                    Initial Review
                  </Box>
                </Badge>
              }
            />
            <Tab 
              label={
                <Badge badgeContent={tabCounts.committee_review} sx={{ '& .MuiBadge-badge': { bgcolor: '#8b6cbc' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: tabCounts.committee_review > 0 ? 2 : 0 }}>
                    <AssessmentIcon fontSize="small" />
                    Committee Review
                  </Box>
                </Badge>
              }
            />
            <Tab 
              label={
                <Badge badgeContent={tabCounts.final_decision} sx={{ '& .MuiBadge-badge': { bgcolor: '#8b6cbc' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: tabCounts.final_decision > 0 ? 2 : 0 }}>
                    <CheckCircleIcon fontSize="small" />
                    Final Decision
                  </Box>
                </Badge>
              }
            />
            <Tab 
              label={
                <Badge badgeContent={tabCounts.all} sx={{ '& .MuiBadge-badge': { bgcolor: '#8b6cbc' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: tabCounts.all > 0 ? 2 : 0 }}>
                    <AssignmentIcon fontSize="small" />
                    All Pending
                  </Box>
                </Badge>
              }
            />
          </Tabs>

          <Box sx={{ p: 2 }}>
            <TextField
              placeholder="Search by title, applicant, department, or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              fullWidth
              sx={{ 
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
          </Box>
        </Paper>

        {/* Requests Table */}
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
            <Typography sx={{ mt: 2, color: '#718096' }}>Loading requests...</Typography>
          </Box>
        ) : filteredRequests.length === 0 ? (
          <Paper sx={{ 
            p: 6, 
            textAlign: 'center',
            bgcolor: 'rgba(139, 108, 188, 0.02)',
            border: '2px dashed rgba(139, 108, 188, 0.3)',
            borderRadius: 2
          }}>
            <ReviewIcon sx={{ fontSize: 64, color: '#8b6cbc', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#2D3748', mb: 1, fontWeight: 600 }}>
              No Requests Found
            </Typography>
            <Typography variant="body2" sx={{ color: '#718096' }}>
              {searchTerm ? 'Try adjusting your search criteria' : 'No requests in this stage'}
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ 
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  bgcolor: 'rgba(139, 108, 188, 0.08)',
                  '& .MuiTableCell-head': {
                    color: '#2D3748',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }
                }}>
                  <TableCell>Request</TableCell>
                  <TableCell>Applicant</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Stage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => {
                  const statusCfg = STATUS_CONFIG[request.status] || STATUS_CONFIG.draft;
                  return (
                    <TableRow 
                      key={request.id} 
                      hover
                      sx={{
                        '&:hover': {
                          bgcolor: 'rgba(139, 108, 188, 0.04)',
                        },
                        '& .MuiTableCell-root': {
                          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                        }
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.3 }}>
                            {request.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.purpose} · {request.department}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 30, height: 30, bgcolor: 'rgba(139, 108, 188, 0.15)', color: '#8b6cbc', fontSize: 12 }}>
                            {request.applicantName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {request.applicantName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {request.applicantTitle || request.applicantEmail}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {fmt(request.requestedAmount)}
                          </Typography>
                          {request.approvedAmount && (
                            <Typography variant="caption" color="success.main">
                              Approved: {fmt(request.approvedAmount)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={((stageIdx(request.stage) + 1) / STAGE_ORDER.length) * 100}
                            sx={{ 
                              width: 60, 
                              height: 5, 
                              borderRadius: 3, 
                              bgcolor: 'rgba(139, 108, 188, 0.15)', 
                              '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc' } 
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                            {STAGE_LABELS[request.stage]}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={statusCfg.label}
                          color={statusCfg.color}
                          icon={statusCfg.icon}
                          sx={{ fontWeight: 600, '& .MuiChip-icon': { ml: 0.5 } }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {request.submittedAt ? fmtDate(request.submittedAt) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              onClick={() => router.push(`/foundation/grants/internal-requests/review/${request.id}`)}
                              sx={{ color: '#8b6cbc' }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Submit Review">
                            <IconButton 
                              size="small" 
                              onClick={() => router.push(`/foundation/grants/internal-requests/review/${request.id}/submit`)}
                              sx={{ color: '#4caf50' }}
                            >
                              <ReviewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </Box>
  );
}
