"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggle}
      className="grid place-items-center w-10 h-10 rounded-bc-md bg-bc-surface border border-bc-border text-bc-text-soft hover:text-bc-primary hover:border-bc-primary/40 hover:-translate-y-0.5 hover:shadow-bc-md transition-all duration-300 ease-bc-ease"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
