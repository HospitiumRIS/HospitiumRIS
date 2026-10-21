import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';

export const FOUNDATION_ROLES = ['FOUNDATION_ADMIN', 'GLOBAL_ADMIN'];

/** Require a signed-in foundation or global admin. Returns { user } or { error }. */
export async function requireFoundationAdmin() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { error: NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 }) };
  }
  if (!FOUNDATION_ROLES.includes(user.accountType)) {
    return { error: NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 }) };
  }
  return { user };
}
