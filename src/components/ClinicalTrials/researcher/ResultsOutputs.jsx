'use client';

import React from 'react';
import { ResultsView } from '@/components/ClinicalTrials/TrialRecordsViews';

/** Results and outputs of the researcher's trials. */
export default function ResultsOutputs() {
  return <ResultsView audience="researcher" />;
}
