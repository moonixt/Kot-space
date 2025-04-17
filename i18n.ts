import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translations
import enTranslation from "./i18n/locales/en/translation.json";
import ptBrTranslation from "./i18n/locales/pt/translation.json";

// Define resource type for TypeScript
declare module "i18next" {
  interface CustomTypeOptions {
    resources: {
      translation: typeof enTranslation;
    };
  }
}

// For Next.js 13+ SSR compatibility
const runsOnServerSide = typeof window === "undefined";

// Pre-load all language resources to avoid resource loading delays
const resources = {
  en: {
    translation: enTranslation,
  },
  "pt-BR": {
    translation: ptBrTranslation,
  },
};

// Configure language detection with higher priority for localStorage
const languageDetectorOptions = {
  order: ["localStorage", "navigator"],
  lookupLocalStorage: "i18nextLng",
  caches: ["localStorage"],
};

i18n
  // Set up language detector with our custom options
  .use(new LanguageDetector(null, languageDetectorOptions))
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: "en",
    debug: process.env.NODE_ENV !== "production",

    // Disable suspense mode for SSR to prevent hydration issues
    react: {
      useSuspense: !runsOnServerSide,
      // This improves the first render by avoiding waiting for translation loads
      transEmptyNodeValue: "",
      // This prevents failed lookups from being sent to the backend
      transKeepBasicHtmlNodesFor: ["br", "strong", "i", "p", "span"],
    },

    interpolation: {
      escapeValue: false, // Not needed for React as it escapes by default
    },
  });

export default i18n;
