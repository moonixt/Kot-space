"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Trash2, Calendar, Edit, Save, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { ProtectedRoute } from "../../components/ProtectedRoute"; // Importar o ProtectedRoute
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  tags: string;
}

export default function NotePage() {
  const params = useParams();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchNote() {
      try {
        setLoading(true);

        if (!user) {
          setNote(null);
          return;
        }

        const { data, error } = await supabase
          .from("notes")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", user.id) // Garantir que a nota pertence ao usuário
          .single();

        if (error) throw error;
        setNote(data);
        setEditTitle(data.title || "");
        setEditContent(data.content || "");
      } catch (error) {
        console.error("Erro ao buscar nota:", error);
        setNote(null);
      } finally {
        setLoading(false);
      }
    }

    fetchNote();
  }, [params.id, user]);

  async function handleDelete() {
    const confirmDelete = confirm("Tem certeza que deseja excluir esta nota?");
    if (!confirmDelete) return;

    try {
      setDeleting(true);
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", params.id)
        .eq("user_id", user?.id);

      if (error) throw error;

      showToast("Nota excluída com sucesso!", "success");

      router.replace("/"); // Resolved bug of page locking after redirect
    } catch (error) {
      console.error("Erro ao excluir nota:", error);
      showToast("Erro ao excluir a nota.", "error");
      setDeleting(false);
    }
  }

  async function handleSave() {
    if (!note || !user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("notes")
        .update({
          title: editTitle,
          content: editContent,
        })
        .eq("id", note.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setNote({
        ...note,
        title: editTitle,
        content: editContent,
      });

      setEditMode(false);
      showToast("Nota atualizada com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
      showToast("Erro ao salvar a nota.", "error");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditTitle(note?.title || "");
    setEditContent(note?.content || "");
    setEditMode(false);
  }

  function showToast(message: string, type: "success" | "error") {
    const toast = document.createElement("div");
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 flex items-center gap-2 ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    } text-white z-50`;

    const icon =
      type === "success"
        ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>';

    toast.innerHTML = icon + message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-slate-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-2xl font-bold text-slate-400">
          Nota não encontrada
        </h3>
        <p className="text-slate-500 mt-2">
          A nota que você está procurando não existe ou foi removida.
        </p>
        <Link
          href="/"
          className="mt-6 text-blue-400 hover:underline flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Voltar para a página inicial
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(note.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <nav className="flex items-center justify-between mb-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Voltar para notas 🐈</span>
            </Link>

            <div className="flex items-center gap-2">
              {editMode ? (
                <>
                  <button
                    className="p-2 rounded-full hover:bg-green-500/20 text-green-500 transition-colors"
                    title="Salvar alterações"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-green-300/30 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save size={18} />
                    )}
                  </button>
                  <button
                    className="p-2 rounded-full hover:bg-red-500/20 text-red-500 transition-colors"
                    title="Cancelar edição"
                    onClick={cancelEdit}
                  >
                    <X size={18} />
                  </button>
                </>
              ) : (
                <button
                  className="p-2 rounded-full hover:bg-slate-800 transition-colors"
                  title="Editar nota"
                  onClick={() => setEditMode(true)}
                >
                  <Edit size={18} />
                </button>
              )}
            </div>
          </nav>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700 shadow-xl">
            <div className="p-6 md:p-8">
              {editMode ? (
                <>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Título da nota"
                    className="w-full text-3xl md:text-4xl font-bold mb-6 bg-transparent border-b border-slate-700 focus:border-blue-500 outline-none pb-2 transition-colors"
                  />

                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                    <Calendar size={14} />
                    <span>{formattedDate}</span>
                  </div>

                  {editMode && (
                    <div className="mb-4 text-xs text-slate-400 flex items-center gap-2 bg-slate-800/50 p-2 rounded">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>
                        Esta nota suporta formatação Markdown. Use # para
                        títulos, ** para negrito, * para itálico, etc.
                      </span>
                    </div>
                  )}

                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Conteúdo da nota (suporta formatação Markdown)"
                    className="w-full h-64 md:h-96 text-lg md:text-xl bg-transparent focus:outline-none resize-none"
                  />
                </>
              ) : (
                <>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    {note.title || "Sem título"}
                  </h1>

                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-8 border-b border-slate-700 pb-6">
                    <Calendar size={14} />
                    <span>{formattedDate}</span>
                  </div>

                  <div className="prose prose-invert prose-lg w-full break-words text-lg md:text-xl text-slate-200 leading-relaxed markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {note.content}
                    </ReactMarkdown>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-slate-700 p-6 flex justify-between items-center">
              <div className="text-sm text-slate-400">
                ID: {note.id.slice(0, 8)}...
              </div>
              <div className="text-sm text-slate-400">
                #
                {note.tags
                  ? note.tags.replace(/[\[\]"]/g, "").replace(/,/g, " #")
                  : ""}
              </div>

              <button
                onClick={handleDelete}
                disabled={deleting || editMode}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  deleting || editMode
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                }`}
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-300/30 border-t-transparent rounded-full animate-spin"></div>
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Excluir nota</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
