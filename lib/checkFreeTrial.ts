import { supabase } from "./supabase";

export const checkFreeTrial = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_metadata")
    .select("is_trial_active, trial_end_date")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error("Erro ao verificar o período de teste.");
  }

  const { is_trial_active, trial_end_date } = data;

  // Verifica se o período de teste expirou
  const now = new Date();
  const trialExpired = new Date(trial_end_date) < now;

  return {
    isTrialActive: is_trial_active && !trialExpired,
    trialExpired,
  };
};