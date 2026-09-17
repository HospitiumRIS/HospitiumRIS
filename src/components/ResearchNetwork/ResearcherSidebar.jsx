import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Stack,
  Button,
  Collapse,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Article as ArticleIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';

const PURPLE = '#8b6cbc';

const SectionLabel = ({ children }) => (
  <Typography
    variant="caption"
    sx={{
      fontWeight: 700,
      color: '#64748b',
      mb: 1.25,
      display: 'block',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontSize: '0.68rem',
    }}
  >
    {children}
  </Typography>
);

const AccordionRow = ({ icon, iconColor, title, count, open, onToggle, children }) => (
  <Box sx={{ mb: 1.25 }}>
    <Box
      onClick={onToggle}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        p: 1.25,
        borderRadius: 2,
        border: '1px solid',
        borderColor: open ? alpha(iconColor, 0.35) : alpha(PURPLE, 0.12),
        bgcolor: open ? alpha(iconColor, 0.06) : 'background.paper',
        cursor: 'pointer',
        transition: 'all 0.18s',
        '&:hover': {
          borderColor: alpha(iconColor, 0.4),
          bgcolor: alpha(iconColor, 0.06),
          transform: 'translateY(-1px)',
          boxShadow: `0 4px 12px ${alpha(iconColor, 0.12)}`,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: alpha(iconColor, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 17, color: iconColor } })}
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
          {title}
        </Typography>
        <Chip
          label={count}
          size="small"
          sx={{
            height: 20,
            minWidth: 20,
            fontSize: '0.68rem',
            fontWeight: 700,
            bgcolor: iconColor,
            color: 'white',
          }}
        />
      </Box>
      {open
        ? <ExpandLessIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
        : <ExpandMoreIcon sx={{ fontSize: 18, color: '#94a3b8' }} />}
    </Box>
    <Collapse in={open}>
      <Box
        sx={{
          mt: 1,
          p: 1.25,
          borderRadius: 2,
          bgcolor: alpha(PURPLE, 0.04),
          border: `1px solid ${alpha(PURPLE, 0.08)}`,
        }}
      >
        {children}
      </Box>
    </Collapse>
  </Box>
);

const ResearcherSidebar = ({ open, onClose, researcher, publications, manuscripts, proposals, allResearchers, onSelectResearcher }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [showPublications, setShowPublications] = useState(false);
  const [showManuscripts, setShowManuscripts] = useState(false);
  const [showProposals, setShowProposals] = useState(false);

  if (!researcher) return null;

  const getInitials = (name) =>
    (name || '?')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

  const sharedPublications = publications?.filter((pub) => pub.co_authors?.includes(researcher.id)) || [];
  const sharedManuscripts = manuscripts?.filter((ms) => ms.collaborators?.includes(researcher.id)) || [];
  const sharedProposals = proposals?.filter((p) => p.coInvestigators?.includes(researcher.id)) || [];

  const renderCollaboratorChips = (collaboratorIds = [], pendingIds = []) => {
    const ids = collaboratorIds.filter((id) => id !== researcher.id);
    if (ids.length === 0) return null;

    return (
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
        {ids.map((id) => {
          const person = allResearchers?.find((r) => r.id === id);
          const isPendingPerson = pendingIds.includes(id);
          const bgColor = person?.isLead ? '#fbbf24' : isPendingPerson ? '#94a3b8' : PURPLE;

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
                borderColor: alpha(PURPLE, 0.18),
                cursor: person ? 'pointer' : 'default',
                '&:hover': person ? { bgcolor: alpha(PURPLE, 0.06), borderColor: PURPLE } : undefined,
              }}
            />
          );
        })}
      </Stack>
    );
  };

  const stats = [
    { value: researcher.publicationsCount || 0, label: t('research_network.publications'), color: PURPLE },
    { value: researcher.manuscriptsCount || 0, label: t('research_network.manuscripts'), color: '#a084d1' },
    ...(researcher.proposalsCount > 0
      ? [{ value: researcher.proposalsCount, label: t('research_network.proposals'), color: '#7a5cb0' }]
      : []),
  ];

  const handleViewProfile = () => {
    if (researcher.isLead) router.push('/researcher/profile');
    else if (researcher.id) router.push(`/researcher/profile/${researcher.id}`);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          p: 0,
          borderTopLeftRadius: { xs: 0, sm: 16 },
          borderBottomLeftRadius: { xs: 0, sm: 16 },
          overflow: 'hidden',
          boxShadow: '-12px 0 40px rgba(139, 108, 188, 0.18)',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
        <Box
          sx={{
            p: 2.75,
            pr: 5,
            background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -40,
              right: -30,
              width: 140,
              height: 140,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.12)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -50,
              left: -20,
              width: 120,
              height: 120,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.08)',
            },
          }}
        >
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 1,
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.16)',
              backdropFilter: 'blur(8px)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, mb: 2, position: 'relative', zIndex: 1 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'rgba(255,255,255,0.22)',
                color: 'white',
                fontSize: '1.35rem',
                fontWeight: 700,
                border: '2px solid rgba(255,255,255,0.45)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
              }}
            >
              {getInitials(researcher.name)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: 'white', lineHeight: 1.25, mb: 0.35 }}>
                {researcher.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem' }}>
                {researcher.isLead ? t('research_network.lead_current_user') : t('research_network.collaborator')}
              </Typography>
            </Box>
          </Box>

          <Stack spacing={0.85} sx={{ position: 'relative', zIndex: 1, mb: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PersonIcon sx={{ fontSize: 13 }} />
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.92)' }}>
                {researcher.role || t('research_network.researcher')}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BusinessIcon sx={{ fontSize: 13 }} />
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.92)' }}>
                {researcher.institution}
              </Typography>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ position: 'relative', zIndex: 1 }}>
            {researcher.isPending && (
              <Chip
                label={t('research_network.pending')}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.35)',
                }}
              />
            )}
            {researcher.orcidId && (
              <Chip
                label={`ORCID: ${researcher.orcidId}`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.35)',
                }}
              />
            )}
          </Stack>
        </Box>

        <Box sx={{ p: 2.25, bgcolor: 'white', borderBottom: `1px solid ${alpha(PURPLE, 0.1)}` }}>
          <SectionLabel>{t('research_network.collaboration_stats')}</SectionLabel>
          <Stack direction="row" spacing={1}>
            {stats.map((item) => (
              <Box
                key={item.label}
                sx={{
                  flex: 1,
                  py: 1.5,
                  px: 1,
                  borderRadius: 2,
                  textAlign: 'center',
                  bgcolor: alpha(item.color, 0.07),
                  border: `1px solid ${alpha(item.color, 0.14)}`,
                }}
              >
                <Typography variant="h5" sx={{ fontSize: '1.45rem', fontWeight: 700, color: item.color, lineHeight: 1.15, mb: 0.25 }}>
                  {item.value}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2.25 }}>
          {researcher.specialization && (
            <Box sx={{ mb: 2.25 }}>
              <SectionLabel>{t('research_network.specialization')}</SectionLabel>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {researcher.specialization.split(',').map((spec, idx) => (
                  <Chip
                    key={idx}
                    label={spec.trim()}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      bgcolor: alpha(PURPLE, 0.1),
                      color: PURPLE,
                      border: `1px solid ${alpha(PURPLE, 0.18)}`,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {(researcher.globalCitations > 0 || researcher.hIndex > 0) && (
            <Box
              sx={{
                mb: 2.25,
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(PURPLE, 0.05),
                border: `1px solid ${alpha(PURPLE, 0.12)}`,
              }}
            >
              <Stack direction="row" spacing={3}>
                {researcher.globalCitations > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#64748b', display: 'block', mb: 0.25 }}>
                      {t('research_network.citations')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: PURPLE }}>
                      {researcher.globalCitations}
                    </Typography>
                  </Box>
                )}
                {researcher.hIndex > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#64748b', display: 'block', mb: 0.25 }}>
                      {t('research_network.h_index')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: PURPLE }}>
                      {researcher.hIndex}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          )}

          {sharedPublications.length > 0 && (
            <AccordionRow
              icon={<ArticleIcon />}
              iconColor={PURPLE}
              title={t('research_network.shared_publications')}
              count={sharedPublications.length}
              open={showPublications}
              onToggle={() => setShowPublications(!showPublications)}
            >
              {sharedPublications.slice(0, 5).map((pub, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.25,
                    mb: idx < Math.min(4, sharedPublications.length - 1) ? 1 : 0,
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.4, fontSize: '0.82rem', lineHeight: 1.4 }}>
                    {pub.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                    {pub.journal || t('common.unknown')} • {pub.year || t('common.not_available')}
                  </Typography>
                </Box>
              ))}
              {sharedPublications.length > 5 && (
                <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600, color: PURPLE, display: 'block', mt: 1 }}>
                  {t('research_network.more_count', { count: sharedPublications.length - 5 })}
                </Typography>
              )}
            </AccordionRow>
          )}

          {sharedManuscripts.length > 0 && (
            <AccordionRow
              icon={<DescriptionIcon />}
              iconColor="#a084d1"
              title={t('research_network.shared_manuscripts')}
              count={sharedManuscripts.length}
              open={showManuscripts}
              onToggle={() => setShowManuscripts(!showManuscripts)}
            >
              {sharedManuscripts.slice(0, 5).map((ms, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.25,
                    mb: idx < Math.min(4, sharedManuscripts.length - 1) ? 1 : 0,
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.82rem', lineHeight: 1.4 }}>
                    {ms.title}
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ mb: 0.25 }}>
                    <Chip label={ms.type || t('research_network.manuscript')} size="small" sx={{ height: 18, fontSize: '0.63rem', bgcolor: alpha(PURPLE, 0.1), color: PURPLE }} />
                    <Chip label={ms.status || t('common.draft')} size="small" sx={{ height: 18, fontSize: '0.63rem' }} />
                  </Stack>
                  {renderCollaboratorChips(ms.collaborators, ms.pendingInvitations)}
                </Box>
              ))}
              {sharedManuscripts.length > 5 && (
                <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600, color: PURPLE, display: 'block', mt: 1 }}>
                  {t('research_network.more_count', { count: sharedManuscripts.length - 5 })}
                </Typography>
              )}
            </AccordionRow>
          )}

          {sharedProposals.length > 0 && (
            <AccordionRow
              icon={<AssignmentIcon />}
              iconColor="#7a5cb0"
              title={t('research_network.shared_proposals')}
              count={sharedProposals.length}
              open={showProposals}
              onToggle={() => setShowProposals(!showProposals)}
            >
              {sharedProposals.slice(0, 5).map((p, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.25,
                    mb: idx < Math.min(4, sharedProposals.length - 1) ? 1 : 0,
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.4, fontSize: '0.82rem', lineHeight: 1.4 }}>
                    {p.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                    {p.status || t('common.draft')}
                  </Typography>
                  {renderCollaboratorChips(p.coInvestigators)}
                </Box>
              ))}
              {sharedProposals.length > 5 && (
                <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600, color: PURPLE, display: 'block', mt: 1 }}>
                  {t('research_network.more_count', { count: sharedProposals.length - 5 })}
                </Typography>
              )}
            </AccordionRow>
          )}
        </Box>

        <Box sx={{ p: 2.25, bgcolor: 'white', borderTop: `1px solid ${alpha(PURPLE, 0.1)}` }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<PersonIcon />}
            endIcon={<ArrowIcon sx={{ fontSize: 16 }} />}
            onClick={handleViewProfile}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: PURPLE,
              py: 1.2,
              borderRadius: 2,
              boxShadow: `0 6px 16px ${alpha(PURPLE, 0.28)}`,
              '&:hover': { bgcolor: '#7a5cb0', boxShadow: `0 8px 20px ${alpha(PURPLE, 0.35)}` },
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
