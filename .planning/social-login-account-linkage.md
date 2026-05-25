# Social Login Account Linkage — ORCID & Google

Implement ORCID and Google OAuth logins that always link to existing accounts (no new registrations), using ORCID-ID direct matching for researchers, and institution-email confirmation for non-researchers or first-time Google logins, with a registration-style stepper on the callback pages.

---

## Current State

- **ORCID**: OAuth flow exists; on success it finds user by `orcidId`. If not found it **wrongly redirects to registration** — this must change.
- **Google**: Button exists in UI but is not implemented (just a `console.log`).
- **Schema**: No `googleId` field exists on `User`.

---

## Linkage Rules

| Provider | Has linked ID on account? | Action |
|---|---|---|
| ORCID | Yes (`orcidId` matches) | Direct login |
| ORCID | No match | Show linkage stepper — ask for institution email; on match, save `orcidId` |
| Google | Yes (`googleId` matches) | Direct login |
| Google | No match | Show linkage stepper — ask for institution email; on match, save `googleId` |

For ORCID non-researchers: during linkage, we also do a cross-check — if ORCID's returned name/email matches the signup data, that's the confirmation. The institution email is the primary lookup key.

**After linkage**: ID is permanently stored on the user record → all future logins are direct (no re-entry needed).

---

## Steps

### 1. Prisma Schema — Add `googleId` to User
- Add `googleId String?` field to the `User` model in `prisma/schema.prisma`
- Run `prisma migrate dev --name add_google_id`

### 2. New API: `POST /api/auth/orcid/link`
New endpoint that handles first-time ORCID account linkage for users not yet matched by `orcidId`:
- Accepts: `{ orcidId, orcidData, institutionEmail, rememberMe }`
- Looks up user by `institutionEmail` (case-insensitive)
- Validates account is active + verified
- Checks no other account already holds this `orcidId` (conflict guard)
- Saves `orcidId` (+ `orcidGivenNames`, `orcidFamilyName`) to the user record
- Sets session cookie and returns login response (same shape as existing login route)
- Follows audit trail logging pattern

### 3. New API: `POST /api/auth/google/token`
Exchanges Google authorization code for profile data (mirrors `/api/auth/orcid/token`):
- Accepts: `{ code, redirect_uri }`
- Calls `https://oauth2.googleapis.com/token` with `GOOGLE_CLIENT_SECRET`
- Calls `https://www.googleapis.com/oauth2/v3/userinfo` with the access token
- Returns: `{ googleId, email, name, givenName, familyName, picture }`
- Uses `NEXT_PUBLIC_GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`

### 4. New API: `POST /api/auth/google/link`
First-time Google account linkage endpoint (mirrors orcid/link):
- Accepts: `{ googleId, googleData, institutionEmail, rememberMe }`
- Looks up user by `institutionEmail`
- Conflict guard: no other account holds this `googleId`
- Saves `googleId` to the user record
- Sets session cookie and returns login response

### 5. New API: `POST /api/auth/google/login`
Direct Google login for already-linked accounts (mirrors the `orcidLogin` branch of `/api/auth/login`):
- Accepts: `{ googleId, googleData, rememberMe }`
- Finds user by `googleId`
- Validates active + verified
- Sets session cookie, returns login response with `dashboardRoute`

### 6. Update ORCID Callback Page (`/auth/orcid/callback/page.jsx`)
Change the "user not found" branch from *redirect to registration* to a **registration-style stepper**:

**Stepper flow (when no `orcidId` match):**
- **Step 1 — Enter Institution Email**: Explain "Your ORCID is not yet linked to an account. Enter the email you registered with."
- **Step 2 — Confirm Account**: Show masked account details (name + masked email) fetched by email lookup, ask user to confirm this is their account
- **Step 3 — Linked**: Success state, then redirect to dashboard

Uses existing MUI `Stepper` style consistent with the registration page. ORCID identity details (name, orcid-id) are displayed throughout for reassurance.

### 7. New Google Callback Page (`/auth/google/callback/page.jsx`)
Mirrors the ORCID callback page in structure and UX:
- On load: exchanges `code` → calls `/api/auth/google/token`
- Checks if `googleId` exists in DB via `POST /api/auth/me` with `action: 'check_google_user'`
- **If found**: calls `/api/auth/google/login` → redirect to dashboard
- **If not found**: shows the same 3-step linkage stepper (using Google's returned name/picture for branding)

### 8. Update Login Page (`/src/app/login/page.js`)
Replace the Google stub in `handleSocialLogin`:
- Build Google OAuth authorization URL: `https://accounts.google.com/o/oauth2/v2/auth`
- Uses `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`
- Scope: `openid email profile`
- Store CSRF state cookie (same pattern as ORCID)
- Redirect user to Google

### 9. Update `/api/auth/me` Route
Add `check_google_user` action (alongside existing `check_orcid_user`):
- `POST { action: 'check_google_user', googleId }` → returns `{ userExists: boolean }`

### 10. Environment Variables Required
Add to `.env`:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```
Register `http://localhost:3000/auth/google/callback` (and production URL) as an **Authorized redirect URI** in Google Cloud Console under your OAuth 2.0 Client.

---

## Files Changed / Created

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `googleId String?` to User |
| `prisma/migrations/...` | Auto-generated migration |
| `src/app/api/auth/orcid/link/route.js` | **NEW** |
| `src/app/api/auth/google/token/route.js` | **NEW** |
| `src/app/api/auth/google/link/route.js` | **NEW** |
| `src/app/api/auth/google/login/route.js` | **NEW** |
| `src/app/api/auth/me/route.js` | Add `check_google_user` action |
| `src/app/auth/orcid/callback/page.jsx` | Replace redirect-to-registration with linkage stepper |
| `src/app/auth/google/callback/page.jsx` | **NEW** — mirrors ORCID callback |
| `src/app/login/page.js` | Implement Google OAuth redirect |

---

## Notes & Constraints

- No new registrations via social login — if email not found during linkage, show a clear "No account found — please register first" message with a link to `/register`
- Password is **not** re-confirmed during linkage (trust the OAuth provider as a second factor)
- The existing ORCID flow for researchers with `orcidId` already stored continues unchanged
- Audit logging applied to all new API routes per existing pattern
