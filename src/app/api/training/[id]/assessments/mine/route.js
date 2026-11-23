import { NextResponse } from 'next/server';
import { participantAssessments, requireParticipant } from '@/lib/training-assessment-server';

/** GET /api/training/[id]/assessments/mine: the participant's published assessments and attempts (#105). */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireParticipant(request, id);
    if (access.error) return access.error;
    const assessments = await participantAssessments(id, access.registration);
    return NextResponse.json({ success: true, assessments });
  } catch (error) {
    console.error('Loading my assessments failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
