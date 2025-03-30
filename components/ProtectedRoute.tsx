"use client";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      console.log("Usuário não autenticado, redirecionando para login");
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    // Exibir um carregamento enquanto verifica a autenticação
    return <div>Carregando...</div>;
  }

  // Renderizar o conteúdo protegido se o usuário estiver autenticado
  return <>{children}</>;
}
