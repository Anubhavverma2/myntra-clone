import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import "react-native-reanimated";
import React from "react";

import { AuthProvider } from "@/context/AuthContext";
import { BagProvider } from "@/context/BagContext";
import { ThemeProvider, useAppTheme } from "@/context/ThemeContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { setupNotificationListeners } from "@/utils/notifications";

SplashScreen.preventAutoHideAsync();

function AppStack() {
  const { isDark, colors } = useAppTheme();

  useEffect(() => {
    return setupNotificationListeners();
  }, []);

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <View style={[styles.appStage, { backgroundColor: colors.appFrameBackground }]}>
        <View style={[styles.mobileFrame, { backgroundColor: colors.background }]}>
          <AuthProvider>
            <WishlistProvider>
              <BagProvider>
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
                  <Stack.Screen name="index" options={{ animation: "none" }} />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="category/[id]" />
                  <Stack.Screen name="product/[id]" />
                  <Stack.Screen name="checkout" />
                  <Stack.Screen name="orders" />
                  <Stack.Screen name="transactions" />
                  <Stack.Screen name="settings" />
                </Stack>
                <StatusBar style={isDark ? "light" : "dark"} />
              </BagProvider>
            </WishlistProvider>
          </AuthProvider>
        </View>
      </View>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider>
      <AppStack />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  appStage: {
    flex: 1,
    alignItems: Platform.OS === "web" ? "center" : "stretch",
  },
  mobileFrame: {
    flex: 1,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 430 : undefined,
    overflow: "hidden",
  },
});
