import { NextResponse } from 'next/server';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { validateAssignment } from '@/lib/training-assignment';
import { assignTraining, institutionDepartments, listInstitutionMembers } from '@/lib/training-assignment-server';

/**
 * GET /api/training/[id]/assign?search=
 * People and departments of the training's own institution, for the assign dialog (#103).
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const search = new URL(request.url).searchParams.get('search') || '';
    const [members, departments] = await Promise.all([
      listInstitutionMembers(access.training.institutionId, { search }),
      search ? null : institutionDepartments(access.training.institutionId),
    ]);
    return NextResponse.json({ success: true, members, departments });
  } catch (error) {
    console.error('Loading assignees failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/training/[id]/assign
 * Body: { userIds?, departments?, allMembers?, dueDate?, allowOverCapacity?, note? }
 * Assign the training to people of its own institution only (#103).
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    if (access.training.status === 'CANCELLED' || access.training.status === 'COMPLETED') {
      return NextResponse.json({ error: 'This training is closed' }, { status: 400 });
    }
    const input = validateAssignment(await request.json().catch(() => ({})));
    if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });
    const result = await assignTraining(access.training, access.user, input.data);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Assigning training failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
