"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "../components/ProtectedRoute";
import Profile from "../profile/page";
import Tasks from "../components/tasks";
import CalendarView from "../components/CalendarView";
import { decrypt } from "../components/Encryption";
import { useTranslation } from "react-i18next";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTasks, setShowTasks] = useState(() => {
    if (typeof window !== "undefined") {
      const savedShowTasks = localStorage.getItem("showTasks");
      return savedShowTasks === null ? true : savedShowTasks === "true";
    }
    return true;
  });

  const [showCalendar, setShowCalendar] = useState(() => {
    if (typeof window !== "undefined") {
      const savedShowCalendar = localStorage.getItem("showCalendar");
      return savedShowCalendar === null ? true : savedShowCalendar === "true";
    }
    return true;
  });
  const { user } = useAuth();

  // Fetch notes from Supabase
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
      const savedShowCalendar = localStorage.getItem("showCalendar");

      setShowTasks(savedShowTasks === null ? true : savedShowTasks === "true");
      setShowCalendar(
        savedShowCalendar === null ? true : savedShowCalendar === "true",
      );
    }
  }, []);

  // Save display preferences to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("showTasks", showTasks.toString());
      localStorage.setItem("showCalendar", showCalendar.toString());
    }
  }, [showTasks, showCalendar]);

  useEffect(() => {
    fetchNotes();
  }, [user]);

  const router = useRouter();

  // Toggle functions that update state
  const toggleTasks = () => {
    setShowTasks(!showTasks);
  };

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  return (
    <ProtectedRoute>
      <div className="  smooth overflow-y-auto max-h-screen scrollbar">
        <div className="">
          <Profile />
        </div>
        <div className="p-4">
          <div className="grid">
            {/* New document button */}
            <button
              className="px-5 justify-center my-4 py-2 bg-[var(--text-color)] text-[var(--background)] hover:bg-opacity-60 transition-all  hover:shadow-md transition-colors flex items-center gap-2"
              onClick={() => router.push("/editor")}
            >
              <span>{t("dashboard.newDocument")}</span>
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
            {/* <h1 className="text-2xl font-bold mb-4">All your work </h1> */}

            {/* Toggle buttons container */}
            <div className="flex space-x-4 ">
              {/* Toggle tasks button */}
              <button
                onClick={toggleTasks}
                className="flex items-center gap-1 text-sm px-3 py-1  rounded hover:bg-[var(--container)] transition-colors"
              >
                {showTasks ? (
                  <>
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
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                    <span>{t("dashboard.hideTasks")}</span>
                  </>
                ) : (
                  <>
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
                    <span>{t("dashboard.tasks")}</span>
                  </>
                )}
              </button>

              {/* Calendar toggle button */}
              <button
                onClick={toggleCalendar}
                className="flex items-center gap-1 text-sm px-3 py-1  rounded hover:bg-[var(--container)] transition-colors"
              >
                {showCalendar ? (
                  <>
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
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                    <span>{t("dashboard.hideCalendar")}</span>
                  </>
                ) : (
                  <>
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
                    <span>{t("dashboard.calendar")}</span>
                  </>
                )}
              </button>
            </div>

            {/* Tasks component with conditional rendering and animation */}
            <div
              className={`transition-all duration-600 ease-in-out overflow-hidden ${
                showTasks
                  ? "max-h-[1000px] opacity-100"
                  : "max-h-0 opacity-0 mb-0"
              }`}
            >
              {showTasks && <Tasks />}
            </div>

            {/* Calendar component with conditional rendering */}
            <div
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
            </div>
          </div>

          {loading ? (
            <p>{t("dashboard.loading")}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-5">
              {notes.map((note) => (
                <Link
                  href={`/notes/${note.id}`}
                  key={note.id}
                  className="block h-full"
                >
                  <div className="h-full p-5 border-t-2  border-[var(--text-color)] bg-[var(--container)] bg-opacity-40 hover:bg-opacity-60 transition-all hover:translate-x-1 hover:shadow-md">
                    <h2 className="text-lg font-semibold mb-3 line-clamp-1">
                      {note.title
                        ? decrypt(note.title)
                        : t("dashboard.note.untitled")}
                    </h2>
                    <p className="text-sm text-[var(--foreground)] opacity-80 line-clamp-3 mb-4 h-14">
                      {decrypt(note.content).replace(/[#*`_]/g, "") ||
                        t("dashboard.note.noContent")}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-auto">
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
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
