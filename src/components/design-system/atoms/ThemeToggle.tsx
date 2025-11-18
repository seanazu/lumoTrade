"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/lib/zustand/themeStore";
import { Button } from "./Button";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Apply theme to document
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export { ThemeToggle };

