'use client';

import React from 'react';
import { RegistryView } from '@/components/ClinicalTrials/TrialOversightViews';

/** Registry oversight across the institution's trials. */
export default function TrialRegistry() {
  return <RegistryView audience="institution" />;
}
