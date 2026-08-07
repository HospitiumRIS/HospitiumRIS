import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import { getComplianceMetrics } from '../../../../../lib/complianceMetrics';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getComplianceMetrics(user.id);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching compliance analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch compliance analytics' }, { status: 500 });
  }
}
