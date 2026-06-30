import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../../public/locales/en.json';
import sw from '../../public/locales/sw.json';
import fr from '../../public/locales/fr.json';
import es from '../../public/locales/es.json';
import ar from '../../public/locales/ar.json';
import de from '../../public/locales/de.json';
import pt from '../../public/locales/pt.json';
import id from '../../public/locales/id.json';
import ms from '../../public/locales/ms.json';
import km from '../../public/locales/km.json';
import hi from '../../public/locales/hi.json';
import vi from '../../public/locales/vi.json';
import ko from '../../public/locales/ko.json';
import lo from '../../public/locales/lo.json';
import zh from '../../public/locales/zh.json';
import my from '../../public/locales/my.json';
import fil from '../../public/locales/fil.json';
import th from '../../public/locales/th.json';
import tet from '../../public/locales/tet.json';

// Get saved language from localStorage or default to 'en'
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
        sw: { translation: sw },
        fr: { translation: fr },
        es: { translation: es },
        ar: { translation: ar },
        de: { translation: de },
        pt: { translation: pt },
        id: { translation: id },
        ms: { translation: ms },
        km: { translation: km },
        hi: { translation: hi },
        vi: { translation: vi },
        ko: { translation: ko },
        lo: { translation: lo },
        zh: { translation: zh },
        my: { translation: my },
        fil: { translation: fil },
        th: { translation: th },
        tet: { translation: tet },
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
