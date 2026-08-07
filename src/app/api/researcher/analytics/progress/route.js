import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import { getProjectsMetrics } from '../../../../../lib/projectsMetrics';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getProjectsMetrics(user.id);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching projects analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch projects analytics' }, { status: 500 });
  }
}
