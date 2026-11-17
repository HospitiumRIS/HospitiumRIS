/**
 * Read recent application errors from the activity log (logs/activity.log).
 *
 * Only the tail of the file is read so this stays cheap even when the log is
 * large (see issue #37 for moving logs to structured storage). Expected
 * sign-in failures are excluded - they live in the audit trail instead.
 */
import fs from 'fs/promises';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'logs', 'activity.log');
const TAIL_BYTES = 4 * 1024 * 1024;

const EXPECTED_AUTH_REASONS = new Set([
  'missing_credentials',
  'user_not_found',
  'account_not_verified',
  'account_not_activated',
  'account_suspended',
  'invalid_password',
]);

function isExpectedNoise(entry) {
  const meta = entry.metadata || {};
  if (EXPECTED_AUTH_REASONS.has(meta.reason)) return true;
  if (typeof meta.endpoint === 'string' && meta.endpoint.startsWith('/api/auth/') && meta.statusCode < 500) return true;
  if (meta.error === 'invalid_credentials' || meta.error === 'validation_failed') return true;
  return false;
}

async function readTail() {
  let handle;
  try {
    handle = await fs.open(LOG_FILE, 'r');
    const { size } = await handle.stat();
    const length = Math.min(size, TAIL_BYTES);
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, size - length);
    const text = buffer.toString('utf8');
    const lines = text.split('\n');
    if (size > length) lines.shift(); // first line is probably partial
    return lines;
  } catch {
    return [];
  } finally {
    await handle?.close().catch(() => {});
  }
}

/**
 * @returns {Promise<{ total: number, errors: Array }>}
 */
export async function readRecentErrors({ hours = 24, limit = 100 } = {}) {
  const since = Date.now() - hours * 60 * 60 * 1000;
  const lines = await readTail();
  const errors = [];

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (!line || !line.includes('"ERROR"')) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (entry.level !== 'ERROR') continue;
    const at = Date.parse(entry.timestamp);
    if (!Number.isFinite(at)) continue;
    if (at < since) break;
    if (isExpectedNoise(entry)) continue;

    const meta = entry.metadata || {};
    errors.push({
      timestamp: entry.timestamp,
      message: String(entry.message || '').slice(0, 300),
      endpoint: meta.endpoint || meta.url || null,
      statusCode: meta.statusCode || null,
      detail: typeof meta.error === 'string' ? meta.error.slice(0, 300) : null,
      userId: meta.userId || null,
    });
  }

  return { total: errors.length, errors: errors.slice(0, limit) };
}
