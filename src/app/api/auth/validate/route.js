import { NextResponse } from 'next/server';
import { getSessionRef } from '@/lib/auth-server';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    // Check for session cookie
    const cookieStore = await cookies();
    const sessionCookie = await getSessionRef();
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, message: 'No session found' },
        { status: 401 }
      );
    }

    // getSessionRef looks the token up in the sessions table and rejects
    // expired, idle or revoked sessions and inactive accounts.

    return NextResponse.json(
      { success: true, message: 'Session valid' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { success: false, message: 'Session validation failed' },
      { status: 500 }
    );
  }
}
