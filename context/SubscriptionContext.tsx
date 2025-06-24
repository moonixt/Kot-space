"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { checkSubscriptionStatus } from "../lib/checkSubscriptionStatus";

interface SubscriptionContextType {
  hasFullAccess: boolean;
  hasReadOnlyAccess: boolean;
  canEdit: boolean;
  canSave: boolean;
  canCreate: boolean;
  canRead: boolean;
  subscriptionStatus: string | null;
  subscriptionEndDate: string | null;
  isLoading: boolean;
  refreshSubscriptionStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [hasReadOnlyAccess, setHasReadOnlyAccess] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [canRead, setCanRead] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    null,
  );
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const refreshSubscriptionStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const status = await checkSubscriptionStatus(user.id);
      setHasFullAccess(status.hasFullAccess);
      setHasReadOnlyAccess(status.hasReadOnlyAccess);
      setCanEdit(status.canEdit);
      setCanSave(status.canSave);
      setCanCreate(status.canCreate);
      setCanRead(status.canRead);
      setSubscriptionStatus(status.subscriptionStatus);
      setSubscriptionEndDate(status.subscriptionEndDate);
    } catch (error) {
      console.error("Erro ao verificar status da assinatura:", error);
      // Em caso de erro, mantém valores seguros
      setHasFullAccess(false);
      setHasReadOnlyAccess(true); // Permite pelo menos leitura em caso de erro      setCanEdit(false);
      setCanSave(false);
      setCanCreate(false);
      setCanRead(true); // Allow reading in case of error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscriptionStatus();
  }, [user]);
  const value: SubscriptionContextType = {
    hasFullAccess,
    hasReadOnlyAccess,
    canEdit,
    canSave,
    canCreate,
    canRead,
    subscriptionStatus,
    subscriptionEndDate,
    isLoading,
    refreshSubscriptionStatus,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
}
