"use client";

import React, { useState, useEffect } from "react";
import { useMusicPlayer } from "../../context/MusicPlayerContext";
import { useTranslation } from "react-i18next";
import {
  Headphones, ListMusic,
} from "lucide-react";

interface MusicPlayerProps {
  onVisibilityChange?: (visible: boolean) => void;
}

export default function MusicPlayer({ onVisibilityChange }: MusicPlayerProps) {
  const { t } = useTranslation();
  const {
    audioFile,
    audioFiles,
    // setAudioFile,
    setAudioFiles,
    audioUrl,
    isPlaying,
    togglePlay,
    skipToNext,
    skipToPrevious,
    jumpToTrack,
    currentTrackIndex,
    audioRef,
    clearPlaylist,
    loadSavedTracks,
  } = useMusicPlayer();

  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7); // Default volume at 70%
  const [showMultiFileHint, setShowMultiFileHint] = useState(false);
  const [albumArt, setAlbumArt] = useState<string | null>(null);
  const [trackMetadata, setTrackMetadata] = useState<{
    title?: string;
    artist?: string;
    album?: string;
  }>({});

  // Load saved volume from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('musicPlayerVolume');
    if (savedVolume) {
      const vol = parseFloat(savedVolume);
      setVolume(vol);
      console.log('Loaded saved volume:', vol);
    }
  }, []);

  // Save volume to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('musicPlayerVolume', volume.toString());
  }, [volume]);

  // Load saved player visibility state
  useEffect(() => {
    const savedVisibility = localStorage.getItem('musicPlayerVisible');
    if (savedVisibility === 'true' && audioFiles.length > 0) {
      setIsVisible(true);
      onVisibilityChange?.(true);
    }
  }, [audioFiles.length, onVisibilityChange]);

  // Save player visibility state
  useEffect(() => {
    localStorage.setItem('musicPlayerVisible', isVisible.toString());
  }, [isVisible]);

  // Check for saved tracks on component mount
  useEffect(() => {
    const checkSavedTracks = async () => {
      const savedTracksData = localStorage.getItem('musicPlayerTracks');
      console.log('Music component mounted, checking for saved tracks...', !!savedTracksData);
      
      if (savedTracksData && audioFiles.length === 0) {
        console.log('Found saved tracks, loading automatically...');
        await loadSavedTracks();
      }
    };
    
    checkSavedTracks();
  }, [loadSavedTracks, audioFiles.length]);

  // Check for mobile screen size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Listen for window resize
    window.addEventListener("resize", checkIfMobile);

    // Clean up
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Update time display
  useEffect(() => {
    if (!audioRef.current) return;

    const updateTime = () => {
      setCurrentTime(audioRef.current?.currentTime || 0);
      setDuration(audioRef.current?.duration || 0);
    };

    audioRef.current.addEventListener("timeupdate", updateTime);
    audioRef.current.addEventListener("loadedmetadata", updateTime);

    // Set initial volume
    audioRef.current.volume = volume;

    return () => {
      audioRef.current?.removeEventListener("timeupdate", updateTime);
      audioRef.current?.removeEventListener("loadedmetadata", updateTime);
    };
  }, [audioRef, audioUrl, volume]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Send all files to context
      setAudioFiles(e.target.files);
      // Auto-show player when files are selected
      setIsVisible(true);
      onVisibilityChange?.(true);

      // Hide the multi-file hint if files were loaded
      setShowMultiFileHint(false);
    }
  };

  const showHint = () => setShowMultiFileHint(true);
  const hideHint = () => setShowMultiFileHint(false);

  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    onVisibilityChange?.(newVisibility);
  };

  // Format time in minutes:seconds
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Handle seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newVolume = parseFloat(e.target.value);
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
  };

  // Extract album art from audio file
  const extractAlbumArt = async (file: File) => {
    try {
      // Dynamic import to avoid SSR issues and React Native dependencies
      const jsmediatags = (await import("jsmediatags")).default;
      
      jsmediatags.read(file, {
        onSuccess: (tag) => {
          const { picture, title, artist, album } = tag.tags;
          
          // Extract metadata
          setTrackMetadata({
            title: title || undefined,
            artist: artist || undefined,
            album: album || undefined,
          });
          
          // Extract album art
          if (picture) {
            const { data, format } = picture;
            const byteArray = new Uint8Array(data);
            const blob = new Blob([byteArray], { type: format });
            const imageUrl = URL.createObjectURL(blob);
            setAlbumArt(imageUrl);
          } else {
            setAlbumArt(null);
          }
        },
        onError: (error) => {
          console.error("Error reading metadata:", error);
          setAlbumArt(null);
          setTrackMetadata({});
        }
      });
    } catch (error) {
      console.error("Error extracting album art:", error);
      setAlbumArt(null);
      setTrackMetadata({});
    }
  };

  // Extract album art when audio file changes
  useEffect(() => {
    // Clean up previous album art URL
    if (albumArt) {
      URL.revokeObjectURL(albumArt);
    }
    
    if (audioFile) {
      extractAlbumArt(audioFile);
    } else {
      setAlbumArt(null);
      setTrackMetadata({});
    }

    // Cleanup function
    return () => {
      if (albumArt) {
        URL.revokeObjectURL(albumArt);
      }
    };
  }, [audioFile]);

  return (
    <>
      {/* Toggle button - positioned in bottom-left for sidebar */}
      <button
        onClick={toggleVisibility}
        aria-label={isVisible ? t('musicPlayer.hidePlayer') : t('musicPlayer.showPlayer')}
        className="fixed z-[60] flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur hover:bg-black/30 text-white/80 transition-all duration-300"
        style={{
          left: isVisible ? (isMobile ? "260px" : "320px") : "16px",
          bottom: "16px",
        }}
      >
        <span>
          {isVisible ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6"/>
            </svg>
          ) : (
            <Headphones size={20}/>
          )}
        </span>
      </button>

      {/* Sidebar Player container */}
      <div
        className={`backdrop-blur bg-black/80 shadow-2xl flex flex-col transition-all duration-300 border-r border-white/10`}
        style={{
          position: "fixed",
          left: isVisible ? "0" : (isMobile ? "-280px" : "-340px"),
          top: 0,
          bottom: 0,
          width: isMobile ? "280px" : "320px",
          zIndex: 50,
          padding: "5px",
          paddingTop: "10px", // Space for toggle button
        }}
      >
        {/* Player content */}
        <div
          className={`flex flex-col w-full h-full transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
        >
          {/* File Upload Section */}
          <div className="mb-6">
            <label
              className="cursor-pointer text-white/80 hover:text-blue-300 transition-colors block w-full"
              onMouseEnter={showHint}
              onMouseLeave={hideHint}
            >
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
              <div className="text-center ">
                <div className="text-2xl ">
                  <ListMusic size={20} className="inline-block " />
                </div>
                <span className="text-sm">
                  {!audioFile ? t('musicPlayer.uploadAudioFiles') : t('musicPlayer.changeAudioFiles')}
                </span>
              </div>
            </label>

            {showMultiFileHint && (
              <p className="text-xs text-white/70 mt-2 text-center">
                {t('musicPlayer.multiFileHint')}
              </p>
            )}

            {/* Clear Playlist Button */}
            {audioFiles.length > 0 && (
              <div className="mt-3 text-center space-y-2">
                <button
                  onClick={clearPlaylist}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded border border-red-400/30 hover:border-red-300/50"
                  title={`${t('musicPlayer.clearPlaylist')} (${audioFiles.length} ${t('musicPlayer.tracks')})`}
                >
                  {t('musicPlayer.clearPlaylist')} ({audioFiles.length} {t('musicPlayer.tracks')})
                </button>
              </div>
            )}

            {audioFiles.length === 0 && (
              <div className="mt-3 text-center">
                <button
                  onClick={loadSavedTracks}
                  className="text-xs   transition-colors px-3 py-1 rounded "
                  title="Carregar músicas salvas do localStorage"
                >
                  {t('musicPlayer.loadSavedTracks') || 'Carregar Músicas Salvas'}
                </button>
              </div>
            )}
          </div>

          {/* Current Track Info */}
          {audioFile && (
            <div className="mb-6 p-4 bg-white/5 rounded-lg">
              <div className="text-center">
                {/* Album Art */}
                <div className="mb-4 flex justify-center">
                  <div className="w-full h-full rounded-lg overflow-hidden bg-white/10 flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105">
                    {albumArt ? (
                      <img 
                        src={albumArt} 
                        alt="Album cover" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-white/50 text-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mx-auto mb-2"
                        >
                          <circle cx="12" cy="12" r="10"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        <div className="text-xs">{t('musicPlayer.noCover')}</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-white/60 mb-1">
                  {audioFiles.length > 1
                    ? t('musicPlayer.trackOf', { current: currentTrackIndex + 1, total: audioFiles.length })
                    : t('musicPlayer.nowPlaying')}
                </div>
                
                {/* Track Title */}
                <div
                  className="text-white/90 font-medium text-sm truncate mb-1"
                  title={trackMetadata.title || audioFile.name}
                >
                  {trackMetadata.title || audioFile.name}
                </div>
                
                {/* Artist */}
                {trackMetadata.artist && (
                  <div
                    className="text-white/70 text-xs truncate mb-1"
                    title={trackMetadata.artist}
                  >
                    {trackMetadata.artist}
                  </div>
                )}
                
                {/* Album */}
                {trackMetadata.album && (
                  <div
                    className="text-white/60 text-xs truncate"
                    title={trackMetadata.album}
                  >
                    {trackMetadata.album}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Control buttons */}
          {audioFile && (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-4 mb-4">
                {/* Skip Previous */}
                <button
                  onClick={skipToPrevious}
                  className="text-white hover:text-blue-300 transition-colors p-2 rounded-full hover:bg-white/10"
                  title={t('musicPlayer.previousTrack')}
                  style={{ opacity: audioFiles.length <= 1 ? 0.5 : 1 }}
                  disabled={audioFiles.length <= 1}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="11 19 2 12 11 5 11 19"></polygon>
                    <polygon points="22 19 13 12 22 5 22 19"></polygon>
                  </svg>
                </button>

                {/* Play/Pause button */}
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-blue-300 transition-colors p-3 rounded-full hover:bg-white/10 bg-blue-600/30"
                  title={isPlaying ? t('musicPlayer.pause') : t('musicPlayer.play')}
                >
                  {isPlaying ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  )}
                </button>

                {/* Skip Next */}
                <button
                  onClick={skipToNext}
                  className="text-white hover:text-blue-300 transition-colors p-2 rounded-full hover:bg-white/10"
                  title={t('musicPlayer.nextTrack')}
                  style={{ opacity: audioFiles.length <= 1 ? 0.5 : 1 }}
                  disabled={audioFiles.length <= 1}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="13 19 22 12 13 5 13 19"></polygon>
                    <polygon points="2 19 11 12 2 5 2 19"></polygon>
                  </svg>
                </button>
              </div>

              {/* Volume control */}
              <div className="px-4">
                <div className="flex items-center gap-3 ">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white/70"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    {volume > 0.5 ? (
                      <>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                      </>
                    ) : volume > 0 ? (
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    ) : null}
                  </svg>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%)`,
                    }}
                    title={`${t('musicPlayer.volume')}: ${Math.round(volume * 100)}%`}
                  />
                  <span className="text-xs text-white/70 min-w-[3ch]">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Audio progress bar and time */}
          {audioUrl && (
            <div className="px-4">
              <div className="mb-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.01"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%)`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/70">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Playlist Section */}
          {audioFiles.length > 1 && (
            <div className="mt-6 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-3 px-4">
                <h3 className="text-white/80 text-sm font-medium">
                  {t('musicPlayer.playlist')} ({audioFiles.length} {t('musicPlayer.tracks')})
                </h3>
                <div className="flex items-center text-xs text-green-400/70">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17,21 17,13 7,13 7,21"/>
                    <polyline points="7,3 7,8 15,8"/>
                  </svg>
                  {t('musicPlayer.saved')}
                </div>
              </div>
              <div className="overflow-y-auto flex-1 px-2 music-player-scrollbar">
                {Array.from(audioFiles).map((file, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-xs cursor-pointer transition-colors mb-1 ${
                      index === currentTrackIndex
                        ? "bg-blue-600/30 text-white border border-blue-400/30"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                    onClick={() => jumpToTrack(index)}
                    title={file.name}
                  >
                    <div className="truncate">
                      {index + 1}. {file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
