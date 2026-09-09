import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';

export async function requireGlobalAdmin() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (user.accountType !== 'GLOBAL_ADMIN') {
    return {
      error: NextResponse.json(
        { error: 'Forbidden - Global Admin access required' },
        { status: 403 }
      ),
    };
  }

  return { user };
}
