"use client";

import React, { createContext, useState, useRef, useEffect, useContext } from "react";

type MusicPlayerContextType = {
  audioFile: File | null;
  audioUrl: string | null;
  setAudioFile: (file: File | null) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
};

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Create object URL when file changes
  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioFile]);

  // Handle play state changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(error => {
        console.error("Error playing audio:", error);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Reset play state when audio ends
  const handleEnded = () => {
    setIsPlaying(false);
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        audioFile,
        audioUrl,
        setAudioFile,
        isPlaying,
        togglePlay,
        audioRef
      }}
    >
      {children}
      {/* Global audio element that persists across page navigation */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleEnded}
          // Controls moved to the music.tsx component
          // Loop attribute is optional - remove if you don't want looping
          // loop
        />
      )}
    </MusicPlayerContext.Provider>
  );
}

// Custom hook to use the music player context
export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
  }
  return context;
}