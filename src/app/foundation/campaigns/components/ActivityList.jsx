'use client';

import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  Typography,
  Chip,
  alpha
} from '@mui/material';
import { EventNote as EventNoteIcon } from '@mui/icons-material';

const statusStyles = {
  Completed: { bg: '#e8f5e9', color: '#2e7d32', border: '#c8e6c9' },
  'In Progress': { bg: '#fff3e0', color: '#f57c00', border: '#ffe0b2' },
  Planned: { bg: '#e3f2fd', color: '#1976d2', border: '#bbdefb' },
  Cancelled: { bg: '#ffebee', color: '#d32f2f', border: '#ffcdd2' }
};

const getStatusStyle = (status) => statusStyles[status] || { bg: '#f5f5f5', color: '#616161', border: '#e0e0e0' };

const ActivityList = memo(({ activities, phase, color, onEditActivity }) => {
  const { t } = useTranslation();
  return (
  <Card sx={{
    borderRadius: 2,
    overflow: 'hidden',
    border: `1px solid ${alpha(color, 0.15)}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: color
    }
  }}>
    <Box sx={{
      px: 2.5,
      py: 2,
      borderBottom: `1px solid ${alpha(color, 0.1)}`,
      backgroundColor: alpha(color, 0.04)
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', fontSize: '0.875rem' }}>
          {phase} Activities
        </Typography>
        <Chip
          label={activities.length}
          size="small"
          sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, backgroundColor: color, color: 'white', minWidth: 28 }}
        />
      </Box>
    </Box>

    {activities.length === 0 ? (
      <Box sx={{ textAlign: 'center', py: 4, px: 3 }}>
        <Box sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: alpha(color, 0.1),
          border: `1px dashed ${alpha(color, 0.3)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 1.5
        }}>
          <EventNoteIcon sx={{ fontSize: 20, color, opacity: 0.6 }} />
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
          No {phase.toLowerCase()} activities
        </Typography>
      </Box>
    ) : (
      activities.map((activity, index) => {
        const style = getStatusStyle(activity.status);
        return (
          <Box
            key={activity.id}
            onClick={() => onEditActivity && onEditActivity(activity)}
            sx={{
              px: 2.5,
              py: 2,
              borderBottom: index < activities.length - 1 ? `1px solid ${alpha('#000', 0.05)}` : 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              '&:hover': { backgroundColor: alpha(color, 0.04) }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', fontSize: '0.875rem', flex: 1, mr: 1 }}>
                {activity.title}
              </Typography>
              <Chip
                label={activity.status}
                size="small"
                sx={{
                  fontSize: '0.7rem',
                  height: 20,
                  fontWeight: 600,
                  backgroundColor: style.bg,
                  color: style.color,
                  border: `1px solid ${style.border}`,
                  flexShrink: 0
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                {activity.type}
              </Typography>
              <Box sx={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'text.disabled' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
              </Typography>
            </Box>
            {activity.description && (
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.72rem', display: 'block', mt: 0.5, lineHeight: 1.4 }}>
                {activity.description.length > 80 ? `${activity.description.substring(0, 80)}…` : activity.description}
              </Typography>
            )}
          </Box>
        );
      })
    )}
  </Card>
  );
});

ActivityList.displayName = 'ActivityList';

export default ActivityList;
