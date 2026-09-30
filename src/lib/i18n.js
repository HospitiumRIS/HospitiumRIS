import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../../public/locales/en.json';

// Only English is bundled here; I18nProvider loads other locales at runtime via fetch.
const getSavedLanguage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('i18nextLng') || 'en';
  }
  return 'en';
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
      },
      lng: getSavedLanguage(),
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;
