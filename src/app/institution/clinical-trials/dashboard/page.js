'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClinicalTrialsDashboardPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/institution/clinical-trials/reports');
  }, [router]);
  return null;
}
