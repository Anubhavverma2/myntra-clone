import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import {
  getLocalWishlist,
  LocalProductSnapshot,
  toggleLocalWishlist,
} from "@/utils/storage";

type WishlistContextType = {
  wishlistIds: Set<string>;
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: string | LocalProductSnapshot) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
  loading: boolean;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const isServerProductId = (productId: string) => /^[a-f\d]{24}$/i.test(productId);

  const refreshWishlist = useCallback(async () => {
    const localItems = await getLocalWishlist();
    const localIds = localItems.map((item) => item.productId?._id).filter(Boolean);

    if (!user?._id) {
      setWishlistIds(new Set(localIds));
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/wishlist/${user._id}`);
      const serverIds = res.data.map((item: any) => item.productId?._id || item.productId).filter(Boolean);
      const ids = new Set<string>([...serverIds, ...localIds]);
      setWishlistIds(ids);
    } catch (error) {
      console.log(error);
      setWishlistIds(new Set(localIds));
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.has(productId),
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    async (product: string | LocalProductSnapshot) => {
      const productId = typeof product === "string" ? product : product._id;
      try {
        if (!user?._id || !isServerProductId(productId)) {
          if (typeof product === "string") return false;
          const inWishlist = await toggleLocalWishlist(product);
          setWishlistIds((prev) => {
            const next = new Set(prev);
            if (inWishlist) next.add(productId);
            else next.delete(productId);
            return next;
          });
          return inWishlist;
        }

        const res = await api.post("/wishlist/toggle", {
          userId: user._id,
          productId,
        });
        setWishlistIds((prev) => {
          const next = new Set(prev);
          if (res.data.inWishlist) next.add(productId);
          else next.delete(productId);
          return next;
        });
        return res.data.inWishlist;
      } catch (error) {
        console.log(error);
        return isInWishlist(productId);
      }
    },
    [user?._id, isInWishlist]
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistCount: wishlistIds.size,
        isInWishlist,
        toggleWishlist,
        refreshWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
