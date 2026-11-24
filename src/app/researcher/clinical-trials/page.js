import { redirect } from 'next/navigation';

/** Clinical trials home for researchers is "My trials". */
export default function ClinicalTrialsHome() {
  redirect('/researcher/clinical-trials/intake');
}
