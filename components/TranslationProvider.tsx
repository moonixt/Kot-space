'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

interface TranslationProviderProps {
  children: React.ReactNode;
  locale?: string;
}

export default function TranslationProvider({
  children,
  locale = 'en'
}: TranslationProviderProps) {
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  useEffect(() => {
    try {
      // Get stored language preference or use provided locale as default
      const storedLanguage = localStorage.getItem('i18nextLng');
      const targetLanguage = storedLanguage || locale;
      
      // Change language only if needed
      if (targetLanguage && i18n.language !== targetLanguage) {
        i18n.changeLanguage(targetLanguage).then(() => {
          setIsLanguageLoaded(true);
        });
      } else {
        setIsLanguageLoaded(true);
      }

      // Save current language to localStorage
      if (i18n.language) {
        localStorage.setItem('i18nextLng', i18n.language);
      }
    } catch (error) {
      console.warn('Error accessing localStorage:', error);
      
      // Fallback: Just use the locale prop if localStorage isn't available
      if (locale && i18n.language !== locale) {
        i18n.changeLanguage(locale).then(() => {
          setIsLanguageLoaded(true);
        });
      } else {
        setIsLanguageLoaded(true);
      }
    }
  }, [locale]);

  // Show a loading state or nothing until the language is properly loaded
  if (!isLanguageLoaded) {
    return null; // Or a minimal loading indicator
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}