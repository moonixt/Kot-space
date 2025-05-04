//protected routes for authenticated users
// NEED REVIEW

"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { checkFreeTrial } from "../../lib/checkFreeTrial";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isTrialActive, setIsTrialActive] = useState(false);

  useEffect(() => {
    //Consertado BUG the loading state infinito
    if (!isLoading && !user) {
      console.log("Usuário não autenticado, redirecionando para login");
      router.push("/login");
    }
    const verifyTrial = async () => {
      if (!isLoading && user) {
        const { isTrialActive } = await checkFreeTrial(user.id);
        if (!isTrialActive) {
          router.push("/pricing"); // Redireciona para a página de planos
        } else {
          setIsTrialActive(true);
        }
      }
    };

    verifyTrial();
  }, [user, isLoading, router]);

  if (isLoading || !isTrialActive) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  return <>{children}</>;
}
