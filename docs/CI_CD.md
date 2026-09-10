# CI/CD: GitHub Actions to the production VPS

This guide is the step-by-step setup for deploying HospitiumRIS from GitHub to the production server (`mycraft`), including frontend rebuilds and Prisma database migrations.

Live app: `https://hospitium.hospitiumris.org`  
Server path: `/opt/hospitium`

## What runs in production

Docker Compose on the VPS:

| Container            | Role                         | Host port |
|----------------------|------------------------------|-----------|
| `hospitium-frontend` | Next.js app (`hospitium-app` image) | `3003` → `3000` |
| `hospitium-db`       | PostgreSQL 16                | `5435` → `5432` |

Compose **service** names are `app` and `postgres`. Nginx on the host (under `/opt/nginx`) terminates HTTPS; it is not part of this Compose stack.

`adminuser` cannot talk to Docker (`permission denied` on `/var/run/docker.sock`). Deploys SSH as **root**.

## Files that make up the pipeline

| File | Role |
|------|------|
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | Lint + build check on every push and on PRs to `main` |
| [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | On push to `main` (or manual **Run workflow**): build on GitHub, then SSH to the VPS |
| [`scripts/deploy.sh`](../scripts/deploy.sh) | On the server: DB backup, rebuild frontend, recreate app container, wait for health |
| [`docker/scripts/docker-entrypoint.sh`](../docker/scripts/docker-entrypoint.sh) | On every app container start: wait for Postgres, `prisma migrate deploy`, then start Next.js |
| `/opt/hospitium/.env` | **On the server only.** Database URL, Postgres credentials, SMTP, OAuth, API keys. Never commit this file. |

The GitHub runner uses a dummy `DATABASE_URL`. It does **not** connect to production.

## End-to-end workflow

```
Developer pushes to main
        │
        ▼
┌─────────────────┐     ┌──────────────────────────┐
│  CI workflow    │     │  Deploy workflow         │
│  lint + build   │     │  1. npm ci && npm build  │
│  (status check) │     │  2. SSH to VPS as root   │
└─────────────────┘     └────────────┬─────────────┘
                                     │
                                     ▼
                        /opt/hospitium
                        • preserve docker-compose.yml
                        • git fetch + reset to that commit
                        • restore compose file
                        • scripts/deploy.sh
                              │
                              ├─ pg_dump → backups/pre-deploy-*.sql.gz
                              ├─ docker compose build app
                              └─ recreate app only (--no-deps)
                                     │
                                     ▼
                        container entrypoint
                        • wait for Postgres
                        • prisma migrate deploy
                        • start node server.js
                        • health check /api/health
```

Postgres is **not** stopped. Do not use `docker compose down` in this pipeline.

The server `docker-compose.yml` is preserved so live container names (`hospitium-frontend`, `hospitium-db`) and published ports are not overwritten by the repo copy.

---

## One-time setup

### 1. Server: git clone at `/opt/hospitium`

The directory must be a git clone of this repository, not a copy of files only.

```bash
sudo -i
cd /opt/hospitium
git status
```

### 2. Server: SSH key for GitHub Actions

Generate the key **on the server as root** (or on your PC; the public key still has to land in root’s `authorized_keys`).

```bash
ssh-keygen -t ed25519 -C "github-actions-hospitium" -f /root/.ssh/github-actions-hospitium -N ""
```

If `ssh-keygen` wrote files under `/opt/hospitium`, move them out of the git tree:

```bash
mv /opt/hospitium/github-actions-hospitium /root/.ssh/github-actions-hospitium
mv /opt/hospitium/github-actions-hospitium.pub /root/.ssh/github-actions-hospitium.pub
chmod 600 /root/.ssh/github-actions-hospitium
```

Allow this key to log in as root:

```bash
mkdir -p /root/.ssh
chmod 700 /root/.ssh
cat /root/.ssh/github-actions-hospitium.pub >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
```

If you used the default name `id_ed25519` instead, substitute `/root/.ssh/id_ed25519` and `.pub`.

### 3. How to get `SSH_HOST`

`SSH_HOST` is the address you can reach from the public internet — the GCP **External IP**, or a DNS name that points at it. It is not `mycraft` unless that name resolves globally. It is not the internal `10.x` address.

On the VM:

```bash
curl -4 ifconfig.me
```

Or in GCP Console → VM instance `mycraft` → **External IP**.

### 4. GitHub: `production` environment secrets

Use **Environment secrets**, not Repository secrets. The deploy job is pinned to `environment: production`.

1. Repo **Settings → Environments → New environment**
2. Name it exactly `production`
3. Under **Environment secrets → Add secret**, add:

| Secret | Value |
|--------|--------|
| `SSH_HOST` | External IP or public hostname |
| `SSH_USER` | `root` |
| `SSH_PRIVATE_KEY` | Full private key, including `BEGIN OPENSSH PRIVATE KEY` / `END OPENSSH PRIVATE KEY` |
| `SSH_PORT` | `22` |
| `DEPLOY_PATH` | `/opt/hospitium` |

Display the private key on the server (`cat` the file **without** `.pub`). Paste the whole block. Do **not** paste the SHA256 fingerprint. Do **not** paste the `.pub` line.

Optional: turn on required reviewers on the `production` environment after deploys are working.

### 5. Firewall

GitHub-hosted runners must be able to SSH to port 22. If the VM firewall only allows your office IP, either allow GitHub’s [Actions IP ranges](https://api.github.com/meta) or use a self-hosted runner on the VPS.

### 6. First deploy

After secrets are saved and the workflow files are on `main`:

1. **Actions → Deploy → Run workflow** (or push a commit to `main`)
2. Open the run. **Build application** should pass, then **Deploy to VPS** must actually run — not “This job was skipped”
3. When it succeeds, the repo **Deployments** sidebar should show **Production** as active

---

## What each GitHub workflow does

### CI (`.github/workflows/ci.yml`)

- Triggers: every push, and pull requests targeting `main`
- Jobs: **Lint** (`npm run lint`), **Build Check** (`npm run build` with dummy env)
- Does not SSH and does not touch the database
- A red X on a commit means CI failed (often lint). Deploy to `main` can still succeed because Deploy no longer waits on CI

### Deploy (`.github/workflows/deploy.yml`)

- Triggers: push to `main`, or **Actions → Deploy → Run workflow**
- Job **Build application**: `npm ci` + `npm run build` on `ubuntu-latest`
- Job **Deploy to VPS** (`needs: [build]`, `environment: production`):
  1. SSH into the VPS
  2. Preserve `docker-compose.yml` / override files
  3. `git reset --hard` to the commit being deployed
  4. Restore compose files
  5. Run `bash scripts/deploy.sh`

`scripts/deploy.sh` then:

1. Backs up Postgres to `/opt/hospitium/backups/pre-deploy-YYYYMMDD-HHMMSS.sql.gz` (keeps the last 10)
2. Builds the `app` image with `NEXT_PUBLIC_*` from the server `.env`
3. Recreates **only** the app service (`docker compose up -d --no-deps --force-recreate`)
4. Waits until the container is healthy
5. Runs `prisma migrate status`
6. Hits `/api/health`

---

## Database URL and migrations

### Where the connection string lives

On the VPS, in **`/opt/hospitium/.env`**:

```env
DATABASE_URL="postgresql://USER:PASSWORD@postgres:5432/hospitiumris?schema=public"
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_DB=hospitiumris
```

Host `postgres` is the Compose **service name**, so the app container can reach the DB on the Docker network. Do not use `localhost` inside the app container.

`docker-compose.yml` on the server also sets `DATABASE_URL` on the `app` service from `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`. That Compose `environment:` value overrides `.env` when both are present.

Prisma reads it from `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### When migrations run

Every time the frontend container starts, `docker/scripts/docker-entrypoint.sh` runs:

```sh
prisma migrate deploy
```

That applies any new folders under `prisma/migrations/`. A successful deploy log looks like:

```
==> Running database migrations...
Datasource "db": PostgreSQL database "hospitiumris" ... at "postgres:5432"
Applying migration `...`
Database schema is up to date!
```

### Confirm migrations

```bash
cd /opt/hospitium
docker compose logs app | grep -A 25 "Running database migrations"
docker compose exec -T app prisma migrate status
```

You want `Database schema is up to date!`

---

## Useful server commands

Become root first (`sudo -i`). `adminuser` cannot use Docker.

```bash
cd /opt/hospitium
docker compose ps
docker compose logs -f app
```

### List users

Passwords are bcrypt hashes in `users.passwordHash`. You cannot recover the original password.

**One-shot** (prints rows and exits):

```bash
docker compose exec -T postgres psql -U postgres -d hospitiumris -c 'SELECT email, "givenName", "familyName", "accountType", status FROM users ORDER BY "createdAt";'
```

**Interactive** (you should see `hospitiumris=#`). Do **not** use `-T` here — `-T` hides the prompt and looks like a hang:

```bash
docker compose exec postgres psql -U postgres -d hospitiumris
```

If the service name is not `postgres`:

```bash
docker exec -it hospitium-db psql -U postgres -d hospitiumris
```

If you see `role "root" does not exist`, the host shell expanded an empty `$POSTGRES_USER`. Pass `-U postgres` explicitly, or expand variables **inside** the container:

```bash
docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT email FROM users;"'
```

### Manual deploy on the server

```bash
cd /opt/hospitium
bash scripts/deploy.sh
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|--------|-----|
| Deploy job **skipped** in 1s | Old workflow waited for CI to succeed (`workflow_run`) | Current `deploy.yml` runs on push to `main`. Re-run **Deploy**, do not re-run the skipped job |
| **Production inactive** in Deployments | The `production` environment job never completed successfully | Need a green **Deploy to VPS** run, not a skipped job |
| Green **Production — some-other-host** plus inactive Production | Another host (e.g. a previous platform) also reports a Production environment | The VPS deploy is the GitHub Environment named `production` |
| `ssh: unable to authenticate` | Public key not in `/root/.ssh/authorized_keys`, wrong user, or `SSH_PRIVATE_KEY` is the fingerprint/`.pub` | `SSH_USER=root`; paste full private key |
| `permission denied` on `docker.sock` | SSH user is `adminuser` | Set `SSH_USER` to `root`, or `usermod -aG docker adminuser` |
| `psql` appears stuck | `docker compose exec -T` with interactive `psql` | Drop `-T` for a prompt, or add `-c 'SQL'` for a one-shot |
| `role "root" does not exist` | `$POSTGRES_USER` empty on the host | `-U postgres -d hospitiumris` |
| `/opt/hospitium is not a git clone` | Directory was copied without `.git` | Clone the GitHub repo into that path |

---

## What this pipeline does not do

- Does not `docker compose down` (that would stop Postgres)
- Does not SCP the whole repo onto the server (that would overwrite `.env` and compose)
- Does not store production `DATABASE_URL` in GitHub secrets
- Does not deploy from feature branches — only `main` (plus manual **Run workflow**)

See also [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for Compose, volumes, SSL, and local Docker usage.
