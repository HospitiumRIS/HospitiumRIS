'use client';

import React from 'react';
import {
  Card,
  Typography,
  Stack,
  Paper,
  Box,
  alpha,
  Chip,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  Campaign as CampaignIcon,
} from '@mui/icons-material';

const UpcomingEvents = () => {
  const events = [
    {
      id: 1,
      title: 'Annual Golfing Tournament',
      date: 'March 15, 2024',
      type: 'Fundraising Event',
      icon: <CampaignIcon />,
      color: '#8b6cbc',
      priority: 'high',
    },
    {
      id: 2,
      title: 'Grant Application Deadline',
      date: 'March 30, 2024',
      type: 'NIH Research Grant',
      icon: <AssessmentIcon />,
      color: '#ff9800',
      priority: 'urgent',
    },
    {
      id: 3,
      title: 'Quarterly Review Meeting',
      date: 'April 5, 2024',
      type: 'Board Meeting',
      icon: <SchoolIcon />,
      color: '#2e7d32',
      priority: 'medium',
    },
    {
      id: 4,
      title: 'Corporate Partnership Meeting',
      date: 'April 12, 2024',
      type: 'Strategic Planning',
      icon: <BusinessIcon />,
      color: '#1976d2',
      priority: 'medium',
    },
    {
      id: 5,
      title: 'Donor Appreciation Gala',
      date: 'April 20, 2024',
      type: 'Community Event',
      icon: <CampaignIcon />,
      color: '#8b6cbc',
      priority: 'high',
    },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#d32f2f';
      case 'high': return '#ff9800';
      case 'medium': return '#2e7d32';
      default: return '#1976d2';
    }
  };

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3, p: 3, height: 500 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: '1.25rem' }}>
        Upcoming Events & Deadlines
      </Typography>
      <Stack spacing={2} sx={{ maxHeight: 420, overflow: 'auto', pr: 1 }}>
        {events.map((event) => (
          <Paper 
            key={event.id} 
            sx={{ 
              p: 3, 
              borderRadius: 3, 
              backgroundColor: alpha(event.color, 0.03),
              border: `1px solid ${alpha(event.color, 0.1)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: alpha(event.color, 0.08),
                transform: 'translateY(-1px)',
                boxShadow: 2,
              }
            }}
          >
            <Stack direction="row" spacing={3} alignItems="flex-start">
              <Box
                sx={{
                  backgroundColor: alpha(event.color, 0.1),
                  color: event.color,
                  p: 1.5,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {event.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    {event.title}
                  </Typography>
                  <Chip
                    label={event.priority}
                    size="small"
                    sx={{
                      backgroundColor: alpha(getPriorityColor(event.priority), 0.1),
                      color: getPriorityColor(event.priority),
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {event.type}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ 
                    fontWeight: 600,
                    color: event.color,
                  }}>
                    {event.date}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Card>
  );
};

export default UpcomingEvents;
