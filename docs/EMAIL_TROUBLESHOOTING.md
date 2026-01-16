# Email Activation Troubleshooting Guide

## Problem
Users registering accounts in production receive "pending" status with unverified email, but activation emails are not being sent.

## Root Cause
The activation email sending process fails silently in production, likely due to missing or incorrect SMTP configuration environment variables.

## Required Environment Variables

The following environment variables **must** be configured in your production environment:

```bash
# SMTP Server Configuration
SMTP_HOST=smtp.example.com          # Your SMTP server hostname
SMTP_PORT=587                        # SMTP port (587 for TLS, 465 for SSL, 25 for plain)
SMTP_SECURE=false                    # true for port 465, false for other ports
SMTP_USER=your-email@example.com    # SMTP authentication username
SMTP_PASS=your-password-or-app-key  # SMTP authentication password
SMTP_REJECT_UNAUTHORIZED=true       # Set to false only for testing with self-signed certs

# Email Sender Configuration
FROM_EMAIL=HospitiumRIS <noreply@hospitiumris.org>  # Sender email address

# Application URL (for activation links)
NEXT_PUBLIC_APP_URL=https://hospitium.hospitiumris.org
```

## Common SMTP Providers

### Gmail
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-specific-password  # Generate at https://myaccount.google.com/apppasswords
```

### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-smtp-password
```

## Testing Email Configuration

### 1. Test SMTP Configuration Locally
```bash
node scripts/test-email.js your-test-email@example.com
```

This will verify your SMTP settings and send a test email.

### 2. Check Production Logs

After a user registers, check your production logs for email-related messages:

**Success indicators:**
```
📧 Attempting to send activation email to: user@example.com
🔧 Creating email transporter with SMTP configuration
🔍 Verifying SMTP connection...
✅ SMTP connection verified
📤 Sending email to: user@example.com
✅ Email sent successfully. Message ID: <message-id>
✅ Activation email sent successfully to: user@example.com
```

**Failure indicators:**
```
❌ Email Configuration Error: Missing required SMTP environment variables: SMTP_HOST, SMTP_PORT
❌ Failed to send activation email
❌ Email send error: Authentication failed
❌ Email send error: Connection timeout
```

### 3. Check Registration Logs in Database

Query the `registrationLog` table to see email sending status:

```sql
SELECT email, accountType, success, errorMessage, createdAt 
FROM "RegistrationLog" 
WHERE success = true AND errorMessage IS NOT NULL
ORDER BY createdAt DESC 
LIMIT 10;
```

Entries with `errorMessage` containing "Email sending failed" indicate email issues.

## Deployment Platform-Specific Instructions

### Vercel
1. Go to your project settings
2. Navigate to Environment Variables
3. Add all required SMTP variables
4. Redeploy your application

### Netlify
1. Go to Site settings → Environment variables
2. Add all required SMTP variables
3. Trigger a new deploy

### Railway
1. Go to your project → Variables
2. Add all required SMTP variables
3. Redeploy

### Docker/Self-hosted
Add environment variables to your `.env` file or docker-compose.yml:

```yaml
environment:
  - SMTP_HOST=smtp.example.com
  - SMTP_PORT=587
  - SMTP_USER=your-email@example.com
  - SMTP_PASS=your-password
  - FROM_EMAIL=noreply@hospitiumris.org
```

## Manual User Activation (Temporary Workaround)

If email is not working and users need immediate access:

### Option 1: Resend Activation Email
Users can request a new activation email at:
```
https://hospitium.hospitiumris.org/resend-activation
```

### Option 2: Manual Database Activation (Admin Only)
```sql
UPDATE "User" 
SET "emailVerified" = NOW(), 
    "emailVerifyToken" = NULL, 
    "emailVerifyExpires" = NULL 
WHERE email = 'user@example.com';
```

⚠️ **Warning:** Only use this for trusted users as it bypasses email verification.

## Troubleshooting Common Issues

### Issue: "Authentication failed"
**Solution:** 
- Verify SMTP_USER and SMTP_PASS are correct
- For Gmail, use App Password instead of regular password
- Check if 2FA is enabled and requires app-specific password

### Issue: "Connection timeout"
**Solution:**
- Verify SMTP_HOST and SMTP_PORT are correct
- Check firewall rules allow outbound SMTP connections
- Verify your hosting provider doesn't block SMTP ports

### Issue: "Certificate error"
**Solution:**
- Set `SMTP_REJECT_UNAUTHORIZED=false` (only for testing)
- Use proper SSL/TLS settings for your SMTP provider

### Issue: "Missing environment variables"
**Solution:**
- Verify all required variables are set in production
- Check variable names match exactly (case-sensitive)
- Restart your application after adding variables

## Enhanced Error Logging

The system now includes enhanced error logging that will show:
- Missing environment variables
- SMTP connection verification status
- Detailed error codes and messages
- User email and account information

Check your production logs for these detailed error messages to diagnose issues.

## Support

If you continue to experience issues:
1. Run the test email script locally
2. Check production logs for detailed error messages
3. Verify all environment variables are set correctly
4. Contact your SMTP provider's support if authentication fails
