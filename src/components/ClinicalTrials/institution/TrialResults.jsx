'use client';

import React from 'react';
import { ResultsView } from '@/components/ClinicalTrials/TrialRecordsViews';

/** Results and outputs across the institution's trials. */
export default function TrialResults() {
  return <ResultsView audience="institution" />;
}
