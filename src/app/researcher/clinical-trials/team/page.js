import { redirect } from 'next/navigation';

/** Moved into a tab (/researcher/clinical-trials/approvals?tab=team). */
export default function Moved() {
  redirect('/researcher/clinical-trials/approvals?tab=team');
}
