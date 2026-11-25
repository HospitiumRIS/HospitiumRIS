import { redirect } from 'next/navigation';

/** Outputs are linked in a side panel on Registry & results › Results & outputs. */
export default function Moved() {
  redirect('/researcher/clinical-trials/registry?tab=results');
}
