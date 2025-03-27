"use client"

import { useEffect, useState, use } from 'react';
import { supabase } from '../../../lib/supabase';
import Link from 'next/link';

export default function NotePage({ params }: { params: { id: string } }) {
  // Usar use() para desempacotar params que agora é uma Promise
  const resolvedParams = params;
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNote() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('id', resolvedParams.id)
          .single();

        if (error) throw error;
        setNote(data);
      } catch (error) {
        console.error('Erro ao buscar nota:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNote();
  }, [resolvedParams.id]);

  if (loading) return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  if (!note) return <div className="flex justify-center items-center h-screen">Nota não encontrada</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-blue-400 hover:underline mb-6 inline-block">
          ← Voltar
        </Link>
        
        <div className="bg-slate-900 rounded-lg p-8 mt-4">
          <h1 className="text-4xl font-bold mb-6">{note.title || 'Sem título'}</h1>
          <div className="text-sm text-gray-400 mb-8">
            Criado em: {new Date(note.created_at).toLocaleString()}
          </div>
          <div className="text-xl whitespace-pre-wrap">
            {note.content}
          </div>
        </div>
      </div>
    </div>
  );
}