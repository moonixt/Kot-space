"use client";

import React from "react";
import { Headphones, Menu, ChevronLeft, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BottomBarProps {
  isSidebarVisible: boolean;
  isMusicPlayerVisible: boolean;
  onSidebarToggle: () => void;
  onMusicPlayerToggle: () => void;
  onNewNote: () => void;
  isUserLoggedIn: boolean;
}

export default function BottomBar({
  isSidebarVisible,
  isMusicPlayerVisible,
  onSidebarToggle,
  onMusicPlayerToggle,
  onNewNote,
  isUserLoggedIn,
}: BottomBarProps) {
  const { t } = useTranslation();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[50] bg-black/85 backdrop-blur  shadow-lg">
      <div className="flex items-center justify-center gap-4 px-4 py-2">
        {/* Sidebar toggle */}        <button
          onClick={onSidebarToggle}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white  transition-all duration-200 shadow-md"
          aria-label={
            isSidebarVisible ? t("sidebar.closeMenu") : t("sidebar.openMenu")
          }
        >        {isSidebarVisible ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>        {/* New Note button (only for logged users) */}
        {isUserLoggedIn && (
          <button
            onClick={onNewNote}
            className="flex items-center justify-center w-12 h-12 rounded-full  text-white  transition-all duration-200 shadow-lg scale-110"
            aria-label="Create new note"
          >
            <Plus size={24} />
          </button>
        )}

        {/* Music player toggle (only for logged users) */}
        {isUserLoggedIn && (
          <button
            onClick={onMusicPlayerToggle}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur hover:bg-black/30 text-white/80 transition-all duration-200 shadow-md"
            aria-label={
              isMusicPlayerVisible ? t('musicPlayer.hidePlayer') : t('musicPlayer.showPlayer')
            }
          >
            {isMusicPlayerVisible ? (
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
                <path d="m9 18 6-6-6-6"/>
              </svg>
            ) : (
              <Headphones size={20}/>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
