'use client';

import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  Typography,
  Chip,
  Avatar,
  Stack,
  Tooltip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import ActivityList from './ActivityList';

const PRIMARY = '#8b6cbc';

const statusColors = {
  Active: { bg: '#e8f5e9', color: '#2e7d32' },
  Completed: { bg: '#e3f2fd', color: '#1976d2' },
  Paused: { bg: '#fff3e0', color: '#f57c00' },
  Planning: { bg: '#f5f5f5', color: '#616161' },
  Scheduled: { bg: '#e0f7fa', color: '#00838f' },
  Cancelled: { bg: '#ffebee', color: '#d32f2f' },
  Planned: { bg: '#f5f5f5', color: '#616161' }
};

const getStatusStyle = (status) => statusColors[status] || { bg: '#f5f5f5', color: '#616161' };

const CampaignCard = memo(({
  campaign,
  activities,
  isExpanded,
  onToggle,
  onEdit,
  onAddActivity
}) => {
  const { t } = useTranslation();
  const preActivities = useMemo(() => activities.filter(a => a.phase === 'Pre-Campaign'), [activities]);
  const postActivities = useMemo(() => activities.filter(a => a.phase === 'Post-Campaign'), [activities]);
  const statusStyle = getStatusStyle(campaign.status);
  const completedCount = activities.filter(a => a.status === 'Completed').length;

  return (
    <Card
      sx={{
        mb: 2,
        mx: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(PRIMARY, 0.1)}`,
        boxShadow: isExpanded ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.06)',
        position: 'relative',
        transition: 'box-shadow 0.2s ease',
        overflow: 'visible',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: PRIMARY,
          borderRadius: '2px 0 0 2px'
        }
      }}
    >
      <Accordion
        expanded={Boolean(isExpanded)}
        onChange={onToggle}
        sx={{ boxShadow: 'none', background: 'transparent', '&:before': { display: 'none' } }}
      >
        <AccordionSummary
          expandIcon={
            <Box sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: `1px solid ${alpha(PRIMARY, 0.25)}`,
              backgroundColor: alpha(PRIMARY, 0.06),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: PRIMARY
            }}>
              <ExpandMoreIcon sx={{ fontSize: 16 }} />
            </Box>
          }
          sx={{ px: 3, py: 2, minHeight: 72, '&:hover': { backgroundColor: alpha(PRIMARY, 0.02) } }}
        >
          <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
            <Avatar sx={{
              bgcolor: PRIMARY,
              width: 40,
              height: 40,
              fontSize: '1rem',
              fontWeight: 700,
              flexShrink: 0
            }}>
              {campaign.name.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>
                  {campaign.name}
                </Typography>
                <Chip
                  label={campaign.status}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color,
                    flexShrink: 0
                  }}
                />
              </Box>

              {campaign.description && (
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem', mb: 0.5, lineHeight: 1.4 }}>
                  {campaign.description.length > 100 ? `${campaign.description.substring(0, 100)}…` : campaign.description}
                </Typography>
              )}

              {campaign.targetAmount && Number(campaign.targetAmount) > 0 && (
                <Box sx={{ mb: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      ${(campaign.raisedAmount || 0).toLocaleString()} raised
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      {Math.round(((campaign.raisedAmount || 0) / Number(campaign.targetAmount)) * 100)}% of ${Number(campaign.targetAmount).toLocaleString()}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(((campaign.raisedAmount || 0) / Number(campaign.targetAmount)) * 100, 100)}
                    sx={{
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: '#e8e8e8',
                      '& .MuiLinearProgress-bar': { backgroundColor: '#4caf50', borderRadius: 3 }
                    }}
                  />
                </Box>
              )}

              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                {(campaign.startDate || campaign.endDate) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      {campaign.startDate && campaign.endDate
                        ? `${new Date(campaign.startDate).toLocaleDateString()} – ${new Date(campaign.endDate).toLocaleDateString()}`
                        : campaign.startDate
                          ? `Starts ${new Date(campaign.startDate).toLocaleDateString()}`
                          : `Ends ${new Date(campaign.endDate).toLocaleDateString()}`}
                    </Typography>
                  </Box>
                )}
                {activities.length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TimelineIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      {completedCount}/{activities.length} activities
                    </Typography>
                  </Box>
                )}
                {(campaign.donorCount || 0) > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PeopleIcon sx={{ fontSize: 11, color: '#2196f3' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#2196f3' }}>
                      {campaign.donorCount} donor{campaign.donorCount !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
              <Tooltip title="Edit campaign" arrow>
                <Box
                  component="div"
                  onClick={(e) => { e.stopPropagation(); onEdit(campaign); }}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: PRIMARY,
                    border: `1px solid ${alpha(PRIMARY, 0.2)}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': { backgroundColor: PRIMARY, color: 'white' }
                  }}
                >
                  <EditIcon sx={{ fontSize: 15 }} />
                </Box>
              </Tooltip>
              <Tooltip title="Add activity" arrow>
                <Box
                  component="div"
                  onClick={(e) => { e.stopPropagation(); onAddActivity(campaign.id); }}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4caf50',
                    border: '1px solid rgba(76,175,80,0.25)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': { backgroundColor: '#4caf50', color: 'white' }
                  }}
                >
                  <AddIcon sx={{ fontSize: 15 }} />
                </Box>
              </Tooltip>
            </Stack>
          </Stack>
        </AccordionSummary>

        <AccordionDetails sx={{ p: 0, backgroundColor: '#f8fafc', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          {activities.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, px: 3 }}>
              <TimelineIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontWeight: 500 }}>
                No activities tracked yet
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Add activities to monitor campaign progress.
              </Typography>
              <Box
                component="div"
                onClick={() => onAddActivity(campaign.id)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2.5,
                  py: 1,
                  borderRadius: 1.5,
                  backgroundColor: PRIMARY,
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'opacity 0.15s ease',
                  '&:hover': { opacity: 0.9 }
                }}
              >
                <AddIcon sx={{ fontSize: 16 }} />
                Add Activity
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 3, display: 'flex', gap: 2.5, flexDirection: { xs: 'column', md: 'row' } }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ActivityList
                  activities={preActivities}
                  phase="Pre-Campaign"
                  color="#8b6cbc"
                  onEditActivity={null}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ActivityList
                  activities={postActivities}
                  phase="Post-Campaign"
                  color="#3f51b5"
                  onEditActivity={null}
                />
              </Box>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </Card>
  );
});

CampaignCard.displayName = 'CampaignCard';

export default CampaignCard;
