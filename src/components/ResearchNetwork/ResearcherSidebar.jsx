import { useTranslation } from 'react-i18next';
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

const ResearcherSidebar = ({ open, onClose, researcher, publications, manuscripts, proposals, allResearchers, onSelectResearcher }) => {
  const { t } = useTranslation();
  const [showPublications, setShowPublications] = useState(false);
  const [showManuscripts, setShowManuscripts] = useState(false);
  const [showProposals, setShowProposals] = useState(false);

  if (!researcher) return null;

  const getInitials = (name) => {
    return (name || '?')
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

  const sharedProposals = proposals?.filter(p =>
    p.coInvestigators?.includes(researcher.id)
  ) || [];

  // Renders a row of clickable collaborator chips for a given work item
  const renderCollaboratorChips = (collaboratorIds = [], pendingIds = []) => {
    const ids = collaboratorIds.filter(id => id !== researcher.id);
    if (ids.length === 0) return null;

    return (
      <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5, mt: 1 }}>
        {ids.map(id => {
          const person = allResearchers?.find(r => r.id === id);
          const isPendingPerson = pendingIds.includes(id);
          const bgColor = person?.isLead ? '#fbbf24' : isPendingPerson ? '#94a3b8' : '#8b6cbc';

          return (
            <Chip
              key={id}
              size="small"
              clickable={!!person}
              onClick={() => person && onSelectResearcher?.(person)}
              avatar={
                <Avatar sx={{ bgcolor: bgColor, color: 'white', fontSize: '0.6rem', width: 20, height: 20 }}>
                  {getInitials(person?.name)}
                </Avatar>
              }
              label={person?.name || t('common.unknown')}
              sx={{
                height: 24,
                fontSize: '0.7rem',
                bgcolor: 'white',
                border: '1px solid',
                borderColor: '#e2e8f0',
                cursor: person ? 'pointer' : 'default',
                '&:hover': person ? { bgcolor: '#f5f0fa', borderColor: '#8b6cbc' } : undefined
              }}
            />
          );
        })}
      </Stack>
    );
  };

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
        {/* Header - Purple background */}
        <Box sx={{
          p: 2.5,
          background: '#8b6cbc',
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
                {researcher.isLead ? t('research_network.lead_current_user') : t('research_network.collaborator')}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PersonIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }} />
            <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>
              {researcher.role || t('research_network.researcher')}
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
                label={t('research_network.pending')} 
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
            {t('research_network.collaboration_stats')}
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
                {t('research_network.publications')}
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
                {t('research_network.manuscripts')}
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
                  {t('research_network.proposals')}
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
                {t('research_network.specialization')}
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
                      {t('research_network.citations')}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {researcher.globalCitations}
                    </Typography>
                  </Box>
                )}
                {researcher.hIndex > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mb: 0.25 }}>
                      {t('research_network.h_index')}
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
                    {t('research_network.shared_publications')}
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
                        {pub.journal || t('common.unknown')} • {pub.year || t('common.not_available')}
                      </Typography>
                    </Box>
                  ))}
                  {sharedPublications.length > 5 && (
                    <Typography variant="caption" color="primary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      {t('research_network.more_count', { count: sharedPublications.length - 5 })}
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
                    {t('research_network.shared_manuscripts')}
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
                          label={ms.type || t('research_network.manuscript')} 
                          size="small" 
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                        <Chip
                          label={ms.status || t('common.draft')}
                          size="small"
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      </Stack>
                      {renderCollaboratorChips(ms.collaborators, ms.pendingInvitations)}
                    </Box>
                  ))}
                  {sharedManuscripts.length > 5 && (
                    <Typography variant="caption" color="primary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      {t('research_network.more_count', { count: sharedManuscripts.length - 5 })}
                    </Typography>
                  )}
                </Box>
              </Collapse>
            </Box>
          )}

          {/* Shared Proposals - Collapsible */}
          {sharedProposals.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <Button
                fullWidth
                onClick={() => setShowProposals(!showProposals)}
                endIcon={showProposals ? <ExpandLessIcon /> : <ExpandMoreIcon />}
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
                  <AssignmentIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                  <Typography variant="body2" fontWeight={600}>
                    {t('research_network.shared_proposals')}
                  </Typography>
                  <Chip
                    label={sharedProposals.length}
                    size="small"
                    sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#f59e0b', color: 'white' }}
                  />
                </Box>
              </Button>
              <Collapse in={showProposals}>
                <Box sx={{ mt: 1.5, pl: 1 }}>
                  {sharedProposals.slice(0, 5).map((p, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        mb: 1.5,
                        pb: 1.5,
                        borderBottom: idx < Math.min(4, sharedProposals.length - 1) ? '1px solid' : 'none',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, fontSize: '0.875rem', lineHeight: 1.4 }}>
                        {p.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {p.status || t('common.draft')}
                      </Typography>
                      {renderCollaboratorChips(p.coInvestigators)}
                    </Box>
                  ))}
                  {sharedProposals.length > 5 && (
                    <Typography variant="caption" color="primary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      {t('research_network.more_count', { count: sharedProposals.length - 5 })}
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
              background: '#8b6cbc',
              py: 1.25,
              borderRadius: 2,
              '&:hover': {
                background: '#7a5aa8',
              }
            }}
          >
            {t('research_network.view_profile')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ResearcherSidebar;
