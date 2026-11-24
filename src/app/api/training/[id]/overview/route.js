import { NextResponse } from 'next/server';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { loadTrainingOverview } from '@/lib/training-workspace-server';

/**
 * GET /api/training/[id]/overview
 * The admin workspace overview: setup checklist, figures, next session, recent activity.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const overview = await loadTrainingOverview(access.training);
    return NextResponse.json({ success: true, ...overview });
  } catch (error) {
    console.error('Error loading training overview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
