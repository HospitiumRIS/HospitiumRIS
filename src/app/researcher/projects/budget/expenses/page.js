'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

const ExpensesRedirectPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the consolidated budget management page
    router.replace('/researcher/projects/budget/view');
  }, [router]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
};

export default ExpensesRedirectPage;