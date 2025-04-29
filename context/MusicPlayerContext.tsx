"use client";

import React, {
  createContext,
  useState,
  useRef,
  useEffect,
  useContext,
} from "react";

type MusicPlayerContextType = {
  audioFile: File | null;
  audioFiles: File[];
  audioUrl: string | null;
  currentTrackIndex: number;
  setAudioFile: (file: File | null) => void;
  setAudioFiles: (files: FileList) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  skipToNext: () => void;
  skipToPrevious: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
};

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(
  undefined,
);

export function MusicPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFiles, setAudioFilesState] = useState<File[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Set audio files from file input
  const setAudioFiles = (files: FileList) => {
    const fileArray = Array.from(files).filter((file) =>
      file.type.startsWith("audio/"),
    );
    if (fileArray.length > 0) {
      console.log(`Loaded ${fileArray.length} audio files`);
      setAudioFilesState(fileArray);
      setAudioFile(fileArray[0]); // Set the first file as current
      setCurrentTrackIndex(0);
    }
  };

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
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Auto-play next track when current track ends
  const handleEnded = () => {
    if (audioFiles.length > 1) {
      skipToNext();
    } else {
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const skipToNext = () => {
    if (audioFiles.length <= 1) return;

    const nextIndex = (currentTrackIndex + 1) % audioFiles.length;
    console.log(
      `Skipping to next track: ${nextIndex + 1}/${audioFiles.length}`,
    );
    setCurrentTrackIndex(nextIndex);
    setAudioFile(audioFiles[nextIndex]);

    // Auto-play when skipping tracks
    if (isPlaying) {
      // We need to wait for the new audio source to be set
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch((error) => {
            console.error("Error playing next track:", error);
            setIsPlaying(false);
          });
        }
      }, 100);
    }
  };

  const skipToPrevious = () => {
    if (audioFiles.length <= 1) return;

    // If we're more than 3 seconds into the track, restart the current track
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const prevIndex =
      (currentTrackIndex - 1 + audioFiles.length) % audioFiles.length;
    console.log(
      `Skipping to previous track: ${prevIndex + 1}/${audioFiles.length}`,
    );
    setCurrentTrackIndex(prevIndex);
    setAudioFile(audioFiles[prevIndex]);

    // Auto-play when skipping tracks
    if (isPlaying) {
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch((error) => {
            console.error("Error playing previous track:", error);
            setIsPlaying(false);
          });
        }
      }, 100);
    }
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        audioFile,
        audioFiles,
        audioUrl,
        currentTrackIndex,
        setAudioFile,
        setAudioFiles,
        isPlaying,
        togglePlay,
        skipToNext,
        skipToPrevious,
        audioRef,
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
