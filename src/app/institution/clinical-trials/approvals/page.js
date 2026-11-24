'use client';

import { Gavel as HubIcon } from '@mui/icons-material';
import TrialHub from '@/components/ClinicalTrials/institution/TrialHub';
import TrialApprovals from '@/components/ClinicalTrials/institution/TrialApprovals';
import TrialRegistry from '@/components/ClinicalTrials/institution/TrialRegistry';

/** Approvals & registry (clinical trials, research office). */
export default function Page() {
  return (
    <TrialHub
      path="/institution/clinical-trials/approvals"
      title="Approvals & registry"
      description="Ethics and regulatory approvals of trials, and their public registry status"
      icon={<HubIcon sx={{ fontSize: 32 }} />}
      tabs={[{ id: 'approvals', label: 'Ethics & regulatory approvals', Component: TrialApprovals }, { id: 'registry', label: 'Registry (PACTR / ClinicalTrials.gov)', Component: TrialRegistry }]}
      links={[{ label: 'Ethics register', href: '/institution/ethics/applications' }]}
    />
  );
}
