"use client";

import React, { useEffect } from "react";
import { Analytics } from "@vercel/analytics/next";
import { CreditCard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n"; // Import i18n instance directly

export default function PricingPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  // Initialize language detection based on browser language
  useEffect(() => {
    const browserLang = navigator.language;
    // Check if the detected language is supported in our app
    const supportedLanguages = Object.keys(i18n.options.resources || {});

    if (browserLang && supportedLanguages.includes(browserLang)) {
      i18n.changeLanguage(browserLang);
    } else if (browserLang && browserLang.startsWith("pt")) {
      // Handle cases like pt-PT, pt, etc. falling back to pt-BR
      i18n.changeLanguage("pt-BR");
    }
  }, []);
  // Get features from translation
  const features = [
    t("pricing.plan.features.storage"),
    t("pricing.plan.features.sync"),
    t("pricing.plan.features.markdown"),
    t("pricing.plan.features.dashboard"),
    t("pricing.plan.features.themes"),
    t("pricing.plan.features.export"),
  ];
  // Function to redirect to Stripe checkout with user ID
  const handleCheckout = () => {
    if (!user) {
      alert(t("pricing.alerts.loginRequired"));
      return;
    }
    // Create URL with query parameters
    const checkoutUrl = new URL(
      "https://buy.stripe.com/6oUbJ3e7x6tCd5lfNkds404",
    );
    checkoutUrl.searchParams.append("client_reference_id", user.id);
    // Open in new tab
    window.open(checkoutUrl.toString(), "_blank");
  };
  return (
    <>
    <div className="min-h-screen bg-[var(--background)] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">            <div className="inline-flex items-center px-4 py-2 rounded-full bg-[var(--foreground)] text-[var(--background)] text-sm font-medium mb-6">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            {t("pricing.trustSection.premiumPlan")}
          </div>
          <h1 className="text-5xl font-bold text-[var(--foreground)] mb-6 tracking-tight">
            {t("pricing.title")}
          </h1>
          <p className="text-xl text-[var(--foreground)] max-w-2xl mx-auto leading-relaxed">
            {t("pricing.subtitle")}
          </p>
        </div>
        
        {/* Plan Card */}
        <div className="bg-[var(--foreground)] text-[var(--foreground)] border border-[var(--border)] rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 mb-8 overflow-hidden">
          <div className="border-b border-[var(--border)] px-8 py-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                {t("pricing.plan.name")}
              </h2>
              <div className="bg-emerald-500 text-white px-3 py-1 text-sm font-medium rounded-full ">
                {t("pricing.plan.mostPopular")}
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="mb-8 flex items-baseline">
              <span className="text-5xl font-bold text-[var(--background)]">
                {t("pricing.plan.price")}
              </span>
              <span className="ml-2 text-lg font-medium text-[var(--background)]">
                {t("pricing.plan.perPeriod")}
              </span>
            </div>
            <div className="mb-8">
              <h3 className="text-lg font-medium text-[var(--background)] mb-6">
                {t("pricing.plan.included")}
              </h3>
              <ul className="space-y-4">
                {features.map((feature, index) => (
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
                      className="flex-shrink-0 h-5 w-5 text-[var(--background)] mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span className="ml-3 text-[var(--background)] leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Checkout Button */}
            <div className="mt-8">
              <button
                onClick={handleCheckout}
                className="w-full bg-[var(--background)]  text-[var(--foreground)] py-4 px-6 rounded-lg font-semibold flex items-center justify-center transition-colors duration-200"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                <span>{t("pricing.orderSummary.checkout")}</span>
              </button>
             
            </div>
          </div>
        </div>
        
        {/* Trust & Value Section */}
        <div className="mt-12 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-[var(--muted)] rounded-lg flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <h4 className="font-medium text-[var(--foreground)] mb-1">{t("pricing.trustSection.security.title")}</h4>
              <p className="text-sm text-[var(--muted-foreground)] text-center">{t("pricing.trustSection.security.description")}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-[var(--muted)] rounded-lg flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h4 className="font-medium text-[var(--foreground)] mb-1">{t("pricing.trustSection.speed.title")}</h4>
              <p className="text-sm text-[var(--muted-foreground)] text-center">{t("pricing.trustSection.speed.description")}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-[var(--muted)] rounded-lg flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </div>
              <h4 className="font-medium text-[var(--foreground)] mb-1">{t("pricing.trustSection.flexibility.title")}</h4>
              <p className="text-sm text-[var(--muted-foreground)] text-center">{t("pricing.trustSection.flexibility.description")}</p>
            </div>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            {t("pricing.trustSection.testimonial")}
          </p>
        </div>
        {/* <div className="mt-12 bg-[var(--highlight)] p-6 rounded-2xl border-l-4 border-red-500">
          <h4 className="font-bold text-[var(--foreground)] text-center">
            Oferta especial por tempo limitado! Economize 33%
          </h4>
          <p className="text-[var(--muted)] text-center mt-2">
            Organize, planeje e realize mais com recursos avançados de
            calendário e gerenciamento de tarefas
          </p>
        </div> */}
      </div>
    </div>
      <Analytics />
    </>
  );
}
