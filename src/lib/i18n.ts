import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from '@/locales/en.json';
import de from '@/locales/de.json';
import fr from '@/locales/fr.json';
import es from '@/locales/es.json';
import it from '@/locales/it.json';
import pt from '@/locales/pt.json';
import ru from '@/locales/ru.json';
import zh from '@/locales/zh.json';
import ja from '@/locales/ja.json';
import ko from '@/locales/ko.json';
import ar from '@/locales/ar.json';
import hi from '@/locales/hi.json';

const resources = {
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  it: { translation: it },
  pt: { translation: pt },
  ru: { translation: ru },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  ar: { translation: ar },
  hi: { translation: hi },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;

