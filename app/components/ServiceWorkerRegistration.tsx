//service worker for the PWA functionality
// NEED REVIEW

"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Registrar apenas após o load da página
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none" // Evitar cache do próprio SW
          });
          
          console.log("Service Worker registrado com sucesso:", registration.scope);
          
          // Verificar updates sem forçar reload
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log("Nova versão do Service Worker disponível");
                  // Não fazer reload automático
                }
              });
            }
          });
          
        } catch (error) {
          console.log("Falha no registro do Service Worker:", error);
        }
      };

      // Aguardar load completo
      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW, { once: true });
      }
    }

    // Prevenir comportamentos que causam reload
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Página visível novamente");
        // NÃO fazer nada que possa causar reload
      }
    };

    const handleFocus = () => {
      console.log("Janela recebeu foco");
      // NÃO fazer verificações que possam causar reload
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log("Página restaurada do cache");
        // NÃO fazer reload quando a página for restaurada
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return null;
}
