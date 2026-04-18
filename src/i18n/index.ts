import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import zh from './zh.json';

const STORAGE_KEY = 'ember_sports_lang';

function getSavedLanguage(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    // localStorage not available
  }
  return 'en';
}

const resources = {
  en: { translation: en },
  zh: { translation: zh }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Persist language changes to localStorage
i18n.on('languageChanged', (lng: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // localStorage not available
  }
});

export default i18n;
