import { redirect } from 'next/navigation';

/** Funding analytics moved to Projects › Budget & expenses › Funding (#179). */
export default function FundingRedirect() {
  redirect('/institution/projects/budget?tab=funding');
}
