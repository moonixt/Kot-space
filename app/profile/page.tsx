"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

const Profile = () => {
  const [wallpaperUrl, setWallpaperUrl] = useState(
    "/static/images/default2.jpg",
  );
  const [avatar_url, setAvatarUrl] = useState("/icons/cop-note.png");
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (user) {
      getUserWallpaper();
      getUserPhoto();
      getUserBio();
    }
  }, [user]);

  // Buscar wallpaper do usuário
  const getUserWallpaper = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("wallpaper_url")
        .eq("id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data?.wallpaper_url) {
        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from("user-wallpaper")
          .getPublicUrl(data.wallpaper_url);

        setWallpaperUrl(urlData.publicUrl);
      }
    } catch (error) {
      console.error("Erro ao buscar wallpaper:", error);
    }
  };

  const getUserPhoto = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data?.avatar_url) {
        const { data: urlData } = supabase.storage
          .from("user-avatar")
          .getPublicUrl(data.avatar_url);
        setAvatarUrl(urlData.publicUrl);
      }
    } catch (error) {
      console.error("Erro ao buscar avatar:", error);
    }
  };

  const getUserBio = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("bio")
        .eq("id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data?.bio) {
        setBio(data.bio);
      }
    } catch (error) {
      console.error("Error fetching bio:", error);
    }
  };

  const updateBio = async (newBio: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ bio: newBio, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) throw error;

      setBio(newBio);
    } catch (error) {
      console.error("Error updating bio:", error);
    }
  };

 

  const isImageFile = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    return allowedTypes.includes(file.type);
  };

  // Função auxiliar para excluir arquivos antigos com tratamento de erros de permissão
const deleteOldFile = async (bucket: string, filePath: string | null) => {
  if (!filePath) return;
  
  try {
    console.log(`Attempting to delete file ${filePath} from bucket ${bucket}`);
    
    // Verificar se o arquivo existe antes de tentar remover
    const { data: existsData, error: existsError } = await supabase.storage
      .from(bucket)
      .list('', {
        search: filePath
      });
      
    if (existsError) {
      console.error(`Error checking if file exists in ${bucket}:`, existsError);
      return;
    }
    
    // Se o arquivo não for encontrado, não precisamos deletar
    const fileExists = existsData && existsData.some(item => item.name === filePath);
    if (!fileExists) {
      console.log(`File ${filePath} not found in ${bucket}, skipping deletion`);
      return;
    }
    
    // Tentar deletar o arquivo
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
      
    if (error) {
      console.error(`Error deleting old file from ${bucket}:`, error);
      
    //   // Se for um erro de permissão, podemos registrar isso para análise posterior
    //   if (error.message?.includes('permission') || error.statusText === 'Unauthorized') {
    //     console.error(`Permission denied when trying to delete ${filePath} from ${bucket}`);
    //   }
    } else {
      console.log(`Successfully deleted ${filePath} from ${bucket}`);
    }
  } catch (err) {
    console.error(`Error in delete operation from ${bucket}:`, err);
  }
};

  // Upload de wallpaper
  const uploadWallpaper = async (file: File) => {
    if (!user || !file) return;

    if (!isImageFile(file)) {
      alert("Only image files are allowed.");
      return;
    }

    try {
      setUploading(true);

      // Primeiro, buscar o arquivo antigo
      const { data: oldFileData, error: fetchError } = await supabase
        .from("profiles")
        .select("wallpaper_url")
        .eq("id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;
      
      // Criar nome de arquivo único
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload para o bucket
      const { error: uploadError } = await supabase.storage
        .from("user-wallpaper")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Salvar referência no perfil
      const { error: updateError } = await supabase.from("profiles").upsert({
        id: user.id,
        wallpaper_url: fileName,
        updated_at: new Date().toISOString(),
      });

      if (updateError) throw updateError;

      // Excluir o arquivo antigo após o upload bem-sucedido
      if (oldFileData?.wallpaper_url) {
        await deleteOldFile("user-wallpaper", oldFileData.wallpaper_url);
      }

      // Atualizar UI
      const { data } = supabase.storage
        .from("user-wallpaper")
        .getPublicUrl(fileName);

      setWallpaperUrl(data.publicUrl);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao enviar imagem");
    } finally {
      setUploading(false);
      setShowWallpaperModal(false);
    }
  };

  // Upload de avatar
  const uploadAvatar = async (file: File) => {
    if (!user || !file) return;

    if (!isImageFile(file)) {
      alert("Only image files are allowed.");
      return;
    }

    try {
      setUploadingAvatar(true);

      // Primeiro, buscar o arquivo antigo
      const { data: oldFileData, error: fetchError } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

      // Criar nome de arquivo único
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload para o bucket
      const { error: uploadError } = await supabase.storage
        .from("user-avatar")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Salvar referência no perfil
      const { error: updateError } = await supabase.from("profiles").upsert({
        id: user.id,
        avatar_url: fileName,
        updated_at: new Date().toISOString(),
      });

      if (updateError) throw updateError;

      // Excluir o arquivo antigo após o upload bem-sucedido
      if (oldFileData?.avatar_url && !oldFileData.avatar_url.includes("cop-note.png")) {
        await deleteOldFile("user-avatar", oldFileData.avatar_url);
      }

      // Atualizar UI
      const { data } = supabase.storage
        .from("user-avatar")
        .getPublicUrl(fileName);

      setAvatarUrl(data.publicUrl);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao enviar imagem");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handler para seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    uploadWallpaper(e.target.files[0]);
  };

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
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>

        <div className="flex justify-center items-center gap-2 mt-[-50px] pb-2  relative  ">
          <div className="relative">
            <Avatar
              onClick={() => avatarFileInputRef.current?.click()}
              className="cursor-pointer hover:opacity-86 transition-opacity duration-700"
            >
              <AvatarImage
                className="h-[80px] w-[80px] rounded-full object-cover border-2 border-[var(--foreground)]"
                src={avatar_url}
                alt="Profile avatar"
              />
            </Avatar>
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <div className="h-6 w-6 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              </div>
            )}
            <button
              onClick={() => avatarFileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-[var(--background)] text-[var(--foreground)] p-1 rounded-full opacity-80 hover:opacity-100 border border-[var(--foreground)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  uploadAvatar(e.target.files[0]);
                }
              }}
              ref={avatarFileInputRef}
            />
          </div>

          <h2
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const newBio = e.target.innerText;
              if (newBio.length <= 50) {
                updateBio(newBio);
              } else {
                alert("Bio must be 50 characters or less.");
                e.target.innerText = bio; // Revert to the previous bio
              }
            }}
            className="italic text-[var(--foreground)] bg-[var(--background)]"
          >
            {bio || '"You are what you think"'}
          </h2>
        </div>

        {/* Modal de upload de wallpaper */}
        {showWallpaperModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[var(--background)] p-6 rounded-lg w-80">
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">
                Alter Wallpaper
              </h3>

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
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
};

export default Profile;
