"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Calendar,
  Edit,
  Save,
  X,
  Image,
  SmilePlus,
  LayoutList,
  ListOrdered,
  Eye,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import EmojiPicker, { Theme, EmojiClickData } from "emoji-picker-react";

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPickerContent, setShowEmojiPickerContent] = useState(false);

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

  // Função para inserir formatação Markdown
  const insertMarkdown = (markdownSyntax: string) => {
    const textarea = document.querySelector("textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = editContent.substring(start, end);
    let newText = "";

    switch (markdownSyntax) {
      case "bold":
        newText = `**${selectedText || "texto em negrito"}**`;
        break;
      case "italic":
        newText = `*${selectedText || "texto em itálico"}*`;
        break;
      case "heading1":
        newText = `# ${selectedText || " "}`;
        break;
      case "heading2":
        newText = `## ${selectedText || " "}`;
        break;
      case "code":
        newText = selectedText.includes("\n")
          ? `\`\`\`\n${selectedText || "código aqui"}\n\`\`\``
          : `\`${selectedText || "código"}\``;
        break;
      case "orderedList":
        if (selectedText) {
          const lines = selectedText.split("\n");
          newText = lines
            .map((line, index) => `${index + 1}. ${line}`)
            .join("\n");
        } else {
          newText = "1. Primeiro item\n2. Segundo item\n3. Terceiro item";
        }
        break;
      case "unorderedList":
        if (selectedText) {
          const lines = selectedText.split("\n");
          newText = lines.map((line) => `- ${line}`).join("\n");
        } else {
          newText = "- Primeiro item\n- Segundo item\n- Terceiro item";
        }
        break;
      case "link":
        newText = `[${selectedText || "texto do link"}](url)`;
        break;
      case "image":
        newText = `![${selectedText || "descrição da imagem"}](url_da_imagem)`;
        break;
    }

    const newContent =
      editContent.substring(0, start) + newText + editContent.substring(end);
    setEditContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + newText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Função para lidar com a seleção de emojis
  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    setEditTitle((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleEmojiSelectContent = (emojiData: EmojiClickData) => {
    setEditContent((prev) => prev + emojiData.emoji);
    setShowEmojiPickerContent(false);
  };

  // Função para lidar com upload de imagens
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!user) {
      alert("Você precisa estar logado para fazer upload de imagens!");
      return;
    }

    try {
      setImageUploadLoading(true);

      const file = files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from("images")
        .upload(filePath, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;
      const imageMarkdown = `\n\n![${file.name}](${imageUrl})\n`;

      setEditContent((currentContent) => currentContent + imageMarkdown);
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Erro ao fazer upload da imagem. Tente novamente.");
    } finally {
      setImageUploadLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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
        ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 00-1.414 1.414l2 2a1 1 001.414 0l4-4z" clip-rule="evenodd" /></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 101.414 1.414L10 11.414l1.293-1.293a1 1 001.414-1.414L11.414 10l1.293-1.293a1 1 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>';

    toast.innerHTML = icon + message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-[var(--foreground)]">
        <div className="w-12 h-12 border-4 border-text-[var(--foreground)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-[var(--foreground)]">
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
      <div className="min-h-screen bg-[var(--container)] flex justify-center ">
        <div className="w-full max-w-7xl bg-[var(--background)] min-h-screen shadow-xl flex flex-col">
          {/* Barra de navegação superior */}
          <div className="bg-[var(--container)] bg-opacity-10 px-4 py-2 text-[var(--foreground)] flex justify-between items-center border-b border-[var(--border-color)]">
            <Link
              href="/"
              className="flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--foreground-light)] transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Voltar para notas 🐈</span>
            </Link>

            <div className="flex items-center gap-2 pr-10">
              {editMode ? (
                <>
                  <button
                    className="rounded hover:bg-green-400 transition-colors px-2 py-1 flex items-center gap-1"
                    title="Salvar alterações"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-green-300 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Save size={16} /> Salvar
                      </>
                    )}
                  </button>
                  <button
                    className="rounded hover:bg-red-400 transition-colors px-2 py-1 flex items-center gap-1"
                    title="Cancelar edição"
                    onClick={cancelEdit}
                  >
                    <X size={16} /> Cancelar
                  </button>
                </>
              ) : (
                <button
                  className="rounded hover:bg-green-400 transition-colors px-2 py-1 flex items-center gap-1"
                  title="Editar nota"
                  onClick={() => setEditMode(true)}
                >
                  <Edit size={16} /> Editar
                </button>
              )}
            </div>
          </div>

          {/* Área do título */}
          <div className="p-4 border-b border-[var(--border-color)]">
            {editMode ? (
              <div className="flex items-center gap-3 relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-[var(--foreground)] hover:bg-[var(--container)] rounded-full transition-all duration-200"
                  title="Adicionar emoji"
                >
                  <SmilePlus size={22} />
                </button>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Título da nota"
                  className="w-full text-xl sm:text-2xl font-bold bg-transparent focus:outline-none text-[var(--foreground)]"
                />
                {showEmojiPicker && (
                  <div className="absolute z-50 top-14 left-4 shadow-xl rounded-lg overflow-hidden">
                    <EmojiPicker
                      onEmojiClick={handleEmojiSelect}
                      skinTonesDisabled
                      width={300}
                      height={400}
                      previewConfig={{ showPreview: false }}
                      theme={Theme.DARK}
                    />
                  </div>
                )}
              </div>
            ) : (
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                {note.title || "Sem título"}
              </h1>
            )}

            <div className="flex items-center gap-2 text-sm text-[var(--foreground)] mt-2">
              <Calendar size={14} />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Barra de ferramentas de formatação - aparece apenas no modo de edição */}
          {editMode && (
            <>
              <div className="bg-[var(--container)] bg-opacity-30 border-b border-[var(--border-color)] text-sm px-2 sm:px-4 py-2 text-[var(--foreground)] flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1 mr-2">
                  <button
                    className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors font-bold"
                    onClick={() => insertMarkdown("bold")}
                    title="Negrito"
                  >
                    B
                  </button>
                  <button
                    className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors italic"
                    onClick={() => insertMarkdown("italic")}
                    title="Itálico"
                  >
                    I
                  </button>
                  <button
                    className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors"
                    onClick={() => insertMarkdown("link")}
                    title="Link"
                  >
                    🔗
                  </button>
                </div>

                <div className="flex items-center space-x-1 mr-2">
                  <button
                    className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors"
                    onClick={() => insertMarkdown("heading1")}
                    title="Título 1"
                  >
                    H1
                  </button>
                  <button
                    className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors"
                    onClick={() => insertMarkdown("heading2")}
                    title="Título 2"
                  >
                    H2
                  </button>
                </div>

                <div className="flex items-center space-x-1 mr-2">
                  <button
                    className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors"
                    onClick={() => insertMarkdown("code")}
                    title="Código"
                  >
                    &lt;/&gt;
                  </button>
                  <button
                    className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors flex items-center justify-center relative"
                    onClick={() => {
                      if (imageUploadLoading) return;
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      } else {
                        insertMarkdown("image");
                      }
                    }}
                    title="Inserir Imagem"
                  >
                    <Image size={16} />
                    {imageUploadLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[var(--accent-color)] bg-opacity-70 rounded-md">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                </div>

                <div className="flex items-center space-x-1 mr-2">
                  <button
                    className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors flex items-center justify-center"
                    onClick={() => insertMarkdown("orderedList")}
                    title="Lista Numerada"
                  >
                    <ListOrdered size={16} />
                  </button>
                  <button
                    className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors flex items-center justify-center"
                    onClick={() => insertMarkdown("unorderedList")}
                    title="Lista com Marcadores"
                  >
                    <LayoutList size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setShowEmojiPickerContent(!showEmojiPickerContent)
                    }
                    className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors"
                    title="Adicionar emoji"
                  >
                    <SmilePlus size={16} />
                  </button>
                  {showEmojiPickerContent && (
                    <div className="absolute z-50 mt-28 shadow-xl rounded-lg overflow-hidden">
                      <EmojiPicker
                        onEmojiClick={handleEmojiSelectContent}
                        skinTonesDisabled
                        width={280}
                        height={350}
                        previewConfig={{ showPreview: false }}
                        theme={Theme.DARK}
                      />
                    </div>
                  )}
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    className={`rounded-md px-3 py-1.5 transition-all duration-200 flex items-center gap-1.5 ${
                      isPreviewMode
                        ? "bg-transparent text-[var(--foreground)] border border-[var(--border-color)]"
                        : "bg-[var(--button-bg1)] text-[var(--background)]"
                    }`}
                    onClick={() => setIsPreviewMode(false)}
                    disabled={!isPreviewMode}
                  >
                    <Edit size={16} /> Editar
                  </button>
                  <button
                    className={`rounded-md px-3 py-1.5 transition-all duration-200 flex items-center gap-1.5 ${
                      !isPreviewMode
                        ? "bg-transparent text-[var(--foreground)] border border-[var(--border-color)]"
                        : "bg-[var(--button-bg1)] text-[var(--background)]"
                    }`}
                    onClick={() => setIsPreviewMode(true)}
                    disabled={isPreviewMode}
                  >
                    <Eye size={16} /> Visualizar
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Área de conteúdo */}
          <div className="flex-grow overflow-auto p-4">
            {editMode ? (
              <>
                {!isPreviewMode ? (
                  <div className="h-full">
                    <div className="mb-4 text-xs bg-[var(--container)] bg-opacity-50 p-2 rounded flex items-center gap-2 text-[var(--foreground)]">
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
                      <span>Esta nota suporta formatação Markdown.</span>
                    </div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Conteúdo da nota (suporta formatação Markdown)"
                      className="w-full h-full min-h-[300px] text-lg bg-transparent focus:outline-none resize-none text-[var(--foreground)] p-2"
                      style={{ fontSize: "18px", lineHeight: "1.7" }}
                    />
                  </div>
                ) : (
                  <div className="markdown-content p-5 w-full bg-transparent text-[var(--foreground)] min-h-[300px] h-full text-lg overflow-auto border border-[var(--border-color)] rounded-md">
                    {editContent ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {editContent}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-[var(--foreground)] opacity-60 italic">
                        Nenhum conteúdo para visualizar...
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="h-full overflow-auto pr-2">
                <div className="prose prose-invert prose-lg w-full break-words text-lg text-[var(--foreground)] leading-relaxed markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {note.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-700 p-6 flex justify-between items-center">
            <div className="text-sm text-[var(--foreground)]">
              ID: {note.id.slice(0, 8)}...
            </div>
            <div className="text-sm text-[var(--foreground)]">
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
              title="Excluir nota"
            >
              {deleting ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Trash2 size={14} />
                  <span>Excluir</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
