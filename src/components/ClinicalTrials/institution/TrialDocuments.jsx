'use client';

import React from 'react';
import { DocumentsView } from '@/components/ClinicalTrials/TrialRecordsViews';

/** Trial master file across the institution's trials. */
export default function TrialDocuments() {
  return <DocumentsView audience="institution" />;
}
