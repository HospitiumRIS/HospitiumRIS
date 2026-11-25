'use client';

import React from 'react';
import { RecruitmentView } from '@/components/ClinicalTrials/TrialConductViews';

/** Enrolment against plan for the researcher's trials. */
export default function Recruitment() {
  return <RecruitmentView audience="researcher" />;
}
