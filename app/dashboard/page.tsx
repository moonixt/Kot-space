"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "../components/ProtectedRoute";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function DashboardPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchNotes();
  }, [user]);

  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="p-4 ">
        <div className="grid">
          <h1 className="text-2xl font-bold mb-4">Notas 🔥</h1>
          <button
            className="mb-4 px-4 py-2 bg-[var(--button-bg)] text-white rounded-lg hover:bg-[var(--hover-color)]"
            onClick={() => router.push("/")}
          >
            + Nova Nota
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {notes.map((note) => (
              <Link href={`/notes/${note.id}`} key={note.id}>
                <div className="p-4 border border-[var(--button-bg)] bg-[var(--container)] rounded-lg hover:shadow-md">
                  <h2 className="text-lg font-semibold mb-2">
                    {note.title || "Untitled"}
                  </h2>
                  <p className="text-sm text-[var(--foreground)]">
                    {note.content.length > 100
                      ? `${note.content.substring(0, 100)}...`
                      : note.content}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
