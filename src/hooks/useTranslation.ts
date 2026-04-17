import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  
  return {
    t,
    lang: i18n.language as 'en' | 'zh',
    setLang: (lang: 'en' | 'zh') => i18n.changeLanguage(lang)
  };
};
