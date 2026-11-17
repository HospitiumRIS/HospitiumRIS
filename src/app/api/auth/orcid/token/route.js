import { NextResponse } from 'next/server';
import { setOrcidProofCookie } from '@/lib/orcid-proof';

/**
 * Best-effort lookup of the researcher's given and family names from their
 * public ORCID record (more reliable than splitting the token's `name`).
 */
async function fetchOrcidNames(orcid, tokenUrl, fallbackName = '') {
  const parts = String(fallbackName || '').trim().split(/\s+/).filter(Boolean);
  const fallback = { givenNames: parts[0] || '', familyName: parts.slice(1).join(' ') };
  try {
    const host = tokenUrl.includes('sandbox') ? 'https://pub.sandbox.orcid.org' : 'https://pub.orcid.org';
    const res = await fetch(`${host}/v3.0/${orcid}/person`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return fallback;
    const person = await res.json();
    return {
      givenNames: person?.name?.['given-names']?.value || fallback.givenNames,
      familyName: person?.name?.['family-name']?.value || fallback.familyName,
    };
  } catch {
    return fallback;
  }
}

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
          const cachedResponse = NextResponse.json(cached.data);
          setOrcidProofCookie(cachedResponse, { orcid: cached.data.orcid, givenNames: cached.data.givenNames, familyName: cached.data.familyName });
          return cachedResponse;
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

    if (!tokenData.orcid) {
      return NextResponse.json({ error: 'ORCID did not return an ORCID iD' }, { status: 502 });
    }

    const names = await fetchOrcidNames(tokenData.orcid, requiredEnvVars.tokenUrl, tokenData.name);

    // Only identity details go back to the browser. ORCID access/refresh
    // tokens stay on the server; proof of the verified iD is carried in a
    // signed httpOnly cookie (see lib/orcid-proof).
    const successResponse = {
      success: true,
      orcid: tokenData.orcid,
      name: tokenData.name,
      givenNames: names.givenNames,
      familyName: names.familyName,
    };

    console.log('✅ ORCID authentication successful:', { orcid: successResponse.orcid });
    
    // Cache the success response
    tokenExchangeCache.set(cacheKey, {
      timestamp: Date.now(),
      success: true,
      data: successResponse
    });
    
    const response = NextResponse.json(successResponse);
    setOrcidProofCookie(response, { orcid: successResponse.orcid, givenNames: names.givenNames, familyName: names.familyName });
    return response;

  } catch (error) {
    console.error('❌ Token exchange error:', error);
    
    const errorResponse = { 
      error: 'Internal server error during ORCID authentication',
      details: error.message
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
