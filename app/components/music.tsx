"use client";

import React, { useState, useEffect } from "react";
import { useMusicPlayer } from "../../context/MusicPlayerContext";

export default function MusicPlayer() {
  const { audioFile, setAudioFile, audioUrl } = useMusicPlayer();
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Listen for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
      // Auto-show player when file is selected
      setIsVisible(true);
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <>
      {/* Minimal, discreet toggle button in bottom-right corner */}
      <button
        onClick={toggleVisibility}
        aria-label={isVisible ? "Hide player" : "Show player"}
        className="fixed z-[60] flex items-center justify-center w-8 h-8 -full bg-black/50 hover:bg-black/70 text-white/80 tranroundedsition  "
        style={{
          right: '24px',
          bottom: isVisible ? `calc(64px + 16px)` : "16px", // 64px = approx player height, adjust as needed
        }}
      >
        <span className="">
          {isVisible ? "▼" : "▲"}
        </span>
      </button>

      {/* Player container */}
      <div
        className={`backdrop-blur bg-black/80 shadow-lg flex flex-col items-center justify-center transition-all duration-300 w-full`}
        style={{ 
          position: "fixed", 
          bottom: isVisible ? "0" : "-200px", 
          left: 0,
          right: 0,
          zIndex: 50,
          paddingTop: isMobile ? "8px" : "12px",
          paddingBottom: isMobile ? "8px" : "12px"
        }}
      >
        {/* Player content */}
        <div 
          className={`flex flex-col items-center w-full max-w-7xl mx-auto px-4 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
        >
          <div className={`w-full flex ${isMobile ? 'flex-col space-y-3' : 'flex-row items-center justify-between'}`}>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-white/80 hover:text-blue-300 transition">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className={`px-2 py-1 bg-white/10  hover:bg-white/20 transition ${isMobile ? 'text-sm' : 'text-xs'}`}>
                  🎵 {!audioFile && "Select Audio"}
                </span>
              </label>
              {audioFile && (
                <span className={`truncate text-white/80 ${isMobile ? 'text-sm max-w-full' : 'text-xs max-w-[200px]'}`} 
                  title={audioFile.name}>
                  {audioFile.name}
                </span>
              )}
            </div>
            
            {/* Audio controls */}
            {audioUrl && (
              <div className={`${isMobile ? 'w-full mt-2' : 'flex-1 mx-4 max-w-[800px]'}`}>
                <audio 
                  controls
                  src={audioUrl} 
                  className="w-full"
                  style={{ maxWidth: "100%" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
