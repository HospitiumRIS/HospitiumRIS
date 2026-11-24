import { redirect } from 'next/navigation';

/** Moved into a tab (/researcher/clinical-trials/recruitment?tab=safety). */
export default function Moved() {
  redirect('/researcher/clinical-trials/recruitment?tab=safety');
}
