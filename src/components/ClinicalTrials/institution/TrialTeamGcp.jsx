'use client';

import React from 'react';
import { TeamView } from '@/components/ClinicalTrials/TrialOversightViews';

/** Team and GCP certification across the institution's trials. */
export default function TrialTeamGcp() {
  return <TeamView audience="institution" />;
}
