'use client';

import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import TrialList from '@/components/ClinicalTrials/TrialList';
import { sampleTrials } from '@/lib/clinical-trials';

/** My trials: the researcher's open trials, with "Register a trial" (#clinical-trials). */
export default function MyTrials() {
  const { user } = useAuth();
  const pi = user ? `${user.givenName || ''} ${user.familyName || ''}`.trim() || user.email : null;
  return <TrialList trials={sampleTrials({ mine: true })} audience="researcher" canRegister pi={pi} />;
}
