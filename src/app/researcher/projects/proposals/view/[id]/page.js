'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assignment as ProposalIcon,
  Edit as EditIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import ProposalDetailView, { PURPLE, statusChip } from '@/components/Proposals/ProposalDetailView';

const isProposalEditable = (status) => status === 'DRAFT' || status === 'REVISION_REQUESTED';

export default function ProposalViewPage() {
  const router = useRouter();
  const params = useParams();
  const [proposal, setProposal] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.id) return undefined;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const [proposalRes, trackingRes] = await Promise.all([
          fetch(`/api/proposals/${params.id}`),
          fetch(`/api/proposals/${params.id}/review-status`),
        ]);
        const proposalData = await proposalRes.json();
        if (!proposalRes.ok || !proposalData.success) {
          throw new Error(proposalData.error || 'Failed to load proposal');
        }
        if (!cancelled) setProposal(proposalData.proposal);

        if (trackingRes.ok) {
          const trackingData = await trackingRes.json();
          if (!cancelled) setTracking(trackingData.tracking || null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load proposal');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: PURPLE }} />
      </Box>
    );
  }

  if (error || !proposal) {
    return (
      <Container maxWidth={false} sx={{ py: 4, maxWidth: '1600px', mx: 'auto' }}>
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error || 'Proposal not found'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/researcher/projects/proposals/list')} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
          Back to proposals
        </Button>
      </Container>
    );
  }

  const canEdit = isProposalEditable(proposal.status);

  return (
    <>
      <PageHeader
        title={proposal.title}
        description={`${proposal.principalInvestigator || 'Principal investigator not set'} · ${proposal.departments?.join(', ') || 'No department listed'}`}
        icon={<ProposalIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' },
          { label: 'Proposals', path: '/researcher/projects/proposals/list' },
          { label: 'Proposal details' },
        ]}
        actionButton={
          <Stack direction="row" spacing={1.25} alignItems="center">
            {statusChip(proposal.status)}
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/researcher/projects/proposals/list')}
              sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}
            >
              Back to list
            </Button>
            <Tooltip title={canEdit ? 'Edit proposal' : 'Submitted proposals cannot be edited'}>
              <span>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  disabled={!canEdit}
                  onClick={() => router.push(`/researcher/projects/proposals/edit/${params.id}`)}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 700,
                    '&.Mui-disabled': { borderColor: 'rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.55)' },
                  }}
                >
                  Edit
                </Button>
              </span>
            </Tooltip>
          </Stack>
        }
      />

      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        <ProposalDetailView
          proposal={proposal}
          tracking={tracking}
          onNavigate={(href) => router.push(href)}
          profileHref={(userId) => `/researcher/profile/${userId}`}
          ethicsHref={(ethicsId) => `/researcher/ethics/applications/view/${ethicsId}`}
        />
      </Container>
    </>
  );
}
