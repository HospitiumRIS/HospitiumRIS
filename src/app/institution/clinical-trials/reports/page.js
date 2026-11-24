import { redirect } from 'next/navigation';

/** Moved into a tab (/institution/clinical-trials/results?tab=reports). */
export default function Moved() {
  redirect('/institution/clinical-trials/results?tab=reports');
}
