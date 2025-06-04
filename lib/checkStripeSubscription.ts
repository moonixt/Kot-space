import { supabase } from "./supabase";

/**
 * Verifica se o usuário tem uma assinatura ativa do Stripe
 * baseado na presença do subscription_id na tabela user_metadata
 * @param userId - ID do usuário
 * @returns true se tem subscription_id (assinatura ativa), false se não tem (trial)
 */
export const checkStripeSubscription = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("user_metadata")
      .select("subscription_id")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Erro ao verificar subscription_id:", error);
      // Em caso de erro, considera como trial (mostra o botão)
      return false;
    }

    // Se subscription_id existe e não é null/vazio, usuário tem assinatura ativa
    return !!(data?.subscription_id && data.subscription_id.trim() !== "");
  } catch (error) {
    console.error("Erro ao verificar subscription_id:", error);
    // Em caso de erro, considera como trial (mostra o botão)
    return false;
  }
};