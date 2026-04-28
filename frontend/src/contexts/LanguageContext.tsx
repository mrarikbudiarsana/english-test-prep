'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTranslation, type Lang, type TranslationKey } from '@/lib/i18n';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

/** Detect the preferred language:
 *  1. Saved in localStorage (user's explicit choice)
 *  2. Browser language starts with 'id' → Indonesian
 *  3. Otherwise English
 */
function detectInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en';

  const saved = localStorage.getItem('itpready_lang') as Lang | null;
  if (saved === 'id' || saved === 'en') return saved;

  const browserLang = navigator.language || (navigator as any).userLanguage || '';
  return browserLang.toLowerCase().startsWith('id') ? 'id' : 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en'); // SSR-safe default

  // Resolve on client after mount
  useEffect(() => {
    setLangState(detectInitialLang());
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('itpready_lang', l);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => getTranslation(key, lang),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
