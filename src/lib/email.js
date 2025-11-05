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
    <title>Activate Your Hospitium RIS Account</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
        }
        .logo {
            max-width: 200px;
            height: auto;
            margin-bottom: 20px;
        }
        .welcome-text {
            font-size: 24px;
            font-weight: 600;
            color: #8b6cbc;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 16px;
        }
        .account-details {
            background: #f8f9fa;
            border-left: 4px solid #8b6cbc;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .account-details h3 {
            margin-top: 0;
            color: #8b6cbc;
            font-size: 18px;
        }
        .detail-row {
            margin: 8px 0;
            display: flex;
            justify-content: space-between;
        }
        .detail-label {
            font-weight: 600;
            color: #555;
        }
        .detail-value {
            color: #333;
        }
        .activation-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: linear-gradient(135deg, #8b6cbc 0%, #7a5ba8 100%);
            border-radius: 12px;
            color: white;
        }
        .activation-section h3 {
            margin: 0 0 15px 0;
            font-size: 20px;
        }
        .activation-section p {
            margin: 0 0 20px 0;
            opacity: 0.9;
        }
        .activate-button {
            display: inline-block;
            padding: 12px 30px;
            background: white;
            color: #8b6cbc;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 10px 0;
            transition: all 0.3s ease;
        }
        .activate-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255,255,255,0.3);
        }
        .login-info {
            background: #f3f0fc;
            border: 1px solid #d2c3e8;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .login-info h4 {
            margin: 0 0 10px 0;
            color: #8b6cbc;
        }
        .login-url {
            word-break: break-all;
            color: #8b6cbc;
            text-decoration: none;
            font-weight: 500;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 14px;
        }
        .security-notice {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
        }
        .security-notice strong {
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${baseUrl}/hospitium-logo.png" alt="Hospitium RIS" class="logo">
            <div class="welcome-text">${isResend ? 'Activate Your Hospitium RIS Account' : 'Welcome to Hospitium RIS!'}</div>
            <div class="subtitle">${isResend ? 'Here is your new activation link' : 'Your account has been created successfully'}</div>
        </div>

        <div class="account-details">
            <h3>Account Details</h3>
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${user.givenName} ${user.familyName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${user.email}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Account Type:</span>
                <span class="detail-value">${accountTypeLabels[user.accountType]}</span>
            </div>
            ${user.primaryInstitution ? `
            <div class="detail-row">
                <span class="detail-label">Primary Institution:</span>
                <span class="detail-value">${user.primaryInstitution}</span>
            </div>
            ` : ''}
            ${user.orcidId ? `
            <div class="detail-row">
                <span class="detail-label">ORCID ID:</span>
                <span class="detail-value">${user.orcidId}</span>
            </div>
            ` : ''}
        </div>

        <div class="activation-section">
            <h3>Activate Your Account</h3>
            <p>${isResend ? 'Your previous activation link has been replaced with this new one. Please click the button below to activate your account:' : 'To complete your registration and start using Hospitium RIS, please activate your account by clicking the button below:'}</p>
            <a href="${activationUrl}" class="activate-button">Activate My Account</a>
        </div>

        <div class="login-info">
            <h4>After Activation - Login Here:</h4>
            <p>Once your account is activated, you can login at:</p>
            <a href="${baseUrl}/login" class="login-url">${baseUrl}/login</a>
        </div>

        <div class="security-notice">
            <strong>Security Notice:</strong> This activation link will expire in 24 hours for your security. 
            If you didn't create this account, please ignore this email or contact our support team.
        </div>

        <div class="footer">
            <p>Thank you for joining Hospitium RIS!</p>
            <p>If you have any questions, please contact our support team.</p>
            <p style="font-size: 12px; color: #888;">
                This email was sent to ${user.email} because you registered for a Hospitium RIS account.
            </p>
        </div>
    </div>
</body>
</html>`;

  const textContent = `
${isResend ? 'Activate Your Hospitium RIS Account' : 'Welcome to Hospitium RIS!'}

${isResend ? 'Here is your new activation link.' : 'Your account has been created successfully.'}

Account Details:
- Name: ${user.givenName} ${user.familyName}
- Email: ${user.email}
- Account Type: ${accountTypeLabels[user.accountType]}
${user.primaryInstitution ? `- Primary Institution: ${user.primaryInstitution}` : ''}
${user.orcidId ? `- ORCID ID: ${user.orcidId}` : ''}

ACTIVATE YOUR ACCOUNT:
${isResend ? 'Your previous activation link has been replaced with this new one.' : 'To complete your registration, please visit the following link:'}
${activationUrl}

AFTER ACTIVATION - LOGIN HERE:
${baseUrl}/login

SECURITY NOTICE:
This activation link will expire in 24 hours for your security.
If you didn't create this account, please ignore this email.

Thank you for ${isResend ? 'using' : 'joining'} Hospitium RIS!
`;

  try {
    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'Hospitium RIS <noreply@hospitiumris.com>',
      to: user.email,
      subject: isResend ? 'Hospitium RIS - New Activation Link' : 'Welcome to Hospitium RIS - Activate Your Account',
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
