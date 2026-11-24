'use client';

import React from 'react';
import TrialList from '@/components/ClinicalTrials/TrialList';
import { sampleTrials } from '@/lib/clinical-trials';

/** Closed trials: completed, terminated or withdrawn, with outcome, registry results and lessons. */
export default function ClosedTrials() {
  return <TrialList trials={sampleTrials({ mine: true })} audience="researcher" closed />;
}
