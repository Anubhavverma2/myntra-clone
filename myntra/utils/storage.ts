import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const isWeb = Platform.OS === "web";
const secureStoreAvailable =
  SecureStore &&
  typeof SecureStore.getItemAsync === "function" &&
  typeof SecureStore.setItemAsync === "function" &&
  typeof SecureStore.deleteItemAsync === "function";

const setItemAsync = async (key: string, value: string) => {
  if (isWeb || !secureStoreAvailable) {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
      return;
    }
    throw new Error("No storage available");
  }
  return SecureStore.setItemAsync(key, value);
};

const getItemAsync = async (key: string) => {
  if (isWeb || !secureStoreAvailable) {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(key);
    }
    return null;
  }
  return SecureStore.getItemAsync(key);
};

const deleteItemAsync = async (key: string) => {
  if (isWeb || !secureStoreAvailable) {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
      return;
    }
    return;
  }
  return SecureStore.deleteItemAsync(key);
};

export const saveUserData = async (_id: string, name: string, email: string) => {
  await setItemAsync("userid", _id);
  await setItemAsync("userName", name);
  await setItemAsync("userEmail", email);
};

export const getUserData = async () => {
  const _id = await getItemAsync("userid");
  const name = await getItemAsync("userName");
  const email = await getItemAsync("userEmail");
  return { _id, name, email };
};

export const clearUserData = async () => {
  await deleteItemAsync("userid");
  await deleteItemAsync("userName");
  await deleteItemAsync("userEmail");
};

export const setItem = setItemAsync;
export const getItem = getItemAsync;
export const removeItem = deleteItemAsync;

export const RECENTLY_VIEWED_KEY = "myntra_recently_viewed_local";

export type LocalRecentlyViewed = {
  productId: string;
  viewedAt: string;
};

export const getLocalRecentlyViewed = async (): Promise<LocalRecentlyViewed[]> => {
  const raw = await getItemAsync(RECENTLY_VIEWED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveLocalRecentlyViewed = async (items: LocalRecentlyViewed[]) => {
  const capped = items
    .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
    .slice(0, 20);
  await setItemAsync(RECENTLY_VIEWED_KEY, JSON.stringify(capped));
};

export const addLocalRecentlyViewed = async (productId: string) => {
  const items = await getLocalRecentlyViewed();
  const filtered = items.filter((i) => i.productId !== productId);
  filtered.unshift({ productId, viewedAt: new Date().toISOString() });
  await saveLocalRecentlyViewed(filtered);
  return filtered.slice(0, 20);
};
