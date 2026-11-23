'use client';

import { useParams } from 'next/navigation';
import PresentCheckIn from '@/components/Training/PresentCheckIn';

/** Check-in display for a session, for training admins (#93). */
export default function PresentCheckInPage() {
  const { id, sid } = useParams();
  return <PresentCheckIn trainingId={id} sid={sid} closeHref={`/institution/training/${id}`} />;
}
