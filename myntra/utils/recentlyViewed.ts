import { api } from "@/utils/api";
import {
  addLocalRecentlyViewed,
  getLocalRecentlyViewed,
  LocalRecentlyViewed,
  saveLocalRecentlyViewed,
} from "@/utils/storage";

const toLocalItems = (items: any[]): LocalRecentlyViewed[] =>
  items
    .map((item) => ({
      productId: item.productId?._id || item.productId,
      viewedAt: item.viewedAt || new Date().toISOString(),
    }))
    .filter((item) => item.productId)
    .slice(0, 20);

const isServerId = (id: string) => /^[a-f\d]{24}$/i.test(id);

export async function trackProductView(productId: string, userId?: string) {
  await addLocalRecentlyViewed(productId);

  if (userId && isServerId(productId)) {
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
      await saveLocalRecentlyViewed(toLocalItems(res.data));
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
    await saveLocalRecentlyViewed(toLocalItems(res.data));
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
      await saveLocalRecentlyViewed(toLocalItems(res.data));
      return res.data;
    } catch (error) {
      console.log("Server recently viewed fetch failed:", error);
    }
  }
  const local = await getLocalRecentlyViewed();
  return local.map((item) => ({ productId: item.productId, viewedAt: item.viewedAt }));
}
