/**
 * Append-only audit trail (AuditEvent table).
 *
 * Categories:
 *   AUTH   - sign-in, sign-out, failed attempts, activation, registration
 *   ADMIN  - changes made by global or institution administrators
 *   SYSTEM - background jobs and other platform events
 *
 * Rules (keep these when adding new events):
 *   - Never store passwords, tokens, request bodies or record content.
 *   - `metadata` holds small, non-sensitive context only (e.g. the *names*
 *     of fields that changed, job counts).
 *   - Recording must never break the request: every helper swallows errors.
 */
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { resolveTenantId } from '@/lib/tenant';
import { findInstitutionByEmailDomain } from '@/lib/institution-domain';

export const AUDIT_CATEGORIES = ['AUTH', 'ADMIN', 'SYSTEM'];

export const AUTH_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  REGISTERED: 'REGISTERED',
  REGISTRATION_FAILED: 'REGISTRATION_FAILED',
  ACCOUNT_ACTIVATED: 'ACCOUNT_ACTIVATED',
  ACTIVATION_RESENT: 'ACTIVATION_RESENT',
};

export const LOGIN_FAILURE_REASONS = {
  missing_credentials: 'Email or password missing',
  user_not_found: 'No account with that email',
  account_not_verified: 'Account not activated',
  account_suspended: 'Account suspended or inactive',
  invalid_password: 'Wrong password',
  orcid_not_linked: 'ORCID iD not linked to an account',
  unexpected_error: 'Server error during sign-in',
};

function clip(value, max = 500) {
  if (value == null) return null;
  const text = String(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function clientInfo(request) {
  if (!request?.headers?.get) return { ipAddress: null, userAgent: null };
  const forwarded =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    '';
  let ip = forwarded.split(',')[0].trim() || null;
  if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
  return {
    ipAddress: clip(ip, 64),
    userAgent: clip(request.headers.get('user-agent'), 300),
  };
}

export function actorFields(user) {
  if (!user) return {};
  return {
    actorUserId: user.id,
    actorEmail: user.email || null,
    actorName: `${user.givenName || ''} ${user.familyName || ''}`.trim() || null,
    actorAccountType: user.accountType || null,
    institutionId: resolveTenantId(user),
  };
}

/**
 * Write one audit event. Never throws.
 */
export async function recordAuditEvent(event, request = null) {
  try {
    const info = clientInfo(request);
    await prisma.auditEvent.create({
      data: {
        category: event.category,
        action: event.action,
        outcome: event.outcome || 'SUCCESS',
        reason: clip(event.reason, 100),
        actorUserId: event.actorUserId || null,
        actorEmail: clip(event.actorEmail?.toLowerCase?.() ?? event.actorEmail, 254),
        actorName: clip(event.actorName, 200),
        actorAccountType: event.actorAccountType || null,
        institutionId: event.institutionId || null,
        targetType: event.targetType || null,
        targetId: event.targetId || null,
        summary: clip(event.summary || event.action, 500),
        metadata: event.metadata ?? undefined,
        ipAddress: event.ipAddress ?? info.ipAddress,
        userAgent: event.userAgent ?? info.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to record audit event:', event?.action, error?.message);
  }
}

/**
 * Sign-in / account events.
 * @param {Request} request
 * @param {object} opts { action, user?, email?, outcome?, reason?, method?, summary? }
 */
export async function recordAuthEvent(request, { action, user = null, email = null, outcome, reason, method, summary }) {
  const failed = outcome === 'FAILURE';
  const who = user ? `${user.givenName || ''} ${user.familyName || ''}`.trim() || user.email : email || 'unknown account';
  const defaultSummary = {
    LOGIN_SUCCESS: `Signed in${method === 'orcid' ? ' with ORCID' : ''}`,
    LOGIN_FAILED: `Failed sign-in: ${LOGIN_FAILURE_REASONS[reason] || reason || 'unknown reason'}`,
    LOGOUT: 'Signed out',
    REGISTERED: 'Registered a new account',
    REGISTRATION_FAILED: `Registration failed${reason ? `: ${reason}` : ''}`,
    ACCOUNT_ACTIVATED: 'Activated account',
    ACTIVATION_RESENT: 'Requested a new activation email',
  }[action];

  // Attempts against unknown (or not-yet-linked) accounts are attributed to
  // an institution by email domain, so institution views can show them too.
  let institutionId = user ? resolveTenantId(user) : null;
  const lookupEmail = email || user?.email;
  if (!institutionId && lookupEmail && user?.accountType !== 'GLOBAL_ADMIN') {
    try {
      institutionId = (await findInstitutionByEmailDomain(prisma, lookupEmail))?.id || null;
    } catch {
      institutionId = null;
    }
  }

  await recordAuditEvent(
    {
      category: 'AUTH',
      action,
      outcome: outcome || (failed ? 'FAILURE' : 'SUCCESS'),
      reason,
      ...actorFields(user),
      institutionId,
      actorEmail: user?.email || email || null,
      actorName: user ? who : null,
      summary: summary || defaultSummary || action,
      metadata: method ? { method } : undefined,
    },
    request
  );
}

async function readBodyMeta(request, captureValues = []) {
  try {
    const type = request.headers.get('content-type') || '';
    if (!type.includes('application/json')) return {};
    const body = await request.clone().json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
    // Field NAMES only - values are never stored, except for an explicit
    // allow-list of non-sensitive enumerations (e.g. status, accountType).
    const changedFields = Object.keys(body)
      .filter((key) => !/password|token|secret|hash/i.test(key))
      .slice(0, 25);
    const values = {};
    for (const key of captureValues) {
      const value = body[key];
      if (value == null) continue;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        values[key] = typeof value === 'string' ? value.slice(0, 100) : value;
      } else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
        values[key] = value.slice(0, 25).map((v) => v.slice(0, 60));
      }
    }
    return { changedFields, values };
  } catch {
    return {};
  }
}

async function readResponseJson(response) {
  try {
    const type = response?.headers?.get?.('content-type') || '';
    if (!type.includes('application/json')) return null;
    return await response.clone().json();
  } catch {
    return null;
  }
}

/**
 * Wrap an App Router handler so successful calls are recorded as ADMIN audit
 * events. The handler itself is unchanged.
 *
 *   export const PUT = withAdminAudit(handlePUT, {
 *     action: 'INSTITUTION_UPDATED',
 *     summary: 'Updated institution details',
 *     targetType: 'Institution',
 *     institutionFromParam: 'id',
 *     captureValues: ['enabledModules'],
 *   });
 *
 * config:
 *   action               - AuditEvent.action
 *   summary              - string, or (ctx) => string with ctx { values, params, json }
 *   targetType           - optional
 *   targetParam          - route param holding the target id (default 'id')
 *   targetFromResponse   - (json) => id, for create endpoints
 *   institutionFromParam - route param holding the institution id (global admin routes)
 *   institutionFromResponse - (json) => id
 *   captureValues        - body keys whose (non-sensitive) values are kept
 */
export function withAdminAudit(handler, config) {
  return async function auditedHandler(request, context) {
    const bodyMeta = request ? await readBodyMeta(request, config.captureValues || []) : {};
    const response = await handler(request, context);

    try {
      const status = response?.status ?? 200;
      if (status >= 400) return response;

      const params = context?.params ? await context.params : {};
      const actor = await getAuthenticatedUser();
      if (!actor) return response;

      const json = config.targetFromResponse || config.institutionFromResponse || typeof config.summary === 'function'
        ? await readResponseJson(response)
        : null;

      const targetId =
        (config.targetFromResponse && json ? config.targetFromResponse(json) : null) ||
        params?.[config.targetParam || 'id'] ||
        null;
      const institutionId =
        (config.institutionFromResponse && json ? config.institutionFromResponse(json) : null) ||
        (config.institutionFromParam ? params?.[config.institutionFromParam] : null) ||
        (actor.accountType === 'GLOBAL_ADMIN' ? null : resolveTenantId(actor));

      const values = bodyMeta.values && Object.keys(bodyMeta.values).length ? bodyMeta.values : undefined;
      const summary =
        typeof config.summary === 'function'
          ? config.summary({ values: values || {}, params, json })
          : config.summary;

      const metadata = {};
      if (bodyMeta.changedFields?.length) metadata.changedFields = bodyMeta.changedFields;
      if (values) metadata.values = values;
      metadata.method = request?.method;

      await recordAuditEvent(
        {
          category: 'ADMIN',
          action: config.action,
          ...actorFields(actor),
          institutionId,
          targetType: config.targetType || null,
          targetId,
          summary,
          metadata,
        },
        request
      );
    } catch (error) {
      console.error('Admin audit wrapper failed:', error?.message);
    }

    return response;
  };
}

/**
 * Record a background-job run (SYSTEM category). Used by the Jobs tab.
 */
export async function recordJobRun({ job, outcome = 'SUCCESS', summary, metadata, actor = null, request = null }) {
  await recordAuditEvent(
    {
      category: 'SYSTEM',
      action: 'JOB_RUN',
      outcome,
      ...actorFields(actor),
      institutionId: null,
      targetType: 'Job',
      targetId: job,
      summary: summary || `Ran ${job}`,
      metadata: { job, triggeredBy: actor ? 'manual' : 'schedule', ...(metadata || {}) },
    },
    request
  );
}
