# Database Setup for Hospitium RIS

## Prerequisites

1. **PostgreSQL** installed and running on your system
2. **Node.js** and **npm** installed

## Database Configuration

### 1. Create PostgreSQL Database

Connect to your PostgreSQL server and create the database:

```sql
CREATE DATABASE hospitiumris;
```

### 2. Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Database (Server-side only - DO NOT add NEXT_PUBLIC_)
DATABASE_URL="postgresql://username:password@localhost:5432/hospitiumris"

# Next.js Authentication (Server-side only - DO NOT add NEXT_PUBLIC_)
NEXTAUTH_SECRET="your-super-secret-key-at-least-32-characters-long"

# Application URLs (Client-accessible)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email Service (Server-side only - DO NOT add NEXT_PUBLIC_)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password-or-password"
SMTP_REJECT_UNAUTHORIZED="true"
FROM_EMAIL="Hospitium RIS <your-email@gmail.com>"

# ORCID Configuration
NEXT_PUBLIC_ORCID_CLIENT_ID="your-orcid-client-id"
ORCID_CLIENT_SECRET="your-orcid-client-secret"
NEXT_PUBLIC_ORCID_REDIRECT_URI="http://localhost:3000/auth/orcid/callback"
NEXT_PUBLIC_ORCID_SCOPE="/authenticate"
NEXT_PUBLIC_ORCID_SANDBOX_URL="https://sandbox.orcid.org/oauth/authorize"
NEXT_PUBLIC_ORCID_TOKEN_URL="https://sandbox.orcid.org/oauth/token"
```

**Replace:**
- `username` - your PostgreSQL username
- `password` - your PostgreSQL password
- `localhost:5432` - your PostgreSQL host and port (if different)
- SMTP settings - your email provider's SMTP configuration
- `your-email@gmail.com` - your actual email address
- `your-app-password` - your email app password or regular password
- `your-orcid-client-id` - your ORCID application client ID
- `your-orcid-client-secret` - your ORCID application client secret

### 🔗 **ORCID Setup Instructions:**

1. **Register ORCID Application:**
   - Go to [ORCID Developer Tools](https://orcid.org/developer-tools)
   - Sign in with your ORCID account
   - Create a new application for development/testing
   - Set the redirect URI to: `http://localhost:3000/auth/orcid/callback`
     (Note: This is handled by a client-side page component that processes the ORCID response)

2. **Get Your Credentials:**
   - Copy your Client ID to `NEXT_PUBLIC_ORCID_CLIENT_ID`
   - Copy your Client Secret to `ORCID_CLIENT_SECRET`

3. **Production Setup:**
   - For production, change the sandbox URLs to production:
     - `NEXT_PUBLIC_ORCID_SANDBOX_URL="https://orcid.org/oauth/authorize"`
     - `NEXT_PUBLIC_ORCID_TOKEN_URL="https://orcid.org/oauth/token"`
   - Update redirect URI to your production domain

### ⚠️ **Security Note - Environment Variables:**

**Variables with `NEXT_PUBLIC_` prefix:**
- ✅ **Safe to expose** - These are accessible on the client-side (browser)
- ✅ `NEXT_PUBLIC_APP_URL` - Application base URL for links and redirects
- ⚠️ Only use for non-sensitive configuration that users can see

**Variables WITHOUT `NEXT_PUBLIC_` prefix:**
- 🔒 **Server-side only** - Never exposed to the browser
- 🔒 `DATABASE_URL` - Database credentials
- 🔒 `NEXTAUTH_SECRET` - Authentication secret key
- 🔒 `SMTP_*` - Email server credentials
- ❌ **Never add NEXT_PUBLIC_ to these** - Would expose sensitive data!

### 3. Install Dependencies

```bash
npm install
```

### 4. Generate Prisma Client

```bash
npm run db:generate
```

### 5. Create and Apply Database Schema

For development (creates tables without migration files):
```bash
npm run db:push
```

For production (creates migration files):
```bash
npm run db:migrate
```

### 6. Set up Email Service (SMTP)

Configure SMTP settings in your `.env` file. Here are common configurations:

**Gmail SMTP:**
```bash
# Application URL (accessible to client-side)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# SMTP Configuration (server-side only)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"  # Use App Password for Gmail
FROM_EMAIL="Hospitium RIS <your-email@gmail.com>"
```

**Outlook/Hotmail SMTP:**
```bash
# Application URL (accessible to client-side)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# SMTP Configuration (server-side only)
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@outlook.com"
SMTP_PASS="your-password"
FROM_EMAIL="Hospitium RIS <your-email@outlook.com>"
```

**Custom SMTP Server:**
```bash
# Application URL (accessible to client-side)
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# SMTP Configuration (server-side only)
SMTP_HOST="your-smtp-server.com"
SMTP_PORT="587"  # or 465 for SSL
SMTP_SECURE="false"  # true for port 465, false for other ports
SMTP_USER="your-username"
SMTP_PASS="your-password"
SMTP_REJECT_UNAUTHORIZED="true"
FROM_EMAIL="Hospitium RIS <noreply@yourdomain.com>"
```

**Note for Gmail Users:**
To use Gmail SMTP, you need to:
1. Enable 2-factor authentication on your Google account
2. Generate an App Password for your application
3. Use the App Password (not your regular password) in `SMTP_PASS`

### 7. Test Email Configuration

Before starting the application, test your SMTP configuration:
```bash
npm run test:email your-email@example.com
```

This will:
- Verify your SMTP connection
- Send a test email to confirm everything works
- Display helpful error messages if there are issues

### 8. Verify Database Setup

Open Prisma Studio to view your database:
```bash
npm run db:studio
```

## Database Schema Overview

### Users Table
- **id**: Unique identifier (CUID)
- **accountType**: RESEARCHER | RESEARCH_ADMIN | FOUNDATION_ADMIN
- **status**: PENDING | ACTIVE | INACTIVE | SUSPENDED
- **givenName, familyName**: User's name
- **email**: Unique email address
- **passwordHash**: Encrypted password
- **orcidId, orcidGivenNames, orcidFamilyName**: ORCID integration data
- **primaryInstitution, startMonth, startYear**: Research details
- **emailVerified**: Email verification status (boolean)
- **emailVerifyToken, emailVerifyExpires**: Email activation token and expiry

### Institutions Table (for Research Admins)
- **userId**: Foreign key to User
- **name**: Institution name
- **type**: University | Hospital | Research Institute | Other
- **country**: Institution's country
- **website**: Institution website (optional)

### Foundations Table (for Foundation Admins)
- **userId**: Foreign key to User
- **institutionName**: Primary institution name
- **foundationName**: Foundation name
- **type**: Foundation type
- **country**: Foundation's country
- Additional optional fields: website, focusArea, description

### Registration Logs Table
- Tracks all registration attempts for auditing
- Records IP address, user agent, success status
- Useful for monitoring and debugging

## API Endpoints

### POST /api/auth/register
Handles user registration for all account types and sends activation emails.

### GET /api/auth/activate
Handles email account activation via activation token.

**Request Body:**
```json
{
  "accountType": "RESEARCHER|RESEARCH_ADMIN|FOUNDATION_ADMIN",
  "givenName": "John",
  "familyName": "Doe", 
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  // ... additional fields based on account type
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email to activate your account.",
  "user": {
    "id": "...",
    "accountType": "RESEARCHER",
    "givenName": "John",
    "familyName": "Doe",
    "email": "john.doe@example.com",
    "emailVerified": false
  },
  "emailSent": true,
  "nextStep": "Please check your email and click the activation link to complete your registration."
}
```

**Response (Error):**
```json
{
  "success": false,
  "errors": {
    "email": "An account with this email already exists"
  },
  "message": "Validation failed"
}
```

## Client-Side Configuration

The application uses `NEXT_PUBLIC_` environment variables for client-accessible configuration. These are centralized in `src/lib/config.js`:

```javascript
import { APP_CONFIG, getAbsoluteUrl, getApiUrl } from '@/lib/config';

// Examples of usage:
console.log(APP_CONFIG.url);           // "http://localhost:3000"
console.log(APP_CONFIG.urls.login);    // "http://localhost:3000/login"
console.log(getAbsoluteUrl('activate')); // "http://localhost:3000/activate"
console.log(getApiUrl('auth/login'));    // "http://localhost:3000/api/auth/login"
```

This approach:
- ✅ Centralizes URL configuration
- ✅ Provides helper functions for consistent URL building
- ✅ Uses environment variables safely
- ✅ Works in both development and production

## Development Commands

```bash
# Start development server
npm run dev

# Test email configuration
npm run test:email your-email@example.com

# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database (development)
npm run db:push

# Create and run migrations (production)
npm run db:migrate

# Reset database (WARNING: Deletes all data)
npm run db:reset

# Seed database with test users
npm run db:seed

# Open database browser
npm run db:studio
```

## Security Features

- **Password Hashing**: Uses bcryptjs with 12 salt rounds
- **Email Validation**: Server-side email format validation  
- **Email Verification**: Required email activation with secure tokens
- **Token Expiration**: Activation tokens expire in 24 hours
- **Password Strength**: Enforces strong password requirements
- **Input Sanitization**: Trims whitespace and validates all inputs
- **Audit Logging**: Tracks all registration attempts
- **Transaction Safety**: Uses database transactions for data integrity

## Troubleshooting

### Common Issues

1. **Connection Error**: Verify PostgreSQL is running and DATABASE_URL is correct
2. **Schema Errors**: Run `npm run db:generate` after schema changes
3. **Migration Issues**: Use `npm run db:reset` to start fresh (development only)
4. **Missing Tables**: Run `npm run db:push` or `npm run db:migrate`
5. **Email Not Sending**: 
   - Test your SMTP config with `npm run test:email your-email@example.com`
   - For Gmail, use App Passwords instead of regular password
   - Check firewall settings for SMTP ports (587/465)
   - Verify FROM_EMAIL matches your SMTP_USER for most providers

### Database Reset (Development Only)

To completely reset your database:
```bash
npm run db:reset
npm run db:push
```

⚠️ **WARNING**: This will delete all data in your database!

## Production Deployment

1. Set up PostgreSQL on your production server
2. Update `DATABASE_URL` in production environment
3. Run migrations: `npm run db:migrate`
4. Deploy your Next.js application

## Next Steps

After setting up the database:
1. Test the registration flow
2. Set up user authentication/login
3. Create admin dashboard for user management
4. Implement email verification (optional)
5. Add user profile management
