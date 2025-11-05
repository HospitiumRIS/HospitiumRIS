import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    // Check for session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hospitium_session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, message: 'No session found' },
        { status: 401 }
      );
    }

    // In a real application, you would validate the session against your database
    // For now, we'll just check if the cookie exists and is not expired
    
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
