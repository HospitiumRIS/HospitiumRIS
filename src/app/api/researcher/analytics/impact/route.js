import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import { getImpactMetrics } from '../../../../../lib/impactMetrics';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const impactData = await getImpactMetrics(user.id);

    return NextResponse.json(impactData);
  } catch (error) {
    console.error('Error fetching impact analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch impact analytics' }, { status: 500 });
  }
}
