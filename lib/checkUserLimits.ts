import { supabase } from "./supabase";
import { checkStripeSubscription } from "./checkStripeSubscription";

interface UserLimits {
  notesCount: number;
  tasksCount: number;
  foldersCount: number;
  maxNotes: number;
  maxTasks: number;
  maxFolders: number;
  hasActiveSubscription: boolean;
  canCreateNote: boolean;
  canCreateTask: boolean;
  canCreateFolder: boolean;
}

/**
 * Verifica os limites do usuário baseado no status da subscription
 * Usuários sem subscription ativa (trial) têm limite de 20 notas, 20 tasks e 10 pastas
 * Usuários com subscription ativa têm limite ilimitado
 */
export const checkUserLimits = async (userId: string): Promise<UserLimits> => {
  try {
    // Verificar se tem subscription ativa
    const hasActiveSubscription = await checkStripeSubscription(userId);

    // Definir limites baseado na subscription
    const maxNotes = hasActiveSubscription ? Infinity : 20;
    const maxTasks = hasActiveSubscription ? Infinity : 20;
    const maxFolders = hasActiveSubscription ? Infinity : 10;

    // Buscar contagem atual de notas
    const { count: notesCount, error: notesError } = await supabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (notesError) {
      console.error("Erro ao contar notas:", notesError);
      throw notesError;
    }

    // Buscar contagem atual de tasks
    const { count: tasksCount, error: tasksError } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (tasksError) {
      console.error("Erro ao contar tasks:", tasksError);
      throw tasksError;
    }

    // Buscar contagem atual de pastas
    const { count: foldersCount, error: foldersError } = await supabase
      .from("folders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (foldersError) {
      console.error("Erro ao contar pastas:", foldersError);
      throw foldersError;
    }

    const currentNotesCount = notesCount || 0;
    const currentTasksCount = tasksCount || 0;
    const currentFoldersCount = foldersCount || 0;

    return {
      notesCount: currentNotesCount,
      tasksCount: currentTasksCount,
      foldersCount: currentFoldersCount,
      maxNotes,
      maxTasks,
      maxFolders,
      hasActiveSubscription,
      canCreateNote: hasActiveSubscription || currentNotesCount < maxNotes,
      canCreateTask: hasActiveSubscription || currentTasksCount < maxTasks,
      canCreateFolder:
        hasActiveSubscription || currentFoldersCount < maxFolders,
    };
  } catch (error) {
    console.error("Erro ao verificar limites do usuário:", error);
    // Em caso de erro, considera como trial com contagens zero
    return {
      notesCount: 0,
      tasksCount: 0,
      foldersCount: 0,
      maxNotes: 20,
      maxTasks: 20,
      maxFolders: 10,
      hasActiveSubscription: false,
      canCreateNote: true,
      canCreateTask: true,
      canCreateFolder: true,
    };
  }
};

/**
 * Função específica para verificar se pode criar uma nova nota
 */
export const canCreateNote = async (userId: string): Promise<boolean> => {
  const limits = await checkUserLimits(userId);
  return limits.canCreateNote;
};

/**
 * Função específica para verificar se pode criar uma nova task
 */
export const canCreateTask = async (userId: string): Promise<boolean> => {
  const limits = await checkUserLimits(userId);
  return limits.canCreateTask;
};

/**
 * Função específica para verificar se pode criar uma nova pasta
 */
export const canCreateFolder = async (userId: string): Promise<boolean> => {
  const limits = await checkUserLimits(userId);
  return limits.canCreateFolder;
};
