'use client';

import React from 'react';
import { ApprovalsView } from '@/components/ClinicalTrials/TrialOversightViews';

/** Ethics and regulatory approvals of the researcher's trials. */
export default function TrialApprovalsR() {
  return <ApprovalsView audience="researcher" />;
}
