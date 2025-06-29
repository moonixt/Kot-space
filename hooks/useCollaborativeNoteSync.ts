import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { decrypt } from '../app/components/Encryption';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
  type: 'private' | 'public';
}

interface UseCollaborativeNoteSyncProps {
  noteId: string | null;
  noteType: 'private' | 'public';
  user: any;
  isEnabled: boolean; // Only sync when note is open and user is viewing it
  editMode?: boolean; // Optional: if provided, will pause polling during edit mode
}

interface SyncResult {
  note: Note | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isOnline: boolean;
  hasConflict: boolean; // New: indicates if there's a potential conflict
  conflictNote: Note | null; // New: the conflicting version from server
}

export function useCollaborativeNoteSync({
  noteId,
  noteType,
  user,
  isEnabled,
  editMode = false
}: UseCollaborativeNoteSyncProps): SyncResult {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictNote, setConflictNote] = useState<Note | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedVersion = useRef<string | null>(null);
  const userEditTimestamp = useRef<Date | null>(null);
  const isFetching = useRef<boolean>(false); // Prevent concurrent fetches

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchNoteUpdate = useCallback(async () => {
    // Validações mais rigorosas
    if (!noteId || !user || !isOnline || noteType !== 'public' || !isEnabled) {
      return;
    }

    // Prevent concurrent fetches
    if (isFetching.current) {
      console.log('[CollaborativeSync] Fetch already in progress, skipping');
      return;
    }

    isFetching.current = true;

    try {
      setError(null);
      
      // Log para debug
      console.log('[CollaborativeSync] Fetching note update for:', noteId);
      
      const { data: noteData, error: noteError } = await supabase
        .from("public_notes")
        .select("*, updated_at")
        .eq("id", noteId)
        .single();

      if (noteError) {
        console.error('[CollaborativeSync] Supabase error:', noteError);
        throw noteError;
      }

      if (!noteData) {
        console.warn('[CollaborativeSync] Note not found:', noteId);
        throw new Error('Note not found');
      }

      // Check if note was updated since last fetch
      const currentVersion = noteData.updated_at || noteData.created_at;
      
      if (lastFetchedVersion.current === currentVersion) {
        // No changes, just update last check time
        setLastUpdated(new Date());
        console.log('[CollaborativeSync] No changes detected');
        return;
      }

      console.log('[CollaborativeSync] Note has changes, updating...');

      // Decrypt the note data
      const decryptedTitle = decrypt(noteData.title);
      const decryptedContent = noteData.content ? decrypt(noteData.content) : "";

      const updatedNote: Note = {
        id: noteData.id,
        title: decryptedTitle,
        content: decryptedContent,
        created_at: noteData.created_at,
        updated_at: noteData.updated_at,
        type: 'public'
      };

      // Check for conflicts if user has been editing or is in edit mode
      const hasLocalEdits = localStorage.getItem(`fair-note-edit-title-${noteId}`) || 
                           localStorage.getItem(`fair-note-edit-content-${noteId}`);
      
      if ((hasLocalEdits || editMode) && userEditTimestamp.current) {
        const serverUpdateTime = new Date(noteData.updated_at || noteData.created_at);
        
        // If server was updated after user started editing, there might be a conflict
        if (serverUpdateTime > userEditTimestamp.current) {
          console.log('[CollaborativeSync] Potential conflict detected during editing');
          setHasConflict(true);
          setConflictNote(updatedNote);
          return; // Don't automatically update, let user decide
        }
      }

      // In edit mode, be more careful about auto-updating
      if (editMode && hasLocalEdits) {
        console.log('[CollaborativeSync] Edit mode active with local changes, showing conflict for user decision');
        setHasConflict(true);
        setConflictNote(updatedNote);
        return;
      }

      setNote(updatedNote);
      setLastUpdated(new Date());
      lastFetchedVersion.current = currentVersion;
      setHasConflict(false);
      setConflictNote(null);

    } catch (err) {
      console.error('[CollaborativeSync] Error fetching note update:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch note updates');
    } finally {
      isFetching.current = false;
    }
  }, [noteId, user, isOnline, noteType, isEnabled, editMode]);

  // Initial fetch - Only run once when component is ready
  useEffect(() => {
    if (isEnabled && noteType === 'public' && noteId && user) {
      console.log('[CollaborativeSync] Initial fetch for noteId:', noteId, 'editMode:', editMode);
      setLoading(true);
      fetchNoteUpdate().finally(() => setLoading(false));
    }
  }, [isEnabled, noteType, noteId, user]); // Removed fetchNoteUpdate and editMode from deps to avoid unnecessary re-runs

  // Setup polling interval
  useEffect(() => {
    // Don't poll if disabled, not public note, offline, or missing data
    if (!isEnabled || noteType !== 'public' || !isOnline || !noteId || !user) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('[CollaborativeSync] Polling disabled - Conditions:', {
          isEnabled,
          noteType,
          isOnline,
          hasNoteId: !!noteId,
          hasUser: !!user,
          editMode
        });
      }
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    console.log('[CollaborativeSync] Starting polling interval for noteId:', noteId, 'editMode:', editMode);

    // Setup polling with different intervals for edit vs view mode
    const pollInterval = editMode ? 3000 : 2000; // Slightly slower during edit to reduce interruptions
    intervalRef.current = setInterval(() => {
      fetchNoteUpdate();
    }, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('[CollaborativeSync] Cleaning up polling interval');
      }
    };
  }, [isEnabled, fetchNoteUpdate, noteType, isOnline, noteId, user, editMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Manual refresh function
  const refreshNote = useCallback(async () => {
    if (!isEnabled || noteType !== 'public') return;
    
    setLoading(true);
    try {
      await fetchNoteUpdate();
    } finally {
      setLoading(false);
    }
  }, [isEnabled, fetchNoteUpdate, noteType]);

  // Function to mark user edit start
  const markUserEditStart = useCallback(() => {
    userEditTimestamp.current = new Date();
  }, []);

  // Function to resolve conflicts
  const resolveConflict = useCallback((useServerVersion: boolean) => {
    if (!conflictNote) return;
    
    if (useServerVersion) {
      setNote(conflictNote);
      lastFetchedVersion.current = conflictNote.updated_at || conflictNote.created_at;
    }
    
    setHasConflict(false);
    setConflictNote(null);
    userEditTimestamp.current = null;
  }, [conflictNote]);

  return {
    note,
    loading,
    error,
    lastUpdated,
    isOnline,
    hasConflict,
    conflictNote,
    refreshNote,
    markUserEditStart,
    resolveConflict
  } as SyncResult & { 
    refreshNote: () => Promise<void>;
    markUserEditStart: () => void;
    resolveConflict: (useServerVersion: boolean) => void;
  };
}
