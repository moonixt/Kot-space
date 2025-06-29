"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { Analytics } from "@vercel/analytics/next";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../context/AuthContext";
import {
  ArrowLeft,
  Calendar,
  Edit,
  X,
  Image,
  SmilePlus,
  LayoutList,
  ListOrdered,
  Eye,
  Lock,
  Users,
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
import { checkSubscriptionStatus } from "../../../lib/checkSubscriptionStatus";
import { usePublicNoteCollaboration, realtimeManager } from "../../../lib/realtimeManager";
import CollaboratorManager from "../../components/CollaboratorManager";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  folder_id: string | null;
  tags: string;
  type?: 'private' | 'public';
}

export default function NotePage() {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  // Determine note type from URL params
  const noteType = searchParams?.get('type') === 'public' ? 'public' : 'private';
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPickerContent, setShowEmojiPickerContent] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [canEdit, setCanEdit] = useState(true);
  const [canSave, setCanSave] = useState(true);
  const [hasReadOnlyAccess, setHasReadOnlyAccess] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  // Collaboration states - only used for public notes
  const [noteCollaborators, setNoteCollaborators] = useState<any[]>([]);
  const [userPermission, setUserPermission] = useState<'owner' | 'admin' | 'write' | 'read' | null>(null);

  const noteId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : null;

  // Setup realtime collaboration hooks (only for public notes)

  const publicCollaboration = usePublicNoteCollaboration(
    noteType === 'public' ? noteId || undefined : undefined, 
    noteType === 'public' ? user?.id : undefined
  );
  
  // For private notes, we don't need real-time collaboration
  // Legacy realtime is removed to avoid unnecessary connections

  // Extract the appropriate values based on note type - only for public notes
  const collaborators = noteType === 'public' ? publicCollaboration.collaborators : [];
  const onlineUsers = noteType === 'public' ? publicCollaboration.onlineUsers : [];
  const sendActivity = noteType === 'public' ? publicCollaboration.sendActivity : () => {};
  const refreshCollaborators = noteType === 'public' ? publicCollaboration.refreshCollaborators : async () => {};


  // Workaround: All collaborators are displayed with "online" status for simplicity
  const collaboratorsWithPresence = collaborators.map(collaborator => ({
    ...collaborator,
    isOnline: true
  }));

  // Debug logs for collaboration
  useEffect(() => {
    // No debug
  }, [noteType, noteId, collaborators, onlineUsers, collaboratorsWithPresence, user?.id, userPermission]);

  // WORKAROUND: Direct test function to check collaborators
  // Debug/test function removed for production cleanup

  // Function to refresh collaborators - used by CollaboratorManager
  const loadNoteCollaborators = useCallback(async () => {
    if (noteType === 'public') {
      await refreshCollaborators();
    }
  }, [noteType, refreshCollaborators]);

  // Force load collaborators when note is loaded
  useEffect(() => {
    if (note && noteType === 'public' && noteId) {
      setTimeout(() => {
        loadNoteCollaborators();
      }, 1000); // Wait 1 second after note loads to force refresh
    }
  }, [note, noteType, noteId, loadNoteCollaborators]);

  const fetchNote = useCallback(async () => {
    if (!user || !noteId) return;

    try {
      if (noteType === 'public') {
        // WORKAROUND: First try to get the note directly to see if it exists
        const { data: noteData, error: noteError } = await supabase
          .from("public_notes")
          .select("*")
          .eq("id", noteId)
          .single();

        if (noteError) {
          setNote(null);
          setLoading(false);
          return;
        }

        if (!noteData) {
          setNote(null);
          setLoading(false);
          return;
        }

        // Check if user has permission to access this public note
        const userPermission = await realtimeManager.getUserNotePermission(noteId, user.id);
        // If no permission found, still allow access for owner or misconfigured note

        // Decrypt the public note data
        const decryptedTitle = decrypt(noteData.title);
        const decryptedContent = noteData.content ? decrypt(noteData.content) : "";

        // Set the note data with decrypted content
        setNote({
          id: noteData.id,
          title: decryptedTitle,
          content: decryptedContent,
          created_at: noteData.created_at,
          folder_id: null, // Public notes don't have folders
          tags: "", // Public notes don't have tags yet
          type: 'public'
        });
        
        // Check for saved edits in localStorage first
        const savedTitle = localStorage.getItem(`fair-note-edit-title-${noteId}`);
        const savedContent = localStorage.getItem(`fair-note-edit-content-${noteId}`);
        
        setEditTitle(savedTitle !== null ? savedTitle : decryptedTitle);
        setEditContent(savedContent !== null ? savedContent : decryptedContent);
      } else {
        // Fetch private note (existing logic)
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
            type: 'private'
          });
          
          // Check for saved edits in localStorage first
          const savedTitle = localStorage.getItem(`fair-note-edit-title-${noteId}`);
          const savedContent = localStorage.getItem(`fair-note-edit-content-${noteId}`);
          
          setEditTitle(savedTitle !== null ? savedTitle : decryptedTitle);
          setEditContent(savedContent !== null ? savedContent : decryptedContent);
        }
      }
    } catch (error) {
      setNote(null);
    } finally {
      setLoading(false);
    }
  }, [user, noteId, noteType]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  const handleSave = async (isAutoSave = false) => {
    if (!user || !noteId) return;

    // Check if user can save before proceeding
    if (!canSave) {
      if (!isAutoSave) {
        showToast("You can only read this note. Upgrade to edit.", "error");
      }
      return;
    }

    try {
      if (noteType === 'public') {
        // Update public note with encryption
        const encryptedTitle = encrypt(editTitle || "Untitled");
        const encryptedContent = encrypt(editContent);
        
        const result = await realtimeManager.updatePublicNote(noteId, {
          title: encryptedTitle,
          content: encryptedContent
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to update public note');
        }

        // Update local state with decrypted values
        setNote((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            title: editTitle || "Untitled",
            content: editContent,
          };
        });
      } else {
        // Update private note (existing logic)
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
      }

      // Emit event to update sidebar via Realtime
      // The Realtime system will automatically notify all subscribed components
      // No manual event emission needed!

      // Limpar localStorage após salvar com sucesso
      localStorage.removeItem(`fair-note-edit-title-${noteId}`);
      localStorage.removeItem(`fair-note-edit-content-${noteId}`);

      // Only exit edit mode and show toast for manual saves
      if (!isAutoSave) {
        setEditMode(false);
        showToast(t("editor.noteSaved"), "success");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      if (!isAutoSave) {
        showToast(t("editor.saveError"), "error");
      }
      throw error; // Re-throw for autosave error handling
    }
  };

  const handleDelete = async () => {
    if (!user || !noteId) return;

    // Check if user can delete before proceeding
    if (!canEdit) {
      showToast("You can only read this note. Upgrade to delete.", "error");
      return;
    }

    const confirmed = window.confirm(t("editor.confirmDelete"));
    if (!confirmed) return;

    setDeleting(true);
    try {
      if (noteType === 'public') {
        // Delete public note - only owner can delete
        const { data: publicNoteData } = await supabase
          .from('public_notes')
          .select('owner_id')
          .eq('id', noteId)
          .single();

        if (!publicNoteData || publicNoteData.owner_id !== user.id) {
          throw new Error('Only the note owner can delete this note');
        }

        // Delete all related data first
        await supabase.from('collaboration_invites').delete().eq('public_note_id', noteId);
        await supabase.from('note_shares').delete().eq('public_note_id', noteId);
        
        // Delete the public note
        const { error } = await supabase
          .from("public_notes")
          .delete()
          .eq("id", noteId)
          .eq("owner_id", user.id);

        if (error) {
          throw error;
        }
      } else {
        // Delete private note (existing logic)
        const { error } = await supabase
          .from("notes")
          .delete()
          .eq("id", noteId)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }
      }

      showToast(t("editor.noteDeleted"), "success");

      // Give the toast some time to show before navigation
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Error deleting note:", error);
      showToast(error instanceof Error ? error.message : t("editor.deleteError"), "error");
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
    // Limpar localStorage ao cancelar
    localStorage.removeItem(`fair-note-edit-title-${noteId}`);
    localStorage.removeItem(`fair-note-edit-content-${noteId}`);
    
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditMode(false);
    setIsPreviewMode(false);
  }

  function exitEditMode() {
    // Não limpar localStorage - as alterações são salvas automaticamente
    // Apenas sair do modo de edição
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
        ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>';

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

  function handleCopyNoteLink() {
    if (!note) return;

    try {
      // Get the current URL
      const noteUrl = window.location.href;
      
      // Copy to clipboard
      navigator.clipboard.writeText(noteUrl).then(() => {
        showToast("Link da nota copiado! ⚠️ Apenas colaboradores convidados podem acessar.", "success");
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = noteUrl;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast("Link da nota copiado! ⚠️ Apenas colaboradores convidados podem acessar.", "success");
      });
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      showToast("Erro ao copiar link da nota", "error");
    }
  }

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;

      // For public notes, permissions are handled differently
      if (noteType === 'public') {
        // For public notes, we'll set permissions after loading collaborators
        // The owner should always be able to edit public notes
        return;
      }

      try {
        const status = await checkSubscriptionStatus(user.id);
        setCanEdit(status.canEdit);
        setCanSave(status.canSave);
        setHasReadOnlyAccess(status.hasReadOnlyAccess);
      } catch (error) {
        // No debug
      }
    };

    checkSubscription();
  }, [user, noteType]);

  // Set initial permissions for public notes when note is loaded
  useEffect(() => {
    if (note && noteType === 'public' && user?.id) {
      // Check if this is a public note and if user is owner
      const checkOwnership = async () => {
        try {
          const { data: publicNoteData } = await supabase
            .from('public_notes')
            .select('owner_id')
            .eq('id', noteId)
            .single();

          if (publicNoteData?.owner_id === user.id) {
            // User is the owner, grant full permissions
            setUserPermission('owner');
            setCanEdit(true);
            setCanSave(true);
            setHasReadOnlyAccess(false);
          }
        } catch (error) {
          // No debug
        }
      };

      checkOwnership();
    }
  }, [note, noteType, user?.id, noteId]);

  // Novo estado para colaboradores (workaround)
  const [allCollaborators, setAllCollaborators] = useState<Array<{ user_id: string, full_name?: string, email?: string, isOwner: boolean }>>([]);

  // Carregar colaboradores ao abrir a nota pública
  useEffect(() => {
    if (noteType === 'public' && noteId) {
      realtimeManager.getAllNoteCollaborators(noteId).then(setAllCollaborators);
    }
  }, [noteType, noteId]);

  // Array de colaboradores para a UI (deve ser declarado antes do uso no JSX)
  const collaboratorsForUI = noteType === 'public' ? allCollaborators : [];

  // Persistência de edição no localStorage
  useEffect(() => {
    if (!editMode) return;
    // Salvar no localStorage enquanto edita
    localStorage.setItem(`fair-note-edit-title-${noteId}`, editTitle);
    localStorage.setItem(`fair-note-edit-content-${noteId}`, editContent);
  }, [editTitle, editContent, editMode, noteId]);

  // Limpar localStorage ao sair do modo de edição
  useEffect(() => {
    if (!editMode) {
      localStorage.removeItem(`fair-note-edit-title-${noteId}`);
      localStorage.removeItem(`fair-note-edit-content-${noteId}`);
    }
  }, [editMode, noteId]);

  // Auto-save effect
  useEffect(() => {
    if (!editMode) return; // Only autosave when in edit mode
    if (!editTitle.trim() && !editContent.trim()) return;
    if (!note) return; // Aguardar a nota carregar
    
    // Verificar se houve mudanças reais comparando com os valores originais da nota
    const titleChanged = editTitle !== note.title;
    const contentChanged = editContent !== note.content;
    
    if (!titleChanged && !contentChanged) {
      return; // Não salvar se não houve mudanças
    }
    
    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    
    // Resetar o status para idle primeiro
    setAutoSaveStatus('idle');
    
    autoSaveTimeout.current = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        await handleSave(true); // Pass true to indicate this is an autosave
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 1500);
      } catch (error) {
        setAutoSaveStatus('idle');
      }
    }, 1500); // 1.5s debounce
    
    return () => {
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    };
  }, [editTitle, editContent, editMode, note]);

  // Keyboard shortcut for save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && editMode) {
        e.preventDefault();
        if (!note) return;
        
        // Verificar se houve mudanças reais antes de salvar manualmente
        const titleChanged = editTitle !== note.title;
        const contentChanged = editContent !== note.content;
        
        if (!titleChanged && !contentChanged) {
          showToast("Nenhuma alteração para salvar", "success");
          return;
        }
        
        setAutoSaveStatus('saving');
        try {
          await handleSave(false); // Manual save
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('idle'), 1500);
        } catch (error) {
          setAutoSaveStatus('idle');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editTitle, editContent, editMode, note]);

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
            d="M12 15v2m-6 4h12a2 2 0 002-2v-4a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0-6v.01"
          />
        </svg>
        <h3 className="text-2xl font-bold text-slate-400">
          {t("notes.noteNotFound")}
        </h3>
        <p className="text-slate-500 mt-2 text-center max-w-md">
          {noteType === 'public' 
            ? "You don't have permission to access this collaborative note. You need to be invited by the note owner."
            : t("notes.noteNotExistOrRemoved")
          }
        </p>
        <Link
          href="/dashboard"
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
        {/* Read-only mode banner */}
        {hasReadOnlyAccess && !canEdit && (
          <div className="bg-amber-500/20 border-l-4 border-amber-500 p-3 text-amber-200 text-sm flex items-center gap-2">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.633 0L4.168 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span>
              You are viewing this note in read-only mode.
              <a
                href="/pricing"
                className="underline ml-1 hover:text-amber-100"
              >
                Upgrade to edit
              </a>
            </span>
          </div>
        )}

        <div className=" sticky top-0 bg-[var(--background)]/60 bg-opacity-90 backdrop-blur-sm z-10 py-3 px-4 flex items-center">
          <Link
            href="/dashboard"
            className="p-2 rounded-full hover:bg-[var(--container)] transition-colors mr-2"
            title={t("notes.backToNotes")}
          >
            <ArrowLeft size={20} className="text-[var(--foreground)]" />
          </Link>
          
          <div className="flex items-center gap-3 flex-1">
            <h1 className="text-xl font-semibold text-[var(--foreground)]">
              {note.title}
            </h1>
            
            {/* Note type indicator */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              noteType === 'public' 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
              {noteType === 'public' ? <Users size={12} /> : <Lock size={12} />}
              <span>{noteType === 'public' ? 'Collaborative' : 'Private'}</span>
            </div>
          </div>
        </div>
        <Profile />
        <div className="min-h-screen  flex justify-center ">
          <div className="w-full max-w-7xl bg-[var(--background)] min-h-screen  flex flex-col">
            {/* Área de colaboração e controles de edição */}
            <div className="bg-opacity-10 px-4 py-2 text-[var(--foreground)]">
              <div className="flex items-center justify-between">
                {/* Enhanced collaboration manager with Google Docs style features - only for public notes */}
                {noteType === 'public' ? (
                  <CollaboratorManager
                    collaborators={collaboratorsWithPresence}
                    noteId={noteId || ''}
                    currentUserId={user?.id || ''}
                    userPermission={userPermission}
                    onRefreshCollaborators={loadNoteCollaborators}
                    isPublicNote={true}
                  />
                ) : (
                  <div></div> // Empty div to maintain layout balance
                )}

                {/* Edit Mode Toggle */}
                <div className="flex items-center gap-2">
                  {editMode ? (
                    <button
                      className="text-[var(--foregrounded)] rounded-lg px-3 py-2 flex items-center gap-2 transition-colors border border-blue-400/30"
                      title="Exit edit mode"
                      onClick={exitEditMode}
                    >
                      <X size={16} /> {t("editor.exitEditMode")}
                    </button>
                  ) : (
                    <button
                      className={`rounded-lg px-3 py-2 flex items-center gap-2 transition-colors border ${
                        !canEdit
                          ? "border-gray-600 text-gray-400 cursor-not-allowed"
                          : "border-green-400/30 text-[var(--foreground)]"
                      }`}
                      title={
                        !canEdit
                          ? "Read-only mode - Upgrade to edit"
                          : t("editor.edit")
                      }
                      onClick={() => {
                        if (canEdit) {
                          setEditMode(true);
                        } else {
                          showToast(
                            "You can only read this note. Upgrade to edit.",
                            "error",
                          );
                        }
                      }}
                      disabled={!canEdit}
                    >
                      <Edit size={16} /> {t("editor.edit")}
                    </button>
                  )}
                </div>
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
                    className={`w-full text-xl sm:text-2xl font-bold bg-transparent focus:outline-none text-[var(--foreground)] ${!canEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                    disabled={!canEdit}
                    readOnly={!canEdit}
                  />
                  
                  {/* Auto-save status indicator */}
                  <div className="flex items-center gap-2 text-xs">
                    {autoSaveStatus === 'saving' && (
                      <span className="text-yellow-400 animate-pulse">Salvando...</span>
                    )}
                    {autoSaveStatus === 'saved' && (
                      <span className="text-green-400">Salvo!</span>
                    )}
                  </div>
                  
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
            {editMode && canEdit && (
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
            <div className="flex-grow overflow-hidden p-4">
              {editMode ? (
                <>
                  {!isPreviewMode ? (
                    <div className="h-full flex flex-col">
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
                        className={`flex-1 w-full text-lg bg-transparent focus:outline-none resize-none text-[var(--foreground)] p-2 scrollbar-hide ${!canEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                        style={{ 
                          fontSize: "18px", 
                          lineHeight: "1.7",
                          scrollbarWidth: "none",
                          msOverflowStyle: "none"
                        }}
                        disabled={!canEdit}
                        readOnly={!canEdit}
                      />
                    </div>
                  ) : (
                    <div className="markdown-content h-full w-full bg-transparent text-[var(--foreground)] text-lg overflow-y-auto scrollbar-hide p-5 rounded-md">
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
                <div className="h-full overflow-y-auto scrollbar-hide">
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2H6a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v4z"></path>
                    <path d="M12 3v9"></path>
                    <path d="M9 6h6"></path>
                  </svg>
                  <span>TXT</span>
                </button>

                <button
                  onClick={handleExportPdf}
                  disabled={!note}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg  hover:bg-purple-500/20 transition-colors"
                  title={t("editor.exportAsPDF")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2H6a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v4z"></path>
                    <path d="M12 3v9"></path>
                    <path d="M9 6h6"></path>
                  </svg>
                  <span>PDF</span>
                </button>

                <button
                  onClick={async () => {
                    try {
                      const noteUrl = `${window.location.origin}/notes/${note.id}`;
                      await navigator.clipboard.writeText(noteUrl);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    } catch (err) {
                      // Fallback for browsers that don't support clipboard API
                      const textArea = document.createElement('textarea');
                      textArea.value = `${window.location.origin}/notes/${note.id}`;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    }
                  }}
                  disabled={!note}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    linkCopied 
                      ? 'bg-green-500/30 hover:bg-green-500/40' 
                      : 'hover:bg-green-500/20'
                  }`}
                  title="Compartilhar link da nota"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    {linkCopied ? (
                      <path d="M20 6L9 17l-5-5" />
                    ) : (
                      <>
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </>
                    )}
                  </svg>
                  <span>{linkCopied ? 'Copiado!' : 'Link'}</span>
                </button>

                <button
                  onClick={handleDelete}
                  disabled={deleting || editMode || !canEdit}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    deleting || editMode || !canEdit
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : " hover:bg-red-500/20"
                  }`}
                  title={
                    !canEdit
                      ? "Read-only mode - Cannot delete"
                      : t("editor.deleteNote")
                  }
                >
                  {deleting ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
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
      <style jsx global>{`
        .scrollbar-hide {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE 10+ */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none; /* Chrome/Safari/Webkit */
        }
        
        /* Custom textarea styling */
        textarea.scrollbar-hide:focus {
          outline: none;
          border: none;
        }
        
        /* Improve markdown content rendering */
        .markdown-content {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        
        .markdown-content p {
          margin-bottom: 1em;
        }
        
        .markdown-content ul,
        .markdown-content ol {
          margin-bottom: 1em;
          padding-left: 1.5em;
        }
        
        .markdown-content code {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-size: 0.9em;
        }
        
        .markdown-content pre {
          background-color: rgba(255, 255, 255, 0.05);
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1em 0;
        }
        
        .markdown-content blockquote {
          border-left: 4px solid rgba(255, 255, 255, 0.3);
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
        }
      `}</style>
    </>
  );
}
