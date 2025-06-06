"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setMessage("Senha atualizada com sucesso!");
      setTimeout(() => router.push("/login"), 3000); // Redirect to login after 3 seconds
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Erro ao atualizar a senha.");
      } else {
        setError("Erro desconhecido.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-[var(--container)] p-4">
        <div className="w-full max-w-md bg-[var(--background)] p-6 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4 text-[var(--foreground)]">
            Atualizar Senha
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

          <form onSubmit={handleUpdatePassword}>
            <label
              htmlFor="password"
              className="block text-[var(--foreground)] mb-2"
            >
              Nova Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              {loading ? "Atualizando..." : "Atualizar Senha"}
            </button>
          </form>
        </div>
      </div>
      <Analytics />
    </>
  );
}
