import { redirect } from 'next/navigation';

/** Moved into a tab (/researcher/clinical-trials/intake?tab=documents). */
export default function Moved() {
  redirect('/researcher/clinical-trials/intake?tab=documents');
}
