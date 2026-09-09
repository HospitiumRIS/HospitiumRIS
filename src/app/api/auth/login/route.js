import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logApiActivity, logError, logInfo, logSuccess, getRequestMetadata } from '@/utils/activityLogger';
import { linkInstitutionIfNeeded } from '@/lib/institution-domain';
import { setSessionCookie } from '@/lib/session-cookie';
import { resolveUserEnabledModules } from '@/lib/institution-modules';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     description: Logs in a user
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

export async function POST(request) {
  const requestMetadata = getRequestMetadata(request);
  let requestBody;
  
  try {
    requestBody = await request.json();
    const { email, password, rememberMe, orcidLogin, orcidId, orcidData } = requestBody;

    // Handle ORCID login flow
    if (orcidLogin && orcidId && orcidData) {
      await logInfo('ORCID login attempt initiated', {
        ...requestMetadata,
        orcidId: orcidId,
        orcidName: orcidData.name,
        rememberMe: rememberMe || false,
        loginMethod: 'orcid'
      });

      // Find user by ORCID ID
      const user = await prisma.user.findFirst({
        where: { orcidId: orcidId },
        include: {
          institution: true,
          secondaryInstitution: true,
          foundation: true,
        }
      });

      if (!user) {
        await logError('ORCID login failed: User not found', {
          ...requestMetadata,
          orcidId: orcidId,
          orcidName: orcidData.name,
          reason: 'user_not_found'
        });

        await logApiActivity('POST', '/api/auth/login', 401, {
          ...requestMetadata,
          orcidId: orcidId,
          error: 'user_not_found'
        });

        return NextResponse.json(
          {
            success: false,
            message: 'ORCID account not found. Please register first.',
            needsRegistration: true,
            redirectTo: '/register?orcid=true'
          },
          { status: 401 }
        );
      }

      // Check if user is activated
      if (!user.emailVerified) {
        await logError('ORCID login failed: Account not activated', {
          ...requestMetadata,
          userId: user.id,
          email: user.email,
          orcidId: orcidId,
          accountType: user.accountType,
          reason: 'account_not_activated'
        });

        await logApiActivity('POST', '/api/auth/login', 403, {
          ...requestMetadata,
          userId: user.id,
          email: user.email,
          error: 'account_not_activated'
        });

        return NextResponse.json(
          {
            success: false,
            message: 'Account not activated. Please check your email and activate your account first.',
            redirectTo: '/resend-activation',
            needsActivation: true
          },
          { status: 403 }
        );
      }

      // Check if user status is active
      if (user.status !== 'ACTIVE') {
        await logError('ORCID login failed: Account suspended or inactive', {
          ...requestMetadata,
          userId: user.id,
          email: user.email,
          orcidId: orcidId,
          accountType: user.accountType,
          userStatus: user.status,
          reason: 'account_suspended'
        });

        await logApiActivity('POST', '/api/auth/login', 403, {
          ...requestMetadata,
          userId: user.id,
          email: user.email,
          error: 'account_suspended'
        });

        return NextResponse.json(
          {
            success: false,
            message: 'Account is suspended or inactive. Please contact support.',
          },
          { status: 403 }
        );
      }

      // Determine redirect route based on account type
      let dashboardRoute = '/dashboard'; // Default fallback
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
        case 'INSTITUTION_ADMIN':
          dashboardRoute = '/institution-admin';
          break;
        case 'GLOBAL_ADMIN':
          dashboardRoute = '/global-admin';
          break;
      }

      // Update last login time
      await prisma.user.update({
        where: { id: user.id },
        data: {
          updatedAt: new Date(),
        }
      });

      // Self-heal: link to a verified institution if their email domain
      // now matches one (e.g. the admin added the domain after this user
      // registered).
      await linkInstitutionIfNeeded(prisma, user);

      // Log successful ORCID login
      await logSuccess('ORCID login successful', {
        ...requestMetadata,
        userId: user.id,
        email: user.email,
        accountType: user.accountType,
        orcidId: orcidId,
        dashboardRoute,
        rememberMe: rememberMe || false,
        loginMethod: 'orcid'
      });

      await logApiActivity('POST', '/api/auth/login', 200, {
        ...requestMetadata,
        userId: user.id,
        email: user.email,
        accountType: user.accountType,
        success: true
      });

      // Keep existing registration log for backward compatibility
      try {
        await prisma.registrationLog.create({
          data: {
            email: user.email,
            accountType: user.accountType,
            ipAddress: requestMetadata.ip || null,
            userAgent: requestMetadata.userAgent || null,
            success: true,
            errorMessage: 'ORCID login successful',
          }
        });
      } catch (logError) {
        console.error('Failed to log ORCID login attempt:', logError);
      }

      // Return successful login response
      const response = NextResponse.json({
        success: true,
        message: 'ORCID login successful',
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
          enabledModules: resolveUserEnabledModules(user),
          institutionId: user.institution?.id || user.secondaryInstitutionId || null,
        },
        dashboardRoute,
        rememberMe: rememberMe || false,
        loginMethod: 'orcid'
      }, { status: 200 });

      // Set session cookie
      setSessionCookie(response, user.id, { rememberMe: rememberMe || false });

      return response;
    }

    // Regular email/password login flow continues below
    // Log login attempt
    await logInfo('Login attempt initiated', {
      ...requestMetadata,
      email: email?.toLowerCase(),
      hasPassword: !!password,
      rememberMe: rememberMe || false
    });

    // Validate input
    if (!email || !password) {
      const errorField = !email ? 'email' : 'password';
      const errorMessage = 'Email and password are required';
      
      await logError(`Login validation failed: ${errorMessage}`, {
        ...requestMetadata,
        email: email?.toLowerCase(),
        field: errorField,
        reason: 'missing_credentials'
      });
      
      await logApiActivity('POST', '/api/auth/login', 400, {
        ...requestMetadata,
        email: email?.toLowerCase(),
        error: 'validation_failed'
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorMessage,
          field: errorField
        },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        institution: true,
        secondaryInstitution: true,
        foundation: true,
      }
    });

    if (!user) {
      await logError('Login failed: User not found', {
        ...requestMetadata,
        email: email.toLowerCase(),
        reason: 'user_not_found'
      });
      
      await logApiActivity('POST', '/api/auth/login', 401, {
        ...requestMetadata,
        email: email.toLowerCase(),
        error: 'invalid_credentials'
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid email or password',
          field: 'email'
        },
        { status: 401 }
      );
    }

    // Check if user is activated
    if (!user.emailVerified) {
      await logError('Login failed: Account not verified', {
        ...requestMetadata,
        userId: user.id,
        email: user.email,
        accountType: user.accountType,
        reason: 'account_not_verified'
      });
      
      await logApiActivity('POST', '/api/auth/login', 403, {
        ...requestMetadata,
        userId: user.id,
        email: user.email,
        error: 'account_not_verified'
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Account not activated. Please check your email and activate your account first.',
          redirectTo: '/resend-activation',
          needsActivation: true
        },
        { status: 403 }
      );
    }

    // Check if user status is active
    if (user.status !== 'ACTIVE') {
      await logError('Login failed: Account suspended or inactive', {
        ...requestMetadata,
        userId: user.id,
        email: user.email,
        accountType: user.accountType,
        userStatus: user.status,
        reason: 'account_suspended'
      });
      
      await logApiActivity('POST', '/api/auth/login', 403, {
        ...requestMetadata,
        userId: user.id,
        email: user.email,
        error: 'account_suspended'
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Account is suspended or inactive. Please contact support.',
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await logError('Login failed: Invalid password', {
        ...requestMetadata,
        userId: user.id,
        email: user.email,
        accountType: user.accountType,
        reason: 'invalid_password'
      });
      
      await logApiActivity('POST', '/api/auth/login', 401, {
        ...requestMetadata,
        userId: user.id,
        email: user.email,
        error: 'invalid_credentials'
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid email or password',
          field: 'password'
        },
        { status: 401 }
      );
    }

    // Determine redirect route based on account type
    let dashboardRoute = '/dashboard'; // Default fallback
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
      case 'INSTITUTION_ADMIN':
        dashboardRoute = '/institution-admin';
        break;
      case 'GLOBAL_ADMIN':
        dashboardRoute = '/global-admin';
        break;
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: {
        updatedAt: new Date(),
      }
    });

    // Self-heal: link to a verified institution if their email domain now
    // matches one (e.g. the admin added the domain after this user
    // registered).
    await linkInstitutionIfNeeded(prisma, user);

    // Log successful login with comprehensive activity logging
    await logSuccess('User login successful', {
      ...requestMetadata,
      userId: user.id,
      email: user.email,
      accountType: user.accountType,
      dashboardRoute,
      rememberMe: rememberMe || false,
      loginMethod: 'email_password'
    });

    await logApiActivity('POST', '/api/auth/login', 200, {
      ...requestMetadata,
      userId: user.id,
      email: user.email,
      accountType: user.accountType,
      success: true
    });

    // Keep existing registration log for backward compatibility
    try {
      await prisma.registrationLog.create({
        data: {
          email: user.email,
          accountType: user.accountType,
          ipAddress: requestMetadata.ip || null,
          userAgent: requestMetadata.userAgent || null,
          success: true,
          errorMessage: 'Login successful',
        }
      });
    } catch (logError) {
      console.error('Failed to log login attempt:', logError);
    }

    // Return successful login response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
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
        enabledModules: resolveUserEnabledModules(user),
        institutionId: user.institution?.id || user.secondaryInstitutionId || null,
      },
      dashboardRoute,
      rememberMe: rememberMe || false
    }, { status: 200 });

    // Set session cookie (simple approach - in production, use proper JWT/session management)
    setSessionCookie(response, user.id, { rememberMe: rememberMe || false });

    return response;

  } catch (error) {
    console.error('Login error:', error);

    // Log unexpected error with comprehensive activity logging
    await logError('Unexpected login error', {
      ...requestMetadata,
      email: requestBody?.email?.toLowerCase(),
      error: error.message,
      stack: error.stack,
      reason: 'unexpected_error'
    });

    await logApiActivity('POST', '/api/auth/login', 500, {
      ...requestMetadata,
      email: requestBody?.email?.toLowerCase(),
      error: 'internal_server_error'
    });

    // Keep existing registration log for backward compatibility
    try {
      await prisma.registrationLog.create({
        data: {
          email: requestBody?.email || 'unknown',
          accountType: 'UNKNOWN',
          ipAddress: requestMetadata.ip || null,
          userAgent: requestMetadata.userAgent || null,
          success: false,
          errorMessage: error.message,
        }
      });
    } catch (logError) {
      console.error('Failed to log login attempt:', logError);
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.',
      },
      { status: 500 }
    );
  }
}
