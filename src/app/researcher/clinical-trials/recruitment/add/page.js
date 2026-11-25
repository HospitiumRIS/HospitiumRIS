import { redirect } from 'next/navigation';

/** Enrolment is recorded and viewed in a side panel on Recruitment & safety. */
export default function Moved() {
  redirect('/researcher/clinical-trials/recruitment');
}
