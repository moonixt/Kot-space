"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Configurar o supabase para usar persistência baseada em cookies
    supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event);
      console.log("New session:", !!newSession);

      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);

      if (event === "SIGNED_IN") {
        console.log("Usuário conectado, redirecionando para home");
        // router.push("/");  //Causando Bug de redirecionamento ao minimizar
      } else if (event === "SIGNED_OUT") {
        console.log("Usuário desconectado, redirecionando para login");
        router.push("/login");
      }
    });

    // Verificar sessão inicial
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        console.log("Verificação inicial de sessão:", !!data.session);

        if (error) {
          console.error("Erro ao verificar sessão:", error);
          throw error;
        }

        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (error) {
        console.error("Falha ao verificar sessão:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verificação manual da sessão após login
      const sessionCheck = await supabase.auth.getSession();
      console.log("Sessão após login:", !!sessionCheck.data.session);

      return data;
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log("Tentando criar conta com:", email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Para garantir que a sessão seja persistida
          emailRedirectTo: window.location.origin,
          data: {
            // Dados customizados, se necessário
          },
        },
      });

      if (error) {
        console.error("Erro ao criar conta:", error);
        throw error;
      }

      console.log("Conta criada:", !!data.user);

      // Verificar se precisa de confirmação de email
      if (data.user && data.user.identities?.length === 0) {
        console.log("Confirmação de email necessária");
        router.push(
          "/login?message=Verifique seu email para confirmar sua conta",
        );
      } else if (data.user) {
        // Usuário criado e logado automaticamente
        // O redirecionamento será tratado pelo onAuthStateChange
      }
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log("Tentando logout");
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erro ao fazer logout:", error);
        throw error;
      }

      console.log("Logout bem sucedido");
      // O redirecionamento já será tratado pelo onAuthStateChange
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
