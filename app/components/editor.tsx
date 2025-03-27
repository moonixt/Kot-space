"use client"

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

function Editor() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const saveNote = async () => {
        try {
            const { data, error } = await supabase
                .from('notes')
                .insert([{ title, content }])
                .select();
            
            if (error) throw error;
            alert('Nota salva com sucesso!');
            setTitle('');
            setContent('');
        } catch (error) {
            console.error('Erro ao salvar nota:', error);
        }
    };

    return (
        <div className="text-blue-400 p-8 text-4xl">
            <div className="w-full h-[600px] bg-slate-900 rounded-lg">
                <div className="p-8">
                    <input
                        className=" text-white focus:outline-none focus:ring-0 border-none w-full text-5xl"
                        placeholder="Title" 
                        maxLength={32}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <textarea
                    className="p-8 w-full  text-white resize-none focus:outline-none h-[300px]"
                    placeholder="Add your note" 
                    maxLength={1000}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <div className="flex justify-end p-4">
                <div className="p-8">
                    <button className="bg-white text-black border-2 border-red-950 rounded-full p-5 transition-all delay-100 duration-300 ease-in-out hover:bg-blue-400 hover:text-white " onClick={saveNote}>Add note</button>
                </div>
                </div>
            </div>
        </div>
    );
}

export default Editor;