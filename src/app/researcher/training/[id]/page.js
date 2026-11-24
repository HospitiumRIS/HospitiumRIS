'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Button, Container } from '@mui/material';
import { ArrowBack as BackIcon, Home as HomeIcon, School as TrainingIcon } from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import TrainingDetailView from '@/components/Training/researcher/TrainingDetailView';

/** A training's full page for participants (#107). */
export default function ResearcherTrainingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [training, setTraining] = useState(null);
  return (
    <Box>
      <PageHeader
        title={training?.title || 'Training'}
        description={training ? [training.department, training.code].filter(Boolean).join(' · ') || 'Sessions, modules, materials, assessments and your progress.' : 'Sessions, modules, materials, assessments and your progress.'}
        icon={<TrainingIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' },
          { label: 'Training', path: '/researcher/training' },
        ]}
        actionButton={(
          <Button variant="contained" startIcon={<BackIcon />} onClick={() => router.push('/researcher/training')} sx={{ bgcolor: 'white', color: '#8b6cbc', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}>
            My learning
          </Button>
        )}
      />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <TrainingDetailView trainingId={id} onLoaded={setTraining} />
      </Container>
    </Box>
  );
}
