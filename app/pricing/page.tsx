"use client";

<<<<<<< Updated upstream
import React from "react";
=======
import React, { useEffect } from "react";
>>>>>>> Stashed changes
import { CreditCard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n"; // Import i18n instance directly

export default function PricingPage() {
  const { user } = useAuth();
<<<<<<< Updated upstream
  const planDetails = {
    name: "Pro",
    price: "19.99",
    period: "mês",
    features: [
      "Armazenamento ilimitado de notas",
      "Sincronização em todos dispositivos",
      "Suporte a formatação Markdown",
      "Visualização em dashboard avançado",
    ],
  };
=======
  const { t } = useTranslation();
  
  // Initialize language detection based on browser language
  useEffect(() => {
    const browserLang = navigator.language;
    // Check if the detected language is supported in our app
    const supportedLanguages = Object.keys(i18n.options.resources || {});
    
    if (browserLang && supportedLanguages.includes(browserLang)) {
      i18n.changeLanguage(browserLang);
    } else if (browserLang && browserLang.startsWith('pt')) {
      // Handle cases like pt-PT, pt, etc. falling back to pt-BR
      i18n.changeLanguage('pt-BR');
    }
  }, []);
  
  // Get features from translation
  const features = [
    t('pricing.plan.features.storage'),
    t('pricing.plan.features.sync'),
    t('pricing.plan.features.markdown'),
    t('pricing.plan.features.dashboard'),
    t('pricing.plan.features.themes'),
    t('pricing.plan.features.export')
  ];
>>>>>>> Stashed changes

  // Function to redirect to Stripe checkout with user ID
  const handleCheckout = () => {
    if (!user) {
      alert(t('pricing.alerts.loginRequired'));
      return;
    }

    // Create URL with query parameters
    const checkoutUrl = new URL(
      "https://buy.stripe.com/test_eVaaFG14ugrtbSMaEE",
    );
    checkoutUrl.searchParams.append("client_reference_id", user.id);

    // Open in new tab
    window.open(checkoutUrl.toString(), "_blank");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-[var(--foreground)] mb-4">
<<<<<<< Updated upstream
            Plano PRO
          </h1>
          <p className="text-xl text-[var(--foreground)] max-w-2xl mx-auto">
            Desbloqueie todo o potencial do Fair-note com nosso plano premium
=======
            {t('pricing.title')}
          </h1>
          <p className="text-xl text-[var(--foreground)] max-w-2xl mx-auto">
            {t('pricing.subtitle')}
>>>>>>> Stashed changes
          </p>
        </div>

        <div className="bg-[var(--container)] rounded-2xl shadow-lg overflow-hidden mb-8">
<<<<<<< Updated upstream
          <div className="bg-[var(--button-bg)] px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[var(--foreground)]">
                Plano PRO
              </h2>
              <div className="bg-[var(--hover-color)] text-[var(--foreground)] px-3 py-1 text-sm font-medium rounded-full">
                Mais Popular
=======
          <div className="bg-[var(--container)] px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[var(--foregorund)]">
                {t('pricing.plan.name')}
              </h2>
              <div className="bg-red-500 text-white px-3 py-1 text-sm font-medium rounded-full">
                {t('pricing.plan.mostPopular')}
>>>>>>> Stashed changes
              </div>
            </div>
          
          </div>

          <div className="p-6">
            <div className="mb-6 flex items-baseline">
              <span className="text-5xl font-extrabold text-[var(--foreground)]">
                R$ {t('pricing.plan.price')}
              </span>
              <span className="ml-1 text-xl font-medium text-[var(--foreground)]">
<<<<<<< Updated upstream
                /{planDetails.period}
=======
                {t('pricing.plan.perPeriod')}
>>>>>>> Stashed changes
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">
<<<<<<< Updated upstream
                O que está incluído:
              </h3>
              <ul className="space-y-3">
                {planDetails.features.map((feature, index) => (
=======
                {t('pricing.plan.included')}
              </h3>
              <ul className="space-y-3">
                {features.map((feature, index) => (
>>>>>>> Stashed changes
                  <li key={index} className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0 h-5 w-5 text-green-500"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span className="ml-3 text-[var(--foreground)]">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-[var(--container)] rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--foreground)]">
<<<<<<< Updated upstream
                Resumo do pedido
=======
                {t('pricing.orderSummary.title')}
>>>>>>> Stashed changes
              </h3>
              <div className="flex items-center text-green-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 mr-1"
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    ry="2"
                  ></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
<<<<<<< Updated upstream
                <span className="text-sm font-medium">Pagamento seguro</span>
=======
                <span className="text-sm font-medium">{t('pricing.orderSummary.securePayment')}</span>
>>>>>>> Stashed changes
              </div>
            </div>

            <div className="flex justify-between py-4 border-t border-[var(--border-color)]">
              <span className="text-[var(--foreground)]">
                {t('pricing.orderSummary.planLabel')} {t('pricing.plan.name')}
              </span>
              <span className="font-medium text-[var(--foreground)]">
                R$ {t('pricing.plan.price')}
              </span>
            </div>

            <div className="flex justify-between py-4 border-t border-b border-[var(--border-color)]">
              <span className="text-[var(--foreground)]">{t('pricing.orderSummary.taxes')}</span>
              <span className="font-medium text-[var(--foreground)]">
                {t('pricing.orderSummary.included')}
              </span>
            </div>

            <div className="flex justify-between py-4 mt-2">
              <span className="text-lg font-bold text-[var(--foreground)]">
<<<<<<< Updated upstream
                Total
              </span>
              <span className="text-lg font-bold text-[var(--foreground)]">
                R$ {planDetails.price}/{planDetails.period}
              </span>
=======
                {t('pricing.orderSummary.total')}
              </span>
              <span className="text-lg font-bold text-[var(--foreground)]">
                R$ {t('pricing.plan.price')}{t('pricing.plan.perPeriod')}
              </span>
>>>>>>> Stashed changes
            </div>

            <div className="mt-6">
              <button
                onClick={handleCheckout}
<<<<<<< Updated upstream
                className="w-full bg-[var(--button-bg)] hover:bg-[var(--hover-color)] text-[var(--foreground)] py-4 px-6 rounded-xl font-semibold flex items-center justify-center transition-all duration-200"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                <span>Finalizar Pagamento</span>
=======
                className="w-full bg-[var(--foreground)] hover:bg-[var(--hover-color)] text-[var(--background)] py-4 px-6 rounded-xl font-semibold flex items-center justify-center transition-all duration-200"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                <span>{t('pricing.orderSummary.checkout')}</span>
>>>>>>> Stashed changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}