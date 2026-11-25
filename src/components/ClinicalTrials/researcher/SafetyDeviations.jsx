'use client';

import React from 'react';
import { SafetyView } from '@/components/ClinicalTrials/TrialConductViews';

/** SAEs and deviations of the researcher's trials. */
export default function SafetyDeviations() {
  return <SafetyView audience="researcher" />;
}
