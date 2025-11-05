import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { logInfo, logError, getRequestMetadata } from '@/utils/activityLogger';

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

    // Find user by session ID (which is the user ID in our simple implementation)
    const user = await prisma.user.findUnique({
      where: { id: sessionCookie.value },
      include: {
        institution: true,
        foundation: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 401 }
      );
    }

    // Check if user is still active
    if (user.status !== 'ACTIVE' || !user.emailVerified) {
      return NextResponse.json(
        { success: false, message: 'Account is inactive or not verified' },
        { status: 401 }
      );
    }

    // Determine dashboard route based on account type
    let dashboardRoute = '/dashboard';
    switch (user.accountType) {
      case 'RESEARCHER':
        dashboardRoute = '/researcher';
        break;
      case 'RESEARCH_ADMIN':
        dashboardRoute = '/institution';
        break;
      case 'FOUNDATION_ADMIN':
        dashboardRoute = '/foundation';
        break;
      case 'SUPER_ADMIN':
        dashboardRoute = '/super-admin';
        break;
    }

    // Return user data (same format as login response)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.givenName, // For compatibility
        lastName: user.familyName, // For compatibility
        givenName: user.givenName,
        familyName: user.familyName,
        orcidId: user.orcidId,
        orcidGivenNames: user.orcidGivenNames,
        orcidFamilyName: user.orcidFamilyName,
        primaryInstitution: user.primaryInstitution,
        accountType: user.accountType,
        role: user.accountType, // For compatibility
        status: user.status,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      dashboardRoute
    }, { status: 200 });
    
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const requestMetadata = getRequestMetadata(request);
  
  try {
    const { action, orcidId, orcidData } = await request.json();

    if (action === 'check_orcid_user') {
      // Log ORCID user check request
      await logInfo('ORCID user check initiated', {
        ...requestMetadata,
        orcidId: orcidId,
        action: 'check_orcid_user'
      });

      // Check if user exists with this ORCID ID
      const existingUser = await prisma.user.findFirst({
        where: { orcidId: orcidId },
        include: {
          institution: true,
          foundation: true,
        }
      });

      if (existingUser) {
        // Check if user is activated and active
        if (!existingUser.emailVerified || existingUser.status !== 'ACTIVE') {
          await logError('ORCID user found but account inactive', {
            ...requestMetadata,
            userId: existingUser.id,
            email: existingUser.email,
            orcidId: orcidId,
            emailVerified: existingUser.emailVerified,
            status: existingUser.status
          });
          
          return NextResponse.json({
            success: false,
            userExists: true,
            accountActive: false,
            message: 'Account found but is inactive or not verified'
          }, { status: 403 });
        }

        await logInfo('ORCID user found and active', {
          ...requestMetadata,
          userId: existingUser.id,
          email: existingUser.email,
          orcidId: orcidId,
          accountType: existingUser.accountType
        });

        return NextResponse.json({
          success: true,
          userExists: true,
          accountActive: true,
          user: {
            id: existingUser.id,
            email: existingUser.email,
            accountType: existingUser.accountType,
            orcidId: existingUser.orcidId
          }
        });
      } else {
        await logInfo('ORCID user not found - needs registration', {
          ...requestMetadata,
          orcidId: orcidId,
          orcidName: orcidData?.name
        });

        return NextResponse.json({
          success: true,
          userExists: false,
          message: 'User not found, registration required'
        });
      }
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('ORCID user check error:', error);
    
    await logError('ORCID user check failed', {
      ...requestMetadata,
      error: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
