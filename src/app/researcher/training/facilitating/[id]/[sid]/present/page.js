'use client';

import { useParams } from 'next/navigation';
import PresentCheckIn from '@/components/Training/PresentCheckIn';

/** Check-in display for a session, for its facilitators (#104). The API checks access. */
export default function FacilitatorPresentPage() {
  const { id, sid } = useParams();
  return <PresentCheckIn trainingId={id} sid={sid} closeHref="/researcher/training/facilitating" />;
}
