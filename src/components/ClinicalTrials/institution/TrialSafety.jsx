'use client';

import React from 'react';
import { SafetyView } from '@/components/ClinicalTrials/TrialConductViews';

/** SAEs and deviations across the institution's trials. */
export default function TrialSafety() {
  return <SafetyView audience="institution" />;
}
