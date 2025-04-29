"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
// import i18n from '../i18n';

interface LanguageLoaderProps {
  children: React.ReactNode;
}

export default function LanguageLoader({ children }: LanguageLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const { i18n } = useTranslation();

  useEffect(() => {
    // This effect runs only once on component mount
    const initialize = async () => {
      try {
        // Try to get the language from localStorage
        const storedLang = localStorage.getItem("i18nextLng");

        if (storedLang) {
          // If there's a stored language, set it
          await i18n.changeLanguage(storedLang);
        } else {
          // Otherwise, detect the browser language
          const browserLang = navigator.language;

          // Check if it's a Portuguese variant
          if (browserLang.startsWith("pt")) {
            await i18n.changeLanguage("pt-BR");
          }
          // Check if it's a Japanese variant
          else if (browserLang.startsWith("ja")) {
            await i18n.changeLanguage("ja");
          } else if (browserLang.startsWith("de")) {
            await i18n.changeLanguage("de");
          } else if (browserLang.startsWith("es")) {
            await i18n.changeLanguage("es");
          } else {
            // For all other languages, use the browser language if supported, otherwise English
            const supportedLanguages = Object.keys(
              i18n.options.resources || {},
            );
            if (supportedLanguages.includes(browserLang)) {
              await i18n.changeLanguage(browserLang);
            } else {
              await i18n.changeLanguage("en");
            }
          }

          // Save the chosen language to localStorage
          localStorage.setItem("i18nextLng", i18n.language);
        }

        // Once language is loaded and set, mark as loaded
        setIsLoaded(true);
      } catch (error) {
        console.error("Error initializing language:", error);
        // In case of error, still mark as loaded to avoid blocking the UI
        setIsLoaded(true);
      }
    };

    initialize();
  }, []);

  // Display nothing until the language is loaded
  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-[var(--background)] flex items-center justify-center z-50">
        <div className="w-12 h-12 border-4 border-[var(--foreground)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render children once language is properly loaded
  return <>{children}</>;
}
