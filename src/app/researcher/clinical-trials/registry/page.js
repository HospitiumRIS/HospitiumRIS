'use client';

import { Insights as HubIcon } from '@mui/icons-material';
import TrialHub from '@/components/ClinicalTrials/institution/TrialHub';
import RegistrySubmissions from '@/components/ClinicalTrials/researcher/RegistrySubmissions';
import ResultsOutputs from '@/components/ClinicalTrials/researcher/ResultsOutputs';

/** Registry & results (clinical trials, researcher). */
export default function Page() {
  return (
    <TrialHub
      home="/researcher"
      root="/researcher/clinical-trials/intake"
      path="/researcher/clinical-trials/registry"
      title="Registry & results"
      description="Public registry submissions (PACTR, ClinicalTrials.gov), results and outputs"
      icon={<HubIcon sx={{ fontSize: 32 }} />}
      tabs={[{ id: 'registry', label: 'Registry submissions', Component: RegistrySubmissions }, { id: 'results', label: 'Results & outputs', Component: ResultsOutputs }]}
      links={[]}
    />
  );
}
