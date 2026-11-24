'use client';

import React from 'react';
import { RegistryView } from '@/components/ClinicalTrials/TrialOversightViews';

/** Registry status of the researcher's trials. */
export default function RegistrySubmissions() {
  return <RegistryView audience="researcher" />;
}
