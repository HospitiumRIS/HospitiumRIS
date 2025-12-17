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
  Avatar,
  Chip,
  IconButton,
  Divider,
  Paper,
  Alert,
  CircularProgress,
  Tooltip,
  LinearProgress,
  Badge,
  Link as MuiLink,
  Stack,
  Tabs,
  Tab,
  Fade,
  Skeleton,
  alpha,
  Grid,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Article as ArticleIcon,
  Link as LinkIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Public as WebIcon,
  Star as StarIcon,
  Verified as VerifiedIcon,
  CalendarToday as CalendarIcon,
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  Groups as CollaborationIcon,
  Assignment as ProposalIcon,
  Description as ManuscriptIcon,
  MenuBook as PublicationIcon,
  OpenInNew as OpenInNewIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Science as ScienceIcon,
  LocalLibrary as LibraryIcon,
  AutoGraph as MetricsIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import PageHeader from '../../../../components/common/PageHeader';

const ResearcherPublicProfile = () => {
  const theme = useTheme();
  const params = useParams();
  const router = useRouter();
  const researcherId = params.id;

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [manuscripts, setManuscripts] = useState([]);
  const [publications, setPublications] = useState([]);
  const [orcidData, setOrcidData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!researcherId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/researcher/profile/${researcherId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Researcher not found');
          }
          throw new Error('Failed to fetch researcher profile');
        }

        const data = await response.json();
        setProfile(data.profile);
        setStats(data.stats);
        setManuscripts(data.manuscripts || []);
        setPublications(data.publications || []);
        setOrcidData(data.orcidData);
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

  const handleCopyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Box sx={{ 
          background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)',
          py: 8,
          px: 3
        }}>
          <Container maxWidth="lg">
            <Stack direction="row" alignItems="center" spacing={3}>
              <Skeleton variant="circular" width={140} height={140} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={50} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                <Skeleton variant="text" width="40%" height={30} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                <Skeleton variant="text" width="30%" height={30} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
              </Box>
            </Stack>
          </Container>
        </Box>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rounded" height={300} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rounded" height={200} />
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', pt: 12 }}>
        <Container maxWidth="md">
          <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Box sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: alpha('#f44336', 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}>
              <PersonIcon sx={{ fontSize: 40, color: '#f44336' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#2d3748' }}>
              {error === 'Researcher not found' ? 'Researcher Not Found' : 'Something Went Wrong'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              {error === 'Researcher not found' 
                ? 'The researcher profile you are looking for does not exist or has been removed.'
                : 'There was an error loading this profile. Please try again later.'
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.back()}
              sx={{
                bgcolor: '#8b6cbc',
                '&:hover': { bgcolor: '#7b5cac' },
                borderRadius: 2,
                px: 4,
              }}
            >
              Go Back
            </Button>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Hero Header Section */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)',
        position: 'relative',
        overflow: 'hidden',
        pt: 10,
        pb: 6,
      }}>
        {/* Decorative Elements */}
        <Box sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Back Button */}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
            sx={{
              color: 'rgba(255,255,255,0.8)',
              mb: 3,
              '&:hover': {
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
              }
            }}
          >
            Back
          </Button>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems={{ xs: 'center', md: 'flex-start' }}>
            {/* Avatar Section */}
            <Box sx={{ position: 'relative' }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  profile?.orcidId && (
                    <Tooltip title="ORCID Verified">
                      <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}>
                        <VerifiedIcon sx={{ color: '#a6ce39', fontSize: 24 }} />
                      </Box>
                    </Tooltip>
                  )
                }
              >
                <Avatar
                  sx={{
                    width: 150,
                    height: 150,
                    fontSize: '3.5rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                    color: '#8b6cbc',
                    border: '4px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  }}
                >
                  {getInitials()}
                </Avatar>
              </Badge>
            </Box>

            {/* Profile Info */}
            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
              <Typography variant="h3" sx={{ 
                fontWeight: 800, 
                color: 'white', 
                mb: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}>
                {getFullName()}
              </Typography>
              
              {profile?.researchProfile?.department && (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <WorkIcon sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 20 }} />
                  <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                    {profile.researchProfile.department}
                  </Typography>
                </Stack>
              )}
              
              {profile?.primaryInstitution && (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <BusinessIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }} />
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {profile.primaryInstitution}
                  </Typography>
                </Stack>
              )}

              {/* Quick Stats */}
              <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ justifyContent: { xs: 'center', md: 'flex-start' } }}>
                {profile?.orcidId && (
                  <Chip
                    icon={<LinkIcon sx={{ fontSize: '16px !important' }} />}
                    label={`ORCID: ${profile.orcidId}`}
                    component="a"
                    href={`https://orcid.org/${profile.orcidId}`}
                    target="_blank"
                    clickable
                    sx={{
                      backgroundColor: 'rgba(166, 206, 57, 0.2)',
                      color: 'white',
                      fontWeight: 500,
                      backdropFilter: 'blur(4px)',
                      '& .MuiChip-icon': { color: '#a6ce39' },
                      '&:hover': { backgroundColor: 'rgba(166, 206, 57, 0.3)' }
                    }}
                  />
                )}
                <Chip
                  icon={<CalendarIcon sx={{ fontSize: '16px !important' }} />}
                  label={`Member since ${getMemberSince()}`}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(4px)',
                    '& .MuiChip-icon': { color: 'rgba(255,255,255,0.7)' }
                  }}
                />
              </Stack>
            </Box>

            {/* Action Buttons */}
            <Stack spacing={1.5} sx={{ alignItems: { xs: 'center', md: 'flex-end' } }}>
              <Button
                variant="contained"
                startIcon={<EmailIcon />}
                href={`mailto:${profile?.email}`}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                Contact
              </Button>
              <Tooltip title={copied ? 'Copied!' : 'Copy profile link'}>
                <Button
                  variant="outlined"
                  startIcon={copied ? <CheckCircleIcon /> : <ShareIcon />}
                  onClick={handleCopyProfileLink}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.4)',
                    color: 'white',
                    fontWeight: 500,
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.6)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  {copied ? 'Copied!' : 'Share Profile'}
                </Button>
              </Tooltip>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Stats Bar */}
      <Box sx={{ backgroundColor: 'white', borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
        <Container maxWidth="lg">
          <Stack 
            direction="row" 
            spacing={{ xs: 2, md: 4 }} 
            justifyContent="center"
            sx={{ overflowX: 'auto', px: 2 }}
          >
            {[
              { icon: <ManuscriptIcon />, value: stats?.manuscripts || 0, label: 'Manuscripts', color: '#8b6cbc' },
              { icon: <PublicationIcon />, value: stats?.publications || 0, label: 'Publications', color: '#4caf50' },
              { icon: <ProposalIcon />, value: stats?.proposals || 0, label: 'Proposals', color: '#e67e22' },
              { icon: <CollaborationIcon />, value: stats?.collaborations || 0, label: 'Collaborations', color: '#3498db' },
              { icon: <StarIcon />, value: stats?.totalCitations || 0, label: 'Citations', color: '#f1c40f' },
            ].map((stat, index) => (
              <Tooltip title={stat.label} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    px: 3,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderRadius: 2,
                    backgroundColor: alpha(stat.color, 0.05),
                    border: '1px solid',
                    borderColor: alpha(stat.color, 0.1),
                    minWidth: 'fit-content',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${alpha(stat.color, 0.2)}`,
                    }
                  }}
                >
                  <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: stat.color, lineHeight: 1 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Paper>
              </Tooltip>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Left Column - Main Content */}
          <Grid item xs={12} lg={8}>
            {/* Tabs */}
            <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    minHeight: 56,
                  },
                  '& .Mui-selected': {
                    color: '#8b6cbc !important',
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#8b6cbc',
                    height: 3,
                  }
                }}
              >
                <Tab icon={<ScienceIcon />} iconPosition="start" label="About" />
                <Tab icon={<PublicationIcon />} iconPosition="start" label={`Publications (${publications.length})`} />
                <Tab icon={<ManuscriptIcon />} iconPosition="start" label={`Manuscripts (${manuscripts.length})`} />
              </Tabs>

              <CardContent sx={{ p: 4 }}>
                {/* About Tab */}
                {activeTab === 0 && (
                  <Fade in={activeTab === 0}>
                    <Box>
                      {/* Biography */}
                      {profile?.researchProfile?.biography && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon sx={{ color: '#8b6cbc' }} />
                            Biography
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#4a5568', lineHeight: 1.8 }}>
                            {profile.researchProfile.biography}
                          </Typography>
                        </Box>
                      )}

                      {/* Research Interests */}
                      {profile?.researchProfile?.researchInterests && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LibraryIcon sx={{ color: '#8b6cbc' }} />
                            Research Interests
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#4a5568', lineHeight: 1.8 }}>
                            {profile.researchProfile.researchInterests}
                          </Typography>
                        </Box>
                      )}

                      {/* Specializations */}
                      {profile?.researchProfile?.specialization?.length > 0 && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SchoolIcon sx={{ color: '#8b6cbc' }} />
                            Specializations
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {profile.researchProfile.specialization.map((spec, index) => (
                              <Chip
                                key={index}
                                label={spec}
                                sx={{
                                  backgroundColor: alpha('#8b6cbc', 0.1),
                                  color: '#8b6cbc',
                                  fontWeight: 500,
                                  mb: 1,
                                }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {/* Keywords */}
                      {profile?.researchProfile?.keywords?.length > 0 && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ArticleIcon sx={{ color: '#8b6cbc' }} />
                            Research Keywords
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {profile.researchProfile.keywords.map((keyword, index) => (
                              <Chip
                                key={index}
                                label={keyword}
                                size="small"
                                sx={{
                                  backgroundColor: alpha('#4ECDC4', 0.1),
                                  color: '#4ECDC4',
                                  fontWeight: 500,
                                  mb: 1,
                                }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {/* Empty State */}
                      {!profile?.researchProfile?.biography && 
                       !profile?.researchProfile?.researchInterests && 
                       (!profile?.researchProfile?.specialization || profile?.researchProfile?.specialization.length === 0) && (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                          <PersonIcon sx={{ fontSize: 60, color: '#cbd5e0', mb: 2 }} />
                          <Typography variant="h6" sx={{ color: '#a0aec0', mb: 1 }}>
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
                        <Stack spacing={2}>
                          {publications.map((pub, index) => (
                            <Paper
                              key={pub.id}
                              elevation={0}
                              sx={{
                                p: 3,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  borderColor: alpha('#8b6cbc', 0.3),
                                  boxShadow: `0 4px 12px ${alpha('#8b6cbc', 0.1)}`,
                                }
                              }}
                            >
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748', mb: 1, lineHeight: 1.5 }}>
                                {pub.title}
                              </Typography>
                              {pub.authors && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {pub.authors}
                                </Typography>
                              )}
                              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                                {pub.journal && (
                                  <Typography variant="caption" sx={{ color: '#8b6cbc', fontWeight: 500 }}>
                                    {pub.journal}
                                  </Typography>
                                )}
                                {pub.year && (
                                  <Chip label={pub.year} size="small" sx={{ height: 22, fontSize: '0.7rem' }} />
                                )}
                                {pub.doi && (
                                  <Chip
                                    label="DOI"
                                    size="small"
                                    component="a"
                                    href={`https://doi.org/${pub.doi}`}
                                    target="_blank"
                                    clickable
                                    icon={<OpenInNewIcon sx={{ fontSize: '14px !important' }} />}
                                    sx={{
                                      height: 22,
                                      fontSize: '0.7rem',
                                      backgroundColor: alpha('#3498db', 0.1),
                                      color: '#3498db',
                                      '& .MuiChip-icon': { color: '#3498db' }
                                    }}
                                  />
                                )}
                                {pub.citationCount > 0 && (
                                  <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <StarIcon sx={{ fontSize: 14, color: '#f1c40f' }} />
                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                      {pub.citationCount} citations
                                    </Typography>
                                  </Stack>
                                )}
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                          <PublicationIcon sx={{ fontSize: 60, color: '#cbd5e0', mb: 2 }} />
                          <Typography variant="h6" sx={{ color: '#a0aec0', mb: 1 }}>
                            No publications yet
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            This researcher hasn't added any publications.
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
                        <Stack spacing={2}>
                          {manuscripts.map((manuscript, index) => (
                            <Paper
                              key={manuscript.id}
                              elevation={0}
                              sx={{
                                p: 3,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  borderColor: alpha('#8b6cbc', 0.3),
                                  boxShadow: `0 4px 12px ${alpha('#8b6cbc', 0.1)}`,
                                }
                              }}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748', mb: 1 }}>
                                    {manuscript.title}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Last updated: {formatDate(manuscript.updatedAt)}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={manuscript.status?.replace('_', ' ') || 'Draft'}
                                  size="small"
                                  color={
                                    manuscript.status === 'PUBLISHED' ? 'success' :
                                    manuscript.status === 'UNDER_REVIEW' ? 'info' :
                                    manuscript.status === 'SUBMITTED' ? 'warning' :
                                    'default'
                                  }
                                  sx={{ fontWeight: 500, textTransform: 'capitalize' }}
                                />
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                          <ManuscriptIcon sx={{ fontSize: 60, color: '#cbd5e0', mb: 2 }} />
                          <Typography variant="h6" sx={{ color: '#a0aec0', mb: 1 }}>
                            No manuscripts yet
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            This researcher hasn't created any manuscripts.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Fade>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Sidebar */}
          <Grid item xs={12} lg={4}>
            {/* Research Metrics */}
            <Card sx={{ mb: 3, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MetricsIcon sx={{ color: '#8b6cbc' }} />
                  Research Metrics
                </Typography>

                <Stack spacing={2}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: alpha('#8b6cbc', 0.05),
                      border: '1px solid',
                      borderColor: alpha('#8b6cbc', 0.1),
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#8b6cbc', mb: 0.5 }}>
                      {profile?.researchProfile?.hIndex || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500 }}>
                      H-Index
                    </Typography>
                  </Paper>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: alpha('#4ECDC4', 0.05),
                      border: '1px solid',
                      borderColor: alpha('#4ECDC4', 0.1),
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#4ECDC4', mb: 0.5 }}>
                      {profile?.researchProfile?.citationCount || stats?.totalCitations || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500 }}>
                      Total Citations
                    </Typography>
                  </Paper>
                </Stack>
              </CardContent>
            </Card>

            {/* Professional Links */}
            <Card sx={{ mb: 3, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinkIcon sx={{ color: '#8b6cbc' }} />
                  Professional Links
                </Typography>

                <Stack spacing={1.5}>
                  {profile?.researchProfile?.website && (
                    <MuiLink 
                      href={profile.researchProfile.website} 
                      target="_blank"
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5, 
                        color: '#8b6cbc',
                        textDecoration: 'none',
                        p: 1.5,
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          backgroundColor: alpha('#8b6cbc', 0.05),
                        }
                      }}
                    >
                      <WebIcon sx={{ fontSize: 20 }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Personal Website</Typography>
                      <OpenInNewIcon sx={{ fontSize: 16, ml: 'auto' }} />
                    </MuiLink>
                  )}
                  {profile?.researchProfile?.linkedin && (
                    <MuiLink 
                      href={profile.researchProfile.linkedin} 
                      target="_blank"
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5, 
                        color: '#0077b5',
                        textDecoration: 'none',
                        p: 1.5,
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          backgroundColor: alpha('#0077b5', 0.05),
                        }
                      }}
                    >
                      <LinkedInIcon sx={{ fontSize: 20 }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>LinkedIn</Typography>
                      <OpenInNewIcon sx={{ fontSize: 16, ml: 'auto' }} />
                    </MuiLink>
                  )}
                  {profile?.researchProfile?.twitter && (
                    <MuiLink 
                      href={`https://twitter.com/${profile.researchProfile.twitter.replace('@', '')}`}
                      target="_blank"
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5, 
                        color: '#1da1f2',
                        textDecoration: 'none',
                        p: 1.5,
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          backgroundColor: alpha('#1da1f2', 0.05),
                        }
                      }}
                    >
                      <TwitterIcon sx={{ fontSize: 20 }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{profile.researchProfile.twitter}</Typography>
                      <OpenInNewIcon sx={{ fontSize: 16, ml: 'auto' }} />
                    </MuiLink>
                  )}
                  {profile?.researchProfile?.googleScholar && (
                    <MuiLink 
                      href={profile.researchProfile.googleScholar} 
                      target="_blank"
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5, 
                        color: '#4285f4',
                        textDecoration: 'none',
                        p: 1.5,
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          backgroundColor: alpha('#4285f4', 0.05),
                        }
                      }}
                    >
                      <SchoolIcon sx={{ fontSize: 20 }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Google Scholar</Typography>
                      <OpenInNewIcon sx={{ fontSize: 16, ml: 'auto' }} />
                    </MuiLink>
                  )}
                  {!profile?.researchProfile?.website && 
                   !profile?.researchProfile?.linkedin && 
                   !profile?.researchProfile?.twitter && 
                   !profile?.researchProfile?.googleScholar && (
                    <Typography variant="body2" sx={{ color: '#a0aec0', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                      No professional links added yet
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* ORCID Information */}
            {orcidData && (
              <Card sx={{ 
                borderRadius: 3, 
                bgcolor: alpha('#a6ce39', 0.05), 
                border: '1px solid',
                borderColor: alpha('#a6ce39', 0.2)
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                    <Avatar sx={{ bgcolor: '#a6ce39', width: 36, height: 36 }}>
                      <LinkIcon />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
                      ORCID Information
                    </Typography>
                  </Stack>

                  <Stack spacing={3}>
                    {orcidData.employments && orcidData.employments.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#4a5568', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <WorkIcon sx={{ fontSize: 16 }} /> Employment History
                        </Typography>
                        {orcidData.employments.slice(0, 3).map((emp, index) => (
                          <Box key={index} sx={{ mb: 1.5, pl: 2, borderLeft: '2px solid', borderColor: alpha('#a6ce39', 0.3) }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2d3748' }}>
                              {emp.role}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#718096' }}>
                              {emp.organization}
                              {emp.department && ` • ${emp.department}`}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {orcidData.educations && orcidData.educations.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#4a5568', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <SchoolIcon sx={{ fontSize: 16 }} /> Education
                        </Typography>
                        {orcidData.educations.slice(0, 3).map((edu, index) => (
                          <Box key={index} sx={{ mb: 1.5, pl: 2, borderLeft: '2px solid', borderColor: alpha('#a6ce39', 0.3) }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2d3748' }}>
                              {edu.degree}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#718096' }}>
                              {edu.organization}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      href={`https://orcid.org/${profile.orcidId}`}
                      target="_blank"
                      endIcon={<OpenInNewIcon />}
                      sx={{
                        borderColor: '#a6ce39',
                        color: '#a6ce39',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: '#8eb82e',
                          bgcolor: alpha('#a6ce39', 0.1),
                        },
                      }}
                    >
                      View Full ORCID Profile
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ResearcherPublicProfile;

