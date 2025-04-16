"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function DeleteAccountPage() {
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();
  const { user, signOut } = useAuth();
//   const { t } = useTranslation();

  // Texto que o usuário deve digitar para confirmar exclusão
  const confirmationText = "EXCLUIR MINHA CONTA";

  // Verificações iniciais antes de mostrar o diálogo de confirmação
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Você precisa estar logado para excluir sua conta.");
      return;
    }

    if (!password) {
      setError("Por favor, digite sua senha atual para confirmar sua identidade.");
      return;
    }

    setIsLoading(true);

    try {
      // Verificar a senha atual do usuário por meio de uma tentativa de login
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email || "",
        password,
      });

      if (authError) {
        throw new Error("Senha incorreta. Por favor, verifique e tente novamente.");
      }

      // Se chegou aqui, a senha está correta, mostrar diálogo de confirmação
      setShowConfirmDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro ao verificar sua senha.");
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica de exclusão da conta após a confirmação final
  const handleDeleteAccount = async () => {
    if (confirmText !== confirmationText) {
      setError(`Por favor, digite "${confirmationText}" para confirmar.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error("Usuário não encontrado.");
      }

      // 1. Excluir dados do usuário das tabelas relacionadas
      // Notas
      await supabase.from("notes").delete().eq("user_id", user.id);
      
      // Eventos de calendário
      await supabase.from("calendar_events").delete().eq("user_id", user.id);
      
      // Metadados do usuário
      await supabase.from("user_metadata").delete().eq("id", user.id);
      
      // Perfil
      const { data: profileData } = await supabase
        .from("profiles")
        .select("avatar_url, wallpaper_url")
        .eq("id", user.id)
        .single();

      // 2. Excluir arquivos do Storage
      if (profileData) {
        if (profileData.avatar_url) {
          await supabase.storage.from("user-avatar").remove([profileData.avatar_url]);
        }
        if (profileData.wallpaper_url) {
          await supabase.storage.from("user-wallpaper").remove([profileData.wallpaper_url]);
        }
      }

      await supabase.from("profiles").delete().eq("id", user.id);

      // 3. Excluir a conta do usuário no Auth
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteError) throw deleteError;

      // 4. Fazer logout e redirecionar para a página inicial
      await signOut();
      router.push("/?message=Sua conta foi excluída com sucesso");
    } catch (err) {
      console.error("Erro ao excluir conta:", err);
      setError(err instanceof Error ? err.message : "Ocorreu um erro ao excluir sua conta.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--container)] rounded-xl overflow-hidden border border-[var(--border-color)] shadow-lg">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-red-500 mb-6">Excluir Conta</h1>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                {error}
              </div>
            )}

            {!showConfirmDialog ? (
              // Primeiro passo: Confirmação de senha
              <form onSubmit={handleInitialSubmit} className="space-y-6">
                <div>
                  <p className="text-[var(--foreground)] mb-4">
                    Ao excluir sua conta, você perderá permanentemente:
                  </p>
                  <ul className="list-disc pl-5 mb-4 text-[var(--foreground)]">
                    <li>Todas as suas notas</li>
                    <li>Eventos de calendário</li>
                    <li>Configurações personalizadas</li>
                    <li>Dados do perfil</li>
                  </ul>
                  <p className="text-[var(--foreground)] mb-6">
                    Esta ação <span className="font-bold text-red-500">não pode ser desfeita</span>.
                  </p>
                </div>

                <div>
                  <label htmlFor="password" className="block text-[var(--foreground)] mb-2">
                    Digite sua senha atual para confirmar:
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-[var(--foreground)]"
                  />
                </div>

                <div className="flex justify-between">
                  <Link
                    href="/login"
                    className="px-6 py-2 bg-[var(--background)] hover:bg-[var(--container)] text-[var(--foreground)] rounded-lg transition-colors"
                  >
                    Cancelar
                  </Link>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    {isLoading ? "Verificando..." : "Continuar"}
                  </button>
                </div>
              </form>
            ) : (
              // Segundo passo: Confirmação final com digitação de texto específico
              <div className="space-y-6">
                <p className="text-red-500 font-semibold mb-4">
                  Esta é uma ação permanente e irreversível!
                </p>
                <p className="text-[var(--foreground)] mb-4">
                  Para confirmar que deseja excluir permanentemente sua conta e todos os seus dados,
                  digite <span className="font-mono font-bold">{confirmationText}</span> abaixo:
                </p>

                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={confirmationText}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-[var(--foreground)]"
                />

                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setShowConfirmDialog(false);
                      setConfirmText("");
                      setError(null);
                    }}
                    className="px-6 py-2 bg-[var(--background)] hover:bg-[var(--container)] text-[var(--foreground)] rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isLoading || confirmText !== confirmationText}
                    className={`px-6 py-2 ${
                      isLoading || confirmText !== confirmationText
                        ? "bg-red-300 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    } text-white rounded-lg transition-colors`}
                  >
                    {isLoading ? "Excluindo..." : "Excluir Permanentemente"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}