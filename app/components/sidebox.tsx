"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  StickyNote,
  File,
  Clock,
  Menu,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Erro ao buscar notas:", error);
    } finally {
      setLoading(false);
    }
  }

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
      return "Hoje";
    } else if (diffDays === 1) {
      return "Ontem";
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else {
      return date.toLocaleDateString("pt-BR", {
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
    <>
      {/* Mobile toggle button */}
      <button
        onClick={toggleMobileSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-full bg-slate-800 text-white shadow-lg md:hidden"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-slate-900 text-white shadow-xl transition-transform duration-300 ease-in-out z-40 
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <StickyNote size={20} className="text-blue-400" />
                <span>Minhas Notas</span>
              </h1>

              <button
                onClick={() => router.push("/")}
                className="p-2 rounded-full hover:bg-slate-700 transition-colors"
                title="Nova Nota"
              >
                <PlusCircle size={20} className="text-blue-400" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-8 bg-slate-800 rounded-lg border border-slate-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <Search
                size={16}
                className="absolute left-2 top-2.5 text-slate-500"
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
                  <div className="p-3 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-slate-700">
                    <div className="flex items-start space-x-3">
                      <File size={16} className="mt-1 text-slate-500" />
                      <div className="flex-1 min-w-0">
                        <h2 className="font-medium truncate">
                          {note.title || "Sem título"}
                        </h2>
                        {note.content && (
                          <p className="text-xs text-slate-400 mt-1 truncate">
                            {getExcerpt(note.content)}
                          </p>
                        )}
                        <div className="flex items-center text-xs text-slate-500 mt-2">
                          <Clock size={12} className="mr-1" />
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
                    <p>Nenhuma nota encontrada</p>
                    <p className="text-xs mt-1">Tente com outros termos</p>
                  </div>
                ) : (
                  <div>
                    <p>Nenhuma nota ainda</p>
                    <button
                      onClick={() => router.push("/editor")}
                      className="text-blue-400 text-sm mt-2 hover:underline"
                    >
                      Criar primeira nota
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700 text-xs text-slate-500">
            <div className="flex justify-between items-center">
              <div>
                Total: {notes.length} {notes.length === 1 ? "nota" : "notas"}
              </div>
              <button
                onClick={fetchNotes}
                className="p-1 hover:text-slate-300 transition-colors"
                title="Atualizar"
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
        </div>
      </aside>
    </>
  );
}

export default Sidebox;
