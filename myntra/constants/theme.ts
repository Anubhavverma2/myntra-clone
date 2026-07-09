export type ThemeName = "light" | "dark" | "myntra";

export type ThemeColors = {
  primary: string;
  primaryLight: string;
  onPrimary: string;
  background: string;
  appFrameBackground: string;
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
  shadow: string;
  tabActive: string;
  tabInactive: string;
};

export type ThemeDefinition = {
  label: string;
  description: string;
  icon: "palette" | "sun" | "moon";
  dark: boolean;
  colors: ThemeColors;
};

const shared = {
  primary: "#ff3f6c",
  primaryLight: "#fff4f4",
  onPrimary: "#ffffff",
  success: "#00b852",
  successBg: "#e6f4ea",
  error: "#ff3f6c",
};

export const themeDefinitions: Record<ThemeName, ThemeDefinition> = {
  light: {
    label: "Classic Light",
    description: "Clean high-contrast light mode.",
    icon: "sun",
    dark: false,
    colors: {
      ...shared,
      background: "#ffffff",
      appFrameBackground: "#ececf1",
      surface: "#ffffff",
      card: "#ffffff",
      text: "#3e3e3e",
      textSecondary: "#666666",
      textMuted: "#696e79",
      border: "#d4d5d9",
      overlay: "rgba(0,0,0,0.4)",
      inputBg: "#f5f5f5",
      shadow: "#000000",
      tabActive: "#ff3f6c",
      tabInactive: "#3e3e3e",
    },
  },
  dark: {
    label: "Dark Mode",
    description: "Reduced glare with readable contrast.",
    icon: "moon",
    dark: true,
    colors: {
      ...shared,
      primaryLight: "#3a1f2a",
      background: "#121212",
      appFrameBackground: "#050505",
      surface: "#1e1e1e",
      card: "#242424",
      text: "#f5f5f5",
      textSecondary: "#c7c7c7",
      textMuted: "#a6a6a6",
      border: "#3a3a3a",
      overlay: "rgba(0,0,0,0.6)",
      inputBg: "#2a2a2a",
      shadow: "#000000",
      tabActive: "#ff3f6c",
      tabInactive: "#c7c7c7",
    },
  },
  myntra: {
    label: "Myntra Light",
    description: "Default shopping theme with Myntra accent.",
    icon: "palette",
    dark: false,
    colors: {
      ...shared,
      background: "#fafafa",
      appFrameBackground: "#ececf1",
      surface: "#ffffff",
      card: "#ffffff",
      text: "#282c3f",
      textSecondary: "#535766",
      textMuted: "#696e79",
      border: "#d4d5d9",
      overlay: "rgba(40,44,63,0.5)",
      inputBg: "#f5f5f6",
      shadow: "#000000",
      tabActive: "#ff3f6c",
      tabInactive: "#696e79",
    },
  },
};

export const themes = Object.fromEntries(
  Object.entries(themeDefinitions).map(([name, definition]) => [name, definition.colors])
) as Record<ThemeName, ThemeColors>;

export const themeOptions = Object.entries(themeDefinitions).map(([name, definition]) => ({
  name: name as ThemeName,
  label: definition.label,
  description: definition.description,
  icon: definition.icon,
}));

export const isThemeName = (value: unknown): value is ThemeName =>
  typeof value === "string" && value in themeDefinitions;

export const THEME_STORAGE_KEY = "myntra_theme_preference";
