'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const Hero = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        backgroundImage: 'url("/hero_background.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)', // Dark overlay for better text readability
          zIndex: 1,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Box
          sx={{
            textAlign: 'center',
            pt: { xs: 4, md: 6 },
            pb: { xs: 6, md: 10 },
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 'bold',
              mb: 3,
              color: 'white',
            }}
          >
            Accelerate Research Output,
          </Typography>
          
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' },
              mb: 4,
              fontWeight: 300,
              opacity: 0.9,
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            Connect researchers worldwide, share breakthrough findings, and amplify the impact of your research through seamless collaboration and knowledge dissemination.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            sx={{
              justifyContent: 'center',
              alignItems: 'center',
              mt: 6,
            }}
          >
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                fontWeight: 'bold',
                boxShadow: `0 8px 32px ${theme.palette.primary.main}40`,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 12px 40px ${theme.palette.primary.main}60`,
                },
                transition: 'all 0.3s ease-in-out',
              }}
            >
              Get Started
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<SearchIcon />}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                borderColor: theme.palette.primary.light,
                backgroundColor: alpha(theme.palette.primary.light, 0.1),
                color: theme.palette.primary.light,
                fontWeight: 'bold',
                '&:hover': {
                  borderColor: theme.palette.primary.light,
                  backgroundColor: alpha(theme.palette.primary.light, 0.2),
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease-in-out',
              }}
            >
              Find Researchers
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Hero; 