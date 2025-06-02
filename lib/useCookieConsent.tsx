"use client";

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export interface CookieSettings {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentContextType {
  hasConsent: boolean;
  cookieSettings: CookieSettings | null;
  isLoaded: boolean;
  acceptAll: () => void;
  declineAll: () => void;
  updateSettings: (settings: CookieSettings) => void;
  canUseCookies: (type: keyof CookieSettings) => boolean;
  resetConsent: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);


export function CookieConsentProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [hasConsent, setHasConsent] = useState<boolean>(false);
  const [cookieSettings, setCookieSettings] = useState<CookieSettings | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  useEffect(() => {
    // Verificar se já existe consentimento armazenado
    const stored = localStorage.getItem('cookie-consent');
    if (stored) {
      try {
        if (stored === 'accepted' || stored === 'declined') {
          // Migrar formato antigo
          const settings = stored === 'accepted' ? 
            { essential: true, preferences: true, analytics: true, marketing: true } :
            { essential: true, preferences: false, analytics: false, marketing: false };
          setCookieSettings(settings);
          setHasConsent(true);
          localStorage.setItem('cookie-consent', JSON.stringify(settings));
        } else {
          // Formato novo (objeto)
          const settings = JSON.parse(stored) as CookieSettings;
          setCookieSettings(settings);
          setHasConsent(true);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações de cookies:', error);
        resetConsent();
      }
    }
    setIsLoaded(true);
  }, []);

  const acceptAll = () => {
    const settings: CookieSettings = {
      essential: true,
      preferences: true,
      analytics: true,
      marketing: true
    };
    setCookieSettings(settings);
    setHasConsent(true);
    localStorage.setItem('cookie-consent', JSON.stringify(settings));
    initializeAcceptedServices(settings);
  };

  const declineAll = () => {
    const settings: CookieSettings = {
      essential: true,
      preferences: false,
      analytics: false,
      marketing: false
    };
    setCookieSettings(settings);
    setHasConsent(true);
    localStorage.setItem('cookie-consent', JSON.stringify(settings));
    disableNonEssentialServices();
  };

  const updateSettings = (settings: CookieSettings) => {
    setCookieSettings(settings);
    setHasConsent(true);
    localStorage.setItem('cookie-consent', JSON.stringify(settings));
    
    // Inicializar ou desabilitar serviços baseado nas configurações
    if (settings.analytics) {
      initializeAnalytics();
    } else {
      disableAnalytics();
    }
    
    if (settings.marketing) {
      initializeMarketing();
    } else {
      disableMarketing();
    }
  };

  const canUseCookies = (type: keyof CookieSettings): boolean => {
    if (type === 'essential') return true;
    return cookieSettings ? cookieSettings[type] : false;
  };
  const resetConsent = () => {
    setHasConsent(false);
    setCookieSettings(null);
    localStorage.removeItem('cookie-consent');
    disableNonEssentialServices();
  };  return (
    <CookieConsentContext.Provider value={{
      hasConsent,
      cookieSettings,
      isLoaded,
      acceptAll,
      declineAll,
      updateSettings,
      canUseCookies,
      resetConsent
    }}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent deve ser usado dentro de um CookieConsentProvider');
  }
  return context;
}

// Funções auxiliares para gerenciar serviços de terceiros
function initializeAcceptedServices(settings: CookieSettings) {
  if (settings.analytics) {
    initializeAnalytics();
  }
  if (settings.marketing) {
    initializeMarketing();
  }
}

function initializeAnalytics() {
  // Aqui você pode adicionar código para inicializar Google Analytics ou outras ferramentas
  if (typeof window !== 'undefined') {
    console.log('Analytics habilitado');
    // Exemplo para Google Analytics:
    // gtag('config', 'GA_MEASUREMENT_ID');
  }
}

function initializeMarketing() {
  // Aqui você pode adicionar código para ferramentas de marketing
  if (typeof window !== 'undefined') {
    console.log('Marketing cookies habilitados');
  }
}

function disableNonEssentialServices() {
  disableAnalytics();
  disableMarketing();
}

function disableAnalytics() {
  if (typeof window !== 'undefined') {
    console.log('Analytics desabilitado');
    // Desabilitar Google Analytics ou outras ferramentas
    // Limpar cookies analíticos se necessário
  }
}

function disableMarketing() {
  if (typeof window !== 'undefined') {
    console.log('Marketing cookies desabilitados');
    // Limpar cookies de marketing se necessário
  }
}
