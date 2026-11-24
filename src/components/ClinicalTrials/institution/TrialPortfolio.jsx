'use client';

import React from 'react';
import TrialList from '@/components/ClinicalTrials/TrialList';
import { sampleTrials } from '@/lib/clinical-trials';

/** Trial portfolio for the research office: every open trial; closed ones on their own tab. */
export default function TrialPortfolio() {
  return <TrialList trials={sampleTrials()} audience="institution" />;
}
