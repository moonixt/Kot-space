"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import Image from "next/image";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      // O redirecionamento já está tratado na função signUp
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Erro ao criar conta:", error);
        setError(error.message || "Falha ao criar conta. Tente novamente.");
      } else {
        setError("Erro desconhecido ao criar conta.");
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
            src="/crowlyH.png"
            alt="Logo Fair-Note"
            width={212}
            height={212}
            className="mx-auto mb-6 rounded-md"
          />
        </div>
        <div className="bg-[var(--background)] backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700 shadow-xl">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              Criar uma conta no Fair-Note
            </h2>

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

              <div className="mb-4">
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

              <div className="mb-6">
                <label
                  className="block text-[var(--foreground)] mb-2"
                  htmlFor="confirmPassword"
                >
                  Confirmar Senha
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
                {loading ? "Criando conta..." : "Criar conta"}
              </button>
            </form>

            <div className="mt-6 text-center text-[var(--foreground)]">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-blue-400 hover:underline">
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
