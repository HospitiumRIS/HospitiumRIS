# HospitiumRIS - Multi-Tenant SaaS Architecture Guide

**Date**: January 23, 2026  
**Version**: 1.0  
**Author**: System Architecture Review

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Application Review Summary](#application-review-summary)
3. [Multi-Tenant Architecture](#multi-tenant-architecture)
4. [Implementation Guide](#implementation-guide)
5. [Security Considerations](#security-considerations)
6. [Deployment Strategy](#deployment-strategy)
7. [Migration Path](#migration-path)
8. [Appendix](#appendix)

---

## Executive Summary

HospitiumRIS is a comprehensive Research Information System designed for researchers, institutions, and funding foundations. This document outlines:

1. **Application Review**: Comprehensive analysis of current architecture, strengths, and areas for improvement
2. **SaaS Architecture**: Multi-tenant design where frontend is centrally hosted but each client maintains their own database for data security and compliance

### Key Architecture Decision

**Deployment Model**: Database-per-Tenant
- **Frontend**: Centrally hosted by your organization
- **Database**: Each client hosts their own PostgreSQL instance
- **Tenant Identification**: Subdomain-based routing
- **Data Isolation**: Complete separation at database level

---

## Application Review Summary

### Current Technology Stack

- **Framework**: Next.js 16 with App Router
- **Frontend**: React 19, Material UI 7
- **Database**: PostgreSQL with Prisma ORM
- **Editor**: TipTap rich text editor
- **Visualization**: D3.js, Chart.js, React Force Graph
- **Authentication**: Cookie-based sessions with ORCID integration

### Core Features

#### 1. Publication Management
- Import from PubMed, CrossRef, OpenAlex, Research4Life
- Support for BibTeX, RIS, Mendeley formats
- Hierarchical folder organization
- Citation formatting (APA, MLA, Chicago, Vancouver)

#### 2. Manuscript Collaboration
- Real-time collaborative editing with TipTap
- Role-based permissions (Owner, Admin, Editor, Contributor, Reviewer)
- Track changes with accept/reject workflow
- Version history and snapshots
- Threaded comments and inline suggestions
- ORCID-based collaborator invitations

#### 3. Research Proposals
- Structured proposal templates
- Ethics approval tracking
- Milestone and deliverable management
- Budget tracking
- Multi-investigator support
- Link publications and manuscripts

#### 4. Grant & Campaign Management
- Track funding opportunities
- Manage fundraising campaigns
- Donation tracking and analytics
- Campaign activity logging

### Application Workflows

#### Researcher Workflow
```
Registration (ORCID/Email) 
    ↓
Email Verification
    ↓
Profile Setup
    ↓
┌─────────────────────────────────────┐
│ Import Publications                 │
│ - PubMed, CrossRef, OpenAlex       │
│ - BibTeX, RIS, Mendeley            │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Organize in Folders                 │
│ - Hierarchical structure            │
│ - Custom categorization             │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Create Manuscripts                  │
│ - Invite collaborators              │
│ - Real-time editing                 │
│ - Track changes                     │
│ - Version control                   │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Create Proposals                    │
│ - Link publications/manuscripts     │
│ - Track ethics approvals            │
│ - Manage milestones                 │
└─────────────────────────────────────┘
```

#### Institution Admin Workflow
```
Registration & Verification
    ↓
Institution Setup
    ↓
Manage Researchers
    ↓
View Analytics
    ↓
Track Compliance
```

#### Foundation Admin Workflow
```
Registration & Verification
    ↓
Foundation Setup
    ↓
Create Campaigns
    ↓
Manage Grants
    ↓
Track Donations
    ↓
View Analytics
```

### Strengths

✅ **Modern Architecture**: Next.js 16, React 19, latest dependencies  
✅ **Comprehensive Features**: Publication management, collaboration, proposals  
✅ **Well-designed Database**: Proper relations, comprehensive models  
✅ **Multiple Integrations**: ORCID, Zotero, PubMed, CrossRef, OpenAlex  
✅ **Rich Editor**: TipTap with extensive formatting  
✅ **Activity Logging**: Comprehensive logging system  
✅ **Role-based Access**: Flexible AccountType system  

### Critical Issues Identified

#### 🚨 Security (HIGH PRIORITY)

1. **Weak Session Management**
   - User ID stored directly in cookie (predictable)
   - No session rotation
   - No CSRF protection
   - No rate limiting

2. **Missing Route Protection**
   - No middleware.js for route protection
   - Inconsistent API authorization

3. **Input Validation**
   - No validation library (Zod, Yup, Joi)
   - Potential injection vulnerabilities

#### ⚡ Performance

1. **Missing Database Indexes**
   - No indexes on frequently queried fields
   - Potential slow queries on large datasets

2. **N+1 Query Problems**
   - Missing Prisma includes in some endpoints
   - Inefficient data fetching

3. **No Pagination**
   - Large datasets loaded without pagination
   - Memory and performance issues

#### 🔧 Code Quality

1. **Large Component Files**
   - Some components exceed 1000+ lines
   - Difficult to maintain

2. **Duplicate Code**
   - Similar patterns across API routes
   - No reusable utilities

3. **Inconsistent Error Handling**
   - Different error response formats
   - No standardized error handler

4. **No Testing**
   - No unit, integration, or E2E tests
   - Risk of regressions

### Priority Recommendations

#### Immediate (Week 1)
1. Add route protection middleware
2. Implement secure session tokens
3. Add CSRF protection
4. Add rate limiting
5. Add database indexes

#### Short-term (Month 1)
6. Implement input validation with Zod
7. Add pagination to list endpoints
8. Standardize error handling
9. Add React Error Boundaries
10. Optimize Next.js configuration

#### Medium-term (Quarter 1)
11. Add comprehensive testing
12. Complete API documentation
13. Implement code splitting
14. Refactor large components
15. Add monitoring (Sentry, LogRocket)

#### Long-term (Ongoing)
16. Consider NextAuth.js migration
17. Implement WebSocket for real-time collaboration
18. Add Redis caching
19. Implement full-text search
20. Automated backup system

---

## Multi-Tenant Architecture

### Architecture Overview

```
┌─────────────────────────────────────────┐
│   Your Organization (Centralized)      │
│  ┌───────────────────────────────┐     │
│  │  Next.js Frontend Application │     │
│  │  (Single Deployment)          │     │
│  └───────────────────────────────┘     │
│              ↓                          │
│  ┌───────────────────────────────┐     │
│  │  Tenant Registry Database     │     │
│  │  (Stores tenant configs)      │     │
│  └───────────────────────────────┘     │
└─────────────────────────────────────────┘
              ↓ ↓ ↓
    ┌─────────┴──┴──────────┐
    ↓            ↓           ↓
┌─────────┐  ┌─────────┐  ┌─────────┐
│Client A │  │Client B │  │Client C │
│Database │  │Database │  │Database │
│(Their   │  │(Their   │  │(Their   │
│ infra)  │  │ infra)  │  │ infra)  │
└─────────┘  └─────────┘  └─────────┘
```

### Tenant Identification Strategies

#### Option 1: Subdomain-based (Recommended)
```
client-a.hospitiumris.com → Client A's database
client-b.hospitiumris.com → Client B's database
client-c.hospitiumris.com → Client C's database
```

**Pros**:
- Clean separation
- Easy to implement
- Standard practice
- SSL wildcard certificate support

**Cons**:
- Requires DNS configuration
- Subdomain management

#### Option 2: Path-based
```
hospitiumris.com/client-a → Client A's database
hospitiumris.com/client-b → Client B's database
```

**Pros**:
- Single domain
- Simpler DNS

**Cons**:
- URL complexity
- Routing complexity

#### Option 3: Custom Domain (CNAME)
```
research.clienta.com → Client A's database
ris.clientb.org → Client B's database
```

**Pros**:
- Client branding
- Professional appearance

**Cons**:
- SSL certificate management
- DNS complexity

### Database-per-Tenant Benefits

✅ **Complete Data Isolation**: Each client's data in separate database  
✅ **Compliance**: Meets data residency requirements  
✅ **Scalability**: Each client can scale independently  
✅ **Customization**: Per-tenant features and configurations  
✅ **Security**: Database breach affects only one tenant  
✅ **Performance**: No cross-tenant query overhead  
✅ **Backup/Restore**: Independent per client  
✅ **Client Control**: Clients can manage their own database  

### Considerations

⚠️ **Connection Pool Management**: Monitor connection limits  
⚠️ **Schema Migrations**: Must run on all tenant databases  
⚠️ **Cost**: More infrastructure than shared database  
⚠️ **Complexity**: More moving parts to manage  
⚠️ **Monitoring**: Need to monitor multiple databases  

---

## Implementation Guide

### 1. Tenant Registry System

Create a centralized registry to store tenant configurations:

```javascript
// lib/tenants/tenantRegistry.js
/**
 * Tenant Registry - Stores connection info for each tenant
 * In production, this should be in a secure database or vault
 */

const TENANT_CONFIGS = {
  'client-a': {
    id: 'client-a',
    name: 'Research Hospital A',
    databaseUrl: process.env.CLIENT_A_DATABASE_URL,
    features: ['manuscripts', 'proposals', 'publications'],
    maxUsers: 100,
    status: 'active'
  },
  'client-b': {
    id: 'client-b',
    name: 'University B',
    databaseUrl: process.env.CLIENT_B_DATABASE_URL,
    features: ['manuscripts', 'proposals', 'publications', 'grants'],
    maxUsers: 500,
    status: 'active'
  },
};

export function getTenantConfig(tenantId) {
  const config = TENANT_CONFIGS[tenantId];
  if (!config || config.status !== 'active') {
    throw new Error(`Tenant ${tenantId} not found or inactive`);
  }
  return config;
}

export function getAllTenants() {
  return Object.values(TENANT_CONFIGS).filter(t => t.status === 'active');
}
```

### 2. Tenant Identification Middleware

Create `middleware.js` at project root:

```javascript
// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Extract tenant ID from subdomain
  const tenantId = extractTenantFromHostname(hostname);
  
  // Skip tenant check for public routes
  const publicRoutes = ['/', '/login', '/register', '/about', '/api/health'];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Validate tenant exists
  if (!tenantId) {
    return NextResponse.redirect(new URL('/tenant-not-found', request.url));
  }
  
  // Add tenant ID to request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', tenantId);
  
  // Check session and tenant association
  const session = request.cookies.get('hospitium_session');
  const sessionTenant = request.cookies.get('hospitium_tenant');
  
  // Protected routes require authentication
  const protectedRoutes = ['/researcher', '/institution', '/foundation', '/super-admin'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Verify user belongs to this tenant
    if (sessionTenant?.value !== tenantId) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

function extractTenantFromHostname(hostname) {
  const host = hostname.split(':')[0];
  
  // For subdomain approach: client-a.hospitiumris.com
  const parts = host.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  
  // For localhost development
  if (host === 'localhost' || host === '127.0.0.1') {
    return process.env.DEV_TENANT_ID || 'dev-tenant';
  }
  
  return null;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

### 3. Multi-Tenant Prisma Client

```javascript
// lib/prisma-multi-tenant.js
import { PrismaClient } from '@prisma/client';
import { getTenantConfig } from './tenants/tenantRegistry';

// Connection pool for tenant databases
const tenantClients = new Map();

/**
 * Get Prisma client for a specific tenant
 * Implements connection pooling to reuse connections
 */
export function getPrismaClient(tenantId) {
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  
  // Return existing client if already connected
  if (tenantClients.has(tenantId)) {
    return tenantClients.get(tenantId);
  }
  
  // Get tenant configuration
  const tenantConfig = getTenantConfig(tenantId);
  
  if (!tenantConfig.databaseUrl) {
    throw new Error(`Database URL not configured for tenant: ${tenantId}`);
  }
  
  // Create new Prisma client for this tenant
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: tenantConfig.databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  
  // Store in connection pool
  tenantClients.set(tenantId, prisma);
  
  return prisma;
}

/**
 * Get tenant ID from request headers
 */
export function getTenantIdFromRequest(request) {
  const tenantId = request.headers.get('x-tenant-id');
  
  if (!tenantId) {
    throw new Error('Tenant ID not found in request');
  }
  
  return tenantId;
}

/**
 * Disconnect all tenant database connections
 */
export async function disconnectAll() {
  const disconnectPromises = Array.from(tenantClients.values()).map(
    client => client.$disconnect()
  );
  
  await Promise.all(disconnectPromises);
  tenantClients.clear();
}

// Handle graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await disconnectAll();
  });
}
```

### 4. Updated API Route Pattern

Example of how to update existing API routes:

```javascript
// src/app/api/publications/route.js
import { NextResponse } from 'next/server';
import { getPrismaClient, getTenantIdFromRequest } from '@/lib/prisma-multi-tenant';
import { requireAuth } from '@/lib/auth-server';

export async function GET(request) {
  try {
    // Get authenticated user
    const { user, error } = await requireAuth(request);
    if (error) return error;
    
    // Get tenant ID from request
    const tenantId = getTenantIdFromRequest(request);
    
    // Get tenant-specific Prisma client
    const prisma = getPrismaClient(tenantId);
    
    // Query tenant's database
    const publications = await prisma.publication.findMany({
      where: {
        authorRelations: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        authorRelations: {
          include: {
            user: {
              select: {
                id: true,
                givenName: true,
                familyName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({
      success: true,
      publications,
      tenant: tenantId
    });
    
  } catch (error) {
    console.error('Error fetching publications:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;
    
    const tenantId = getTenantIdFromRequest(request);
    const prisma = getPrismaClient(tenantId);
    
    const body = await request.json();
    
    // Create publication in tenant's database
    const publication = await prisma.publication.create({
      data: {
        ...body,
        authorRelations: {
          create: {
            userId: user.id,
            authorOrder: 1,
            isCorresponding: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      publication
    });
    
  } catch (error) {
    console.error('Error creating publication:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### 5. Updated Authentication

Update login to associate users with tenants:

```javascript
// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { getPrismaClient, getTenantIdFromRequest } from '@/lib/prisma-multi-tenant';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const tenantId = getTenantIdFromRequest(request);
    const prisma = getPrismaClient(tenantId);
    
    const { email, password, rememberMe } = await request.json();
    
    // Find user in tenant's database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        institution: true,
        foundation: true,
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Check user status
    if (!user.emailVerified || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'Account not active' },
        { status: 403 }
      );
    }
    
    // Determine dashboard route
    let dashboardRoute = '/researcher';
    switch (user.accountType) {
      case 'RESEARCHER': dashboardRoute = '/researcher'; break;
      case 'RESEARCH_ADMIN': dashboardRoute = '/institution'; break;
      case 'FOUNDATION_ADMIN': dashboardRoute = '/foundation'; break;
      case 'SUPER_ADMIN': dashboardRoute = '/super-admin'; break;
    }
    
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        givenName: user.givenName,
        familyName: user.familyName,
        accountType: user.accountType,
      },
      dashboardRoute,
      tenant: tenantId
    });
    
    // Set session cookie
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : undefined;
    
    response.cookies.set('hospitium_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge
    });
    
    // Set tenant cookie to verify user belongs to this tenant
    response.cookies.set('hospitium_tenant', tenantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge
    });
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 6. Environment Configuration

```env
# .env.example

# Central tenant registry database (your organization)
TENANT_REGISTRY_DATABASE_URL="postgresql://user:pass@your-server:5432/tenant_registry"

# Client database connections
CLIENT_A_DATABASE_URL="postgresql://user:pass@client-a-server:5432/hospitiumris"
CLIENT_B_DATABASE_URL="postgresql://user:pass@client-b-server:5432/hospitiumris"
CLIENT_C_DATABASE_URL="postgresql://user:pass@client-c-server:5432/hospitiumris"

# For local development
DEV_TENANT_ID="dev-tenant"
DEV_DATABASE_URL="postgresql://user:pass@localhost:5432/hospitiumris_dev"

# Application settings
NEXTAUTH_SECRET="your-secret-key-at-least-32-characters"
NEXT_PUBLIC_APP_URL="https://hospitiumris.com"

# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="HospitiumRIS <your-email@gmail.com>"

# ORCID (optional)
NEXT_PUBLIC_ORCID_CLIENT_ID="your-client-id"
ORCID_CLIENT_SECRET="your-client-secret"
NEXT_PUBLIC_ORCID_REDIRECT_URI="http://localhost:3000/auth/orcid/callback"
```

### 7. Tenant Provisioning System

```javascript
// src/app/api/admin/tenants/provision/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

/**
 * Provision a new tenant
 * Protected endpoint - only accessible by super admins
 */
export async function POST(request) {
  try {
    const { tenantId, name, databaseUrl, features, maxUsers } = await request.json();
    
    // Validate input
    if (!tenantId || !name || !databaseUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // 1. Test database connection
    const testPrisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } }
    });
    
    try {
      await testPrisma.$connect();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Cannot connect to database' },
        { status: 400 }
      );
    }
    
    // 2. Run migrations on tenant database
    try {
      execSync(`DATABASE_URL="${databaseUrl}" npx prisma migrate deploy`, {
        stdio: 'inherit'
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Migration failed' },
        { status: 500 }
      );
    }
    
    // 3. Seed initial data
    try {
      await seedTenantDatabase(testPrisma);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Seeding failed' },
        { status: 500 }
      );
    }
    
    await testPrisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      message: 'Tenant provisioned successfully',
      tenant: {
        id: tenantId,
        name,
        status: 'active'
      }
    });
    
  } catch (error) {
    console.error('Tenant provisioning error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function seedTenantDatabase(prisma) {
  // Seed account types
  const accountTypes = [
    {
      name: 'RESEARCHER',
      displayName: 'Researcher',
      description: 'Individual researcher account',
      permissions: ['read_publications', 'write_publications', 'collaborate'],
      isSystem: true
    },
    {
      name: 'RESEARCH_ADMIN',
      displayName: 'Research Administrator',
      description: 'Institutional research administrator',
      permissions: ['read_all', 'manage_users', 'view_analytics'],
      isSystem: true
    },
    {
      name: 'FOUNDATION_ADMIN',
      displayName: 'Foundation Administrator',
      description: 'Foundation administrator account',
      permissions: ['manage_grants', 'manage_campaigns', 'view_analytics'],
      isSystem: true
    },
    {
      name: 'SUPER_ADMIN',
      displayName: 'Super Administrator',
      description: 'System administrator with full access',
      permissions: ['full_access'],
      isSystem: true
    }
  ];
  
  for (const accountType of accountTypes) {
    await prisma.accountType.upsert({
      where: { name: accountType.name },
      update: {},
      create: accountType
    });
  }
}
```

---

## Security Considerations

### 1. Secure Database Connection Management

**Option A: Environment Variables (Basic)**
```env
CLIENT_A_DATABASE_URL="postgresql://user:pass@host:5432/db"
```

**Option B: AWS Secrets Manager (Recommended)**
```javascript
// lib/tenants/secretManager.js
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });

export async function getTenantDatabaseUrl(tenantId) {
  const command = new GetSecretValueCommand({
    SecretId: `hospitiumris/tenant/${tenantId}/database-url`
  });
  
  const response = await client.send(command);
  return response.SecretString;
}
```

**Option C: Azure Key Vault**
```javascript
import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

const credential = new DefaultAzureCredential();
const vaultUrl = "https://your-vault.vault.azure.net";
const client = new SecretClient(vaultUrl, credential);

export async function getTenantDatabaseUrl(tenantId) {
  const secret = await client.getSecret(`tenant-${tenantId}-db-url`);
  return secret.value;
}
```

### 2. Tenant Isolation Verification

```javascript
// lib/tenants/isolation.js

/**
 * Verify user can only access their tenant's data
 */
export function verifyTenantIsolation(user, tenantId) {
  if (user.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation detected');
  }
}

/**
 * Audit log for tenant access
 */
export async function logTenantAccess(userId, tenantId, action, resource) {
  // Log to audit trail
  await prisma.auditLog.create({
    data: {
      userId,
      tenantId,
      action,
      resource,
      timestamp: new Date(),
      ipAddress: getClientIp(),
    }
  });
}
```

### 3. Rate Limiting per Tenant

```javascript
// lib/rateLimit.js
import { LRUCache } from 'lru-cache';

const rateLimiters = new Map();

export function getRateLimiter(tenantId) {
  if (!rateLimiters.has(tenantId)) {
    rateLimiters.set(tenantId, new LRUCache({
      max: 500,
      ttl: 60000, // 1 minute
    }));
  }
  return rateLimiters.get(tenantId);
}

export async function checkRateLimit(tenantId, identifier) {
  const limiter = getRateLimiter(tenantId);
  const key = `${tenantId}:${identifier}`;
  
  const current = limiter.get(key) || 0;
  
  if (current >= 100) { // 100 requests per minute
    throw new Error('Rate limit exceeded');
  }
  
  limiter.set(key, current + 1);
}
```

### 4. CSRF Protection

```javascript
// lib/csrf.js
import { randomBytes } from 'crypto';

export function generateCsrfToken() {
  return randomBytes(32).toString('hex');
}

export function verifyCsrfToken(token, sessionToken) {
  return token === sessionToken;
}

// In API routes
export async function POST(request) {
  const csrfToken = request.headers.get('x-csrf-token');
  const sessionCsrf = request.cookies.get('csrf_token');
  
  if (!verifyCsrfToken(csrfToken, sessionCsrf?.value)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
  
  // Continue with request
}
```

### 5. Secure Session Tokens

Replace simple user ID with cryptographically secure tokens:

```javascript
// lib/session.js
import { randomBytes } from 'crypto';
import { getPrismaClient } from './prisma-multi-tenant';

export function generateSessionToken() {
  return randomBytes(32).toString('hex');
}

export async function createSession(userId, tenantId, rememberMe = false) {
  const prisma = getPrismaClient(tenantId);
  const token = generateSessionToken();
  const expiresAt = new Date();
  
  if (rememberMe) {
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
  } else {
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours
  }
  
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
      createdAt: new Date(),
    }
  });
  
  return token;
}

export async function validateSession(token, tenantId) {
  const prisma = getPrismaClient(tenantId);
  
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });
  
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  
  return session.user;
}
```

Add Session model to Prisma schema:

```prisma
model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([userId])
  @@map("sessions")
}
```

---

## Deployment Strategy

### Client-Side Database Deployment

Each client deploys their own PostgreSQL instance:

```yaml
# docker-compose.yml (for client deployment)
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: hospitiumris
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    networks:
      - client_network
    restart: unless-stopped

  # Optional: PgAdmin for database management
  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@client.com
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
    ports:
      - "5050:80"
    networks:
      - client_network
    restart: unless-stopped

  # Optional: Automated backups
  postgres-backup:
    image: prodrigestivill/postgres-backup-local
    environment:
      POSTGRES_HOST: postgres
      POSTGRES_DB: hospitiumris
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      SCHEDULE: "@daily"
      BACKUP_KEEP_DAYS: 30
    volumes:
      - ./backups:/backups
    networks:
      - client_network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  client_network:
    driver: bridge
```

### Central Frontend Deployment

Deploy Next.js application centrally:

```yaml
# docker-compose.yml (your organization)
version: '3.8'

services:
  nextjs:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - TENANT_REGISTRY_DATABASE_URL=${TENANT_REGISTRY_DATABASE_URL}
    env_file:
      - .env.production
    restart: unless-stopped
    networks:
      - app_network

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - nextjs
    networks:
      - app_network
    restart: unless-stopped

networks:
  app_network:
    driver: bridge
```

### Nginx Configuration for Multi-Tenant

```nginx
# nginx.conf
http {
  # Wildcard SSL certificate for *.hospitiumris.com
  ssl_certificate /etc/nginx/ssl/wildcard.crt;
  ssl_certificate_key /etc/nginx/ssl/wildcard.key;

  # Rate limiting
  limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
  limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

  server {
    listen 80;
    server_name *.hospitiumris.com;
    return 301 https://$host$request_uri;
  }

  server {
    listen 443 ssl http2;
    server_name *.hospitiumris.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req zone=general burst=20 nodelay;

    location /api/auth/login {
      limit_req zone=login burst=3 nodelay;
      proxy_pass http://nextjs:3000;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
      proxy_pass http://nextjs:3000;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
}
```

### Production Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

---

## Migration Path

### Phase 1: Preparation (Week 1-2)

**Tasks**:
1. ✅ Create tenant registry system
2. ✅ Implement middleware for tenant identification
3. ✅ Create multi-tenant Prisma client
4. ✅ Update authentication to include tenant association
5. ✅ Add Session model to Prisma schema
6. ✅ Implement secure session tokens

**Deliverables**:
- `lib/tenants/tenantRegistry.js`
- `middleware.js`
- `lib/prisma-multi-tenant.js`
- Updated authentication routes
- Migration scripts

### Phase 2: API Route Updates (Week 3-4)

**Tasks**:
1. ✅ Update all API routes to use multi-tenant Prisma client
2. ✅ Add tenant ID extraction from requests
3. ✅ Implement tenant isolation verification
4. ✅ Add comprehensive error handling
5. ✅ Add input validation with Zod

**Deliverables**:
- Updated API routes
- Validation schemas
- Error handling utilities

### Phase 3: Testing (Week 5-6)

**Tasks**:
1. ✅ Set up test tenants with separate databases
2. ✅ Test data isolation between tenants
3. ✅ Performance testing with multiple tenants
4. ✅ Security audit and penetration testing
5. ✅ Load testing

**Deliverables**:
- Test suite
- Performance benchmarks
- Security audit report

### Phase 4: Infrastructure Setup (Week 7-8)

**Tasks**:
1. ✅ Set up DNS for subdomain routing
2. ✅ Configure SSL wildcard certificate
3. ✅ Deploy Nginx reverse proxy
4. ✅ Set up monitoring and logging
5. ✅ Configure automated backups

**Deliverables**:
- Production infrastructure
- Monitoring dashboards
- Backup procedures

### Phase 5: Pilot Deployment (Week 9-10)

**Tasks**:
1. ✅ Provision first production tenant
2. ✅ Migrate existing data (if any)
3. ✅ User acceptance testing
4. ✅ Monitor performance and issues
5. ✅ Gather feedback

**Deliverables**:
- Production tenant
- Migration documentation
- Feedback report

### Phase 6: Full Rollout (Week 11+)

**Tasks**:
1. ✅ Onboard additional tenants
2. ✅ Continuous monitoring and optimization
3. ✅ Regular security updates
4. ✅ Feature enhancements based on feedback

**Deliverables**:
- Multiple production tenants
- Ongoing support and maintenance

---

## Monitoring & Observability

### Application Monitoring

```javascript
// lib/monitoring.js
import * as Sentry from "@sentry/nextjs";

export function initMonitoring() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    beforeSend(event, hint) {
      // Add tenant context
      if (event.request?.headers?.['x-tenant-id']) {
        event.tags = {
          ...event.tags,
          tenant: event.request.headers['x-tenant-id']
        };
      }
      return event;
    }
  });
}
```

### Database Monitoring

```javascript
// lib/dbMonitoring.js
export async function monitorDatabaseHealth(tenantId) {
  const prisma = getPrismaClient(tenantId);
  
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;
    
    // Log metrics
    console.log(`[${tenantId}] Database health check: ${duration}ms`);
    
    return { healthy: true, latency: duration };
  } catch (error) {
    console.error(`[${tenantId}] Database health check failed:`, error);
    return { healthy: false, error: error.message };
  }
}
```

### Tenant Metrics Dashboard

```javascript
// src/app/api/admin/metrics/route.js
export async function GET(request) {
  const metrics = {};
  
  for (const tenant of getAllTenants()) {
    const prisma = getPrismaClient(tenant.id);
    
    metrics[tenant.id] = {
      users: await prisma.user.count(),
      publications: await prisma.publication.count(),
      manuscripts: await prisma.manuscript.count(),
      proposals: await prisma.proposal.count(),
      storage: await calculateStorageUsage(tenant.id),
      health: await monitorDatabaseHealth(tenant.id)
    };
  }
  
  return NextResponse.json({ metrics });
}
```

---

## Appendix

### A. Database Schema Updates

Add these models to support multi-tenancy:

```prisma
// Add to schema.prisma

model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([userId])
  @@map("sessions")
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  tenantId   String
  action     String
  resource   String
  ipAddress  String?
  userAgent  String?
  metadata   Json?
  createdAt  DateTime @default(now())
  
  @@index([tenantId])
  @@index([userId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### B. Recommended Database Indexes

```prisma
// Update existing models with indexes

model User {
  // ... existing fields
  
  @@index([email])
  @@index([orcidId])
  @@index([status])
  @@index([accountType])
  @@index([createdAt])
}

model Publication {
  // ... existing fields
  
  @@index([doi])
  @@index([year])
  @@index([status])
  @@index([createdAt])
}

model Manuscript {
  // ... existing fields
  
  @@index([createdBy])
  @@index([status])
  @@index([createdAt])
}

model Proposal {
  // ... existing fields
  
  @@index([status])
  @@index([createdAt])
}
```

### C. Environment Variables Checklist

```env
# Required for all environments
DATABASE_URL=
NEXTAUTH_SECRET=
NEXT_PUBLIC_APP_URL=

# Tenant configurations
TENANT_REGISTRY_DATABASE_URL=
CLIENT_A_DATABASE_URL=
CLIENT_B_DATABASE_URL=

# SMTP
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=

# ORCID
NEXT_PUBLIC_ORCID_CLIENT_ID=
ORCID_CLIENT_SECRET=
NEXT_PUBLIC_ORCID_REDIRECT_URI=

# Optional: Monitoring
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Optional: Cloud secrets
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

### D. Tenant Onboarding Checklist

For each new tenant:

- [ ] Provision PostgreSQL database
- [ ] Configure database connection string
- [ ] Run Prisma migrations
- [ ] Seed initial data (account types)
- [ ] Configure subdomain DNS
- [ ] Update tenant registry
- [ ] Test database connectivity
- [ ] Create first admin user
- [ ] Verify tenant isolation
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Document access credentials

### E. Security Checklist

- [ ] Implement secure session tokens
- [ ] Add CSRF protection
- [ ] Enable rate limiting
- [ ] Add input validation (Zod)
- [ ] Implement database indexes
- [ ] Enable HTTPS only
- [ ] Configure security headers
- [ ] Set up WAF (Web Application Firewall)
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Penetration testing
- [ ] GDPR compliance review

### F. Performance Optimization Checklist

- [ ] Add database indexes
- [ ] Implement pagination
- [ ] Enable query optimization
- [ ] Add Redis caching
- [ ] Implement CDN for static assets
- [ ] Enable Next.js image optimization
- [ ] Code splitting and lazy loading
- [ ] Database connection pooling
- [ ] Optimize bundle size
- [ ] Enable compression

### G. Backup and Disaster Recovery

**Automated Backups**:
```bash
# Daily backup script
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U postgres hospitiumris > backup_$TIMESTAMP.sql
gzip backup_$TIMESTAMP.sql

# Upload to S3
aws s3 cp backup_$TIMESTAMP.sql.gz s3://hospitiumris-backups/
```

**Recovery Procedure**:
```bash
# Restore from backup
gunzip backup_20260123_120000.sql.gz
psql -h localhost -U postgres hospitiumris < backup_20260123_120000.sql
```

### H. Support and Maintenance

**Regular Tasks**:
- Daily: Monitor application health
- Weekly: Review error logs and metrics
- Monthly: Security updates and patches
- Quarterly: Performance optimization review
- Annually: Security audit and penetration testing

**Incident Response**:
1. Detect issue (monitoring alerts)
2. Assess impact (which tenants affected)
3. Isolate problem (tenant-specific or system-wide)
4. Implement fix
5. Verify resolution
6. Post-mortem analysis

---

## Conclusion

This multi-tenant SaaS architecture provides:

✅ **Complete data isolation** for each client  
✅ **Centralized frontend** management  
✅ **Scalable** infrastructure  
✅ **Secure** tenant separation  
✅ **Compliant** with data residency requirements  

The implementation is straightforward with the provided code examples and can be deployed incrementally following the migration path outlined above.

For questions or support, refer to the implementation guide sections or contact the development team.

---

**Document Version**: 1.0  
**Last Updated**: January 23, 2026  
**Next Review**: February 23, 2026
