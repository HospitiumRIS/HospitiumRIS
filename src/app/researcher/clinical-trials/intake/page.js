'use client';

import { Science as HubIcon } from '@mui/icons-material';
import TrialHub from '@/components/ClinicalTrials/institution/TrialHub';
import MyTrials from '@/components/ClinicalTrials/researcher/MyTrials';
import ClosedTrials from '@/components/ClinicalTrials/researcher/ClosedTrials';
import TrialDocumentsR from '@/components/ClinicalTrials/researcher/TrialDocumentsR';

/** My trials (clinical trials, researcher). */
export default function Page() {
  return (
    <TrialHub
      home="/researcher"
      root="/researcher/clinical-trials/intake"
      path="/researcher/clinical-trials/intake"
      title="My trials"
      description="Register trials, follow the ones you run, and keep their documents"
      icon={<HubIcon sx={{ fontSize: 32 }} />}
      tabs={[{ id: 'active', label: 'Active trials', Component: MyTrials }, { id: 'closed', label: 'Closed trials', Component: ClosedTrials }, { id: 'documents', label: 'Documents', Component: TrialDocumentsR }]}
      links={[]}
    />
  );
}
