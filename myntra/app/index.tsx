import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import MyntraSplash from "@/components/MyntraSplash";
import { getUserData } from "@/utils/storage";

export default function SplashScreen() {
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      let isLoggedIn = false;
      try {
        const session = await getUserData();
        isLoggedIn = !!(session._id && session.name && session.email);
      } catch (error) {
        console.log("Splash session check failed:", error);
      }

      if (isLoggedIn) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return <MyntraSplash durationMs={2500} />;
}
