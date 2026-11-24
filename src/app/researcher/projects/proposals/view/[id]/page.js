'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Alert, Box, Button, CircularProgress, Container, Stack, Tooltip } from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assignment as ProposalIcon,
  Edit as EditIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import ProposalOverview, { ProposalHeaderMeta } from '@/components/Proposals/ProposalOverview';

const PURPLE = '#8b6cbc';
const isProposalEditable = (status) => status === 'DRAFT' || status === 'REVISION_REQUESTED';
const whiteBtn = { bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } };

/** A researcher's proposal / project, laid out like the research office's project page. */
export default function ProposalViewPage() {
  const router = useRouter();
  const params = useParams();
  const [proposal, setProposal] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.id) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [proposalRes, trackingRes] = await Promise.all([
          fetch(`/api/proposals/${params.id}`),
          fetch(`/api/proposals/${params.id}/review-status`),
        ]);
        const data = await proposalRes.json();
        if (!proposalRes.ok || !data.success) throw new Error(data.error || 'Failed to load proposal');
        if (!cancelled) setProposal(data.proposal);
        if (trackingRes.ok) {
          const t = await trackingRes.json();
          if (!cancelled) setTracking(t.tracking || null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load proposal');
      }
    })();
    return () => { cancelled = true; };
  }, [params.id]);

  const back = () => router.push('/researcher/projects/proposals/list');
  const crumbs = [{ label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' }, { label: 'My proposals', path: '/researcher/projects/proposals/list' }];

  if (!proposal) {
    return (
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <PageHeader compact title="Proposal details" icon={<ProposalIcon sx={{ fontSize: 28 }} />} breadcrumbs={crumbs} />
        <Container maxWidth={false} sx={{ py: 4, maxWidth: '1600px', mx: 'auto' }}>
          {error ? (
            <Stack spacing={2} alignItems="flex-start">
              <Alert severity="error">{error}</Alert>
              <Button startIcon={<ArrowBackIcon />} onClick={back} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>Back to proposals</Button>
            </Stack>
          ) : <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>}
        </Container>
      </Box>
    );
  }

  const canEdit = isProposalEditable(proposal.status);

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        compact
        clampTitle
        title={proposal.title}
        crumbLabel="Proposal details"
        description={`PI: ${proposal.principalInvestigator || 'not set'}`}
        meta={<ProposalHeaderMeta proposal={proposal} />}
        icon={<ProposalIcon sx={{ fontSize: 28 }} />}
        breadcrumbs={crumbs}
        actionButton={(
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={back} sx={whiteBtn}>Back</Button>
            <Tooltip title={canEdit ? 'Edit proposal' : 'Submitted proposals cannot be edited'}>
              <span>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  disabled={!canEdit}
                  onClick={() => router.push(`/researcher/projects/proposals/edit/${params.id}`)}
                  sx={{ borderColor: 'white', color: 'white', textTransform: 'none', fontWeight: 700, '&.Mui-disabled': { borderColor: 'rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.55)' } }}
                >
                  Edit
                </Button>
              </span>
            </Tooltip>
          </Stack>
        )}
      />
      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        <ProposalOverview
          proposal={proposal}
          tracking={tracking}
          audience="researcher"
          ethicsHref={(id) => `/researcher/ethics/applications/view/${id}`}
          budgetHref={`/researcher/projects/budget/view/${proposal.id}`}
          profileHref={(userId) => `/researcher/profile/${userId}`}
          canMarkDeliverables
          onDeliverablesChange={(deliverables) => setProposal((p) => ({ ...p, deliverables }))}
        />
      </Container>
    </Box>
  );
}
