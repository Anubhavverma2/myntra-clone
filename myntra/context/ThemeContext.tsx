import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { getItem, setItem } from "@/utils/storage";
import { THEME_STORAGE_KEY, ThemeColors, ThemeName, themes } from "@/constants/theme";

type ThemeContextType = {
  themeName: ThemeName;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (name: ThemeName) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [themeName, setThemeName] = useState<ThemeName>("myntra");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await getItem(THEME_STORAGE_KEY);
      if (saved === "light" || saved === "dark" || saved === "myntra") {
        setThemeName(saved);
      } else if (systemScheme === "dark") {
        setThemeName("dark");
      } else {
        setThemeName("myntra");
      }
      setReady(true);
    })();
  }, [systemScheme]);

  const setTheme = async (name: ThemeName) => {
    setThemeName(name);
    await setItem(THEME_STORAGE_KEY, name);
  };

  const toggleDarkMode = async () => {
    const next = themeName === "dark" ? "myntra" : "dark";
    await setTheme(next);
  };

  const value = useMemo(
    () => ({
      themeName,
      colors: themes[themeName],
      isDark: themeName === "dark",
      setTheme,
      toggleDarkMode,
    }),
    [themeName]
  );

  if (!ready) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within ThemeProvider");
  return ctx;
}
