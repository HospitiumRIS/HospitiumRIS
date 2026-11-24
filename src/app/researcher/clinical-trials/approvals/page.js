'use client';

import { Gavel as HubIcon } from '@mui/icons-material';
import TrialHub from '@/components/ClinicalTrials/institution/TrialHub';
import TrialApprovalsR from '@/components/ClinicalTrials/researcher/TrialApprovalsR';
import StudyTeam from '@/components/ClinicalTrials/researcher/StudyTeam';

/** Approvals & team (clinical trials, researcher). */
export default function Page() {
  return (
    <TrialHub
      home="/researcher"
      root="/researcher/clinical-trials/intake"
      path="/researcher/clinical-trials/approvals"
      title="Approvals & team"
      description="Ethics and regulatory approvals per trial, and your study team's delegation and GCP"
      icon={<HubIcon sx={{ fontSize: 32 }} />}
      tabs={[{ id: 'approvals', label: 'Ethics & regulatory approvals', Component: TrialApprovalsR }, { id: 'team', label: 'Study team & GCP', Component: StudyTeam }]}
      links={[{ label: 'My ethics applications', href: '/researcher/ethics/applications' }]}
    />
  );
}
