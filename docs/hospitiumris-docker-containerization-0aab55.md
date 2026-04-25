# HospitiumRIS Docker Containerization Plan

A comprehensive containerization strategy for the HospitiumRIS Research Information System using Docker, supporting both development and production environments with PostgreSQL, Redis, and Nginx.

## System Analysis

### Application Architecture
- **Framework**: Next.js 16.0.10 with React 19.1.2
- **Database**: PostgreSQL with Prisma ORM 6.14.0
- **Runtime**: Node.js (requires v18+)
- **Build System**: Next.js with Turbopack (dev), standard build (prod)
- **Dependencies**: 50+ npm packages including MUI, TipTap, Chart.js, D3.js
- **File Uploads**: Local filesystem storage in `uploads/` directory
- **Static Assets**: Public files including logos, sample files, icons

### Current Configuration
- Development server: `npm run dev` (Turbopack enabled)
- Production build: `npm run build` && `npm start`
- Database migrations: Prisma-based with seed scripts
- Environment variables: 15+ required variables (SMTP, ORCID, DB, AI)
- Pre-start hooks: Global admin check script
- Port: Default 3000 (Next.js)

### External Dependencies
- PostgreSQL 14+ (primary database)
- SMTP server (email notifications)
- Google Gemini API (AI summaries - optional)
- ORCID OAuth (researcher authentication - optional)

## Containerization Strategy

### Container Architecture

#### 1. **Application Container** (Next.js)
- **Base Image**: `node:18-alpine` (development), multi-stage build (production)
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

#### 3. **Cache Container** (Redis)
- **Base Image**: `redis:7-alpine`
- **Purpose**: Session storage and caching
- **Responsibilities**:
  - Cache API responses
  - Store user sessions
  - Improve application performance

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
**Services:**
- `app`: Next.js application
  - Build from production Dockerfile
  - Environment variables from .env
  - Depends on postgres, redis
  - Restart policy: unless-stopped
  - Health checks enabled
  
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

#### 4.3 File Upload Path Configuration
- Ensure uploads directory is properly mounted
- Add environment variable for upload path
- Create uploads directory if not exists

#### 4.4 Health Check Endpoint
- Create `/api/health` endpoint
  - Check database connectivity
  - Check Redis connectivity
  - Return service status
  - Used by Docker health checks

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
