"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useCookieConsent, CookieSettings } from '../../lib/useCookieConsent';

export default function CookieConsent() {
  const { t } = useTranslation();
  const { hasConsent, isLoaded, acceptAll, declineAll, updateSettings } = useCookieConsent();
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [cookieSettings, setCookieSettings] = useState<CookieSettings>({
    essential: true,
    preferences: false,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Só mostrar banner se carregou e não houver consentimento
    if (isLoaded && !hasConsent) {
      setShowBanner(true);
    }
  }, [hasConsent, isLoaded]);

  const handleAcceptAll = () => {
    acceptAll();
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleDeclineAll = () => {
    declineAll();
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleSavePreferences = () => {
    updateSettings(cookieSettings);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleToggleSetting = (key: keyof CookieSettings) => {
    if (key === 'essential') return; // Essenciais não podem ser desabilitados
    setCookieSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!showBanner && !showPreferences) return null;  return (
    <>
      {showPreferences ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 ">
          <div className="bg-[var(--background)] w-full max-w-lg rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto m-4">            <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">
              {t('cookies.preferences')}
            </h2>
            
            <div className="space-y-4 mb-6 ">
              <div className="flex items-center justify-between p-3 bg-[var(--container)] rounded-lg">                <div className="flex-1">
                  <h3 className="font-medium text-[var(--foreground)]">
                    {t('cookies.essential.title')}
                  </h3>
                  <p className="text-sm text-[var(--foreground)]">
                    {t('cookies.essential.description')}
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  checked={cookieSettings.essential} 
                  disabled 
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-[var(--container)] rounded-lg">                <div className="flex-1">
                  <h3 className="font-medium text-[var(--foreground)]">
                    {t('cookies.preference.title')}
                  </h3>                  <p className="text-sm text-[var(--foreground)]">
                    {t('cookies.preference.description')}
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  checked={cookieSettings.preferences} 
                  onChange={() => handleToggleSetting('preferences')} 
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-[var(--container)] rounded-lg">                <div className="flex-1">
                  <h3 className="font-medium text-[var(--foreground)]">
                    {t('cookies.analytics.title')}
                  </h3>                  <p className="text-sm text-[var(--foreground)]">
                    {t('cookies.analytics.description')}
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  checked={cookieSettings.analytics} 
                  onChange={() => handleToggleSetting('analytics')} 
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-[var(--container)] rounded-lg">                <div className="flex-1">
                  <h3 className="font-medium text-[var(--foreground)]">
                    {t('cookies.marketing.title')}
                  </h3>                  <p className="text-sm text-[var(--foreground)]">
                    {t('cookies.marketing.description')}
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  checked={cookieSettings.marketing} 
                  onChange={() => handleToggleSetting('marketing')} 
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">              <button
                onClick={() => setShowPreferences(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--highlight)] transition-colors"
              >
                {t('cookies.back')}
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--accent-color)] text-white hover:bg-opacity-90 transition-colors"
              >
                {t('cookies.savePreferences')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[var(--container)] border-t border-[var(--border-color)] shadow-lg">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">                <h3 className="text-lg font-semibold mb-2 text-[var(--foreground)]">
                  {t('cookies.title')}
                </h3>                <p className="text-sm text-[var(--foreground)]">
                  {t('cookies.description')}
                  {' '}
                  <Link href="/privacy" className="text-blue-400 hover:underline">
                    {t('footer.privacyPolicy')}
                  </Link>.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0 mt-2 md:mt-0">                <button
                  onClick={() => setShowPreferences(true)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--highlight)] transition-colors"
                >
                  {t('cookies.customize')}
                </button>
                <button
                  onClick={handleDeclineAll}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--highlight)] transition-colors"
                >
                  {t('cookies.onlyEssentials')}
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--accent-color)] text-white hover:bg-opacity-90 transition-colors"
                >
                  {t('cookies.acceptAll')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}