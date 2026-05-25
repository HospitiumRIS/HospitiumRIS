# Dual-Institution Multi-Tenant System with Domain Verification

Implement a dual-institution model where users have a Primary Institution (from ORCID) and a verified Secondary Institution (account-linked, domain-verified) that controls access rights, with support for IP-based authentication and cross-institution collaboration.

## Current State Analysis

### Existing Infrastructure
- **User Model**: Has `primaryInstitution` (string field) but no formal institution association
- **Institution Model**: Exists but only for RESEARCH_ADMIN users (1:1 with User)
- **VerifiedDomain Model**: Already exists in schema with domain verification support
- **Registration Flow**: Currently allows free-form institution name entry
- **Collaboration System**: Supports ORCID-based invitations but no institution verification
- **Authentication**: Basic email/password + ORCID, no IP-based authentication

### Key Issues
1. No dual-institution model (Primary from ORCID + Secondary from account)
2. No enforcement of email domain verification for Secondary institution
3. Institution model is admin-only, not available for all users
4. No domain verification workflow
5. No IP-based authentication mechanism
6. Cross-institution collaboration lacks institution context
7. Email field currently in wrong registration step (should be with Secondary institution)

## Dual-Institution Model Explained

### Primary Institution
- **Source**: Extracted from ORCID profile during registration
- **Purpose**: Academic/research affiliation (where user is employed/studying)
- **Verification**: Not required (comes from ORCID)
- **Stored as**: String field in User model (keep existing `primaryInstitution`)
- **Can be same as**: Secondary institution

### Secondary Institution
- **Source**: User selects during registration, must match email domain
- **Purpose**: Operational affiliation (where research is conducted/stationed)
- **Verification**: REQUIRED - email domain must match verified domain
- **Stored as**: Foreign key relationship to Institution model
- **Access Control**: All permissions and policies based on Secondary institution
- **Changeable**: Yes, users can switch Secondary institution later
- **History**: Track changes for audit purposes

## Implementation Plan

### Phase 1: Database Schema Updates

#### 1.1 Restructure Institution Model
- **Decouple Institution from User**: Make Institution a standalone entity
- **Keep as separate table** (not 1:1 with User)
- **Add institution fields**:
  - `slug` (unique URL-friendly identifier)
  - `logoUrl` (institution branding)
  - `description`
  - `isActive` (enable/disable institution)
  - `allowedAccountTypes` (which user types can register)
  - `requiresApproval` (auto-approve or manual approval for members)
  - `settings` (JSON for institution-specific configurations)
  
#### 1.2 Update User Model
- **Keep**: `primaryInstitution` (string - from ORCID)
- **Add**: `secondaryInstitutionId` (FK to Institution - verified)
- **Add**: `institutionVerifiedAt` (timestamp)
- **Add**: `institutionVerificationMethod` (EMAIL_DOMAIN, IP_ADDRESS, MANUAL)

#### 1.3 Create InstitutionMembershipHistory Model
- **Purpose**: Track Secondary institution changes over time
- **Fields**:
  - `userId` (FK to User)
  - `institutionId` (FK to Institution)
  - `startDate` (when affiliation started)
  - `endDate` (when affiliation ended, null if current)
  - `verificationMethod` (EMAIL_DOMAIN, IP_ADDRESS, MANUAL)
  - `changedBy` (user who made the change)
  - `reason` (optional reason for change)

#### 1.3 Enhance VerifiedDomain Model
- Already has most fields needed
- Add `requiresEmailVerification` (boolean)
- Add `ipRanges` (JSON array of allowed IP ranges)

#### 1.4 Create InstitutionIPRange Model
- **Fields**:
  - `institutionId` (FK to Institution)
  - `ipRange` (CIDR notation, e.g., "192.168.1.0/24")
  - `description` (e.g., "Main Campus Network")
  - `isActive`
  - `createdBy`, `createdAt`

### Phase 2: Institution Management System

#### 2.1 Institution Registration & Approval Workflow
- **Admin Interface** (`/admin/institutions`):
  - Create new institutions
  - Approve pending institution registrations
  - Manage institution settings
  
- **Institution Self-Registration** (optional):
  - RESEARCH_ADMIN can request new institution
  - Requires approval by GLOBAL_ADMIN
  - Includes verification documents upload

#### 2.2 Domain Verification System
- **DNS Verification**:
  - Generate unique TXT record
  - Institution admin adds to DNS
  - System verifies DNS record
  
- **Email Verification**:
  - Send verification email to postmaster@domain
  - Click verification link
  
- **Manual Verification**:
  - Upload official documentation
  - Admin reviews and approves

#### 2.3 IP Range Management
- **Interface** (`/institution-admin/ip-ranges`):
  - Add/edit/delete IP ranges
  - Support CIDR notation
  - Test IP range matching
  - View users authenticated via IP

### Phase 3: Enhanced Registration Flow

#### 3.1 Restructure Registration Steps

**For RESEARCHER Account Type:**
1. **Account Type Selection** (existing)
2. **ORCID Search** (existing) - captures Primary Institution from ORCID
3. **Account Details** (modified):
   - Remove email field from here
   - Keep: givenName, familyName (pre-filled from ORCID)
   - Keep: startMonth, startYear
   - Display Primary Institution (from ORCID, read-only)
4. **Secondary Institution & Email** (NEW STEP):
   - Email input field (moved here)
   - Auto-detect institution from email domain
   - Display matched institution with logo
   - If no match: show error, list available institutions
   - Confirm Secondary Institution selection
5. **Password** (existing)

**For RESEARCH_ADMIN and Other Non-Researcher Types:**
1. **Account Type Selection** (existing)
2. **Secondary Institution & Email** (NEW STEP):
   - Email input field
   - Auto-detect and auto-select institution from email domain
   - Display matched institution with logo
   - If no match: show error "Email domain not recognized"
   - Cannot proceed without verified domain match
3. **Password** (existing)
4. **Optional**: Add ORCID later in profile settings

#### 3.2 Email Domain Validation Logic
- **Real-time validation** as user types email:
  1. Extract domain from email (e.g., "user@university.edu" → "university.edu")
  2. Query VerifiedDomain table for matching domain
  3. If match found:
     - Auto-select corresponding institution
     - Show institution logo, name, and verification badge
     - Enable "Continue" button
  4. If no match:
     - Show error: "Email domain not recognized. Please use your institutional email."
     - List institutions with verified domains (optional)
     - Disable "Continue" button
  5. For researchers: Allow to proceed but flag for manual review
  6. For non-researchers: Block registration until domain matches

#### 3.3 Updated Registration API
- **Modify** `src/app/api/auth/register/route.js`:
  - Accept `secondaryInstitutionId` in request body
  - Validate email domain matches institution's verified domains
  - For RESEARCHER:
    - Store `primaryInstitution` from ORCID (string)
    - Store `secondaryInstitutionId` (FK)
  - For non-RESEARCHER:
    - Store `secondaryInstitutionId` (FK)
    - `primaryInstitution` can be null or same as secondary
  - Create InstitutionMembershipHistory record
  - Set `institutionVerifiedAt` and `institutionVerificationMethod`
  - Send notification to institution admin if configured

### Phase 4: IP-Based Authentication

#### 4.1 IP Detection Middleware
- **Create** `src/lib/ip-detection.js`:
  - Extract real IP from request headers
  - Handle proxy/load balancer scenarios
  - Support X-Forwarded-For, X-Real-IP headers
  
#### 4.2 IP-Based Auto-Login
- **Enhance** `src/lib/auth-server.js`:
  - Check user's IP against institution IP ranges
  - If match found and user has account:
    - Allow passwordless access (optional)
    - Add IP-based session marker
  - Log IP-based authentication attempts

#### 4.3 IP Range Matching Logic
- **Create** `src/lib/ip-range-matcher.js`:
  - Parse CIDR notation
  - Match IP against ranges
  - Support IPv4 and IPv6
  - Cache results for performance

### Phase 5: Cross-Institution Collaboration

#### 5.1 Enhanced Invitation System
- **Modify** `src/app/api/manuscripts/invitations/route.js`:
  - Include inviter's Secondary institution context
  - Add institution verification check
  - Display both Primary and Secondary institutions in UI
  - Track cross-institution collaborations
  - Show when Primary ≠ Secondary (stationed researcher)

#### 5.2 Institution Visibility in Collaboration
- **Update Collaboration UI**:
  - Show Secondary institution logo/name (main badge)
  - Show Primary institution as subtitle (if different)
  - Display "External Collaborator" badge when Secondary institutions differ
  - Display "Stationed Researcher" badge when Primary ≠ Secondary
  - Add institution filter in collaborator list (filter by Secondary)
  
#### 5.3 Collaboration Permissions
- **Based on Secondary Institution**:
  - All access rights determined by Secondary institution
  - Allow/restrict external collaborations (different Secondary institutions)
  - Require approval for external invitations
  - Set collaboration policies per institution
  - Track cross-institution collaboration metrics

#### 5.4 Cross-Institution Invitation Flow
- **When inviting external user**:
  1. Verify invitee's Secondary institution
  2. Check if inviter's Secondary institution allows external collaboration
  3. Check if invitee's Secondary institution allows external collaboration
  4. Send invitation with both institutions context
  5. Notify both institution admins (if required)
  6. Track collaboration metrics by Secondary institution

### Phase 6: Institution Admin Dashboard

#### 6.1 Member Management
- **Create** `src/app/institution-admin/members/page.js`:
  - View all institution members
  - Approve pending members
  - Manage member roles
  - Suspend/reactivate members
  - Export member list

#### 6.2 Domain Management
- **Create** `src/app/institution-admin/domains/page.js`:
  - Add verified domains
  - Initiate verification process
  - View verification status
  - Manage domain settings

#### 6.3 IP Range Management
- **Create** `src/app/institution-admin/ip-ranges/page.js`:
  - Add/edit IP ranges
  - Test IP matching
  - View IP-based logins

#### 6.4 Collaboration Analytics
- **Create** `src/app/institution-admin/collaborations/page.js`:
  - View cross-institution collaborations
  - Track external partnerships
  - Export collaboration reports
  - Set collaboration policies

### Phase 7: User Experience Updates

#### 7.1 Profile Institution Display
- **Update** `src/app/researcher/profile/page.js`:
  - Display **Primary Institution** (from ORCID, read-only)
  - Display **Secondary Institution** (current, with logo and badge)
  - Show institution change history
  - Button to "Change Secondary Institution"
  - If Primary ≠ Secondary, show "Stationed Researcher" badge
  - Option to update ORCID (which may update Primary Institution)

#### 7.2 Secondary Institution Change Flow
- **Create** `src/app/researcher/profile/change-institution/page.js`:
  - Enter new institutional email
  - Validate email domain
  - Auto-detect new institution
  - Confirm change with reason
  - Admin approval required (if configured)
  - Create history record
  - Send notifications

#### 7.3 Navigation & Context
- **Update Navigation**:
  - Display current Secondary institution logo in navbar
  - Show Primary institution in user menu (if different)
  - All features/permissions based on Secondary institution
  - No institution switcher (only one active Secondary at a time)

#### 7.4 Collaboration Invitations UI
- **Update** invitation components:
  - Show both Primary and Secondary institutions
  - Display cross-institution warnings/notices
  - Add institution verification badges
  - Highlight when collaborator is "stationed" (Primary ≠ Secondary)

### Phase 8: Security & Compliance

#### 8.1 Audit Logging
- **Create** `InstitutionAuditLog` model:
  - Log all institution-related actions
  - Track domain verifications
  - Log IP-based authentications
  - Record cross-institution collaborations

#### 8.2 Access Control
- **Implement**:
  - Institution-level permissions
  - Role-based access within institutions
  - Cross-institution collaboration policies
  - Data isolation between institutions

#### 8.3 Compliance Features
- **Add**:
  - GDPR compliance for multi-tenant data
  - Data export per institution
  - Right to be forgotten per institution
  - Audit trail exports

## Migration Strategy

### Step 1: Database Migration
1. Add new fields to User model (`secondaryInstitutionId`, etc.)
2. Create new tables (InstitutionMembershipHistory, InstitutionIPRange)
3. Update Institution model (add new fields)
4. Update VerifiedDomain model
5. Keep `primaryInstitution` string field (no breaking changes)

### Step 2: Seed Initial Institutions
1. Create Institution records for known organizations
2. Add verified domains for each institution
3. Set up initial IP ranges (if available)
4. Configure institution settings

### Step 3: Gradual Rollout
1. Deploy new models without enforcement
2. Update registration flow with new steps
3. New users must select Secondary institution
4. Existing users: prompt to select Secondary institution on next login
5. Grace period before enforcement

### Step 4: Data Migration Script
```javascript
// scripts/migrate-to-dual-institutions.js
// For existing users:
// 1. Keep primaryInstitution as-is (from ORCID)
// 2. Prompt to select secondaryInstitutionId
// 3. Create InstitutionMembershipHistory record
// 4. Set verification method as MANUAL (grandfather clause)
```

### Step 5: Existing User Migration Flow
- **On next login**, existing users see:
  1. "Complete Your Profile" modal
  2. Enter institutional email
  3. Auto-detect Secondary institution
  4. Confirm selection
  5. Create history record
  6. Continue to dashboard

## API Endpoints

### Institution Management
- `POST /api/institutions` - Create institution (admin)
- `GET /api/institutions` - List institutions
- `GET /api/institutions/:id` - Get institution details
- `PATCH /api/institutions/:id` - Update institution
- `DELETE /api/institutions/:id` - Delete institution

### Domain Verification
- `POST /api/institutions/:id/domains` - Add domain
- `POST /api/institutions/:id/domains/:domainId/verify` - Verify domain
- `GET /api/institutions/:id/domains` - List domains
- `DELETE /api/institutions/:id/domains/:domainId` - Remove domain

### IP Range Management
- `POST /api/institutions/:id/ip-ranges` - Add IP range
- `GET /api/institutions/:id/ip-ranges` - List IP ranges
- `PATCH /api/institutions/:id/ip-ranges/:rangeId` - Update IP range
- `DELETE /api/institutions/:id/ip-ranges/:rangeId` - Remove IP range
- `POST /api/institutions/:id/ip-ranges/test` - Test IP matching

### User Institution Management
- `GET /api/user/institutions` - Get user's Primary and Secondary institutions
- `GET /api/user/institutions/history` - Get institution change history
- `POST /api/user/institutions/change` - Request Secondary institution change
- `POST /api/institutions/validate-email` - Validate email domain (for registration)

### Institution Member Management
- `GET /api/institutions/:id/members` - List members (by Secondary institution)
- `PATCH /api/institutions/:id/members/:userId/approve` - Approve pending member
- `PATCH /api/institutions/:id/members/:userId/suspend` - Suspend member

### Collaboration
- `GET /api/institutions/:id/collaborations` - List cross-institution collaborations
- `GET /api/institutions/:id/collaboration-policies` - Get policies
- `PATCH /api/institutions/:id/collaboration-policies` - Update policies

## Testing Requirements

1. **Unit Tests**:
   - IP range matching logic
   - Domain verification
   - Email domain extraction
   - Institution association logic

2. **Integration Tests**:
   - Registration with institution
   - Domain verification workflow
   - IP-based authentication
   - Cross-institution invitations

3. **E2E Tests**:
   - Complete registration flow
   - Institution admin workflows
   - Collaboration scenarios

## Security Considerations

1. **IP Spoofing Prevention**: Validate IP sources, use trusted headers only
2. **Domain Verification**: Require DNS or email verification
3. **Cross-Institution Data**: Ensure proper isolation and permissions
4. **Audit Trails**: Log all sensitive operations
5. **Rate Limiting**: Prevent abuse of verification systems

## Performance Considerations

1. **Caching**: Cache institution data, IP ranges, domain lists
2. **Indexing**: Add database indexes on institution lookups
3. **Lazy Loading**: Load institution details only when needed
4. **Batch Operations**: Optimize bulk member operations

## Future Enhancements

1. **SSO Integration**: Support SAML/OAuth for institutional SSO
2. **Federation**: Allow institution groups/consortiums
3. **Resource Sharing**: Institution-level resource pools
4. **Billing**: Per-institution billing and quotas
5. **White-labeling**: Institution-specific branding

---

## Quick Reference: Key Concepts

### Dual-Institution Model Summary

| Aspect | Primary Institution | Secondary Institution |
|--------|-------------------|---------------------|
| **Source** | ORCID profile | Email domain verification |
| **Purpose** | Academic affiliation | Operational affiliation |
| **Verification** | Not required | **REQUIRED** (email domain) |
| **Storage** | String field | Foreign key (Institution table) |
| **Changeable** | Via ORCID update | Yes, with history tracking |
| **Access Control** | Display only | **Controls all permissions** |
| **Required For** | Researchers only | **All account types** |

### Registration Flow Summary

**Researchers (with ORCID):**
1. Select account type
2. Search ORCID → Get Primary Institution
3. Account details (no email yet)
4. **NEW**: Email + Secondary Institution (auto-detected from domain)
5. Password

**Non-Researchers (no ORCID required):**
1. Select account type
2. **NEW**: Email + Secondary Institution (auto-detected from domain)
3. Password
4. (Can add ORCID later)

### Email Domain Validation

- Email domain **MUST** match a verified domain in the system
- Institution is **auto-selected** based on email domain
- No manual institution selection (prevents fraud)
- If domain not found → registration blocked (or flagged for review)

### Institution Change Process

1. User requests change from profile
2. Enters new institutional email
3. System validates domain
4. Admin approval (if required by institution)
5. History record created
6. Old affiliation end-dated
7. New affiliation becomes active

### Cross-Institution Collaboration

- **External Collaboration**: When collaborators have different Secondary institutions
- **Stationed Researcher**: When user's Primary ≠ Secondary institution
- Permissions based on **Secondary institution only**
- Both institutions visible in UI for context
