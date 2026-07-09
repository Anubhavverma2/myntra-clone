import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Moon, Sun, Palette } from "lucide-react-native";
import { useAppTheme } from "@/context/ThemeContext";

const themeIcons = {
  palette: Palette,
  sun: Sun,
  moon: Moon,
};

export default function Settings() {
  const router = useRouter();
  const { colors, themeName, options, setTheme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>APPEARANCE</Text>
        <Text style={styles.sectionDesc}>
          Theme is saved automatically. Dark mode meets accessibility contrast standards.
        </Text>

        {options.map((option) => {
          const Icon = themeIcons[option.icon];
          const active = themeName === option.name;
          return (
            <TouchableOpacity
              key={option.name}
              style={[styles.themeOption, active && styles.themeOptionActive]}
              onPress={() => setTheme(option.name)}
            >
              <Icon size={22} color={active ? colors.primary : colors.text} />
              <View style={styles.themeCopy}>
                <Text style={[styles.themeLabel, active && { color: colors.primary }]}>
                  {option.label}
                </Text>
                <Text style={styles.themeDescription}>{option.description}</Text>
              </View>
              {active && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 15,
      paddingTop: 50,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: colors.text },
    content: { padding: 20 },
    sectionTitle: { fontSize: 14, fontWeight: "bold", color: colors.text, letterSpacing: 0.5, marginBottom: 8 },
    sectionDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: 20, lineHeight: 20 },
    themeOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginBottom: 10,
      gap: 12,
    },
    themeOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    themeCopy: { flex: 1 },
    themeLabel: { fontSize: 16, color: colors.text },
    themeDescription: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
    activeDot: { width: 10, height: 10, borderRadius: 5 },
  });
