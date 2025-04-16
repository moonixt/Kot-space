"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import Image from "next/image";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        throw error;
      }

      setMessage(t('resetPassword.successMessage'));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || t('resetPassword.errors.genericError'));
      } else {
        setError(t('resetPassword.errors.unknownError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--container)] p-4">
      <div className="w-full max-w-md">
        <div>
          <Image
            src="/crowlyH.png"
            alt={t('resetPassword.logoAlt')}
            width={212}
            height={212}
            className="mx-auto mb-6 rounded-md"
          />
        </div>
        <div className="bg-[var(--background)] backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700 shadow-xl">
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4 text-[var(--foreground)]">
              {t('resetPassword.title')}
            </h1>

            {message && (
              <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              <label
                htmlFor="email"
                className="block text-[var(--foreground)] mb-2"
              >
                {t('resetPassword.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-[var(--container)] border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--foreground)] mb-4"
              />
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-medium ${
                  loading
                    ? "bg-[var(--foreground)] cursor-not-allowed"
                    : "bg-[var(--foreground)]"
                } text-[var(--background)] transition-colors`}
              >
                {loading ? t('resetPassword.sending') : t('resetPassword.sendResetEmail')}
              </button>
            </form>
            
            <div className="mt-6 text-center text-[var(--foreground)]">
              <Link href="/login" className="text-blue-400 hover:underline">
                {t('resetPassword.backToLogin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
