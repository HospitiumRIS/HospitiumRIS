'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Tooltip,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Stack,
  Fade,
  IconButton
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Campaign as CampaignIcon,
  Event as EventIcon,
  Close as CloseIcon,
  CalendarToday as CalendarTodayIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  FileDownload as DownloadIcon,
  CalendarMonth as CalendarMonthIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';

const CampaignCalendar = ({
  campaigns = [],
  activities = [],
  loading = false,
  onSelectCampaign,
  onSelectActivity,
  height = 600,
  DASHBOARD_COLORS,
  hideHeader = false
}) => {
  const { t } = useTranslation();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDialog, setEventDialog] = useState(false);

  // Calendar helpers - Properly calculate calendar boundaries
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Calculate start date - always start from Sunday of the week containing the 1st
  const startDate = new Date(firstDayOfMonth);
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
  startDate.setDate(1 - firstDayWeekday); // Move back to Sunday
  
  // Calculate end date - always end on Saturday of the last week
  const endDate = new Date(lastDayOfMonth);
  const lastDayWeekday = lastDayOfMonth.getDay();
  const daysToAdd = lastDayWeekday === 6 ? 0 : (6 - lastDayWeekday); // If Saturday, add 0, else add days to reach Saturday
  endDate.setDate(lastDayOfMonth.getDate() + daysToAdd);

  // Generate calendar events
  const calendarEvents = useMemo(() => {
    const events = [];
    
    // Add campaign start/end dates
    campaigns.forEach(campaign => {
      if (campaign.startDate) {
        try {
          const startDate = new Date(campaign.startDate);
          if (!isNaN(startDate.getTime())) {
        events.push({
          type: 'campaign-start',
              date: startDate,
          title: `${campaign.name} Starts`,
          campaign,
              color: campaign.category?.color || DASHBOARD_COLORS?.primary || '#8b6cbc',
          icon: 'start'
        });
          }
        } catch (error) {
          console.warn('Invalid campaign start date:', campaign.startDate, error);
        }
      }
      
      if (campaign.endDate) {
        try {
          const endDate = new Date(campaign.endDate);
          if (!isNaN(endDate.getTime())) {
        events.push({
          type: 'campaign-end',
              date: endDate,
          title: `${campaign.name} Ends`,
          campaign,
              color: campaign.category?.color || DASHBOARD_COLORS?.primary || '#8b6cbc',
          icon: 'end'
        });
          }
        } catch (error) {
          console.warn('Invalid campaign end date:', campaign.endDate, error);
        }
      }
    });
    
    // Add activities
    activities.forEach(activity => {
      if (activity.date) {
        try {
          const activityDate = new Date(activity.date);
          if (!isNaN(activityDate.getTime())) {
        events.push({
          type: 'activity',
              date: activityDate,
          title: activity.title,
          activity,
          campaign: activity.campaign,
              color: activity.campaign?.category?.color || DASHBOARD_COLORS?.primary || '#8b6cbc',
          phase: activity.phase,
          status: activity.status
        });
          }
        } catch (error) {
          console.warn('Invalid activity date:', activity.date, error);
        }
      }
    });
    
    return events;
  }, [campaigns, activities, DASHBOARD_COLORS, year, month]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped = {};
    calendarEvents.forEach(event => {
      const dateKey = event.date.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [calendarEvents]);

  // Generate calendar days - Always generate exactly 42 days (6 weeks x 7 days)
  const calendarDays = useMemo(() => {
    const days = [];
    const current = new Date(startDate);
    
    // Generate exactly 42 days for consistent 6x7 grid
    for (let i = 0; i < 42; i++) {
      const dayEvents = eventsByDate[current.toDateString()] || [];
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === today.toDateString(),
        events: dayEvents
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [startDate, month, today, eventsByDate]);

  // Always use 6 weeks for consistent display
  const numberOfWeeks = 6;

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setEventDialog(true);
  };

  const getEventIcon = (event) => {
    // Return empty string to remove gimmicky icons
    return '';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#4caf50';
      case 'Completed': return '#2196f3';
      case 'Planning': return '#757575';
      case 'Paused': return '#ff9800';
      case 'Cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  // Generate iCal data for an event
  const generateICalData = (event) => {
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDate = new Date(event.date);
    const endDate = new Date(event.date);
    endDate.setHours(endDate.getHours() + 1); // Default 1 hour duration

    const summary = event.title;
    const description = event.activity?.description || event.campaign?.description || '';
    const location = event.activity?.location || '';
    const uid = `${event.type}-${event.date.getTime()}@hospitiumris.com`;

    const icalData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HospitiumRIS//Campaign Calendar//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${summary}`,
      description ? `DESCRIPTION:${description}` : '',
      location ? `LOCATION:${location}` : '',
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line !== '').join('\r\n');

    return icalData;
  };

  // Download iCal file
  const downloadICalEvent = (event) => {
    const icalData = generateICalData(event);
    const blob = new Blob([icalData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const PRIMARY = DASHBOARD_COLORS?.primary || '#8b6cbc';

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <Box sx={{ height, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">Loading calendar…</Typography>
      </Box>
    );
  }

  return (
    <>
      <Fade in timeout={400}>
        <Box sx={{ 
          height,
          borderRadius: hideHeader ? 0 : 2,
          border: hideHeader ? 'none' : '1px solid rgba(0,0,0,0.1)',
          boxShadow: hideHeader ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
          bgcolor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Unified Navigation Bar */}
          {!hideHeader && (
            <Box sx={{
              px: 2.5, py: 1.75,
              borderBottom: '1px solid rgba(0,0,0,0.08)',
              backgroundColor: PRIMARY,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonthIcon sx={{ color: 'white', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                  Campaign Calendar
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton onClick={() => navigateMonth(-1)} size="small" sx={{ color: 'rgba(255,255,255,0.85)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' } }}>
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white', minWidth: 150, textAlign: 'center', fontSize: '0.9rem' }}>
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Typography>
                <IconButton onClick={() => navigateMonth(1)} size="small" sx={{ color: 'rgba(255,255,255,0.85)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' } }}>
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              </Box>
              <Button
                onClick={goToToday}
                size="small"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 600, py: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.6)' } }}
              >
                Today
              </Button>
            </Box>
          )}

          {hideHeader && (
            <Box sx={{
              px: 2, py: 1.5,
              borderBottom: '1px solid rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <IconButton onClick={() => navigateMonth(-1)} size="small" sx={{ color: PRIMARY }}>
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: PRIMARY }}>
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Typography>
                <Button onClick={goToToday} size="small" variant="outlined"
                  sx={{ color: PRIMARY, borderColor: `${PRIMARY}50`, fontSize: '0.72rem', fontWeight: 600, py: 0.25,
                    '&:hover': { backgroundColor: `${PRIMARY}10`, borderColor: PRIMARY } }}
                >
                  Today
                </Button>
              </Box>
              <IconButton onClick={() => navigateMonth(1)} size="small" sx={{ color: PRIMARY }}>
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
            
          {/* Days of Week Header */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(0,0,0,0.07)', backgroundColor: '#fafbfc' }}>
            {WEEKDAYS.map(day => (
              <Box key={day} sx={{ py: 1, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>
            
          {/* Calendar Grid */}
          <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', minHeight: 0, overflow: 'hidden' }}>
            {calendarDays.map((day) => (
              <Box
                key={`day-${day.date.getTime()}`}
                sx={{
                  borderRight: '1px solid rgba(0,0,0,0.06)',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                  p: '6px 6px 4px',
                  backgroundColor: !day.isCurrentMonth ? '#fafbfc' : 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  minHeight: 0,
                  '&:hover': { backgroundColor: !day.isCurrentMonth ? '#f5f6f8' : `${PRIMARY}08` }
                }}
              >
                {/* Date number */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
                  <Box sx={{
                    width: 22, height: 22,
                    borderRadius: '50%',
                    backgroundColor: day.isToday ? PRIMARY : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Typography variant="caption" sx={{
                      fontSize: '0.72rem',
                      fontWeight: day.isToday ? 700 : day.isCurrentMonth ? 500 : 400,
                      color: day.isToday ? 'white' : day.isCurrentMonth ? '#334155' : '#cbd5e1',
                      lineHeight: 1
                    }}>
                      {day.date.getDate()}
                    </Typography>
                  </Box>
                </Box>

                {/* Events */}
                {day.events.slice(0, 3).map((event, i) => (
                  <Tooltip key={i} title={event.title} arrow placement="top">
                    <Box
                      onClick={() => handleEventClick(event)}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 0.5,
                        px: 0.75, py: 0.25, borderRadius: 0.5,
                        backgroundColor: `${event.color}18`,
                        borderLeft: `2px solid ${event.color}`,
                        cursor: 'pointer', overflow: 'hidden',
                        '&:hover': { backgroundColor: `${event.color}28` }
                      }}
                    >
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: event.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.5 }}>
                        {event.title}
                      </Typography>
                    </Box>
                  </Tooltip>
                ))}
                {day.events.length > 3 && (
                  <Typography sx={{ fontSize: '0.58rem', color: '#94a3b8', pl: 0.5 }}>
                    +{day.events.length - 3} more
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </Fade>

      {/* Event Details Dialog - Professional Redesign */}
      <Dialog
        open={eventDialog}
        onClose={() => setEventDialog(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{
          sx: { 
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.12)'
          }
        }}
      >
        {selectedEvent && (
          <>
            {/* Header */}
            <Box sx={{
              background: `linear-gradient(135deg, ${selectedEvent.color} 0%, ${selectedEvent.color}CC 100%)`,
              p: 3,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{
                position: 'absolute', top: -24, right: -24,
                width: 110, height: 110, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)', pointerEvents: 'none'
              }} />
              <Box sx={{
                position: 'absolute', bottom: -32, left: 32,
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)', pointerEvents: 'none'
              }} />
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 48, height: 48, borderRadius: 3,
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <EventIcon sx={{ fontSize: 22, color: 'white' }} />
                  </Box>
                  <Box>
                    <Chip
                      label={selectedEvent.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      size="small"
                      sx={{
                        mb: 0.75,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.62rem',
                        letterSpacing: '0.6px',
                        textTransform: 'uppercase',
                        height: 20,
                        border: '1px solid rgba(255,255,255,0.3)',
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700, color: 'white', lineHeight: 1.25,
                      textShadow: '0 1px 4px rgba(0,0,0,0.15)'
                    }}>
                      {selectedEvent.title}
                    </Typography>
                  </Box>
                </Box>
                <IconButton
                  onClick={() => setEventDialog(false)}
                  size="small"
                  sx={{
                    color: 'white', ml: 1.5, flexShrink: 0,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.22)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Body */}
            <DialogContent sx={{ p: 0 }}>

              {/* Date & Time */}
              <Box sx={{
                px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 2,
                borderBottom: '1px solid rgba(0,0,0,0.06)'
              }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                  backgroundColor: `${selectedEvent.color}18`,
                  border: `1px solid ${selectedEvent.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <CalendarTodayIcon sx={{ fontSize: 18, color: selectedEvent.color }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{
                    color: 'text.secondary', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.6px', fontSize: '0.62rem'
                  }}>
                    Date &amp; Time
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.25 }}>
                    {selectedEvent.date.toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </Typography>
                  {selectedEvent.activity?.time && (
                    <Typography variant="caption" color="text.secondary">
                      {selectedEvent.activity.time}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Campaign */}
              {selectedEvent.campaign && (
                <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" sx={{
                    color: 'text.secondary', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.6px', fontSize: '0.62rem',
                    display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5
                  }}>
                    <CampaignIcon sx={{ fontSize: 13 }} /> Campaign
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
                    <Avatar sx={{
                      width: 44, height: 44, flexShrink: 0,
                      backgroundColor: selectedEvent.color,
                      fontSize: '1.1rem', fontWeight: 700,
                      boxShadow: `0 4px 14px ${selectedEvent.color}45`
                    }}>
                      {selectedEvent.campaign.name?.charAt(0)?.toUpperCase() || 'C'}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>
                        {selectedEvent.campaign.name}
                      </Typography>
                      {selectedEvent.campaign.category && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4 }}>
                          <Box sx={{
                            width: 7, height: 7, borderRadius: '50%',
                            backgroundColor: selectedEvent.color, flexShrink: 0
                          }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {selectedEvent.campaign.category.name}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    {selectedEvent.campaign.status && (
                      <Chip
                        label={selectedEvent.campaign.status}
                        size="small"
                        sx={{
                          backgroundColor: `${getStatusColor(selectedEvent.campaign.status)}15`,
                          color: getStatusColor(selectedEvent.campaign.status),
                          border: `1px solid ${getStatusColor(selectedEvent.campaign.status)}30`,
                          fontWeight: 700, fontSize: '0.68rem', flexShrink: 0
                        }}
                      />
                    )}
                  </Box>
                  {selectedEvent.campaign.description && (
                    <Typography variant="caption" color="text.secondary" sx={{
                      display: 'block', mt: 1.5, px: 1.5, py: 1.25,
                      backgroundColor: 'rgba(0,0,0,0.025)',
                      borderRadius: 2, fontStyle: 'italic', lineHeight: 1.65,
                      border: '1px solid rgba(0,0,0,0.04)'
                    }}>
                      {selectedEvent.campaign.description}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Activity */}
              {selectedEvent.activity && (
                <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" sx={{
                    color: 'text.secondary', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.6px', fontSize: '0.62rem',
                    display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5
                  }}>
                    <ScheduleIcon sx={{ fontSize: 13 }} /> Activity Details
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: selectedEvent.activity.location || selectedEvent.activity.description ? 2 : 0 }}>
                    {selectedEvent.phase && (
                      <Chip
                        label={selectedEvent.phase}
                        size="small"
                        sx={{
                          backgroundColor: selectedEvent.phase === 'Pre-Campaign' ? 'rgba(233,30,99,0.1)' : 'rgba(63,81,181,0.1)',
                          color: selectedEvent.phase === 'Pre-Campaign' ? '#e91e63' : '#3f51b5',
                          border: `1px solid ${selectedEvent.phase === 'Pre-Campaign' ? 'rgba(233,30,99,0.25)' : 'rgba(63,81,181,0.25)'}`,
                          fontWeight: 700, fontSize: '0.7rem'
                        }}
                      />
                    )}
                    {selectedEvent.status && (
                      <Chip
                        label={selectedEvent.status}
                        size="small"
                        sx={{
                          backgroundColor: `${getStatusColor(selectedEvent.status)}15`,
                          color: getStatusColor(selectedEvent.status),
                          border: `1px solid ${getStatusColor(selectedEvent.status)}30`,
                          fontWeight: 700, fontSize: '0.7rem'
                        }}
                      />
                    )}
                  </Stack>
                  {selectedEvent.activity.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
                      <LocationIcon sx={{ fontSize: 17, color: 'text.disabled', flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary">
                        {selectedEvent.activity.location}
                      </Typography>
                    </Box>
                  )}
                  {selectedEvent.activity.description && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <DescriptionIcon sx={{ fontSize: 17, color: 'text.disabled', flexShrink: 0, mt: 0.15 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                        {selectedEvent.activity.description}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{
              px: 3, py: 2, gap: 1,
              backgroundColor: 'rgba(0,0,0,0.015)',
              borderTop: '1px solid rgba(0,0,0,0.06)'
            }}>
              <Button
                onClick={() => setEventDialog(false)}
                size="small"
                sx={{ color: 'text.secondary', fontWeight: 500, mr: 'auto' }}
              >
                Close
              </Button>
              <Button
                startIcon={<DownloadIcon />}
                variant="outlined"
                size="small"
                onClick={() => downloadICalEvent(selectedEvent)}
                sx={{
                  borderColor: `${selectedEvent.color}55`,
                  color: selectedEvent.color, fontWeight: 600,
                  '&:hover': {
                    backgroundColor: `${selectedEvent.color}0D`,
                    borderColor: selectedEvent.color
                  }
                }}
              >
                Add to Calendar
              </Button>
              {selectedEvent.campaign && onSelectCampaign && (
                <Button
                  startIcon={<LaunchIcon />}
                  variant="contained"
                  size="small"
                  onClick={() => {
                    onSelectCampaign(selectedEvent.campaign);
                    setEventDialog(false);
                  }}
                  sx={{
                    backgroundColor: selectedEvent.color,
                    fontWeight: 600,
                    boxShadow: `0 4px 14px ${selectedEvent.color}45`,
                    '&:hover': {
                      backgroundColor: `${selectedEvent.color}E0`,
                      boxShadow: `0 6px 18px ${selectedEvent.color}55`
                    }
                  }}
                >
                  View Campaign
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default CampaignCalendar;
