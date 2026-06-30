import { useTranslation } from 'react-i18next';
import React from 'react';
import { Box, Paper, Typography, Stack, Chip } from '@mui/material';
import { THEME_COLORS } from './styles/theme';

const NetworkLegend = () => {
  const { t } = useTranslation();

  const legendItems = [
    {
      label: t('research_network.you_lead'),
      color: THEME_COLORS.lead,
      description: t('research_network.you_lead_desc')
    },
    {
      label: t('research_network.direct_collab'),
      color: THEME_COLORS.directCollab,
      description: t('research_network.direct_collab_desc')
    },
    {
      label: t('research_network.pending_invitations'),
      color: THEME_COLORS.pending,
      description: t('research_network.pending_invite_desc')
    }
  ];

  const collaborationTypes = [
    { label: t('research_network.publications'), icon: '📄', description: t('research_network.co_authored_publications') },
    { label: t('research_network.manuscripts'), icon: '📝', description: t('research_network.collaborative_manuscripts') },
    { label: t('research_network.proposals'), icon: '🔬', description: t('research_network.research_proposals') }
  ];

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        p: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        minWidth: 280,
        maxWidth: 320,
        zIndex: 10
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
        {t('research_network.network_legend')}
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {t('research_network.node_types')}
        </Typography>
        <Stack spacing={1}>
          {legendItems.map((item) => (
            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: item.color,
                  flexShrink: 0,
                  border: '2px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" fontWeight={600} sx={{ display: 'block', lineHeight: 1.2 }}>
                  {item.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}>
                  {item.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>

      <Box>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {t('research_network.collaboration_sources')}
        </Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
          {collaborationTypes.map((type) => (
            <Chip
              key={type.label}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>{type.icon}</span>
                  <span style={{ fontSize: '0.7rem' }}>{type.label}</span>
                </Box>
              }
              size="small"
              variant="outlined"
              sx={{ 
                fontSize: '0.7rem',
                height: 24,
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          ))}
        </Stack>
      </Box>

      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', lineHeight: 1.4 }}>
          💡 <strong>{t('research_network.legend_tip')}</strong>
        </Typography>
      </Box>
    </Paper>
  );
};

export default NetworkLegend;
