"use client";
import { useState, useEffect } from "react";
import {
  PlusCircle,
  Search,
  Clock as ClockIcon,
  Menu,
  X,
  BookOpen,
  BookOpenText,
  ChevronDown,
  FolderPlus,
  File,
  Trash2,
  Plus,
  Folder,
  FolderOpen,
  Inbox,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import { useTranslation } from "next-i18next";
import i18n from "../../i18n";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { decrypt } from "./Encryption";
import eventEmitter from "../../lib/eventEmitter";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu";

export default function Sidebox() {
  interface Note {
    id: string;
    title: string;
    content?: string;
    created_at: string;
    folder_id?: string | null;
  }

  interface Folder {
    id: string;
    name: string;
    expanded: boolean;
  }

  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [isFolderCreating, setIsFolderCreating] = useState(false);
  const [showFoldersTab, setShowFoldersTab] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const [, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  // Initialize language detection based on browser language
  useEffect(() => {
    const browserLang = navigator.language;
    // Check if the detected language is supported in our app
    const supportedLanguages = Object.keys(i18n.options.resources || {});

    if (browserLang && supportedLanguages.includes(browserLang)) {
      i18n.changeLanguage(browserLang);
    } else if (browserLang && browserLang.startsWith("pt")) {
      // Handle cases like pt-PT, pt, etc. falling back to pt-BR
      i18n.changeLanguage("pt-BR");
    }
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      if (!user) {
        setNotes([]);
        return;
      }

      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Descriptografia das notas antes de atualizar o estado
      const decryptedNotes = (data || []).map((note) => ({
        ...note,
        title: decrypt(note.title),
        content: note.content ? decrypt(note.content) : undefined,
      }));

      setNotes(decryptedNotes);
    } catch (error) {
      console.error("Erro ao buscar notas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      if (!user) {
        setFolders([]);
        return;
      }

      const { data } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      setFolders(
        (data || []).map((folder) => ({
          ...folder,
          expanded: folder.id === selectedFolderId,
        })),
      );
    } catch (error) {
      console.error("Erro ao buscar pastas:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotes();
      fetchFolders();
    } else {
      setNotes([]);
      setFolders([]);
      setLoading(false);
    }
  }, [user]);

  // Adicionar listener para eventos de atualização
  useEffect(() => {
    // Função que será chamada quando uma nota for salva
    const handleNoteSaved = () => {
      if (user) {
        fetchNotes();
        fetchFolders();
      }
    };

    // Registrar o listener
    eventEmitter.on("noteSaved", handleNoteSaved);

    // Limpar o listener quando o componente for desmontado
    return () => {
      eventEmitter.off("noteSaved", handleNoteSaved);
    };
  }, [user]); // Re-registra o listener se o usuário mudar

  const filteredNotes = notes.filter((note) => {
    // Filtrar por termo de busca
    const matchesSearch =
      note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtrar por pasta selecionada
    const matchesFolder = selectedFolderId
      ? note.folder_id === selectedFolderId
      : true;

    return matchesSearch && matchesFolder;
  });

  function getExcerpt(content: string | undefined, maxLength = 60) {
    if (!content) return "";
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t("sidebar.dateFormat.today");
    } else if (diffDays === 1) {
      return t("sidebar.dateFormat.yesterday");
    } else if (diffDays < 7) {
      return t("sidebar.dateFormat.daysAgo", { count: diffDays });
    } else {
      return date.toLocaleDateString(
        i18n.language === "pt-BR" ? "pt-BR" : "en-US",
        {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        },
      );
    }
  }

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const toggleFolder = (folderId: string) => {
    setFolders(
      folders.map((folder) =>
        folder.id === folderId
          ? { ...folder, expanded: !folder.expanded }
          : folder,
      ),
    );
  };

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    // Expande a pasta selecionada
    if (folderId) {
      setFolders(
        folders.map((folder) =>
          folder.id === folderId ? { ...folder, expanded: true } : folder,
        ),
      );
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim() || !user) return;

    try {
      // Set loading state to true when starting folder creation
      setIsFolderCreating(true);

      const { data, error } = await supabase
        .from("folders")
        .insert([{ name: newFolderName, user_id: user.id }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setFolders([
          ...folders,
          { id: data[0].id, name: data[0].name, expanded: false },
        ]);
        setNewFolderName("");
        setIsAddingFolder(false);
      }
    } catch (error) {
      console.error("Erro ao criar pasta:", error);
    } finally {
      // Always reset loading state when done
      setIsFolderCreating(false);
    }
  };

  const deleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      // Primeiro, atualiza as notas para remover a referência à pasta
      await supabase
        .from("notes")
        .update({ folder_id: null })
        .eq("folder_id", folderId)
        .eq("user_id", user.id);

      // Então, remove a pasta
      const { error } = await supabase
        .from("folders")
        .delete()
        .eq("id", folderId)
        .eq("user_id", user.id);

      if (error) throw error;

      setFolders(folders.filter((folder) => folder.id !== folderId));
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
    } catch (error) {
      console.error("Erro ao excluir pasta:", error);
    }
  };

  const moveNoteToFolder = async (noteId: string, folderId: string | null) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notes")
        .update({ folder_id: folderId })
        .eq("id", noteId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Atualiza o estado das notas localmente
      setNotes(
        notes.map((note) =>
          note.id === noteId ? { ...note, folder_id: folderId } : note,
        ),
      );
    } catch (error) {
      console.error("Erro ao mover nota:", error);
    }
  };

  return (
    <div className="w-full md:w-72 bg-[var(--background)] border-t md:border-l border-[var(--border-color)] md:h-screen md:fixed md:right-0 md:top-0 overflow-y-auto scrollbar">
      {/* Mobile toggle button */}
      <button
        onClick={toggleMobileSidebar}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-[var(--container)] text-[var(--foreground)] shadow-lg md:hidden"
        aria-label={
          isMobileOpen ? t("sidebar.closeMenu") : t("sidebar.openMenu")
        }
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 w-72 bg-[var(--background)] text-[var(--text-color)] shadow-xl transition-transform duration-300 ease-in-out z-40 
        ${isMobileOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold flex items-center">
                <BookOpen size={20} className="text-[var(--foreground)]" />
                {user ? (
                  <Link href={"/dashboard"}>
                    <span
                      className="text-[var(--foreground)] px-2 py-1 rounded-lg transition-colors duration-200 hover:bg-[var(--container)] hover:shadow-sm"
                      onClick={() => setIsMobileOpen(false)}
                    >
                      {t("sidebar.myWorkspace")}
                    </span>
                  </Link>
                ) : (
                  <span className="text-[var(--foreground)]">Fair-note</span>
                )}
              </h1>

              <div className="flex items-center">
                <button
                  onClick={() => router.push("/editor")}
                  className="p-2 rounded-full hover:bg-[var(--container)] transition-colors"
                  title={t("sidebar.newNote")}
                >
                  <PlusCircle size={20} className="text-[var(--foreground)]" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mt-3">
              <input
                type="text"
                placeholder={t("sidebar.searchNotes")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-8 bg-[var(--container)] placeholder-[var(--foreground)] rounded-lg border border-slate-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <Search
                size={16}
                className="absolute left-2 top-2.5 text-[var(--foreground)]"
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setShowFoldersTab(false)}
              className={`flex-1 py-3 px-2 text-center text-sm font-medium transition-colors ${!showFoldersTab ? "border-b-2 border-blue-500 text-[var(--text-color)]" : "text-[var(--foreground)]"}`}
            >
              {t("sidebar.notes")}
            </button>
            <button
              onClick={() => setShowFoldersTab(true)}
              className={`flex-1 py-3 px-2 text-center text-sm font-medium transition-colors ${showFoldersTab ? "border-b-2 border-blue-500 text-[var(--text-color)]" : "text-[var(--foreground)]"}`}
              disabled={!user}
              style={!user ? { opacity: 0.5, pointerEvents: "none" } : {}}
            >
              {t("sidebar.folders")}
            </button>
          </div>

          {/* Folders Section */}
          <div
            className={`overflow-y-auto flex-1 ${showFoldersTab ? "" : "hidden"} ${!user ? "hidden" : ""}`}
          >
            {/* Folders Header */}
            <div className="px-4 py-3 border-b border-slate-700/50 flex justify-between items-center bg-[var(--background-darker)]">
              <h3 className="text-sm font-medium text-[var(--foreground)]">
                {t("sidebar.folders")}
              </h3>
              <button
                onClick={() => setIsAddingFolder(true)}
                className="p-1 rounded-full hover:bg-[var(--container)] transition-colors"
                title={t("sidebar.newFolder")}
              >
                <FolderPlus size={16} className="text-[var(--foreground)]" />
              </button>
            </div>

            {isAddingFolder && (
              <div className="p-2 bg-[var(--container)] bg-opacity-30">
                <div className="flex">
                  <input
                    type="text"
                    defaultValue=""
                    onChange={(e) => {
                      // Usar um timeout para reduzir a frequência de atualização do estado
                      const value = e.target.value;
                      // Técnica básica para evitar múltiplas renderizações
                      setTimeout(() => {
                        setNewFolderName(value);
                      }, 0);
                    }}
                    placeholder={t("sidebar.folderName")}
                    className="flex-1 p-2 text-sm bg-[var(--container)] border border-slate-700 rounded-l-md focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createFolder();
                      if (e.key === "Escape") setIsAddingFolder(false);
                    }}
                    disabled={isFolderCreating}
                  />
                  <button
                    onClick={createFolder}
                    className="px-3 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors flex items-center justify-center min-w-[48px]"
                    disabled={isFolderCreating}
                  >
                    {isFolderCreating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      t("sidebar.add")
                    )}
                  </button>
                </div>
                <button
                  onClick={() => setIsAddingFolder(false)}
                  className="w-full mt-1 text-xs text-center py-1 text-[var(--foreground)] hover:underline"
                  disabled={isFolderCreating}
                >
                  {t("sidebar.cancel")}
                </button>
              </div>
            )}

            {/* Folders List */}
            <div className="px-2 py-1 space-y-1">
              {folders.length === 0 ? (
                <div className="px-4 py-3 text-center text-sm text-[var(--foreground)] opacity-70">
                  {t("sidebar.noFolders")}
                </div>
              ) : (
                folders.map((folder) => (
                  <div key={folder.id} className="rounded-md overflow-hidden">
                    <div
                      className={`p-2 hover:bg-[var(--container)] cursor-pointer transition-colors flex items-center justify-between ${
                        selectedFolderId === folder.id
                          ? "bg-[var(--container)] border-l-2 border-blue-500"
                          : ""
                      }`}
                      onClick={() => handleFolderSelect(folder.id)}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="p-1">
                          {folder.expanded ? (
                            <FolderOpen size={16} className="text-yellow-400" />
                          ) : (
                            <Folder size={16} className="text-yellow-400" />
                          )}
                        </div>
                        <ChevronDown
                          size={14}
                          className={`mx-1 transition-transform ${folder.expanded ? "rotate-0" : "-rotate-90"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFolder(folder.id);
                          }}
                        />
                        <span className="text-sm truncate">{folder.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/editor?folder=${folder.id}`);
                          }}
                          className="p-1 rounded hover:bg-[var(--container-darker)] transition-colors"
                          title={t("sidebar.addToFolder")}
                        >
                          <Plus
                            size={14}
                            className="text-[var(--foreground)]"
                          />
                        </button>
                        <button
                          onClick={(e) => deleteFolder(folder.id, e)}
                          className="p-1 rounded hover:bg-[var(--container-darker)] transition-colors"
                          title={t("sidebar.deleteFolder")}
                        >
                          <Trash2
                            size={14}
                            className="text-[var(--foreground)]"
                          />
                        </button>
                      </div>
                    </div>

                    {folder.expanded && (
                      <div className="ml-7 space-y-0.5 mt-0.5 mb-2 bg-[var(--container)] bg-opacity-20 rounded-md py-1">
                        {notes
                          .filter((note) => note.folder_id === folder.id)
                          .map((note) => (
                            <Link
                              href={`/notes/${note.id}`}
                              key={note.id}
                              onClick={() => setIsMobileOpen(false)}
                            >
                              <div className="px-3 py-1.5 hover:bg-[var(--container)] cursor-pointer transition-colors text-sm flex items-center justify-between group rounded-md mx-1">
                                <div className="flex items-center overflow-hidden">
                                  <File
                                    size={13}
                                    className="mr-2 flex-shrink-0 text-[var(--foreground)]"
                                  />
                                  <span className="truncate">
                                    {note.title || t("sidebar.untitled")}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    moveNoteToFolder(note.id, null);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--container-darker)] transition-colors"
                                  title={t("sidebar.removeFromFolder")}
                                >
                                  <X
                                    size={12}
                                    className="text-[var(--foreground)]"
                                  />
                                </button>
                              </div>
                            </Link>
                          ))}
                        {notes.filter((note) => note.folder_id === folder.id)
                          .length === 0 && (
                          <div className="py-2 text-xs text-center text-[var(--foreground)] opacity-70">
                            {t("sidebar.emptyFolder")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Notas sem pasta para arrastar */}
            <div className="mt-4 px-4 py-3 border-t border-b border-slate-700/50 flex items-center bg-[var(--background-darker)]">
              <Inbox size={16} className="text-[var(--foreground)] mr-2" />
              <h3 className="text-sm font-medium text-[var(--foreground)]">
                {t("sidebar.unfiled")}
              </h3>
            </div>

            <div className="px-2 py-2">
              {notes
                .filter((note) => note.folder_id === null)
                .map((note) => (
                  <div key={note.id} className="relative group">
                    <Link
                      href={`/notes/${note.id}`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <div className="p-2 rounded-md hover:bg-[var(--container)] cursor-pointer transition-colors mb-1 flex items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <File
                              size={14}
                              className="mr-2 text-[var(--foreground)]"
                            />
                            <span className="text-sm truncate">
                              {note.title || t("sidebar.untitled")}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-[var(--foreground)] mt-1 ml-6 opacity-70">
                            <ClockIcon size={12} className="mr-1" />
                            <span>{formatDate(note.created_at)}</span>
                          </div>
                        </div>
                        {/* Dropdown menu trigger for moving to folder */}
                        <div className="ml-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-60 group-hover:opacity-100"
                              >
                                <svg
                                  width="18"
                                  height="18"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  viewBox="0 0 24 24"
                                >
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="19" cy="12" r="1" />
                                  <circle cx="5" cy="12" r="1" />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 ">
                              <DropdownMenuLabel>
                                {t("sidebar.moveToFolder")}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuRadioGroup
                                value={note.folder_id || "none"}
                                onValueChange={(folderId) =>
                                  moveNoteToFolder(
                                    note.id,
                                    folderId === "none" ? null : folderId,
                                  )
                                }
                              >
                                <DropdownMenuRadioItem value="none">
                                  {t("sidebar.unfiled")}
                                </DropdownMenuRadioItem>
                                {folders.map((folder) => (
                                  <DropdownMenuRadioItem
                                    key={folder.id}
                                    value={folder.id}
                                  >
                                    {folder.name}
                                  </DropdownMenuRadioItem>
                                ))}
                              </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              {notes.filter((note) => note.folder_id === null).length === 0 && (
                <div className="py-3 text-sm text-center text-[var(--foreground)] opacity-70">
                  {t("sidebar.noUncategorizedNotes")}
                </div>
              )}
            </div>
          </div>

          {/* Notes list - shown only in "Notes" tab view */}
          <div
            className={`flex-1 overflow-y-auto px-2 py-2 space-y-1 ${showFoldersTab ? "hidden" : ""}`}
          >
            {!user ? (
              <div className="text-center py-8 text-slate-500">
                <p>{t("sidebar.loginToCreateNotes")}</p>
              </div>
            ) : loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <div key={note.id} className="relative group">
                  <Link
                    href={`/notes/${note.id}`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <div className="p-3 rounded-lg hover:bg-[var(--container)] cursor-pointer transition-colors border border-transparent hover:border-slate-700">
                      <div className="flex items-start space-x-3">
                        <BookOpenText
                          size={16}
                          className="mt-1 text-[var(--foreground)]"
                        />
                        <div className="flex-1 min-w-0">
                          <h2 className="font-medium truncate">
                            {note.title || t("sidebar.untitled")}
                          </h2>
                          {note.content && (
                            <p className="text-xs text-[var(--foreground)] mt-1 truncate">
                              {getExcerpt(note.content)}
                            </p>
                          )}
                          <div className="flex items-center text-xs text-[var(--foreground)] mt-2">
                            <ClockIcon size={12} className="mr-1" />
                            <span>{formatDate(note.created_at)}</span>
                            {note.folder_id && (
                              <div className="ml-2 flex items-center text-xs">
                                <Folder
                                  size={12}
                                  className="mr-1 text-yellow-400"
                                />
                                <span className="truncate max-w-[80px]">
                                  {folders.find((f) => f.id === note.folder_id)
                                    ?.name || ""}
                                </span>
                              </div>
                            )}
                            {!note.folder_id && (
                              <div className="ml-2 flex items-center text-xs">
                                <Inbox size={12} className="mr-1" />
                                <span>{t("sidebar.unfiled")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Dropdown menu trigger */}
                        <div className="ml-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-60 group-hover:opacity-100"
                              >
                                <svg
                                  width="18"
                                  height="18"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  viewBox="0 0 24 24"
                                >
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="19" cy="12" r="1" />
                                  <circle cx="5" cy="12" r="1" />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 ">
                              <DropdownMenuLabel>
                                {t("sidebar.moveToFolder")}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuRadioGroup
                                value={note.folder_id || "none"}
                                onValueChange={(folderId) =>
                                  moveNoteToFolder(
                                    note.id,
                                    folderId === "none" ? null : folderId,
                                  )
                                }
                              >
                                <DropdownMenuRadioItem value="none">
                                  {t("sidebar.unfiled")}
                                </DropdownMenuRadioItem>
                                {folders.map((folder) => (
                                  <DropdownMenuRadioItem
                                    key={folder.id}
                                    value={folder.id}
                                  >
                                    {folder.name}
                                  </DropdownMenuRadioItem>
                                ))}
                              </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                {searchTerm ? (
                  <div>
                    <p>{t("sidebar.noNotesFound")}</p>
                    <p className="text-xs mt-1">{t("sidebar.tryOtherTerms")}</p>
                  </div>
                ) : (
                  <div>
                    {user ? (
                      <>
                        <p>{t("sidebar.noNotesYet")}</p>
                        <p className="text-xs mt-1">
                          {t("sidebar.createYourFirst")}
                        </p>
                        <button
                          onClick={() => router.push("/editor")}
                          className="text-blue-400 text-sm mt-2 hover:underline"
                        >
                          {t("sidebar.createFirstNote")}
                        </button>
                      </>
                    ) : (
                      <p>{t("sidebar.loginToCreateNotes")}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700 text-xs text-[var(--foreground)]">
            <div className="flex justify-between items-center">
              <div>
                {t("sidebar.total")}: {notes.length}{" "}
                {notes.length === 1
                  ? t("sidebar.noteCountSingular")
                  : t("sidebar.noteCountPlural")}
              </div>
              {user && (
                <button
                  onClick={async () => {
                    try {
                      const { error } = await supabase.auth.signOut();
                      if (error) {
                        setError(error.message);
                      } else {
                        router.push("/login");
                      }
                    } catch (err: unknown) {
                      if (err instanceof Error) {
                        setError(err.message);
                      }
                    }
                  }}
                  className="bg-red-500 text-white hover:bg-red-400 px-4 py-2 rounded"
                >
                  {t("sidebar.logout")}
                </button>
              )}
              <button
                onClick={fetchNotes}
                className="p-1 hover:text-slate-300 transition-colors"
                title={t("sidebar.refresh")}
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
                >
                  <path d="M21 2v6h-6"></path>
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                  <path d="M3 22v-6h6"></path>
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                </svg>
              </button>
            </div>
          </div>
          <div className="border-t border-slate-500/30 p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-[var(--foreground)]">
                {t("sidebar.theme")}
              </p>
              <LanguageSwitcher />
            </div>
            <ThemeToggle />
          </div>
          {user && (
            <div className="px-4 py-4 bg-[var(--container)] text-[var(--foreground)] flex justify-center items-center text-sm">
              <p>{user.email}</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
