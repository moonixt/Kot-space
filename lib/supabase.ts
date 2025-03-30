import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: "sb-auth-token",
    storage: {
      getItem: (key) => {
        if (typeof window === "undefined") return null;

        // Tentar obter do localStorage primeiro
        const value = window.localStorage.getItem(key);
        if (value) return value;

        // Fallback para cookie se não estiver no localStorage
        const cookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${key}=`));

        return cookie ? cookie.split("=")[1] : null;
      },
      setItem: (key, value) => {
        if (typeof window === "undefined") return;

        // Armazenar no localStorage
        window.localStorage.setItem(key, value);

        // E também em um cookie
        const maxAge = 100 * 365 * 24 * 60 * 60; // 100 anos em segundos
        document.cookie = `${key}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
      },
      removeItem: (key) => {
        if (typeof window === "undefined") return;

        // Remover do localStorage
        window.localStorage.removeItem(key);

        // E também do cookie
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      },
    },
  },
});
