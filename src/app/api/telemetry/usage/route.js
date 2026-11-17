import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { resolveTenantId } from '@/lib/tenant';
import { resolveModule, normalizeRoute, actionFromMethod } from '@/lib/ops/modules';

const MAX_EVENTS_PER_BATCH = 50;

/**
 * Receives batched, privacy-preserving usage events from <UsageTracker />.
 *
 * Body: { events: [{ kind: 'VIEW'|'ACTION', path, method?, status?, at? }] }
 *
 * The user and institution always come from the session cookie, never from
 * the client. Paths are mapped to a module and normalised (IDs -> :id);
 * query strings, bodies and record content are never accepted.
 */
export async function POST(request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return new NextResponse(null, { status: 204 });
  }

  let body;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const incoming = Array.isArray(body?.events) ? body.events.slice(0, MAX_EVENTS_PER_BATCH) : [];
  const institutionId = resolveTenantId(user);
  const now = Date.now();

  const rows = [];
  for (const event of incoming) {
    if (!event || typeof event.path !== 'string') continue;
    const kind = event.kind === 'ACTION' ? 'ACTION' : 'VIEW';
    const moduleKey = resolveModule(event.path);
    if (!moduleKey) continue;

    const action = kind === 'ACTION' ? actionFromMethod(event.method) : null;
    if (kind === 'ACTION' && !action) continue;

    // Accept client timestamps only if they're within the last 10 minutes.
    const at = Number(event.at);
    const createdAt = Number.isFinite(at) && at <= now && now - at < 10 * 60 * 1000 ? new Date(at) : new Date(now);
    const status = Number.parseInt(event.status, 10);

    rows.push({
      userId: user.id,
      institutionId,
      accountType: user.accountType,
      module: moduleKey,
      kind,
      action,
      route: normalizeRoute(event.path),
      statusCode: Number.isFinite(status) && status >= 100 && status < 600 ? status : null,
      createdAt,
    });
  }

  if (rows.length) {
    try {
      await prisma.usageEvent.createMany({ data: rows });
    } catch (error) {
      console.error('Failed to store usage events:', error?.message);
    }
  }

  return new NextResponse(null, { status: 204 });
}
