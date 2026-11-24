import { redirect } from 'next/navigation';

/** Trial details now open in a side panel on My trials. */
export default function TrialViewMoved() {
  redirect('/researcher/clinical-trials/intake');
}
