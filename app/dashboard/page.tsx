"use client";

import { useEffect, useState, useMemo } from "react";
import { Analytics } from "@vercel/analytics/next";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "../components/ProtectedRoute";
import Profile from "../profile/page";
import Tasks from "../components/tasks";
// import CalendarView from "../components/CalendarView";
import { decrypt } from "../components/Encryption";
import { useTranslation } from "react-i18next";
// import Tables from "../components/tables";
import { Eye, Star } from "lucide-react";
//Info
import { checkStripeSubscription } from "../../lib/checkStripeSubscription";

// Bookmark
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  favorite?: boolean;
}

// Utility function to extract first image from markdown content
const extractFirstImage = (content: string): string | null => {
  const imageRegex = /!\[.*?\]\((.*?)\)/;
  const match = content.match(imageRegex);
  return match ? match[1] : null;
};

// Utility function to get text content without images and markdown formatting
const getTextPreview = (content: string, maxLength: number = 150): string => {
  // Remove image markdown syntax
  const withoutImages = content.replace(/!\[.*?\]\(.*?\)/g, '');
  // Remove other markdown formatting
  const withoutMarkdown = withoutImages.replace(/[#*`_]/g, "");
  // Clean up extra whitespace
  const cleaned = withoutMarkdown.replace(/\s+/g, ' ').trim();
  
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength) + "...";
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesLoaded, setNotesLoaded] = useState(false); // Controlar se já carregou as notas
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  const [showTasks, setShowTasks] = useState(() => {
    if (typeof window !== "undefined") {
      const savedShowTasks = localStorage.getItem("showTasks");
      return savedShowTasks === null ? false : savedShowTasks === "true";
    }
    return true;  });  
  const { user } = useAuth();

  // Memoizar o componente Profile corretamente  
  const MemoizedProfile = useMemo(() => <Profile />, [user?.id]);

  // Função para alternar o favorito
  const toggleFavorite = async (noteId: string, currentFavorite: boolean | undefined) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("notes")
        .update({ favorite: !currentFavorite })
        .eq("id", noteId)
        .eq("user_id", user.id);
      if (error) throw error;
      // Atualiza localmente
      setNotes((prev) =>
        prev.map((note) =>
          note.id === noteId ? { ...note, favorite: !currentFavorite } : note
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
    }
  };
  // Função para verificar se o usuário tem assinatura ativa do Stripe
  const fetchSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      const hasSubscription = await checkStripeSubscription(user.id);
      setHasActiveSubscription(hasSubscription);
    } catch (error) {
      console.error("Erro ao verificar status da assinatura:", error);
      // Em caso de erro, considera como trial (mostra o botão)
      setHasActiveSubscription(false);
    }
  };

  // Buscar notas do Supabase, favoritos primeiro
  const fetchNotes = async () => {
    if (!user || notesLoaded) return; // Não buscar se já carregou
    
    setLoading(true);
    try {
      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("favorite", { ascending: false, nullsFirst: true })
        .order("created_at", { ascending: false });
      setNotes(data || []);
      setNotesLoaded(true); // Marcar como carregado
    } catch (error) {
      console.error("Erro ao buscar notas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load display preferences from localStorage on initial render
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedShowTasks = localStorage.getItem("showTasks");
      // const savedShowCalendar = localStorage.getItem("showCalendar");
      // const savedShowTables = localStorage.getItem("showTables");

      setShowTasks(savedShowTasks === null ? true : savedShowTasks === "true");
      // setShowCalendar(
      //   savedShowCalendar === null ? true : savedShowCalendar === "true",
      // );
      // setShowTables(
      //   savedShowTables === null ? true : savedShowTables === "true",
      // );
    }
  }, []);

  // Save display preferences to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("showTasks", showTasks.toString());
      // localStorage.setItem("showCalendar", showCalendar.toString());
      // localStorage.setItem("showTables", showTables.toString());
    }
  }, [showTasks]);  // showCalendar, showTables
  useEffect(() => {
    fetchNotes();
    fetchSubscriptionStatus();
  }, [user]);
  // Resetar estado quando usuário mudar
  useEffect(() => {
    if (user?.id) {
      setNotesLoaded(false); // Resetar para novo usuário
      setHasActiveSubscription(null); // Resetar status da assinatura para novo usuário
    }
  }, [user?.id]);

  // Prevenir re-fetch desnecessário quando a página volta a ter foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Dashboard visível - não fazendo re-fetch das notas");
        // NÃO fazer fetchNotes() aqui
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const router = useRouter();

  return (
    <>
    <ProtectedRoute>      <div className="smooth overflow-y-auto max-h-screen scrollbar">
        <div>
          {MemoizedProfile}
        </div>

            <div className="p-4 sm:p-0  mx-auto max-w-screen  sm:max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-7xl 2xl:max-w-7xl ">
    {/* Renderização condicional do botão Free trial */}
    {hasActiveSubscription === false && (
      <div className="flex justify-end mb-4 ">        <button 
          className=" px-2 py-2 flex justify-center sm:px-5 sm:py-2.5 rounded-md  text-base font-medium  bg-gradient-to-r from-grey-900 to-blue-300/40 border border-[var(--border-theme)]/30 text-[var(--foreground)]   hover:bg-opacity-60 transition-all hover:shadow-md transition-colors flex items-center gap-2"
          onClick={() => router.push("/pricing")}
        >
        {t("dashboard.freeTrialButton")}
        </button>
      </div>
    )}
          <div className="flex-1  gap-4">
            {/* New document button */}
            
            <div className="flex justify-center">
            <button
              className="px-4 py-2 flex justify-center sm:px-5 sm:py-2.5 sm:w-96 w-60 rounded-md  text-base font-medium  bg-gradient-to-r from-[var(--button-theme)] to-[var(--theme2)]/40 border border-[var(--border-theme)]/30 text-[var(--text-theme)]   hover:bg-opacity-60 transition-all hover:shadow-md transition-colors flex items-center gap-2"
              onClick={() => router.push("/editor")}
            >
               <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>{t("dashboard.newDocument")}</span>
             
            </button>
           
            </div>

         

            {/* Tasks component with conditional rendering and animation */}
            <div
              className={`transition-all duration-600  ease-in-out overflow-hidden ${
                showTasks
                  ? "max-h-full pt-6 opacity-100"
                  : "max-h-0 opacity-0 mb-0"
              }`}
            >
              {showTasks && <Tasks />}
            </div>

            {/* Calendar component with conditional rendering */}
            {/* <div
              className={`transition-all duration-600 ease-in-out overflow-hidden mt-4 ${
                showCalendar
                  ? "max-h-[1000px] opacity-100"
                  : "max-h-0 opacity-0 mb-0"
              }`}
            >
              {showCalendar && (
                <div>
                  <h2 className="text-xl font-semibold ">
                    {t("dashboard.calendar")}
                  </h2>
                  <CalendarView />
                </div>
              )}
            </div> */}
          </div>

          {/* Tables component with conditional rendering */}
          {/* <div
            className={`transition-all duration-600 ease-in-out mt-4 ${
              showTables ? "opacity-100 " : "max-h-0 opacity-0 mb-0"
            }`}
          >
            {showTables && (
              <div className="w-[380px] sm:w-auto ">
                <Tables />
              </div>
            )}
          </div> */}
          
          <div className="flex justify-between items-center ">
           
            <h1 className="text-xl font-semibold mt-4 mb-2">
              {t("dashboard.documents")}
            </h1>
             {/* Toggle components dropdown */}
            <div className="">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-1 py-2 rounded-md bg-gradient-to-r from-[var(--button-theme)] to-[var(--theme2)]/40 border border-[var(--border-theme)]/30 text-[var(--text-theme)] hover:bg-[var(--container)] transition-colors">
                  <span>
                    <Eye />
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[var(--background)] border border-[var(--text-color)]">
                  <DropdownMenuLabel className="text-[var(--text-color)]">
                    {t("dashboard.components")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={showTasks}
                    onCheckedChange={setShowTasks}
                    className="text-[var(--text-color)]"
                  >
                    {t("dashboard.tasks")}
                  </DropdownMenuCheckboxItem>
                  {/* Info/help item */}
                  <DropdownMenuSeparator />
                  {/* <Link href="/chat" passHref legacyBehavior>
                    <a className="flex items-center gap-2 px-2 py-2 rounded-md text-[var(--text-color)] hover:bg-[var(--container)] transition-colors" title="Help & Info">
                      <Info className="h-4 w-4" />
                      <span>{t("dashboard.info", "Help") || "Help & Info"}</span>
                    </a>
                  </Link> */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
            {loading ? (
            <p>{t("dashboard.loading")}</p>
          ) : (            <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 pt-5 space-y-4">
              {notes.map((note, index) => {
                // Calculate dynamic height based on content length and index for variety
                const decryptedContent = decrypt(note.content);
                const firstImage = extractFirstImage(decryptedContent);
                const textPreview = getTextPreview(decryptedContent);
                
                const contentLength = decryptedContent.length;
                const baseHeight = firstImage ? 280 : 200; // More height for cards with images
                const contentHeight = Math.min(contentLength / 3, 150);
                const varietyHeight = (index % 3) * 70; // Adds variety: 0, 40, or 80px
                const totalHeight = baseHeight + contentHeight + varietyHeight;
                
                return (
                  <Link
                    href={`/notes/${note.id}`}
                    key={note.id}
                    className="block break-inside-avoid mb-4"
                  >                    <div 
                      className="p-4 bg-[var(--container)]/30 backdrop-blur-sm hover:bg-opacity-60 transition-all hover:scale-[1.02] hover:shadow-lg flex flex-col rounded-lg border border-[var(--foreground)]/20 overflow-hidden"
                      style={{ minHeight: `${totalHeight}px` }}
                    >
                      <div className="flex justify-end mb-2 ">
                        <button
                          type="button"
                          aria-label={note.favorite ? t("dashboard.unbookmark") : t("dashboard.bookmark")}
                          onClick={e => {
                            e.preventDefault();
                            toggleFavorite(note.id, note.favorite);
                          }}
                          className={`rounded-full p-1.5 transition-colors ${note.favorite ? " text-[var(--foreground)]" : "hover:bg-[var(--foreground)] hover:text-[var(--background)]"}`}
                        >
                          <Star size={18} fill={note.favorite ? "currentColor" : "none"} />
                        </button>
                      </div>
                      
                      <h2 className="text-base font-semibold mb-3 leading-tight break-words overflow-hidden">
                        {note.title
                          ? decrypt(note.title)
                          : t("dashboard.note.untitled")}
                      </h2>     
                      
                      {/* Display first image if available */}
                      {firstImage && (
                        <div className="mb-3 overflow-hidden rounded-lg">
                          <img 
                            src={firstImage} 
                            alt="Note preview" 
                            className="w-full h-32 object-cover object-top rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            onError={(e) => {
                              // Hide image if it fails to load
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      <p className="text-sm text-[var(--foreground)] opacity-80 mb-4 flex-grow leading-relaxed break-words overflow-hidden">
                        {textPreview || t("dashboard.note.noContent")}
                      </p>
                      <div className="flex justify-between items-center text-xs text-gray-500 mt-auto pt-3 border-t border-[var(--container)]/20">
                        <span>
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-60"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1-2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!loading && notes.length === 0 && (
            <div className="flex flex-col items-center justify-center p-10 border border-dashed border-[var(--foreground)] bg-opacity-10 mt-4">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-4 opacity-50"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-6"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              <h3 className="text-lg font-semibold mb-2">
                {t("dashboard.emptyState.title")}
              </h3>
              <p className="text-sm text-[var(--foreground)] opacity-70 mb-4 text-center">
                {t("dashboard.emptyState.description")}
              </p>
              <button
                className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] hover:bg-opacity-80 transition-colors flex items-center gap-2"
                onClick={() => router.push("/editor")}
              >
                <span>{t("dashboard.emptyState.createFirstNote")}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          )}        </div>
      </div>
    </ProtectedRoute>
      <Analytics />
    </>
  );
}
