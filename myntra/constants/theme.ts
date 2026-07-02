export type ThemeName = "light" | "dark" | "myntra";

export type ThemeColors = {
  primary: string;
  primaryLight: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  successBg: string;
  error: string;
  overlay: string;
  inputBg: string;
  tabActive: string;
  tabInactive: string;
};

const shared = {
  primary: "#ff3f6c",
  primaryLight: "#fff4f4",
  success: "#00b852",
  successBg: "#e6f4ea",
  error: "#ff3f6c",
};

export const themes: Record<ThemeName, ThemeColors> = {
  light: {
    ...shared,
    background: "#ffffff",
    surface: "#ffffff",
    card: "#ffffff",
    text: "#3e3e3e",
    textSecondary: "#666666",
    textMuted: "#94969f",
    border: "#f0f0f0",
    overlay: "rgba(0,0,0,0.4)",
    inputBg: "#f5f5f5",
    tabActive: "#ff3f6c",
    tabInactive: "#3e3e3e",
  },
  dark: {
    ...shared,
    background: "#121212",
    surface: "#1e1e1e",
    card: "#2a2a2a",
    text: "#f5f5f5",
    textSecondary: "#b0b0b0",
    textMuted: "#888888",
    border: "#333333",
    overlay: "rgba(0,0,0,0.6)",
    inputBg: "#2a2a2a",
    tabActive: "#ff3f6c",
    tabInactive: "#b0b0b0",
  },
  myntra: {
    ...shared,
    background: "#fafafa",
    surface: "#ffffff",
    card: "#ffffff",
    text: "#282c3f",
    textSecondary: "#535766",
    textMuted: "#94969f",
    border: "#eaeaec",
    overlay: "rgba(40,44,63,0.5)",
    inputBg: "#f5f5f6",
    tabActive: "#ff3f6c",
    tabInactive: "#696e79",
  },
};

export const THEME_STORAGE_KEY = "myntra_theme_preference";
