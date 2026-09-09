import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session-cookie';

export async function POST(request) {
  try {
    const { preserveRememberMe = false } = await request.json().catch(() => ({}));
    
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
