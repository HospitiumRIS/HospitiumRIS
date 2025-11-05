import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isTokenExpired } from '@/lib/email';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Activation token is required',
          error: 'MISSING_TOKEN'
        },
        { status: 400 }
      );
    }

    // Find user with this activation token
    const user = await prisma.user.findUnique({
      where: { 
        emailVerifyToken: token 
      },
      include: {
        institution: true,
        foundation: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired activation token',
          error: 'INVALID_TOKEN'
        },
        { status: 404 }
      );
    }

    // Check if token is expired
    if (user.emailVerifyExpires && isTokenExpired(user.emailVerifyExpires)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Activation token has expired. Please request a new one.',
          error: 'TOKEN_EXPIRED'
        },
        { status: 410 }
      );
    }

    // Check if already activated
    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: true,
          message: 'Account is already activated',
          user: {
            id: user.id,
            email: user.email,
            givenName: user.givenName,
            familyName: user.familyName,
            accountType: user.accountType,
            emailVerified: true,
          },
          alreadyActivated: true
        },
        { status: 200 }
      );
    }

    // Activate the user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
        status: 'ACTIVE', // Activate the account
      },
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Account activated successfully! You can now log in.',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          givenName: updatedUser.givenName,
          familyName: updatedUser.familyName,
          accountType: updatedUser.accountType,
          emailVerified: true,
          status: updatedUser.status,
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Activation error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error during activation',
        error: process.env.NODE_ENV === 'development' ? error.message : 'ACTIVATION_FAILED'
      },
      { status: 500 }
    );
  }
}

// Also support POST for form submissions
export async function POST(request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Activation token is required',
          error: 'MISSING_TOKEN'
        },
        { status: 400 }
      );
    }

    // Create a new URL with the token as a query parameter and use the GET handler
    const url = new URL(request.url);
    url.searchParams.set('token', token);
    
    // Create a new request object
    const newRequest = new Request(url.toString(), {
      method: 'GET',
      headers: request.headers,
    });

    return await GET(newRequest);

  } catch (error) {
    console.error('POST activation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Invalid request format',
        error: 'INVALID_REQUEST'
      },
      { status: 400 }
    );
  }
}
