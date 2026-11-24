'use client';

import { Science as HubIcon } from '@mui/icons-material';
import TrialHub from '@/components/ClinicalTrials/institution/TrialHub';
import TrialPortfolio from '@/components/ClinicalTrials/institution/TrialPortfolio';
import TrialDocuments from '@/components/ClinicalTrials/institution/TrialDocuments';
import TrialList from '@/components/ClinicalTrials/TrialList';
import { sampleTrials } from '@/lib/clinical-trials';

const ClosedTrials = () => <TrialList trials={sampleTrials()} audience="institution" closed />;

/** Trial portfolio (clinical trials, research office). */
export default function Page() {
  return (
    <TrialHub
      path="/institution/clinical-trials"
      title="Trial portfolio"
      description="Every clinical trial of your institution, by phase and status, with its documents"
      icon={<HubIcon sx={{ fontSize: 32 }} />}
      tabs={[{ id: 'portfolio', label: 'Open trials', Component: TrialPortfolio }, { id: 'closed', label: 'Closed trials', Component: ClosedTrials }, { id: 'documents', label: 'Documents', Component: TrialDocuments }]}
      links={[]}
    />
  );
}
