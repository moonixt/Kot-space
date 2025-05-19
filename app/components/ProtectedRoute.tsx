//protected routes for authenticated users
// NEED REVIEW

"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { checkSubscriptionStatus } from "../../lib/checkSubscriptionStatus";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Handle authentication check
    if (!isLoading && !user && !isRedirecting) {
      console.log("Usuário não autenticado, redirecionando para login");
      setIsRedirecting(true);
      router.push("/login");
      return; // Stop execution here to prevent further checks
    }

    // Only verify subscription if user is authenticated
    const verifySubscription = async () => {
      if (!isLoading && user && !isRedirecting) {
        try {
          const { isSubscriptionActive, subscriptionStatus, subscriptionEndDate } = await checkSubscriptionStatus(user.id);
          
          console.log("Status da assinatura:", {
            isActive: isSubscriptionActive,
            status: subscriptionStatus,
            endDate: subscriptionEndDate
          });
          
          if (!isSubscriptionActive) {
            console.log("Assinatura inativa ou expirada, redirecionando para pricing");
            setIsRedirecting(true);
            router.push("/pricing"); // Redireciona para a página de planos
          } else {
            setHasActiveSubscription(true);
          }
        } catch (error) {
          console.error("Erro ao verificar status da assinatura:", error);
          // Fallback para prevenir loading infinito mesmo se a verificação falhar
          setHasActiveSubscription(true);
        }
      }
    };

    verifySubscription();
  }, [user, isLoading, router, isRedirecting]);

  // Show loading state when authenticating or redirecting
  if (isLoading || isRedirecting || (!hasActiveSubscription && user)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  // Only render children if user is authenticated and has active subscription
  return user ? <>{children}</> : null;
}
