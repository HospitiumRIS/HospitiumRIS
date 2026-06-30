import { useTranslation } from 'react-i18next';
import React from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  Chip, 
  Stack,
  Tooltip,
  Paper,
  Autocomplete
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

const NetworkControls = ({ 
  stats,
  onFilterClick,
  onZoomIn,
  onZoomOut,
  onCenter,
  onExport,
  nodes,
  onNodeSelect
}) => {
  const { t } = useTranslation();
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        mb: 2,
        borderRadius: 2,
        backgroundColor: '#ffffff'
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        {/* Statistics Chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ flex: 1 }}>
          <Chip 
            label={`${stats.totalNodes} ${t('research_network.researchers')}`} 
            color="primary" 
            size="small"
            sx={{ fontWeight: 600 }}
          />
          <Chip 
            label={`${stats.directCollaborators} ${t('research_network.direct')}`} 
            color="secondary" 
            size="small"
          />
          {stats.pendingInvitations > 0 && (
            <Chip 
              label={`${stats.pendingInvitations} ${t('research_network.pending')}`} 
              color="warning" 
              size="small"
            />
          )}
          <Chip 
            label={`${stats.totalPublications} ${t('research_network.publications')}`} 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={`${stats.totalManuscripts} ${t('research_network.manuscripts')}`} 
            variant="outlined" 
            size="small"
          />
          {stats.totalProposals > 0 && (
            <Chip 
              label={`${stats.totalProposals} ${t('research_network.proposals')}`} 
              variant="outlined" 
              size="small"
            />
          )}
        </Stack>

        {/* Search Bar - Autocomplete */}
        <Autocomplete
          size="small"
          options={nodes || []}
          getOptionLabel={(option) => option.name || ''}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Box>
                <Box sx={{ fontWeight: 500 }}>{option.name}</Box>
                <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  {option.institution} • {option.specialization?.split(',')[0]}
                </Box>
              </Box>
            </Box>
          )}
          onChange={(event, value) => {
            if (value) {
              onNodeSelect(value);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t('research_network.search_researchers')}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    {params.InputProps.startAdornment}
                  </>
                )
              }}
            />
          )}
          sx={{ minWidth: 300 }}
        />

        {/* Control Buttons */}
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={t('research_network.filter')}>
            <IconButton size="small" onClick={onFilterClick}>
              <FilterIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('research_network.zoom_in')}>
            <IconButton size="small" onClick={onZoomIn}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('research_network.zoom_out')}>
            <IconButton size="small" onClick={onZoomOut}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('research_network.center_view')}>
            <IconButton size="small" onClick={onCenter}>
              <CenterIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('research_network.export_png')}>
            <IconButton size="small" onClick={onExport}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default NetworkControls;
