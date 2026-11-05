'use client';

/**
 * Privacy-preserving module usage tracker.
 *
 * Records, for signed-in users only:
 *   - VIEW:   the page path they opened (one event per path per 30 s)
 *   - ACTION: create / update / delete API calls (method + path + status)
 *
 * Never records query strings, request/response bodies, form values or
 * record content. Paths are normalised server-side (IDs -> :id) and mapped
 * to a module (see src/lib/ops/modules.js). Events are batched and sent to
 * /api/telemetry/usage every 15 s and when the tab is hidden.
 */
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

const ENDPOINT = '/api/telemetry/usage';
const FLUSH_MS = 15000;
const VIEW_DEDUPE_MS = 30000;
const MAX_QUEUE = 200;
const SKIP_API = /^\/api\/(telemetry|auth|notifications|health|cron)(\/|$)/;

let queue = [];
let fetchPatched = false;
let trackingEnabled = false;

function enqueue(event) {
  if (!trackingEnabled) return;
  if (queue.length >= MAX_QUEUE) queue.shift();
  queue.push({ ...event, at: Date.now() });
}

function flush(useBeacon = false) {
  if (!queue.length) return;
  const events = queue.splice(0, 50);
  const payload = JSON.stringify({ events });
  try {
    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'application/json' }));
      return;
    }
    const send = window.__hospitiumOriginalFetch || window.fetch;
    send(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
      credentials: 'same-origin',
    }).catch(() => {});
  } catch {
    // telemetry must never break the app
  }
}

function patchFetch() {
  if (fetchPatched || typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  fetchPatched = true;
  const original = window.fetch.bind(window);
  window.__hospitiumOriginalFetch = original;

  window.fetch = async (input, init) => {
    const response = await original(input, init);
    try {
      const method = String(init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
      if (trackingEnabled && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
        const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url;
        const url = new URL(rawUrl, window.location.origin);
        if (url.origin === window.location.origin && url.pathname.startsWith('/api/') && !SKIP_API.test(url.pathname)) {
          enqueue({ kind: 'ACTION', path: url.pathname, method, status: response.status });
        }
      }
    } catch {
      // ignore
    }
    return response;
  };
}

export default function UsageTracker() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const lastView = useRef({ path: null, at: 0 });

  const active = Boolean(isAuthenticated && user && user.accountType !== 'GLOBAL_ADMIN');

  useEffect(() => {
    trackingEnabled = active;
    if (!active) {
      queue = [];
      return undefined;
    }
    patchFetch();
    const timer = setInterval(() => flush(false), FLUSH_MS);
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush(true);
    };
    const onPageHide = () => flush(true);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
      flush(true);
    };
  }, [active]);

  useEffect(() => {
    if (!active || !pathname) return;
    const now = Date.now();
    if (lastView.current.path === pathname && now - lastView.current.at < VIEW_DEDUPE_MS) return;
    lastView.current = { path: pathname, at: now };
    enqueue({ kind: 'VIEW', path: pathname });
  }, [pathname, active]);

  return null;
}
