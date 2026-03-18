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
  Menu,
  MenuItem,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  RateReview as ReviewIcon,
  Shield as EthicsIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Cancel as RejectedIcon,
  Warning as WarningIcon,
  Home as HomeIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  Article as ArticleIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';

const statusColors = {
  DRAFT: '#9e9e9e',
  SUBMITTED: '#2196f3',
  UNDER_REVIEW: '#ff9800',
  APPROVED: '#4caf50',
  CONDITIONAL_APPROVAL: '#8bc34a',
  REJECTED: '#f44336',
  REVISION_REQUESTED: '#ff5722',
  WITHDRAWN: '#607d8b',
  EXPIRED: '#795548',
};

const statusIcons = {
  DRAFT: <DescriptionIcon />,
  SUBMITTED: <PendingIcon />,
  UNDER_REVIEW: <WarningIcon />,
  APPROVED: <ApprovedIcon />,
  CONDITIONAL_APPROVAL: <ApprovedIcon />,
  REJECTED: <RejectedIcon />,
  REVISION_REQUESTED: <WarningIcon />,
  WITHDRAWN: <RejectedIcon />,
  EXPIRED: <WarningIcon />,
};

export default function InstitutionEthicsReviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ethics/applications');
      const data = await response.json();
      
      if (data.success) {
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Error fetching ethics applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, application) => {
    setMenuAnchor(event.currentTarget);
    setSelectedApplication(application);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedApplication(null);
  };

  const handleView = () => {
    router.push(`/institution/ethics/review/${selectedApplication.id}`);
    handleMenuClose();
  };

  const handleReview = () => {
    router.push(`/institution/ethics/review/${selectedApplication.id}/review`);
    handleMenuClose();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const filterApplicationsByTab = (apps) => {
    switch (activeTab) {
      case 0: // Pending Review
        return apps.filter(a => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW');
      case 1: // Approved
        return apps.filter(a => a.status === 'APPROVED' || a.status === 'CONDITIONAL_APPROVAL');
      case 2: // Revision Requested
        return apps.filter(a => a.status === 'REVISION_REQUESTED');
      case 3: // Rejected
        return apps.filter(a => a.status === 'REJECTED');
      case 4: // All
        return apps;
      default:
        return apps;
    }
  };

  const filteredApplications = filterApplicationsByTab(applications).filter(app => 
    app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.principalInvestigator.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (app.referenceNumber && app.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats = {
    pending: applications.filter(a => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length,
    approved: applications.filter(a => a.status === 'APPROVED' || a.status === 'CONDITIONAL_APPROVAL').length,
    revisionRequested: applications.filter(a => a.status === 'REVISION_REQUESTED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length,
    total: applications.length,
  };

  return (
    <Box>
      <PageHeader
        title="Ethics Review"
        description="Review and manage ethics applications submitted by researchers"
        icon={<EthicsIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
          { label: 'Ethics', path: '/institution/ethics' }
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
              <PendingIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.pending}
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
                Approved
              </Typography>
              <ApprovedIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.approved}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Approved applications
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
                Revision Requested
              </Typography>
              <WarningIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.revisionRequested}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Needs revision
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
                Total Applications
              </Typography>
              <GroupsIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.total}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              All applications
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
                <Badge badgeContent={stats.pending} color="warning" sx={{ '& .MuiBadge-badge': { bgcolor: '#ff9800' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: stats.pending > 0 ? 2 : 0 }}>
                    <PendingIcon fontSize="small" />
                    Pending Review
                  </Box>
                </Badge>
              }
            />
            <Tab 
              label={
                <Badge badgeContent={stats.approved} color="success">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: stats.approved > 0 ? 2 : 0 }}>
                    <ApprovedIcon fontSize="small" />
                    Approved
                  </Box>
                </Badge>
              }
            />
            <Tab 
              label={
                <Badge badgeContent={stats.revisionRequested} sx={{ '& .MuiBadge-badge': { bgcolor: '#ff5722' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: stats.revisionRequested > 0 ? 2 : 0 }}>
                    <WarningIcon fontSize="small" />
                    Revision Requested
                  </Box>
                </Badge>
              }
            />
            <Tab 
              label={
                <Badge badgeContent={stats.rejected} color="error">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: stats.rejected > 0 ? 2 : 0 }}>
                    <RejectedIcon fontSize="small" />
                    Rejected
                  </Box>
                </Badge>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon fontSize="small" />
                  All Applications
                </Box>
              }
            />
          </Tabs>

          <Box sx={{ p: 2 }}>
            <TextField
              placeholder="Search by title, investigator, or reference number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <Typography sx={{ mt: 2, color: '#718096' }}>Loading applications...</Typography>
          </Box>
        ) : filteredApplications.length === 0 ? (
          <Paper sx={{ 
            p: 6, 
            textAlign: 'center',
            bgcolor: 'rgba(139, 108, 188, 0.02)',
            border: '2px dashed rgba(139, 108, 188, 0.3)',
            borderRadius: 2
          }}>
            <EthicsIcon sx={{ fontSize: 64, color: '#8b6cbc', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#2D3748', mb: 1, fontWeight: 600 }}>
              No Applications Found
            </Typography>
            <Typography variant="body2" sx={{ color: '#718096' }}>
              {searchQuery ? 'Try adjusting your search criteria' : 'No applications in this category'}
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
                  <TableCell>Reference</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Principal Investigator</TableCell>
                  <TableCell>Research Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow 
                    key={application.id} 
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
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#8b6cbc' }}>
                      {application.referenceNumber || '-'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#2D3748' }}>
                      {application.title}
                    </TableCell>
                    <TableCell sx={{ color: '#4A5568' }}>
                      {application.principalInvestigator}
                    </TableCell>
                    <TableCell sx={{ color: '#4A5568' }}>
                      {application.researchType}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={statusIcons[application.status]}
                        label={application.status.replace(/_/g, ' ')}
                        size="small"
                        sx={{
                          bgcolor: statusColors[application.status],
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 24,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#4A5568' }}>
                      {application.submittedDate
                        ? format(new Date(application.submittedDate), 'MMM dd, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, application)}
                        sx={{
                          color: '#8b6cbc',
                          '&:hover': {
                            bgcolor: 'rgba(139, 108, 188, 0.1)',
                          }
                        }}
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

        {/* Action Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              borderRadius: 2,
              mt: 1,
              minWidth: 200,
            }
          }}
        >
          <MenuItem 
            onClick={handleView}
            sx={{
              py: 1.5,
              '&:hover': {
                bgcolor: 'rgba(139, 108, 188, 0.08)',
              }
            }}
          >
            <ViewIcon sx={{ mr: 1.5, color: '#8b6cbc' }} fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>View Details</Typography>
          </MenuItem>
          {(selectedApplication?.status === 'SUBMITTED' || selectedApplication?.status === 'UNDER_REVIEW') && (
            <MenuItem 
              onClick={handleReview}
              sx={{
                py: 1.5,
                '&:hover': {
                  bgcolor: 'rgba(76, 175, 80, 0.08)',
                }
              }}
            >
              <ReviewIcon sx={{ mr: 1.5, color: '#4caf50' }} fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Review Application</Typography>
            </MenuItem>
          )}
        </Menu>
      </Container>
    </Box>
  );
}
