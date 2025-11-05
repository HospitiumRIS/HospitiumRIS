'use client';

import React from 'react';
import {
  Card,
  Typography,
  Stack,
  Paper,
  Avatar,
  Box,
  alpha,
} from '@mui/material';

const RecentActivities = ({ recentActivities }) => {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3, p: 3, height: 400 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: '1.25rem' }}>
        Recent Activities & Updates
      </Typography>
      <Stack spacing={2} sx={{ maxHeight: 320, overflow: 'auto', pr: 1 }}>
        {recentActivities.map((activity) => (
          <Paper 
            key={activity.id} 
            sx={{ 
              p: 3, 
              borderRadius: 3, 
              border: '1px solid', 
              borderColor: 'divider',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: 2,
                transform: 'translateY(-1px)',
                borderColor: alpha(activity.color, 0.3),
              }
            }}
          >
            <Stack direction="row" spacing={3} alignItems="flex-start">
              <Avatar 
                sx={{ 
                  backgroundColor: alpha(activity.color, 0.1), 
                  color: activity.color, 
                  width: 48, 
                  height: 48,
                  border: `2px solid ${alpha(activity.color, 0.2)}`
                }}
              >
                {activity.icon}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}>
                  {activity.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
                  {activity.description}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: activity.color, 
                  fontWeight: 600,
                  backgroundColor: alpha(activity.color, 0.1),
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                }}>
                  {activity.time}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Card>
  );
};

export default RecentActivities;
