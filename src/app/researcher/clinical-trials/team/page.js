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
  Avatar,
  AvatarGroup,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Badge,
  Paper,
  FormControl,
  InputLabel,
  Select,
  Stack,
  TablePagination,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SupervisedUserCircle as TeamIcon,
  VerifiedUser as CertifiedIcon,
  Warning as WarningIcon,
  CheckCircle as ApprovedIcon,
  Assignment as DelegationIcon,
  School as TrainingIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';

const roleColors = {
  PRINCIPAL_INVESTIGATOR: '#8b6cbc',
  CO_INVESTIGATOR: '#2196f3',
  STUDY_COORDINATOR: '#ff9800',
  RESEARCH_NURSE: '#4caf50',
  DATA_MANAGER: '#00bcd4',
  REGULATORY_SPECIALIST: '#f44336',
};

export default function TeamDelegationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [certificationFilter, setCertificationFilter] = useState('All Certifications');
  const [sortBy, setSortBy] = useState('Recent');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [stats, setStats] = useState({
    total: 0,
    certified: 0,
    withDelegation: 0,
    expiring: 0
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const mockTeamMembers = [
        {
          id: 1,
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@hospital.org',
          role: 'PRINCIPAL_INVESTIGATOR',
          trialId: 'CT-2024-001',
          trialTitle: 'Phase III Trial of Novel Antimalarial Drug',
          gcpCertified: true,
          certificationExpiry: new Date('2025-06-15'),
          delegationLog: true,
          assignedDate: new Date('2024-01-10'),
        },
        {
          id: 2,
          name: 'Dr. Michael Omondi',
          email: 'michael.omondi@hospital.org',
          role: 'CO_INVESTIGATOR',
          trialId: 'CT-2024-001',
          trialTitle: 'Phase III Trial of Novel Antimalarial Drug',
          gcpCertified: true,
          certificationExpiry: new Date('2024-12-20'),
          delegationLog: true,
          assignedDate: new Date('2024-01-15'),
        },
        {
          id: 3,
          name: 'Jane Wanjiru',
          email: 'jane.wanjiru@hospital.org',
          role: 'STUDY_COORDINATOR',
          trialId: 'CT-2024-002',
          trialTitle: 'Observational Study on HIV Treatment Adherence',
          gcpCertified: false,
          certificationExpiry: null,
          delegationLog: false,
          assignedDate: new Date('2024-02-01'),
        },
        {
          id: 4,
          name: 'Mary Kamau',
          email: 'mary.kamau@hospital.org',
          role: 'RESEARCH_NURSE',
          trialId: 'CT-2024-001',
          trialTitle: 'Phase III Trial of Novel Antimalarial Drug',
          gcpCertified: true,
          certificationExpiry: new Date('2025-03-10'),
          delegationLog: true,
          assignedDate: new Date('2024-01-20'),
        },
      ];
      setTeamMembers(mockTeamMembers);
      
      // Calculate statistics
      const total = mockTeamMembers.length;
      const certified = mockTeamMembers.filter(m => m.gcpCertified).length;
      const withDelegation = mockTeamMembers.filter(m => m.delegationLog).length;
      const expiring = mockTeamMembers.filter(m => 
        isCertificationExpiring(m.certificationExpiry) || isCertificationExpired(m.certificationExpiry)
      ).length;
      
      setStats({ total, certified, withDelegation, expiring });
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, member) => {
    setMenuAnchor(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedMember(null);
  };

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.trialId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || member.role === roleFilter;
    const matchesCertification = certificationFilter === 'All Certifications' || 
      (certificationFilter === 'CERTIFIED' && member.gcpCertified) ||
      (certificationFilter === 'NOT_CERTIFIED' && !member.gcpCertified) ||
      (certificationFilter === 'EXPIRING' && isCertificationExpiring(member.certificationExpiry));
    return matchesSearch && matchesRole && matchesCertification;
  });
  
  // Paginated members
  const paginatedMembers = filteredMembers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/researcher' },
    { label: 'Clinical Trials', href: '/researcher/clinical-trials' },
    { label: 'Study Team & Site Setup' },
  ];

  const isCertificationExpiring = (expiryDate) => {
    if (!expiryDate) return false;
    const daysUntilExpiry = Math.floor((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  };

  const isCertificationExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Study Team & Site Setup"
          description="Manage delegation of authority and verify GCP credentials"
          icon={<PersonIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={breadcrumbs}
          actionButton={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/researcher/clinical-trials/team/add')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'none',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.25)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                }
              }}
            >
              Add Team Member
            </Button>
          }
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 6, backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 300px)' }}>

        {/* Statistics Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
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
                  Total Team Members
                </Typography>
                <TeamIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.total}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                All team members
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
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
                  GCP Certified
                </Typography>
                <CertifiedIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.certified}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                With valid GCP certification
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
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
                  With Delegation
                </Typography>
                <DelegationIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.withDelegation}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Complete delegation logs
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
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
                  Expiring Soon
                </Typography>
                <WarningIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.expiring}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Certifications expiring
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Paper sx={{ 
          p: 4, 
          mb: 5, 
          borderRadius: 4, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            alignItems: 'center',
            flexWrap: 'wrap',
            '@media (max-width: 768px)': {
              flexDirection: 'column',
              alignItems: 'stretch'
            }
          }}>
            <Box sx={{ flex: '2 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                placeholder="Search team members by name, email, or trial ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchQuery('')} size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)'
                    }
                  }
                }}
              />
            </Box>

            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                  sx={{ 
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)'
                    }
                  }}
                >
                  <MenuItem value="All Roles">All Roles</MenuItem>
                  <MenuItem value="PRINCIPAL_INVESTIGATOR">Principal Investigator</MenuItem>
                  <MenuItem value="CO_INVESTIGATOR">Co-Investigator</MenuItem>
                  <MenuItem value="STUDY_COORDINATOR">Study Coordinator</MenuItem>
                  <MenuItem value="RESEARCH_NURSE">Research Nurse</MenuItem>
                  <MenuItem value="DATA_MANAGER">Data Manager</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Certification</InputLabel>
                <Select
                  value={certificationFilter}
                  label="Certification"
                  onChange={(e) => setCertificationFilter(e.target.value)}
                  sx={{ 
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)'
                    }
                  }}
                >
                  <MenuItem value="All Certifications">All Certifications</MenuItem>
                  <MenuItem value="CERTIFIED">Certified</MenuItem>
                  <MenuItem value="NOT_CERTIFIED">Not Certified</MenuItem>
                  <MenuItem value="EXPIRING">Expiring Soon</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{ 
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)'
                    }
                  }}
                >
                  <MenuItem value="Recent">Recent</MenuItem>
                  <MenuItem value="Name">Name</MenuItem>
                  <MenuItem value="Role">Role</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '0 0 auto' }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('All Roles');
                  setCertificationFilter('All Certifications');
                  setSortBy('Recent');
                }}
                sx={{ 
                  borderRadius: 3,
                  height: '56px',
                  px: 3,
                  borderColor: '#e0e0e0',
                  color: '#667eea',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.08)',
                    color: '#5a67d8',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
                  }
                }}
              >
                Clear All
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Team Members Table */}
        {loading ? (
          <Paper sx={{ 
            p: 8, 
            textAlign: 'center', 
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
          }}>
            <TeamIcon sx={{ fontSize: 64, color: '#ddd', mb: 3 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#666' }}>
              Loading team members...
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Please wait while we fetch your team members
            </Typography>
            <Box sx={{ width: 200, mx: 'auto' }}>
              <LinearProgress sx={{ 
                height: 4, 
                borderRadius: 2,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#667eea'
                }
              }} />
            </Box>
          </Paper>
        ) : filteredMembers.length === 0 ? (
          <Paper sx={{ 
            p: 8, 
            textAlign: 'center', 
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.04)'
          }}>
            <Box sx={{ 
              width: 120, 
              height: 120, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #764ba2 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              opacity: 0.1
            }}>
              <TeamIcon sx={{ fontSize: 48, color: 'white' }} />
            </Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#2c3e50' }}>
              No team members found
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto', lineHeight: 1.6 }}>
              {searchQuery || roleFilter !== 'All Roles' 
                ? 'Try adjusting your search criteria or clear all filters to see more results'
                : 'Add your first team member to get started'
              }
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => router.push('/researcher/clinical-trials/team/add')}
              sx={{
                background: 'linear-gradient(135deg, #764ba2 0%, #764ba2 100%)',
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)'
                }
              }}
            >
              Add Team Member
            </Button>
          </Paper>
        ) : (
          <Paper sx={{ 
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Trial</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>GCP Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Certification Expiry</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Delegation</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Assigned</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem', textAlign: 'center' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedMembers.map((member) => (
                    <TableRow 
                      key={member.id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(139, 108, 188, 0.04)'
                        },
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ 
                            width: 32, 
                            height: 32, 
                            backgroundColor: '#8b6cbc',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                            {member.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {member.email}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          label={member.role.replace(/_/g, ' ')}
                          size="small"
                          sx={{
                            backgroundColor: roleColors[member.role],
                            color: 'white',
                            fontWeight: 500,
                            fontSize: '0.7rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Stack direction="column" spacing={0.5}>
                          <Typography variant="body2" sx={{ color: '#8b6cbc', fontWeight: 600, fontSize: '0.8rem' }}>
                            {member.trialId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {member.trialTitle}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {member.gcpCertified ? (
                          <Chip
                            icon={<CertifiedIcon />}
                            label="Certified"
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(76, 175, 80, 0.1)',
                              color: '#4caf50',
                              fontWeight: 500,
                              '& .MuiChip-icon': {
                                color: '#4caf50'
                              }
                            }}
                          />
                        ) : (
                          <Chip
                            icon={<WarningIcon />}
                            label="Not Certified"
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(244, 67, 54, 0.1)',
                              color: '#f44336',
                              fontWeight: 500,
                              '& .MuiChip-icon': {
                                color: '#f44336'
                              }
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {member.certificationExpiry ? (
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '0.8rem',
                                color: isCertificationExpired(member.certificationExpiry)
                                  ? 'error.main'
                                  : isCertificationExpiring(member.certificationExpiry)
                                  ? 'warning.main'
                                  : 'text.primary',
                                fontWeight: 500
                              }}
                            >
                              {format(member.certificationExpiry, 'MMM dd, yyyy')}
                            </Typography>
                            {isCertificationExpiring(member.certificationExpiry) && (
                              <Chip 
                                label="Expiring Soon" 
                                size="small" 
                                sx={{ 
                                  mt: 0.5,
                                  height: 18,
                                  fontSize: '0.65rem',
                                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                                  color: '#ff9800'
                                }} 
                              />
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {member.delegationLog ? (
                          <Chip
                            icon={<DelegationIcon />}
                            label="Complete"
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(76, 175, 80, 0.1)',
                              color: '#4caf50',
                              fontWeight: 500,
                              '& .MuiChip-icon': {
                                color: '#4caf50'
                              }
                            }}
                          />
                        ) : (
                          <Chip
                            label="Pending"
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(255, 152, 0, 0.1)',
                              color: '#ff9800',
                              fontWeight: 500
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#2c3e50' }}>
                            {format(member.assignedDate, 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="View Profile">
                            <IconButton
                              size="small"
                              onClick={() => router.push(`/researcher/clinical-trials/team/view/${member.id}`)}
                              sx={{ 
                                color: '#8b6cbc',
                                '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.08)' }
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="More">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, member)}
                              sx={{ 
                                color: '#8b6cbc',
                                '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.08)' }
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredMembers.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{
                borderTop: '1px solid rgba(0,0,0,0.06)',
                '.MuiTablePagination-toolbar': {
                  backgroundColor: '#f8f9fa'
                }
              }}
            />
          </Paper>
        )}

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <ViewIcon sx={{ mr: 1 }} /> View Profile
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <EditIcon sx={{ mr: 1 }} /> Edit Details
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <DelegationIcon sx={{ mr: 1 }} /> Manage Delegation Log
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <TrainingIcon sx={{ mr: 1 }} /> View Certifications
          </MenuItem>
          <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} /> Remove from Team
          </MenuItem>
        </Menu>
      </Container>
    </>
  );
}
