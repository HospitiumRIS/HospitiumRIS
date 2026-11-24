'use client';

import React from 'react';
import { TeamView } from '@/components/ClinicalTrials/TrialOversightViews';

/** The researcher's study teams: duties and GCP. */
export default function StudyTeam() {
  return <TeamView audience="researcher" />;
}
