'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Button,
  InputAdornment,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const SearchFilters = ({
  categories,
  loading,
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  loadData
}) => {
  const { t, i18n } = useTranslation();
  const statusOptions = React.useMemo(() => [
    { value: 'Planning', label: t('foundation_dashboard.status_planning'), color: '#757575' },
    { value: 'Active', label: t('foundation_dashboard.status_active'), color: '#4caf50' },
    { value: 'Paused', label: t('foundation_dashboard.status_paused'), color: '#ff9800' },
    { value: 'Completed', label: t('foundation_dashboard.status_completed'), color: '#2196f3' },
    { value: 'Cancelled', label: t('foundation_dashboard.status_cancelled'), color: '#f44336' }
  ], [t, i18n.language]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('');
  };

  const handleRefresh = () => {
    loadData(false); // Force refresh without cache
  };

  const activeFilters = [
    searchTerm && { type: 'search', label: `${t('foundation_dashboard.search_label')}: ${searchTerm}`, value: searchTerm },
    categoryFilter && { 
      type: 'category', 
      label: `${t('foundation_dashboard.category_label')}: ${categories.find(c => c.id === categoryFilter)?.name || 'Unknown'}`, 
      value: categoryFilter 
    },
    statusFilter && { type: 'status', label: `${t('foundation_dashboard.status_label')}: ${statusFilter}`, value: statusFilter }
  ].filter(Boolean);

  const removeFilter = (filterType, value) => {
    switch (filterType) {
      case 'search':
        setSearchTerm('');
        break;
      case 'category':
        setCategoryFilter('');
        break;
      case 'status':
        setStatusFilter('');
        break;
    }
  };

  return (
    <Card sx={{ 
      borderRadius: 2,
      backgroundColor: '#fafafa',
      boxShadow: 'none',
      border: '1px solid #e0e0e0'
    }}>
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <SearchIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 500, color: '#333', fontSize: '1.1rem' }}>
              {t('foundation_dashboard.search_and_filter')}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Tooltip title={t('foundation_dashboard.reset')}>
              <Button 
                startIcon={<RefreshIcon />}
                onClick={handleClearFilters}
                disabled={!searchTerm && !categoryFilter && !statusFilter}
                variant="outlined"
                size="small"
                sx={{ 
                  color: '#8b6cbc',
                  borderColor: '#8b6cbc',
                  textTransform: 'none',
                  fontSize: '0.875rem'
                }}
              >
                {t('foundation_dashboard.reset')}
              </Button>
            </Tooltip>
          </Box>
          {/* Filter Controls - Horizontal Layout */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <TextField
                fullWidth
                placeholder={t('foundation_dashboard.search_categories_initiatives')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#8b6cbc' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm('')}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: 'white',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc',
                    },
                  }
                }}
              />
            </Box>

            {/* Category Filter */}
            <Box sx={{ minWidth: 200 }}>
              <FormControl fullWidth>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  displayEmpty
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 300,
                        '& .MuiMenuItem-root': {
                          minHeight: 'auto'
                        }
                      }
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    disableScrollLock: true
                  }}
                  sx={{
                    borderRadius: 1,
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                  }}
                >
                  <MenuItem value="">
                    {t('foundation_dashboard.filter_by_category')}
                  </MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: category.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.75rem'
                        }}>
  {category.name ? category.name.charAt(0).toUpperCase() : 'C'}
                        </Box>
                        {category.name}
                        {category.campaignCount > 0 && (
                          <Chip 
                            label={category.campaignCount} 
                            size="small" 
                            sx={{ height: 18, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Status Filter */}
            <Box sx={{ minWidth: 180 }}>
              <FormControl fullWidth>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  displayEmpty
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 300,
                        '& .MuiMenuItem-root': {
                          minHeight: 'auto'
                        }
                      }
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    disableScrollLock: true
                  }}
                  sx={{
                    borderRadius: 1,
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                  }}
                >
                  <MenuItem value="">
                    {t('foundation_dashboard.filter_by_status')}
                  </MenuItem>
                  {statusOptions.map(status => (
                    <MenuItem key={status.value} value={status.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: status.color
                        }} />
                        {status.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Active Filters Display */}
          {activeFilters.length > 0 && (
            <Box sx={{ mb: 0 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#64748b' }}>
                {t('foundation_dashboard.active_filters')} ({activeFilters.length}):
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {activeFilters.map((filter, index) => (
                  <Chip
                    key={index}
                    label={filter.label}
                    onDelete={() => removeFilter(filter.type, filter.value)}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(139, 108, 188, 0.1)',
                      color: '#8b6cbc',
                      fontWeight: 500,
                      '& .MuiChip-deleteIcon': {
                        color: '#8b6cbc',
                        '&:hover': {
                          color: '#7c5eb0'
                        }
                      }
                    }}
                  />
                ))}
                
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  sx={{
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    minHeight: 'auto',
                    padding: '4px 8px',
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.1)'
                    }
                  }}
                >
                  {t('foundation_dashboard.clear_all')}
                </Button>
              </Stack>
            </Box>
          )}

        </CardContent>
      </Card>
  );
};

export default SearchFilters;
