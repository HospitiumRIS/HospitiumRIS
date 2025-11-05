import { NextResponse } from 'next/server';

// Simple in-memory cache to prevent duplicate token exchanges
const tokenExchangeCache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute TTL

export async function POST(request) {
  try {
    const { code, redirect_uri } = await request.json();

    console.log('🔄 Starting ORCID token exchange...');
    console.log('📝 Parameters:', { code: !!code, redirect_uri });

    if (!code) {
      console.error('❌ No authorization code provided');
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `${code}-${redirect_uri}`;
    const cached = tokenExchangeCache.get(cacheKey);
    
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < CACHE_TTL) {
        console.log('💾 Returning cached response');
        if (cached.success) {
          return NextResponse.json(cached.data);
        } else {
          return NextResponse.json(cached.error, { status: cached.status });
        }
      } else {
        tokenExchangeCache.delete(cacheKey);
      }
    }

    // Validate environment variables
    const requiredEnvVars = {
      clientId: process.env.NEXT_PUBLIC_ORCID_CLIENT_ID,
      clientSecret: process.env.ORCID_CLIENT_SECRET,
      tokenUrl: process.env.NEXT_PUBLIC_ORCID_TOKEN_URL || 'https://sandbox.orcid.org/oauth/token',
    };

    console.log('🔧 Environment check:', {
      hasClientId: !!requiredEnvVars.clientId,
      hasClientSecret: !!requiredEnvVars.clientSecret,
      tokenUrl: requiredEnvVars.tokenUrl
    });

    if (!requiredEnvVars.clientId || !requiredEnvVars.clientSecret) {
      console.error('❌ Missing required environment variables');
      const errorResponse = { error: 'Server configuration error - missing ORCID credentials' };
      
      // Cache the error
      tokenExchangeCache.set(cacheKey, {
        timestamp: Date.now(),
        success: false,
        error: errorResponse,
        status: 500
      });
      
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Validate redirect URI
    const validRedirectUris = [
      process.env.NEXT_PUBLIC_ORCID_REDIRECT_URI,
    ].filter(Boolean);

    console.log('🔐 Redirect URI validation:', {
      received: redirect_uri,
      valid: validRedirectUris,
      isValid: validRedirectUris.includes(redirect_uri)
    });

    if (!validRedirectUris.includes(redirect_uri)) {
      console.error('❌ Invalid redirect URI');
      const errorResponse = { 
        error: 'Invalid redirect URI',
        details: 'The redirect URI must match exactly what is registered in your ORCID application settings.'
      };
      
      // Cache the error
      tokenExchangeCache.set(cacheKey, {
        timestamp: Date.now(),
        success: false,
        error: errorResponse,
        status: 400
      });
      
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Prepare token request
    const tokenRequestBody = new URLSearchParams({
      client_id: requiredEnvVars.clientId,
      client_secret: requiredEnvVars.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirect_uri,
    }).toString();

    console.log('📡 Making token request to ORCID...');
    console.log('🎯 Token URL:', requiredEnvVars.tokenUrl);

    // Exchange code for token
    const tokenResponse = await fetch(requiredEnvVars.tokenUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenRequestBody,
    });

    const responseText = await tokenResponse.text();
    console.log('📥 ORCID response:', {
      status: tokenResponse.status,
      ok: tokenResponse.ok,
      headers: Object.fromEntries(tokenResponse.headers.entries()),
      bodyPreview: responseText.substring(0, 200)
    });

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse ORCID response:', responseText);
      const errorResponse = { error: 'Invalid response from ORCID service' };
      
      // Cache the error
      tokenExchangeCache.set(cacheKey, {
        timestamp: Date.now(),
        success: false,
        error: errorResponse,
        status: 502
      });
      
      return NextResponse.json(errorResponse, { status: 502 });
    }

    if (!tokenResponse.ok) {
      console.error('❌ ORCID token exchange failed:', tokenData);
      const errorResponse = { 
        error: tokenData.error_description || 'Failed to authenticate with ORCID',
        code: tokenData.error || 'ORCID_AUTH_FAILED'
      };
      
      // Cache the error
      tokenExchangeCache.set(cacheKey, {
        timestamp: Date.now(),
        success: false,
        error: errorResponse,
        status: tokenResponse.status
      });
      
      return NextResponse.json(errorResponse, { status: tokenResponse.status });
    }

    // Extract user information from token response
    const successResponse = {
      success: true,
      orcid: tokenData.orcid,
      name: tokenData.name,
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    };

    console.log('✅ ORCID authentication successful:', {
      orcid: successResponse.orcid,
      name: successResponse.name,
      hasAccessToken: !!successResponse.access_token
    });
    
    // Cache the success response
    tokenExchangeCache.set(cacheKey, {
      timestamp: Date.now(),
      success: true,
      data: successResponse
    });
    
    return NextResponse.json(successResponse);

  } catch (error) {
    console.error('❌ Token exchange error:', error);
    
    const errorResponse = { 
      error: 'Internal server error during ORCID authentication',
      details: error.message
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
