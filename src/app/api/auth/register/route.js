import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, validateEmail, validatePassword } from '@/lib/auth';

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
    
    // Check for ORCID data from secure cookie
    let orcidData = null;
    const orcidCookie = request.cookies.get('orcid_data')?.value;
    if (orcidCookie) {
      try {
        orcidData = JSON.parse(orcidCookie);
        console.log('🔗 ORCID data found in cookie:', {
          orcidId: orcidData.orcidId,
          givenNames: orcidData.givenNames,
          familyName: orcidData.familyName
        });
      } catch (parseError) {
        console.error('Failed to parse ORCID cookie:', parseError);
      }
    }
    
    const {
      // Account type
      accountType,
      
      // Personal details
      givenName,
      familyName,
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
    if (!accountType || !['RESEARCHER', 'RESEARCH_ADMIN', 'FOUNDATION_ADMIN'].includes(accountType)) {
      errors.accountType = 'Valid account type is required';
    }
    
    // Foundation Admin has simplified validation
    if (accountType === 'FOUNDATION_ADMIN') {
      if (!email) {
        errors.email = 'Email is required';
      } else if (!validateEmail(email)) {
        errors.email = 'Invalid email format';
      } else if (!email.toLowerCase().endsWith('@hospitium.org')) {
        errors.email = 'Only @hospitium.org email addresses are allowed for Foundation Administrator accounts';
      }
      
      if (!password) {
        errors.password = 'Password is required';
      } else {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          errors.password = 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character';
        }
      }
      
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    } else {
      // Standard validation for RESEARCHER and RESEARCH_ADMIN
      if (!givenName?.trim()) {
        errors.givenName = 'Given name is required';
      }
      
      if (!familyName?.trim()) {
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
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          errors.password = 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character';
        }
      }
      
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    // Account type specific validation
    if (accountType === 'RESEARCHER' || accountType === 'RESEARCH_ADMIN') {
      if (!primaryInstitution?.trim()) {
        errors.primaryInstitution = 'Primary institution is required';
      }
      if (!startMonth) {
        errors.startMonth = 'Start month is required';
      }
      if (!startYear) {
        errors.startYear = 'Start year is required';
      }
    } else if (accountType !== 'FOUNDATION_ADMIN') {
      // For non-researchers and non-foundation admins (if any future account types)
      if (!confirmEmail) {
        errors.confirmEmail = 'Email confirmation is required';
      } else if (email !== confirmEmail) {
        errors.confirmEmail = 'Email addresses do not match';
      }
    }

    // Institution details validation for RESEARCH_ADMIN
    if (accountType === 'RESEARCH_ADMIN') {
      if (!institutionName?.trim()) {
        errors.institutionName = 'Institution name is required';
      }
      if (!institutionType) {
        errors.institutionType = 'Institution type is required';
      }
      if (!institutionCountry) {
        errors.institutionCountry = 'Country is required';
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
      return NextResponse.json(
        {
          success: false,
          errors: { email: 'An account with this email already exists' },
          message: 'User already exists'
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user and related records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // For Foundation Admins, extract name from email
      let userGivenName, userFamilyName;
      if (accountType === 'FOUNDATION_ADMIN') {
        const emailPrefix = email.split('@')[0];
        const nameParts = emailPrefix.split('.');
        userGivenName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Foundation';
        userFamilyName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'Administrator';
      } else {
        userGivenName = (orcidData?.givenNames || givenName).trim();
        userFamilyName = (orcidData?.familyName || familyName).trim();
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
          orcidId: accountType === 'FOUNDATION_ADMIN' ? null : (orcidData?.orcidId || orcidId || null),
          orcidGivenNames: accountType === 'FOUNDATION_ADMIN' ? null : (orcidData?.givenNames || orcidGivenNames || null),
          orcidFamilyName: accountType === 'FOUNDATION_ADMIN' ? null : (orcidData?.familyName || orcidFamilyName || null),
          primaryInstitution: accountType === 'FOUNDATION_ADMIN' ? 'Hospitium Foundation' : (primaryInstitution?.trim() || null),
          startMonth: accountType === 'FOUNDATION_ADMIN' ? null : (startMonth || null),
          startYear: accountType === 'FOUNDATION_ADMIN' ? null : (startYear || null),
        }
      });

      // Create institution record for RESEARCH_ADMIN
      if (accountType === 'RESEARCH_ADMIN') {
        await tx.institution.create({
          data: {
            userId: user.id,
            name: institutionName.trim(),
            type: institutionType,
            country: institutionCountry,
            website: institutionWebsite || null,
          }
        });
      }

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
      nextStep: 'Please login to access your account.'
    }, { status: 201 });

    // Clear ORCID cookie if it was used
    if (orcidData) {
      response.cookies.delete('orcid_data');
      console.log('🧹 Cleared ORCID data cookie after successful registration');
    }

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', body);

    // Log failed registration attempt
    try {
      // Ensure accountType is a valid enum value, default to RESEARCHER if invalid
      const validAccountTypes = ['RESEARCHER', 'RESEARCH_ADMIN', 'FOUNDATION_ADMIN', 'SUPER_ADMIN'];
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
