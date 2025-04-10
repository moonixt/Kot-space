"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

const Profile = () => {
    const [wallpaperUrl, setWallpaperUrl] = useState("/static/images/default2.jpg")
    const [showWallpaperModal, setShowWallpaperModal] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { user } = useAuth()

    // Carregar wallpaper ao iniciar
    useEffect(() => {
        if (user) {
            getUserWallpaper()
        }
    }, [user])

    // Buscar wallpaper do usuário
    const getUserWallpaper = async () => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("wallpaper_url")
                .eq("id", user?.id)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            
            if (data?.wallpaper_url) {
                // Obter URL pública
                const { data: urlData } = supabase
                    .storage
                    .from("user-wallpaper")
                    .getPublicUrl(data.wallpaper_url)
                
                setWallpaperUrl(urlData.publicUrl)
            }
        } catch (error) {
            console.error("Erro ao buscar wallpaper:", error)
        }
    }

    // Upload de wallpaper
    const uploadWallpaper = async (file: File) => {
        if (!user || !file) return
        
        try {
            setUploading(true)
            
            // Criar nome de arquivo único
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            
            // Upload para o bucket
            const { error: uploadError } = await supabase
                .storage
                .from("user-wallpaper")
                .upload(fileName, file)
                
            if (uploadError) throw uploadError
            
            // Salvar referência no perfil
            const { error: updateError } = await supabase
                .from("profiles")
                .upsert({
                    id: user.id,
                    wallpaper_url: fileName,
                    updated_at: new Date().toISOString()
                })
                
            if (updateError) throw updateError
            
            // Atualizar UI
            const { data } = supabase
                .storage
                .from("user-wallpaper")
                .getPublicUrl(fileName)
                
            setWallpaperUrl(data.publicUrl)
            
        } catch (error) {
            console.error("Erro ao fazer upload:", error)
            alert("Erro ao enviar imagem")
        } finally {
            setUploading(false)
            setShowWallpaperModal(false)
        }
    }

    // Handler para seleção de arquivo
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        uploadWallpaper(e.target.files[0])
    }

    return (
        <div className="flex justify-center">
            <div className="bg-[var(--background)] text-[var(--background]">
                <div className="relative">
                    <Image
                        src={wallpaperUrl}
                        alt="Profile"
                        width={4000}
                        height={4000}
                        className="w-600 h-55 sm:h-130 md:h-70 2xl:h-150 object-cover"
                    />
                    
                    {/* Botão de edição de wallpaper */}
                    <button 
                        onClick={() => setShowWallpaperModal(true)}
                        className="absolute top-2 right-2 bg-[var(--background)] text-[var(--foreground)] p-2 rounded-full opacity-80 hover:opacity-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                </div>
                
                <div className="flex justify-center items-center gap-2 mt-[-50px] pb-10 relative  ">
                    <Avatar>
                        <AvatarImage
                            className="h-[40px] w-[40px]"
                            src="/icons/cop-note.png"
                        />  
                    </Avatar>
                    
                    <h2 className="italic text-[var(--foreground)] bg-[var(--background)]">{' "You are what you think" '}</h2>
                </div>

                {/* Modal de upload de wallpaper */}
                {showWallpaperModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-[var(--background)] p-6 rounded-lg w-80">
                            <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">Alter Wallpaper</h3>
                            
                            <div className="mb-4">
                                <label className="block text-sm text-[var(--foreground)] mb-2">
                                    Choose a image for your wallpaper:
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="text-sm text-[var(--foreground)]"
                                    disabled={uploading}
                                />
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setShowWallpaperModal(false)}
                                    className="px-4 py-2 text-[var(--foreground)] bg-[var(--container)] rounded"
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                
                                {uploading && (
                                    <div className="flex items-center px-4 py-2">
                                        <div className="h-5 w-5 border-2 border-t-transparent border-[var(--foreground)] rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Input oculto para upload alternativo */}
                <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                />
            </div>
        </div>
    )
}

export default Profile