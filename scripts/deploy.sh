#!/usr/bin/env bash
# Production deploy for the mycraft Docker Compose stack.
# Rebuilds the frontend image, recreates the app container (entrypoint runs
# `prisma migrate deploy`), and leaves postgres running.
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/opt/hospitium}"
APP_SERVICE="${APP_SERVICE:-app}"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
HEALTH_WAIT_SECONDS="${HEALTH_WAIT_SECONDS:-240}"
BACKUP_KEEP="${BACKUP_KEEP:-10}"

cd "$DEPLOY_PATH"

if docker info >/dev/null 2>&1; then
  DOCKER=(docker)
elif sudo -n docker info >/dev/null 2>&1; then
  DOCKER=(sudo docker)
else
  echo "ERROR: cannot talk to the Docker daemon."
  echo "Use SSH_USER=root, or add this user to the docker group:"
  echo "  sudo usermod -aG docker \"\$USER\""
  exit 1
fi

COMPOSE=("${DOCKER[@]}" compose)

detect_running_stack() {
  local cid=""
  cid="$("${DOCKER[@]}" ps -qf name=hospitium-frontend | head -n1)"
  if [ -z "$cid" ]; then
    return 0
  fi

  local project service
  project="$("${DOCKER[@]}" inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' "$cid" || true)"
  service="$("${DOCKER[@]}" inspect -f '{{index .Config.Labels "com.docker.compose.service"}}' "$cid" || true)"
  if [ -n "$project" ]; then
    COMPOSE_PROJECT_NAME="$project"
  fi
  if [ -n "$service" ]; then
    APP_SERVICE="$service"
  fi
}

detect_running_stack

if [ -n "${COMPOSE_PROJECT_NAME:-}" ]; then
  COMPOSE+=(-p "$COMPOSE_PROJECT_NAME")
fi

echo "==> Docker: $("${DOCKER[@]}" --version)"
echo "==> Compose project in ${DEPLOY_PATH} (project=${COMPOSE_PROJECT_NAME:-default} service=${APP_SERVICE})"
"${COMPOSE[@]}" ps

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

backup_dir="${DEPLOY_PATH}/backups"
mkdir -p "$backup_dir"
stamp="$(date +%Y%m%d-%H%M%S)"
backup_file="${backup_dir}/pre-deploy-${stamp}.sql.gz"

echo "==> Backing up database to ${backup_file}"
"${COMPOSE[@]}" exec -T "$POSTGRES_SERVICE" \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  | gzip > "$backup_file"

if [ ! -s "$backup_file" ]; then
  echo "ERROR: database backup was empty"
  rm -f "$backup_file"
  exit 1
fi

echo "==> Backup size: $(du -h "$backup_file" | awk '{print $1}')"
# shellcheck disable=SC2012
ls -1t "$backup_dir"/pre-deploy-*.sql.gz 2>/dev/null | tail -n +$((BACKUP_KEEP + 1)) | xargs -r rm -f || true

echo "==> Building ${APP_SERVICE} image"
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

build_args=(
  --build-arg "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-}"
  --build-arg "NEXT_PUBLIC_ORCID_CLIENT_ID=${NEXT_PUBLIC_ORCID_CLIENT_ID:-}"
  --build-arg "NEXT_PUBLIC_ORCID_REDIRECT_URI=${NEXT_PUBLIC_ORCID_REDIRECT_URI:-}"
  --build-arg "NEXT_PUBLIC_ORCID_SCOPE=${NEXT_PUBLIC_ORCID_SCOPE:-}"
  --build-arg "NEXT_PUBLIC_ORCID_SANDBOX_URL=${NEXT_PUBLIC_ORCID_SANDBOX_URL:-}"
  --build-arg "NEXT_PUBLIC_ORCID_TOKEN_URL=${NEXT_PUBLIC_ORCID_TOKEN_URL:-}"
)

"${COMPOSE[@]}" build "${build_args[@]}" "$APP_SERVICE"

echo "==> Recreating ${APP_SERVICE} (migrations run in the container entrypoint)"
"${COMPOSE[@]}" up -d --no-deps --force-recreate --no-build "$APP_SERVICE"

app_id="$("${COMPOSE[@]}" ps -q "$APP_SERVICE")"
if [ -z "$app_id" ]; then
  echo "ERROR: ${APP_SERVICE} container was not created"
  "${COMPOSE[@]}" logs --tail 120 "$APP_SERVICE"
  exit 1
fi

echo "==> Waiting up to ${HEALTH_WAIT_SECONDS}s for ${APP_SERVICE} to become healthy"
deadline=$((SECONDS + HEALTH_WAIT_SECONDS))
status=""
while [ "$SECONDS" -lt "$deadline" ]; do
  status="$("${DOCKER[@]}" inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$app_id" 2>/dev/null || echo missing)"
  echo "    status: ${status}"
  if [ "$status" = "healthy" ]; then
    break
  fi
  if [ "$status" = "exited" ] || [ "$status" = "dead" ] || [ "$status" = "missing" ]; then
    echo "ERROR: ${APP_SERVICE} failed to start"
    "${COMPOSE[@]}" logs --tail 160 "$APP_SERVICE"
    exit 1
  fi
  sleep 5
done

if [ "$status" != "healthy" ]; then
  echo "ERROR: timed out waiting for ${APP_SERVICE} health check"
  "${COMPOSE[@]}" logs --tail 160 "$APP_SERVICE"
  exit 1
fi

echo "==> Confirming Prisma migrations"
"${COMPOSE[@]}" exec -T "$APP_SERVICE" prisma migrate status

echo "==> Health endpoint"
"${COMPOSE[@]}" exec -T "$APP_SERVICE" node -e "fetch('http://127.0.0.1:3000/api/health').then(async r => { const b = await r.text(); console.log(b); process.exit(r.ok ? 0 : 1); }).catch(err => { console.error(err); process.exit(1); })"

echo "==> Cleaning dangling images"
"${DOCKER[@]}" image prune -f >/dev/null || true

echo "==> Deployment complete"
"${COMPOSE[@]}" ps
