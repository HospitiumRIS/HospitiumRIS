'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Alert, Box, Button, CircularProgress, Container, Stack } from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assignment as ProjectIcon,
  Home as HomeIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import ProposalOverview, { ProposalHeaderMeta } from '@/components/Proposals/ProposalOverview';

const PURPLE = '#8b6cbc';
const whiteBtn = { bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } };
const ghostBtn = { color: 'white', borderColor: 'rgba(255,255,255,0.6)', textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } };

/**
 * Project / proposal details for the research office: lifecycle, key figures, ethics
 * clearance, study description, milestones and deliverables flows, funding and team.
 */
export default function InstitutionProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [proposal, setProposal] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await fetch(`/api/proposals/${params.id}`, { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Project not found');
      setProposal(json.proposal);
    } catch (err) {
      setError(err.message);
    }
  }, [params.id]);

  useEffect(() => { if (params.id) load(); }, [params.id, load]);

  const back = () => router.push('/institution/projects');
  const crumbs = [{ label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' }, { label: 'Project tracking', path: '/institution/projects' }];

  if (!proposal) {
    return (
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <PageHeader compact title="Project details" icon={<ProjectIcon sx={{ fontSize: 28 }} />} breadcrumbs={crumbs} />
        <Container maxWidth={false} sx={{ py: 4, maxWidth: '1600px', mx: 'auto' }}>
          {error ? (
            <Stack spacing={2} alignItems="flex-start">
              <Alert severity="error" action={<Button size="small" onClick={load}>Retry</Button>}>{error}</Alert>
              <Button startIcon={<ArrowBackIcon />} onClick={back} sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE }}>Back to project tracking</Button>
            </Stack>
          ) : <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>}
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        compact
        clampTitle
        title={proposal.title}
        crumbLabel="Project details"
        description={`PI: ${proposal.principalInvestigator || 'not set'}`}
        meta={<ProposalHeaderMeta proposal={proposal} />}
        icon={<ProjectIcon sx={{ fontSize: 28 }} />}
        breadcrumbs={crumbs}
        actionButton={(
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={back} sx={whiteBtn}>Back</Button>
            {proposal.status !== 'DRAFT' ? (
              <Button variant="outlined" startIcon={<ReviewIcon />} onClick={() => router.push(`/institution/proposals/review/${proposal.id}`)} sx={ghostBtn}>Review record</Button>
            ) : null}
          </Stack>
        )}
      />
      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        <ProposalOverview
          proposal={proposal}
          audience="institution"
          ethicsHref={(id) => `/institution/ethics/review/${id}`}
          budgetHref={`/institution/projects/budget?project=${proposal.id}`}
          canMarkDeliverables
          onDeliverablesChange={(deliverables) => setProposal((p) => ({ ...p, deliverables }))}
        />
      </Container>
    </Box>
  );
}
