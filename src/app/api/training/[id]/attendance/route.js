import { NextResponse } from 'next/server';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { loadAttendanceMatrix } from '@/lib/training-attendance-server';

/**
 * GET /api/training/[id]/attendance
 * The attendance register (sessions × active participants). Training admin only (#92).
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;

    const matrix = await loadAttendanceMatrix(id);
    return NextResponse.json({ success: true, ...matrix });
  } catch (error) {
    console.error('Error loading attendance register:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
