import { redirect } from 'next/navigation';

/** Moved into a tab (/institution/clinical-trials/safety?tab=gcp). */
export default function Moved() {
  redirect('/institution/clinical-trials/safety?tab=gcp');
}
