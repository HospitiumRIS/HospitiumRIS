# Operations monitoring & audit

Global admins get three new pages:

| Page | Route | What it shows |
| --- | --- | --- |
| **Operations** | `/global-admin/operations` | A "Needs attention" list, platform KPIs and tabs for **Health**, **Usage by institution**, **Modules**, **Jobs** and **Errors** |
| **Institution activity** | `/global-admin/operations/institutions/[id]` | One institution's activity: KPIs, a daily trend, module usage (including enabled modules nobody uses), accounts by role and status, storage, the most active people (counts only), recent sign-ins and admin changes |
| **Audit log** | `/global-admin/audit` | Sign-ins (including failed attempts), admin changes, module activity and job runs, with search, filters, links you can share and CSV export |

## Data model

Two tables are added by migration `20261105150000_operations_monitoring_audit`.

### `audit_events`: append-only

| category | recorded when | examples |
| --- | --- | --- |
| `AUTH` | sign-in, sign-out and account events | `LOGIN_SUCCESS`, `LOGIN_FAILED` (with `reason`), `LOGOUT`, `REGISTERED`, `ACCOUNT_ACTIVATED`, `ACTIVATION_RESENT` |
| `ADMIN` | a global or institution admin changes something | `INSTITUTION_UPDATED`, `INSTITUTION_ADMIN_INVITED`, `USER_UPDATED`, `DOMAIN_VERIFIED`, `INSTITUTION_DATA_EXPORTED`, `AUDIT_EXPORTED` |
| `SYSTEM` | a background job runs | `JOB_RUN` (`targetId` = job key) |

A database trigger blocks every `UPDATE` except removing personal data, which happens when an account is anonymised. Rows can only be deleted by the retention job.

### `usage_events`: module usage telemetry

One row per page view (`VIEW`) or create/update/delete API call (`ACTION`) by a signed-in, non-global-admin user. Each row holds the user, their institution, the module, a normalised route and the HTTP status.

`users.lastLoginAt` is also added. It is set on every successful sign-in.

## The "non-intrusive" rules

These rules are deliberate. Keep them when extending the system.

1. **Counts and metadata only.** The monitoring code never reads module records (proposals, manuscripts, ethics applications and so on). Admins see *that* someone created something in Projects, never *what* it was.
2. **No content in telemetry.** The tracker (`src/components/UsageTracker.js`) sends only page paths and the method, path and status of API calls. It never sends query strings, request or response bodies, or form values.
3. **No record IDs.** `normalizeRoute()` (`src/lib/ops/modules.js`) replaces IDs, UUIDs, ORCID iDs, emails and long tokens with `:id` before anything is stored.
4. **Server decides identity.** `/api/telemetry/usage` takes the user and institution from the session and ignores anything the client claims.
5. **Admin audit stores field names, not values.** `withAdminAudit()` stores the *names* of the fields that changed. It stores values only for an explicit allow-list of harmless enumerations (status, role, enabled modules), and never anything matching `password|token|secret|hash`.
6. **No passwords or tokens anywhere.**
7. **Anonymisation is honoured.** When an account is anonymised, its audit rows keep the event but lose the email, name, IP address and user agent.
8. **Global admins are not tracked** as module users. Their admin changes are still audited.

## Adding things

**A new page or API area.** Add a rule to `RULES` in `src/lib/ops/modules.js`, and to `OPS_MODULES` if it's a new module, then add a case to `tests/ops-modules.test.js`.

**A new admin mutation.** Rename the handler and wrap it:

```js
async function handlePATCH(request, ctx) { /* unchanged */ }
export const PATCH = withAdminAudit(handlePATCH, {
  action: 'THING_UPDATED',
  summary: 'Changed a thing',
  targetType: 'Thing',
  captureValues: ['status'], // optional, harmless values only
});
```

**A sign-in path.** Call `recordAuthEvent(request, { action, user | email, outcome, reason, method })`.

## Scheduled jobs

Both jobs are shown on **Operations › Jobs**. They are marked overdue after 1.5× their interval, and an admin can run them from there.

| Job | URL | Schedule |
| --- | --- | --- |
| Audit & usage retention | `/api/cron/ops-retention` | daily |
| Anonymise deleted accounts | `/api/cron/anonymize-deleted-users` | daily |

Example crontab entry for the server:

```cron
15 2 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://hospitium.hospitiumris.org/api/cron/ops-retention
30 2 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://hospitium.hospitiumris.org/api/cron/anonymize-deleted-users
```

## Environment

| Variable | Default | Meaning |
| --- | --- | --- |
| `CRON_SECRET` | — (required for cron) | Bearer token for `/api/cron/*` |
| `OPS_USAGE_RETENTION_DAYS` | 365 | Keep module usage events this long |
| `OPS_AUTH_RETENTION_DAYS` | 730 | Keep sign-in events this long |
| `OPS_ADMIN_RETENTION_DAYS` | 2555 (~7 years) | Keep admin changes and job runs this long |

## "Needs attention" rules

| Condition | Severity |
| --- | --- |
| Database not responding, or slower than 500 ms | error / warning |
| Server memory 90% or more used | warning |
| A job failed, is overdue or has never run | error / warning / info |
| 10 or more failed sign-ins from one IP in the last hour | error |
| 5 or more failed sign-ins for one account in 24 h | warning |
| File uploads stuck in `PENDING` for over 1 h | warning |
| Application errors in the activity log in the last 24 h | warning |
| Institutions with accounts but no sign-ins or activity in the period | info |
