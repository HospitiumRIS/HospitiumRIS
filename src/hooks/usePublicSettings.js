'use client';

import { useEffect, useState } from 'react';

const DEFAULTS = {
  siteName: 'HospitiumRIS',
  maintenanceMode: false,
  maintenanceMessage: '',
  allowRegistration: true,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
};

const TTL_MS = 60 * 1000;
let cached = null; // { at, data }
let inflight = null;

async function fetchPublicSettings() {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;
  if (!inflight) {
    inflight = fetch('/api/public/settings', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const data = json?.success ? { ...DEFAULTS, ...json.data } : DEFAULTS;
        cached = { at: Date.now(), data };
        return data;
      })
      .catch(() => DEFAULTS)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/**
 * Public platform settings (maintenance mode, registration open, password
 * rules). Cached for a minute and shared across components.
 * @param {{ refreshKey?: any }} options - change refreshKey (e.g. pathname) to re-check
 */
export default function usePublicSettings({ refreshKey } = {}) {
  const [settings, setSettings] = useState(cached?.data || DEFAULTS);
  const [loaded, setLoaded] = useState(Boolean(cached));

  useEffect(() => {
    let active = true;
    fetchPublicSettings().then((data) => {
      if (!active) return;
      setSettings(data);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return { settings, loaded };
}

export { DEFAULTS as PUBLIC_SETTINGS_DEFAULTS };
