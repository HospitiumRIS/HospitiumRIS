'use client';

import React from 'react';
import { DocumentsView } from '@/components/ClinicalTrials/TrialRecordsViews';

/** Trial master file of the researcher's trials. */
export default function TrialDocumentsR() {
  return <DocumentsView audience="researcher" />;
}
