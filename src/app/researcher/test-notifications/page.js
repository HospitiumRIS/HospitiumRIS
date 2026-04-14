'use client';

import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Science as ScienceIcon,
  Security as SecurityIcon,
  School as SchoolIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

export default function TestNotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const createTestNotifications = async (testType = 'all') => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to create test notifications');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testButtons = [
    { type: 'all', label: 'Create All Tests', icon: <NotificationsIcon />, color: 'primary' },
    { type: 'system', label: 'System Announcement', icon: <InfoIcon />, color: 'info' },
    { type: 'priority', label: 'High Priority', icon: <WarningIcon />, color: 'warning' },
    { type: 'urgent', label: 'Urgent Alert', icon: <SecurityIcon />, color: 'error' },
    { type: 'collaboration', label: 'Collaboration', icon: <ScienceIcon />, color: 'secondary' },
    { type: 'training', label: 'Training', icon: <SchoolIcon />, color: 'success' },
    { type: 'low', label: 'Low Priority', icon: <InfoIcon />, color: 'default' }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon fontSize="large" />
          Test Notification System
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Use these buttons to create test notifications and verify the notification system is working correctly.
          Check the notification bell in the top navigation to see the results.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {testButtons.map((btn) => (
            <Grid item xs={12} sm={6} md={4} key={btn.type}>
              <Button
                fullWidth
                variant="outlined"
                color={btn.color}
                startIcon={btn.icon}
                onClick={() => createTestNotifications(btn.type)}
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {btn.label}
              </Button>
            </Grid>
          ))}
        </Grid>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              ✅ {result.message}
            </Typography>
            <Typography variant="body2">
              Check the notification bell in the navigation bar to see your new notifications.
            </Typography>
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Notification Features to Test:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <li>
              <Typography variant="body2">
                <strong>Priority Levels:</strong> URGENT (red), HIGH (orange), NORMAL (blue), LOW (gray)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Categories:</strong> System, Collaboration, Training, Publication, etc.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Actions:</strong> Some notifications have action buttons (e.g., "View Comment")
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Mark as Read:</strong> Click on a notification to mark it as read
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Delete:</strong> Remove notifications you don't need
              </Typography>
            </li>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            API Endpoints:
          </Typography>
          <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
            <div>GET /api/notifications - Fetch notifications</div>
            <div>POST /api/notifications - Create notification</div>
            <div>PATCH /api/notifications - Mark as read</div>
            <div>DELETE /api/notifications - Delete notification</div>
            <div>GET /api/notifications/preferences - Get preferences</div>
            <div>PATCH /api/notifications/preferences - Update preferences</div>
            <div>GET /api/notifications/stats - Get statistics</div>
            <div>POST /api/notifications/test - Create test notifications</div>
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            href="/researcher/settings/notifications"
            sx={{ mr: 2 }}
          >
            Notification Settings
          </Button>
          <Button
            variant="outlined"
            href="/researcher"
          >
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
