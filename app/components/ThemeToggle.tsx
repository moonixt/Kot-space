"use client";
// NEED REVIEW

import { useTheme } from "../../context/ThemeContext";
import { Sun, Monitor, Shell, Rabbit, Moon, Leaf } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2 p-2 rounded-lg bg-[var(--background)] border border-slate-500/30">
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-md transition-colors ${
          theme === "light"
            ? "bg-black text-white"
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
            ? "bg-white text-black"
            : "hover:bg-[var(--card-border)] "
        }`}
        aria-label="Dark mode"
      >
        <Moon size={18} />
      </button>

      <button
        onClick={() => setTheme("purple")}
        className={`p-2 rounded-md transition-colors ${
          theme === "purple"
            ? "bg-purple-500 text-white"
            : "hover:bg-[var(--card-border)] "
        }`}
        aria-label="Purple mode"
      >
        <Shell size={18} />
      </button>
      <button
        onClick={() => setTheme("green")}
        className={`p-2 rounded-md transition-colors ${
          theme === "green"
            ? "bg-green-500 text-white"
            : "hover:bg-[var(--card-border)] "
        }`}
        aria-label="green mode"
      >
        <Leaf size={18} />
      </button>

      <button
        onClick={() => setTheme("yellow")}
        className={`p-2 rounded-md transition-colors ${
          theme === "yellow"
            ? "bg-yellow-300 text-white"
            : "hover:bg-[var(--card-border)] "
        }`}
        aria-label="Yellow mode"
      >
        <Rabbit size={18} />
      </button>

      <button
        onClick={() => setTheme("system")}
        className={`p-2 rounded-md transition-colors ${
          theme === "system"
            ? "bg-white text-black"
            : "hover:bg-[var(--card-border)] "
        }`}
        aria-label="System preference"
      >
        <Monitor size={18} />
      </button>
    </div>
  );
}
