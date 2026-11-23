/**
 * Minimal in-memory fixed-window rate limiter for a single app instance.
 * Good enough to slow down guessing (e.g. 6-digit check-in codes); state is lost
 * on restart and is not shared between instances.
 */

const buckets = new Map();
const MAX_KEYS = 50_000;

/**
 * @param {string} key
 * @param {{ limit: number, windowMs: number, now?: number }} options
 * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number }}
 */
export function rateLimit(key, { limit, windowMs, now = Date.now() }) {
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    if (buckets.size >= MAX_KEYS) {
      for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k);
      if (buckets.size >= MAX_KEYS) buckets.clear();
    }
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  const allowed = bucket.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterMs: allowed ? 0 : bucket.resetAt - now,
  };
}

export function resetRateLimits() {
  buckets.clear();
}
