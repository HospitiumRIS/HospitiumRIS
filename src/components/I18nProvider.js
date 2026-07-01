'use client';

import { useEffect, useState } from 'react';
import i18n from '@/lib/i18n';

const SUPPORTED_LOCALES = ['en', 'sw', 'ar', 'fr', 'es', 'de', 'pt', 'id', 'ms', 'km', 'hi', 'vi', 'ko', 'lo', 'zh', 'my', 'fil', 'th', 'tet'];

async function loadLocaleFiles() {
  await Promise.all(
    SUPPORTED_LOCALES.map(async (lng) => {
      try {
        const res = await fetch(`/locales/${lng}.json`);
        if (!res.ok) return;
        const data = await res.json();
        // Merge fresh locale file so new keys appear without a dev-server restart
        i18n.addResourceBundle(lng, 'translation', data, true, true);
      } catch (err) {
        console.warn(`Could not load locale file: ${lng}`, err);
      }
    })
  );
}

/**
 * Loads locale JSON from /public/locales at runtime (always up to date),
 * then initialises i18next for the whole browser session.
 */
export default function I18nProvider({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const applyDocumentLanguage = (lng) => {
      if (typeof document === 'undefined') return;
      const code = lng?.split('-')[0] || 'en';
      document.documentElement.lang = code;
      document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    };

    applyDocumentLanguage(i18n.language);
    i18n.on('languageChanged', applyDocumentLanguage);
    return () => i18n.off('languageChanged', applyDocumentLanguage);
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadLocaleFiles().then(() => {
      if (cancelled) return;
      // Get saved language from localStorage or use current i18n language
      const savedLang = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
      const current = savedLang || i18n.language?.split('-')[0] || 'en';
      i18n.changeLanguage(current);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Avoid flashing raw translation keys before locale files load
  if (!ready) return null;

  return children;
}
