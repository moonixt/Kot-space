import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { decrypt } from '../app/components/Encryption';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
  type: 'private' | 'public';
}

interface UseRealtimeNoteSyncProps {
  noteId: string | null;
  noteType: 'private' | 'public';
  user: any;
  isEnabled: boolean;
  editMode?: boolean;
}

interface SyncResult {
  note: Note | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isOnline: boolean;
  hasConflict: boolean;
  conflictNote: Note | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export function useRealtimeNoteSync({
  noteId,
  noteType,
  user,
  isEnabled,
  editMode = false
}: UseRealtimeNoteSyncProps): SyncResult {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictNote, setConflictNote] = useState<Note | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const channelRef = useRef<RealtimeChannel | null>(null);
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

  // Initial fetch function
  const fetchInitialNote = useCallback(async () => {
    if (!noteId || !user || noteType !== 'public' || !isEnabled) {
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      console.log('[RealtimeSync] Fetching initial note for:', noteId);
      
      const { data: noteData, error: noteError } = await supabase
        .from("public_notes")
        .select("*, updated_at")
        .eq("id", noteId)
        .single();

      if (noteError) {
        console.error('[RealtimeSync] Supabase error:', noteError);
        throw noteError;
      }

      if (!noteData) {
        console.warn('[RealtimeSync] Note not found:', noteId);
        throw new Error('Note not found');
      }

      // Decrypt the note data
      const decryptedTitle = decrypt(noteData.title);
      const decryptedContent = noteData.content ? decrypt(noteData.content) : "";

      const initialNote: Note = {
        id: noteData.id,
        title: decryptedTitle,
        content: decryptedContent,
        created_at: noteData.created_at,
        updated_at: noteData.updated_at,
        type: 'public'
      };

      setNote(initialNote);
      setLastUpdated(new Date());
      lastFetchedVersion.current = noteData.updated_at || noteData.created_at;
      
      console.log('[RealtimeSync] Initial note loaded successfully');

    } catch (err) {
      console.error('[RealtimeSync] Error fetching initial note:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch note');
    } finally {
      setLoading(false);
    }
  }, [noteId, user, noteType, isEnabled]);

  // Handle realtime updates
  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('[RealtimeSync] Received realtime update:', payload);

    try {
      const updatedData = payload.new;
      
      if (!updatedData) {
        console.warn('[RealtimeSync] No data in update payload');
        return;
      }

      // Check if this is a newer version
      const currentVersion = updatedData.updated_at || updatedData.created_at;
      
      if (lastFetchedVersion.current === currentVersion) {
        console.log('[RealtimeSync] Received duplicate update, ignoring');
        return;
      }

      // Decrypt the updated data
      const decryptedTitle = decrypt(updatedData.title);
      const decryptedContent = updatedData.content ? decrypt(updatedData.content) : "";

      const updatedNote: Note = {
        id: updatedData.id,
        title: decryptedTitle,
        content: decryptedContent,
        created_at: updatedData.created_at,
        updated_at: updatedData.updated_at,
        type: 'public'
      };

      // Check for conflicts if user has been editing
      const hasLocalEdits = localStorage.getItem(`fair-note-edit-title-${noteId}`) || 
                           localStorage.getItem(`fair-note-edit-content-${noteId}`);
      
      if ((hasLocalEdits || editMode) && userEditTimestamp.current) {
        const serverUpdateTime = new Date(updatedData.updated_at || updatedData.created_at);
        
        // If server was updated after user started editing, there might be a conflict
        if (serverUpdateTime > userEditTimestamp.current) {
          console.log('[RealtimeSync] Potential conflict detected during editing');
          setHasConflict(true);
          setConflictNote(updatedNote);
          return; // Don't automatically update, let user decide
        }
      }

      // In edit mode, be more careful about auto-updating
      if (editMode && hasLocalEdits) {
        console.log('[RealtimeSync] Edit mode active with local changes, showing conflict for user decision');
        setHasConflict(true);
        setConflictNote(updatedNote);
        return;
      }

      // Apply the update
      setNote(updatedNote);
      setLastUpdated(new Date());
      lastFetchedVersion.current = currentVersion;
      setHasConflict(false);
      setConflictNote(null);

      console.log('[RealtimeSync] Note updated successfully via realtime');

    } catch (err) {
      console.error('[RealtimeSync] Error processing realtime update:', err);
      setError(err instanceof Error ? err.message : 'Failed to process realtime update');
    }
  }, [noteId, editMode]);

  // Setup realtime subscription
  useEffect(() => {
    if (!isEnabled || noteType !== 'public' || !noteId || !user || !isOnline) {
      // Cleanup existing channel
      if (channelRef.current) {
        console.log('[RealtimeSync] Cleaning up channel due to disabled conditions');
        channelRef.current.unsubscribe();
        channelRef.current = null;
        setConnectionStatus('disconnected');
      }
      return;
    }

    // Create realtime channel
    console.log('[RealtimeSync] Setting up realtime channel for note:', noteId);
    setConnectionStatus('connecting');

    const channel = supabase
      .channel(`note-${noteId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'public_notes',
          filter: `id=eq.${noteId}`
        },
        handleRealtimeUpdate
      )
      .subscribe((status) => {
        console.log('[RealtimeSync] Subscription status:', status);
        
        switch (status) {
          case 'SUBSCRIBED':
            setConnectionStatus('connected');
            setError(null);
            break;
          case 'CHANNEL_ERROR':
            setConnectionStatus('error');
            setError('Realtime connection error');
            break;
          case 'TIMED_OUT':
            setConnectionStatus('error');
            setError('Realtime connection timed out');
            break;
          case 'CLOSED':
            setConnectionStatus('disconnected');
            break;
        }
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log('[RealtimeSync] Cleaning up realtime channel');
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      setConnectionStatus('disconnected');
    };
  }, [isEnabled, noteType, noteId, user, isOnline, handleRealtimeUpdate]);

  // Initial fetch
  useEffect(() => {
    if (isEnabled && noteType === 'public' && noteId && user) {
      fetchInitialNote();
    }
  }, [isEnabled, noteType, noteId, user, fetchInitialNote]);

  // Manual refresh function
  const refreshNote = useCallback(async () => {
    if (!isEnabled || noteType !== 'public') return;
    
    await fetchInitialNote();
  }, [isEnabled, fetchInitialNote, noteType]);

  // Function to mark user edit start
  const markUserEditStart = useCallback(() => {
    userEditTimestamp.current = new Date();
    console.log('[RealtimeSync] User edit start marked at:', userEditTimestamp.current);
  }, []);

  // Function to resolve conflicts
  const resolveConflict = useCallback((useServerVersion: boolean) => {
    if (!conflictNote) return;
    
    console.log('[RealtimeSync] Resolving conflict, use server version:', useServerVersion);
    
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
    connectionStatus,
    refreshNote,
    markUserEditStart,
    resolveConflict
  } as SyncResult & { 
    refreshNote: () => Promise<void>;
    markUserEditStart: () => void;
    resolveConflict: (useServerVersion: boolean) => void;
  };
}
