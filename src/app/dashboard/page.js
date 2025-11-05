'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Paper,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';

const DashboardPage = () => {
  const theme = useTheme();
  const router = useRouter();

  const dashboardCards = [
    {
      title: 'Profile',
      description: 'Manage your account settings',
      icon: <PersonIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      action: 'View Profile',
    },
    {
      title: 'Analytics',
      description: 'View your research metrics',
      icon: <AnalyticsIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      action: 'View Analytics',
    },
    {
      title: 'Settings',
      description: 'Configure your preferences',
      icon: <SettingsIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      action: 'Open Settings',
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {/* Welcome Section */}
        <Paper
          sx={{
            p: 4,
            mb: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
            border: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : 'rgba(0,0,0,0.1)'}`,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <DashboardIcon 
              sx={{ 
                fontSize: 60, 
                color: theme.palette.primary.main, 
                mb: 2 
              }} 
            />
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 2,
              }}
            >
              Welcome to Your Dashboard
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: '600px', mx: 'auto' }}
            >
              You've successfully logged in! This is your research management hub where you can track your progress, collaborate with others, and manage your academic workflow.
            </Typography>
          </Box>
        </Paper>

        {/* Dashboard Cards */}
        <Grid container spacing={4}>
          {dashboardCards.map((card, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease-in-out',
                  border: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : 'rgba(0,0,0,0.1)'}`,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 8px 24px rgba(0,0,0,0.4)'
                      : '0 8px 24px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    {card.icon}
                  </Box>
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    {card.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3, lineHeight: 1.6 }}
                  >
                    {card.description}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    sx={{ mt: 'auto' }}
                  >
                    {card.action}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Paper
          sx={{
            p: 3,
            mt: 4,
            textAlign: 'center',
            border: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : 'rgba(0,0,0,0.1)'}`,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => router.push('/')}
              sx={{ minWidth: 120 }}
            >
              Go Home
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push('/login')}
              sx={{ minWidth: 120 }}
            >
              Logout
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DashboardPage; 