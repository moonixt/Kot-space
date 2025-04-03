"use client";

import { useState, Suspense } from "react";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Image from "next/image";

// Create a separate client component for the part that uses useSearchParams
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const message = searchParams?.get("message");
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log("Tentando fazer login na página de login");
      await signIn(email, password);
      console.log("Login realizado com sucesso");

      // O redirecionamento agora é feito pelo onAuthStateChange
    } catch (error) {
      if (error instanceof Error) {
        console.error("Erro ao fazer login:", error);
        setError(error.message || "Falha ao fazer login. Tente novamente.");
      } else {
        setError("Erro desconhecido ao fazer login.");
      }
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
        },
      });

      if (error) throw error;

      // Não é necessário redirecionar, o Supabase já cuida disso
      // O redirecionamento será feito pelo próprio Supabase
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
      <div>
        <Image
          src="/fair-note.png"
          alt="Logo Fair-Note"
          width={212}
          height={212}
          className="mx-auto mb-6 rounded-md"
        />
      </div>
      <div className="bg-[var(--background)] backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700 shadow-xl">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
            Entrar no Fair-Note 😺
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
            {googleLoading ? "Entrando..." : "Entrar com Google"}
          </button>

          <div className="relative flex items-center my-6">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-[var(--foreground)] text-sm">
              ou
            </span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block text-[var(--foreground)] mb-2"
                htmlFor="email"
              >
                Email
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
                Senha
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

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium ${
                loading
                  ? "bg-[var(--foreground)] cursor-not-allowed"
                  : "bg-[var(--foreground)] "
              } text-[var(--background)] transition-colors`}
            >
              {loading ? "Entrando..." : "Entrar com Email"}
            </button>
          </form>

          <div className="mt-6 text-center text-[var(--foreground)]">
            Não tem uma conta?{" "}
            <Link href="/signup" className="text-blue-400 hover:underline">
              Criar conta
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
