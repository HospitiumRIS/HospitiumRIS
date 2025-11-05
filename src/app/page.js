'use client';

import { Box } from '@mui/material';
import { useThemeMode } from '../components/ThemeProvider';
import Hero from '../components/Hero';
import KeyFeatures from '../components/KeyFeatures';
import Footer from '../components/Footer';

export default function Home() {
  const { isClient, isHydrated } = useThemeMode();

  // Show basic layout while hydrating to prevent hydration mismatch
  if (!isHydrated || !isClient) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Hero />
        <KeyFeatures />
        <Footer />
      </div>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Hero />
      <KeyFeatures />
      <Footer />
    </Box>
  );
}
