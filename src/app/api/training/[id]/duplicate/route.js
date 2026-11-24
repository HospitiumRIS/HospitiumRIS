import { NextResponse } from 'next/server';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { duplicateTraining } from '@/lib/training-manage-server';

/**
 * POST /api/training/[id]/duplicate
 * A new draft cohort of the same course: details, settings, modules and materials (#144).
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const result = await duplicateTraining(access.training, access.user);
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    console.error('Duplicating training failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
