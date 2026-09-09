# Docker Deployment Guide

This guide covers running HospitiumRIS in Docker with PostgreSQL and Nginx.

## Architecture

```
                    ┌─────────────┐
   Browser ────────►│   Nginx     │ :80 / :443
                    │  (reverse   │
                    │   proxy)    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Next.js    │ :3000 (internal)
                    │    app      │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │ :5432 (internal)
                    └─────────────┘

Shared volumes: postgres_data, uploads_data, logs_data
```

| Service  | Image              | Role                                      |
|----------|--------------------|-------------------------------------------|
| `nginx`  | nginx:alpine       | Reverse proxy, static uploads, rate limit |
| `app`    | Custom (Dockerfile)| Next.js 16 application server             |
| `postgres` | postgres:16-alpine | Primary database                        |
| `redis`  | redis:7-alpine     | Optional — only with `--profile scaled`   |

## Prerequisites

- Docker Engine 24+
- Docker Compose v2
- At least 4 GB RAM available for builds

## Quick Start (Production)

1. **Copy environment file**

   ```bash
   cp .env.docker.example .env
   ```

   Edit `.env` and set at minimum:
   - `POSTGRES_PASSWORD`
   - `NEXTAUTH_SECRET`
   - `GLOBAL_ADMIN_*` (for first-boot admin creation)

2. **Build and start**

   ```bash
   docker compose up -d --build
   ```

3. **Open the app**

   - Application: http://localhost
   - Health check: http://localhost/api/health

4. **View logs**

   ```bash
   docker compose logs -f app
   ```

## Development with Docker

Development mode mounts source code for hot reload and exposes the app directly (no nginx):

```bash
cp .env.docker.example .env
docker compose -f docker-compose.dev.yml up --build
```

Access at http://localhost:3000

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm run docker:prod` | Build and start production stack |
| `npm run docker:dev` | Start development stack |
| `npm run docker:build` | Build production images only |
| `npm run docker:down` | Stop and remove containers |
| `npm run docker:logs` | Tail application logs |
| `npm run docker:clean` | Remove containers, volumes, and images |

## Environment Variables

See `.env.docker.example` for the full list. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | Yes | Database password |
| `NEXTAUTH_SECRET` | Yes | Session signing secret (32+ chars) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL (e.g. `https://ris.example.com`) |
| `DATABASE_URL` | Auto | Set by compose from postgres credentials |
| `GLOBAL_ADMIN_EMAIL` | Recommended | First-boot admin email |
| `GLOBAL_ADMIN_NAME` | Recommended | First-boot admin display name |
| `GLOBAL_ADMIN_PASSWORD` | Recommended | First-boot admin password |

SMTP, ORCID, CiteReady, and AI keys are optional — features degrade gracefully when unset.

## SSL / TLS

Production TLS is configured in `docker/nginx/default.conf`. To enable HTTPS:

1. Place certificates in `docker/nginx/ssl/`:
   - `fullchain.pem`
   - `privkey.pem`

2. Uncomment the HTTPS `server` block in `docker/nginx/default.conf`.

3. Set `NEXT_PUBLIC_APP_URL` to your HTTPS URL.

For Let's Encrypt, use certbot on the host or a sidecar container and mount certificates into `docker/nginx/ssl/`.

## Data Persistence

| Volume | Contents |
|--------|----------|
| `postgres_data` | Database files |
| `uploads_data` | User uploads (proposals, ethics, training) |
| `logs_data` | Application activity logs |

### Backup database

```bash
docker compose exec postgres pg_dump -U hospitiumris hospitiumris > backup.sql
```

### Restore database

```bash
cat backup.sql | docker compose exec -T postgres psql -U hospitiumris hospitiumris
```

## Scaling (Optional Redis)

Redis is **not required** for a single-instance deployment. Enable it when running multiple app replicas:

```bash
docker compose --profile scaled up -d --scale app=2
```

Note: manuscript presence tracking currently uses in-memory state. Migrate to Redis before horizontal scaling (see `docs/hospitiumris-docker-containerization-0aab55.md`).

## Troubleshooting

### Container exits immediately

Check logs: `docker compose logs app`

Common causes:
- Database not ready — wait for postgres health check
- Missing `POSTGRES_PASSWORD` in `.env`
- Migration failure — inspect app logs for Prisma errors

### Cannot log in / no admin account

Create admin manually:

```bash
docker compose exec app node scripts/create-global-admin.js \
  --email admin@example.com \
  --name "Admin User" \
  --password "securepass123"
```

### Uploads not accessible

Verify the shared volume is mounted on both `app` and `nginx`:

```bash
docker compose exec app ls -la /app/uploads
docker compose exec nginx ls -la /var/www/uploads
```

### Prisma engine errors on Alpine

The schema includes `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` for Alpine compatibility. Rebuild after schema changes:

```bash
docker compose build --no-cache app
```

## Migrating from Local Development

1. Export your local database:
   ```bash
   pg_dump -U username hospitiumris > local-backup.sql
   ```

2. Start Docker stack (creates empty database + runs migrations).

3. Import data:
   ```bash
   cat local-backup.sql | docker compose exec -T postgres psql -U hospitiumris hospitiumris
   ```

4. Copy local uploads into the volume:
   ```bash
   docker compose cp ./uploads/. app:/app/uploads/
   ```

## CI/CD (GitHub Actions)

Production on `mycraft` lives at `/opt/hospitium` with Docker Compose (`hospitium-frontend` + `hospitium-db`). CI lint/build runs on every push. After CI succeeds on `main`, [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) SSHs into the VPS, updates the checkout, rebuilds the app image, and recreates the frontend container. Postgres is left running. The app entrypoint runs `prisma migrate deploy` before `next start`.

You can also run **Actions → Deploy → Run workflow** for a manual deploy.

### One-time server setup

1. `/opt/hospitium` must be a git clone of this repository (not a copy of files only).
2. Generate a deploy key and authorize it for the SSH user that can run Docker (root works today; `adminuser` currently cannot talk to `docker.sock`):

   ```bash
   ssh-keygen -t ed25519 -C "github-actions-hospitium" -f github-actions-hospitium -N ""
   # install github-actions-hospitium.pub into that user's ~/.ssh/authorized_keys
   ```

3. If you deploy as `adminuser` instead of root, grant Docker access:

   ```bash
   sudo usermod -aG docker adminuser
   ```

   Then log out and back in (or reboot) so the new group applies.

4. Confirm a manual deploy still works:

   ```bash
   cd /opt/hospitium
   bash scripts/deploy.sh
   ```

### GitHub repository secrets

Repo **Settings → Secrets and variables → Actions**:

| Secret | Example | Notes |
|--------|---------|--------|
| `SSH_HOST` | `mycraft` IP or hostname | VPS address |
| `SSH_USER` | `root` | Must be able to run `docker` (or passwordless `sudo docker`) |
| `SSH_PRIVATE_KEY` | contents of `github-actions-hospitium` | Full private key including `BEGIN` / `END` lines |
| `SSH_PORT` | `22` | Optional; defaults to 22 |
| `DEPLOY_PATH` | `/opt/hospitium` | Optional; defaults to `/opt/hospitium` |

The workflow uses a GitHub Environment named `production`. Create it under **Settings → Environments** if you want required reviewers before deploys.

GitHub-hosted runners must be able to SSH to the VPS. If port 22 is firewalled to your office IP only, either allow GitHub’s [published SSH IPs](https://api.github.com/meta) (`actions` ranges) or install a self-hosted runner on `mycraft`.

The server compose file (`docker-compose.yml` and any `docker-compose.override.yml`) is preserved on each deploy so live container names (`hospitium-frontend`, `hospitium-db`) and ports (`3003`, `5435`) are not overwritten by the repo copy.

### What a deploy does

1. Fetch the commit that passed CI and `git reset --hard` to it
2. `pg_dump` into `/opt/hospitium/backups/pre-deploy-*.sql.gz` (keeps the last 10)
3. `docker compose build app` with `NEXT_PUBLIC_*` from the server `.env`
4. Recreate only the `app` service (`--no-deps`); entrypoint waits for Postgres, runs `prisma migrate deploy`, then starts the app
5. Wait until the container is healthy and `/api/health` returns OK

## Security Notes

- Change all default passwords before production use
- Do not commit `.env` files
- Nginx exposes only ports 80/443 externally
- Database port is internal-only in production compose
- Set `NEXT_PUBLIC_APP_URL` to your real domain for correct OAuth redirects
