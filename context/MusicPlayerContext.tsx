"use client";

import React, {
  createContext,
  useState,
  useRef,
  useEffect,
  useContext,
} from "react";

type SavedTrack = {
  name: string;
  data: string; // Base64 encoded file data
  type: string;
  size: number;
};

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
  jumpToTrack: (index: number) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  clearPlaylist: () => void;
  loadSavedTracks: () => Promise<void>;
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

  // Save tracks to localStorage
  const saveTracksToStorage = async (files: File[]) => {
    if (!files || files.length === 0) {
      console.log("No files to save");
      return;
    }

    try {
      console.log(`Starting to save ${files.length} tracks to localStorage...`);

      const savedTracks: SavedTrack[] = await Promise.all(
        files.map(async (file, index) => {
          console.log(
            `Processing file ${index + 1}/${files.length}: ${file.name}`,
          );
          return new Promise<SavedTrack>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: file.name,
                data: reader.result as string,
                type: file.type,
                size: file.size,
              });
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
        }),
      );

      // Check localStorage space before saving
      const dataToSave = JSON.stringify(savedTracks);
      const sizeInMB = new Blob([dataToSave]).size / 1024 / 1024;
      console.log(`Data size to save: ${sizeInMB.toFixed(2)} MB`);

      if (sizeInMB > 50) {
        // Warn if larger than 50MB
        console.warn(
          `Large data size (${sizeInMB.toFixed(2)} MB) - this might exceed localStorage limits`,
        );
      }

      localStorage.setItem("musicPlayerTracks", dataToSave);
      localStorage.setItem(
        "musicPlayerCurrentIndex",
        currentTrackIndex.toString(),
      );
      localStorage.setItem("musicPlayerLastSaved", new Date().toISOString());

      console.log(
        `Successfully saved ${savedTracks.length} tracks to localStorage`,
      );
      console.log("Saved data keys:", {
        tracks: "musicPlayerTracks",
        index: currentTrackIndex,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving tracks to localStorage:", error);
      // If localStorage is full, try to clear old data
      if (error instanceof Error && error.name === "QuotaExceededError") {
        console.warn("LocalStorage quota exceeded, clearing old music data");
        try {
          localStorage.removeItem("musicPlayerTracks");
          localStorage.removeItem("musicPlayerCurrentIndex");
          localStorage.removeItem("musicPlayerLastSaved");
          console.log(
            "✅ LocalStorage cheio! Dados de música antigos foram removidos automaticamente.",
          );
        } catch (clearError) {
          console.error("❌ Error clearing localStorage:", clearError);
          console.error(
            "Erro ao salvar músicas: LocalStorage cheio e não foi possível limpar.",
          );
        }
      } else {
        console.error("❌ Erro ao salvar músicas no navegador:", error);
      }
    }
  };

  // Load tracks from localStorage
  const loadSavedTracks = async () => {
    try {
      console.log("Loading tracks from localStorage...");
      const savedTracksData = localStorage.getItem("musicPlayerTracks");
      const savedIndex = localStorage.getItem("musicPlayerCurrentIndex");
      const lastSaved = localStorage.getItem("musicPlayerLastSaved");

      console.log("LocalStorage data:", {
        hasTracks: !!savedTracksData,
        savedIndex,
        lastSaved,
        tracksDataLength: savedTracksData?.length,
      });

      if (savedTracksData) {
        const savedTracks: SavedTrack[] = JSON.parse(savedTracksData);
        console.log("Parsed saved tracks:", savedTracks.length);

        // Convert saved tracks back to File objects
        const files = savedTracks.map((track) => {
          // Convert base64 data URL back to blob
          const response = fetch(track.data);
          return response
            .then((res) => res.blob())
            .then((blob) => new File([blob], track.name, { type: track.type }));
        });

        const fileArray = await Promise.all(files);

        if (fileArray.length > 0) {
          console.log("Setting loaded files:", fileArray.length);
          setAudioFilesState(fileArray);
          const indexToLoad = savedIndex ? parseInt(savedIndex, 10) : 0;
          const validIndex = Math.min(indexToLoad, fileArray.length - 1);
          setCurrentTrackIndex(validIndex);
          setAudioFile(fileArray[validIndex]);
          console.log(
            `Successfully loaded ${fileArray.length} tracks from localStorage, current index: ${validIndex}`,
          );
        }
      } else {
        console.log("No saved tracks found in localStorage");
      }
    } catch (error) {
      console.error("Error loading tracks from localStorage:", error);
    }
  };

  // Clear playlist and localStorage
  const clearPlaylist = () => {
    setAudioFilesState([]);
    setAudioFile(null);
    setAudioUrl(null);
    setCurrentTrackIndex(0);
    setIsPlaying(false);
    localStorage.removeItem("musicPlayerTracks");
    localStorage.removeItem("musicPlayerCurrentIndex");
    localStorage.removeItem("musicPlayerLastSaved");
    console.log("Playlist cleared");
  };

  // Load saved tracks on component mount
  useEffect(() => {
    console.log(
      "MusicPlayerContext: Component mounted, testing localStorage...",
    );
    if (testLocalStorage()) {
      console.log(
        "MusicPlayerContext: localStorage working, loading saved tracks...",
      );
      loadSavedTracks();
    } else {
      console.error(
        "MusicPlayerContext: localStorage not available, cannot load saved tracks",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save tracks whenever audioFiles changes
  useEffect(() => {
    if (audioFiles.length > 0) {
      console.log("MusicPlayerContext: Saving tracks to localStorage...", {
        tracksCount: audioFiles.length,
        currentIndex: currentTrackIndex,
      });
      saveTracksToStorage(audioFiles);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioFiles, currentTrackIndex]);

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

  const jumpToTrack = (index: number) => {
    if (index < 0 || index >= audioFiles.length) return;

    console.log(`Jumping to track: ${index + 1}/${audioFiles.length}`);
    setCurrentTrackIndex(index);
    setAudioFile(audioFiles[index]);

    // Auto-play when jumping to track
    if (isPlaying) {
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch((error) => {
            console.error("Error playing selected track:", error);
            setIsPlaying(false);
          });
        }
      }, 100);
    }
  };

  // Test localStorage functionality
  const testLocalStorage = () => {
    try {
      const testKey = "localStorage-test";
      const testValue = "test-data";
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved === testValue) {
        console.log("✅ localStorage is working correctly");
        return true;
      } else {
        console.error("❌ localStorage test failed: values don't match");
        return false;
      }
    } catch (error) {
      console.error("❌ localStorage is not available:", error);
      return false;
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
        jumpToTrack,
        audioRef,
        clearPlaylist,
        loadSavedTracks,
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
