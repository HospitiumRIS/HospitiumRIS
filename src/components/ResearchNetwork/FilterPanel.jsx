import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Slider,
  Chip,
  Stack,
  Button
} from '@mui/material';
import {
  Close as CloseIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

const FilterPanel = ({ open, onClose, nodes, filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState(filters || {
    collaborationTypes: [],
    institutions: [],
    specializations: [],
    publicationRange: [0, 100]
  });

  // Extract unique institutions and specializations from nodes
  const institutions = [...new Set(nodes.map(n => n.institution))].filter(Boolean);
  const specializations = [...new Set(
    nodes.flatMap(n => n.specialization?.split(',').map(s => s.trim()) || [])
  )].filter(Boolean);

  const handleCollaborationTypeChange = (type) => {
    const current = localFilters.collaborationTypes || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    setLocalFilters({ ...localFilters, collaborationTypes: updated });
  };

  const handleInstitutionChange = (institution) => {
    const current = localFilters.institutions || [];
    const updated = current.includes(institution)
      ? current.filter(i => i !== institution)
      : [...current, institution];
    setLocalFilters({ ...localFilters, institutions: updated });
  };

  const handleSpecializationChange = (specialization) => {
    const current = localFilters.specializations || [];
    const updated = current.includes(specialization)
      ? current.filter(s => s !== specialization)
      : [...current, specialization];
    setLocalFilters({ ...localFilters, specializations: updated });
  };

  const handlePublicationRangeChange = (event, newValue) => {
    setLocalFilters({ ...localFilters, publicationRange: newValue });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      collaborationTypes: [],
      institutions: [],
      specializations: [],
      publicationRange: [0, 100]
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const maxPublications = Math.max(...nodes.map(n => n.publicationsCount || 0), 100);

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 350 },
          p: 0
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Filters
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Filter Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {/* Collaboration Type Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Collaboration Type
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localFilters.collaborationTypes?.includes('lead') || false}
                    onChange={() => handleCollaborationTypeChange('lead')}
                    size="small"
                  />
                }
                label="Lead Investigator"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localFilters.collaborationTypes?.includes('direct') || false}
                    onChange={() => handleCollaborationTypeChange('direct')}
                    size="small"
                  />
                }
                label="Direct Collaborators"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localFilters.collaborationTypes?.includes('pending') || false}
                    onChange={() => handleCollaborationTypeChange('pending')}
                    size="small"
                  />
                }
                label="Pending Invitations"
              />
            </FormGroup>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Institution Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Institution
            </Typography>
            <Stack spacing={1} sx={{ maxHeight: 200, overflow: 'auto' }}>
              {institutions.slice(0, 10).map((institution) => (
                <FormControlLabel
                  key={institution}
                  control={
                    <Checkbox
                      checked={localFilters.institutions?.includes(institution) || false}
                      onChange={() => handleInstitutionChange(institution)}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" noWrap>
                      {institution}
                    </Typography>
                  }
                />
              ))}
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Specialization Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Specialization
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              {specializations.slice(0, 15).map((spec) => (
                <Chip
                  key={spec}
                  label={spec}
                  size="small"
                  onClick={() => handleSpecializationChange(spec)}
                  color={localFilters.specializations?.includes(spec) ? 'primary' : 'default'}
                  variant={localFilters.specializations?.includes(spec) ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Publication Count Range */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Publication Count: {localFilters.publicationRange?.[0] || 0} - {localFilters.publicationRange?.[1] || maxPublications}
            </Typography>
            <Slider
              value={localFilters.publicationRange || [0, maxPublications]}
              onChange={handlePublicationRangeChange}
              valueLabelDisplay="auto"
              min={0}
              max={maxPublications}
              sx={{ mt: 2 }}
            />
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack spacing={1}>
            <Button variant="contained" fullWidth onClick={handleApply}>
              Apply Filters
            </Button>
            <Button variant="outlined" fullWidth onClick={handleReset}>
              Reset All
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};

export default FilterPanel;
