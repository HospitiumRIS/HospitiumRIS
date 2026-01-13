'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Stack,
  Button,
  Card,
  CardContent,
  alpha,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  Science as ScienceIcon,
  Article as ArticleIcon,
  Description as ManuscriptIcon,
  FormatQuote as CitationIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Verified as VerifiedIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const ManageResearchers = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [researchers, setResearchers] = useState([]);
  const [filteredResearchers, setFilteredResearchers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedResearcher, setSelectedResearcher] = useState(null);

  useEffect(() => {
    fetchResearchers();
  }, []);

  useEffect(() => {
    filterResearchers();
  }, [searchTerm, researchers]);

  const fetchResearchers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/institution/researchers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch researchers');
      }

      const data = await response.json();
      setResearchers(data.researchers || []);
      setFilteredResearchers(data.researchers || []);
    } catch (err) {
      console.error('Error fetching researchers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterResearchers = () => {
    if (!searchTerm.trim()) {
      setFilteredResearchers(researchers);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = researchers.filter(researcher => {
      const fullName = `${researcher.givenName || ''} ${researcher.familyName || ''}`.toLowerCase();
      const email = (researcher.email || '').toLowerCase();
      const department = (researcher.researchProfile?.department || '').toLowerCase();
      const institution = (researcher.primaryInstitution || '').toLowerCase();
      
      return fullName.includes(term) || 
             email.includes(term) || 
             department.includes(term) ||
             institution.includes(term);
    });

    setFilteredResearchers(filtered);
  };

  const handleMenuOpen = (event, researcher) => {
    setAnchorEl(event.currentTarget);
    setSelectedResearcher(researcher);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedResearcher(null);
  };

  const handleViewProfile = (researcherId) => {
    handleMenuClose();
    router.push(`/institution/researcher/${researcherId}`);
  };

  const getInitials = (researcher) => {
    const first = researcher.givenName?.[0] || '';
    const last = researcher.familyName?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

  const getFullName = (researcher) => {
    const title = researcher.researchProfile?.academicTitle;
    const name = `${researcher.givenName || ''} ${researcher.familyName || ''}`.trim();
    return title ? `${title} ${name}` : name;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Manage Researchers"
          description="Add, edit, and manage researchers"
          icon={<GroupIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Administration', path: '/institution' },
            { label: 'Manage Researchers' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress size={60} sx={{ color: '#8b6cbc' }} />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Manage Researchers"
          description="Add, edit, and manage researchers"
          icon={<GroupIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Administration', path: '/institution' },
            { label: 'Manage Researchers' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="error" gutterBottom>
              Error Loading Researchers
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={fetchResearchers}
              sx={{
                bgcolor: '#8b6cbc',
                '&:hover': { bgcolor: '#7a5caa' }
              }}
            >
              Retry
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
      <PageHeader
        title="Manage Researchers"
        description="Add, edit, and manage researchers"
        icon={<GroupIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Institution', path: '/institution' },
          { label: 'Administration', path: '/institution' },
          { label: 'Manage Researchers' }
        ]}
        gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 0.5 }}>
                    {researchers.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Total Researchers
                  </Typography>
                </Box>
                <GroupIcon sx={{ fontSize: 40, color: alpha('#8b6cbc', 0.2) }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d8659', mb: 0.5 }}>
                    {researchers.reduce((sum, r) => sum + (r.stats?.totalManuscripts || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Total Manuscripts
                  </Typography>
                </Box>
                <ManuscriptIcon sx={{ fontSize: 40, color: alpha('#2d8659', 0.2) }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#d97706', mb: 0.5 }}>
                    {researchers.reduce((sum, r) => sum + (r.stats?.totalPublications || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Total Publications
                  </Typography>
                </Box>
                <ArticleIcon sx={{ fontSize: 40, color: alpha('#d97706', 0.2) }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563eb', mb: 0.5 }}>
                    {researchers.reduce((sum, r) => sum + (r.stats?.totalCitations || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Total Citations
                  </Typography>
                </Box>
                <CitationIcon sx={{ fontSize: 40, color: alpha('#2563eb', 0.2) }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Search and Actions */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search researchers by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 1, minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#9ca3af' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              sx={{
                borderColor: '#e5e7eb',
                color: '#6b7280',
                '&:hover': {
                  borderColor: '#8b6cbc',
                  backgroundColor: alpha('#8b6cbc', 0.05)
                }
              }}
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              sx={{
                borderColor: '#e5e7eb',
                color: '#6b7280',
                '&:hover': {
                  borderColor: '#8b6cbc',
                  backgroundColor: alpha('#8b6cbc', 0.05)
                }
              }}
            >
              Export
            </Button>
          </Box>
        </Paper>

        {/* Researchers Table */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {filteredResearchers.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <GroupIcon sx={{ fontSize: 64, color: '#e5e7eb', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#6b7280', mb: 1 }}>
                {searchTerm ? 'No researchers found' : 'No researchers yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'Researchers will appear here once they register'
                }
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>
                      Researcher
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>
                      Department
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2, textAlign: 'center' }}>
                      Manuscripts
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2, textAlign: 'center' }}>
                      Publications
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2, textAlign: 'center' }}>
                      Citations
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2, textAlign: 'center' }}>
                      H-Index
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2, textAlign: 'center' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredResearchers.map((researcher) => (
                    <TableRow
                      key={researcher.id}
                      sx={{
                        '&:hover': { backgroundColor: '#f9fafb' },
                        cursor: 'pointer',
                        '& td': { borderBottom: '1px solid #f3f4f6' }
                      }}
                      onClick={() => handleViewProfile(researcher.id)}
                    >
                      <TableCell sx={{ py: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: '#8b6cbc',
                              fontSize: '0.875rem',
                              fontWeight: 600
                            }}
                          >
                            {getInitials(researcher)}
                          </Avatar>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                                {getFullName(researcher)}
                              </Typography>
                              {researcher.orcidId && (
                                <Tooltip title="ORCID Verified">
                                  <VerifiedIcon sx={{ fontSize: 16, color: '#a6ce39' }} />
                                </Tooltip>
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                              {researcher.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2.5 }}>
                        <Typography variant="body2" sx={{ color: '#374151' }}>
                          {researcher.researchProfile?.department || researcher.primaryInstitution || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2.5, textAlign: 'center' }}>
                        <Chip
                          label={researcher.stats?.totalManuscripts || 0}
                          size="small"
                          sx={{
                            backgroundColor: alpha('#2d8659', 0.1),
                            color: '#2d8659',
                            fontWeight: 600,
                            minWidth: 40
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2.5, textAlign: 'center' }}>
                        <Chip
                          label={researcher.stats?.totalPublications || 0}
                          size="small"
                          sx={{
                            backgroundColor: alpha('#d97706', 0.1),
                            color: '#d97706',
                            fontWeight: 600,
                            minWidth: 40
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2.5, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563eb' }}>
                          {researcher.stats?.totalCitations || 0}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2.5, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#7c3aed' }}>
                          {researcher.stats?.hIndex || 0}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2.5, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, researcher)}
                          sx={{ color: '#6b7280' }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Results Count */}
        {filteredResearchers.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredResearchers.length} of {researchers.length} researchers
            </Typography>
          </Box>
        )}
      </Container>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => selectedResearcher && handleViewProfile(selectedResearcher.id)}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Profile</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ManageResearchers;
