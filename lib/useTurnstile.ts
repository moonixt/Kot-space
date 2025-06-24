import { useState, useCallback } from "react";

interface UseTurnstileReturn {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
  reset: () => void;
}

export const useTurnstile = (): UseTurnstileReturn => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSuccess = useCallback((token: string) => {
    setToken(token);
    setIsLoading(false);
    setError(null);
  }, []);

  const onError = useCallback((error: string) => {
    setError(error);
    setToken(null);
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    token,
    isLoading,
    error,
    onSuccess,
    onError,
    reset,
  };
};
