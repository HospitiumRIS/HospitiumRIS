import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { isTrainingAdmin, resolveTrainingScopeContext } from '@/lib/training-admin-server';

/** Training admin + their institution, or an error response (compliance routes, #140). */
export async function complianceAdmin(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!isTrainingAdmin(user)) return { error: NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 }) };
  const { institutionId } = await resolveTrainingScopeContext(user);
  if (!institutionId) return { error: NextResponse.json({ error: 'No institution linked to your account' }, { status: 400 }) };
  return { user, institutionId };
}
