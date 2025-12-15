import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false'
    }
  });
};

/**
 * Send activation email to user
 * @param {Object} user - User object
 * @param {string} activationToken - Activation token
 * @param {boolean} isResend - Whether this is a resend email
 * @returns {Promise<Object>} - Email send result
 */
export async function sendActivationEmail(user, activationToken, isResend = false) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const activationUrl = `${baseUrl}/activate?token=${activationToken}`;
  
  const accountTypeLabels = {
    RESEARCHER: 'Researcher',
    RESEARCH_ADMIN: 'Research Administrator',
    FOUNDATION_ADMIN: 'Foundation Administrator'
  };

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activate Your HospitiumRIS Account</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                    
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding: 0 0 32px 0;">
                            <img src="${baseUrl}/hospitium-logo.png" alt="HospitiumRIS" style="max-width: 160px; height: auto;" />
                        </td>
                    </tr>
                    
                    <!-- Main Card -->
                    <tr>
                        <td>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
                                
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 40px 40px 0 40px; border-bottom: 1px solid #f3f4f6;">
                                        <h1 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 8px 0;">
                                            ${isResend ? 'New Activation Link' : 'Welcome to HospitiumRIS'}
                                        </h1>
                                        <p style="color: #6b7280; font-size: 15px; margin: 0 0 24px 0;">
                                            ${isResend ? 'A new activation link has been generated for your account.' : 'Your account has been created successfully.'}
                                        </p>
                                    </td>
                                </tr>

                                <!-- Greeting -->
                                <tr>
                                    <td style="padding: 32px 40px 0 40px;">
                                        <p style="color: #374151; font-size: 15px; margin: 0 0 16px 0; line-height: 1.6;">
                                            Hello ${user.givenName},
                                        </p>
                                        <p style="color: #4b5563; font-size: 15px; margin: 0; line-height: 1.7;">
                                            ${isResend 
                                              ? 'Your previous activation link has been invalidated for security reasons. Please use the link below to activate your account.' 
                                              : 'Thank you for registering with HospitiumRIS. To complete your registration and access your account, please click the button below.'}
                                        </p>
                                    </td>
                                </tr>

                                <!-- Account Details -->
                                <tr>
                                    <td style="padding: 24px 40px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                                            <tr>
                                                <td style="padding: 20px 24px;">
                                                    <p style="color: #374151; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0;">Account Details</p>
                                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td style="padding: 6px 0;">
                                                                <span style="color: #6b7280; font-size: 14px; display: inline-block; width: 120px;">Name</span>
                                                                <span style="color: #111827; font-size: 14px;">${user.givenName} ${user.familyName}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 6px 0;">
                                                                <span style="color: #6b7280; font-size: 14px; display: inline-block; width: 120px;">Email</span>
                                                                <span style="color: #111827; font-size: 14px;">${user.email}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 6px 0;">
                                                                <span style="color: #6b7280; font-size: 14px; display: inline-block; width: 120px;">Account Type</span>
                                                                <span style="color: #111827; font-size: 14px;">${accountTypeLabels[user.accountType]}</span>
                                                            </td>
                                                        </tr>
            ${user.primaryInstitution ? `
                                                        <tr>
                                                            <td style="padding: 6px 0;">
                                                                <span style="color: #6b7280; font-size: 14px; display: inline-block; width: 120px;">Institution</span>
                                                                <span style="color: #111827; font-size: 14px;">${user.primaryInstitution}</span>
                                                            </td>
                                                        </tr>
            ` : ''}
            ${user.orcidId ? `
                                                        <tr>
                                                            <td style="padding: 6px 0;">
                                                                <span style="color: #6b7280; font-size: 14px; display: inline-block; width: 120px;">ORCID iD</span>
                                                                <span style="color: #111827; font-size: 14px;">${user.orcidId}</span>
                                                            </td>
                                                        </tr>
            ` : ''}
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- CTA Button -->
                                <tr>
                                    <td style="padding: 8px 40px 32px 40px; text-align: center;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center">
                                                    <a href="${activationUrl}" style="display: inline-block; background-color: #8b6cbc; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 6px;">
                                                        Activate Account
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="padding-top: 16px;">
                                                    <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                                                        Or copy and paste this URL into your browser:
                                                    </p>
                                                    <p style="color: #8b6cbc; font-size: 13px; margin: 8px 0 0 0; word-break: break-all;">
                                                        ${activationUrl}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Divider -->
                                <tr>
                                    <td style="padding: 0 40px;">
                                        <div style="height: 1px; background-color: #e5e7eb;"></div>
                                    </td>
                                </tr>

                                <!-- Next Steps -->
                                <tr>
                                    <td style="padding: 24px 40px;">
                                        <p style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Next Steps</p>
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 6px 0; color: #4b5563; font-size: 14px;">1. Click the activation button above</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #4b5563; font-size: 14px;">2. Log in at <a href="${baseUrl}/login" style="color: #8b6cbc; text-decoration: none;">${baseUrl}/login</a></td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #4b5563; font-size: 14px;">3. Complete your profile and start using HospitiumRIS</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Security Notice -->
                                <tr>
                                    <td style="padding: 0 40px 32px 40px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #fef3c7; border-radius: 6px; border: 1px solid #fde68a;">
                                            <tr>
                                                <td style="padding: 14px 16px;">
                                                    <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
                                                        <strong>Security Notice:</strong> This activation link will expire in 24 hours. If you did not create this account, please disregard this email.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 20px; text-align: center;">
                            <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px 0;">
                                HospitiumRIS
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                This email was sent to ${user.email} because you registered for an account.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

  const textContent = `
${isResend ? 'NEW ACTIVATION LINK' : 'WELCOME TO HOSPITIUMRIS'}
${'='.repeat(50)}

Hello ${user.givenName},

${isResend 
  ? 'A new activation link has been generated for your account. Your previous link has been invalidated for security reasons.' 
  : 'Thank you for registering with HospitiumRIS. Your account has been created successfully.'}

ACCOUNT DETAILS
${'-'.repeat(50)}
Name:         ${user.givenName} ${user.familyName}
Email:        ${user.email}
Account Type: ${accountTypeLabels[user.accountType]}
${user.primaryInstitution ? `Institution:  ${user.primaryInstitution}` : ''}
${user.orcidId ? `ORCID iD:     ${user.orcidId}` : ''}

ACTIVATE YOUR ACCOUNT
${'-'.repeat(50)}
Click or copy this link to activate your account:
${activationUrl}

NEXT STEPS
${'-'.repeat(50)}
1. Click the activation link above
2. Log in at: ${baseUrl}/login
3. Complete your profile and start using HospitiumRIS

SECURITY NOTICE
${'-'.repeat(50)}
This activation link will expire in 24 hours.
If you did not create this account, please disregard this email.

${'='.repeat(50)}
HospitiumRIS
`;

  try {
    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'HospitiumRIS <noreply@hospitiumris.com>',
      to: user.email,
      subject: isResend ? 'HospitiumRIS - New Activation Link' : 'Welcome to HospitiumRIS - Activate Your Account',
      html: htmlContent,
      text: textContent,
    };

    const result = await transporter.sendMail(mailOptions);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate a secure activation token
 * @returns {string} - Secure random token
 */
export function generateActivationToken() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Check if activation token is expired
 * @param {Date} expiresAt - Token expiration date
 * @returns {boolean} - True if expired
 */
export function isTokenExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

/**
 * Send password reset email to user
 * @param {Object} user - User object
 * @param {string} resetToken - Password reset token
 * @returns {Promise<Object>} - Email send result
 */
export async function sendPasswordResetEmail(user, resetToken) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your HospitiumRIS Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                    
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding: 0 0 32px 0;">
                            <img src="${baseUrl}/hospitium-logo.png" alt="HospitiumRIS" style="max-width: 160px; height: auto;" />
                        </td>
                    </tr>
                    
                    <!-- Main Card -->
                    <tr>
                        <td>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
                                
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 40px 40px 0 40px; border-bottom: 1px solid #f3f4f6;">
                                        <h1 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 8px 0;">
                                            Password Reset Request
                                        </h1>
                                        <p style="color: #6b7280; font-size: 15px; margin: 0 0 24px 0;">
                                            We received a request to reset your password.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Content -->
                                <tr>
                                    <td style="padding: 32px 40px;">
                                        <p style="color: #374151; font-size: 15px; margin: 0 0 16px 0; line-height: 1.6;">
                                            Hello ${user.givenName},
                                        </p>
                                        <p style="color: #4b5563; font-size: 15px; margin: 0 0 24px 0; line-height: 1.7;">
                                            A password reset was requested for your HospitiumRIS account. If you made this request, click the button below to create a new password.
                                        </p>
                                        
                                        <!-- CTA Button -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center">
                                                    <a href="${resetUrl}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 6px;">
                                                        Reset Password
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="padding-top: 16px;">
                                                    <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                                                        Or copy and paste this URL into your browser:
                                                    </p>
                                                    <p style="color: #8b6cbc; font-size: 13px; margin: 8px 0 0 0; word-break: break-all;">
                                                        ${resetUrl}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Security Notice -->
                                <tr>
                                    <td style="padding: 0 40px 32px 40px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #fef2f2; border-radius: 6px; border: 1px solid #fecaca;">
                                            <tr>
                                                <td style="padding: 14px 16px;">
                                                    <p style="color: #991b1b; font-size: 13px; margin: 0; line-height: 1.5;">
                                                        <strong>Important:</strong> This link expires in 1 hour. If you did not request this password reset, please disregard this email. Your password will remain unchanged.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 20px; text-align: center;">
                            <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px 0;">
                                HospitiumRIS
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                This email was sent to ${user.email}.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

  const textContent = `
PASSWORD RESET REQUEST
${'='.repeat(50)}

Hello ${user.givenName},

A password reset was requested for your HospitiumRIS account.
If you made this request, click the link below to create a new password:

${resetUrl}

IMPORTANT: This link expires in 1 hour.
If you did not request this reset, please disregard this email.

${'='.repeat(50)}
HospitiumRIS
`;

  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'HospitiumRIS <noreply@hospitiumris.com>',
      to: user.email,
      subject: 'HospitiumRIS - Password Reset Request',
      html: htmlContent,
      text: textContent,
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, data: result };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send collaboration invitation email
 * @param {Object} options - Invitation options
 * @param {string} options.inviteeEmail - Email of the person being invited
 * @param {string} options.inviteeName - Name of the person being invited
 * @param {string} options.inviterName - Name of the person sending the invitation
 * @param {string} options.manuscriptTitle - Title of the manuscript/proposal
 * @param {string} options.role - Role being offered (e.g., CONTRIBUTOR, EDITOR)
 * @param {string} options.message - Optional personal message from inviter
 * @param {string} options.invitationToken - Token for accepting the invitation
 * @param {string} options.type - Type of collaboration (manuscript or proposal)
 * @returns {Promise<Object>} - Email send result
 */
export async function sendCollaborationInviteEmail(options) {
  const {
    inviteeEmail,
    inviteeName,
    inviterName,
    manuscriptTitle,
    role,
    message,
    invitationToken,
    type = 'manuscript'
  } = options;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const acceptUrl = `${baseUrl}/researcher/publications/collaborate?accept=${invitationToken}`;
  const loginUrl = `${baseUrl}/login`;

  const roleLabels = {
    OWNER: 'Owner',
    ADMIN: 'Administrator',
    EDITOR: 'Editor',
    CONTRIBUTOR: 'Contributor',
    REVIEWER: 'Reviewer'
  };

  const roleDescriptions = {
    OWNER: 'full access to the manuscript including deletion',
    ADMIN: 'full access to the manuscript and team management',
    EDITOR: 'ability to edit content and manage sections',
    CONTRIBUTOR: 'ability to contribute to specific sections',
    REVIEWER: 'ability to view and provide feedback'
  };

  const typeLabel = type === 'proposal' ? 'research proposal' : 'manuscript';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Collaboration Invitation - HospitiumRIS</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                    
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding: 0 0 32px 0;">
                            <img src="${baseUrl}/hospitium-logo.png" alt="HospitiumRIS" style="max-width: 160px; height: auto;" />
                        </td>
                    </tr>
                    
                    <!-- Main Card -->
                    <tr>
                        <td>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
                                
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 40px 40px 0 40px; border-bottom: 1px solid #f3f4f6;">
                                        <h1 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 8px 0;">
                                            Collaboration Invitation
                                        </h1>
                                        <p style="color: #6b7280; font-size: 15px; margin: 0 0 24px 0;">
                                            You've been invited to collaborate on a ${typeLabel}
                                        </p>
                                    </td>
                                </tr>

                                <!-- Content -->
                                <tr>
                                    <td style="padding: 32px 40px;">
                                        <p style="color: #374151; font-size: 15px; margin: 0 0 16px 0; line-height: 1.6;">
                                            Hello ${inviteeName || 'Researcher'},
                                        </p>
                                        <p style="color: #4b5563; font-size: 15px; margin: 0 0 24px 0; line-height: 1.7;">
                                            <strong>${inviterName}</strong> has invited you to collaborate on the ${typeLabel}:
                                        </p>
                                        
                                        <!-- Manuscript Details -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
                                            <tr>
                                                <td style="padding: 20px 24px;">
                                                    <p style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">
                                                        "${manuscriptTitle}"
                                                    </p>
                                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td style="padding: 4px 0;">
                                                                <span style="color: #6b7280; font-size: 14px; display: inline-block; width: 80px;">Role:</span>
                                                                <span style="color: #8b6cbc; font-size: 14px; font-weight: 600;">${roleLabels[role] || role}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 4px 0;">
                                                                <span style="color: #6b7280; font-size: 14px;">This role includes ${roleDescriptions[role] || 'collaboration access'}.</span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        ${message ? `
                                        <!-- Personal Message -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: rgba(139, 108, 188, 0.05); border-radius: 6px; border-left: 3px solid #8b6cbc; margin-bottom: 24px;">
                                            <tr>
                                                <td style="padding: 16px 20px;">
                                                    <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">
                                                        Personal Message from ${inviterName}
                                                    </p>
                                                    <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.6; font-style: italic;">
                                                        "${message}"
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                        ` : ''}
                                        
                                        <!-- CTA Buttons -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" style="padding: 8px 0 24px 0;">
                                                    <p style="color: #4b5563; font-size: 14px; margin: 0 0 16px 0;">
                                                        Log in to your HospitiumRIS account to accept or decline this invitation:
                                                    </p>
                                                    <a href="${loginUrl}" style="display: inline-block; background-color: #8b6cbc; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 6px;">
                                                        Log In to Respond
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Info Notice -->
                                <tr>
                                    <td style="padding: 0 40px 32px 40px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #eff6ff; border-radius: 6px; border: 1px solid #bfdbfe;">
                                            <tr>
                                                <td style="padding: 14px 16px;">
                                                    <p style="color: #1e40af; font-size: 13px; margin: 0; line-height: 1.5;">
                                                        <strong>Note:</strong> This invitation will expire in 30 days. You can accept or decline it from your notifications panel after logging in.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 20px; text-align: center;">
                            <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px 0;">
                                HospitiumRIS - Research Information System
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                This email was sent to ${inviteeEmail} because ${inviterName} invited you to collaborate.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

  const textContent = `
COLLABORATION INVITATION
${'='.repeat(50)}

Hello ${inviteeName || 'Researcher'},

${inviterName} has invited you to collaborate on the ${typeLabel}:

"${manuscriptTitle}"

Role: ${roleLabels[role] || role}
This role includes ${roleDescriptions[role] || 'collaboration access'}.

${message ? `
PERSONAL MESSAGE FROM ${inviterName.toUpperCase()}
${'-'.repeat(50)}
"${message}"

` : ''}
HOW TO RESPOND
${'-'.repeat(50)}
Log in to your HospitiumRIS account to accept or decline:
${loginUrl}

After logging in, you'll find this invitation in your notifications panel.

NOTE: This invitation will expire in 30 days.

${'='.repeat(50)}
HospitiumRIS - Research Information System
This email was sent to ${inviteeEmail} because ${inviterName} invited you to collaborate.
`;

  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'HospitiumRIS <noreply@hospitiumris.com>',
      to: inviteeEmail,
      subject: `HospitiumRIS - Invitation to collaborate on "${manuscriptTitle}"`,
      html: htmlContent,
      text: textContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`📧 Collaboration invite email sent to ${inviteeEmail}`);
    return { success: true, data: result };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}
