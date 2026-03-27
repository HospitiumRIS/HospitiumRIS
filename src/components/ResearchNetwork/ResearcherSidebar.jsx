import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Stack,
  Divider,
  Button,
  Collapse,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Article as ArticleIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

const ResearcherSidebar = ({ open, onClose, researcher, publications, manuscripts }) => {
  const [showPublications, setShowPublications] = useState(false);
  const [showManuscripts, setShowManuscripts] = useState(false);

  if (!researcher) return null;

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const sharedPublications = publications?.filter(pub => 
    pub.co_authors?.includes(researcher.id)
  ) || [];

  const sharedManuscripts = manuscripts?.filter(ms => 
    ms.collaborators?.includes(researcher.id)
  ) || [];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 450 },
          p: 0
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
        {/* Header - Purple gradient background */}
        <Box sx={{ 
          p: 2.5, 
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white',
          position: 'relative'
        }}>
          <IconButton 
            onClick={onClose} 
            size="small" 
            sx={{ 
              position: 'absolute',
              top: 12,
              right: 12,
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '1.25rem',
                fontWeight: 600,
                border: '2px solid rgba(255,255,255,0.3)'
              }}
            >
              {getInitials(researcher.name)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1.1rem', color: 'white' }}>
                {researcher.name}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>
                {researcher.isLead ? 'Lead Investigator / Current User' : 'Collaborator'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PersonIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }} />
            <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>
              {researcher.role || 'Researcher'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <BusinessIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }} />
            <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>
              {researcher.institution}
            </Typography>
          </Box>

          <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.75 }}>
            {researcher.isPending && (
              <Chip 
                label="Pending" 
                size="small" 
                sx={{ 
                  height: 22, 
                  fontSize: '0.7rem',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 500,
                  border: '1px solid rgba(255,255,255,0.3)'
                }} 
              />
            )}
            {researcher.orcidId && (
              <Chip 
                label={`ORCID: ${researcher.orcidId}`}
                size="small" 
                sx={{ 
                  height: 22, 
                  fontSize: '0.7rem',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 500,
                  border: '1px solid rgba(255,255,255,0.3)'
                }} 
              />
            )}
          </Stack>
        </Box>

        {/* Statistics - Compact */}
        <Box sx={{ p: 2.5, bgcolor: 'white' }}>
          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Collaboration Stats
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <Box sx={{ 
              flex: 1, 
              p: 1.5, 
              bgcolor: '#f1f5f9',
              borderRadius: 2,
              textAlign: 'center'
            }}>
              <Typography variant="h5" sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', mb: 0.25 }}>
                {researcher.publicationsCount || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Publications
              </Typography>
            </Box>
            <Box sx={{ 
              flex: 1, 
              p: 1.5, 
              bgcolor: '#f1f5f9',
              borderRadius: 2,
              textAlign: 'center'
            }}>
              <Typography variant="h5" sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', mb: 0.25 }}>
                {researcher.manuscriptsCount || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Manuscripts
              </Typography>
            </Box>
            {researcher.proposalsCount > 0 && (
              <Box sx={{ 
                flex: 1, 
                p: 1.5, 
                bgcolor: '#f1f5f9',
                borderRadius: 2,
                textAlign: 'center'
              }}>
                <Typography variant="h5" sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', mb: 0.25 }}>
                  {researcher.proposalsCount}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Proposals
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Content - Scrollable */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
          {researcher.specialization && (
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Specialization
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.75 }}>
                {researcher.specialization.split(',').map((spec, idx) => (
                  <Chip 
                    key={idx} 
                    label={spec.trim()} 
                    size="small" 
                    variant="outlined"
                    sx={{ height: 24, fontSize: '0.75rem' }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {(researcher.globalCitations > 0 || researcher.hIndex > 0) && (
            <Box sx={{ mb: 2.5, p: 1.5, bgcolor: '#f1f5f9', borderRadius: 2 }}>
              <Stack direction="row" spacing={3}>
                {researcher.globalCitations > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mb: 0.25 }}>
                      Citations
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {researcher.globalCitations}
                    </Typography>
                  </Box>
                )}
                {researcher.hIndex > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mb: 0.25 }}>
                      H-Index
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {researcher.hIndex}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          )}

          {/* Shared Publications - Collapsible */}
          {sharedPublications.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <Button
                fullWidth
                onClick={() => setShowPublications(!showPublications)}
                endIcon={showPublications ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ 
                  justifyContent: 'space-between',
                  textTransform: 'none',
                  color: 'text.primary',
                  bgcolor: 'white',
                  border: '1px solid',
                  borderColor: '#e2e8f0',
                  borderRadius: 2,
                  p: 1.25,
                  '&:hover': {
                    bgcolor: '#f8fafc',
                    borderColor: '#cbd5e1'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArticleIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                  <Typography variant="body2" fontWeight={600}>
                    Shared Manuscripts
                  </Typography>
                  <Chip 
                    label={sharedPublications.length} 
                    size="small" 
                    sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#6366f1', color: 'white' }}
                  />
                </Box>
              </Button>
              <Collapse in={showPublications}>
                <Box sx={{ mt: 1.5, pl: 1 }}>
                  {sharedPublications.slice(0, 5).map((pub, idx) => (
                    <Box 
                      key={idx} 
                      sx={{ 
                        mb: 1.5,
                        pb: 1.5,
                        borderBottom: idx < Math.min(4, sharedPublications.length - 1) ? '1px solid' : 'none',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, fontSize: '0.875rem', lineHeight: 1.4 }}>
                        {pub.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {pub.journal || 'Unknown'} • {pub.year || 'N/A'}
                      </Typography>
                    </Box>
                  ))}
                  {sharedPublications.length > 5 && (
                    <Typography variant="caption" color="primary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      +{sharedPublications.length - 5} more
                    </Typography>
                  )}
                </Box>
              </Collapse>
            </Box>
          )}

          {/* Shared Manuscripts - Collapsible */}
          {sharedManuscripts.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <Button
                fullWidth
                onClick={() => setShowManuscripts(!showManuscripts)}
                endIcon={showManuscripts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ 
                  justifyContent: 'space-between',
                  textTransform: 'none',
                  color: 'text.primary',
                  bgcolor: 'white',
                  border: '1px solid',
                  borderColor: '#e2e8f0',
                  borderRadius: 2,
                  p: 1.25,
                  '&:hover': {
                    bgcolor: '#f8fafc',
                    borderColor: '#cbd5e1'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DescriptionIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />
                  <Typography variant="body2" fontWeight={600}>
                    Shared Manuscripts
                  </Typography>
                  <Chip 
                    label={sharedManuscripts.length} 
                    size="small" 
                    sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#8b5cf6', color: 'white' }}
                  />
                </Box>
              </Button>
              <Collapse in={showManuscripts}>
                <Box sx={{ mt: 1.5, pl: 1 }}>
                  {sharedManuscripts.slice(0, 5).map((ms, idx) => (
                    <Box 
                      key={idx} 
                      sx={{ 
                        mb: 1.5,
                        pb: 1.5,
                        borderBottom: idx < Math.min(4, sharedManuscripts.length - 1) ? '1px solid' : 'none',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, fontSize: '0.875rem', lineHeight: 1.4 }}>
                        {ms.title}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        <Chip 
                          label={ms.type || 'Manuscript'} 
                          size="small" 
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                        <Chip 
                          label={ms.status || 'Draft'} 
                          size="small" 
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      </Stack>
                    </Box>
                  ))}
                  {sharedManuscripts.length > 5 && (
                    <Typography variant="caption" color="primary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      +{sharedManuscripts.length - 5} more
                    </Typography>
                  )}
                </Box>
              </Collapse>
            </Box>
          )}
        </Box>

        {/* Actions - Footer */}
        <Box sx={{ p: 2.5, bgcolor: 'white', borderTop: 1, borderColor: 'divider' }}>
          <Button 
            variant="contained" 
            fullWidth 
            startIcon={<PersonIcon />}
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              py: 1.25,
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              }
            }}
          >
            View Profile
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ResearcherSidebar;
