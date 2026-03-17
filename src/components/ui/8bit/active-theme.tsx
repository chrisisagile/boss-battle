import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { RetroTheme } from "./themes";
import { DEFAULT_RETRO_THEME, isRetroTheme, retroThemeOptions } from "./themes";

const STORAGE_KEY = "boss-battle-theme";

interface ActiveThemeContextValue {
  activeTheme: RetroTheme;
  setActiveTheme: (theme: RetroTheme) => void;
}

const ActiveThemeContext = createContext<ActiveThemeContextValue | null>(null);

function getStoredTheme() {
  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  return storedTheme && isRetroTheme(storedTheme)
    ? storedTheme
    : DEFAULT_RETRO_THEME;
}

export function ActiveThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeTheme, setActiveTheme] =
    useState<RetroTheme>(DEFAULT_RETRO_THEME);

  useEffect(() => {
    setActiveTheme(getStoredTheme());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, activeTheme);

    const themeClasses = retroThemeOptions.map(
      (themeOption) => `theme-${themeOption.value}`,
    );

    for (const target of [document.documentElement, document.body]) {
      target.classList.remove(...themeClasses);
      target.classList.add(`theme-${activeTheme}`);
    }
  }, [activeTheme]);

  const contextValue = useMemo(
    () => ({
      activeTheme,
      setActiveTheme,
    }),
    [activeTheme],
  );

  return (
    <ActiveThemeContext.Provider value={contextValue}>
      {children}
    </ActiveThemeContext.Provider>
  );
}

export function useActiveTheme() {
  const context = useContext(ActiveThemeContext);
  if (!context) {
    throw new Error("useActiveTheme must be used within ActiveThemeProvider.");
  }

  return context;
}
