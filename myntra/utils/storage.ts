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
export const LOCAL_WISHLIST_KEY = "myntra_local_wishlist";
export const LOCAL_BAG_KEY = "myntra_local_bag";
export const LOCAL_ORDERS_KEY_PREFIX = "myntra_local_orders";

export const clearLocalShoppingData = async () => {
  await deleteItemAsync(LOCAL_WISHLIST_KEY);
  await deleteItemAsync(LOCAL_BAG_KEY);
};

export type LocalRecentlyViewed = {
  productId: string;
  viewedAt: string;
};

export type LocalProductSnapshot = {
  _id: string;
  name: string;
  brand: string;
  price: number;
  discount?: string;
  images: string[];
  sizes?: string[];
  stock?: number;
  isActive?: boolean;
  isDiscontinued?: boolean;
};

export type LocalBagItem = {
  _id: string;
  productId: LocalProductSnapshot;
  size: string;
  quantity: number;
  section: "active";
  version: number;
};

export type LocalOrder = {
  _id: string;
  date: string;
  status: string;
  items: Array<{
    _id: string;
    productId: LocalProductSnapshot;
    size: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  shippingAddress: string;
  paymentMethod: string;
  tracking: {
    number: string;
    carrier: string;
    estimatedDelivery: string;
    currentLocation: string;
    status: string;
    timeline: Array<{ status: string; location: string; timestamp: string }>;
  };
};

const parseJsonArray = <T>(raw: string | null): T[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const snapshotProduct = (product: LocalProductSnapshot): LocalProductSnapshot => ({
  _id: product._id,
  name: product.name,
  brand: product.brand,
  price: Number(product.price) || 0,
  discount: product.discount || "",
  images: Array.isArray(product.images) ? product.images : [],
  sizes: Array.isArray(product.sizes) ? product.sizes : [],
  stock: Number.isFinite(Number(product.stock)) ? Number(product.stock) : 100,
  isActive: product.isActive !== false,
  isDiscontinued: product.isDiscontinued === true,
});

export const getLocalRecentlyViewed = async (): Promise<LocalRecentlyViewed[]> => {
  const raw = await getItemAsync(RECENTLY_VIEWED_KEY);
  return parseJsonArray<LocalRecentlyViewed>(raw);
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

export const getLocalWishlist = async () => {
  const raw = await getItemAsync(LOCAL_WISHLIST_KEY);
  return parseJsonArray<{ _id: string; productId: LocalProductSnapshot }>(raw);
};

export const toggleLocalWishlist = async (product: LocalProductSnapshot) => {
  const items = await getLocalWishlist();
  const exists = items.some((item) => item.productId._id === product._id);
  const next = exists
    ? items.filter((item) => item.productId._id !== product._id)
    : [{ _id: `local-wishlist-${product._id}`, productId: snapshotProduct(product) }, ...items];

  await setItemAsync(LOCAL_WISHLIST_KEY, JSON.stringify(next));
  return !exists;
};

export const removeLocalWishlistItem = async (itemId: string) => {
  const items = await getLocalWishlist();
  const next = items.filter((item) => item._id !== itemId && item.productId._id !== itemId);
  await setItemAsync(LOCAL_WISHLIST_KEY, JSON.stringify(next));
  return next;
};

export const getLocalBagItems = async (): Promise<LocalBagItem[]> => {
  const raw = await getItemAsync(LOCAL_BAG_KEY);
  return parseJsonArray<LocalBagItem>(raw);
};

export const saveLocalBagItems = async (items: LocalBagItem[]) => {
  await setItemAsync(LOCAL_BAG_KEY, JSON.stringify(items));
};

export const addLocalBagItem = async (
  product: LocalProductSnapshot,
  size = "Free Size",
  quantity = 1
) => {
  const items = await getLocalBagItems();
  const existing = items.find((item) => item.productId._id === product._id && item.size === size);

  if (existing) {
    existing.quantity += quantity;
    existing.version += 1;
  } else {
    items.unshift({
      _id: `local-bag-${product._id}-${size}`,
      productId: snapshotProduct(product),
      size,
      quantity,
      section: "active",
      version: 0,
    });
  }

  await saveLocalBagItems(items);
  return items;
};

export const updateLocalBagQuantity = async (itemId: string, quantity: number) => {
  const items = await getLocalBagItems();
  const next = items.map((item) =>
    item._id === itemId ? { ...item, quantity, version: item.version + 1 } : item
  );
  await saveLocalBagItems(next);
  return next;
};

export const removeLocalBagItem = async (itemId: string) => {
  const items = await getLocalBagItems();
  const next = items.filter((item) => item._id !== itemId);
  await saveLocalBagItems(next);
  return next;
};

const localOrdersKey = (userId: string) => `${LOCAL_ORDERS_KEY_PREFIX}_${userId}`;

export const getLocalOrders = async (userId: string): Promise<LocalOrder[]> => {
  const raw = await getItemAsync(localOrdersKey(userId));
  return parseJsonArray<LocalOrder>(raw);
};

export const saveLocalOrder = async (
  userId: string,
  items: LocalBagItem[],
  total: number,
  shippingAddress: string,
  paymentMethod = "UPI"
) => {
  const now = new Date().toISOString();
  const order: LocalOrder = {
    _id: `LOCAL-ORDER-${Date.now()}`,
    date: now,
    status: "Delivered",
    items: items.map((item) => ({
      _id: `local-order-item-${item.productId._id}-${item.size}`,
      productId: snapshotProduct(item.productId),
      size: item.size,
      price: Number(item.productId.price) || 0,
      quantity: item.quantity,
    })),
    total,
    shippingAddress,
    paymentMethod,
    tracking: {
      number: `TRK${Date.now()}`,
      carrier: "Demo Delivery",
      estimatedDelivery: now,
      currentLocation: "Delivered",
      status: "Delivered",
      timeline: [
        { status: "Order Confirmed", location: "Online", timestamp: now },
        { status: "Delivered", location: "Customer Address", timestamp: now },
      ],
    },
  };
  const existing = await getLocalOrders(userId);
  const next = [order, ...existing].slice(0, 50);
  await setItemAsync(localOrdersKey(userId), JSON.stringify(next));
  return order;
};
