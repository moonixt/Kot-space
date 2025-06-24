"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  Calendar,
  Music,
  Shield,
  Smartphone,
  Globe,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const { t } = useTranslation();
  const features = [
    {
      icon: <BookOpen className="w-8 h-8 text-blue-500" />,
      title: t("homepage.features.smartNotes.title"),
      description: t("homepage.features.smartNotes.description"),
    },
    {
      icon: <Calendar className="w-8 h-8 text-green-500" />,
      title: t("homepage.features.taskManagement.title"),
      description: t("homepage.features.taskManagement.description"),
    },
    {
      icon: <Music className="w-8 h-8 text-purple-500" />,
      title: t("homepage.features.focusMusic.title"),
      description: t("homepage.features.focusMusic.description"),
    },
    {
      icon: <Shield className="w-8 h-8 text-red-500" />,
      title: t("homepage.features.privacyFirst.title"),
      description: t("homepage.features.privacyFirst.description"),
    },
    {
      icon: <Globe className="w-8 h-8 text-cyan-500" />,
      title: t("homepage.features.multiLanguage.title"),
      description: t("homepage.features.multiLanguage.description"),
    },
  ];
  const benefits = [
    t("homepage.benefits.items.seamlessSync"),
    t("homepage.benefits.items.export"),
    t("homepage.benefits.items.customizable"),

    t("homepage.benefits.items.search"),
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--container)] border-b border-[var(--border-color)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {" "}
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image
                src="/icon-512x512.png"
                alt="Lynxky"
                width={32}
                height={32}
                className="mr-3"
              />
              <h1 className="text-xl font-bold text-[var(--foreground)]">
                Lynxky
              </h1>
            </div>
            <div className="flex space-x-4">
              {" "}
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--highlight)] rounded-lg transition-colors"
              >
                {t("homepage.header.signIn")}
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium bg-[var(--foreground)] text-[var(--background)] rounded-lg hover:bg-opacity-90 transition-colors"
              >
                {t("homepage.header.getStarted")}
              </Link>
            </div>
          </div>
        </div>
      </header>{" "}
      {/* Hero Section */}
      <section
        className="relative py-20 px-4 sm:px-6 lg:px-8 min-h-[80vh] flex items-center"
        style={{
          backgroundImage: "url(/static/images/susan.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Background overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative max-w-7xl mx-auto text-center z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            {t("homepage.hero.title")}
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            {t("homepage.hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              {t("homepage.hero.startFreeTrial")}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 border border-white/30 bg-white/10 backdrop-blur-sm text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
            >
              {t("homepage.hero.signIn")}
            </Link>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--container)]">
        <div className="max-w-7xl mx-auto">
          {" "}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
              {t("homepage.features.title")}
            </h2>
            <p className="text-lg text-[var(--foreground)] max-w-2xl mx-auto">
              {t("homepage.features.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-[var(--background)] p-6 rounded-xl shadow-sm border border-[var(--border-color)]"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[var(--foreground)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>{" "}
      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-6">
                {t("homepage.benefits.title")}
              </h2>
              <p className="text-lg text-[var(--foreground)] mb-8">
                {t("homepage.benefits.subtitle")}
              </p>
            </div>
            <ul className="space-y-4  text-2xl">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-[var(--foreground)]">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      {/* Platform Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--container)]">
        {" "}
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-6">
            {t("homepage.platforms.title")}
          </h2>
          <p className="text-lg text-[var(--foreground)] mb-12 max-w-2xl mx-auto">
            {t("homepage.platforms.subtitle")}
          </p>
          <div className="flex justify-center items-center space-x-8 flex-wrap">
            <div className="flex items-center space-x-2 text-[var(--foreground)] mb-4">
              <Globe className="w-6 h-6" />
              <span>{t("homepage.platforms.webApp")}</span>
            </div>
            <div className="flex items-center space-x-2 text-[var(--foreground)] mb-4">
              <Smartphone className="w-6 h-6" />
              <span>{t("homepage.platforms.mobileApp")}</span>
            </div>
            <div className="flex items-center space-x-2 text-[var(--foreground)] mb-4">
              <BookOpen className="w-6 h-6" />
              <span>{t("homepage.platforms.desktopApp")}</span>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        {" "}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-6">
            {t("homepage.cta.title")}
          </h2>
          <p className="text-lg text-[var(--foreground)] mb-8">
            {t("homepage.cta.subtitle")}
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center px-8 py-4 bg-[var(--foreground)] text-[var(--background)] font-medium text-lg rounded-lg hover:bg-opacity-90 transition-colors"
          >
            {t("homepage.cta.startTrial")}
            <ArrowRight className="ml-3 w-6 h-6" />
          </Link>
          <p className="text-sm text-[var(--foreground)] mt-4">
            {t("homepage.cta.disclaimer")}
          </p>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-[var(--container)] border-t border-[var(--border-color)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {" "}
            <div>
              <div className="flex items-center mb-4">
                <Image
                  src="/icon-512x512.png"
                  alt="Lynxky"
                  width={24}
                  height={24}
                  className="mr-2"
                />
                <span className="text-lg font-bold text-[var(--foreground)]">
                  Lynxky
                </span>
              </div>{" "}
              <p className="text-[var(--foreground)]">
                {t("homepage.footer.description")}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-4">
                {t("homepage.footer.product")}
              </h3>
              <ul className="space-y-2 text-[var(--foreground)]">
                <li>
                  <Link
                    href="/features"
                    className="hover:text-[var(--foreground)]"
                  >
                    {t("homepage.footer.features")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-[var(--foreground)]"
                  >
                    {t("homepage.footer.pricing")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/security"
                    className="hover:text-[var(--foreground)]"
                  >
                    {t("homepage.footer.security")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-4">
                {t("homepage.footer.support")}
              </h3>
              <ul className="space-y-2 text-[var(--foreground)]">
                <li>
                  <Link href="/help" className="hover:text-[var(--foreground)]">
                    {t("homepage.footer.helpCenter")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-[var(--foreground)]"
                  >
                    {t("homepage.footer.contactUs")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/account-deletion"
                    className="hover:text-[var(--foreground)]"
                  >
                    {t("homepage.footer.deleteAccount")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-4">
                {t("homepage.footer.legal")}
              </h3>
              <ul className="space-y-2 text-[var(--foreground)]">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-[var(--foreground)]"
                  >
                    {t("homepage.footer.privacyPolicy")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-[var(--foreground)]"
                  >
                    {t("homepage.footer.termsOfService")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[var(--border-color)] mt-8 pt-8 text-center text-[var(--foreground)]">
            <p>&copy; 2025 Lynxky. {t("homepage.footer.allRightsReserved")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
