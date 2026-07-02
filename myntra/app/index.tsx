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

      const session = await getUserData();
      const isLoggedIn = !!(session._id && session.name && session.email);

      if (isLoggedIn) {
        router.replace("/(tabs)/index");
      } else {
        router.replace("/login");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return <MyntraSplash durationMs={2500} />;
}
