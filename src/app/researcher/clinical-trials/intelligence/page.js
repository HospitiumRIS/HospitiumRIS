import { redirect } from 'next/navigation';

/** Trial outputs and results live on Registry & results. */
export default function Moved() {
  redirect('/researcher/clinical-trials/registry?tab=results');
}
