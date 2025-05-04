//protected routes for authenticated users

"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { checkFreeTrial } from "../../lib/checkFreeTrial";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isTrialActive, setIsTrialActive] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Se não está carregando a autenticação e não há usuário, redireciona para login
    if (!authLoading && !user) {
      console.log("Usuário não autenticado, redirecionando para login");
      router.push("/login");
      return;
    }

    // Verifica o período de teste apenas se houver usuário e não estiver já verificando
    if (user && !isVerifying && isTrialActive === null && !hasError) {
      const verifyTrial = async () => {
        setIsVerifying(true);
        try {
          const { isTrialActive } = await checkFreeTrial(user.id);
          
          if (!isTrialActive) {
            console.log("Período de teste expirado, redirecionando para pricing");
            router.push("/pricing");
          }
          
          setIsTrialActive(isTrialActive);
        } catch (error) {
          console.error("Erro ao verificar período de teste:", error);
          // Em caso de erro, NÃO permitir o acesso e redirecionar para uma página de erro
          setHasError(true);
          router.push("/error?type=trial-verification");
        } finally {
          setIsVerifying(false);
        }
      };

      verifyTrial();
    }
  }, [user, authLoading, router, isTrialActive, isVerifying, hasError]);

  // Mostra o loading apenas quando necessário
  const isLoading = authLoading || isVerifying || (user && isTrialActive === null && !hasError);

  if (hasError) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-red-500 text-xl mb-4">Erro ao verificar seu status de assinatura</div>
        <p className="text-gray-600 mb-4">Não foi possível verificar o seu período de teste. Por favor, tente novamente mais tarde.</p>
        <button 
          onClick={() => {
            setHasError(false);
            setIsTrialActive(null);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  return <>{children}</>;
}
