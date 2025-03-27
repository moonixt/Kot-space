"use client"
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

function Sidebox() {
    interface Note {
        id: string;
        title: string;
        created_at: string;
    }

    const [notes, setNotes] = useState<Note[]>([]);
    
    useEffect(() => {
        fetchNotes();
    }, []);
    
    async function fetchNotes() {
        const { data } = await supabase
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false });
        
        setNotes(data || []);
    }
    
    return (
        <div className="h-screen w-74 bg-slate-800 text-white">
            <div className="flex justify-center">
                <h1 className="text-center mt-4">Previous notes</h1>
            </div>
            <div className="pt-10 p-8 overflow-y-auto">
                {notes.map(note => (
                    <Link href={`/notes/${note.id}`} key={note.id}>
                        <div className="mb-4 p-2 hover:bg-slate-800 cursor-pointer">
                            <h2>{note.title || 'Sem título'}</h2>
                            <p className="text-xs text-gray-400 mt-1">
                                {new Date(note.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default Sidebox;