"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Handle authentication check only, no subscription check
    if (!isLoading && !user && !isRedirecting) {
      console.log("Usuário não autenticado, redirecionando para login");
      setIsRedirecting(true);
      router.push("/login");
      return;
    }
  }, [user, isLoading, router, isRedirecting]);

  // Show loading state when authenticating or redirecting
  if (isLoading || isRedirecting) {
    return (
      <div className="flex justify-center items-center h-screen">
        {/* <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading...</span> */}
      </div>
    );
  }

  // Only render children if user is authenticated
  return user ? <>{children}</> : null;
}
