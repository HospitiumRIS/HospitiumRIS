# HospitiumRIS Architecture & Deployment Documentation

## Overview
This document provides a comprehensive overview of the HospitiumRIS system architecture, including high-level architecture diagrams, system components, deployment strategies, and infrastructure requirements.

---

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Current Architecture Diagrams](#current-architecture-diagrams)
3. [System Components](#system-components)
4. [Architecture Type](#architecture-type)
5. [Network Topology](#network-topology)
6. [Deployment Architecture](#deployment-architecture)
7. [Infrastructure Requirements](#infrastructure-requirements)
8. [Security Architecture](#security-architecture)
9. [Scalability & Performance](#scalability--performance)
10. [Disaster Recovery & Backup](#disaster-recovery--backup)

---

## 1. High-Level Architecture

### System Overview

HospitiumRIS is a **multi-tenant research proposal and institutional review management system** built with modern web technologies. The system supports multiple institutions with isolated data and customizable workflows.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Client Layer                                  │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Web App    │  │   Mobile     │  │   Admin      │                  │
│  │  (Next.js)   │  │  Responsive  │  │   Portal     │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                 │                 │                            │
│         └─────────────────┴─────────────────┘                            │
│                           │                                               │
│                      HTTPS/TLS 1.3                                        │
└───────────────────────────┼───────────────────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────────────────┐
│                      Application Layer (Next.js 15)                        │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                    API Routes (Next.js App Router)                │    │
│  │                                                                    │    │
│  │  • /api/auth/*              - Authentication & authorization      │    │
│  │  • /api/proposals/*         - Proposal management                 │    │
│  │  • /api/reviews/*           - Review workflows                    │    │
│  │  • /api/institution/*       - Institution management              │    │
│  │  • /api/global-admin/*      - Global administration               │    │
│  │  • /api/integrations/*      - External system integrations        │    │
│  │  • /api/notifications/*     - Notification system                 │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                      Business Logic Layer                         │    │
│  │                                                                    │    │
│  │  • Authentication Service    • Proposal Service                   │    │
│  │  • Authorization Service     • Review Service                     │    │
│  │  • Notification Service      • Integration Services               │    │
│  │  • Activity Logger           • File Upload Service                │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬───────────────────────────────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────────────────────────┐
│                         Data Layer                                          │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │   PostgreSQL    │  │   File Storage  │  │   Redis Cache   │           │
│  │   (Prisma ORM)  │  │   (Local/S3)    │  │   (Optional)    │           │
│  │                 │  │                 │  │                 │           │
│  │ • Users         │  │ • Uploads       │  │ • Sessions      │           │
│  │ • Institutions  │  │ • Documents     │  │ • API Cache     │           │
│  │ • Proposals     │  │ • Attachments   │  │ • Pub Data      │           │
│  │ • Reviews       │  │ • Logs          │  │                 │           │
│  │ • Notifications │  │                 │  │                 │           │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      External Integrations Layer                             │
│                                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  ORCID   │  │ OpenAlex │  │  PubMed  │  │ Crossref │  │  Zotero  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                                               │
│  ┌──────────┐  ┌──────────────────────────────────────────────────────┐    │
│  │ Mendeley │  │  Email Service (SMTP/SendGrid/AWS SES)               │    │
│  └──────────┘  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Current Architecture Diagrams

### Existing System Architecture

**Current State:** HospitiumRIS is built as a **monolithic Next.js application** with the following characteristics:

#### Technology Stack
- **Frontend Framework**: Next.js 15 (App Router)
- **UI Library**: Material-UI (MUI) v6
- **Language**: JavaScript (ES6+)
- **Styling**: MUI theming system
- **State Management**: React hooks, Context API

#### Backend Stack
- **Framework**: Next.js API Routes (serverless functions)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: Custom JWT-based authentication
- **Session Management**: Server-side sessions

#### Current Architecture Type
**Monolithic with modular structure**
- Single deployable unit
- Shared database
- Integrated frontend and backend
- API routes within the same application

### Architecture Evolution Path

```
Current State (v1.0)          Future State (v2.0)         Long-term (v3.0)
─────────────────────         ───────────────────         ────────────────
Monolithic Next.js      →     Modular Monolith      →     Microservices
Single Database               Multi-tenant DB             Service DBs
Local File Storage            Cloud Storage (S3)          CDN + Object Storage
No Caching                    Redis Cache                 Distributed Cache
Single Server                 Load Balanced               Auto-scaling
```

---

## 3. System Components

### Major Components

#### 1. Frontend Layer

**Next.js Application (Client-Side)**
- **Location**: `src/app/` (App Router pages)
- **Components**: `src/components/`
- **Purpose**: User interface for all user types
- **Key Features**:
  - Server-side rendering (SSR)
  - Client-side navigation
  - Responsive design
  - Material-UI components
  - Role-based UI rendering

**Component Structure:**
```
src/
├── app/                          # Next.js App Router pages
│   ├── dashboard/                # User dashboard
│   ├── proposals/                # Proposal management
│   ├── reviews/                  # Review workflows
│   ├── institution/              # Institution admin
│   ├── global-admin/             # Global admin panel
│   └── api/                      # API routes (backend)
├── components/                   # Reusable UI components
│   ├── AuthProvider.js           # Authentication context
│   ├── Navbar.js                 # Navigation bar
│   ├── Footer.js                 # Footer component
│   ├── GlobalAdmin/              # Global admin components
│   └── Institution/              # Institution components
├── hooks/                        # Custom React hooks
│   └── useNotifications.js       # Notification hook
└── utils/                        # Utility functions
    ├── activityLogger.js         # Audit logging
    └── auth.js                   # Authentication helpers
```

#### 2. Backend Layer (API Services)

**Next.js API Routes**
- **Location**: `src/app/api/`
- **Purpose**: RESTful API endpoints
- **Authentication**: JWT-based with role checking
- **Logging**: Comprehensive activity logging

**API Structure:**
```
src/app/api/
├── auth/                         # Authentication endpoints
│   ├── login/route.js
│   ├── logout/route.js
│   └── register/route.js
├── proposals/                    # Proposal management
│   ├── route.js                  # List/create proposals
│   └── [id]/route.js             # Get/update/delete proposal
├── reviews/                      # Review workflows
│   ├── route.js
│   └── [id]/route.js
├── institution/                  # Institution admin APIs
│   ├── users/route.js
│   ├── settings/route.js
│   └── auto-review/              # Auto-review configuration
├── global-admin/                 # Global admin APIs
│   ├── institutions/route.js
│   ├── users/route.js
│   ├── logs/route.js
│   └── health/route.js
├── integrations/                 # External integrations
│   ├── orcid/route.js
│   ├── zotero/route.js
│   └── publications/route.js
└── notifications/                # Notification system
    ├── route.js
    └── [id]/route.js
```

#### 3. Database Layer

**PostgreSQL Database (via Prisma ORM)**
- **Location**: Configured in `prisma/schema.prisma`
- **Purpose**: Primary data storage
- **Features**:
  - Multi-tenant data isolation
  - Relational data model
  - Transaction support
  - Full-text search capabilities

**Key Tables:**
```
Database Schema (Simplified)
────────────────────────────
• User                    - User accounts (all types)
• Institution             - Institution/organization data
• Proposal                - Research proposals
• Review                  - Review records
• ReviewStage             - Review workflow stages
• Reviewer                - Reviewer assignments
• Notification            - User notifications
• ActivityLog             - Audit trail
• AutoReviewParameter     - Auto-review configuration
• Training                - Training/workshop records
```

#### 4. File Storage

**Current Implementation:**
- **Type**: Local file system
- **Location**: `public/uploads/` (development)
- **Purpose**: Store uploaded documents, attachments
- **Future**: Migrate to S3-compatible object storage

#### 5. Caching Layer (Optional)

**Redis Cache (Recommended for Production)**
- **Purpose**: 
  - Session storage
  - API response caching
  - Publication data caching
  - Rate limiting
- **Current Status**: Not implemented (planned)

#### 6. Integration Services

**External API Integration Layer**
- **Location**: `src/services/integrations/`
- **Purpose**: Connect to external research systems
- **Services**:
  - `orcid.service.js` - ORCID integration
  - `openalex.service.js` - OpenAlex integration
  - `pubmed.service.js` - PubMed integration
  - `crossref.service.js` - Crossref integration
  - `zotero.service.js` - Zotero integration (planned)
  - `mendeley.service.js` - Mendeley integration (planned)
  - `citation.service.js` - Citation file parsing (planned)

#### 7. Background Jobs (Planned)

**Scheduled Tasks**
- **Technology**: `node-cron` or `bull` (Redis-based)
- **Purpose**:
  - Daily publication updates
  - Weekly citation metrics refresh
  - Monthly analytics generation
  - Notification cleanup
  - Log rotation

#### 8. Logging & Monitoring

**Activity Logger**
- **Location**: `src/utils/activityLogger.js`
- **Purpose**: Comprehensive audit trail
- **Logs**:
  - API requests/responses
  - Authentication events
  - Database operations
  - Errors and exceptions
  - User actions
- **Output**: `logs/activity.log` (JSON lines)

---

## 4. Architecture Type

### Current: Modular Monolith

**Characteristics:**
- ✅ **Single Deployment Unit**: Entire application deployed as one
- ✅ **Shared Database**: All modules use the same PostgreSQL database
- ✅ **Integrated Frontend/Backend**: Next.js handles both
- ✅ **Modular Code Structure**: Well-organized by feature/domain
- ✅ **API-First Design**: Clear separation between UI and API

**Advantages:**
- Simpler deployment and operations
- Easier development and debugging
- Lower infrastructure costs
- Faster development velocity
- Atomic transactions across modules

**Disadvantages:**
- Scaling requires scaling entire application
- Tight coupling between modules
- Single point of failure
- Harder to adopt different technologies per module

### Future Consideration: Microservices

**When to Consider Microservices:**
- System handles 10,000+ concurrent users
- Need independent scaling of specific modules
- Different teams working on different modules
- Need for polyglot persistence (different DBs per service)
- Regulatory requirements for service isolation

**Potential Microservices Breakdown:**
```
Service 1: Authentication & Authorization
Service 2: Proposal Management
Service 3: Review Workflows
Service 4: Institution Management
Service 5: Integration Gateway
Service 6: Notification Service
Service 7: Analytics & Reporting
```

**Current Recommendation:** **Stay with Modular Monolith**
- Easier to maintain for current team size
- Sufficient for expected load (< 5,000 users)
- Can refactor to microservices later if needed

---

## 5. Network Topology

### Current Network Architecture

**Deployment Model: Single-Server Deployment**

```
                    Internet
                       │
                       │ HTTPS (443)
                       │
                ┌──────▼──────┐
                │   Firewall  │
                │   (Cloud)   │
                └──────┬──────┘
                       │
                ┌──────▼──────────────────────────┐
                │   Load Balancer (Optional)      │
                │   - SSL Termination             │
                │   - Health Checks               │
                └──────┬──────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐    ┌────▼────┐   ┌────▼────┐
   │ Web/App │    │ Web/App │   │ Web/App │
   │ Server  │    │ Server  │   │ Server  │
   │ (Node)  │    │ (Node)  │   │ (Node)  │
   └────┬────┘    └────┬────┘   └────┬────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
                ┌──────▼──────┐
                │  PostgreSQL │
                │   Database  │
                │   (Primary) │
                └──────┬──────┘
                       │
                ┌──────▼──────┐
                │  PostgreSQL │
                │  (Replica)  │
                │  Read-only  │
                └─────────────┘
```

### Network Connectivity

#### 1. **LAN (Local Area Network)**
- **Use Case**: Development and testing environment
- **Configuration**:
  - Application server: `localhost:3000`
  - Database server: `localhost:5432`
  - No external access
  - Fast, low-latency communication

#### 2. **VPN (Virtual Private Network)**
- **Use Case**: Secure remote access for administrators
- **Configuration**:
  - Admin access to production servers
  - Database administration
  - Log file access
  - Encrypted tunnels (OpenVPN, WireGuard)

#### 3. **Cloud (Public Internet)**
- **Use Case**: Production deployment
- **Configuration**:
  - Public-facing web application
  - HTTPS only (TLS 1.3)
  - CDN for static assets (optional)
  - DDoS protection
  - Geographic distribution (multi-region)

#### 4. **Hybrid Architecture**
- **Use Case**: Enterprise deployment
- **Configuration**:
  - Application servers in cloud (AWS, Azure, GCP)
  - Database in private cloud or on-premises
  - VPN tunnel between cloud and on-prem
  - Secure data residency compliance

### Network Security

**Firewall Rules:**
```
Inbound Rules:
- Port 443 (HTTPS): Allow from 0.0.0.0/0
- Port 80 (HTTP): Redirect to 443
- Port 22 (SSH): Allow from VPN IP range only
- Port 5432 (PostgreSQL): Allow from app servers only

Outbound Rules:
- Port 443 (HTTPS): Allow to external APIs (ORCID, PubMed, etc.)
- Port 587 (SMTP): Allow to email service
- Port 53 (DNS): Allow to DNS servers
```

**Network Segmentation:**
```
DMZ (Demilitarized Zone)
├── Load Balancer
└── Web/App Servers

Application Tier
├── Next.js Application Servers
└── Background Job Workers

Data Tier
├── PostgreSQL Primary
├── PostgreSQL Replica
└── Redis Cache

Management Tier (VPN Access Only)
├── Monitoring Dashboard
├── Log Aggregation
└── Backup Server
```

---

## 6. Deployment Architecture

### Deployment Options

#### Option 1: Traditional Server Deployment

**Infrastructure:**
- Virtual Private Server (VPS) or dedicated server
- Ubuntu 22.04 LTS or similar
- Node.js 20.x runtime
- PostgreSQL 15+
- Nginx as reverse proxy

**Deployment Process:**
```bash
# 1. Build application
npm run build

# 2. Start with PM2 (process manager)
pm2 start npm --name "hospitium-ris" -- start

# 3. Configure Nginx reverse proxy
# /etc/nginx/sites-available/hospitium-ris
server {
    listen 80;
    server_name hospitium.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hospitium.example.com;
    
    ssl_certificate /etc/letsencrypt/live/hospitium.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hospitium.example.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Pros:**
- Full control over infrastructure
- Predictable costs
- No vendor lock-in

**Cons:**
- Manual scaling
- Requires DevOps expertise
- Higher maintenance overhead

---

#### Option 2: Docker Containerization

**Docker Compose Setup:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/hospitiumris
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
      - redis
    restart: unless-stopped
    volumes:
      - ./uploads:/app/public/uploads
      - ./logs:/app/logs

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=hospitium
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=hospitiumris
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

**Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]
```

**Pros:**
- Consistent environments (dev/staging/prod)
- Easy to scale horizontally
- Portable across cloud providers
- Simplified dependency management

**Cons:**
- Requires Docker knowledge
- Slightly more complex setup
- Additional layer of abstraction

---

#### Option 3: Cloud Platform Deployment (Vercel/Netlify)

**Vercel Deployment (Recommended for Next.js):**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Configuration (vercel.json):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "DATABASE_URL": "@database-url",
    "JWT_SECRET": "@jwt-secret",
    "ORCID_CLIENT_ID": "@orcid-client-id",
    "ORCID_CLIENT_SECRET": "@orcid-client-secret"
  },
  "regions": ["iad1"]
}
```

**Pros:**
- Zero-config deployment
- Automatic SSL certificates
- Global CDN
- Serverless functions (API routes)
- Automatic scaling
- Preview deployments for PRs

**Cons:**
- Vendor lock-in
- Higher costs at scale
- Less control over infrastructure
- Cold start latency for serverless functions

---

#### Option 4: Cloud Infrastructure (AWS/Azure/GCP)

**AWS Deployment Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Route 53 (DNS)                       │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │              CloudFront (CDN)                           │ │
│  │              - SSL/TLS Termination                      │ │
│  │              - Static Asset Caching                     │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │         Application Load Balancer (ALB)                 │ │
│  │         - Health Checks                                 │ │
│  │         - SSL Termination                               │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│         ┌─────────────┼─────────────┐                       │
│         │             │             │                       │
│  ┌──────▼──────┐ ┌───▼──────┐ ┌───▼──────┐               │
│  │   ECS/EC2   │ │ ECS/EC2  │ │ ECS/EC2  │               │
│  │   (App 1)   │ │ (App 2)  │ │ (App 3)  │               │
│  │  Next.js    │ │ Next.js  │ │ Next.js  │               │
│  └──────┬──────┘ └───┬──────┘ └───┬──────┘               │
│         │            │            │                        │
│         └────────────┼────────────┘                        │
│                      │                                      │
│  ┌───────────────────▼──────────────────────────────────┐ │
│  │              RDS PostgreSQL                           │ │
│  │              - Multi-AZ Deployment                    │ │
│  │              - Automated Backups                      │ │
│  │              - Read Replicas                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              ElastiCache (Redis)                      │ │
│  │              - Session Storage                        │ │
│  │              - API Caching                            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              S3 Bucket                                │ │
│  │              - File Uploads                           │ │
│  │              - Static Assets                          │ │
│  │              - Backups                                │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**AWS Services Used:**
- **EC2/ECS**: Application hosting
- **RDS**: Managed PostgreSQL database
- **ElastiCache**: Redis caching
- **S3**: Object storage
- **CloudFront**: CDN
- **Route 53**: DNS management
- **ALB**: Load balancing
- **CloudWatch**: Monitoring and logging
- **Secrets Manager**: Secure credential storage
- **VPC**: Network isolation

**Pros:**
- Highly scalable
- Managed services reduce operational overhead
- Global infrastructure
- Enterprise-grade security
- Comprehensive monitoring and logging

**Cons:**
- Complex setup
- Higher costs
- Requires AWS expertise
- Potential vendor lock-in

---

### Recommended Deployment Strategy

**For Development:**
- Local development server (`npm run dev`)
- Local PostgreSQL database
- No caching layer

**For Staging:**
- Docker Compose deployment
- Separate staging database
- Redis caching enabled
- SSL certificates (Let's Encrypt)

**For Production (Small to Medium Scale):**
- **Option 1**: Traditional VPS with Docker
  - DigitalOcean Droplet / Linode / Hetzner
  - 4 CPU, 8GB RAM, 160GB SSD
  - Docker Compose orchestration
  - Nginx reverse proxy
  - PostgreSQL + Redis
  - Cost: ~$40-60/month

**For Production (Large Scale / Enterprise):**
- **Option 2**: AWS/Azure/GCP
  - Auto-scaling application servers
  - Managed database (RDS/Azure Database)
  - CDN for static assets
  - Multi-region deployment
  - Cost: $200-1000+/month (depending on scale)

---

## 7. Infrastructure Requirements

### Minimum Requirements (Development)

**Single Server:**
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Network**: 100 Mbps

**Software:**
- Node.js 20.x
- PostgreSQL 15+
- Git

---

### Recommended Requirements (Production - Small Scale)

**Application Server:**
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 80GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Network**: 1 Gbps

**Database Server:**
- **CPU**: 4 cores
- **RAM**: 16GB
- **Storage**: 200GB SSD (with auto-scaling)
- **Backup**: Daily automated backups

**Optional Cache Server (Redis):**
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD

**Total Monthly Cost Estimate:**
- VPS: $40-60/month
- Database: Included or $20/month (managed)
- Backups: $10/month
- **Total: ~$70-90/month**

---

### Enterprise Requirements (Production - Large Scale)

**Application Tier (Auto-scaling):**
- **Instances**: 3-10 (auto-scale based on load)
- **Per Instance**: 4 CPU, 8GB RAM
- **Load Balancer**: Application Load Balancer

**Database Tier:**
- **Primary**: 8 CPU, 32GB RAM, 500GB SSD
- **Read Replica**: 4 CPU, 16GB RAM, 500GB SSD
- **Backup**: Automated daily backups, 30-day retention

**Cache Tier:**
- **Redis Cluster**: 3 nodes, 4GB RAM each

**Storage:**
- **Object Storage**: S3 or equivalent (unlimited)
- **CDN**: CloudFront or equivalent

**Monitoring & Logging:**
- **CloudWatch/Datadog**: Metrics and logs
- **Sentry**: Error tracking

**Total Monthly Cost Estimate:**
- Compute: $200-400/month
- Database: $300-500/month
- Cache: $50-100/month
- Storage: $50-100/month
- CDN: $50-200/month
- Monitoring: $50-100/month
- **Total: ~$700-1400/month**

---

## 8. Security Architecture

### Security Layers

#### 1. Network Security

**Firewall Configuration:**
- Only ports 80 (HTTP) and 443 (HTTPS) exposed to internet
- SSH (port 22) restricted to VPN or specific IP ranges
- Database port (5432) not exposed to internet
- Internal services communicate via private network

**DDoS Protection:**
- CloudFlare or AWS Shield
- Rate limiting at load balancer level
- IP-based blocking for suspicious traffic

**SSL/TLS:**
- TLS 1.3 only
- Strong cipher suites
- HSTS (HTTP Strict Transport Security) enabled
- Certificate auto-renewal (Let's Encrypt)

---

#### 2. Application Security

**Authentication:**
- JWT-based authentication
- Secure password hashing (bcrypt, 10+ rounds)
- Session timeout (30 minutes inactivity)
- Multi-factor authentication (planned)

**Authorization:**
- Role-based access control (RBAC)
- Granular permissions per institution
- API endpoint authorization checks
- Resource-level access control

**Input Validation:**
- Server-side validation for all inputs
- SQL injection prevention (Prisma ORM)
- XSS protection (sanitize user inputs)
- CSRF protection (Next.js built-in)

**File Upload Security:**
- File type validation (whitelist)
- File size limits (10MB max)
- Virus scanning (ClamAV integration planned)
- Secure file storage (outside web root)
- Sanitize file names

---

#### 3. Data Security

**Encryption:**
- **At Rest**: Database encryption (PostgreSQL native encryption)
- **In Transit**: TLS 1.3 for all communications
- **Sensitive Fields**: Additional encryption for OAuth tokens, API keys

**Data Privacy:**
- GDPR compliance (for EU users)
- Data retention policies
- User consent management
- Right to delete (data erasure)

**Backup Security:**
- Encrypted backups
- Secure backup storage (separate location)
- Access control for backup restoration
- Regular backup testing

---

#### 4. API Security

**Rate Limiting:**
- Per-user rate limits (100 requests/minute)
- Per-IP rate limits (1000 requests/hour)
- Exponential backoff for failed attempts

**API Key Management:**
- Secure storage in environment variables
- Regular key rotation
- Separate keys for dev/staging/production

**Audit Logging:**
- All API calls logged (activityLogger)
- User actions tracked
- Failed authentication attempts logged
- Suspicious activity alerts

---

#### 5. Compliance & Standards

**Security Standards:**
- OWASP Top 10 compliance
- Regular security audits
- Penetration testing (annually)
- Vulnerability scanning

**Data Protection:**
- GDPR compliance (EU)
- Data residency requirements
- Privacy policy and terms of service
- User consent management

---

## 9. Scalability & Performance

### Horizontal Scaling

**Application Tier:**
```
Current: Single Server
─────────────────────
┌──────────────┐
│  Next.js App │
└──────────────┘

Scaled: Multiple Servers
────────────────────────
┌─────────────────┐
│ Load Balancer   │
└────────┬────────┘
         │
    ┌────┼────┬────┐
    │    │    │    │
┌───▼┐ ┌─▼─┐ ┌▼──┐ ┌▼──┐
│App1│ │App2│ │App3│ │App4│
└────┘ └───┘ └───┘ └───┘
```

**Scaling Triggers:**
- CPU usage > 70% for 5 minutes
- Memory usage > 80%
- Request queue depth > 100
- Response time > 2 seconds

---

### Vertical Scaling

**Database Scaling:**
```
Small:  2 CPU, 4GB RAM   (< 1,000 users)
Medium: 4 CPU, 16GB RAM  (1,000 - 5,000 users)
Large:  8 CPU, 32GB RAM  (5,000 - 20,000 users)
XLarge: 16 CPU, 64GB RAM (20,000+ users)
```

---

### Caching Strategy

**Multi-Level Caching:**

```
Level 1: Browser Cache
├── Static assets (CSS, JS, images)
└── Cache-Control headers

Level 2: CDN Cache (CloudFront)
├── Static assets
├── Public pages
└── API responses (short TTL)

Level 3: Application Cache (Redis)
├── Session data
├── User profiles
├── Publication data (7-day TTL)
├── API responses (1-hour TTL)
└── Database query results

Level 4: Database Cache
├── Query result cache
└── Prepared statements
```

**Cache Invalidation:**
- Time-based expiration (TTL)
- Event-based invalidation (on data update)
- Manual cache clearing (admin function)

---

### Performance Optimization

**Frontend Optimization:**
- Code splitting (Next.js automatic)
- Image optimization (Next.js Image component)
- Lazy loading for heavy components
- Minimize bundle size
- Server-side rendering for initial load

**Backend Optimization:**
- Database query optimization (indexes)
- N+1 query prevention (Prisma includes)
- Connection pooling
- Async/await for I/O operations
- Background jobs for heavy tasks

**Database Optimization:**
- Proper indexing strategy
- Query optimization (EXPLAIN ANALYZE)
- Materialized views for complex queries
- Partitioning for large tables
- Regular VACUUM and ANALYZE

---

### Performance Targets

**Response Time:**
- Page load: < 2 seconds (95th percentile)
- API response: < 500ms (95th percentile)
- Database query: < 100ms (average)

**Throughput:**
- 1,000 concurrent users
- 10,000 requests/minute
- 99.9% uptime

**Scalability:**
- Support up to 50,000 users
- Handle 100,000 proposals
- Store 1 million+ publications

---

## 10. Disaster Recovery & Backup

### Backup Strategy

#### 1. Database Backups

**Automated Daily Backups:**
```bash
# PostgreSQL backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="hospitiumris"

# Create backup
pg_dump -U postgres $DB_NAME | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Encrypt backup
gpg --encrypt --recipient admin@hospitium.com $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$TIMESTAMP.sql.gz.gpg s3://hospitium-backups/postgres/

# Delete local backups older than 7 days
find $BACKUP_DIR -name "backup_*.sql.gz*" -mtime +7 -delete
```

**Backup Schedule:**
- **Full Backup**: Daily at 2:00 AM UTC
- **Incremental Backup**: Every 6 hours
- **Transaction Logs**: Continuous archiving (WAL)

**Retention Policy:**
- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups: 12 months
- Yearly backups: 7 years (compliance)

---

#### 2. File Backups

**Uploaded Files:**
- Sync to S3 or object storage (real-time)
- Versioning enabled
- Cross-region replication

**Application Code:**
- Git repository (GitHub/GitLab)
- Tagged releases
- Deployment artifacts stored

---

#### 3. Configuration Backups

**Environment Variables:**
- Stored in secure vault (AWS Secrets Manager, HashiCorp Vault)
- Versioned
- Encrypted

**Infrastructure as Code:**
- Terraform/CloudFormation templates
- Version controlled in Git
- Separate repository

---

### Disaster Recovery Plan

#### Recovery Time Objective (RTO)
- **Critical Systems**: 1 hour
- **Non-Critical Systems**: 4 hours
- **Full System**: 8 hours

#### Recovery Point Objective (RPO)
- **Database**: 15 minutes (transaction log replay)
- **Files**: 1 hour (last sync)
- **Configuration**: 0 (version controlled)

---

#### Disaster Scenarios

**Scenario 1: Database Failure**
```
1. Detect failure (monitoring alert)
2. Promote read replica to primary (5 minutes)
3. Update application connection string (2 minutes)
4. Verify data integrity (10 minutes)
5. Create new read replica (30 minutes)
Total: ~45 minutes
```

**Scenario 2: Application Server Failure**
```
1. Load balancer detects unhealthy instance (30 seconds)
2. Traffic routed to healthy instances (automatic)
3. Auto-scaling launches new instance (5 minutes)
4. New instance passes health checks (2 minutes)
Total: ~8 minutes
```

**Scenario 3: Complete Data Center Failure**
```
1. Detect regional outage (5 minutes)
2. Activate disaster recovery site (10 minutes)
3. Restore database from backup (30 minutes)
4. Deploy application to new region (20 minutes)
5. Update DNS to point to new region (10 minutes)
6. Verify system functionality (15 minutes)
Total: ~90 minutes
```

**Scenario 4: Data Corruption**
```
1. Identify corruption scope (15 minutes)
2. Stop write operations (5 minutes)
3. Restore from last known good backup (30 minutes)
4. Replay transaction logs to recovery point (20 minutes)
5. Verify data integrity (20 minutes)
6. Resume operations (5 minutes)
Total: ~95 minutes
```

---

### High Availability Configuration

**Database High Availability:**
```
Primary Database (Active)
    │
    ├─ Synchronous Replication ─> Standby 1 (Same Region)
    │
    └─ Asynchronous Replication ─> Standby 2 (Different Region)
```

**Application High Availability:**
```
Region 1 (Primary)              Region 2 (DR)
─────────────────              ─────────────
Load Balancer                  Load Balancer (Standby)
    │                              │
    ├─ App Server 1                ├─ App Server 1 (Standby)
    ├─ App Server 2                └─ App Server 2 (Standby)
    └─ App Server 3
```

**Failover Process:**
1. Health check failures detected (30 seconds)
2. Automatic failover triggered
3. DNS updated to DR region (TTL: 60 seconds)
4. Traffic routed to DR site
5. Alert sent to operations team

---

### Monitoring & Alerting

**Critical Alerts (Immediate Response):**
- Database down
- Application servers unresponsive
- Disk space > 90%
- Memory usage > 95%
- SSL certificate expiring < 7 days

**Warning Alerts (Review within 1 hour):**
- High error rate (> 1%)
- Slow response times (> 2 seconds)
- Failed backup jobs
- Unusual traffic patterns

**Monitoring Tools:**
- **Application**: PM2, New Relic, Datadog
- **Infrastructure**: CloudWatch, Prometheus + Grafana
- **Database**: PostgreSQL logs, pg_stat_statements
- **Uptime**: UptimeRobot, Pingdom

---

## Deployment Checklist

### Pre-Deployment

- [ ] Code review completed
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security scan completed (no critical vulnerabilities)
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Backup verified and tested
- [ ] Monitoring and alerting configured
- [ ] Documentation updated

### Deployment

- [ ] Create deployment tag in Git
- [ ] Build application (`npm run build`)
- [ ] Run database migrations
- [ ] Deploy to staging environment
- [ ] Smoke test staging
- [ ] Deploy to production
- [ ] Verify health checks passing
- [ ] Monitor error rates and performance
- [ ] Notify team of successful deployment

### Post-Deployment

- [ ] Verify all features working
- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Verify backup jobs running
- [ ] Update deployment documentation
- [ ] Create rollback plan (if needed)

---

## Rollback Procedure

**Quick Rollback (< 5 minutes):**
```bash
# 1. Revert to previous Docker image
docker-compose down
docker-compose up -d --force-recreate --no-deps app

# 2. Or revert Git deployment
git checkout <previous-tag>
npm run build
pm2 restart hospitium-ris
```

**Database Rollback (if migrations applied):**
```bash
# 1. Rollback migrations
npx prisma migrate resolve --rolled-back <migration-name>

# 2. Restore from backup (if necessary)
psql -U postgres hospitiumris < backup_YYYYMMDD.sql
```

---

## Conclusion

This architecture and deployment documentation provides a comprehensive overview of the HospitiumRIS system. The current **modular monolithic architecture** is appropriate for the system's scale and complexity, with clear paths for future scaling and evolution.

**Key Takeaways:**
- ✅ Modular monolith architecture (appropriate for current scale)
- ✅ Multiple deployment options (VPS, Docker, Cloud)
- ✅ Comprehensive security measures
- ✅ Scalability path defined
- ✅ Disaster recovery plan in place
- ✅ Clear monitoring and alerting strategy

**Next Steps:**
1. Choose deployment strategy based on budget and scale
2. Set up staging environment
3. Configure monitoring and alerting
4. Implement automated backups
5. Conduct security audit
6. Document operational procedures

---

*Document Version: 1.0*  
*Last Updated: 2026-05-20*  
*Author: System Architecture Team*  
*Status: Ready for Review*
