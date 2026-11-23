import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session-cookie';
import { getAuthenticatedUser, getSessionToken } from '@/lib/auth-server';
import { deleteSessionByToken } from '@/lib/sessions';
import { recordAuthEvent } from '@/lib/ops/audit';

export async function POST(request) {
  try {
    const { preserveRememberMe = false } = await request.json().catch(() => ({}));

    const user = await getAuthenticatedUser();
    if (user) {
      await recordAuthEvent(request, { action: 'LOGOUT', user });
    }

    // End the server-side session so the token stops working everywhere,
    // even if a copy of the cookie exists.
    await deleteSessionByToken(await getSessionToken()).catch((err) =>
      console.error('Failed to delete session on logout:', err.message)
    );
    
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
    
    clearSessionCookie(response);
    
    response.cookies.delete('orcid_remember_me');
    
    // Note: We don't clear the client-side remember me preference (localStorage)
    // unless explicitly requested, so users don't have to check it again
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}
