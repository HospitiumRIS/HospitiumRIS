'use client';

import React, { useState, useEffect } from 'react';
import { LinearProgress, Box } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@mui/material/styles';

const NavigationProgressBar = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  useEffect(() => {
    let timeout;

    const handleStart = () => {
      setIsLoading(true);
    };

    const handleComplete = () => {
      timeout = setTimeout(() => {
        setIsLoading(false);
      }, 300);
    };

    // Store original router methods
    const originalPush = router.push;
    const originalReplace = router.replace;

    // Override router methods to show progress
    router.push = async function(href, options) {
      handleStart();
      try {
        const result = await originalPush.call(this, href, options);
        return result;
      } catch (error) {
        handleComplete();
        throw error;
      }
    };

    router.replace = async function(href, options) {
      handleStart();
      try {
        const result = await originalReplace.call(this, href, options);
        return result;
      } catch (error) {
        handleComplete();
        throw error;
      }
    };

    // Cleanup function
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      // Restore original router methods
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [router]);

  // Effect to handle navigation completion via pathname changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: { xs: 56, sm: 64 }, // Height of AppBar
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar + 1,
        height: '2px',
      }}
    >
      <LinearProgress
        sx={{
          height: '2px',
          backgroundColor: 'transparent',
          '& .MuiLinearProgress-bar': {
            backgroundColor: theme.palette.primary.main,
          },
        }}
      />
    </Box>
  );
};

export default NavigationProgressBar; 