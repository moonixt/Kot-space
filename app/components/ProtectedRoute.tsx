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
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Handle authentication check
    if (!isLoading && !user && !isRedirecting) {
      console.log("Usuário não autenticado, redirecionando para login");
      setIsRedirecting(true);
      router.push("/login");
      return; // Stop execution here to prevent further checks
    }

    // Only verify trial if user is authenticated
    const verifyTrial = async () => {
      if (!isLoading && user && !isRedirecting) {
        try {
          const { isTrialActive: trialStatus } = await checkFreeTrial(user.id);
          if (!trialStatus) {
            setIsRedirecting(true);
            router.push("/pricing"); // Redireciona para a página de planos
          } else {
            setIsTrialActive(true);
          }
        } catch (error) {
          console.error("Error checking trial status:", error);
          // Fallback to prevent infinite loading even if trial check fails
          setIsTrialActive(true);
        }
      }
    };

    verifyTrial();
  }, [user, isLoading, router, isRedirecting]);

  // Show loading state when authenticating or redirecting
  if (isLoading || isRedirecting || (!isTrialActive && user)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  // Only render children if user is authenticated and trial is active
  return user ? <>{children}</> : null;
}
