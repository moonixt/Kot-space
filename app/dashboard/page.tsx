"use client";

import { useEffect, useState } from "react";
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
import { Eye, Bookmark,   Info } from "lucide-react";
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

export default function DashboardPage() {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTasks, setShowTasks] = useState(() => {
    if (typeof window !== "undefined") {
      const savedShowTasks = localStorage.getItem("showTasks");
      return savedShowTasks === null ? false : savedShowTasks === "true";
    }
    return true;
  });
  const { user } = useAuth();

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

  // Buscar notas do Supabase, favoritos primeiro
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
        .order("favorite", { ascending: false, nullsFirst: true })
        .order("created_at", { ascending: false });
      setNotes(data || []);
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
  }, [showTasks]);
  // showCalendar, showTables

  useEffect(() => {
    fetchNotes();
  }, [user]);

  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="smooth overflow-y-auto max-h-screen scrollbar">
        <div>
          <Profile />
        </div>
        <div className="p-4  max-w-7xl mx-auto ">
             
          <div className="flex-1  gap-4">
            {/* New document button */}
            <div className="flex justify-center">
            <button
              className="px-4 py-2 flex justify-center sm:px-5 sm:py-2.5 sm:w-96 w-60 rounded-md  text-base font-medium  bg-[var(--theme)]  text-[var(--foreground)] hover:bg-opacity-60 transition-all hover:shadow-md transition-colors flex items-center gap-2"
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
                  ? "max-h-[1000px] pt-6 opacity-100"
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
                <DropdownMenuTrigger className="flex items-center gap-2 px-1 py-2 rounded-md bg-[var(--theme)] hover:bg-[var(--container)] transition-colors">
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
                  <Link href="/chat" passHref legacyBehavior>
                    <a className="flex items-center gap-2 px-2 py-2 rounded-md text-[var(--text-color)] hover:bg-[var(--container)] transition-colors" title="Help & Info">
                      <Info className="h-4 w-4" />
                      <span>{t("dashboard.info", "Help") || "Help & Info"}</span>
                    </a>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {loading ? (
            <p>{t("dashboard.loading")}</p>
          ) : (
            <div className="grid border-[var(--foreground)] grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-5 ">
              {notes.map((note) => (
                <Link
                  href={`/notes/${note.id}`}
                  key={note.id}
                  className="block h-full"
                >
                  <div className="h-[300px] sm:h-[400px] p-3 bg-[var(--container)]/30 backdrop-blur-sm hover:bg-opacity-60 transition-all hover:translate-x-1 hover:shadow-md flex flex-col">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        aria-label={note.favorite ? t("dashboard.unbookmark") : t("dashboard.bookmark")}
                        onClick={e => {
                          e.preventDefault();
                          toggleFavorite(note.id, note.favorite);
                        }}
                        className={`mb-1 rounded-full p-1 transition-colors ${note.favorite ? "bg-[var(--foreground)] text-[var(--background)]" : "hover:bg-[var(--foreground)] hover:text-[var(--background)]"}`}
                      >
                        <Bookmark size={20} fill={note.favorite ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <h2 className="text-sm font-semibold mb-3">
                      {note.title
                        ? decrypt(note.title)
                        : t("dashboard.note.untitled")}
                    </h2>     
                    <p className="text-sm text-[var(--foreground)] opacity-80 line-clamp-5 mb-4 flex-grow">
                      {decrypt(note.content).replace(/[#*`_]/g, "") ||
                        t("dashboard.note.noContent")}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-auto pt-3">
                      <span>
                        {new Date(note.created_at).toLocaleDateString()}
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
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1-2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
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
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
