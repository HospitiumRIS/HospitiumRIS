'use client';

import React from 'react';
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
  Refresh as RefreshIcon,
  Category as CategoryIcon,
  Campaign as CampaignIcon
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
  
  const statusOptions = [
    { value: 'Planning', label: 'Planning', color: '#757575' },
    { value: 'Active', label: 'Active', color: '#4caf50' },
    { value: 'Paused', label: 'Paused', color: '#ff9800' },
    { value: 'Completed', label: 'Completed', color: '#2196f3' },
    { value: 'Cancelled', label: 'Cancelled', color: '#f44336' }
  ];

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('');
  };

  const handleRefresh = () => {
    loadData(false); // Force refresh without cache
  };

  const activeFilters = [
    searchTerm && { type: 'search', label: `Search: ${searchTerm}`, value: searchTerm },
    categoryFilter && { 
      type: 'category', 
      label: `Category: ${categories.find(c => c.id === categoryFilter)?.name || 'Unknown'}`, 
      value: categoryFilter 
    },
    statusFilter && { type: 'status', label: `Status: ${statusFilter}`, value: statusFilter }
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
              Search & Filter
            </Typography>
            <Box sx={{ 
              width: 20, 
              height: 20, 
              borderRadius: '50%', 
              backgroundColor: '#8b6cbc', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              i
            </Box>
            <Box sx={{ flex: 1 }} />
            <Tooltip title="Reset">
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
                Reset
              </Button>
            </Tooltip>
          </Box>
          {/* Filter Controls - Horizontal Layout */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <TextField
                fullWidth
                placeholder="Search categories and initiatives..."
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
                    Filter by Category
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
                    Filter by Status
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
                Active Filters ({activeFilters.length}):
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
                  Clear All
                </Button>
              </Stack>
            </Box>
          )}

          {/* Quick Stats */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mt: 2, 
            pt: 2, 
            borderTop: '1px solid rgba(0,0,0,0.06)' 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CategoryIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
              <Typography variant="caption" color="text.secondary">
                {categories.length} Categories
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CampaignIcon sx={{ fontSize: 16, color: '#4caf50' }} />
              <Typography variant="caption" color="text.secondary">
                {categories.reduce((sum, cat) => sum + (cat.campaignCount || 0), 0)} Total Campaigns
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                backgroundColor: '#4caf50' 
              }} />
              <Typography variant="caption" color="text.secondary">
                {categories.reduce((sum, cat) => sum + (cat.activeCampaigns || 0), 0)} Active
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
  );
};

export default SearchFilters;
