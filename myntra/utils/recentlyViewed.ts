import { api } from "@/utils/api";
import {
  addLocalRecentlyViewed,
  getLocalRecentlyViewed,
  LocalRecentlyViewed,
} from "@/utils/storage";

export async function trackProductView(productId: string, userId?: string) {
  await addLocalRecentlyViewed(productId);

  if (userId) {
    try {
      await api.post("/recently-viewed", { userId, productId });
    } catch (error) {
      console.log("Server recently viewed sync failed:", error);
    }
  }
}

export async function mergeRecentlyViewedOnLogin(userId: string) {
  const localItems: LocalRecentlyViewed[] = await getLocalRecentlyViewed();
  if (localItems.length === 0) {
    try {
      const res = await api.get(`/recently-viewed/${userId}`);
      return res.data;
    } catch {
      return [];
    }
  }

  try {
    const res = await api.post("/recently-viewed/merge", {
      userId,
      localItems,
    });
    return res.data;
  } catch (error) {
    console.log("Merge recently viewed failed:", error);
    return localItems;
  }
}

export async function getRecentlyViewed(userId?: string) {
  if (userId) {
    try {
      const res = await api.get(`/recently-viewed/${userId}`);
      return res.data;
    } catch {
      return [];
    }
  }
  const local = await getLocalRecentlyViewed();
  return local.map((item) => ({ productId: item.productId, viewedAt: item.viewedAt }));
}
