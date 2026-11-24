import { redirect } from 'next/navigation';

/** Moved into a tab (/institution/clinical-trials/approvals?tab=registry). */
export default function Moved() {
  redirect('/institution/clinical-trials/approvals?tab=registry');
}
