import { supabase } from "./supabase";

export const checkSubscriptionStatus = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_metadata")
    .select("is_subscription_active, subscription_end_date, subscription_status")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error("Erro ao verificar o status da assinatura.");
  }

  const { is_subscription_active, subscription_end_date, subscription_status } = data;

  // Verifica se o período de assinatura expirou
  const now = new Date();
  const subscriptionEndDate = new Date(subscription_end_date);
  const subscriptionExpired = subscriptionEndDate < now;

  // Se a assinatura foi cancelada mas ainda não expirou, o usuário ainda deve ter acesso
  const hasAccess = (is_subscription_active || 
                    (subscription_status === "canceled" && !subscriptionExpired));

  return {
    isSubscriptionActive: hasAccess,
    subscriptionExpired: subscriptionExpired,
    subscriptionStatus: subscription_status,
    subscriptionEndDate: subscription_end_date,
  };
};

// Mantendo a função original com o nome antigo para retrocompatibilidade
export const checkFreeTrial = checkSubscriptionStatus;
