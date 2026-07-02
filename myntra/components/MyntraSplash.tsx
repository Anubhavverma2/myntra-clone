import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

type MyntraSplashProps = {
  onFinish?: () => void;
  durationMs?: number;
};

/** Full-screen white splash with centered Myntra logo — matches official app style. */
export default function MyntraSplash({ onFinish, durationMs = 2500 }: MyntraSplashProps) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 7, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => onFinish?.(), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, logoOpacity, logoScale, onFinish]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Image
          source={require("@/assets/images/myntra.jpg")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 160,
    height: 160,
  },
});
