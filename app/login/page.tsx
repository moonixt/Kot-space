"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "next-i18next";
import i18n from "../../i18n";
import { Turnstile } from "@marsidev/react-turnstile";

// Create a separate client component for the part that uses useSearchParams
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false); // Add state to control email form visibility
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<any>(null);
  const searchParams = useSearchParams();
  const message = searchParams?.get("message");
  const { signIn } = useAuth();
  const router = useRouter();
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    // Verificar se o captcha foi completado
    if (!turnstileToken) {
      setError(t("login.captcha.required"));
      return;
    }
    
    setLoading(true);

    try {
      // Verificar o captcha no backend primeiro
      const captchaResponse = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: turnstileToken }),
      });

      const captchaResult = await captchaResponse.json();
      
      if (!captchaResult.success) {
        setError(t("login.captcha.error"));
        resetTurnstile();
        return;
      }

      console.log("Tentando fazer login na página de login");
      await signIn(email, password);
      console.log("Login realizado com sucesso");
      router.push("/"); // Consertado Bug de redirecionamento, Authcontext linha 37
    } catch (error) {
      if (error instanceof Error) {
        console.error("Erro ao fazer login:", error);
        setError(error.message || "Falha ao fazer login. Tente novamente.");
      } else {
        setError("Erro desconhecido ao fazer login.");
      }
      // Reset captcha em caso de erro
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account', // Força o usuário a escolher a conta
          }
        },
      });

      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Erro ao fazer login com Google:", error);
        setError(
          error.message || "Falha ao fazer login com Google. Tente novamente.",
        );
      } else {
        setError("Erro desconhecido ao fazer login com Google.");
      }
      setGoogleLoading(false);
    }
  };

  return (
    <>
      {message && (
        <div className="mb-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}
      <div className="flex justify-center ">
        <Image
          src="/static/images/kotnote.png"
          alt={t("login.logoAlt")}
          width={1000}
          height={100}
          className=" h-60 md:h-80 object-cover object-center"
          priority
        />
      </div>
      <div className="bg-[var(--background)] backdrop-blur-sm  overflow-hidden  ">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
            {t("login.title")}
          </h2>

          {/* Botão de login com Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className={`w-full py-3 mb-6 rounded-lg font-medium flex items-center justify-center ${
              googleLoading
                ? "bg-slate-700 cursor-not-allowed"
                : "bg-[var(--foreground)] "
            } text-[var(--background)] transition-colors`}
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {googleLoading
              ? t("login.loggingInWithGoogle")
              : t("login.signInWithGoogle")}
          </button>

          <div className="relative flex items-center my-6">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-[var(--foreground)] text-sm">
              {t("login.or")}
            </span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          {showEmailForm ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  className="block text-[var(--foreground)] mb-2"
                  htmlFor="email"
                >
                  {t("login.email")}
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

              <div className="mb-6">
                <label
                  className="block text-[var(--foreground)] mb-2"
                  htmlFor="password"
                >
                  {t("login.password")}
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

              <div className="flex flex-col space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-lg font-medium ${
                    loading
                      ? "bg-[var(--foreground)] cursor-not-allowed"
                      : "bg-[var(--foreground)] "
                  } text-[var(--background)] transition-colors`}
                >
                  {loading ? t("login.loggingIn") : t("login.signInWithEmail")}
                </button>
                
               
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="w-full py-3 rounded-lg font-medium border border-slate-700 text-[var(--foreground)] hover:bg-[var(--container)] transition-colors"
            >
              {t("login.signInWithEmail")}
            </button>
          )}

          <div className="mt-6 text-center text-[var(--foreground)]">
            {t("login.noAccount")}{" "}
            <Link href="/signup" className="text-blue-400 hover:underline">
              {t("login.createAccount")}
            </Link>
          </div>
          <div className="mt-6 text-center text-[var(--foreground)]">
            {t("login.forgotPassword")}{" "}
            <Link
              href="/reset-password"
              className="text-blue-400 hover:underline"
            >
              {t("login.resetPassword")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// Loading fallback component
function LoginFormLoading() {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700 shadow-xl p-8">
      <div className="animate-pulse">
        <div className="h-8 bg-slate-700 rounded w-3/4 mb-6"></div>
        <div className="h-12 bg-slate-700 rounded w-full mb-6"></div>
        <div className="h-4 bg-slate-700 rounded w-1/2 mx-auto mb-6"></div>
        <div className="space-y-4 mb-6">
          <div className="h-4 bg-slate-700 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-slate-700 rounded w-full"></div>
        </div>
        <div className="space-y-4 mb-6">
          <div className="h-4 bg-slate-700 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-slate-700 rounded w-full"></div>
        </div>
        <div className="h-12 bg-slate-700 rounded w-full mb-6"></div>
        <div className="h-4 bg-slate-700 rounded w-2/3 mx-auto"></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--container)] p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<LoginFormLoading />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
