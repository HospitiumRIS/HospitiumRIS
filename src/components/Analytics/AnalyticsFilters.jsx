'use client';

import React, { memo } from 'react';
import {
  Card,
  Grid,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { FilterList as FilterIcon } from '@mui/icons-material';

const AnalyticsFilters = memo(({ 
  dateRange, 
  setDateRange, 
  selectedCategory, 
  setSelectedCategory,
  selectedCampaign, 
  setSelectedCampaign,
  analyticsData 
}) => {
  return (
    <Card sx={{ 
      mb: 5, 
      p: 4, 
      background: 'rgba(139, 108, 188, 0.02)', 
      border: '1px solid rgba(139, 108, 188, 0.1)',
      borderRadius: 3,
      boxShadow: '0 2px 12px rgba(139, 108, 188, 0.08)'
    }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <FilterIcon sx={{ color: '#8b6cbc', fontSize: 24 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
          Analytics Filters
        </Typography>
      </Stack>
      <Grid container spacing={4} alignItems="center">
        <Grid item xs={12} md={3}>
          <DatePicker
            label="Start Date"
            value={dateRange.startDate}
            onChange={(newValue) => setDateRange(prev => ({ ...prev, startDate: newValue }))}
            slotProps={{ 
              textField: { 
                fullWidth: true, 
                size: 'medium',
                sx: {
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }
              } 
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <DatePicker
            label="End Date"
            value={dateRange.endDate}
            onChange={(newValue) => setDateRange(prev => ({ ...prev, endDate: newValue }))}
            slotProps={{ 
              textField: { 
                fullWidth: true, 
                size: 'medium',
                sx: {
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }
              } 
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="medium">
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              label="Category"
              onChange={(e) => setSelectedCategory(e.target.value)}
              sx={{
                borderRadius: 2
              }}
            >
              <MenuItem value="">All Categories</MenuItem>
              {analyticsData?.rawData.categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="medium">
            <InputLabel>Campaign</InputLabel>
            <Select
              value={selectedCampaign}
              label="Campaign"
              onChange={(e) => setSelectedCampaign(e.target.value)}
              sx={{
                borderRadius: 2
              }}
            >
              <MenuItem value="">All Campaigns</MenuItem>
              {analyticsData?.rawData.campaigns.map((campaign) => (
                <MenuItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Card>
  );
});

AnalyticsFilters.displayName = 'AnalyticsFilters';

export default AnalyticsFilters;
