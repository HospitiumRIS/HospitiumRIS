'use client';

import React from 'react';
import { ApprovalsView } from '@/components/ClinicalTrials/TrialOversightViews';

/** Approvals across the institution's trials. */
export default function TrialApprovals() {
  return <ApprovalsView audience="institution" />;
}
