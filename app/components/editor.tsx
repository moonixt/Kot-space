"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Save } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function Editor() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  // Função para salvar a nota no banco de dados
  const saveNote = async () => {
    if (!title.trim() && !content.trim()) return;

    // Verificar se usuário está autenticado
    if (!user) {
      // Exibir mensagem de erro
      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 flex items-center gap-2";
      notification.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 101.414 1.414L10 11.414l1.293 1.293a1 1 001.414-1.414L11.414 10l1.293-1.293a1 1 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>Você precisa estar logado para salvar notas!`;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 500);
      }, 3000);
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from("notes")
        .insert([
          {
            title,
            content,
            user_id: user.id, // Adiciona o ID do usuário à nota
          },
        ])
        .select();

      if (error) throw error;

      // Feedback visual de sucesso
      setTitle("");
      setContent("");

      // Notification toast instead of alert
      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-4 left-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 flex items-center gap-2";
      notification.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 00-1.414 1.414l2 2a1 1 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>Nota salva com sucesso!`;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 500);
      }, 3000);
    } catch (error) {
      console.error("Erro ao salvar nota:", error);

      // Notification toast para erro
      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 flex items-center gap-2";
      notification.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 101.414 1.414L10 11.414l1.293 1.293a1 1 001.414-1.414L11.414 10l1.293-1.293a1 1 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>Erro ao salvar nota. Tente novamente.`;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 500);
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen  text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <input
              className="bg-transparent text-white focus:outline-none focus:ring-0 border-none w-full text-3xl font-bold placeholder-slate-500"
              placeholder="Título da nota..."
              maxLength={32}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <textarea
            className="p-6 w-full bg-transparent text-white resize-none focus:outline-none min-h-[400px] text-lg placeholder-slate-500"
            placeholder="Escreva sua nota aqui..."
            maxLength={1000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="flex justify-between items-center p-4 bg-slate-800/80">
            <div className="text-sm text-slate-400">
              {content.length} / 1000 caracteres
            </div>

            <button
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                saving
                  ? "bg-slate-700 text-slate-300"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
              onClick={saveNote}
              disabled={saving || (!title.trim() && !content.trim())}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                  <span>Salvando</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Salvar nota</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Editor;
