import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, validateEmail, validatePassword } from '@/lib/auth';
import { getPasswordPolicy, isMaintenanceMode, isRegistrationOpen } from '@/lib/system-settings';
import { findInstitutionByEmailDomain, findVerifiedDomainByEmail } from '@/lib/institution-domain';
import { claimPendingInvitations } from '@/lib/manuscript-invitations';
import { recordAuthEvent } from '@/lib/ops/audit';
import { readOrcidProof, clearOrcidProofCookie, orcidLookupValues } from '@/lib/orcid-proof';
import { setSessionCookie } from '@/lib/session-cookie';

export async function POST(request) {
  let body = {};
  try {
    if (await isMaintenanceMode()) {
      return NextResponse.json(
        { success: false, code: 'maintenance', message: 'HospitiumRIS is under maintenance. Please try again later.' },
        { status: 503 }
      );
    }
    if (!(await isRegistrationOpen())) {
      return NextResponse.json(
        { success: false, code: 'registration_closed', message: 'New registrations are currently closed. Please contact your institution administrator.' },
        { status: 403 }
      );
    }
    const passwordPolicy = await getPasswordPolicy();

    body = await request.json();
    
    // Researchers who arrive from "Sign in with ORCID" carry a signed proof
    // of the ORCID iD they verified (set by /api/auth/orcid/token). Their iD
    // and names come from that proof, never from the request body.
    const orcidProof = body.accountType === 'RESEARCHER' ? readOrcidProof(request) : null;
    if (body.isOrcidRegistration && !orcidProof) {
      return NextResponse.json(
        {
          success: false,
          code: 'orcid_session_expired',
          message: 'Your ORCID sign-in expired. Please sign in with ORCID again to continue.',
        },
        { status: 401 }
      );
    }
    const orcidData = orcidProof
      ? { orcidId: orcidProof.orcid, givenNames: orcidProof.givenNames, familyName: orcidProof.familyName }
      : null;
    
    const {
      // Account type
      accountType,
      
      // Personal details
      givenName,
      familyName,
      accountName,
      email,
      confirmEmail,
      password,
      confirmPassword,
      
      // ORCID data
      orcidId,
      orcidGivenNames,
      orcidFamilyName,
      
      // Research details
      primaryInstitution,
      startMonth,
      startYear,
      
      // Institution details (for RESEARCH_ADMIN)
      institutionName,
      institutionType,
      institutionCountry,
      institutionWebsite,
      
      // Foundation details (for FOUNDATION_ADMIN)
      foundationName,
      foundationType,
      foundationCountry,
      foundationWebsite,
      foundationFocusArea,
      foundationDescription,
    } = body;

    // Validation
    const errors = {};
    
    // Basic validation
    if (!accountType || !['RESEARCHER', 'RESEARCH_ADMIN', 'FOUNDATION_ADMIN', 'OPERATIONS'].includes(accountType)) {
      errors.accountType = 'Valid account type is required';
    }
    
    // Foundation Admin and Operations have simplified validation
    let foundationMatchedDomain = null;
    let researchAdminMatchedDomain = null;
    if (accountType === 'FOUNDATION_ADMIN' || accountType === 'OPERATIONS' || accountType === 'RESEARCH_ADMIN') {
      if (accountType === 'RESEARCH_ADMIN' && !accountName?.trim()) {
        errors.accountName = 'Account name is required';
      }

      if (!email) {
        errors.email = 'Email is required';
      } else if (!validateEmail(email)) {
        errors.email = 'Invalid email format';
      } else if (accountType === 'FOUNDATION_ADMIN') {
        foundationMatchedDomain = await findVerifiedDomainByEmail(prisma, email);
        if (!foundationMatchedDomain) {
          errors.email = 'Email domain is not a verified domain. Please use an email address from a verified domain.';
        }
      }
      
      if (!password) {
        errors.password = 'Password is required';
      } else {
        const passwordValidation = validatePassword(password, passwordPolicy);
        if (!passwordValidation.isValid) {
          errors.password = passwordValidation.message;
        }
      }
      
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    } else {
      // Standard validation for RESEARCHER
      if (!(givenName || orcidData?.givenNames)?.trim()) {
        errors.givenName = 'Given name is required';
      }
      
      if (!(familyName || orcidData?.familyName)?.trim()) {
        errors.familyName = 'Family name is required';
      }
      
      if (!email) {
        errors.email = 'Email is required';
      } else if (!validateEmail(email)) {
        errors.email = 'Invalid email format';
      }
      
      if (!password) {
        errors.password = 'Password is required';
      } else {
        const passwordValidation = validatePassword(password, passwordPolicy);
        if (!passwordValidation.isValid) {
          errors.password = passwordValidation.message;
        }
      }
      
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    // Account type specific validation
    if (accountType === 'RESEARCHER') {
      if (!primaryInstitution?.trim()) {
        errors.primaryInstitution = 'Primary institution is required';
      }
      if (!startMonth) {
        errors.startMonth = 'Start month is required';
      }
      if (!startYear) {
        errors.startYear = 'Start year is required';
      }
    } else if (accountType === 'RESEARCH_ADMIN') {
      if (!email) {
        errors.email = errors.email || 'Email is required';
      } else if (!validateEmail(email)) {
        errors.email = errors.email || 'Invalid email format';
      } else {
        researchAdminMatchedDomain = await findVerifiedDomainByEmail(prisma, email);
        if (!researchAdminMatchedDomain) {
          errors.email = 'Email domain is not a verified domain. Please use an email address from a verified domain.';
        }
      }
    } else if (accountType !== 'FOUNDATION_ADMIN' && accountType !== 'OPERATIONS') {
      // For non-researchers, non-foundation admins, and non-operations (if any future account types)
      if (!confirmEmail) {
        errors.confirmEmail = 'Email confirmation is required';
      } else if (email !== confirmEmail) {
        errors.confirmEmail = 'Email addresses do not match';
      }
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          errors,
          message: 'Validation failed'
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      await recordAuthEvent(request, {
        action: 'REGISTRATION_FAILED', email, outcome: 'FAILURE', reason: 'email_already_registered',
        summary: 'Registration failed: email already registered',
      });
      return NextResponse.json(
        {
          success: false,
          errors: { email: 'An account with this email already exists' },
          message: 'User already exists'
        },
        { status: 409 }
      );
    }

    // One Hospitium account per ORCID iD
    const requestedOrcid = accountType === 'RESEARCHER' ? (orcidData?.orcidId || orcidId || null) : null;
    if (requestedOrcid) {
      const orcidOwner = await prisma.user.findFirst({
        where: { orcidId: { in: orcidLookupValues(requestedOrcid) } },
        select: { id: true },
      });
      if (orcidOwner) {
        await recordAuthEvent(request, {
          action: 'REGISTRATION_FAILED', email, outcome: 'FAILURE', reason: 'orcid_already_linked',
          summary: 'Registration failed: ORCID iD already linked to an account',
        });
        return NextResponse.json(
          {
            success: false,
            errors: { orcidSearch: 'This ORCID iD is already linked to a Hospitium account. Sign in with ORCID instead.' },
            message: 'ORCID iD already linked',
          },
          { status: 409 }
        );
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user and related records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // For Foundation Admins and Operations, extract name from email
      let userGivenName, userFamilyName;
      if (accountType === 'FOUNDATION_ADMIN' || accountType === 'OPERATIONS') {
        const emailPrefix = email.split('@')[0];
        const nameParts = emailPrefix.split('.');
        userGivenName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : (accountType === 'FOUNDATION_ADMIN' ? 'Foundation' : 'Operations');
        userFamilyName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : (accountType === 'FOUNDATION_ADMIN' ? 'Administrator' : 'User');
      } else if (accountType === 'RESEARCH_ADMIN') {
        userGivenName = accountName.trim();
        userFamilyName = '';
      } else {
        // Names as the researcher entered them (pre-filled from ORCID when available)
        userGivenName = (givenName || orcidData?.givenNames || '').trim();
        userFamilyName = (familyName || orcidData?.familyName || '').trim();
      }

      // For researchers, check whether their email domain already matches a
      // verified institution. If it does, that institution's name is the
      // source of truth for primaryInstitution (not whatever they typed),
      // and they're immediately linked via secondaryInstitutionId. If not,
      // they're created unlinked - they'll self-heal at login once their
      // institution admin adds their domain.
      let matchedInstitution = null;
      if (accountType === 'RESEARCHER') {
        matchedInstitution = await findInstitutionByEmailDomain(tx, email);
      } else if (accountType === 'FOUNDATION_ADMIN' && foundationMatchedDomain) {
        matchedInstitution = foundationMatchedDomain.institution;
      } else if (accountType === 'RESEARCH_ADMIN' && researchAdminMatchedDomain) {
        matchedInstitution = researchAdminMatchedDomain.institution;
      }

      // Create user
      const user = await tx.user.create({
        data: {
          accountType,
          givenName: userGivenName,
          familyName: userFamilyName,
          email: email.toLowerCase(),
          confirmEmail: confirmEmail || null,
          passwordHash,
          status: 'ACTIVE',
          emailVerified: true,
          emailVerifyToken: null,
          emailVerifyExpires: null,
          orcidId: (accountType === 'FOUNDATION_ADMIN' || accountType === 'OPERATIONS' || accountType === 'RESEARCH_ADMIN') ? null : (orcidData?.orcidId || orcidId || null),
          orcidGivenNames: (accountType === 'FOUNDATION_ADMIN' || accountType === 'OPERATIONS' || accountType === 'RESEARCH_ADMIN') ? null : (orcidData?.givenNames || orcidGivenNames || null),
          orcidFamilyName: (accountType === 'FOUNDATION_ADMIN' || accountType === 'OPERATIONS' || accountType === 'RESEARCH_ADMIN') ? null : (orcidData?.familyName || orcidFamilyName || null),
          primaryInstitution: accountType === 'FOUNDATION_ADMIN'
            ? (matchedInstitution?.name || 'Hospitium Foundation')
            : (accountType === 'OPERATIONS'
              ? 'Operations'
              : (matchedInstitution?.name || primaryInstitution?.trim() || null)),
          startMonth: (accountType === 'FOUNDATION_ADMIN' || accountType === 'OPERATIONS' || accountType === 'RESEARCH_ADMIN') ? null : (startMonth || null),
          startYear: (accountType === 'FOUNDATION_ADMIN' || accountType === 'OPERATIONS' || accountType === 'RESEARCH_ADMIN') ? null : (startYear || null),
          secondaryInstitutionId: matchedInstitution?.id || null,
          institutionVerifiedAt: matchedInstitution ? new Date() : null,
          institutionVerificationMethod: matchedInstitution ? 'EMAIL_DOMAIN' : null,
        }
      });

      // Foundation Admins don't need additional records - simplified registration

      return user;
    });

    // Log registration attempt
    await prisma.registrationLog.create({
      data: {
        email: email.toLowerCase(),
        accountType,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
        success: true,
        errorMessage: null,
      }
    });

    try {
      await claimPendingInvitations(prisma, result);
    } catch (claimError) {
      console.error('Failed to claim pending manuscript invitations:', claimError);
    }

    await recordAuthEvent(request, { action: 'REGISTERED', user: result });

    // Return success response (don't include sensitive data)
    const response = NextResponse.json({
      success: true,
      message: 'Registration successful! Your account is now active.',
      user: {
        id: result.id,
        accountType: result.accountType,
        givenName: result.givenName,
        familyName: result.familyName,
        email: result.email,
        emailVerified: true,
        orcidId: result.orcidId,
      },
      nextStep: orcidData ? 'You are signed in.' : 'Please login to access your account.',
      // ORCID-verified researchers are signed in straight away
      ...(orcidData && { signedIn: true, dashboardRoute: '/researcher' }),
    }, { status: 201 });

    if (orcidData) {
      setSessionCookie(response, result.id);
      clearOrcidProofCookie(response);
      await recordAuthEvent(request, { action: 'LOGIN_SUCCESS', user: result, method: 'orcid' });
    }

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', body);

    // Log failed registration attempt
    try {
      // Ensure accountType is a valid enum value, default to RESEARCHER if invalid
      const validAccountTypes = ['RESEARCHER', 'RESEARCH_ADMIN', 'FOUNDATION_ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'];
      const logAccountType = validAccountTypes.includes(body?.accountType) 
        ? body.accountType 
        : 'RESEARCHER'; // Default to RESEARCHER for logging purposes
      
      await prisma.registrationLog.create({
        data: {
          email: body?.email || 'unknown',
          accountType: logAccountType,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          userAgent: request.headers.get('user-agent') || null,
          success: false,
          errorMessage: error.message || 'Unknown error',
        }
      });
    } catch (logError) {
      console.error('Failed to log registration attempt:', logError);
      console.error('Log error details:', logError.message);
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Registration failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
