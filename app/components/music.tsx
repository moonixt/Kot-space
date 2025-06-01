"use client";

import React, { useState, useEffect } from "react";
import { useMusicPlayer } from "../../context/MusicPlayerContext";
import {
  Headphones,
} from "lucide-react";

export default function MusicPlayer() {
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
    currentTrackIndex,
    audioRef,
  } = useMusicPlayer();

  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7); // Default volume at 70%
  const [showMultiFileHint, setShowMultiFileHint] = useState(false);

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

      // Hide the multi-file hint if files were loaded
      setShowMultiFileHint(false);
    }
  };

  const showHint = () => setShowMultiFileHint(true);
  const hideHint = () => setShowMultiFileHint(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
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

  return (
    <>
      {/* Minimal, discreet toggle button in bottom-right corner */}
      <button
        onClick={toggleVisibility}
        aria-label={isVisible ? "Hide player" : "Show player"}
        className="fixed z-[60] flex items-center justify-center w-8 h-8 rounded-full bg-black/50 backdrop-blur hover:bg-black/30 text-white/80 transition-colors"
        style={{
          right: "24px",
          bottom: isVisible ? `calc(54px + 16px)` : "16px", // 64px = approx player height
        }}
      >
        <span>{isVisible ? <Headphones size={18}/> : <Headphones size={18}/>}</span>
      </button>

      {/* Player container */}
      <div
        className={`backdrop-blur bg-black/70 shadow-lg flex flex-col items-center justify-center transition-all duration-300 w-full`}
        style={{
          position: "fixed",
          bottom: isVisible ? "0" : "-200px",
          left: 0,
          right: 0,
          zIndex: 50,
          paddingTop: isMobile ? "8px" : "12px",
          paddingBottom: isMobile ? "8px" : "12px",
        }}
      >
        {/* Player content */}
        <div
          className={`flex flex-col items-center w-full max-w-7xl mx-auto px-4 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
        >
          <div
            className={`w-full flex ${isMobile ? "flex-col space-y-3" : "flex-row items-center justify-between"}`}
          >
            <div className="flex items-center gap-2">
              <label
                className="cursor-pointer text-white/80 hover:text-blue-300 transition"
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
                <span
                  className={`px-2 py-1 bg-white/10 hover:bg-white/20 transition ${isMobile ? "text-sm" : "text-xs"}`}
                >
                  🎵 {!audioFile && "Audio"}
                </span>
              </label>

              {showMultiFileHint && (
                <span className="text-xs text-white/70 whitespace-nowrap">
                  You can select multiple files
                </span>
              )}

              {audioFile && (
                <div className="flex items-center gap-2">
                  <span
                    className={`truncate text-white/80 ${isMobile ? "text-sm max-w-[150px]" : "text-xs max-w-[200px]"}`}
                    title={audioFile.name}
                  >
                    {audioFiles.length > 1
                      ? `${currentTrackIndex + 1}/${audioFiles.length}: `
                      : ""}
                    {audioFile.name}
                  </span>
                </div>
              )}
            </div>

            {/* Control buttons - always visible when audio is loaded */}
            {audioFile && (
              <div className="flex items-center gap-3 mt-1">
                {/* Skip Previous */}
                <button
                  onClick={skipToPrevious}
                  className="text-white hover:text-blue-300 transition"
                  title="Previous track"
                  style={{ opacity: audioFiles.length <= 1 ? 0.5 : 1 }}
                >
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
                    <polygon points="11 19 2 12 11 5 11 19"></polygon>
                    <polygon points="22 19 13 12 22 5 22 19"></polygon>
                  </svg>
                </button>

                {/* Play/Pause button */}
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-blue-300 transition"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
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
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  ) : (
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
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  )}
                </button>

                {/* Skip Next */}
                <button
                  onClick={skipToNext}
                  className="text-white hover:text-blue-300 transition"
                  title="Next track"
                  style={{ opacity: audioFiles.length <= 1 ? 0.5 : 1 }}
                >
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
                    <polygon points="13 19 22 12 13 5 13 19"></polygon>
                    <polygon points="2 19 11 12 2 5 2 19"></polygon>
                  </svg>
                </button>

                {/* Volume control */}
                <div className="flex items-center gap-2 ml-4">
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
                    className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%)`,
                    }}
                    title={`Volume: ${Math.round(volume * 100)}%`}
                  />
                </div>
              </div>
            )}

            {/* Audio progress bar and time */}
            {audioUrl && (
              <div
                className={`${isMobile ? "w-full mt-2" : "w-full mx-auto pl-2 max-w-[calc(100%-40px)]"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/70">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    step="0.01"
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%)`,
                    }}
                  />
                  <span className="text-xs text-white/70">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
