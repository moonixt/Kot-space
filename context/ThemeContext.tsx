"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Theme =
  | "green"
  | "light"
  | "purple"
  | "yellow"
  | "dark"
  | "red"
  | "blue"
  | "grey"
  | "system";

interface ThemeContextType {
  theme: Theme | undefined;
  setTheme: (theme: Theme) => void;
  resolvedTheme:
    | "green"
    | "light"
    | "purple"
    | "yellow"
    | "dark"
    | "red"
    | "blue"
    | "grey";
  isClient: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with undefined to avoid hydration issues
  const [theme, setThemeState] = useState<Theme | undefined>(undefined);
  const [resolvedTheme, setResolvedTheme] = useState<
    "green" | "light" | "purple" | "yellow" | "dark" | "red" | "blue" | "grey"
  >("green");
  const [isClient, setIsClient] = useState(false);

  // Custom setTheme function that also updates localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (isClient) {
      try {
        localStorage.setItem("theme", newTheme);
      } catch (error) {
        console.warn("Failed to save theme to localStorage:", error);
      }
    }
  };

  // Mark when we're on the client and load theme
  useEffect(() => {
    setIsClient(true);
    
    // Load theme from localStorage only on client side
    try {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      const validThemes: Theme[] = ["green", "light", "purple", "yellow", "dark", "red", "blue", "grey", "system"];
      
      if (savedTheme && validThemes.includes(savedTheme)) {
        setThemeState(savedTheme);
      } else {
        // Set default theme if no saved theme
        setThemeState("system");
      }
    } catch (error) {
      // Fallback if localStorage is not available
      console.warn("localStorage not available, using default theme");
      setThemeState("system");
    }
  }, []);

  useEffect(() => {
    // Only execute if we're on client and theme is defined
    if (!isClient || theme === undefined) return;

    // Determine resolved theme based on user choice
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      setResolvedTheme(systemTheme);

      // Apply class to html element
      document.documentElement.classList.remove(
        "light",
        "green",
        "purple",
        "yellow",
        "dark",
        "red",
        "blue",
        "grey",
      );
      document.documentElement.classList.add(systemTheme);
    } else {
      setResolvedTheme(theme);

      // Apply class to html element
      document.documentElement.classList.remove(
        "light",
        "green",
        "purple",
        "yellow",
        "dark",
        "red",
        "blue",
        "grey",
      );
      document.documentElement.classList.add(theme);
    }
  }, [theme, isClient]);

  // Listen to system preference changes
  useEffect(() => {
    if (!isClient || theme === undefined) return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        const newTheme = mediaQuery.matches ? "dark" : "light";
        setResolvedTheme(newTheme);
        document.documentElement.classList.remove(
          "light",
          "green",
          "purple",
          "yellow",
          "dark",
          "red",
          "blue",
          "grey",
        );
        document.documentElement.classList.add(newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, isClient]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, isClient }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
