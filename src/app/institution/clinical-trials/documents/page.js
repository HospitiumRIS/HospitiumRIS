import { redirect } from 'next/navigation';

/** Moved into a tab (/institution/clinical-trials?tab=documents). */
export default function Moved() {
  redirect('/institution/clinical-trials?tab=documents');
}
