'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
} from '@mui/material';
import {
  Person as ResearcherIcon,
  Business as InstitutionIcon,
  AccountBalance as FoundationIcon,
  AdminPanelSettings as SuperAdminIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';
import Image from 'next/image';

const SelectInterfacePage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedInterface, setSelectedInterface] = useState(null);

  useEffect(() => {
    // Redirect if not logged in or not a Global Admin
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Only Global Admin should access this page
    if (user.accountType !== 'GLOBAL_ADMIN') {
      // Redirect to their default dashboard
      const defaultRoutes = {
        'RESEARCHER': '/researcher',
        'RESEARCH_ADMIN': '/institution',
        'FOUNDATION_ADMIN': '/foundation',
        'SUPER_ADMIN': '/super-admin'
      };
      router.push(defaultRoutes[user.accountType] || '/dashboard');
    }
  }, [user, router]);

  const interfaces = [
    {
      id: 'researcher',
      title: 'Researcher',
      description: 'Individual researcher or academic',
      icon: <ResearcherIcon sx={{ fontSize: 40, color: '#8b6cbc' }} />,
      route: '/researcher',
    },
    {
      id: 'institution',
      title: 'Research Administrator',
      description: 'Manage institutional research activities',
      icon: <InstitutionIcon sx={{ fontSize: 40, color: '#8b6cbc' }} />,
      route: '/institution',
    },
    {
      id: 'foundation',
      title: 'Foundation Administrator',
      description: 'Manage foundation research programs',
      icon: <FoundationIcon sx={{ fontSize: 40, color: '#8b6cbc' }} />,
      route: '/foundation',
    },
  ];

  const handleInterfaceSelect = (interfaceData) => {
    setSelectedInterface(interfaceData.id);
    setTimeout(() => {
      router.push(interfaceData.route);
    }, 300);
  };

  if (!user || user.accountType !== 'GLOBAL_ADMIN') {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            borderRadius: 2,
            border: '1px solid #e0e0e0',
          }}
        >
          {/* Logo and Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: '#8b6cbc',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.2rem' }}>H</Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#333',
                }}
              >
                HospitiumRIS
              </Typography>
            </Box>
            
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: '#333',
                mb: 1,
              }}
            >
              Select Interface
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#666',
              }}
            >
              Choose the interface you want to access
            </Typography>
          </Box>

          {/* Interface Cards */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            {interfaces.map((interfaceData) => (
              <Paper
                key={interfaceData.id}
                elevation={0}
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  border: selectedInterface === interfaceData.id ? '2px solid #8b6cbc' : '1px solid #e0e0e0',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  flex: '1 1 calc(33.333% - 16px)',
                  minWidth: '200px',
                  maxWidth: '280px',
                  '&:hover': {
                    borderColor: '#8b6cbc',
                    bgcolor: '#fafafa',
                  },
                }}
                onClick={() => handleInterfaceSelect(interfaceData)}
              >
                <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#f3e5f5',
                      borderRadius: 2,
                    }}
                  >
                    {interfaceData.icon}
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        color: '#333',
                        mb: 0.5,
                      }}
                    >
                      {interfaceData.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666',
                        fontSize: '0.875rem',
                      }}
                    >
                      {interfaceData.description}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Box>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#999',
              }}
            >
              You can switch between interfaces at any time
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default SelectInterfacePage;
