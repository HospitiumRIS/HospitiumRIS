'use client';

import { HealthAndSafety as HubIcon } from '@mui/icons-material';
import TrialHub from '@/components/ClinicalTrials/institution/TrialHub';
import TrialSafety from '@/components/ClinicalTrials/institution/TrialSafety';
import TrialCompliance from '@/components/ClinicalTrials/institution/TrialCompliance';
import TrialTeamGcp from '@/components/ClinicalTrials/institution/TrialTeamGcp';

/** Safety & compliance (clinical trials, research office). */
export default function Page() {
  return (
    <TrialHub
      path="/institution/clinical-trials/safety"
      title="Safety & compliance"
      description="Serious adverse events, protocol deviations, compliance flags and GCP certification"
      icon={<HubIcon sx={{ fontSize: 32 }} />}
      tabs={[{ id: 'safety', label: 'Safety events & deviations', Component: TrialSafety }, { id: 'compliance', label: 'Compliance flags', Component: TrialCompliance }, { id: 'gcp', label: 'Team & GCP', Component: TrialTeamGcp }]}
      links={[]}
    />
  );
}
