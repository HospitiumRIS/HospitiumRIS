# HospitiumRIS Docker Containerization Plan

A comprehensive containerization strategy for the HospitiumRIS Research Information System using Docker, supporting both development and production environments with PostgreSQL, Nginx, and (once real multi-instance state exists) Redis.

*Revised and fact-checked on 2026-07-28 against the current codebase — corrections and codebase-specific gotchas are marked inline. This is not a rewrite of the original plan, only the parts that were wrong or under-specified.*

## System Analysis

> **Audit note (verified against the current codebase, 2026-07-28):** the sections below have been corrected based on a direct read of `package.json`, `prisma/schema.prisma`, `src/lib`, `src/services`, `scripts/check-global-admin.js`, and the API route tree. Corrections from the original draft are called out inline.

### Application Architecture
- **Framework**: Next.js 16.0.10 with React 19.1.2
- **Database**: PostgreSQL with Prisma ORM 6.14.0, single monolithic schema with **64 models** (`prisma/schema.prisma`, 2,461 lines)
- **Runtime**: Node.js — **correction**: no `engines` field is declared in `package.json`, but Next.js 16 / React 19 require **Node 20.9+**. `node:18-alpine` (as originally proposed) is too old and should not be used. Use `node:20-alpine` or `node:22-alpine`.
- **Build System**: Next.js with Turbopack (dev via `next dev --turbopack`), standard webpack build for production (`next build` / `next start -p 3001`)
- **API surface**: **157 route handlers** under `src/app/api`, all hand-written (no framework-level middleware — there is no root `middleware.js`; each route does its own auth check via `src/lib/auth-server.js`)
- **Dependencies**: ~60 npm packages including MUI, TipTap, Chart.js/recharts, D3, react-force-graph-2d, jsPDF, swagger-ui-react
- **File Uploads**: Local filesystem storage referenced directly from API routes (confirmed in `ethics/applications/[id]`, `proposals/[id]`, `training/[id]/materials`, `training/[id]/certificates/[regId]`) — file paths are persisted as JSON fields on Postgres rows (e.g. `Proposal.ethicsDocuments`), so the disk path and the DB row must always travel together
- **Static Assets**: Public files including logos, sample files, icons

### Current Configuration
- Development server: `npm run dev` (Turbopack enabled). This has a `predev` hook.
- Production build: `npm run build` && `npm start` (`next start -p 3001` — **note the app defaults to port 3001, not 3000**, with a separate `start:3000` script for the standard port)
- Database migrations: Prisma-based (`prisma migrate dev`, `prisma db push`) with JS seed scripts (`prisma/seed.js`, `seed-account-types.js`, `seed-publications.js`)
- Environment variables: **23 variables observed in `.env`**, not 15+: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, SMTP (`SMTP_HOST/PORT/USER/PASS/SECURE/REJECT_UNAUTHORIZED`, `FROM_EMAIL`), ORCID (`NEXT_PUBLIC_ORCID_CLIENT_ID/REDIRECT_URI/SANDBOX_URL/SCOPE/TOKEN_URL`, `ORCID_CLIENT_SECRET`), CiteReady OAuth (`CITEREADY_BASE_URL/CLIENT_ID/CLIENT_SECRET/ENVIRONMENT/REDIRECT_URI`), AI (`GOOGLE_GEMINI_API_KEY`, `OPENAI_API_KEY`), and `IMACHEK_API_KEY/API_URL`, `OSF_TOKEN`.
- **Pre-start hook is a blocker, not a formality**: `predev`/`prestart` run `node scripts/check-global-admin.js`, which uses Node's `readline` to interactively prompt on stdin for a Global Admin account if none exists, with **no TTY/CI/non-interactive guard**. In a container started via `docker run`/`docker-compose up -d` (no attached TTY, no stdin), this will either hang the container waiting on stdin or throw depending on how the base image handles closed stdin. **This must be fixed before containerizing** — see Phase 4 below.
- Port: App listens on 3001 by default (`npm start`), 3000 via `next dev` or `start:3000`.

### External Dependencies
- PostgreSQL (primary database; no explicit minimum version pinned in code — Prisma 6 supports PG 12+, recommend PG 16 for the container)
- SMTP server (email notifications — `src/lib/email.js`, `nodemailer`)
- Google Gemini API (`src/services/geminiService.js`) and OpenAI (`src/services/chatgptService.js`) — both used for AI summaries/citation work, both optional at runtime (routes degrade gracefully if the key is missing)
- ORCID OAuth (researcher identity/auth — `src/lib/citereadyAuth.js` pattern, `api/auth/orcid/*`)
- CiteReady OAuth (reference manager integration — `src/lib/citereadyClient.js`, `api/citeready/*`, `api/settings/citeready`)
- Zotero, Crossref, OpenAlex, PubMed, OSF, Research4Life, ImaChek — outbound integrations under `src/services/*` and `src/lib/imachek.js`, all called live over HTTP, none require inbound network access
- **Redis: NOT currently used anywhere in the codebase.** There is no `redis` package in `package.json` and no session store — sessions are a plain cookie (`hospitium_session`) holding the raw Postgres user ID, validated by a DB lookup on every request (`src/lib/auth-server.js`). See the corrected Redis rationale below — it's still worth adding, but for a concrete reason found in the code (in-memory presence tracking), not as a drop-in session cache that doesn't exist yet.
- **In-memory state that breaks under multiple containers**: `api/manuscripts/[manuscriptId]/presence/route.js` tracks "who's currently viewing this manuscript" in a plain JS `Map` living in the Node process. This works fine in a single instance today but **will silently give wrong presence data the moment you run more than one app container** (Requests get load-balanced across instances that don't share the Map). This is the real justification for Redis, not general "caching."

## Containerization Strategy

### Container Architecture

#### 1. **Application Container** (Next.js)
- **Base Image**: `node:20-alpine` or `node:22-alpine` — **corrected from `node:18-alpine`**: Next.js 16 / React 19 require Node 20.9+, and 18 is past its own EOL. Use the same major version in dev and production images.
- **Purpose**: Run Next.js application server
- **Responsibilities**:
  - Serve application on port 3000
  - Handle API routes and server-side rendering
  - Process file uploads
  - Execute Prisma migrations on startup

#### 2. **Database Container** (PostgreSQL)
- **Base Image**: `postgres:16-alpine`
- **Purpose**: Primary data storage
- **Responsibilities**:
  - Store all application data
  - Persist via named Docker volume
  - Auto-initialize with required extensions

#### 3. **Cache Container** (Redis) — *infra-only until code changes land, see note*
- **Base Image**: `redis:7-alpine`
- **Purpose**: Shared state across app containers when scaled horizontally
- **Responsibilities** (require corresponding app code changes, not just deploying the container):
  - Replace the in-memory `Map` in `manuscripts/[manuscriptId]/presence/route.js` with a Redis-backed store (e.g. hash keyed by manuscriptId with TTL per user) — **required** as soon as `app` runs with `replicas > 1`
  - Optional: move the session lookup (`hospitium_session` cookie → Prisma `User` lookup) into a Redis cache in front of Postgres to cut DB round-trips, since every authenticated request currently does a live `User.findUnique` with joins
  - Optional: cache outbound API responses (Crossref/OpenAlex/PubMed/ORCID) which are currently fetched live on every request with no caching layer
- **If you deploy the app as a single container/instance, Redis is not required** — skip it for the dev/single-instance compose file and add it only when scaling `app` horizontally.

#### 4. **Reverse Proxy** (Nginx)
- **Base Image**: `nginx:alpine`
- **Purpose**: Production-grade web server
- **Responsibilities**:
  - SSL/TLS termination
  - Static file serving
  - Load balancing (future)
  - Security headers

### File Structure

```
HospitiumRIS/
├── Dockerfile                          # Production Dockerfile
├── Dockerfile.dev                      # Development Dockerfile
├── docker-compose.yml                  # Production compose
├── docker-compose.dev.yml              # Development compose
├── .dockerignore                       # Exclude files from build
├── docker/
│   ├── nginx/
│   │   ├── nginx.conf                 # Main nginx config
│   │   ├── default.conf               # Site configuration
│   │   └── ssl/                       # SSL certificates (gitignored)
│   ├── postgres/
│   │   └── init.sql                   # Database initialization
│   └── scripts/
│       ├── docker-entrypoint.sh       # App startup script
│       └── wait-for-it.sh             # Service dependency waiter
├── .env.docker.example                # Docker environment template
└── docs/
    └── DOCKER_DEPLOYMENT.md           # Deployment guide
```

## Implementation Plan

### Phase 1: Core Docker Configuration

#### 1.1 Create Production Dockerfile
- Multi-stage build for optimized image size
- Stage 1: Dependencies installation
- Stage 2: Application build
- Stage 3: Production runtime
- Non-root user for security
- Health check endpoint configuration

#### 1.2 Create Development Dockerfile
- Single-stage build for faster rebuilds
- Hot-reload support with volume mounts
- Development dependencies included
- Debugging ports exposed

#### 1.3 Create .dockerignore
- Exclude node_modules, .next, .git
- Exclude environment files
- Exclude logs and temporary files
- Include only necessary source files

### Phase 2: Docker Compose Configuration

#### 2.1 Production Compose (docker-compose.yml)
**Note**: keep `redis` behind a Compose [profile](https://docs.docker.com/compose/profiles/) (e.g. `profiles: ["scaled"]`) rather than a hard dependency, per the corrected rationale in Container Architecture #3 above — it's dead weight for a single-instance deployment until the presence-tracking code is actually migrated to use it.

**Services:**
- `app`: Next.js application
  - Build from production Dockerfile
  - Environment variables from .env
  - Depends on postgres (redis only if running scaled/multi-instance — see note above)
  - Restart policy: unless-stopped
  - Health checks enabled (against the new `/api/health` endpoint from Phase 4.5, not `global-admin/health`)
  
- `postgres`: PostgreSQL database
  - Version: 16-alpine
  - Named volume: `postgres_data`
  - Environment: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
  - Port: 5432 (internal only)
  - Health checks enabled
  
- `redis`: Redis cache
  - Version: 7-alpine
  - Named volume: `redis_data`
  - Port: 6379 (internal only)
  - Persistence enabled (AOF)
  
- `nginx`: Reverse proxy
  - Version: alpine
  - Ports: 80, 443
  - Volumes: nginx config, SSL certs, static files
  - Depends on app
  - Auto-restart enabled

**Networks:**
- `hospitiumris_network`: Bridge network for inter-service communication

**Volumes:**
- `postgres_data`: Database persistence
- `redis_data`: Cache persistence
- `uploads_data`: User file uploads
- `logs_data`: Application logs

#### 2.2 Development Compose (docker-compose.dev.yml)
**Differences from Production:**
- Hot-reload with bind mounts for src/
- Exposed debugging ports
- Development environment variables
- No nginx (direct access to app:3000)
- Simplified configuration
- Optional Prisma Studio service

### Phase 3: Supporting Files

#### 3.1 Nginx Configuration
- **nginx.conf**: Main configuration
  - Worker processes optimization
  - Gzip compression
  - Client body size limits (for file uploads)
  
- **default.conf**: Site configuration
  - Proxy to Next.js app
  - Static file serving from /public
  - Security headers (HSTS, CSP, X-Frame-Options)
  - Rate limiting
  - SSL configuration (production)

#### 3.2 Database Initialization
- **init.sql**: PostgreSQL setup
  - Create database if not exists
  - Create required extensions (if any)
  - Set proper permissions

#### 3.3 Startup Scripts
- **docker-entrypoint.sh**: Application startup
  - Wait for database availability
  - Run Prisma migrations
  - Seed account types if needed
  - Check/create global admin
  - Start Next.js server
  
- **wait-for-it.sh**: Service dependency checker
  - Wait for PostgreSQL to be ready
  - Wait for Redis to be ready
  - Timeout handling

#### 3.4 Environment Configuration
- **.env.docker.example**: Template file
  - All required environment variables
  - Placeholder values with descriptions
  - Separate sections: Database, SMTP, ORCID, AI, App
  - Security notes for sensitive values

### Phase 4: Application Modifications

#### 4.1 Update package.json Scripts
- Add `docker:dev` - Start development containers
- Add `docker:prod` - Start production containers
- Add `docker:build` - Build production images
- Add `docker:down` - Stop and remove containers
- Add `docker:logs` - View container logs
- Add `docker:clean` - Remove volumes and images

#### 4.2 Database Connection Updates
- Ensure DATABASE_URL supports Docker networking
- Add connection pooling configuration
- Add retry logic for initial connection
- Add Prisma **binary targets for Alpine/musl** to `prisma/schema.prisma`'s `generator client` block (`binaryTargets = ["native", "linux-musl-openssl-3.0.x"]`) — without this, `prisma generate` run on a non-Alpine dev machine produces a client that will fail to load the query engine at runtime inside an Alpine container. This is a common silent failure mode and should be caught in Phase 6 testing, not discovered in production.

#### 4.3 File Upload Path Configuration
- Ensure uploads directory is properly mounted (routes touching disk today: `ethics/applications/[id]`, `proposals/[id]`, `proposals/[id]/files/[fileName]`, `training/[id]/materials`, `training/[id]/certificates/[regId]`)
- Add environment variable for upload path (currently hardcoded relative paths in route handlers — confirm/normalize before containerizing, since the working directory inside a container differs from local dev)
- Create uploads directory if not exists
- **Multi-instance caveat**: if `app` is ever scaled beyond 1 replica, a local named volume is *not* shared across containers on different hosts. A single-host Docker Compose deployment is fine with a named volume; anything beyond that (Swarm/K8s/multi-host) needs shared storage (NFS, S3-compatible object storage) and route-level changes to read/write through that instead of `fs`.

#### 4.4 Fix the Interactive Startup Script (blocks container start)
- `scripts/check-global-admin.js` (run via `predev`/`prestart`) uses `readline` to prompt on stdin with no non-interactive fallback. Before containerizing:
  - Add a guard (e.g. `if (!process.stdin.isTTY || process.env.SKIP_ADMIN_PROMPT)`) that skips the interactive prompt and either no-ops or logs a warning telling the operator to run `node scripts/create-global-admin.js` (already exists non-interactively) manually or via `docker-entrypoint.sh`
  - In the container entrypoint, call the non-interactive `scripts/create-global-admin.js` (or an env-var-driven variant) instead of relying on `predev`/`prestart`, since npm lifecycle scripts run for both `dev` and `start` and will fire on every container boot

#### 4.5 Health Check Endpoint
- **Correction**: `api/global-admin/health` already exists but is **not suitable** as a Docker health check — it requires an authenticated `GLOBAL_ADMIN` session cookie and returns 401/403 without one, which is exactly what Docker's health check prober will get.
- Create a new **unauthenticated** `/api/health` endpoint
  - Check database connectivity (cheap `SELECT 1` via `prisma.$queryRaw`)
  - Check Redis connectivity, if/when Redis is actually introduced (see Phase 1 note — skip this check until Redis is real)
  - Return service status as plain JSON, no auth required
  - Used by Docker `HEALTHCHECK` / Compose `healthcheck:` directives

### Phase 5: Documentation

#### 5.1 Create DOCKER_DEPLOYMENT.md
**Contents:**
- Prerequisites (Docker, Docker Compose)
- Quick start guide
- Environment variable configuration
- Development workflow
- Production deployment steps
- Troubleshooting guide
- Backup and restore procedures
- Scaling considerations
- Security best practices

#### 5.2 Update README.md
- Add Docker installation section
- Add Docker quick start
- Link to detailed Docker documentation
- Update prerequisites section

### Phase 6: Testing & Validation

#### 6.1 Development Environment Testing
- Test hot-reload functionality
- Verify database migrations
- Test file upload persistence
- Verify environment variable loading
- Test service connectivity

#### 6.2 Production Environment Testing
- Build production images
- Test multi-stage build optimization
- Verify nginx reverse proxy
- Test SSL configuration (with self-signed cert)
- Load testing with sample data
- Verify data persistence across restarts

#### 6.3 Migration Testing
- Test migration from local to Docker
- Verify data import/export
- Test backup and restore procedures

## Security Considerations

### Container Security
- Non-root user in application container
- Read-only root filesystem where possible
- Minimal base images (Alpine Linux)
- No unnecessary packages
- Regular image updates

### Network Security
- Internal network for service communication
- Only necessary ports exposed
- Nginx as single entry point
- Rate limiting on nginx
- Security headers configured

### Secrets Management
- Environment variables for secrets
- .env files gitignored
- Docker secrets for production (optional)
- No hardcoded credentials
- Separate .env files for dev/prod

### Data Security
- Named volumes for persistence
- Regular backup procedures
- Encrypted connections (SSL/TLS)
- Database password complexity
- File upload validation

## Performance Optimizations

### Build Optimization
- Multi-stage builds to reduce image size
- Layer caching for faster rebuilds
- .dockerignore to exclude unnecessary files
- npm ci instead of npm install

### Runtime Optimization
- Redis caching for API responses
- Nginx static file serving
- Gzip compression
- Connection pooling for database
- Resource limits on containers

### Volume Optimization
- Named volumes for better performance
- Separate volumes for different data types
- Volume backup strategies

## Backup Strategy

### Database Backups
- Automated daily backups via cron
- Backup script using pg_dump
- Retention policy (7 daily, 4 weekly, 12 monthly)
- Backup verification procedures

### File Upload Backups
- Sync uploads volume to external storage
- Incremental backup strategy
- Backup before major updates

### Configuration Backups
- Version control for Docker configs
- Environment variable documentation
- Nginx configuration backups

## Rollback Procedures

### Application Rollback
- Tag Docker images with version numbers
- Keep previous 3 versions
- Quick rollback command documented
- Database migration rollback strategy

### Data Rollback
- Point-in-time recovery capability
- Volume snapshots before updates
- Documented restore procedures

## Monitoring & Logging

### Container Monitoring
- Docker stats for resource usage
- Health check monitoring
- Container restart policies
- Log aggregation setup

### Application Logging
- Centralized logging to logs volume
- Log rotation configuration
- Error tracking and alerting
- Access log analysis

## Scaling Considerations

### Horizontal Scaling
- Multiple app containers behind nginx
- Load balancing configuration
- Session sharing via Redis
- Database connection pooling

### Vertical Scaling
- Resource limits configuration
- Memory and CPU allocation
- Database tuning parameters

## Cost Optimization

### Resource Allocation
- Right-sized containers
- Shared volumes where appropriate
- Efficient image layers
- Development vs production resource profiles

## Migration Path

### From Local Development
1. Export existing database
2. Configure Docker environment
3. Start Docker containers
4. Import database
5. Verify functionality
6. Update development workflow

### To Production
1. Build production images
2. Configure production environment
3. Set up SSL certificates
4. Deploy containers
5. Run database migrations
6. Verify deployment
7. Configure monitoring
8. Set up backups

## Success Criteria

- ✅ Application runs in Docker containers
- ✅ Development hot-reload works
- ✅ Production build optimized (<500MB)
- ✅ Database persists across restarts
- ✅ File uploads persist across restarts
- ✅ All environment variables configurable
- ✅ Health checks functional
- ✅ Nginx reverse proxy working
- ✅ SSL/TLS configured
- ✅ Documentation complete
- ✅ Backup procedures tested
- ✅ Migration path validated

## Timeline Estimate

- **Phase 1**: Core Docker Configuration - 2-3 hours
- **Phase 2**: Docker Compose Setup - 2-3 hours
- **Phase 3**: Supporting Files - 3-4 hours
- **Phase 4**: Application Modifications - 2-3 hours
- **Phase 5**: Documentation - 2-3 hours
- **Phase 6**: Testing & Validation - 3-4 hours

**Total Estimated Time**: 14-20 hours

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Comprehensive backup before migration |
| Performance degradation | Medium | Load testing, resource optimization |
| Environment variable misconfig | Medium | Template file with validation |
| SSL certificate issues | Low | Self-signed certs for testing, Let's Encrypt guide |
| Volume permission issues | Medium | Proper user/group configuration |
| Network connectivity issues | Low | Health checks, retry logic |

## Post-Implementation

### Maintenance Tasks
- Regular image updates
- Security patch application
- Log rotation and cleanup
- Backup verification
- Performance monitoring

### Future Enhancements
- Kubernetes deployment option
- CI/CD pipeline integration
- Automated testing in containers
- Multi-region deployment
- Container orchestration
