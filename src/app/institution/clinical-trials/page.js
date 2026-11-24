'use client';

import { Science as HubIcon } from '@mui/icons-material';
import TrialHub from '@/components/ClinicalTrials/institution/TrialHub';
import TrialPortfolio from '@/components/ClinicalTrials/institution/TrialPortfolio';
import TrialDocuments from '@/components/ClinicalTrials/institution/TrialDocuments';

/** Trial portfolio (clinical trials, research office). */
export default function Page() {
  return (
    <TrialHub
      path="/institution/clinical-trials"
      title="Trial portfolio"
      description="Every clinical trial of your institution, by phase and status, with its documents"
      icon={<HubIcon sx={{ fontSize: 32 }} />}
      tabs={[{ id: 'portfolio', label: 'Portfolio', Component: TrialPortfolio }, { id: 'documents', label: 'Documents', Component: TrialDocuments }]}
      links={[]}
    />
  );
}
