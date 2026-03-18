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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SubmitIcon,
  Shield as EthicsIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Cancel as RejectedIcon,
  Warning as WarningIcon,
  Groups as GroupsIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
  Article as ArticleIcon,
  Home as HomeIcon,
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
  DRAFT: <EditIcon />,
  SUBMITTED: <SubmitIcon />,
  UNDER_REVIEW: <WarningIcon />,
  APPROVED: <ApprovedIcon />,
  CONDITIONAL_APPROVAL: <ApprovedIcon />,
  REJECTED: <RejectedIcon />,
  REVISION_REQUESTED: <WarningIcon />,
  WITHDRAWN: <RejectedIcon />,
  EXPIRED: <WarningIcon />,
};

export default function EthicsApplicationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
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
    router.push(`/researcher/ethics/applications/view/${selectedApplication.id}`);
    handleMenuClose();
  };

  const handleEdit = () => {
    router.push(`/researcher/ethics/applications/edit/${selectedApplication.id}`);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this ethics application?')) {
      try {
        const response = await fetch(`/api/ethics/applications/${selectedApplication.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          fetchApplications();
        }
      } catch (error) {
        console.error('Error deleting application:', error);
      }
    }
    handleMenuClose();
  };

  const handleSubmit = async () => {
    if (confirm('Are you sure you want to submit this ethics application for review?')) {
      try {
        const response = await fetch(`/api/ethics/applications/${selectedApplication.id}/submit`, {
          method: 'POST',
        });
        
        if (response.ok) {
          fetchApplications();
        }
      } catch (error) {
        console.error('Error submitting application:', error);
      }
    }
    handleMenuClose();
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.principalInvestigator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: applications.length,
    draft: applications.filter(a => a.status === 'DRAFT').length,
    submitted: applications.filter(a => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length,
    approved: applications.filter(a => a.status === 'APPROVED' || a.status === 'CONDITIONAL_APPROVAL').length,
  };

  return (
    <Box>
      {/* Page Header */}
      <PageHeader
        title="Ethics Applications"
        description="Manage your research ethics applications and track approval status"
        icon={<EthicsIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' },
          { label: 'Ethics', path: '/researcher/ethics' }
        ]}
        actionButton={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/researcher/ethics/applications/create')}
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
            New Application
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
              <GroupsIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.total}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              All ethics applications
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
                Draft Applications
              </Typography>
              <DescriptionIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.draft}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Work in progress
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
              <AssessmentIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.submitted}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Submitted for review
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
              <ArticleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.approved}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Approved applications
            </Typography>
          </Paper>
        </Box>

      {/* Actions Bar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <TextField
          placeholder="Search by title or investigator..."
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
        
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => {}}
          sx={{
            borderColor: '#8b6cbc',
            color: '#8b6cbc',
            '&:hover': {
              borderColor: '#7a5caa',
              bgcolor: 'rgba(139, 108, 188, 0.04)',
            },
          }}
        >
          Filter: {statusFilter}
        </Button>
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
            No Ethics Applications Found
          </Typography>
          <Typography variant="body2" sx={{ color: '#718096', mb: 3 }}>
            {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first ethics application'}
          </Typography>
          {!searchQuery && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/researcher/ethics/applications/create')}
              sx={{ 
                background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
                boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)',
              }}
            >
              Create New Application
            </Button>
          )}
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
                <TableCell>Title</TableCell>
                <TableCell>Principal Investigator</TableCell>
                <TableCell>Research Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reference Number</TableCell>
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
                  <TableCell sx={{ color: '#4A5568', fontFamily: 'monospace' }}>
                    {application.referenceNumber || '-'}
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
        {selectedApplication?.status === 'DRAFT' && (
          <>
            <MenuItem 
              onClick={handleEdit}
              sx={{
                py: 1.5,
                '&:hover': {
                  bgcolor: 'rgba(139, 108, 188, 0.08)',
                }
              }}
            >
              <EditIcon sx={{ mr: 1.5, color: '#3b82f6' }} fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Edit Application</Typography>
            </MenuItem>
            <MenuItem 
              onClick={handleSubmit}
              sx={{
                py: 1.5,
                '&:hover': {
                  bgcolor: 'rgba(16, 185, 129, 0.08)',
                }
              }}
            >
              <SubmitIcon sx={{ mr: 1.5, color: '#10b981' }} fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Submit for Review</Typography>
            </MenuItem>
            <MenuItem 
              onClick={handleDelete}
              sx={{
                py: 1.5,
                '&:hover': {
                  bgcolor: 'rgba(239, 68, 68, 0.08)',
                }
              }}
            >
              <DeleteIcon sx={{ mr: 1.5, color: '#ef4444' }} fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#ef4444' }}>Delete</Typography>
            </MenuItem>
          </>
        )}
        {selectedApplication?.status === 'REVISION_REQUESTED' && (
          <>
            <MenuItem 
              onClick={handleEdit}
              sx={{
                py: 1.5,
                '&:hover': {
                  bgcolor: 'rgba(139, 108, 188, 0.08)',
                }
              }}
            >
              <EditIcon sx={{ mr: 1.5, color: '#ff5722' }} fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Edit & Resubmit</Typography>
            </MenuItem>
          </>
        )}
      </Menu>
      </Container>
    </Box>
  );
}
