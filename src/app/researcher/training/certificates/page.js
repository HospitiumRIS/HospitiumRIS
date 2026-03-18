'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  Stack,
} from '@mui/material';
import {
  EmojiEvents as CertificateIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  School as TrainingIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import PageHeader from '@/components/common/PageHeader';
import { Home as HomeIcon } from '@mui/icons-material';

export default function CertificatesPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCertificates();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCertificates(certificates);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = certificates.filter(cert =>
        cert.training.title.toLowerCase().includes(query) ||
        cert.training.department.toLowerCase().includes(query)
      );
      setFilteredCertificates(filtered);
    }
  }, [searchQuery, certificates]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/training/my/certificates');
      const data = await response.json();

      if (data.success) {
        setCertificates(data.certificates || []);
        setFilteredCertificates(data.certificates || []);
      } else {
        setError(data.error || 'Failed to load certificates');
      }
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDownload = (certificateUrl, trainingTitle) => {
    window.open(certificateUrl, '_blank');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title="My Certificates"
        description="View and download your training certificates"
        icon={<CertificateIcon sx={{ fontSize: 40 }} />}
        breadcrumbs={[
          { label: 'Home', path: '/researcher', icon: <HomeIcon /> },
          { label: 'Training', path: '/researcher/training' },
          { label: 'Certificates' }
        ]}
      />
      <Container maxWidth="xl" sx={{ py: 4 }}>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search certificates by training name or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 600 }}
        />
      </Box>

      {/* Certificates Grid */}
      {filteredCertificates.length === 0 ? (
        <Alert severity="info" icon={<CertificateIcon />}>
          {searchQuery.trim() !== '' 
            ? 'No certificates found matching your search.'
            : 'You haven\'t earned any certificates yet. Complete trainings to receive certificates.'}
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {filteredCertificates.map((certificate) => (
            <Card
              key={certificate.id}
              sx={{
                width: 'calc(33.333% - 16px)',
                minWidth: '320px',
                display: 'flex',
                flexDirection: 'column',
                border: `2px solid ${theme.palette.success.light}`,
                '&:hover': {
                  boxShadow: theme.shadows[8],
                  transform: 'translateY(-4px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Certificate Icon */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.success.light,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CertificateIcon sx={{ fontSize: 48, color: theme.palette.success.dark }} />
                  </Box>
                </Box>

                {/* Training Title */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    textAlign: 'center',
                    mb: 2,
                    color: '#8b6cbc',
                  }}
                >
                  {certificate.training.title}
                </Typography>

                {/* Training Details */}
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrainingIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {certificate.training.department}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Completed: {formatDate(certificate.training.endDate)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CertificateIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Issued: {formatDate(certificate.issuedAt)}
                    </Typography>
                  </Box>
                </Stack>

                {/* Target Group Badge */}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Chip
                    label={certificate.training.targetGroup}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownload(certificate.certificateUrl, certificate.training.title)}
                  fullWidth
                  sx={{
                    backgroundColor: '#8b6cbc',
                    '&:hover': {
                      backgroundColor: '#7a5caa',
                    },
                  }}
                >
                  Download Certificate
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Summary Stats */}
      {certificates.length > 0 && (
        <Box
          sx={{
            mt: 4,
            p: 3,
            backgroundColor: theme.palette.grey[50],
            borderRadius: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CertificateIcon sx={{ fontSize: 32, color: '#8b6cbc' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Total Certificates Earned: {certificates.length}
          </Typography>
        </Box>
      )}
    </Container>
    </>
  );
}
