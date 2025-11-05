# ORCID Login Configuration Guide

## 🚨 Current Issue
**Error:** "ORCID login is not properly configured"

**Cause:** Missing ORCID environment variables in your `.env` file.

## 📋 Required Environment Variables

Create a `.env` file in your project root with these variables:

```bash
# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database Configuration  
DATABASE_URL="file:./dev.db"

# 🔑 ORCID Configuration (REQUIRED)
NEXT_PUBLIC_ORCID_CLIENT_ID=your_orcid_client_id_here
ORCID_CLIENT_SECRET=your_orcid_client_secret_here
NEXT_PUBLIC_ORCID_REDIRECT_URI=http://localhost:3000/api/auth/orcid/callback

# ORCID Optional Configuration (these have defaults)
NEXT_PUBLIC_ORCID_SCOPE=/authenticate
NEXT_PUBLIC_ORCID_SANDBOX_URL=https://sandbox.orcid.org/oauth/authorize
NEXT_PUBLIC_ORCID_TOKEN_URL=https://sandbox.orcid.org/oauth/token

# Session Secret
NEXTAUTH_SECRET=your_super_secret_jwt_secret_here_make_it_long_and_random

# Environment
NODE_ENV=development
```

## 🔧 How to Get ORCID Credentials

### Step 1: Register Your Application

1. **Go to ORCID Developer Portal:**
   - **Sandbox (Development):** https://sandbox.orcid.org/developer-tools
   - **Production:** https://orcid.org/developer-tools

2. **Sign in or Create Account:**
   - Create a sandbox ORCID account if you don't have one
   - Sign in to the developer tools

3. **Register Your Application:**
   - Click "Register for the free ORCID public API"
   - Fill out the application form:
     - **Application Name:** Hospitium RIS
     - **Website URL:** http://localhost:3000
     - **Description:** Research Information System
     - **Redirect URI:** `http://localhost:3000/api/auth/orcid/callback`

### Step 2: Get Your Credentials

After registration, you'll receive:
- **Client ID** → Use for `NEXT_PUBLIC_ORCID_CLIENT_ID`
- **Client Secret** → Use for `ORCID_CLIENT_SECRET`

### Step 3: Create Your .env File

```bash
# Copy this template and replace the values
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL="file:./dev.db"

# Replace these with your actual ORCID credentials
NEXT_PUBLIC_ORCID_CLIENT_ID=APP-XXXXXXXXXXXXXXXXX
ORCID_CLIENT_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_ORCID_REDIRECT_URI=http://localhost:3000/api/auth/orcid/callback

NEXT_PUBLIC_ORCID_SCOPE=/authenticate
NEXT_PUBLIC_ORCID_SANDBOX_URL=https://sandbox.orcid.org/oauth/authorize
NEXT_PUBLIC_ORCID_TOKEN_URL=https://sandbox.orcid.org/oauth/token

NEXTAUTH_SECRET=generate-a-long-random-string-here

NODE_ENV=development
```

## 🚀 Quick Setup Commands

Run these commands to get started quickly:

```bash
# 1. Create .env file
touch .env

# 2. Open .env file in your editor
# Add the configuration above with your actual ORCID credentials

# 3. Restart your development server
npm run dev
```

## ✅ Testing Your Configuration

1. **Restart your development server** after creating the `.env` file
2. **Go to:** http://localhost:3000/login
3. **Click the ORCID button** - it should now redirect to ORCID sandbox
4. **Check activity logs** at http://localhost:3000/logs to see the ORCID flow

## 🔍 Troubleshooting

### Common Issues:

1. **"ORCID login is not properly configured"**
   - Check that `NEXT_PUBLIC_ORCID_CLIENT_ID` and `NEXT_PUBLIC_ORCID_REDIRECT_URI` are set
   - Restart your development server after adding `.env`

2. **"Invalid redirect URI"**
   - Make sure the redirect URI in ORCID settings matches exactly: `http://localhost:3000/api/auth/orcid/callback`

3. **"Authorization code not received"**
   - Check your ORCID application configuration
   - Verify the redirect URI is correct

## 📱 Production Setup

When deploying to production:

1. **Register a production ORCID application** at https://orcid.org/developer-tools
2. **Update your .env variables:**
   ```bash
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   NEXT_PUBLIC_ORCID_REDIRECT_URI=https://yourdomain.com/api/auth/orcid/callback
   NEXT_PUBLIC_ORCID_SANDBOX_URL=https://orcid.org/oauth/authorize
   NEXT_PUBLIC_ORCID_TOKEN_URL=https://orcid.org/oauth/token
   ```

## 🎯 Need Help?

If you're still having issues:

1. **Check the browser console** for client-side errors
2. **Check your development server logs** for server-side errors
3. **Verify your ORCID application settings** in the developer portal
4. **Test with the activity logging** to see where the flow breaks

---

💡 **Tip:** The ORCID sandbox environment is perfect for development and testing. You can create test ORCID accounts and applications without affecting real users.
