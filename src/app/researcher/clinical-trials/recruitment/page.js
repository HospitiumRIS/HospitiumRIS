'use client';

import { HealthAndSafety as HubIcon } from '@mui/icons-material';
import TrialHub from '@/components/ClinicalTrials/institution/TrialHub';
import Recruitment from '@/components/ClinicalTrials/researcher/Recruitment';
import SafetyDeviations from '@/components/ClinicalTrials/researcher/SafetyDeviations';

/** Recruitment & safety (clinical trials, researcher). */
export default function Page() {
  return (
    <TrialHub
      home="/researcher"
      root="/researcher/clinical-trials/intake"
      path="/researcher/clinical-trials/recruitment"
      title="Recruitment & safety"
      description="Enrolment against targets, serious adverse events and protocol deviations"
      icon={<HubIcon sx={{ fontSize: 32 }} />}
      tabs={[{ id: 'recruitment', label: 'Recruitment', Component: Recruitment }, { id: 'safety', label: 'Safety & deviations', Component: SafetyDeviations }]}
      links={[]}
    />
  );
}
