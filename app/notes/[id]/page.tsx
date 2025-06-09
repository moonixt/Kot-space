"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { Analytics } from "@vercel/analytics/next";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../context/AuthContext";
import {
  Save,
  ArrowLeft,
  Calendar,
  Edit,
  X,
  Image,
  SmilePlus,
  LayoutList,
  ListOrdered,
  Eye,
} from "lucide-react";
import { encrypt, decrypt } from "../../components/Encryption";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import Profile from "../../profile/page";
import EmojiPicker, { Theme, EmojiClickData } from "emoji-picker-react";
import i18n from "../../../i18n";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import jsPDF from "jspdf";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import eventEmitter from "../../../lib/eventEmitter";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  folder_id: string | null;
  tags: string;
}

export default function NotePage() {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPickerContent, setShowEmojiPickerContent] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const noteId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : null;

  const fetchNote = useCallback(async () => {
    if (!user || !noteId) return;

    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("id", noteId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const decryptedTitle = decrypt(data.title);
        const decryptedContent = data.content ? decrypt(data.content) : "";

        setNote({
          ...data,
          title: decryptedTitle,
          content: decryptedContent,
        });
        setEditTitle(decryptedTitle);
        setEditContent(decryptedContent);
      }
    } catch (error) {
      console.error("Error fetching note:", error);
    } finally {
      setLoading(false);
    }
  }, [user, noteId]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  const handleSave = async () => {
    if (!user || !noteId) return;

    setSaving(true);
    try {
      const encryptedTitle = encrypt(editTitle || "Untitled");
      const encryptedContent = encrypt(editContent);

      const { error } = await supabase
        .from("notes")
        .update({
          title: encryptedTitle,
          content: encryptedContent,
        })
        .eq("id", noteId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // Update note state with the edited values
      setNote((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          title: editTitle,
          content: editContent,
        };
      });

      // Emit event to update sidebar
      eventEmitter.emit("noteSaved");

      setEditMode(false);
      showToast(t("editor.noteSaved"), "success");
    } catch (error) {
      console.error("Error saving note:", error);
      showToast(t("editor.saveError"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !noteId) return;

    const confirmed = window.confirm(t("editor.confirmDelete"));
    if (!confirmed) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // Emit event to update sidebar
      eventEmitter.emit("noteSaved");

      showToast(t("editor.noteDeleted"), "success");

      // Give the toast some time to show before navigation
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Error deleting note:", error);
      showToast(t("editor.deleteError"), "error");
      setDeleting(false);
    }
  };

  // const handleFolderChange = async (folderId: string | null) => {
  //   if (!user || !noteId) return;

  //   try {
  //     const { error } = await supabase
  //       .from("notes")
  //       .update({
  //         folder_id: folderId
  //       })
  //       .eq("id", noteId)
  //       .eq("user_id", user.id);

  //     if (error) {
  //       throw error;
  //     }

  //     setNote(prevNote => prevNote ? { ...prevNote, folder_id: folderId } : null);
  //     // setShowFolderMenu(false);

  //     // Emit event to update sidebar
  //     eventEmitter.emit('noteSaved');
  //   } catch (error) {
  //     console.error("Error updating folder:", error);
  //   }
  // };

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

  function cancelEdit() {
    if (!note) return;
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditMode(false);
    setIsPreviewMode(false);
  }

  function showToast(message: string, type: "success" | "error") {
    const toast = document.createElement("div");
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 flex items-center gap-2 ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    } text-white z-50`;

    const icon =
      type === "success"
        ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 00-1.414 1.414l2 2a1 1001.414 0l4-4z" clip-rule="evenodd" /></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 101.414 1.414L10 11.414l1.293-1.293a1 1 00-1.414-1.414L11.414 10l1.293-1.293a1 1 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>';

    toast.innerHTML = icon + message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  function handleExportTxt() {
    if (!note) return;

    try {
      // Create content with title and note content
      const fileName = `${note.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`;
      const fileContent = `${note.title}\n\n${note.content}`;

      // Create a blob with the text content
      const blob = new Blob([fileContent], {
        type: "text/plain;charset=utf-8",
      });

      // Create an anchor element and trigger download
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(href);

      showToast(t("editor.exportSuccess"), "success");
    } catch (error) {
      console.error("Erro ao exportar nota:", error);
      showToast(t("editor.exportError"), "error");
    }
  }

  function handleExportPdf() {
    if (!note) return;

    try {
      // Create a new PDF document with orientation 'portrait' (default) and unit 'mm'
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
      });

      // Add title with larger font size
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text(note.title || "Sem título", 20, 20);

      // Add content with normal font size
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");

      // Get the current position after the title
      let yPosition = 30;

      // Split content into lines that fit on the page
      // PDF page width is ~180-190 in jsPDF's internal units at default settings
      const content = note.content || "";
      const splitContent = pdf.splitTextToSize(content, 170);

      // Calculate the height of each line (approximate)
      const lineHeight = 7;

      // Get page height (in the internal units)
      const pageHeight = pdf.internal.pageSize.height - 20; // margin bottom

      // Add content line by line, adding new pages when needed
      for (let i = 0; i < splitContent.length; i++) {
        // Check if we need a new page
        if (yPosition + lineHeight > pageHeight) {
          pdf.addPage();
          yPosition = 20; // Reset position for the new page
        }

        // Add the line to the PDF
        pdf.text(splitContent[i], 20, yPosition);
        yPosition += lineHeight;
      }

      // Generate filename from the note title
      const fileName = `${note.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;

      // Save PDF
      pdf.save(fileName);

      showToast(t("editor.exportSuccess"), "success");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      showToast(t("editor.exportError"), "error");
    }
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
          {t("notes.noteNotFound")}
        </h3>
        <p className="text-slate-500 mt-2">
          {t("notes.noteNotExistOrRemoved")}
        </p>
        <Link
          href="/"
          className="mt-6 text-blue-400 hover:underline flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          {t("notes.backToHome")}
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(note.created_at).toLocaleDateString(
    i18n.language === "en" ? "en-US" : "pt-BR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <>
      <ProtectedRoute>
        <div className=" sticky top-0 bg-[var(--background)]/60 bg-opacity-90 backdrop-blur-sm z-10 py-3 px-4 flex items-center">
          <Link
            href="/dashboard"
            className="p-2 rounded-full hover:bg-[var(--container)] transition-colors mr-2"
            title={t("notes.backToNotes")}
          >
            <ArrowLeft size={20} className="text-[var(--foreground)]" />
          </Link>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {note.title}
          </h1>
        </div>
        <Profile />
        <div className="min-h-screen  flex justify-center ">
          <div className="w-full max-w-7xl bg-[var(--background)] min-h-screen  flex flex-col">
            {/* Barra de navegação superior */}
            <div className="bg-opacity-10 px-4 py-2 text-[var(--foreground)] flex justify-between items-center">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--foreground-light)] transition-colors"
              >
                <ArrowLeft size={18} />
                <span>{t("notes.backToNotes")}</span>
              </Link>

              <div className="flex items-center gap-2 pr-10">
                {editMode ? (
                  <>
                    <button
                      className="rounded  transition-colors px-2 py-1 flex items-center gap-1"
                      title={t("editor.save")}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-green-300 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Save size={16} /> {t("editor.save")}
                        </>
                      )}
                    </button>
                    <button
                      className="rounded hover:bg-red-400 transition-colors px-2 py-1 flex items-center gap-1"
                      title={t("editor.cancel")}
                      onClick={cancelEdit}
                    >
                      <X size={16} /> {t("editor.cancel")}
                    </button>
                  </>
                ) : (
                  <button
                    className="rounded  transition-colors px-2 py-1 flex items-center gap-1"
                    title={t("editor.edit")}
                    onClick={() => setEditMode(true)}
                  >
                    <Edit size={16} /> {t("editor.edit")}
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
                    placeholder={t("editor.noteTitle")}
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
                  {note.title || t("sidebar.untitled")}
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
                      title={t("editor.bold")}
                    >
                      B
                    </button>
                    <button
                      className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors italic"
                      onClick={() => insertMarkdown("italic")}
                      title={t("editor.italic")}
                    >
                      I
                    </button>
                    <button
                      className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors"
                      onClick={() => insertMarkdown("link")}
                      title={t("editor.link")}
                    >
                      🔗
                    </button>
                  </div>

                  <div className="flex items-center space-x-1 mr-2">
                    <button
                      className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors"
                      onClick={() => insertMarkdown("heading1")}
                      title={t("editor.heading1")}
                    >
                      H1
                    </button>
                    <button
                      className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors"
                      onClick={() => insertMarkdown("heading2")}
                      title={t("editor.heading2")}
                    >
                      H2
                    </button>
                  </div>

                  <div className="flex items-center space-x-1 mr-2">
                    <button
                      className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors"
                      onClick={() => insertMarkdown("code")}
                      title={t("editor.code")}
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
                        <span>{t("editor.markdownSupport")}</span>
                      </div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder={t("editor.noteContent")}
                        className="w-full h-full min-h-[300px] text-lg bg-transparent focus:outline-none resize-none text-[var(--foreground)] p-2"
                        style={{ fontSize: "18px", lineHeight: "1.7" }}
                      />
                    </div>
                  ) : (
                    <div className="markdown-content p-5 w-full bg-transparent text-[var(--foreground)] min-h-[300px] h-full text-lg overflow-auto  rounded-md">
                      {editContent ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {editContent}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-[var(--foreground)] opacity-60 italic">
                          {t("editor.noPreviewContent")}
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

            <div className=" p-6  items-center">
              <div className="text-sm text-[var(--foreground)]">
                ID: {note.id.slice(0, 8)}...
              </div>
              {/* <div className="text-sm text-[var(--foreground)]">
                #
                {note.tags
                  ? note.tags.replace(/[\[\]"]/g, "").replace(/,/g, " #")
                  : ""}
              </div> */}

              <div className="flex gap-2">
                <button
                  onClick={handleExportTxt}
                  disabled={!note}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg  hover:bg-blue-500/20 transition-colors"
                  title={t("editor.exportAsTXT")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  <span>TXT</span>
                </button>

                <button
                  onClick={handleExportPdf}
                  disabled={!note}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg  hover:bg-purple-500/20 transition-colors"
                  title={t("editor.exportAsPDF")}
                >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  <span>PDF</span>
                </button>

                <button
                  onClick={handleDelete}
                  disabled={deleting || editMode}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    deleting || editMode
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : " hover:bg-red-500/20"
                  }`}
                  title={t("editor.deleteNote")}
                >
                  {deleting ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    <span>{t("editor.delete")}</span>
                  </>
                )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
      <Analytics />
    </>
  );
}
