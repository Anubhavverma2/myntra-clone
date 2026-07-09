import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "@/utils/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(userId: string) {
  if (Platform.OS === "web") return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenData.data;

    await api.post("/notifications/register-token", {
      userId,
      token,
      platform: Platform.OS,
    });

    return token;
  } catch (error) {
    console.log("Push registration failed:", error);
    return null;
  }
}

export async function scheduleCartAbandonmentReminder(userId: string) {
  try {
    await api.post("/notifications/schedule/cart-abandonment", { userId });
  } catch (error) {
    console.log("Cart abandonment schedule failed:", error);
  }
}

export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  if (Platform.OS === "web") {
    return () => {};
  }

  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    onNotificationReceived?.(notification);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    onNotificationResponse?.(response);
  });

  if (typeof Notifications.getLastNotificationResponseAsync === "function") {
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) onNotificationResponse?.(response);
      })
      .catch((error) => console.log("Last notification response unavailable:", error));
  }

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
