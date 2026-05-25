# HospitiumRIS Deployment & Orchestration

## Overview
This document details the deployment approach, orchestration tools, environment structure, and scaling methods for the HospitiumRIS research proposal and institutional review management system.

---

## Table of Contents
1. [Deployment Approach](#deployment-approach)
2. [Orchestration Tools](#orchestration-tools)
3. [Environment Structure](#environment-structure)
4. [Scaling Methods](#scaling-methods)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Deployment Workflows](#deployment-workflows)
7. [Rollback Strategies](#rollback-strategies)
8. [Monitoring & Health Checks](#monitoring--health-checks)

---

## 1. Deployment Approach

### Current State: Manual Deployment

**Status**: Development phase - manual deployments for testing and iteration

**Process**:
```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Run database migrations
npx prisma migrate deploy

# 4. Build application
npm run build

# 5. Restart application
pm2 restart hospitium-ris
# OR
docker-compose down && docker-compose up -d
```

**Characteristics**:
- ✅ Simple and straightforward
- ✅ Full control over deployment process
- ✅ Easy to debug issues
- ❌ Time-consuming
- ❌ Error-prone (human mistakes)
- ❌ Not suitable for frequent deployments

---

### Recommended: CI/CD Automated Pipeline

**Target State**: Automated continuous integration and deployment

**Benefits**:
- ✅ Faster deployment cycles
- ✅ Reduced human error
- ✅ Automated testing before deployment
- ✅ Consistent deployment process
- ✅ Rollback capabilities
- ✅ Deployment history and audit trail

**Pipeline Stages**:
```
Code Commit → Build → Test → Deploy to Staging → Manual Approval → Deploy to Production
```

---

### Deployment Approach Comparison

| Approach | Complexity | Speed | Reliability | Cost | Best For |
|----------|-----------|-------|-------------|------|----------|
| **Manual** | Low | Slow | Medium | Free | Development, small teams |
| **Semi-Automated** | Medium | Medium | High | Low | Small production deployments |
| **Full CI/CD** | High | Fast | Very High | Medium | Production, frequent releases |
| **GitOps** | Very High | Fast | Very High | High | Enterprise, multi-environment |

---

### Recommended Deployment Approach for HospitiumRIS

**Phase 1: Development (Current)**
- **Approach**: Manual deployment
- **Tools**: Git, npm, PM2/Docker
- **Frequency**: As needed during development

**Phase 2: Staging/Testing**
- **Approach**: Semi-automated deployment
- **Tools**: GitHub Actions, Docker, deployment scripts
- **Frequency**: On every merge to `develop` branch

**Phase 3: Production**
- **Approach**: Full CI/CD pipeline
- **Tools**: GitHub Actions, Docker, automated testing
- **Frequency**: On merge to `main` branch (with manual approval)
- **Rollback**: Automated rollback on failure

---

## 2. Orchestration Tools

### Current State: No Orchestration (Simple Deployment)

**Current Setup**:
- Single server or simple Docker Compose
- No container orchestration
- Manual scaling
- PM2 for process management (if not using Docker)

**Appropriate for**:
- Development environment
- Small production deployments (< 1,000 concurrent users)
- Single-server setups
- Budget-conscious deployments

---

### Orchestration Tool Options

#### Option 1: None (Current Recommendation)

**Use Case**: Small to medium deployments

**Setup**:
```yaml
# docker-compose.yml (Simple orchestration)
version: '3.8'

services:
  app:
    image: hospitiumris:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    deploy:
      replicas: 2  # Simple horizontal scaling
      resources:
        limits:
          cpus: '2'
          memory: 4G

  db:
    image: postgres:15-alpine
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    restart: unless-stopped
```

**Pros**:
- ✅ Simple to set up and maintain
- ✅ Low learning curve
- ✅ Minimal overhead
- ✅ Sufficient for most use cases

**Cons**:
- ❌ Limited scaling capabilities
- ❌ Manual intervention for updates
- ❌ No advanced features (auto-healing, service discovery)

---

#### Option 2: Docker Swarm (Intermediate)

**Use Case**: Medium-scale deployments with multiple servers

**When to Consider**:
- Need to scale across 3-10 servers
- Want simple orchestration without Kubernetes complexity
- Need basic load balancing and service discovery
- Budget constraints prevent Kubernetes infrastructure

**Setup**:
```bash
# Initialize Swarm on manager node
docker swarm init --advertise-addr <MANAGER-IP>

# Join worker nodes
docker swarm join --token <TOKEN> <MANAGER-IP>:2377

# Deploy stack
docker stack deploy -c docker-compose.yml hospitiumris
```

**Docker Compose for Swarm**:
```yaml
version: '3.8'

services:
  app:
    image: hospitiumris:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        max_attempts: 3
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
    networks:
      - app-network
    secrets:
      - db_password
      - jwt_secret

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.role == manager
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - app-network
    secrets:
      - db_password

networks:
  app-network:
    driver: overlay

volumes:
  db-data:

secrets:
  db_password:
    external: true
  jwt_secret:
    external: true
```

**Features**:
- ✅ Built into Docker (no additional installation)
- ✅ Simple to learn and use
- ✅ Service discovery and load balancing
- ✅ Rolling updates and rollbacks
- ✅ Secrets management
- ✅ Health checks and auto-healing

**Limitations**:
- ❌ Less feature-rich than Kubernetes
- ❌ Smaller community and ecosystem
- ❌ Limited advanced networking features

**Recommendation**: **Good middle ground** for HospitiumRIS if scaling beyond single server

---

#### Option 3: Kubernetes (Advanced)

**Use Case**: Large-scale, enterprise deployments

**When to Consider**:
- Scaling to 10+ servers
- Need advanced features (auto-scaling, complex networking)
- Multi-region deployments
- Microservices architecture
- Enterprise requirements

**Kubernetes Deployment Manifest**:
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hospitiumris-app
  namespace: hospitiumris
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hospitiumris
  template:
    metadata:
      labels:
        app: hospitiumris
    spec:
      containers:
      - name: app
        image: hospitiumris:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: hospitiumris-service
  namespace: hospitiumris
spec:
  type: LoadBalancer
  selector:
    app: hospitiumris
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hospitiumris-hpa
  namespace: hospitiumris
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hospitiumris-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

---
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: hospitiumris
type: Opaque
data:
  url: <base64-encoded-database-url>
```

**Features**:
- ✅ Industry-standard orchestration
- ✅ Auto-scaling (horizontal and vertical)
- ✅ Self-healing and fault tolerance
- ✅ Advanced networking and service mesh
- ✅ Extensive ecosystem (Helm, operators, etc.)
- ✅ Multi-cloud support

**Challenges**:
- ❌ Steep learning curve
- ❌ Complex to set up and maintain
- ❌ Higher infrastructure costs
- ❌ Requires dedicated DevOps expertise

**Recommendation**: **Overkill for current HospitiumRIS scale** - consider only if scaling to 10,000+ users

---

### Orchestration Tool Recommendation Matrix

| User Scale | Servers | Recommendation | Rationale |
|-----------|---------|----------------|-----------|
| < 1,000 | 1 | **None** (Docker Compose) | Simple, cost-effective |
| 1,000 - 5,000 | 1-3 | **Docker Swarm** | Easy scaling, low complexity |
| 5,000 - 20,000 | 3-10 | **Docker Swarm** or **Kubernetes** | Depends on team expertise |
| 20,000+ | 10+ | **Kubernetes** | Enterprise-grade features needed |

**Current Recommendation for HospitiumRIS**: 
- **Start with Docker Compose** (no orchestration)
- **Migrate to Docker Swarm** when scaling beyond single server
- **Consider Kubernetes** only if reaching enterprise scale (10,000+ users)

---

## 3. Environment Structure

### Multi-Environment Setup

HospitiumRIS follows a **three-tier environment structure** for safe and reliable deployments.

```
Development → Staging → Production
```

---

### Environment 1: Development (Local)

**Purpose**: Active development and feature implementation

**Infrastructure**:
- **Location**: Developer's local machine
- **Database**: Local PostgreSQL instance
- **Caching**: None (or local Redis)
- **External APIs**: Sandbox/test endpoints
- **File Storage**: Local filesystem

**Configuration**:
```env
# .env.development
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/hospitiumris_dev
JWT_SECRET=dev-secret-change-in-production
ORCID_CLIENT_ID=sandbox-client-id
ORCID_CLIENT_SECRET=sandbox-secret
ORCID_REDIRECT_URI=http://localhost:3000/api/auth/orcid/callback
LOG_LEVEL=debug
```

**Deployment Method**:
```bash
# Start development server
npm run dev

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

**Characteristics**:
- ✅ Fast iteration and debugging
- ✅ Hot module reloading
- ✅ Detailed error messages
- ✅ No deployment process needed
- ❌ Not representative of production
- ❌ No performance testing

**Access**:
- Developers only
- `http://localhost:3000`

---

### Environment 2: Staging (Pre-Production)

**Purpose**: Testing, QA, and pre-production validation

**Infrastructure**:
- **Location**: Cloud server (separate from production)
- **Database**: PostgreSQL (smaller instance than production)
- **Caching**: Redis (optional)
- **External APIs**: Sandbox or production (depending on integration)
- **File Storage**: S3 or local (mirroring production setup)

**Configuration**:
```env
# .env.staging
NODE_ENV=production
DATABASE_URL=postgresql://staging-db.example.com:5432/hospitiumris_staging
JWT_SECRET=<staging-secret>
ORCID_CLIENT_ID=<staging-client-id>
ORCID_CLIENT_SECRET=<staging-secret>
ORCID_REDIRECT_URI=https://staging.hospitium.com/api/auth/orcid/callback
LOG_LEVEL=info
ENABLE_ANALYTICS=false
```

**Deployment Method**:
```bash
# Automated via CI/CD on merge to 'develop' branch
# GitHub Actions workflow triggers:
# 1. Build Docker image
# 2. Push to container registry
# 3. Deploy to staging server
# 4. Run database migrations
# 5. Run smoke tests
```

**Docker Compose (Staging)**:
```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/hospitiumris/app:staging
    environment:
      - NODE_ENV=production
    env_file:
      - .env.staging
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=hospitiumris_staging
    volumes:
      - staging-db-data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-staging.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  staging-db-data:
```

**Characteristics**:
- ✅ Production-like environment
- ✅ Safe for testing new features
- ✅ Can test with real-ish data
- ✅ Performance testing possible
- ✅ Integration testing with external APIs
- ❌ Not 100% identical to production
- ❌ Smaller scale than production

**Access**:
- Development team
- QA team
- Product managers
- `https://staging.hospitium.com`

**Testing Checklist**:
- [ ] All features work as expected
- [ ] Database migrations successful
- [ ] External integrations functional (ORCID, PubMed, etc.)
- [ ] Performance acceptable (load testing)
- [ ] Security scan passed
- [ ] No critical errors in logs

---

### Environment 3: Production

**Purpose**: Live system serving real users

**Infrastructure**:
- **Location**: Cloud server (AWS, Azure, GCP, or VPS)
- **Database**: PostgreSQL (production-grade, with backups)
- **Caching**: Redis (recommended)
- **External APIs**: Production endpoints
- **File Storage**: S3 or equivalent object storage
- **CDN**: CloudFront or equivalent (optional)
- **Monitoring**: CloudWatch, Datadog, or Prometheus

**Configuration**:
```env
# .env.production (stored in secrets manager)
NODE_ENV=production
DATABASE_URL=postgresql://prod-db.example.com:5432/hospitiumris
JWT_SECRET=<strong-production-secret>
ORCID_CLIENT_ID=<production-client-id>
ORCID_CLIENT_SECRET=<production-secret>
ORCID_REDIRECT_URI=https://hospitium.com/api/auth/orcid/callback
LOG_LEVEL=warn
ENABLE_ANALYTICS=true
SENTRY_DSN=<sentry-dsn>
```

**Deployment Method**:
```bash
# Automated via CI/CD on merge to 'main' branch
# Requires manual approval before deployment
# GitHub Actions workflow:
# 1. Build Docker image
# 2. Run security scan
# 3. Push to container registry
# 4. Wait for manual approval
# 5. Deploy to production (blue-green or rolling update)
# 6. Run database migrations (with backup)
# 7. Run smoke tests
# 8. Monitor for errors (auto-rollback if critical)
```

**Docker Compose (Production)**:
```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/hospitiumris/app:latest
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis
    restart: unless-stopped
    deploy:
      replicas: 3  # Multiple instances for high availability
      resources:
        limits:
          cpus: '2'
          memory: 4G

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=hospitiumris
    volumes:
      - prod-db-data:/var/lib/postgresql/data
    restart: unless-stopped
    # Note: In production, use managed database (RDS, Azure Database, etc.)

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis-data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  prod-db-data:
  redis-data:
```

**Characteristics**:
- ✅ High availability and reliability
- ✅ Automated backups
- ✅ Monitoring and alerting
- ✅ Security hardened
- ✅ Performance optimized
- ✅ Disaster recovery plan
- ❌ Changes require careful testing
- ❌ Downtime must be minimized

**Access**:
- All users (public)
- Admins via VPN for backend access
- `https://hospitium.com`

**Production Safeguards**:
- Manual approval required for deployments
- Automated rollback on critical errors
- Database backups before migrations
- Health checks and monitoring
- Rate limiting and DDoS protection
- SSL/TLS encryption (TLS 1.3)

---

### Environment Comparison Table

| Aspect | Development | Staging | Production |
|--------|-------------|---------|------------|
| **Purpose** | Feature development | Testing & QA | Live system |
| **Location** | Local machine | Cloud server | Cloud server |
| **Database** | Local PostgreSQL | Cloud PostgreSQL (small) | Cloud PostgreSQL (large) |
| **Caching** | None | Redis (optional) | Redis (required) |
| **File Storage** | Local filesystem | S3 or local | S3 + CDN |
| **External APIs** | Sandbox | Sandbox/Production | Production |
| **Deployment** | Manual (`npm run dev`) | Auto (on merge to `develop`) | Auto (on merge to `main`, with approval) |
| **Monitoring** | Console logs | Basic logging | Full monitoring (Sentry, CloudWatch) |
| **Backups** | None | Daily | Hourly + continuous WAL |
| **SSL** | No | Yes (Let's Encrypt) | Yes (Let's Encrypt or commercial) |
| **Access** | Developers | Dev team, QA | Public |
| **Uptime SLA** | N/A | N/A | 99.9% |
| **Cost** | Free | ~$50-100/month | ~$200-1000+/month |

---

### Environment Promotion Flow

```
┌─────────────────┐
│  Development    │  Developer commits code
│  (Local)        │  
└────────┬────────┘
         │
         │ git push origin feature-branch
         │
         ▼
┌─────────────────┐
│  Feature Branch │  Create Pull Request
│  (GitHub)       │  Code review
└────────┬────────┘
         │
         │ Merge to 'develop'
         │
         ▼
┌─────────────────┐
│  Staging        │  Automated deployment
│  (Cloud)        │  QA testing
└────────┬────────┘
         │
         │ QA approval
         │ Merge to 'main'
         │
         ▼
┌─────────────────┐
│  Production     │  Manual approval required
│  (Cloud)        │  Automated deployment
└─────────────────┘  Monitoring & alerts
```

---

### Environment-Specific Configurations

**Branch Strategy**:
- `main` → Production
- `develop` → Staging
- `feature/*` → Development (local)

**Database Migrations**:
```bash
# Development: Create and apply migrations
npx prisma migrate dev --name add_new_feature

# Staging: Apply migrations automatically
npx prisma migrate deploy

# Production: Apply migrations with backup
# 1. Backup database
# 2. Apply migrations
# 3. Verify success
# 4. Rollback if issues
```

**Environment Variables Management**:
- **Development**: `.env.development` (local file, not committed)
- **Staging**: GitHub Secrets or environment variables on server
- **Production**: AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault

---

## 4. Scaling Methods

### Vertical Scaling (Scale Up)

**Definition**: Increasing resources (CPU, RAM, storage) of existing servers

**When to Use**:
- Simple to implement
- Application not designed for horizontal scaling
- Database scaling (up to a point)
- Quick fix for performance issues

**Implementation**:
```bash
# Example: Upgrade server resources
# Current: 2 CPU, 4GB RAM
# Upgrade: 4 CPU, 8GB RAM

# For cloud providers (AWS EC2 example):
aws ec2 modify-instance-attribute \
  --instance-id i-1234567890abcdef0 \
  --instance-type t3.xlarge

# For Docker resource limits:
docker update --cpus="4" --memory="8g" hospitiumris-app
```

**Vertical Scaling Tiers**:

| Tier | CPU | RAM | Storage | Concurrent Users | Monthly Cost |
|------|-----|-----|---------|------------------|--------------|
| **Small** | 2 cores | 4GB | 80GB SSD | < 500 | $20-40 |
| **Medium** | 4 cores | 8GB | 160GB SSD | 500 - 2,000 | $40-80 |
| **Large** | 8 cores | 16GB | 320GB SSD | 2,000 - 5,000 | $80-160 |
| **X-Large** | 16 cores | 32GB | 640GB SSD | 5,000 - 10,000 | $160-320 |
| **XX-Large** | 32 cores | 64GB | 1TB SSD | 10,000+ | $320-640 |

**Advantages**:
- ✅ Simple to implement (resize server)
- ✅ No code changes required
- ✅ No complexity in load balancing
- ✅ Maintains single-server simplicity

**Disadvantages**:
- ❌ Limited by hardware constraints
- ❌ Downtime during resize
- ❌ Single point of failure
- ❌ Diminishing returns (cost vs. performance)
- ❌ Maximum capacity ceiling

**Recommendation**: **Use for initial scaling** (up to ~5,000 users), then switch to horizontal scaling

---

### Horizontal Scaling (Scale Out)

**Definition**: Adding more servers/instances to distribute load

**When to Use**:
- Vertical scaling limits reached
- Need high availability (no single point of failure)
- Traffic patterns vary (auto-scaling)
- Microservices architecture

**Implementation**:

#### Option 1: Manual Horizontal Scaling (Docker Compose)

```yaml
version: '3.8'

services:
  app:
    image: hospitiumris:latest
    deploy:
      replicas: 3  # Run 3 instances
    environment:
      - NODE_ENV=production

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
```

**Nginx Load Balancer Configuration**:
```nginx
# nginx-lb.conf
upstream app_servers {
    least_conn;  # Load balancing method
    server app:3000 max_fails=3 fail_timeout=30s;
    server app:3000 max_fails=3 fail_timeout=30s;
    server app:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name hospitium.com;

    location / {
        proxy_pass http://app_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Health check
        proxy_next_upstream error timeout http_502 http_503 http_504;
    }
}
```

#### Option 2: Auto-Scaling (Docker Swarm)

```yaml
version: '3.8'

services:
  app:
    image: hospitiumris:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
      # Note: Docker Swarm doesn't have built-in auto-scaling
      # Use external tools like Docker Swarm Autoscaler
```

#### Option 3: Auto-Scaling (Kubernetes)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hospitiumris-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hospitiumris-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 2
        periodSeconds: 30
```

**Horizontal Scaling Architecture**:

```
                    Internet
                       │
                       │
                ┌──────▼──────┐
                │Load Balancer│
                │   (Nginx)   │
                └──────┬──────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐    ┌────▼────┐   ┌────▼────┐
   │  App    │    │  App    │   │  App    │
   │Instance1│    │Instance2│   │Instance3│
   └────┬────┘    └────┬────┘   └────┬────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
                ┌──────▼──────┐
                │  Database   │
                │ (Shared)    │
                └─────────────┘
```

**Advantages**:
- ✅ No hard limit on capacity
- ✅ High availability (redundancy)
- ✅ Auto-scaling based on demand
- ✅ Rolling updates with zero downtime
- ✅ Better fault tolerance

**Disadvantages**:
- ❌ More complex architecture
- ❌ Requires load balancer
- ❌ Session management challenges
- ❌ Database becomes bottleneck
- ❌ Higher infrastructure costs

**Recommendation**: **Use when exceeding 5,000 concurrent users** or need high availability

---

### Hybrid Scaling Approach (Recommended)

**Strategy**: Combine vertical and horizontal scaling

```
Phase 1: Vertical Scaling
├── Start: 2 CPU, 4GB RAM (< 500 users)
├── Scale: 4 CPU, 8GB RAM (500 - 2,000 users)
└── Scale: 8 CPU, 16GB RAM (2,000 - 5,000 users)

Phase 2: Horizontal Scaling
├── Add 2nd instance: 2x 8 CPU, 16GB RAM (5,000 - 10,000 users)
├── Add 3rd instance: 3x 8 CPU, 16GB RAM (10,000 - 15,000 users)
└── Auto-scale: 3-10 instances (15,000+ users)

Phase 3: Database Scaling
├── Vertical: Upgrade database server
├── Read Replicas: Add read-only replicas
└── Sharding: Partition data (if needed)
```

---

### Database Scaling Strategies

**Challenge**: Database is often the bottleneck in horizontal scaling

#### Strategy 1: Vertical Scaling (First Step)

```
Small:  2 CPU, 4GB RAM, 100GB SSD   (< 1,000 users)
Medium: 4 CPU, 16GB RAM, 250GB SSD  (1,000 - 5,000 users)
Large:  8 CPU, 32GB RAM, 500GB SSD  (5,000 - 20,000 users)
XLarge: 16 CPU, 64GB RAM, 1TB SSD   (20,000+ users)
```

#### Strategy 2: Read Replicas (Horizontal Scaling)

```
┌─────────────────┐
│ Primary DB      │  ← All writes
│ (Read + Write)  │
└────────┬────────┘
         │
         │ Replication
         │
    ┌────┼────┬────┐
    │    │    │    │
┌───▼┐ ┌─▼─┐ ┌▼──┐ ┌▼──┐
│Rep1│ │Rep2│ │Rep3│ │Rep4│  ← Read-only queries
└────┘ └───┘ └───┘ └───┘
```

**Implementation**:
```javascript
// Prisma with read replicas
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Primary (write)
    },
  },
});

// Read from replica
const users = await prisma.$queryRaw`
  SELECT * FROM "User" WHERE "accountType" = 'RESEARCHER'
`;

// Write to primary
const newUser = await prisma.user.create({
  data: { ... }
});
```

#### Strategy 3: Connection Pooling

```javascript
// Prisma connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
  },
});
```

#### Strategy 4: Caching (Redis)

```javascript
// Cache frequently accessed data
const redis = require('redis');
const client = redis.createClient();

// Get user profile (with caching)
async function getUserProfile(userId) {
  // Try cache first
  const cached = await client.get(`user:${userId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Cache miss - query database
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // Store in cache (7-day TTL)
  await client.setex(`user:${userId}`, 604800, JSON.stringify(user));

  return user;
}
```

---

### Auto-Scaling Triggers

**Metrics to Monitor**:

| Metric | Scale Up Threshold | Scale Down Threshold |
|--------|-------------------|---------------------|
| **CPU Usage** | > 70% for 5 minutes | < 30% for 10 minutes |
| **Memory Usage** | > 80% for 5 minutes | < 40% for 10 minutes |
| **Request Queue** | > 100 requests | < 10 requests |
| **Response Time** | > 2 seconds (p95) | < 500ms (p95) |
| **Error Rate** | > 1% | < 0.1% |
| **Concurrent Users** | > 80% of capacity | < 40% of capacity |

**Auto-Scaling Configuration (AWS Example)**:
```json
{
  "AutoScalingGroupName": "hospitiumris-asg",
  "MinSize": 2,
  "MaxSize": 10,
  "DesiredCapacity": 3,
  "HealthCheckType": "ELB",
  "HealthCheckGracePeriod": 300,
  "TargetGroupARNs": ["arn:aws:elasticloadbalancing:..."],
  "ScalingPolicies": [
    {
      "PolicyName": "scale-up",
      "AdjustmentType": "ChangeInCapacity",
      "ScalingAdjustment": 2,
      "Cooldown": 300,
      "MetricAggregationType": "Average",
      "TargetTrackingConfiguration": {
        "PredefinedMetricSpecification": {
          "PredefinedMetricType": "ASGAverageCPUUtilization"
        },
        "TargetValue": 70.0
      }
    },
    {
      "PolicyName": "scale-down",
      "AdjustmentType": "ChangeInCapacity",
      "ScalingAdjustment": -1,
      "Cooldown": 600
    }
  ]
}
```

---

### Scaling Recommendation for HospitiumRIS

**Current State (< 1,000 users)**:
- ✅ Single server (vertical scaling only)
- ✅ 4 CPU, 8GB RAM
- ✅ No load balancer needed
- ✅ Simple Docker Compose deployment

**Near Future (1,000 - 5,000 users)**:
- ✅ Vertical scaling to 8 CPU, 16GB RAM
- ✅ Add Redis caching
- ✅ Database optimization (indexes, query optimization)
- ✅ Consider read replica for database

**Medium Term (5,000 - 10,000 users)**:
- ✅ Horizontal scaling (2-3 app instances)
- ✅ Load balancer (Nginx or cloud LB)
- ✅ Database read replicas
- ✅ CDN for static assets
- ✅ Docker Swarm or managed container service

**Long Term (10,000+ users)**:
- ✅ Auto-scaling (3-10 instances)
- ✅ Kubernetes or managed container orchestration
- ✅ Multi-region deployment
- ✅ Database sharding (if needed)
- ✅ Microservices architecture (if complexity warrants)

---

## 5. CI/CD Pipeline

### GitHub Actions Workflow

**File**: `.github/workflows/deploy.yml`

```yaml
name: Deploy HospitiumRIS

on:
  push:
    branches:
      - develop  # Deploy to staging
      - main     # Deploy to production
  pull_request:
    branches:
      - develop
      - main

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Job 1: Build and Test
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test

      - name: Run Prisma validation
        run: npx prisma validate

      - name: Build application
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: .next

  # Job 2: Security Scan
  security-scan:
    runs-on: ubuntu-latest
    needs: build-and-test
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  # Job 3: Build Docker Image
  build-docker:
    runs-on: ubuntu-latest
    needs: [build-and-test, security-scan]
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Job 4: Deploy to Staging
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build-docker
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.hospitium.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to staging server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/hospitiumris
            docker-compose pull
            docker-compose up -d
            docker-compose exec -T app npx prisma migrate deploy
            docker-compose restart app

      - name: Run smoke tests
        run: |
          sleep 30
          curl -f https://staging.hospitium.com/api/health || exit 1

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Staging deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  # Job 5: Deploy to Production
  deploy-production:
    runs-on: ubuntu-latest
    needs: build-docker
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://hospitium.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Create database backup
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            /opt/scripts/backup-database.sh

      - name: Deploy to production server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/hospitiumris
            docker-compose pull
            docker-compose up -d --no-deps --build app
            docker-compose exec -T app npx prisma migrate deploy
            docker-compose restart app

      - name: Run smoke tests
        run: |
          sleep 30
          curl -f https://hospitium.com/api/health || exit 1

      - name: Monitor for errors
        run: |
          sleep 60
          # Check error rate from monitoring system
          # Rollback if error rate > 1%

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  # Job 6: Rollback (if needed)
  rollback:
    runs-on: ubuntu-latest
    if: failure()
    needs: [deploy-staging, deploy-production]
    steps:
      - name: Rollback deployment
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/hospitiumris
            docker-compose down
            docker-compose up -d --force-recreate
            /opt/scripts/restore-database.sh

      - name: Notify rollback
        uses: 8398a7/action-slack@v3
        with:
          status: 'failure'
          text: 'Deployment failed - rollback initiated'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

### Pipeline Stages Explained

```
┌──────────────────────────────────────────────────────────────┐
│                     CI/CD Pipeline Flow                       │
└──────────────────────────────────────────────────────────────┘

1. Code Commit
   ├── Developer pushes to feature branch
   └── Creates pull request to 'develop'

2. Build & Test (Automated)
   ├── Checkout code
   ├── Install dependencies
   ├── Run linter (code quality)
   ├── Run unit tests
   ├── Run integration tests
   ├── Validate Prisma schema
   └── Build application

3. Security Scan (Automated)
   ├── npm audit (dependency vulnerabilities)
   ├── Snyk scan (code vulnerabilities)
   └── SAST (static analysis)

4. Build Docker Image (Automated)
   ├── Build Docker image
   ├── Tag with version/commit SHA
   ├── Push to container registry
   └── Cache layers for faster builds

5. Deploy to Staging (Automated on merge to 'develop')
   ├── Pull latest Docker image
   ├── Run database migrations
   ├── Deploy containers
   ├── Run smoke tests
   └── Notify team

6. Manual Testing (Human)
   ├── QA team tests features
   ├── Product manager approval
   └── Merge to 'main' when ready

7. Deploy to Production (Automated on merge to 'main')
   ├── Require manual approval (GitHub environment protection)
   ├── Create database backup
   ├── Pull latest Docker image
   ├── Run database migrations (with backup)
   ├── Deploy containers (blue-green or rolling)
   ├── Run smoke tests
   ├── Monitor for errors (5 minutes)
   └── Auto-rollback if critical errors

8. Post-Deployment
   ├── Monitor metrics (error rate, response time)
   ├── Verify all features working
   ├── Update documentation
   └── Notify stakeholders
```

---

## 6. Deployment Workflows

### Blue-Green Deployment

**Strategy**: Maintain two identical production environments (Blue and Green)

```
┌─────────────────────────────────────────────────────────┐
│              Blue-Green Deployment Process               │
└─────────────────────────────────────────────────────────┘

Initial State:
┌──────────┐
│   Blue   │ ← Production traffic (current version)
└──────────┘
┌──────────┐
│  Green   │ ← Idle (standby)
└──────────┘

Step 1: Deploy new version to Green
┌──────────┐
│   Blue   │ ← Production traffic (v1.0)
└──────────┘
┌──────────┐
│  Green   │ ← New version deployed (v1.1)
└──────────┘

Step 2: Test Green environment
┌──────────┐
│   Blue   │ ← Production traffic (v1.0)
└──────────┘
┌──────────┐
│  Green   │ ← Testing v1.1 (smoke tests)
└──────────┘

Step 3: Switch traffic to Green
┌──────────┐
│   Blue   │ ← Idle (v1.0 - rollback ready)
└──────────┘
┌──────────┐
│  Green   │ ← Production traffic (v1.1)
└──────────┘

Step 4: Monitor and verify
┌──────────┐
│   Blue   │ ← Can rollback if issues
└──────────┘
┌──────────┐
│  Green   │ ← Production traffic (v1.1)
└──────────┘

Step 5: Update Blue for next deployment
┌──────────┐
│   Blue   │ ← Idle (ready for next version)
└──────────┘
┌──────────┐
│  Green   │ ← Production traffic (v1.1)
└──────────┘
```

**Implementation (Docker Compose)**:
```yaml
version: '3.8'

services:
  app-blue:
    image: hospitiumris:v1.0
    environment:
      - DEPLOYMENT_COLOR=blue
    networks:
      - app-network

  app-green:
    image: hospitiumris:v1.1
    environment:
      - DEPLOYMENT_COLOR=green
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx-blue-green.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
      - "443:443"
    networks:
      - app-network

networks:
  app-network:
```

**Nginx Configuration**:
```nginx
# Switch between blue and green by changing upstream
upstream app_servers {
    server app-green:3000;  # Change to app-blue:3000 for rollback
}

server {
    listen 80;
    location / {
        proxy_pass http://app_servers;
    }
}
```

**Advantages**:
- ✅ Zero downtime deployments
- ✅ Instant rollback (switch back to blue)
- ✅ Full testing in production-like environment
- ✅ Reduced risk

**Disadvantages**:
- ❌ Requires 2x infrastructure (higher cost)
- ❌ Database migrations can be tricky
- ❌ More complex setup

---

### Rolling Deployment

**Strategy**: Gradually replace old instances with new ones

```
Initial State: 3 instances running v1.0
┌────┐ ┌────┐ ┌────┐
│v1.0│ │v1.0│ │v1.0│
└────┘ └────┘ └────┘

Step 1: Update instance 1
┌────┐ ┌────┐ ┌────┐
│v1.1│ │v1.0│ │v1.0│
└────┘ └────┘ └────┘

Step 2: Update instance 2
┌────┐ ┌────┐ ┌────┐
│v1.1│ │v1.1│ │v1.0│
└────┘ └────┘ └────┘

Step 3: Update instance 3
┌────┐ ┌────┐ ┌────┐
│v1.1│ │v1.1│ │v1.1│
└────┘ └────┘ └────┘
```

**Implementation (Docker Swarm)**:
```yaml
version: '3.8'

services:
  app:
    image: hospitiumris:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1      # Update 1 instance at a time
        delay: 30s          # Wait 30s between updates
        failure_action: rollback
        monitor: 60s
        max_failure_ratio: 0.3
      rollback_config:
        parallelism: 1
        delay: 10s
```

**Deployment Command**:
```bash
# Update service with new image
docker service update --image hospitiumris:v1.1 hospitiumris_app

# Monitor rollout
docker service ps hospitiumris_app
```

**Advantages**:
- ✅ No additional infrastructure needed
- ✅ Gradual rollout (can catch issues early)
- ✅ Automatic rollback on failure
- ✅ Zero downtime

**Disadvantages**:
- ❌ Slower deployment (sequential updates)
- ❌ Mixed versions running during deployment
- ❌ Requires health checks

---

### Canary Deployment

**Strategy**: Deploy to small subset of users first, then gradually increase

```
Initial State: All traffic to v1.0
┌────────────────────────────────┐
│  100% traffic → v1.0           │
└────────────────────────────────┘

Step 1: Deploy v1.1 to 5% of users
┌────────────────────────────────┐
│  95% traffic → v1.0            │
│   5% traffic → v1.1 (canary)   │
└────────────────────────────────┘

Step 2: Increase to 25% if no issues
┌────────────────────────────────┐
│  75% traffic → v1.0            │
│  25% traffic → v1.1            │
└────────────────────────────────┘

Step 3: Increase to 50%
┌────────────────────────────────┐
│  50% traffic → v1.0            │
│  50% traffic → v1.1            │
└────────────────────────────────┘

Step 4: Full rollout
┌────────────────────────────────┐
│  100% traffic → v1.1           │
└────────────────────────────────┘
```

**Implementation (Nginx)**:
```nginx
upstream app_v1 {
    server app-v1:3000;
}

upstream app_v1_1 {
    server app-v1-1:3000;
}

split_clients "${remote_addr}" $backend {
    5%    app_v1_1;   # 5% to canary
    *     app_v1;     # 95% to stable
}

server {
    listen 80;
    location / {
        proxy_pass http://$backend;
    }
}
```

**Advantages**:
- ✅ Minimal risk (small user subset)
- ✅ Real production testing
- ✅ Can catch issues before full rollout
- ✅ Easy rollback (just reduce percentage)

**Disadvantages**:
- ❌ Complex routing logic
- ❌ Requires monitoring and metrics
- ❌ Slower full deployment

---

## 7. Rollback Strategies

### Automatic Rollback

**Triggers**:
- Error rate > 1% for 5 minutes
- Response time > 5 seconds (p95)
- Health check failures > 50%
- Critical errors in logs

**Implementation**:
```yaml
# GitHub Actions rollback job
rollback:
  runs-on: ubuntu-latest
  if: failure()
  steps:
    - name: Rollback to previous version
      run: |
        docker service update --rollback hospitiumris_app
        
    - name: Restore database backup
      run: |
        psql < /backups/pre-deployment-backup.sql
        
    - name: Notify team
      run: |
        curl -X POST $SLACK_WEBHOOK \
          -d '{"text": "🚨 Automatic rollback triggered"}'
```

---

### Manual Rollback

**Process**:
```bash
# 1. Identify previous version
docker images hospitiumris

# 2. Rollback Docker deployment
docker service update --image hospitiumris:v1.0 hospitiumris_app

# 3. Rollback database migrations (if needed)
npx prisma migrate resolve --rolled-back <migration-name>

# 4. Verify rollback
curl https://hospitium.com/api/health

# 5. Monitor for stability
tail -f /var/log/hospitiumris/app.log
```

---

## 8. Monitoring & Health Checks

### Health Check Endpoints

**API Route**: `src/app/api/health/route.js`

```javascript
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import redis from '@/lib/redis';

export async function GET(request) {
  const startTime = Date.now();
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: {},
  };

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    checks.status = 'unhealthy';
    checks.checks.database = {
      status: 'unhealthy',
      error: error.message,
    };
  }

  try {
    // Redis check (if enabled)
    if (redis) {
      await redis.ping();
      checks.checks.redis = {
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    }
  } catch (error) {
    checks.checks.redis = {
      status: 'unhealthy',
      error: error.message,
    };
  }

  // External API checks (optional)
  checks.checks.orcid = await checkExternalAPI('https://orcid.org');
  checks.checks.pubmed = await checkExternalAPI('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/');

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}

async function checkExternalAPI(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
    return {
      status: response.ok ? 'healthy' : 'degraded',
      responseTime: response.headers.get('x-response-time'),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}
```

---

### Monitoring Dashboard

**Metrics to Track**:

| Category | Metric | Alert Threshold |
|----------|--------|----------------|
| **Application** | Response time (p95) | > 2 seconds |
| **Application** | Error rate | > 1% |
| **Application** | Request rate | Baseline ± 50% |
| **Infrastructure** | CPU usage | > 80% |
| **Infrastructure** | Memory usage | > 90% |
| **Infrastructure** | Disk usage | > 85% |
| **Database** | Query time (p95) | > 500ms |
| **Database** | Connection pool | > 80% utilized |
| **Database** | Replication lag | > 10 seconds |
| **External APIs** | ORCID availability | < 99% |
| **External APIs** | PubMed availability | < 99% |

---

## Conclusion

This deployment and orchestration documentation provides a comprehensive guide for deploying HospitiumRIS across different environments and scales.

### Key Recommendations

**Deployment Approach**:
- ✅ Start with **manual deployment** (development)
- ✅ Implement **CI/CD pipeline** (staging and production)
- ✅ Use **GitHub Actions** for automation

**Orchestration**:
- ✅ Start with **Docker Compose** (no orchestration)
- ✅ Migrate to **Docker Swarm** when scaling beyond single server
- ✅ Consider **Kubernetes** only at enterprise scale (10,000+ users)

**Environment Structure**:
- ✅ **Three environments**: Development (local), Staging (cloud), Production (cloud)
- ✅ **Automated deployments**: Staging on merge to `develop`, Production on merge to `main`
- ✅ **Manual approval** required for production deployments

**Scaling**:
- ✅ **Vertical scaling first** (up to 5,000 users)
- ✅ **Horizontal scaling** when needed (5,000+ users)
- ✅ **Auto-scaling** for production (based on CPU, memory, request rate)

**Deployment Strategy**:
- ✅ **Rolling deployment** (recommended for HospitiumRIS)
- ✅ **Blue-green deployment** (for zero-downtime critical updates)
- ✅ **Canary deployment** (for high-risk changes)

---

*Document Version: 1.0*  
*Last Updated: 2026-05-20*  
*Author: DevOps Team*  
*Status: Ready for Implementation*
