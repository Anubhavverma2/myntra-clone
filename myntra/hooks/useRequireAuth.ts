import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export function useRequireAuth() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const requireAuth = (action?: string, onAuthed?: () => void) => {
    if (user && isAuthenticated) {
      onAuthed?.();
      return true;
    }

    Alert.alert(
      "Login Required",
      action
        ? `Please login to ${action}.`
        : "Please login to continue.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/login") },
      ]
    );
    return false;
  };

  return { requireAuth, isLoggedIn: !!user && isAuthenticated };
}
