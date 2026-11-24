'use client';

import { Insights as HubIcon } from '@mui/icons-material';
import TrialHub from '@/components/ClinicalTrials/institution/TrialHub';
import TrialResults from '@/components/ClinicalTrials/institution/TrialResults';
import TrialReports from '@/components/ClinicalTrials/institution/TrialReports';

/** Results & reporting (clinical trials, research office). */
export default function Page() {
  return (
    <TrialHub
      path="/institution/clinical-trials/results"
      title="Results & reporting"
      description="Results submission deadlines, outputs and trial reports"
      icon={<HubIcon sx={{ fontSize: 32 }} />}
      tabs={[{ id: 'results', label: 'Results & outputs', Component: TrialResults }, { id: 'reports', label: 'Reports & analytics', Component: TrialReports }]}
      links={[]}
    />
  );
}
