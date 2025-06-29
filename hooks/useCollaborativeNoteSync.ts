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
  isEnabled
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
    if (!noteId || !user || !isOnline || noteType !== 'public') {
      return;
    }

    try {
      setError(null);
      
      const { data: noteData, error: noteError } = await supabase
        .from("public_notes")
        .select("*, updated_at")
        .eq("id", noteId)
        .single();

      if (noteError) {
        throw noteError;
      }

      if (!noteData) {
        throw new Error('Note not found');
      }

      // Check if note was updated since last fetch
      const currentVersion = noteData.updated_at || noteData.created_at;
      
      if (lastFetchedVersion.current === currentVersion) {
        // No changes, just update last check time
        setLastUpdated(new Date());
        return;
      }

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

      // Check for conflicts if user has been editing
      const hasLocalEdits = localStorage.getItem(`fair-note-edit-title-${noteId}`) || 
                           localStorage.getItem(`fair-note-edit-content-${noteId}`);
      
      if (hasLocalEdits && userEditTimestamp.current) {
        const serverUpdateTime = new Date(noteData.updated_at || noteData.created_at);
        
        // If server was updated after user started editing, there might be a conflict
        if (serverUpdateTime > userEditTimestamp.current) {
          console.log('Potential conflict detected');
          setHasConflict(true);
          setConflictNote(updatedNote);
          return; // Don't automatically update, let user decide
        }
      }

      setNote(updatedNote);
      setLastUpdated(new Date());
      lastFetchedVersion.current = currentVersion;
      setHasConflict(false);
      setConflictNote(null);

    } catch (err) {
      console.error('Error fetching note update:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch note updates');
    }
  }, [noteId, user, isOnline, noteType]);

  // Initial fetch
  useEffect(() => {
    if (isEnabled && noteType === 'public') {
      setLoading(true);
      fetchNoteUpdate().finally(() => setLoading(false));
    }
  }, [isEnabled, fetchNoteUpdate, noteType]);

  // Setup polling interval
  useEffect(() => {
    if (!isEnabled || noteType !== 'public' || !isOnline) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Setup new interval for 2-second polling
    intervalRef.current = setInterval(() => {
      fetchNoteUpdate();
    }, 0);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isEnabled, fetchNoteUpdate, noteType, isOnline]);

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
