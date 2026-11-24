import { redirect } from 'next/navigation';

/** Team members are added and opened in side panels on Approvals & team. */
export default function Moved() {
  redirect('/researcher/clinical-trials/approvals?tab=team');
}
