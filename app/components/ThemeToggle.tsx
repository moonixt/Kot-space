"use client";

import { useTheme, Theme } from "../../context/ThemeContext";
import {
  Sun,
  Monitor,
  Shell,
  Rabbit,
  Moon,
  Leaf,
  Heart,
  Droplet,
  Eclipse,
  Check,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "next-i18next";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  // Define todos os temas disponíveis com suas propriedades
  const themes = [
    {
      id: "light",
      name: t("theme.light", "Claro"),
      icon: <Sun size={16} />,
    },
    {
      id: "dark",
      name: t("theme.dark", "Escuro"),
      icon: <Moon size={16} />,
    },
    {
      id: "grey",
      name: t("theme.eclipse", "Eclipse"),
      icon: <Eclipse size={16} />,
      color: "#18191e"
    },
    {
      id: "blue",
      name: t("theme.blue", "Blue"),
      icon: <Droplet size={16} />,
      color: "#3b82f6"
    },
    {
      id: "purple",
      name: t("theme.purple", "Purple"),
      icon: <Shell size={16} />,
      color: "#8b5cf6"
    },
    {
      id: "green",
      name: t("theme.green", "Green"),
      icon: <Leaf size={16} />,
      color: "#22c55e"
    },
    {
      id: "red",
      name: t("theme.red", "Red"),
      icon: <Heart size={16} />,
      color: "#e11d48"
    },
    {
      id: "yellow",
      name: t("theme.yellow", "Yellow"),
      icon: <Rabbit size={16} />,
      color: "#eab308"
    },
    {
      id: "system",
      name: t("theme.system", "System"),
      icon: <Monitor size={16} />,
    }
  ];

  // Encontra o tema atual para mostrar no botão
  const currentTheme = themes.find(t => t.id === theme) || themes[0];

  return (
    <div className="flex justify-center">
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--card-bg)]  transition-colors border border-[var(--card-border)] outline-none">
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: currentTheme.color }}
          />
          <span className="flex items-center gap-2">
            {currentTheme.icon}
            <span className="text-sm font-medium">{currentTheme.name}</span>
          </span>
        </div>
        <ChevronDown size={16} />
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-48 bg-[var(--background)] border border-[var(--card-border)]">
        <DropdownMenuLabel className="text-[var(--foreground)] opacity-70">{t("theme.choose", "Escolha um tema")}</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[var(--card-border)]" />
        
        <div className="py-1">
          <DropdownMenuLabel className="text-xs text-[var(--foreground)] opacity-70 px-2">{t("theme.basic", "Básicos")}</DropdownMenuLabel>
          {themes.slice(0, 2).map((item) => (
            <DropdownMenuItem
              key={item.id}
              className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-[var(--button-bg)] rounded-sm text-[var(--foreground)] ${theme === item.id ? 'bg-[var(--button-bg1)] bg-opacity-50' : ''}`}
              onClick={() => setTheme(item.id as Theme)}
            >
              <div className="flex items-center gap-2 flex-1">
                <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: item.color }}>
                  {theme === item.id && <Check size={12} className="text-white" />}
                </div>
                <span className="flex items-center gap-2">
                  {item.icon}
                  <span className="text-sm">{item.name}</span>
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
        
        <DropdownMenuSeparator className="bg-[var(--card-border)]" />
        
        <div className="py-1">
          <DropdownMenuLabel className="text-xs text-[var(--foreground)] opacity-70 px-2">{t("theme.colors", "Cores")}</DropdownMenuLabel>
          {themes.slice(2, -1).map((item) => (
            <DropdownMenuItem
              key={item.id}
              className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-[var(--button-bg)] rounded-sm text-[var(--foreground)] ${theme === item.id ? 'bg-[var(--button-bg1)] bg-opacity-50' : ''}`}
              onClick={() => setTheme(item.id as Theme)}
            >
              <div className="flex items-center gap-2 flex-1">
                <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: item.color }}>
                  {theme === item.id && <Check size={12} className="text-white" />}
                </div>
                <span className="flex items-center gap-2">
                  {item.icon}
                  <span className="text-sm">{item.name}</span>
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
        
        <DropdownMenuSeparator className="bg-[var(--card-border)]" />
        
        <div className="py-1">
          <DropdownMenuItem
            className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-[var(--button-bg)] rounded-sm text-[var(--foreground)] ${theme === "system" ? 'bg-[var(--button-bg1)] bg-opacity-50' : ''}`}
            onClick={() => setTheme("system" as Theme)}
          >
            <div className="flex items-center gap-2 flex-1">
              <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: themes[8].color }}>
                {theme === "system" && <Check size={12} className="text-white" />}
              </div>
              <span className="flex items-center gap-2">
                <Monitor size={16} />
                <span className="text-sm">{t("theme.systemPreference","System Preference" )}</span>
              </span>
            </div>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
}
