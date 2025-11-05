import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { logSuccess, logError, logInfo, logApiActivity, getRequestMetadata } from '@/utils/activityLogger';

export async function GET(request) {
  const requestMetadata = getRequestMetadata(request);
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('🔥 ORCID API Callback - Processing authentication...');
    
    // Log ORCID callback initiation
    await logInfo('ORCID callback initiated', {
      ...requestMetadata,
      hasCode: !!code,
      hasState: !!state,
      errorParam: error,
      endpoint: '/api/auth/orcid/callback'
    });

    // Handle ORCID error responses
    if (error) {
      console.error('❌ ORCID Error:', error);
      const errorMessages = {
        'access_denied': 'You declined the ORCID authorization request.',
        'invalid_request': 'Invalid ORCID authorization request.',
        'unauthorized_client': 'Unauthorized ORCID client.',
        'unsupported_response_type': 'Unsupported ORCID response type.',
        'invalid_scope': 'Invalid ORCID scope requested.',
        'server_error': 'ORCID server error occurred.',
        'temporarily_unavailable': 'ORCID service is temporarily unavailable.'
      };
      
      const errorMessage = errorMessages[error] || 'An error occurred during ORCID authentication.';
      
      // Log ORCID authorization error
      await logError('ORCID authorization error', {
        ...requestMetadata,
        orcidError: error,
        errorMessage,
        reason: 'orcid_authorization_error'
      });
      
      await logApiActivity('GET', '/api/auth/orcid/callback', 302, {
        ...requestMetadata,
        error: 'orcid_authorization_error',
        orcidError: error
      });
      
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent(errorMessage)}`);
    }

    // Validate required parameters
    if (!code) {
      console.error('❌ No authorization code received');
      
      // Log missing authorization code
      await logError('ORCID callback missing authorization code', {
        ...requestMetadata,
        reason: 'missing_authorization_code'
      });
      
      await logApiActivity('GET', '/api/auth/orcid/callback', 302, {
        ...requestMetadata,
        error: 'missing_authorization_code'
      });
      
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent('Authorization code not received from ORCID')}`);
    }

    console.log('🔄 Exchanging code for ORCID token...');
    
    // Log token exchange initiation
    await logInfo('ORCID token exchange initiated', {
      ...requestMetadata,
      hasCode: !!code,
      endpoint: '/api/auth/orcid/callback'
    });
    
    // Exchange code for token directly with ORCID
    const clientId = process.env.NEXT_PUBLIC_ORCID_CLIENT_ID;
    const clientSecret = process.env.ORCID_CLIENT_SECRET;
    const tokenUrl = process.env.NEXT_PUBLIC_ORCID_TOKEN_URL || 'https://sandbox.orcid.org/oauth/token';
    const redirectUri = process.env.NEXT_PUBLIC_ORCID_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      console.error('❌ Missing ORCID credentials');
      
      // Log missing ORCID configuration
      await logError('ORCID configuration missing', {
        ...requestMetadata,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        reason: 'missing_orcid_credentials'
      });
      
      await logApiActivity('GET', '/api/auth/orcid/callback', 302, {
        ...requestMetadata,
        error: 'missing_orcid_credentials'
      });
      
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent('ORCID authentication is not properly configured')}`);
    }

    // Prepare token exchange request
    const tokenRequestBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    }).toString();

    // Exchange code for token with ORCID
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenRequestBody,
    });

    const responseText = await tokenResponse.text();
    console.log('📥 ORCID token response:', {
      status: tokenResponse.status,
      ok: tokenResponse.ok,
      bodyPreview: responseText.substring(0, 200)
    });

    if (!tokenResponse.ok) {
      console.error('❌ Token exchange failed:', responseText);
      
      // Log token exchange failure
      await logError('ORCID token exchange failed', {
        ...requestMetadata,
        status: tokenResponse.status,
        response: responseText.substring(0, 200),
        reason: 'token_exchange_failed'
      });
      
      await logApiActivity('GET', '/api/auth/orcid/callback', 302, {
        ...requestMetadata,
        error: 'token_exchange_failed',
        orcidStatus: tokenResponse.status
      });
      
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent('Failed to authenticate with ORCID')}`);
    }

    let orcidData;
    try {
      orcidData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse ORCID response:', responseText);
      
      // Log ORCID response parsing error
      await logError('ORCID response parsing failed', {
        ...requestMetadata,
        parseError: parseError.message,
        response: responseText.substring(0, 200),
        reason: 'orcid_response_parse_error'
      });
      
      await logApiActivity('GET', '/api/auth/orcid/callback', 302, {
        ...requestMetadata,
        error: 'orcid_response_parse_error'
      });
      
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent('Invalid response from ORCID')}`);
    }

    console.log('✅ ORCID token exchange successful:', {
      orcid: orcidData.orcid,
      name: orcidData.name,
      hasToken: !!orcidData.access_token
    });
    
    // Log successful token exchange
    await logSuccess('ORCID token exchange successful', {
      ...requestMetadata,
      orcidId: orcidData.orcid,
      name: orcidData.name,
      hasToken: !!orcidData.access_token,
      endpoint: '/api/auth/orcid/callback'
    });

    // Check if user already exists with this ORCID ID
    const existingUser = await prisma.user.findFirst({
      where: { orcidId: orcidData.orcid },
      include: {
        institution: true,
        foundation: true,
      }
    });

    if (existingUser) {
      console.log('✅ Existing ORCID user found:', existingUser.email);
      
      // Log existing user found
      await logInfo('ORCID user found - proceeding to login', {
        ...requestMetadata,
        userId: existingUser.id,
        email: existingUser.email,
        accountType: existingUser.accountType,
        orcidId: orcidData.orcid,
        loginMethod: 'orcid'
      });
      
      // Check if user is activated
      if (!existingUser.emailVerified) {
        // Log account not activated
        await logError('ORCID login failed - account not activated', {
          ...requestMetadata,
          userId: existingUser.id,
          email: existingUser.email,
          orcidId: orcidData.orcid,
          reason: 'account_not_activated'
        });
        
        await logApiActivity('GET', '/api/auth/orcid/callback', 302, {
          ...requestMetadata,
          userId: existingUser.id,
          email: existingUser.email,
          error: 'account_not_activated'
        });
        
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent('Your account is not activated. Please check your email.')}`);
      }

      // Check if user status is active
      if (existingUser.status !== 'ACTIVE') {
        // Log account suspended
        await logError('ORCID login failed - account suspended', {
          ...requestMetadata,
          userId: existingUser.id,
          email: existingUser.email,
          orcidId: orcidData.orcid,
          userStatus: existingUser.status,
          reason: 'account_suspended'
        });
        
        await logApiActivity('GET', '/api/auth/orcid/callback', 302, {
          ...requestMetadata,
          userId: existingUser.id,
          email: existingUser.email,
          error: 'account_suspended'
        });
        
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent('Your account is suspended or inactive. Please contact support.')}`);
      }

      // Update last login time
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { updatedAt: new Date() }
      });

      // Determine redirect route based on account type
      let dashboardRoute = '/dashboard'; // Default fallback
      switch (existingUser.accountType) {
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

      // Log successful ORCID login with comprehensive activity logging
      await logSuccess('ORCID login successful', {
        ...requestMetadata,
        userId: existingUser.id,
        email: existingUser.email,
        accountType: existingUser.accountType,
        orcidId: orcidData.orcid,
        dashboardRoute,
        loginMethod: 'orcid'
      });
      
      await logApiActivity('GET', '/api/auth/orcid/callback', 200, {
        ...requestMetadata,
        userId: existingUser.id,
        email: existingUser.email,
        accountType: existingUser.accountType,
        success: true
      });

      // Keep existing registration log for backward compatibility
      try {
        await prisma.registrationLog.create({
          data: {
            email: existingUser.email,
            accountType: existingUser.accountType,
            ipAddress: requestMetadata.ip,
            userAgent: requestMetadata.userAgent,
            success: true,
            errorMessage: 'ORCID login successful',
          }
        });
      } catch (logError) {
        console.error('Failed to log ORCID login attempt:', logError);
      }

      // Create response with user session
      const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${dashboardRoute}?login=success`);
      
      // Set session cookie - check for remember me preference from state/cookies
      // Check if remember me was set during login initiation
      const cookieStore = await cookies();
      const rememberMeCookie = cookieStore.get('orcid_remember_me');
      const rememberMe = rememberMeCookie?.value === 'true';
      
      if (rememberMe) {
        // 30 days for "remember me"
        response.cookies.set('hospitium_session', existingUser.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
        });
        // Clean up remember me preference cookie
        response.cookies.delete('orcid_remember_me');
      } else {
        // Session cookie (expires when browser closes)
        response.cookies.set('hospitium_session', existingUser.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
      }

      return response;
      
    } else {
      console.log('🔄 No existing user found, redirecting to registration with ORCID data');
      
      // Log user not found - need to register
      await logInfo('ORCID user not found - redirecting to registration', {
        ...requestMetadata,
        orcidId: orcidData.orcid,
        name: orcidData.name,
        reason: 'user_not_found_needs_registration'
      });
      
      await logApiActivity('GET', '/api/auth/orcid/callback', 302, {
        ...requestMetadata,
        orcidId: orcidData.orcid,
        action: 'redirect_to_registration'
      });
      
      // Store ORCID data temporarily for registration
      const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/register?orcid=true`);
      
      // Store ORCID data in a secure cookie for the registration process
      response.cookies.set('orcid_data', JSON.stringify({
        orcidId: orcidData.orcid,
        givenNames: orcidData.name?.split(' ')[0] || '',
        familyName: orcidData.name?.split(' ').slice(1).join(' ') || '',
        accessToken: orcidData.access_token
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 10 * 60 // 10 minutes
      });

      return response;
    }

  } catch (error) {
    console.error('❌ ORCID callback error:', error);
    
    // Log unexpected ORCID callback error with comprehensive activity logging
    await logError('Unexpected ORCID callback error', {
      ...requestMetadata,
      error: error.message,
      stack: error.stack,
      reason: 'unexpected_orcid_error'
    });
    
    await logApiActivity('GET', '/api/auth/orcid/callback', 500, {
      ...requestMetadata,
      error: 'unexpected_orcid_error'
    });
    
    // Keep existing registration log for backward compatibility
    try {
      await prisma.registrationLog.create({
        data: {
          email: 'ORCID_CALLBACK_ERROR',
          accountType: 'UNKNOWN',
          ipAddress: requestMetadata.ip || null,
          userAgent: requestMetadata.userAgent || null,
          success: false,
          errorMessage: `ORCID callback error: ${error.message}`,
        }
      });
    } catch (logError) {
      console.error('Failed to log ORCID callback error:', logError);
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent('An error occurred during ORCID authentication')}`);
  }
}


