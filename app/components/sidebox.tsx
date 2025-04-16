//Sidebar component, for fetching notes and display them in a list.
// NEED REVIEW

"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  Clock as ClockIcon,
  Menu,
  X,
  BookOpen,
  BookOpenText,
  } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import { useTranslation } from "next-i18next";
import i18n from "../../i18n";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { decrypt } from "./Encryption"; // Importando função de descriptografia

// import dynamic from 'next/dynamic';

// Importação dinâmica do Clock com carregamento apenas do lado do cliente
// const ClientOnlyClock = dynamic(() => import('react-live-clock'), { 
//   ssr: false,
//   loading: () => <span className="text-[var(--foreground)]">Carregando relógio...</span>
// });

function Sidebox() {
  interface Note {
    id: string;
    title: string;
    content?: string;
    created_at: string;
  }

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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
    } else if (browserLang && browserLang.startsWith('pt')) {
      // Handle cases like pt-PT, pt, etc. falling back to pt-BR
      i18n.changeLanguage('pt-BR');
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
      const decryptedNotes = (data || []).map(note => ({
        ...note,
        title: decrypt(note.title),
        content: note.content ? decrypt(note.content) : undefined
      }));

      setNotes(decryptedNotes);
    } catch (error) {
      console.error("Erro ao buscar notas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [user]);

  const filteredNotes = notes.filter(
    (note) =>
      note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
      return t('sidebar.dateFormat.today');
    } else if (diffDays === 1) {
      return t('sidebar.dateFormat.yesterday');
    } else if (diffDays < 7) {
      return t('sidebar.dateFormat.daysAgo', { count: diffDays });
    } else {
      return date.toLocaleDateString(i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US', {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
    }
  }

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <div className="w-full md:w-72 bg-[var(--background)] border-t md:border-l border-[var(--border-color)] md:h-screen md:fixed md:right-0 md:top-0 overflow-y-auto scrollbar">
      {/* Mobile toggle button - agora sempre visível */}
      <button
        onClick={toggleMobileSidebar}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-[var(--container)] text-[var(--foreground)] shadow-lg md:hidden"
        aria-label={isMobileOpen ? t('sidebar.closeMenu') : t('sidebar.openMenu')}
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar com novos estilos para melhor visibilidade */}
      <aside
        className={`fixed inset-y-0 right-0 w-72 bg-[var(--background)] text-[var(--text-color)] shadow-xl transition-transform duration-300 ease-in-out z-40 
        ${isMobileOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center  ">
              <h1 className="text-xl font-bold flex items-center">
                <BookOpen size={20} className="text-[var(--foreground)]" />
                {user ? (
                  <Link href={"/dashboard"}>
                    <span
                      className="text-[var(--foreground)] px-2 py-1 rounded-lg transition-colors duration-200 hover:bg-[var(--container)] hover:shadow-sm"
                      onClick={() => setIsMobileOpen(false)}
                    >
                      {t('sidebar.myWorkspace')}
                    </span>
                  </Link>
                ) : (
                  <span className="text-[var(--foreground)]">Fair-note</span>
                )}
              </h1>

              <button
                onClick={() => router.push("/editor")}
                className="p-2 rounded-full hover:bg-[var(--container)] transition-colors"
                title={t('sidebar.newNote')}
              >
                <PlusCircle size={20} className="text-[var(--foreground)]" />
              </button>
            </div>
            {/* <span className="flex items-center justify-center">
            <ClientOnlyClock format={'dddd HH:mm:ss'} ticking={true} />
            </span> */}
            {/* Search */}
            <div className="relative ">
              <input
                type="text"
                placeholder={t('sidebar.searchNotes')}
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

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <Link
                  href={`/notes/${note.id}`}
                  key={note.id}
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
                          {note.title || t('sidebar.untitled')}
                        </h2>
                        {note.content && (
                          <p className="text-xs text-[var(--foreground)] mt-1 truncate">
                            {getExcerpt(note.content)}
                          </p>
                        )}
                        <div className="flex items-center text-xs text-[var(--foreground)] mt-2">
                          <ClockIcon size={12} className="mr-1" />
                          <span>{formatDate(note.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                {searchTerm ? (
                  <div>
                    <p>{t('sidebar.noNotesFound')}</p>
                    <p className="text-xs mt-1">{t('sidebar.tryOtherTerms')}</p>
                  </div>
                ) : (
                  <div>
                    {user ? (
                      <>
                        <p>{t('sidebar.noNotesYet')}</p>
                        <p className="text-xs mt-1">{t('sidebar.createYourFirst')}</p>
                        <button
                          onClick={() => router.push("/editor")}
                          className="text-blue-400 text-sm mt-2 hover:underline"
                        >
                          {t('sidebar.createFirstNote')}
                        </button>
                      </>
                    ) : (
                      <p>{t('sidebar.loginToCreateNotes')}</p>
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
                {t('sidebar.total')}: {notes.length} {notes.length === 1 ? t('sidebar.noteCountSingular') : t('sidebar.noteCountPlural')}
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
                  {t('sidebar.logout')}
                </button>
              )}
              <button
                onClick={fetchNotes}
                className="p-1 hover:text-slate-300 transition-colors"
                title={t('sidebar.refresh')}
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
          <div className=" border-t border-slate-500/30">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-[var(--foreground)]">{t('sidebar.theme')}</p>
              <LanguageSwitcher />
            </div>
            <ThemeToggle />
          </div>
          {user && (
            <div className="px-4 py-4 bg-[var(--container)] text-[var(--foreground)] flex justify-center items-center text-sm">
              <p> {user ? user.email : ""}</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default Sidebox;
