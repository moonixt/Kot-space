"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "green" | "light" | "purple" | "yellow" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "green" | "light" | "purple" | "yellow" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Inicializar com a preferência salva ou "system"
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<
    "green" | "light" | "purple" | "yellow" | "dark"
  >("green");

  useEffect(() => {
    // Carregar tema das preferências do usuário
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Salvar tema nas preferências do usuário
    if (theme) {
      localStorage.setItem("theme", theme);
    }

    // Determinar o tema resolvido com base na escolha do usuário
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      setResolvedTheme(systemTheme);

      // Adicionar a classe ao elemento html
      document.documentElement.classList.remove(
        "light",
        "green",
        "purple",
        "yellow",
        "dark",
      );
      document.documentElement.classList.add(systemTheme);
    } else {
      setResolvedTheme(theme);

      // Adicionar a classe ao elemento html
      document.documentElement.classList.remove(
        "light",
        "green",
        "purple",
        "yellow",
        "dark",
      );
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  // Ouvir alterações nas preferências do sistema
  useEffect(() => {
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
        );
        document.documentElement.classList.add(newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
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
