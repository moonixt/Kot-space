"use client";

import { useState, useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/next";
import { useAuth, SignUpResult } from "../../context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { useTranslation, Trans } from "react-i18next";
import i18n from "../../i18n";
import { Turnstile } from "@marsidev/react-turnstile";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<SignUpResult | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<any>(null);
  const { signUp } = useAuth();
  const { t } = useTranslation();

  // Função para resetar o Turnstile
  const resetTurnstile = () => {
    if (turnstileRef.current) {
      turnstileRef.current.reset();
    }
    setTurnstileToken(null);
  };

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
    setSuccessResult(null);

    if (password !== confirmPassword) {
      setError(t("signup.errors.passwordsDontMatch"));
      return;
    }

    if (!agreedToTerms) {
      setError(t("signup.errors.mustAgreeToTerms"));
      return;
    } // Verificar se o captcha foi completado
    if (!turnstileToken) {
      setError(t("login.captcha.required"));
      return;
    }

    setLoading(true);

    try {
      // Verificar o captcha no backend primeiro
      const captchaResponse = await fetch("/api/verify-turnstile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: turnstileToken }),
      });

      const captchaResult = await captchaResponse.json();

      if (!captchaResult.success) {
        setError(t("login.captcha.error"));
        resetTurnstile();
        return;
      }
      const result = await signUp(email, password);
      setSuccessResult(result);
      // Clear form on success
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setAgreedToTerms(false);
      resetTurnstile();
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Check for email already registered
        if (
          error.message.includes("User already registered") ||
          error.message.includes("already been registered") ||
          error.message.includes("Email already in use") ||
          error.message
            .toLowerCase()
            .includes("user with this email already exists")
        ) {
          setError(t("signup.errors.emailAlreadyExists"));
        }
        // Check for rate limiting error and show user-friendly message
        else if (
          error.message.includes("For security purposes") ||
          error.message.includes("you can only request this after") ||
          error.message.includes("seconds")
        ) {
          setError(t("signup.errors.rateLimitError"));
        } else {
          // Show the actual error message to the user
          setError(error.message || t("signup.errors.genericError"));
        }
      } else {
        setError(t("signup.errors.unknownError"));
      }
      // Reset captcha em caso de erro
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-[var(--container)] p-4">
        <div className="w-full max-w-md">
          <div>
            <Image
              src="/static/images/knot.png"
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
                </div>{" "}
                <div className="mb-6 flex items-center">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    required
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2 bg-[var(--container)]"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-[var(--foreground)] "
                  >
                    <Trans i18nKey="signup.agreeToTerms"></Trans>
                    <Link
                      href="/terms"
                      className="text-blue-400 hover:underline ml-1"
                    >
                      {t("login.termsOfUse")}
                    </Link>
                  </label>
                </div>{" "}
                {/* Turnstile Captcha */}
                <div className="mb-6 flex justify-center">
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                    onSuccess={(token) => {
                      setTurnstileToken(token);
                      setError(null);
                    }}
                    onError={() => {
                      setError(t("login.captcha.error"));
                      resetTurnstile();
                    }}
                    onExpire={() => {
                      setError(t("login.captcha.error"));
                      resetTurnstile();
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !agreedToTerms}
                  className={`w-full py-3 rounded-lg font-medium ${
                    loading || !agreedToTerms
                      ? "bg-blue-600/50 cursor-not-allowed"
                      : "bg-[var(--foreground)] "
                  } text-[var(--background)] transition-colors`}
                >
                  {loading
                    ? t("signup.creatingAccount")
                    : t("signup.createAccount")}{" "}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                  {error}
                </div>
              )}

              {successResult && (
                <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
                  <div className="flex items-center mb-2">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-semibold">
                      {t("signup.success.accountCreated")}
                    </span>
                  </div>
                  <p>{t("signup.success.checkEmail")}</p>
                </div>
              )}

              <div className="mt-6 text-center text-[var(--foreground)]">
                {t("signup.alreadyHaveAccount")}{" "}
                <Link href="/login" className="text-blue-400 hover:underline">
                  {t("signup.signIn")}
                </Link>
              </div>
              <div className="mt-4 text-center text-sm text-[var(--foreground)]">
                <Link href="/terms" className="text-blue-400 hover:underline">
                  {t("login.termsOfUse")}
                </Link>
                {" • "}
                <Link href="/privacy" className="text-blue-400 hover:underline">
                  {t("login.privacyPolicy")}
                </Link>
              </div>
            </div>{" "}
          </div>
        </div>
      </div>
      <Analytics />
    </>
  );
}
