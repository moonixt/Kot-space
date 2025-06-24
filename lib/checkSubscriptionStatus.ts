import { supabase } from "./supabase";

export const checkSubscriptionStatus = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_metadata")
    .select(
      "is_subscription_active, subscription_end_date, subscription_status",
    )
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error("Erro ao verificar o status da assinatura.");
  }

  const { is_subscription_active, subscription_end_date, subscription_status } =
    data;

  // Verifica se o período de assinatura expirou
  const now = new Date();
  const subscriptionEndDate = new Date(subscription_end_date);
  const subscriptionExpired = subscriptionEndDate < now;

  // Se a assinatura foi cancelada mas ainda não expirou, o usuário ainda deve ter acesso completo
  const hasFullAccess =
    is_subscription_active ||
    (subscription_status === "canceled" && !subscriptionExpired);

  // Usuários com trial expirado podem ler mas não editar
  const hasReadOnlyAccess = subscriptionExpired && !is_subscription_active;

  return {
    isSubscriptionActive: hasFullAccess,
    subscriptionExpired: subscriptionExpired,
    subscriptionStatus: subscription_status,
    subscriptionEndDate: subscription_end_date,
    hasFullAccess: hasFullAccess,
    hasReadOnlyAccess: hasReadOnlyAccess,
    canEdit: hasFullAccess,
    canSave: hasFullAccess,
    canCreate: hasFullAccess,
    canRead: hasFullAccess || hasReadOnlyAccess, // Users can read if they have full access OR read-only access
  };
};

// Mantendo a função original com o nome antigo para retrocompatibilidade
export const checkFreeTrial = checkSubscriptionStatus;
