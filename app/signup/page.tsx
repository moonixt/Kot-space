"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("signup.errors.passwordsDontMatch"));
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      // O redirecionamento já está tratado na função signUp
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Erro ao criar conta:", error);
        setError(error.message || t("signup.errors.genericError"));
      } else {
        setError(t("signup.errors.unknownError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--container)] p-4">
      <div className="w-full max-w-md">
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}
        <div>
          <Image
            src="/static/images/crowlyH.png"
            alt={t("login.logoAlt")}
            width={1000}
            height={100}
            className=" h-60 md:h-80 object-cover object-top"
            priority
          />
        </div>
        <div className="bg-[var(--background)] backdrop-blur-sm overflow-hidden ">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              {t("signup.title")}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  className="block text-[var(--foreground)] mb-2"
                  htmlFor="email"
                >
                  {t("signup.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[var(--container)] border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--foreground)]"
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-[var(--foreground)] mb-2"
                  htmlFor="password"
                >
                  {t("signup.password")}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[var(--container)] border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--foreground)]"
                />
              </div>

              <div className="mb-6">
                <label
                  className="block text-[var(--foreground)] mb-2"
                  htmlFor="confirmPassword"
                >
                  {t("signup.confirmPassword")}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[var(--container)] border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--foreground)]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-medium ${
                  loading
                    ? "bg-blue-600/50 cursor-not-allowed"
                    : "bg-[var(--foreground)] "
                } text-[var(--background)] transition-colors`}
              >
                {loading
                  ? t("signup.creatingAccount")
                  : t("signup.createAccount")}
              </button>
            </form>

            <div className="mt-6 text-center text-[var(--foreground)]">
              {t("signup.alreadyHaveAccount")}{" "}
              <Link href="/login" className="text-blue-400 hover:underline">
                {t("signup.signIn")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
