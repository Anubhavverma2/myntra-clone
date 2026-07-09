import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  isThemeName,
  THEME_STORAGE_KEY,
  ThemeColors,
  ThemeName,
  themeDefinitions,
  themeOptions,
  themes,
} from "@/constants/theme";

type ThemeContextType = {
  themeName: ThemeName;
  colors: ThemeColors;
  isDark: boolean;
  options: typeof themeOptions;
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
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (isThemeName(saved)) {
          setThemeName(saved);
        } else if (systemScheme === "dark") {
          setThemeName("dark");
        } else {
          setThemeName("myntra");
        }
      } catch (error) {
        console.log("Theme restore failed:", error);
        setThemeName("myntra");
      } finally {
        setReady(true);
      }
    })();
  }, [systemScheme]);

  const setTheme = async (name: ThemeName) => {
    setThemeName(name);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, name);
  };

  const toggleDarkMode = async () => {
    const next = themeName === "dark" ? "myntra" : "dark";
    await setTheme(next);
  };

  const value = useMemo(
    () => ({
      themeName,
      colors: themes[themeName],
      isDark: themeDefinitions[themeName].dark,
      options: themeOptions,
      setTheme,
      toggleDarkMode,
    }),
    [themeName]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within ThemeProvider");
  return ctx;
}
