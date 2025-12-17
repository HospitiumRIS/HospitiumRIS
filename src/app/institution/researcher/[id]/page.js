'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Paper,
  CircularProgress,
  Link as MuiLink,
  Stack,
  Tabs,
  Tab,
  Fade,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  OpenInNew as OpenInNewIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';

const InstitutionResearcherProfile = () => {
  const params = useParams();
  const router = useRouter();
  const researcherId = params.id;

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [manuscripts, setManuscripts] = useState([]);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!researcherId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/researcher/profile/${researcherId}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', response.status, errorData);
          if (response.status === 404) {
            throw new Error('Researcher not found');
          }
          throw new Error(errorData.error || 'Failed to fetch researcher profile');
        }

        const data = await response.json();
        setProfile(data.profile);
        setStats(data.stats);
        setManuscripts(data.manuscripts || []);
        setPublications(data.publications || []);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [researcherId]);

  const getInitials = () => {
    if (profile?.givenName && profile?.familyName) {
      return `${profile.givenName[0]}${profile.familyName[0]}`.toUpperCase();
    }
    return 'U';
  };

  const getFullName = () => {
    if (!profile) return '';
    const title = profile.researchProfile?.academicTitle;
    const name = `${profile.givenName || ''} ${profile.familyName || ''}`.trim();
    return title ? `${title} ${name}` : name;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMemberSince = () => {
    if (!profile?.createdAt) return '';
    const date = new Date(profile.createdAt);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PUBLISHED': return 'success';
      case 'UNDER_REVIEW': return 'info';
      case 'SUBMITTED': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'DRAFT': return 'default';
      default: return 'default';
    }
  };

  // Loading State
  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress size={48} sx={{ color: '#6b5b95' }} />
      </Box>
    );
  }

  // Error State
  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa', pt: 8 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1a1a2e' }}>
              {error === 'Researcher not found' ? 'Researcher Not Found' : 'Error Loading Profile'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              {error === 'Researcher not found' 
                ? 'The researcher profile does not exist or has been removed.'
                : 'Unable to load profile. Please try again.'
              }
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push('/institution')}
              sx={{
                bgcolor: '#6b5b95',
                '&:hover': { bgcolor: '#5a4a7a' },
                textTransform: 'none',
                px: 4,
                py: 1.5,
              }}
            >
              Back to Dashboard
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header Bar */}
      <Box sx={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e8e8e8',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            py: 2 
          }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/institution')}
              sx={{
                color: '#6b5b95',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': { backgroundColor: alpha('#6b5b95', 0.08) }
              }}
            >
              Back to Dashboard
            </Button>
            <Typography variant="body2" color="text.secondary">
              Researcher Profile
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Profile Header Section */}
        <Paper sx={{ 
          borderRadius: 2, 
          overflow: 'hidden',
          mb: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          {/* Top Banner */}
          <Box sx={{ 
            height: 120, 
            background: 'linear-gradient(135deg, #6b5b95 0%, #8b7cb3 100%)'
          }} />
          
          {/* Profile Info */}
          <Box sx={{ px: 4, pb: 4, mt: -6 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'center', md: 'flex-end' },
              gap: 3
            }}>
              {/* Avatar */}
              <Box sx={{
                width: 120,
                height: 120,
                borderRadius: 2,
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '4px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                flexShrink: 0
              }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#6b5b95' }}>
                  {getInitials()}
                </Typography>
              </Box>

              {/* Name & Info */}
              <Box sx={{ 
                flex: 1, 
                textAlign: { xs: 'center', md: 'left' },
                minWidth: 0
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: 'wrap' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                    {getFullName()}
                  </Typography>
                  {profile?.orcidId && (
                    <Chip
                      icon={<VerifiedIcon sx={{ fontSize: '14px !important', color: '#a6ce39' }} />}
                      label="ORCID"
                      size="small"
                      sx={{
                        backgroundColor: alpha('#a6ce39', 0.1),
                        color: '#7a9a2e',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 24
                      }}
                    />
                  )}
                </Box>
                {profile?.researchProfile?.department && (
                  <Typography variant="body1" sx={{ color: '#5a5a7a', mt: 0.5 }}>
                    {profile.researchProfile.department}
                  </Typography>
                )}
                {profile?.primaryInstitution && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {profile.primaryInstitution}
                  </Typography>
                )}
              </Box>

              {/* Contact Button */}
              <Box sx={{ flexShrink: 0 }}>
                <Button
                  variant="outlined"
                  href={`mailto:${profile?.email}`}
                  sx={{
                    borderColor: '#6b5b95',
                    color: '#6b5b95',
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 3,
                    '&:hover': {
                      borderColor: '#5a4a7a',
                      backgroundColor: alpha('#6b5b95', 0.05)
                    }
                  }}
                >
                  Contact Researcher
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Stats Row */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 3,
          flexWrap: 'wrap'
        }}>
          {[
            { label: 'Manuscripts', value: stats?.manuscripts || 0, color: '#6b5b95' },
            { label: 'Publications', value: stats?.publications || 0, color: '#2d8659' },
            { label: 'Proposals', value: stats?.proposals || 0, color: '#d97706' },
            { label: 'Collaborations', value: stats?.collaborations || 0, color: '#2563eb' },
            { label: 'H-Index', value: profile?.researchProfile?.hIndex || 0, color: '#7c3aed' },
            { label: 'Citations', value: profile?.researchProfile?.citationCount || stats?.totalCitations || 0, color: '#059669' },
          ].map((stat) => (
            <Paper
              key={stat.label}
              sx={{
                flex: '1 1 140px',
                minWidth: 140,
                p: 2.5,
                borderRadius: 2,
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                borderTop: `3px solid ${stat.color}`,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color, mb: 0.5 }}>
                {stat.value}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                {stat.label}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Main Content */}
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* Left Sidebar */}
          <Box sx={{ flex: '0 0 320px', minWidth: 0 }}>
            {/* Contact Details */}
            <Paper sx={{ borderRadius: 2, mb: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 2, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                  Contact Information
                </Typography>
                
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
                      Email
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', mt: 0.25 }}>
                      {profile?.email || 'Not provided'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
                      Institution
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', mt: 0.25 }}>
                      {profile?.primaryInstitution || 'Not provided'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
                      Member Since
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', mt: 0.25 }}>
                      {getMemberSince() || 'Not available'}
                    </Typography>
                  </Box>

                  {profile?.orcidId && (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
                        ORCID ID
                      </Typography>
                      <MuiLink 
                        href={`https://orcid.org/${profile.orcidId}`}
                        target="_blank"
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: '#6b5b95',
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          textDecoration: 'none',
                          mt: 0.25,
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {profile.orcidId}
                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                      </MuiLink>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Paper>

            {/* External Links */}
            {(profile?.researchProfile?.website || 
              profile?.researchProfile?.linkedin || 
              profile?.researchProfile?.twitter || 
              profile?.researchProfile?.googleScholar) && (
              <Paper sx={{ borderRadius: 2, mb: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 2, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                    External Links
                  </Typography>
                  
                  <Stack spacing={1}>
                    {profile?.researchProfile?.website && (
                      <MuiLink 
                        href={profile.researchProfile.website} 
                        target="_blank"
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          color: '#374151',
                          textDecoration: 'none',
                          py: 1,
                          px: 1.5,
                          mx: -1.5,
                          borderRadius: 1,
                          '&:hover': { backgroundColor: '#f3f4f6' }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Personal Website</Typography>
                        <OpenInNewIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                      </MuiLink>
                    )}
                    {profile?.researchProfile?.linkedin && (
                      <MuiLink 
                        href={profile.researchProfile.linkedin} 
                        target="_blank"
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          color: '#374151',
                          textDecoration: 'none',
                          py: 1,
                          px: 1.5,
                          mx: -1.5,
                          borderRadius: 1,
                          '&:hover': { backgroundColor: '#f3f4f6' }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>LinkedIn</Typography>
                        <OpenInNewIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                      </MuiLink>
                    )}
                    {profile?.researchProfile?.twitter && (
                      <MuiLink 
                        href={`https://twitter.com/${profile.researchProfile.twitter.replace('@', '')}`}
                        target="_blank"
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          color: '#374151',
                          textDecoration: 'none',
                          py: 1,
                          px: 1.5,
                          mx: -1.5,
                          borderRadius: 1,
                          '&:hover': { backgroundColor: '#f3f4f6' }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Twitter / X</Typography>
                        <OpenInNewIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                      </MuiLink>
                    )}
                    {profile?.researchProfile?.googleScholar && (
                      <MuiLink 
                        href={profile.researchProfile.googleScholar} 
                        target="_blank"
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          color: '#374151',
                          textDecoration: 'none',
                          py: 1,
                          px: 1.5,
                          mx: -1.5,
                          borderRadius: 1,
                          '&:hover': { backgroundColor: '#f3f4f6' }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Google Scholar</Typography>
                        <OpenInNewIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                      </MuiLink>
                    )}
                  </Stack>
                </Box>
              </Paper>
            )}

            {/* Specializations */}
            {profile?.researchProfile?.specialization?.length > 0 && (
              <Paper sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 2, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                    Specializations
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {profile.researchProfile.specialization.map((spec, index) => (
                      <Chip
                        key={index}
                        label={spec}
                        size="small"
                        sx={{
                          backgroundColor: '#f3f4f6',
                          color: '#4b5563',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          borderRadius: 1,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Paper>
            )}
          </Box>

          {/* Main Content Area */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Paper sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              {/* Tabs */}
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  borderBottom: '1px solid #e5e7eb',
                  px: 3,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    minHeight: 52,
                    color: '#6b7280',
                    '&.Mui-selected': {
                      color: '#6b5b95',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#6b5b95',
                    height: 2,
                  }
                }}
              >
                <Tab label="About" />
                <Tab label={`Publications (${publications.length})`} />
                <Tab label={`Manuscripts (${manuscripts.length})`} />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {/* About Tab */}
                {activeTab === 0 && (
                  <Fade in={activeTab === 0}>
                    <Box>
                      {/* Biography */}
                      {profile?.researchProfile?.biography && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                            Biography
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#4b5563', lineHeight: 1.8 }}>
                            {profile.researchProfile.biography}
                          </Typography>
                        </Box>
                      )}

                      {/* Research Interests */}
                      {profile?.researchProfile?.researchInterests && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                            Research Interests
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#4b5563', lineHeight: 1.8 }}>
                            {profile.researchProfile.researchInterests}
                          </Typography>
                        </Box>
                      )}

                      {/* Keywords */}
                      {profile?.researchProfile?.keywords?.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                            Research Keywords
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {profile.researchProfile.keywords.map((keyword, index) => (
                              <Chip
                                key={index}
                                label={keyword}
                                size="small"
                                sx={{
                                  backgroundColor: alpha('#6b5b95', 0.08),
                                  color: '#6b5b95',
                                  fontWeight: 500,
                                  fontSize: '0.75rem',
                                  borderRadius: 1,
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Empty State */}
                      {!profile?.researchProfile?.biography && 
                       !profile?.researchProfile?.researchInterests && 
                       (!profile?.researchProfile?.keywords || profile?.researchProfile?.keywords.length === 0) && (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                          <Typography variant="body1" sx={{ color: '#9ca3af', mb: 1 }}>
                            No profile information available
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            This researcher hasn't added their profile details yet.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Fade>
                )}

                {/* Publications Tab */}
                {activeTab === 1 && (
                  <Fade in={activeTab === 1}>
                    <Box>
                      {publications.length > 0 ? (
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', py: 1.5 }}>Publication</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', py: 1.5, width: 80 }}>Year</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', py: 1.5, width: 80 }}>Citations</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {publications.map((pub) => (
                                <TableRow 
                                  key={pub.id}
                                  sx={{ 
                                    '&:hover': { backgroundColor: '#f9fafb' },
                                    cursor: pub.doi ? 'pointer' : 'default',
                                    '& td': { borderBottom: '1px solid #f3f4f6' }
                                  }}
                                  onClick={() => pub.doi && window.open(`https://doi.org/${pub.doi}`, '_blank')}
                                >
                                  <TableCell sx={{ py: 2.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a1a2e', mb: 0.5 }}>
                                      {pub.title}
                                    </Typography>
                                    {pub.journal && (
                                      <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                        {pub.journal}
                                      </Typography>
                                    )}
                                    {pub.authors && (
                                      <Typography variant="caption" sx={{ display: 'block', color: '#9ca3af', mt: 0.5 }}>
                                        {pub.authors.length > 80 ? pub.authors.substring(0, 80) + '...' : pub.authors}
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell sx={{ py: 2.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                                      {pub.year || '—'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ py: 2.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#6b5b95' }}>
                                      {pub.citationCount || 0}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                          <Typography variant="body1" sx={{ color: '#9ca3af', mb: 1 }}>
                            No publications found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            This researcher hasn't added any publications yet.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Fade>
                )}

                {/* Manuscripts Tab */}
                {activeTab === 2 && (
                  <Fade in={activeTab === 2}>
                    <Box>
                      {manuscripts.length > 0 ? (
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', py: 1.5 }}>Manuscript</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', py: 1.5, width: 120 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', py: 1.5, width: 120 }}>Updated</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {manuscripts.map((manuscript) => (
                                <TableRow 
                                  key={manuscript.id}
                                  sx={{ 
                                    '&:hover': { backgroundColor: '#f9fafb' },
                                    '& td': { borderBottom: '1px solid #f3f4f6' }
                                  }}
                                >
                                  <TableCell sx={{ py: 2.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a1a2e' }}>
                                      {manuscript.title}
                                    </Typography>
                                    {manuscript.field && (
                                      <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                                        {manuscript.field}
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell sx={{ py: 2.5 }}>
                                    <Chip
                                      label={manuscript.status?.replace('_', ' ') || 'Draft'}
                                      size="small"
                                      color={getStatusColor(manuscript.status)}
                                      sx={{ fontWeight: 500, textTransform: 'capitalize', fontSize: '0.7rem' }}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ py: 2.5 }}>
                                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                      {formatDate(manuscript.updatedAt)}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                          <Typography variant="body1" sx={{ color: '#9ca3af', mb: 1 }}>
                            No manuscripts found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            This researcher hasn't created any manuscripts yet.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Fade>
                )}
              </Box>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default InstitutionResearcherProfile;
