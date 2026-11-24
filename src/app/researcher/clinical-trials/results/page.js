import { redirect } from 'next/navigation';

/** Moved into a tab (/researcher/clinical-trials/registry?tab=results). */
export default function Moved() {
  redirect('/researcher/clinical-trials/registry?tab=results');
}
