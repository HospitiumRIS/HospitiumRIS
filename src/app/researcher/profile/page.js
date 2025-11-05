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
  LinearProgress,
  Badge,
  Link as MuiLink,
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
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../../components/AuthProvider';
import PageHeader from '../../../components/common/PageHeader';

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

  // Calculate profile completeness
  const calculateProfileCompleteness = () => {
    if (!profile) return 0;
    let completed = 0;
    const total = 12;

    if (profile.givenName && profile.familyName) completed++;
    if (profile.email) completed++;
    if (profile.orcidId) completed++;
    if (profile.primaryInstitution) completed++;
    if (profile.researchProfile?.academicTitle) completed++;
    if (profile.researchProfile?.department) completed++;
    if (profile.researchProfile?.biography) completed++;
    if (profile.researchProfile?.researchInterests) completed++;
    if (profile.researchProfile?.specialization?.length > 0) completed++;
    if (profile.researchProfile?.keywords?.length > 0) completed++;
    if (profile.researchProfile?.socialLinks) completed++;
    if (publications.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

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

  const completeness = calculateProfileCompleteness();

  const actionButton = (
    <Button
      variant="contained"
      startIcon={editing ? <SaveIcon /> : <EditIcon />}
      onClick={editing ? handleSaveProfile : () => setEditing(true)}
      disabled={saving}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: 'white',
        fontWeight: 600,
        borderRadius: 2,
        px: 3,
        py: 1,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
        },
      }}
    >
      {saving ? 'Saving...' : editing ? 'Save Profile' : 'Edit Profile'}
    </Button>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        mt: 8,
      }}
    >
      <PageHeader
        title="Researcher Profile"
        description="Your professional research identity and credentials"
        actionButton={actionButton}
        gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)"
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {editing && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3, gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancelEdit}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveProfile}
              disabled={saving}
              sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7a5daa' } }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        )}

        {/* Profile Completeness Card */}
        <Card 
          elevation={3} 
          sx={{ 
            mb: 3, 
            background: 'linear-gradient(135deg, rgba(139, 108, 188, 0.1) 0%, rgba(160, 132, 209, 0.1) 100%)',
            border: '1px solid rgba(139, 108, 188, 0.2)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                    Profile Completeness
                  </Typography>
                  <Chip 
                    label={`${completeness}%`}
                    size="small"
                    sx={{ 
                      bgcolor: completeness >= 80 ? '#4caf50' : completeness >= 50 ? '#ff9800' : '#f44336',
                      color: 'white',
                      fontWeight: 700,
                    }}
                  />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={completeness} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: 'rgba(139, 108, 188, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: completeness >= 80 ? '#4caf50' : completeness >= 50 ? '#ff9800' : '#f44336',
                      borderRadius: 4,
                    }
                  }}
                />
                <Typography variant="caption" sx={{ color: '#718096', mt: 0.5, display: 'block' }}>
                  {completeness >= 80 
                    ? '🎉 Great! Your profile is looking complete!'
                    : completeness >= 50
                    ? '👍 Good progress! Add more details to stand out.'
                    : '📝 Complete your profile to increase visibility.'}
                </Typography>
              </Box>
              {!editing && completeness < 100 && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setEditing(true)}
                  sx={{ borderColor: '#8b6cbc', color: '#8b6cbc' }}
                >
                  Complete Profile
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Main Profile Content */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Header Card with Avatar and Basic Info */}
          <Card 
            elevation={4} 
            sx={{ 
              overflow: 'visible',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 3 }}>
                {/* Avatar Section */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      profile?.orcidId && (
                        <Tooltip title="ORCID Verified">
                          <VerifiedIcon sx={{ color: '#a6ce39', fontSize: 28 }} />
                        </Tooltip>
                      )
                    }
                  >
                    <Avatar
                      sx={{
                        width: 140,
                        height: 140,
                        bgcolor: '#8b6cbc',
                        fontSize: '3rem',
                        fontWeight: 700,
                        border: '4px solid white',
                        boxShadow: '0 4px 20px rgba(139, 108, 188, 0.3)',
                      }}
                    >
                      {getInitials()}
                    </Avatar>
                  </Badge>
                  {profile?.orcidId && (
                    <Tooltip title="View ORCID Profile">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<LinkIcon />}
                        href={`https://orcid.org/${profile.orcidId}`}
                        target="_blank"
                        sx={{
                          borderColor: '#a6ce39',
                          color: '#a6ce39',
                          fontWeight: 600,
                          '&:hover': { 
                            borderColor: '#8eb82e', 
                            bgcolor: 'rgba(166, 206, 57, 0.1)',
                          },
                        }}
                      >
                        ORCID Profile
                      </Button>
                    </Tooltip>
                  )}
                </Box>

                {/* Main Info Section */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>
                          {profile?.researchProfile?.academicTitle && `${profile.researchProfile.academicTitle} `}
                          {profile?.givenName} {profile?.familyName}
                        </Typography>
                        {profile?.researchProfile?.academicTitle && (
                          <Chip
                            icon={<SchoolIcon />}
                            label={profile.researchProfile.academicTitle}
                            sx={{ bgcolor: 'rgba(139, 108, 188, 0.1)', color: '#8b6cbc', mr: 1, mb: 1 }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                        <Chip
                          icon={<EmailIcon />}
                          label={profile?.email}
                          variant="outlined"
                          sx={{ borderColor: '#8b6cbc', color: '#8b6cbc' }}
                        />
                        {profile?.researchProfile?.phone && (
                          <Chip
                            icon={<PhoneIcon />}
                            label={profile.researchProfile.phone}
                            variant="outlined"
                            sx={{ borderColor: '#4ECDC4', color: '#4ECDC4' }}
                          />
                        )}
                        {profile?.orcidId && (
                          <Chip
                            icon={<PersonIcon />}
                            label={`ORCID: ${profile.orcidId}`}
                            variant="outlined"
                            sx={{ borderColor: '#a6ce39', color: '#a6ce39' }}
                          />
                        )}
                      </Box>
                      
                      {/* Quick Stats */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(139, 108, 188, 0.05)', borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ArticleIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#8b6cbc' }}>
                                {publications.length}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#718096' }}>
                                Publications
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(78, 205, 196, 0.05)', borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TrendingUpIcon sx={{ color: '#4ECDC4', fontSize: 20 }} />
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#4ECDC4' }}>
                                {profile?.researchProfile?.hIndex || 0}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#718096' }}>
                                H-Index
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(247, 183, 49, 0.05)', borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StarIcon sx={{ color: '#F7B731', fontSize: 20 }} />
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#F7B731' }}>
                                {profile?.researchProfile?.citationCount || 0}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#718096' }}>
                                Citations
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Box>
                    </>
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Academic Information */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon sx={{ color: '#8b6cbc' }} />
                  Academic Information
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {editing ? (
                    <>
                      <TextField
                        label="Primary Institution"
                        value={editedProfile?.primaryInstitution || ''}
                        onChange={(e) => handleFieldChange('primaryInstitution', e.target.value)}
                        fullWidth
                      />
                      <TextField
                        label="Department"
                        value={editedProfile?.researchProfile?.department || ''}
                        onChange={(e) => handleNestedFieldChange('researchProfile', 'department', e.target.value)}
                        fullWidth
                      />
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <TextField
                          label="Start Month"
                          value={editedProfile?.startMonth || ''}
                          onChange={(e) => handleFieldChange('startMonth', e.target.value)}
                          placeholder="e.g., January"
                          sx={{ flex: 1, minWidth: 150 }}
                        />
                        <TextField
                          label="Start Year"
                          value={editedProfile?.startYear || ''}
                          onChange={(e) => handleFieldChange('startYear', e.target.value)}
                          placeholder="e.g., 2020"
                          sx={{ flex: 1, minWidth: 150 }}
                        />
                      </Box>
                    </>
                  ) : (
                    <>
                      {profile?.primaryInstitution && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <BusinessIcon sx={{ color: '#718096' }} />
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {profile.primaryInstitution}
                          </Typography>
                        </Box>
                      )}
                      {profile?.researchProfile?.department && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <WorkIcon sx={{ color: '#718096' }} />
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {profile.researchProfile.department}
                          </Typography>
                        </Box>
                      )}
                      {profile?.startMonth && profile?.startYear && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <CalendarIcon sx={{ color: '#718096' }} />
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            Started {profile.startMonth} {profile.startYear}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Two Column Layout */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
            {/* Left Column */}
            <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Research Profile Card */}
              <Card elevation={3}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ArticleIcon sx={{ color: '#8b6cbc' }} />
                    Research Profile
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Biography */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#4a5568' }}>
                        Biography
                      </Typography>
                      {editing ? (
                        <TextField
                          multiline
                          rows={4}
                          value={editedProfile?.researchProfile?.biography || ''}
                          onChange={(e) => handleNestedFieldChange('researchProfile', 'biography', e.target.value)}
                          placeholder="Tell us about your research background and journey..."
                          fullWidth
                        />
                      ) : (
                        <Typography variant="body2" sx={{ color: '#718096', lineHeight: 1.8 }}>
                          {profile?.researchProfile?.biography || 'No biography provided yet.'}
                        </Typography>
                      )}
                    </Box>

                    {/* Research Interests */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#4a5568' }}>
                        Research Interests
                      </Typography>
                      {editing ? (
                        <TextField
                          multiline
                          rows={3}
                          value={editedProfile?.researchProfile?.researchInterests || ''}
                          onChange={(e) => handleNestedFieldChange('researchProfile', 'researchInterests', e.target.value)}
                          placeholder="Describe your current and future research interests..."
                          fullWidth
                        />
                      ) : (
                        <Typography variant="body2" sx={{ color: '#718096', lineHeight: 1.8 }}>
                          {profile?.researchProfile?.researchInterests || 'No research interests specified yet.'}
                        </Typography>
                      )}
                    </Box>

                    {/* Specializations */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#4a5568' }}>
                        Specializations
                      </Typography>
                      {editing ? (
                        <EditableChipList
                          items={editedProfile?.researchProfile?.specialization || []}
                          onAdd={(value) => handleNestedFieldChange('researchProfile', 'specialization', [...(editedProfile?.researchProfile?.specialization || []), value])}
                          onRemove={(index) => handleNestedFieldChange('researchProfile', 'specialization', editedProfile?.researchProfile?.specialization.filter((_, i) => i !== index))}
                          placeholder="Add specialization (e.g., Molecular Biology)"
                        />
                      ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {profile?.researchProfile?.specialization?.length > 0 ? (
                            profile.researchProfile.specialization.map((spec, index) => (
                              <Chip
                                key={index}
                                label={spec}
                                icon={<SchoolIcon />}
                                sx={{ 
                                  bgcolor: 'rgba(139, 108, 188, 0.1)', 
                                  color: '#8b6cbc',
                                  fontWeight: 500,
                                }}
                              />
                            ))
                          ) : (
                            <Typography variant="body2" sx={{ color: '#a0aec0', fontStyle: 'italic' }}>
                              No specializations added yet
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>

                    {/* Keywords */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#4a5568' }}>
                        Research Keywords
                      </Typography>
                      {editing ? (
                        <EditableChipList
                          items={editedProfile?.researchProfile?.keywords || []}
                          onAdd={(value) => handleNestedFieldChange('researchProfile', 'keywords', [...(editedProfile?.researchProfile?.keywords || []), value])}
                          onRemove={(index) => handleNestedFieldChange('researchProfile', 'keywords', editedProfile?.researchProfile?.keywords.filter((_, i) => i !== index))}
                          placeholder="Add keyword (e.g., CRISPR, Machine Learning)"
                        />
                      ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {profile?.researchProfile?.keywords?.length > 0 ? (
                            profile.researchProfile.keywords.map((keyword, index) => (
                              <Chip
                                key={index}
                                label={keyword}
                                size="small"
                                sx={{ bgcolor: 'rgba(78, 205, 196, 0.1)', color: '#4ECDC4' }}
                              />
                            ))
                          ) : (
                            <Typography variant="body2" sx={{ color: '#a0aec0', fontStyle: 'italic' }}>
                              No keywords added yet
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Recent Publications Card */}
              <Card elevation={3}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ArticleIcon sx={{ color: '#8b6cbc' }} />
                      Recent Publications
                    </Typography>
                    <Chip label={publications.length} sx={{ bgcolor: '#8b6cbc', color: 'white', fontWeight: 600 }} />
                  </Box>

                  {publications.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {publications.slice(0, 5).map((pub, index) => (
                        <Paper 
                          key={pub.id} 
                          elevation={1} 
                          sx={{ 
                            p: 2.5, 
                            bgcolor: 'rgba(139, 108, 188, 0.02)',
                            border: '1px solid rgba(139, 108, 188, 0.1)',
                            borderRadius: 2,
                            '&:hover': {
                              bgcolor: 'rgba(139, 108, 188, 0.05)',
                              borderColor: 'rgba(139, 108, 188, 0.2)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#2d3748', lineHeight: 1.5 }}>
                            {pub.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="caption" sx={{ color: '#718096' }}>
                              {pub.journal} • {pub.year || new Date().getFullYear()}
                            </Typography>
                            {pub.doi && (
                              <Chip 
                                label="DOI"
                                size="small"
                                component="a"
                                href={`https://doi.org/${pub.doi}`}
                                target="_blank"
                                clickable
                                sx={{ 
                                  fontSize: '0.7rem',
                                  bgcolor: 'rgba(66, 153, 225, 0.1)',
                                  color: '#4299e1',
                                  '&:hover': { bgcolor: 'rgba(66, 153, 225, 0.2)' }
                                }}
                              />
                            )}
                          </Box>
                        </Paper>
                      ))}
                      {publications.length > 5 && (
                        <Button 
                          variant="text" 
                          sx={{ color: '#8b6cbc', fontWeight: 600 }}
                          href="/researcher/publications/manage"
                        >
                          View All {publications.length} Publications →
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <ArticleIcon sx={{ fontSize: 48, color: '#cbd5e0', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        No publications found
                      </Typography>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        href="/researcher/publications/import"
                        sx={{ 
                          borderColor: '#8b6cbc',
                          color: '#8b6cbc',
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

            {/* Right Column */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Research Metrics Card */}
              <Card elevation={3}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon sx={{ color: '#8b6cbc' }} />
                    Research Metrics
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {editing ? (
                      <>
                        <TextField
                          label="H-Index"
                          type="number"
                          value={editedProfile?.researchProfile?.hIndex || ''}
                          onChange={(e) => handleNestedFieldChange('researchProfile', 'hIndex', parseInt(e.target.value) || 0)}
                          fullWidth
                        />
                        <TextField
                          label="Citation Count"
                          type="number"
                          value={editedProfile?.researchProfile?.citationCount || ''}
                          onChange={(e) => handleNestedFieldChange('researchProfile', 'citationCount', parseInt(e.target.value) || 0)}
                          fullWidth
                        />
                      </>
                    ) : (
                      <>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            bgcolor: 'rgba(139, 108, 188, 0.05)',
                            border: '1px solid rgba(139, 108, 188, 0.1)',
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
                            bgcolor: 'rgba(78, 205, 196, 0.05)',
                            border: '1px solid rgba(78, 205, 196, 0.1)',
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="h3" sx={{ fontWeight: 800, color: '#4ECDC4', mb: 0.5 }}>
                            {profile?.researchProfile?.citationCount || 0}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500 }}>
                            Total Citations
                          </Typography>
                        </Paper>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Professional Links Card */}
              <Card elevation={3}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinkIcon sx={{ color: '#8b6cbc' }} />
                    Professional Links
                  </Typography>

                  {editing ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        label="Personal Website"
                        value={editedProfile?.researchProfile?.website || ''}
                        onChange={(e) => handleNestedFieldChange('researchProfile', 'website', e.target.value)}
                        placeholder="https://yourwebsite.com"
                        fullWidth
                        InputProps={{
                          startAdornment: <WebIcon sx={{ mr: 1, color: '#718096' }} />
                        }}
                      />
                      <TextField
                        label="LinkedIn"
                        value={editedProfile?.researchProfile?.linkedin || ''}
                        onChange={(e) => handleNestedFieldChange('researchProfile', 'linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        fullWidth
                        InputProps={{
                          startAdornment: <LinkedInIcon sx={{ mr: 1, color: '#0077b5' }} />
                        }}
                      />
                      <TextField
                        label="Twitter"
                        value={editedProfile?.researchProfile?.twitter || ''}
                        onChange={(e) => handleNestedFieldChange('researchProfile', 'twitter', e.target.value)}
                        placeholder="@username"
                        fullWidth
                        InputProps={{
                          startAdornment: <TwitterIcon sx={{ mr: 1, color: '#1da1f2' }} />
                        }}
                      />
                      <TextField
                        label="Google Scholar"
                        value={editedProfile?.researchProfile?.googleScholar || ''}
                        onChange={(e) => handleNestedFieldChange('researchProfile', 'googleScholar', e.target.value)}
                        placeholder="https://scholar.google.com/..."
                        fullWidth
                        InputProps={{
                          startAdornment: <SchoolIcon sx={{ mr: 1, color: '#4285f4' }} />
                        }}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {profile?.researchProfile?.website && (
                        <MuiLink 
                          href={profile.researchProfile.website} 
                          target="_blank"
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            color: '#8b6cbc',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          <WebIcon sx={{ fontSize: 18 }} />
                          <Typography variant="body2">Personal Website</Typography>
                        </MuiLink>
                      )}
                      {profile?.researchProfile?.linkedin && (
                        <MuiLink 
                          href={profile.researchProfile.linkedin} 
                          target="_blank"
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            color: '#0077b5',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          <LinkedInIcon sx={{ fontSize: 18 }} />
                          <Typography variant="body2">LinkedIn</Typography>
                        </MuiLink>
                      )}
                      {profile?.researchProfile?.twitter && (
                        <MuiLink 
                          href={`https://twitter.com/${profile.researchProfile.twitter.replace('@', '')}`}
                          target="_blank"
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            color: '#1da1f2',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          <TwitterIcon sx={{ fontSize: 18 }} />
                          <Typography variant="body2">{profile.researchProfile.twitter}</Typography>
                        </MuiLink>
                      )}
                      {profile?.researchProfile?.googleScholar && (
                        <MuiLink 
                          href={profile.researchProfile.googleScholar} 
                          target="_blank"
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            color: '#4285f4',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          <SchoolIcon sx={{ fontSize: 18 }} />
                          <Typography variant="body2">Google Scholar</Typography>
                        </MuiLink>
                      )}
                      {!profile?.researchProfile?.website && 
                       !profile?.researchProfile?.linkedin && 
                       !profile?.researchProfile?.twitter && 
                       !profile?.researchProfile?.googleScholar && (
                        <Typography variant="body2" sx={{ color: '#a0aec0', fontStyle: 'italic' }}>
                          No professional links added yet
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* ORCID Data Card */}
              {orcidData && (
                <Card elevation={3} sx={{ bgcolor: 'rgba(166, 206, 57, 0.05)', border: '1px solid rgba(166, 206, 57, 0.2)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                      <Avatar sx={{ bgcolor: '#a6ce39', width: 36, height: 36 }}>
                        <LinkIcon />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                        ORCID Information
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      {orcidData.employments && orcidData.employments.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#4a5568', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <WorkIcon sx={{ fontSize: 16 }} /> Employment History
                          </Typography>
                          {orcidData.employments.slice(0, 3).map((emp, index) => (
                            <Box key={index} sx={{ mb: 1.5, pl: 2, borderLeft: '2px solid rgba(166, 206, 57, 0.3)' }}>
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
                            <Box key={index} sx={{ mb: 1.5, pl: 2, borderLeft: '2px solid rgba(166, 206, 57, 0.3)' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#2d3748' }}>
                                {edu.degree || 'Degree'}
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
                        sx={{
                          borderColor: '#a6ce39',
                          color: '#a6ce39',
                          '&:hover': {
                            borderColor: '#8eb82e',
                            bgcolor: 'rgba(166, 206, 57, 0.1)',
                          },
                        }}
                      >
                        View Full ORCID Profile
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Box>
        </Box>
      </Container>
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
