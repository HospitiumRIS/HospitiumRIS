import React from 'react';
import { Box, Paper, Typography, Stack, Chip } from '@mui/material';
import { THEME_COLORS } from './styles/theme';

const NetworkLegend = () => {
  const legendItems = [
    {
      label: 'You (Lead Investigator)',
      color: THEME_COLORS.lead,
      description: 'Your position in the network'
    },
    {
      label: 'Direct Collaborator',
      color: THEME_COLORS.directCollab,
      description: 'Researchers you collaborate with directly'
    },
    {
      label: 'Pending Invitation',
      color: THEME_COLORS.pending,
      description: 'Manuscript collaborators with pending invitations'
    }
  ];

  const collaborationTypes = [
    { label: 'Publications', icon: '📄', description: 'Co-authored publications' },
    { label: 'Manuscripts', icon: '📝', description: 'Collaborative manuscripts' },
    { label: 'Proposals', icon: '🔬', description: 'Research proposals' }
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
        Network Legend
      </Typography>

      {/* Node Types */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Node Types
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

      {/* Collaboration Sources */}
      <Box>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Collaboration Sources
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

      {/* Interaction Hints */}
      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', lineHeight: 1.4 }}>
          💡 <strong>Tip:</strong> Click on any node to view detailed researcher information and shared work.
        </Typography>
      </Box>
    </Paper>
  );
};

export default NetworkLegend;
