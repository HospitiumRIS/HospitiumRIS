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
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [researchers, setResearchers] = useState([]);
  const [filteredResearchers, setFilteredResearchers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedResearcher, setSelectedResearcher] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);

  useEffect(() => {
    setMounted(true);
    fetchResearchers();
  }, []);

  useEffect(() => {
    filterResearchers();
  }, [searchTerm, researchers, departmentFilter, sortBy, sortOrder]);

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
    let filtered = [...researchers];

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(researcher => {
        const fullName = `${researcher.givenName || ''} ${researcher.familyName || ''}`.toLowerCase();
        const email = (researcher.email || '').toLowerCase();
        const department = (researcher.researchProfile?.department || '').toLowerCase();
        const institution = (researcher.primaryInstitution || '').toLowerCase();
        
        return fullName.includes(term) || 
               email.includes(term) || 
               department.includes(term) ||
               institution.includes(term);
      });
    }

    // Apply department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(researcher => 
        (researcher.researchProfile?.department || researcher.primaryInstitution) === departmentFilter
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.givenName || ''} ${a.familyName || ''}`.toLowerCase();
          bValue = `${b.givenName || ''} ${b.familyName || ''}`.toLowerCase();
          break;
        case 'publications':
          aValue = a.stats?.totalPublications || 0;
          bValue = b.stats?.totalPublications || 0;
          break;
        case 'citations':
          aValue = a.stats?.totalCitations || 0;
          bValue = b.stats?.totalCitations || 0;
          break;
        case 'hindex':
          aValue = a.stats?.hIndex || 0;
          bValue = b.stats?.hIndex || 0;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
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

  const getDepartments = () => {
    const depts = new Set();
    researchers.forEach(r => {
      const dept = r.researchProfile?.department || r.primaryInstitution;
      if (dept) depts.add(dept);
    });
    return Array.from(depts).sort();
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!mounted || loading) {
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
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <Card sx={{ 
            flex: '1 1 200px', 
            minWidth: 200,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(139,108,188,0.15)'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#8b6cbc', mb: 0.5, lineHeight: 1 }}>
                    {researchers.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 1 }}>
                    Total Researchers
                  </Typography>
                </Box>
                <Box sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '12px',
                  bgcolor: 'rgba(139, 108, 188, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <GroupIcon sx={{ fontSize: 32, color: '#8b6cbc' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ 
            flex: '1 1 200px', 
            minWidth: 200,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(45,134,89,0.15)'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#2d8659', mb: 0.5, lineHeight: 1 }}>
                    {researchers.reduce((sum, r) => sum + (r.stats?.totalManuscripts || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 1 }}>
                    Total Manuscripts
                  </Typography>
                </Box>
                <Box sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '12px',
                  bgcolor: 'rgba(45, 134, 89, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ManuscriptIcon sx={{ fontSize: 32, color: '#2d8659' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ 
            flex: '1 1 200px', 
            minWidth: 200,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(217,119,6,0.15)'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#d97706', mb: 0.5, lineHeight: 1 }}>
                    {researchers.reduce((sum, r) => sum + (r.stats?.totalPublications || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 1 }}>
                    Total Publications
                  </Typography>
                </Box>
                <Box sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '12px',
                  bgcolor: 'rgba(217, 119, 6, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ArticleIcon sx={{ fontSize: 32, color: '#d97706' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ 
            flex: '1 1 200px', 
            minWidth: 200,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(37,99,235,0.15)'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#2563eb', mb: 0.5, lineHeight: 1 }}>
                    {researchers.reduce((sum, r) => sum + (r.stats?.totalCitations || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 1 }}>
                    Total Citations
                  </Typography>
                </Box>
                <Box sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '12px',
                  bgcolor: 'rgba(37, 99, 235, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CitationIcon sx={{ fontSize: 32, color: '#2563eb' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Search and Actions */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Stack spacing={2}>
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
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                select
                label="Department"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                sx={{ minWidth: 200 }}
                size="small"
              >
                <MenuItem value="all">All Departments</MenuItem>
                {getDepartments().map((dept) => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{ minWidth: 180 }}
                size="small"
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="publications">Publications</MenuItem>
                <MenuItem value="citations">Citations</MenuItem>
                <MenuItem value="hindex">H-Index</MenuItem>
              </TextField>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                sx={{
                  borderColor: '#e5e7eb',
                  color: '#6b7280',
                  minWidth: 100,
                  '&:hover': {
                    borderColor: '#8b6cbc',
                    backgroundColor: alpha('#8b6cbc', 0.05)
                  }
                }}
              >
                {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </Button>
              {(searchTerm || departmentFilter !== 'all') && (
                <Chip
                  label="Clear Filters"
                  onDelete={() => {
                    setSearchTerm('');
                    setDepartmentFilter('all');
                  }}
                  sx={{ ml: 'auto' }}
                />
              )}
            </Box>
          </Stack>
        </Paper>

        {/* Researchers Table */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
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
                  <TableRow sx={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#1f2937', py: 2.5, fontSize: '0.875rem' }}>
                      Researcher
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1f2937', py: 2.5, fontSize: '0.875rem' }}>
                      Department
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1f2937', py: 2.5, textAlign: 'center', fontSize: '0.875rem' }}>
                      Manuscripts
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1f2937', py: 2.5, textAlign: 'center', fontSize: '0.875rem' }}>
                      Publications
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1f2937', py: 2.5, textAlign: 'center', fontSize: '0.875rem' }}>
                      Citations
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1f2937', py: 2.5, textAlign: 'center', fontSize: '0.875rem' }}>
                      H-Index
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1f2937', py: 2.5, textAlign: 'center', fontSize: '0.875rem' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredResearchers.map((researcher) => (
                    <TableRow
                      key={researcher.id}
                      sx={{
                        '&:hover': { 
                          backgroundColor: '#f5f3f7',
                          '& .researcher-avatar': {
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(139,108,188,0.3)'
                          }
                        },
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '& td': { borderBottom: '1px solid #f3f4f6' }
                      }}
                      onClick={() => handleViewProfile(researcher.id)}
                    >
                      <TableCell sx={{ py: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            className="researcher-avatar"
                            sx={{
                              width: 44,
                              height: 44,
                              bgcolor: '#8b6cbc',
                              fontSize: '0.875rem',
                              fontWeight: 700,
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(139,108,188,0.2)'
                            }}
                          >
                            {getInitials(researcher)}
                          </Avatar>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>
                                {getFullName(researcher)}
                              </Typography>
                              {researcher.orcidId && (
                                <Tooltip title="ORCID Verified" arrow>
                                  <VerifiedIcon sx={{ fontSize: 18, color: '#a6ce39' }} />
                                </Tooltip>
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.8rem' }}>
                              {researcher.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2.5 }}>
                        <Chip
                          label={researcher.researchProfile?.department || researcher.primaryInstitution || 'N/A'}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(139, 108, 188, 0.08)',
                            color: '#8b6cbc',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2.5, textAlign: 'center' }}>
                        <Chip
                          label={researcher.stats?.totalManuscripts || 0}
                          size="small"
                          sx={{
                            backgroundColor: alpha('#2d8659', 0.12),
                            color: '#2d8659',
                            fontWeight: 700,
                            minWidth: 45,
                            fontSize: '0.8rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2.5, textAlign: 'center' }}>
                        <Chip
                          label={researcher.stats?.totalPublications || 0}
                          size="small"
                          sx={{
                            backgroundColor: alpha('#d97706', 0.12),
                            color: '#d97706',
                            fontWeight: 700,
                            minWidth: 45,
                            fontSize: '0.8rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2.5, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563eb', fontSize: '0.9rem' }}>
                          {researcher.stats?.totalCitations || 0}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2.5, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#7c3aed', fontSize: '0.9rem' }}>
                          {researcher.stats?.hIndex || 0}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2.5, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="View Profile" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleViewProfile(researcher.id)}
                            sx={{ 
                              color: '#8b6cbc',
                              '&:hover': {
                                bgcolor: 'rgba(139, 108, 188, 0.1)',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
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
