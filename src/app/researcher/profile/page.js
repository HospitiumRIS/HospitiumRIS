'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Avatar,
  Chip,
  IconButton,
  Divider,
  Paper,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  Link as MuiLink,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Article as ArticleIcon,
  LocationOn as LocationIcon,
  Link as LinkIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  Language as LanguageIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Public as WebIcon,
  EmojiEvents as AwardsIcon,
  Code as CodeIcon,
  Star as StarIcon,
  Verified as VerifiedIcon,
  CalendarToday as CalendarIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon,
  Group as CollaborationIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../../components/AuthProvider';

const ResearcherProfilePage = () => {
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [orcidData, setOrcidData] = useState(null);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editedProfile, setEditedProfile] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);

        // Fetch profile and publications in parallel
        const [profileRes, pubsRes] = await Promise.all([
          fetch('/api/researcher/profile', { credentials: 'include' }),
          fetch('/api/publications', { credentials: 'include' }),
        ]);

        if (!profileRes.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const profileData = await profileRes.json();
        const pubsData = pubsRes.ok ? await pubsRes.json() : { publications: [] };

        setProfile(profileData.profile);
        setOrcidData(profileData.orcidData);
        setEditedProfile(profileData.profile);
        setPublications(pubsData.publications || []);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);


  // Handle profile update
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/researcher/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editedProfile),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setProfile(data.profile);
      setEditedProfile(data.profile);
      setEditing(false);
      setSuccess('Profile updated successfully!');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(profile);
    setEditing(false);
    setError(null);
  };

  const handleFieldChange = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedFieldChange = (parent, field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const handleArrayAdd = (field, value) => {
    if (!value.trim()) return;
    setEditedProfile(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()],
    }));
  };

  const handleArrayRemove = (field, index) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const getInitials = () => {
    if (profile?.givenName && profile?.familyName) {
      return `${profile.givenName[0]}${profile.familyName[0]}`.toUpperCase();
    }
    return 'U';
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', width: '100vw', overflow: 'hidden' }}>
      {/* Top Bar */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #e2e8f0', py: 2 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
              Researcher Profile
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                size="small"
                sx={{ borderColor: '#cbd5e0', color: '#475569' }}
              >
                Export CV
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                size="small"
                sx={{ borderColor: '#cbd5e0', color: '#475569' }}
              >
                Public Link
              </Button>
              <Button
                variant="contained"
                startIcon={editing ? <SaveIcon /> : <EditIcon />}
                onClick={editing ? handleSaveProfile : () => setEditing(true)}
                disabled={saving}
                size="small"
                sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7a5daa' } }}
              >
                {saving ? 'Saving...' : editing ? 'Save Profile' : 'Edit Profile'}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box sx={{ px: 4, py: 4, maxWidth: '100%' }}>
        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Main Profile Content - Flexbox Layout */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* Left Sidebar - 3 Separate Cards */}
          <Box sx={{ flex: '0 0 300px', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            {/* Card 1: Profile Info & Contact */}
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', bgcolor: 'white' }}>
              <CardContent sx={{ p: 3 }}>
                {/* Avatar and Name */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2.5 }}>
                  <Avatar
                    sx={{
                      width: 96,
                      height: 96,
                      bgcolor: '#8b6cbc',
                      fontSize: '2rem',
                      fontWeight: 700,
                      mb: 2
                    }}
                  >
                    {getInitials()}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', textAlign: 'center', mb: 0.5, fontSize: '1rem' }}>
                    {profile?.researchProfile?.academicTitle && `${profile.researchProfile.academicTitle} `}
                    {profile?.givenName} {profile?.familyName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8b6cbc', textAlign: 'center', mb: 0.5, fontSize: '0.813rem' }}>
                    {profile?.researchProfile?.academicTitle || 'Researcher'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', fontSize: '0.813rem' }}>
                    {profile?.researchProfile?.department || 'Department'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Contact Information */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* H-Index */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TrendingUpIcon sx={{ color: '#8b6cbc', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.813rem', flex: 1 }}>H-index</Typography>
                    <Chip label={profile?.researchProfile?.hIndex || 0} size="small" sx={{ bgcolor: '#8b6cbc', color: 'white', fontWeight: 600, height: 22, fontSize: '0.75rem' }} />
                  </Box>

                  {/* Location */}
                  {profile?.primaryInstitution && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <LocationIcon sx={{ color: '#8b6cbc', fontSize: 18, mt: 0.2 }} />
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.813rem', flex: 1, lineHeight: 1.5 }}>
                        {profile.primaryInstitution}
                      </Typography>
                    </Box>
                  )}

                  {/* Department */}
                  {profile?.researchProfile?.department && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <BusinessIcon sx={{ color: '#8b6cbc', fontSize: 18, mt: 0.2 }} />
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.813rem', flex: 1, lineHeight: 1.5 }}>
                        {profile.researchProfile.department}
                      </Typography>
                    </Box>
                  )}

                  {/* Email */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <EmailIcon sx={{ color: '#8b6cbc', fontSize: 18 }} />
                    <MuiLink href={`mailto:${profile?.email}`} sx={{ color: '#8b6cbc', textDecoration: 'none', fontSize: '0.813rem', '&:hover': { textDecoration: 'underline' } }}>
                      {profile?.email}
                    </MuiLink>
                  </Box>

                  {/* ORCID */}
                  {profile?.orcidId && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <LinkIcon sx={{ color: '#8b6cbc', fontSize: 18 }} />
                      <MuiLink href={`https://orcid.org/${profile.orcidId}`} target="_blank" sx={{ color: '#8b6cbc', textDecoration: 'none', fontSize: '0.813rem', '&:hover': { textDecoration: 'underline' } }}>
                        orcid.org/{profile.orcidId}
                      </MuiLink>
                    </Box>
                  )}

                  {/* Member Since */}
                  {profile?.createdAt && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CalendarIcon sx={{ color: '#8b6cbc', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.813rem' }}>
                        Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </Typography>
                    </Box>
                  )}

                  {/* Website */}
                  {profile?.researchProfile?.website && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <WebIcon sx={{ color: '#8b6cbc', fontSize: 18 }} />
                      <MuiLink href={profile.researchProfile.website} target="_blank" sx={{ color: '#8b6cbc', textDecoration: 'none', fontSize: '0.813rem', '&:hover': { textDecoration: 'underline' } }}>
                        scholar.google.com
                      </MuiLink>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Card 2: Research Expertise */}
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', bgcolor: 'white' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
                  Research Expertise
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile?.researchProfile?.keywords?.slice(0, 8).map((keyword, index) => (
                    <Chip key={index} label={keyword} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontSize: '0.75rem' }} />
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Card 3: Impact Summary */}
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', bgcolor: 'white' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
                  Impact Summary
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  <Box sx={{ flex: '0 0 calc(50% - 12px)' }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
                        {publications.length}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Publications</Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ flex: '0 0 calc(50% - 12px)' }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
                        {profile?.researchProfile?.citationCount || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Citations</Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ flex: '0 0 calc(50% - 12px)' }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
                        {profile?.researchProfile?.hIndex || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>h-index</Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ flex: '0 0 calc(50% - 12px)' }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
                        {profile?.researchProfile?.citationCount ? Math.floor(profile.researchProfile.citationCount / (publications.length || 1)) : 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Co-authors</Typography>
                    </Paper>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Right Content Area */}
          <Box sx={{ flex: '1 1 600px', minWidth: 0 }}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', bgcolor: 'white' }}>
              <Box sx={{ borderBottom: '1px solid #e2e8f0' }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange}
                  sx={{
                    px: 3,
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#64748b',
                      '&.Mui-selected': {
                        color: '#8b6cbc',
                      },
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#8b6cbc',
                    },
                  }}
                >
                  <Tab label="Biography" />
                  <Tab label="Academic CV" />
                  <Tab label="Skills" />
                  <Tab label="Awards" />
                </Tabs>
              </Box>

              <CardContent sx={{ p: 4 }}>

                {/* Tab Content */}
                {activeTab === 0 && (
                  <Box>
                  {editing ? (
                    <>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <TextField
                          label="Given Name"
                          value={editedProfile?.givenName || ''}
                          onChange={(e) => handleFieldChange('givenName', e.target.value)}
                          fullWidth
                          sx={{ flex: 1, minWidth: 200 }}
                        />
                        <TextField
                          label="Family Name"
                          value={editedProfile?.familyName || ''}
                          onChange={(e) => handleFieldChange('familyName', e.target.value)}
                          fullWidth
                          sx={{ flex: 1, minWidth: 200 }}
                        />
                      </Box>
                      <TextField
                        label="Academic Title"
                        value={editedProfile?.researchProfile?.academicTitle || ''}
                        onChange={(e) => handleNestedFieldChange('researchProfile', 'academicTitle', e.target.value)}
                        placeholder="e.g., Dr., Prof., Ph.D."
                        fullWidth
                      />
                      <TextField
                        label="Phone Number"
                        value={editedProfile?.researchProfile?.phone || ''}
                        onChange={(e) => handleNestedFieldChange('researchProfile', 'phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        fullWidth
                      />
                    </>
                  ) : (
                    <>
                        {/* Current Focus */}
                        {profile?.researchProfile?.researchInterests && (
                          <Box sx={{ mb: 4, p: 3, bgcolor: '#f0fdfa', borderRadius: 2, border: '1px solid #99f6e4' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 1.5 }}>
                              CURRENT FOCUS
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#1e293b', lineHeight: 1.7 }}>
                              {profile.researchProfile.researchInterests}
                            </Typography>
                          </Box>
                        )}

                        {/* Biography - Display ORCID biography if available, otherwise profile biography */}
                        {orcidData?.biography ? (
                          <Box>
                            <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, mb: 2 }}>
                              {orcidData.biography}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                              <Chip 
                                icon={<LinkIcon sx={{ fontSize: 14 }} />}
                                label="From ORCID"
                                size="small"
                                sx={{ 
                                  bgcolor: 'rgba(166, 206, 57, 0.1)', 
                                  color: '#a6ce39',
                                  fontSize: '0.75rem'
                                }}
                              />
                            </Box>
                          </Box>
                        ) : profile?.researchProfile?.biography ? (
                          <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8 }}>
                            {profile.researchProfile.biography}
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                            No biography available. {profile?.orcidId ? 'Biography will be automatically pulled from ORCID if available.' : 'Connect your ORCID account to import your biography.'}
                          </Typography>
                        )}
                    </>
                    )}
                  </Box>
                )}

                {/* Academic CV Tab */}
                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
                      Academic Curriculum Vitae
                    </Typography>

                    {/* Education Section */}
                    {orcidData?.educations && orcidData.educations.length > 0 ? (
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b', mb: 2.5, fontSize: '1rem' }}>
                          Education
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {orcidData.educations.map((edu, index) => (
                            <Box 
                              key={index} 
                              sx={{ 
                                pb: 3, 
                                borderBottom: index < orcidData.educations.length - 1 ? '1px solid #e2e8f0' : 'none',
                                position: 'relative',
                                pl: 3
                              }}
                            >
                              {/* Timeline dot */}
                              <Box 
                                sx={{ 
                                  position: 'absolute',
                                  left: 0,
                                  top: 6,
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  bgcolor: '#8b6cbc',
                                  border: '2px solid #f0fdfa'
                                }}
                              />
                              
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5, fontSize: '0.938rem' }}>
                                {edu.degree}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#8b6cbc', mb: 0.5, fontSize: '0.875rem', fontWeight: 500 }}>
                                {edu.organization}
                              </Typography>
                              {edu.department && (
                                <Typography variant="body2" sx={{ color: '#64748b', mb: 1, fontSize: '0.813rem' }}>
                                  {edu.department}
                                </Typography>
                              )}
                              {(edu.startDate || edu.endDate) && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                  <CalendarIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                    {edu.startDate?.year || 'N/A'} - {edu.endDate?.year || 'Present'}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          ))}
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
                          <Chip 
                            icon={<LinkIcon sx={{ fontSize: 14 }} />}
                            label="From ORCID"
                            size="small"
                            sx={{ 
                              bgcolor: 'rgba(166, 206, 57, 0.1)', 
                              color: '#a6ce39',
                              fontSize: '0.75rem'
                            }}
                          />
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <SchoolIcon sx={{ fontSize: 48, color: '#cbd5e0', mb: 2 }} />
                        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                          No education information available
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#cbd5e0' }}>
                          {profile?.orcidId ? 'Education information will be automatically pulled from ORCID if available.' : 'Connect your ORCID account to import your education history.'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Skills Tab */}
                {activeTab === 2 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
                      Skills & Expertise
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                      {profile?.researchProfile?.specialization?.map((spec, index) => (
                        <Chip
                          key={index}
                          label={spec}
                          size="small"
                          sx={{ bgcolor: '#f1f5f9', color: '#475569', fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Awards Tab */}
                {activeTab === 3 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
                      Awards & Recognition
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Awards and recognition will be displayed here.
                    </Typography>
                  </Box>
                )}
                </CardContent>
              </Card>

              {/* Recent Works Section */}
              <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', bgcolor: 'white', mt: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3, fontSize: '1rem' }}>
                    Recent Works
                  </Typography>
                  
                  {publications.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      {publications.slice(0, 5).map((pub, index) => (
                        <Box key={pub.id} sx={{ pb: 2.5, borderBottom: index < 4 ? '1px solid #e2e8f0' : 'none' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1, lineHeight: 1.5, fontSize: '0.875rem' }}>
                            {pub.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1, fontSize: '0.75rem' }}>
                            {pub.journal} • {pub.year || new Date().getFullYear()}
                          </Typography>
                          {pub.doi && (
                            <Chip 
                              label="View DOI"
                              size="small"
                              component="a"
                              href={`https://doi.org/${pub.doi}`}
                              target="_blank"
                              clickable
                              sx={{ 
                                fontSize: '0.7rem',
                                height: 20,
                                bgcolor: 'rgba(139, 108, 188, 0.1)',
                                color: '#8b6cbc',
                                '&:hover': { bgcolor: 'rgba(139, 108, 188, 0.2)' }
                              }}
                            />
                          )}
                        </Box>
                      ))}
                      {publications.length > 5 && (
                        <Button 
                          variant="text" 
                          sx={{ color: '#8b6cbc', fontWeight: 600, fontSize: '0.813rem', alignSelf: 'flex-start', textTransform: 'none' }}
                          href="/researcher/publications/manage"
                        >
                          View All {publications.length} Publications →
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <ArticleIcon sx={{ fontSize: 48, color: '#cbd5e0', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.813rem' }}>
                        No publications found
                      </Typography>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        href="/researcher/publications/import"
                        sx={{ 
                          borderColor: '#8b6cbc',
                          color: '#8b6cbc',
                          fontSize: '0.75rem',
                          textTransform: 'none',
                          '&:hover': {
                            bgcolor: 'rgba(139, 108, 188, 0.1)',
                            borderColor: '#8b6cbc'
                          }
                        }}
                      >
                        Import Publications
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>

            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

// Editable Chip List Component
const EditableChipList = ({ items, onAdd, onRemove, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue);
      setInputValue('');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          size="small"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          fullWidth
        />
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          sx={{ 
            minWidth: 100,
            borderColor: '#8b6cbc',
            color: '#8b6cbc',
            '&:hover': { borderColor: '#7a5daa', bgcolor: 'rgba(139, 108, 188, 0.05)' }
          }}
        >
          Add
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {items.map((item, index) => (
          <Chip
            key={index}
            label={item}
            onDelete={() => onRemove(index)}
            deleteIcon={<DeleteIcon />}
            sx={{ bgcolor: 'rgba(139, 108, 188, 0.1)', color: '#8b6cbc' }}
          />
        ))}
        {items.length === 0 && (
          <Typography variant="body2" sx={{ color: '#a0aec0', fontStyle: 'italic' }}>
            No items added yet
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ResearcherProfilePage;
