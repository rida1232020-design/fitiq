import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { translations } from '../i18n/translations';

const STORAGE_KEY = 'fitiq_lang';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' || saved === 'ar' ? saved : 'ar';
  });

  const setLanguage = useCallback((lang) => {
    if (lang !== 'ar' && lang !== 'en') return;
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  }, [language, setLanguage]);

  const t = useCallback((key, vars) => {
    const parts = key.split('.');
    let val = translations[language];
    for (const p of parts) val = val?.[p];
    if (val === undefined) {
      val = translations.ar;
      for (const p of parts) val = val?.[p];
    }
    if (typeof val !== 'string') return key;
    if (!vars) return val;
    return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{{${k}}}`, String(v)), val);
  }, [language]);

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    document.body.style.direction = dir;
    document.title = language === 'ar' ? 'FitIQ العراق 🏋️' : 'FitIQ Iraq 🏋️';
  }, [language, dir]);

  const locale = language === 'ar' ? 'ar-IQ' : 'en-US';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, dir, locale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
