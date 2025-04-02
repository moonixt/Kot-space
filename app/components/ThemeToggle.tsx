"use client";

import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2 p-2 rounded-lg bg-[var(--card-bg)] border border-slate-500/30">
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-md transition-colors ${
          theme === "light"
            ? "bg-[var(--accent-color)] text-white"
            : "hover:bg-[var(--card-border)] "
        }`}
        aria-label="Light mode"
      >
        <Sun size={18} />
      </button>

      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-md transition-colors ${
          theme === "dark"
            ? "bg-[var(--accent-color)] text-white"
            : "hover:bg-[var(--card-border)] "
        }`}
        aria-label="Dark mode"
      >
        <Moon size={18} />
      </button>

      <button
        onClick={() => setTheme("system")}
        className={`p-2 rounded-md transition-colors ${
          theme === "system"
            ? "bg-[var(--accent-color)] text-white"
            : "hover:bg-[var(--card-border)] "
        }`}
        aria-label="System preference"
      >
        <Monitor size={18} />
      </button>
    </div>
  );
}
