'use client';

import { Groups as HubIcon } from '@mui/icons-material';
import TrialHub from '@/components/ClinicalTrials/institution/TrialHub';
import { RecruitmentView } from '@/components/ClinicalTrials/TrialConductViews';

const Recruitment = () => <RecruitmentView audience="institution" />;

/** Recruitment (clinical trials, research office). */
export default function Page() {
  return (
    <TrialHub
      path="/institution/clinical-trials/recruitment"
      title="Recruitment"
      description="Enrolment against plan for every recruiting trial, by site"
      icon={<HubIcon sx={{ fontSize: 32 }} />}
      tabs={[{ id: 'recruitment', label: 'Recruitment', Component: Recruitment }]}
    />
  );
}
