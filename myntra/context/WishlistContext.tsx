import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

type WishlistContextType = {
  wishlistIds: Set<string>;
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
  loading: boolean;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
    if (!user?._id) {
      setWishlistIds(new Set());
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/wishlist/${user._id}`);
      const ids = new Set<string>(
        res.data.map((item: any) => item.productId?._id || item.productId).filter(Boolean)
      );
      setWishlistIds(ids);
    } catch (error) {
      console.log(error);
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
    async (productId: string) => {
      if (!user?._id) return false;
      try {
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
